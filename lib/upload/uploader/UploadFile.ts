/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type PQueue from 'p-queue'
import type { IUpload, TUploadStatus } from './Upload.ts'

import axios from '@nextcloud/axios'
import { join } from '@nextcloud/paths'
import { isPublicShare } from '@nextcloud/sharing/public'
import { UploadCancelledError } from '../errors/UploadCancelledError.ts'
import { UploadFailedError } from '../errors/UploadFailedError.ts'
import { getMaxChunksSize, supportsPublicChunking } from '../utils/config.ts'
import { getMtimeHeader, isRequestAborted } from '../utils/requests.ts'
import { getChunk, initChunkWorkspace, uploadData } from '../utils/upload.ts'
import { Upload, UploadStatus } from './Upload.ts'

/**
 * A class representing a single file to be uploaded
 */
export class UploadFile extends Upload implements IUpload {
	#customHeaders: Record<string, string>
	#fileHandle: File | FileSystemFileEntry
	#file?: File
	#noChunking: boolean

	public source: string
	public status: TUploadStatus = UploadStatus.INITIALIZED
	public startTime?: number
	public totalBytes: number = 0
	public uploadedBytes: number = -1
	public numberOfChunks: number = 1

	constructor(
		destination: string,
		fileHandle: File | FileSystemFileEntry,
		options: { headers?: Record<string, string>, noChunking?: boolean },
	) {
		super()
		const {
			headers = {},
			noChunking = false,
		} = options

		// exposed state
		this.source = destination
		this.totalBytes = 'size' in fileHandle ? fileHandle.size : -1

		// private state
		this.#fileHandle = fileHandle
		this.#customHeaders = headers
		this.#noChunking = noChunking
		this.signal.addEventListener('abort', () => {
			if (this.status !== UploadStatus.FAILED) {
				this.status = UploadStatus.CANCELLED
			}
		})
	}

	get isChunked(): boolean {
		const maxChunkSize = getMaxChunksSize('size' in this.#fileHandle ? this.#fileHandle.size : undefined)
		return !this.#noChunking
			&& maxChunkSize > 0
			&& this.totalBytes > maxChunkSize
			&& (!isPublicShare() || supportsPublicChunking())
	}

	async start(queue: PQueue): Promise<void> {
		if (this.status !== UploadStatus.INITIALIZED) {
			throw new Error('Upload already started')
		}

		this.startTime = Date.now()
		this.#file = await getFile(this.#fileHandle)
		this.totalBytes = this.#file.size
		this.uploadedBytes = 0
		this.status = UploadStatus.SCHEDULED

		try {
			if (this.isChunked) {
				this.numberOfChunks = Math.ceil(this.totalBytes / getMaxChunksSize(this.totalBytes))
				await this.#uploadChunked(queue)
			} else {
				queue.add(() => this.#upload())
			}
		} catch (error) {
			this.cancel()
			if (error instanceof UploadCancelledError || error instanceof UploadFailedError) {
				throw error
			}
			this.status = UploadStatus.FAILED
			throw new UploadFailedError(error)
		}
	}

	/**
	 * Internal implementation of the upload process for non-chunked uploads.
	 */
	async #upload() {
		this.status = UploadStatus.UPLOADING
		const chunk = await getChunk(this.#file!, 0, this.#file!.size)
		try {
			await this.#uploadChunk(chunk, this.source)
		} finally {
			this.dispatchTypedEvent('finished', new CustomEvent('finished', { detail: this }))
		}
	}

	/**
	 * Internal implementation of the upload process for chunked uploads.
	 *
	 * @param queue - The job queue to throttle number of concurrent chunk uploads
	 */
	async #uploadChunked(queue: PQueue) {
		this.status = UploadStatus.UPLOADING
		const temporaryUrl = await initChunkWorkspace(this.source, 5, isPublicShare(), this.#customHeaders)

		const promises: Promise<void>[] = []
		for (let i = 0; i < this.numberOfChunks; i++) {
			const chunk = await getChunk(this.#file!, i * getMaxChunksSize(this.totalBytes), (i + 1) * getMaxChunksSize(this.totalBytes))
			promises.push(queue.add(() => this.#uploadChunk(chunk, join(temporaryUrl, String(i)))))
		}
		this.status = UploadStatus.UPLOADING

		queue.add(async () => {
			try {
				await Promise.all(promises)
				// Send the assemble request
				this.status = UploadStatus.ASSEMBLING
				await queue.add(async () => {
					await axios.request({
						method: 'MOVE',
						url: `${temporaryUrl}/.file`,
						headers: {
							...this.#customHeaders,
							...getMtimeHeader(this.#file!),
							'OC-Total-Length': this.#file!.size,
							Destination: this.source,
						},
					})
				})
				this.status = UploadStatus.FINISHED
			} catch (error) {
				this.cancel()
				if (isRequestAborted(error)) {
					this.status = UploadStatus.CANCELLED
					throw new UploadCancelledError(error)
				}
				this.status = UploadStatus.FAILED
				throw new UploadFailedError(error)
			} finally {
				this.dispatchTypedEvent('finished', new CustomEvent('finished', { detail: this }))
			}
		})
	}

	/**
	 * Internal helper to share logic for uploading a chunk of data for both chunked and non-chunked uploads.
	 *
	 * @param chunk - The chunk to upload
	 * @param url - The target URL
	 */
	async #uploadChunk(chunk: Blob, url: string) {
		try {
			await uploadData(
				url,
				chunk,
				{
					signal: this.signal,
					onUploadProgress: ({ bytes }) => {
						// As this is only the sent bytes not the processed ones we only count 90%.
						// When the upload is finished (server acknowledged the upload) the remaining 10% will be correctly set.
						this.uploadedBytes += bytes * 0.9
						this.dispatchTypedEvent('progress', new CustomEvent('progress', { detail: this }))
					},
					onUploadRetry: () => {
						this.uploadedBytes = 0
					},
					headers: {
						...this.#customHeaders,
						...getMtimeHeader(this.#file!),
						'Content-Type': this.#file!.type,
					},
				},
			)

			// Update progress - now we set the uploaded size to 100% of the file size
			this.uploadedBytes = this.totalBytes
			this.status = UploadStatus.FINISHED
		} catch (error) {
			if (isRequestAborted(error)) {
				this.status = UploadStatus.CANCELLED
				throw new UploadCancelledError(error)
			}

			this.status = UploadStatus.FAILED
			throw new UploadFailedError(error)
		}
	}
}

/**
 * Converts a FileSystemFileEntry to a File if needed and returns it.
 *
 * @param fileHandle - The file handle
 */
async function getFile(fileHandle: File | FileSystemFileEntry): Promise<File> {
	if (fileHandle instanceof File) {
		return fileHandle
	}

	return await new Promise((resolve, reject) => fileHandle.file(resolve, reject))
}
