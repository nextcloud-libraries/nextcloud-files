/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type PQueue from 'p-queue'
import type { IUpload, IUploadOptions, TUploadStatus } from './Upload.ts'

import axios from '@nextcloud/axios'
import { join } from '@nextcloud/paths'
import { isPublicShare } from '@nextcloud/sharing/public'
import { UploadCancelledError } from '../errors/UploadCancelledError.ts'
import { UploadFailedError } from '../errors/UploadFailedError.ts'
import { getMaxChunksSize, supportsPublicChunking } from '../utils/config.ts'
import { getMtimeHeader, isRequestAborted } from '../utils/requests.ts'
import { getChunk, initChunkWorkspace, uploadData } from '../utils/upload.ts'
import { encodeUrl } from '../utils/url.ts'
import { Upload, UploadStatus } from './Upload.ts'

/**
 * A class representing a single file to be uploaded
 */
export class UploadFile extends Upload implements IUpload {
	#fileHandle: File | FileSystemFileEntry
	#file?: File

	public source: string
	public status: TUploadStatus = UploadStatus.INITIALIZED
	public startTime?: number
	public totalBytes: number = 0
	public uploadedBytes: number = -1
	public numberOfChunks: number = 1

	constructor(
		destination: string,
		fileHandle: File | FileSystemFileEntry,
		options: Partial<IUploadOptions> = {},
	) {
		super(options)

		// exposed state
		this.source = destination
		this.totalBytes = 'size' in fileHandle ? fileHandle.size : -1

		// private state
		this.#fileHandle = fileHandle
		this.signal.addEventListener('abort', () => {
			if (this.status !== UploadStatus.FAILED) {
				this.status = UploadStatus.CANCELLED
			}
		})
	}

	get isChunked(): boolean {
		const maxChunkSize = getMaxChunksSize('size' in this.#fileHandle ? this.#fileHandle.size : undefined)
		return !this.options.noChunking
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
			await this.#uploadChunk(chunk, encodeUrl(this.source))
			// Update progress - now we set the uploaded size to 100% of the file size
			this.uploadedBytes = this.totalBytes
			this.status = UploadStatus.FINISHED
		} catch (error) {
			if (!(error instanceof UploadCancelledError)) {
				throw error
			}
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
		// The `Destination` header must be a URI, so the source has to be encoded here
		const destination = encodeUrl(this.source)
		const temporaryUrl = await initChunkWorkspace(destination, this.options.retries, isPublicShare(), this.options.headers)

		const promises: Promise<void>[] = []
		const chunkSize = Math.floor(this.totalBytes / this.numberOfChunks)
		for (let i = 0; i < this.numberOfChunks; i++) {
			const offsetStart = i * chunkSize
			const chunk = await getChunk(
				this.#file!,
				offsetStart,
				i === this.numberOfChunks - 1
					? (this.totalBytes - offsetStart) // last chunk = remaining bytes
					: chunkSize, // all other chunks = chunkSize
			)
			promises.push(queue.add(async () => {
				await this.#uploadChunk(chunk, join(temporaryUrl, String(i)))
			}))
		}
		this.status = UploadStatus.UPLOADING

		queue.add(async () => {
			try {
				await Promise.all(promises)
				// Send the assemble request
				this.status = UploadStatus.ASSEMBLING
				await axios.request({
					method: 'MOVE',
					url: `${temporaryUrl}/.file`,
					headers: {
						...this.options.headers,
						...getMtimeHeader(this.#file!),
						'OC-Total-Length': this.totalBytes,
						Destination: destination,
					},
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
		// Bytes of this chunk that are already accounted for in `this.uploadedBytes`.
		// This is tracked per chunk as other chunks might be uploaded in parallel.
		let accountedBytes = 0
		// Bytes of this chunk reported as sent by the current try
		let sentBytes = 0

		try {
			await uploadData(
				url,
				chunk,
				{
					signal: this.signal,
					retries: this.options.retries,
					onUploadProgress: ({ bytes }) => {
						sentBytes += bytes
						// As this is only the sent bytes not the processed ones we only count 90%.
						// When the chunk is uploaded (server acknowledged the upload) the remaining 10% will be correctly set.
						// Rounding keeps `uploadedBytes` an integer so the accounting stays exact.
						const accounted = Math.min(Math.round(sentBytes * 0.9), chunk.size)
						this.uploadedBytes += accounted - accountedBytes
						accountedBytes = accounted
						this.dispatchTypedEvent('progress', new CustomEvent('progress', { detail: this }))
					},
					onUploadRetry: () => {
						// Only discard the progress of this chunk, any other chunk is not affected by this retry
						this.uploadedBytes -= accountedBytes
						accountedBytes = 0
						sentBytes = 0
					},
					headers: {
						...this.options.headers,
						...getMtimeHeader(this.#file!),
						'Content-Type': this.#file!.type,
					},
				},
			)

			// The server acknowledged this chunk, so account the remaining 10% of it
			this.uploadedBytes += chunk.size - accountedBytes
			this.dispatchTypedEvent('progress', new CustomEvent('progress', { detail: this }))
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
