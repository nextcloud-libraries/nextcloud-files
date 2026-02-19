/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type PQueue from 'p-queue'
import type { IUpload, TUploadStatus } from './Upload.ts'

import axios, { isAxiosError } from '@nextcloud/axios'
import { basename, join } from '@nextcloud/paths'
import { UploadCancelledError } from '../errors/UploadCancelledError.ts'
import { UploadFailedError } from '../errors/UploadFailedError.ts'
import { Directory as FileTree } from '../utils/fileTree.ts'
import { getMtimeHeader, isRequestAborted } from '../utils/requests.ts'
import { Upload, UploadStatus } from './Upload.ts'
import { UploadFile } from './UploadFile.ts'

/**
 * Callback type for conflict resolution when uploading a folder tree.
 *
 * The callback receives the nodes in the current folder and the current path to upload to,
 * it should return a list of nodes that should be uploaded (e.g. after resolving conflicts by renaming or selecting which files to upload).
 * In case the upload should be cancelled, it should return `false`.
 * The returned mapping allowes to resolve conflicts by renaming files or folders before upload,
 * the key is the original name of the node and the value is the name to upload it as.
 *
 * @param nodes - The nodes to upload (list of filenames)
 * @param currentPath - The current path to upload to
 * @return A promise that resolves to a list of nodes that should be uploaded or false if the upload should be cancelled
 */
export type ConflictsCallback = (nodes: string[], currentPath: string) => Promise<false | Record<string, string>>

/**
 * A class representing a single file to be uploaded
 */
export class UploadFileTree extends Upload implements IUpload {
	/** Customer headers passed */
	#customHeaders: Record<string, string>
	/** The current file tree to upload */
	#directory: FileTree
	/** Whether chunking is disabled */
	#noChunking: boolean
	/** Children uploads of this parent folder upload */
	#children: (Upload & IUpload)[] = []
	/** The callback to handle conflicts */
	#conflictsCallback?: ConflictsCallback

	/** Whether we need to check for conflicts or not (newly created parent folders = no conflict resolution needed) */
	protected needConflictResolution = true

	public source: string
	public status: TUploadStatus = UploadStatus.INITIALIZED
	public startTime?: number
	public totalBytes: number = 0
	public uploadedBytes: number = -1

	constructor(
		destination: string,
		directory: FileTree,
		options: {
			callback?: ConflictsCallback
			headers?: Record<string, string>
			noChunking?: boolean
		},
	) {
		super()
		const {
			headers = {},
			noChunking = false,
		} = options

		// exposed state
		this.source = destination
		this.#directory = directory
		this.#customHeaders = headers
		this.#noChunking = noChunking

		this.signal.addEventListener('abort', () => {
			for (const child of this.#children) {
				child.cancel()
			}
			if (this.status !== UploadStatus.FAILED) {
				this.status = UploadStatus.CANCELLED
			}
		})
	}

	get isChunked(): boolean {
		return false
	}

	/**
	 * Set up all child uploads for this upload tree.
	 */
	initialize(): (Upload & IUpload)[] {
		for (const child of this.#directory.children) {
			if (child instanceof FileTree) {
				const upload = new UploadFileTree(
					join(this.source, child.originalName),
					child,
					{
						callback: this.#conflictsCallback,
						headers: this.#customHeaders,
						noChunking: this.#noChunking,
					},
				)
				this.#children.push(upload, ...upload.initialize())
			} else {
				const upload = new UploadFile(
					join(this.source, child.name),
					child,
					{ headers: this.#customHeaders, noChunking: this.#noChunking },
				)
				this.#children.push(upload)
			}
		}
		return this.#children
	}

	async start(queue: PQueue): Promise<void> {
		if (this.status !== UploadStatus.INITIALIZED) {
			throw new Error('Upload already started')
		}
		this.status = UploadStatus.SCHEDULED
		this.startTime = Date.now()
		this.uploadedBytes = 0

		this.status = UploadStatus.UPLOADING
		await this.#createDirectory(queue)
		if (this.needConflictResolution && this.#conflictsCallback) {
			const nodes = await this.#conflictsCallback(
				this.#directory.children.map((node) => basename(node.name)),
				this.source,
			)
			if (nodes === false) {
				this.cancel()
				return
			}

			for (const [originalName, newName] of Object.entries(nodes)) {
				const upload = this.#children.find((child) => basename(child.source) === originalName)
				if (upload) {
					Object.defineProperty(upload, 'source', { value: join(this.source, newName) })
				}
			}
		}

		const uploads: Promise<void>[] = []
		for (const upload of this.#children) {
			uploads.push(upload.start(queue))
			// for folder tree uploads store the conflict resolution state to prevent useless requests
			if (upload instanceof UploadFileTree) {
				upload.needConflictResolution = this.needConflictResolution
			}
		}

		try {
			await Promise.all(uploads)
			this.status = UploadStatus.FINISHED
		} catch (error) {
			this.cancel()
			if (isRequestAborted(error)) {
				this.status = UploadStatus.CANCELLED
				throw new UploadCancelledError(error)
			} else if (error instanceof UploadCancelledError) {
				this.status = UploadStatus.CANCELLED
				throw error
			} else if (error instanceof UploadFailedError) {
				this.status = UploadStatus.FAILED
				throw error
			}
		} finally {
			this.dispatchTypedEvent('finished', new CustomEvent('finished', { detail: this }))
		}
	}

	/**
	 * Helper to create the directory for this tree.
	 *
	 * @param queue - The job queue
	 */
	async #createDirectory(queue: PQueue): Promise<void> {
		await queue.add(async () => {
			try {
				await axios.request({
					method: 'MKCOL',
					url: this.source,
					headers: {
						...this.#customHeaders,
						...getMtimeHeader(this.#directory),
					},
					signal: this.signal,
				})
				// MKCOL worked so this is a new directory, no conflict resolution needed
				this.needConflictResolution = false
			} catch (error) {
				// ignore 405 Method Not Allowed as it means the directory already exists and we can continue with uploading the children
				if (isAxiosError(error) && error.response?.status === 405) {
					this.needConflictResolution = true
					return
				}
				throw error
			}
		})
	}
}
