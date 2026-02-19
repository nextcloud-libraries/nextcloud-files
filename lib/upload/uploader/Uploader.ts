/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFolder } from '../../node/folder.ts'
import type { IUpload } from './Upload.ts'
import type { ConflictsCallback } from './UploadFileTree.ts'

import { getCurrentUser } from '@nextcloud/auth'
import PQueue from 'p-queue'
import { TypedEventTarget } from 'typescript-event-target'
import { defaultRemoteURL, defaultRootPath } from '../../dav/dav.ts'
import { FileType, Folder } from '../../node/index.ts'
import { Permission } from '../../permissions.ts'
import logger from '../../utils/logger.ts'
import { getMaxChunksSize, getMaxParallelUploads } from '../utils/config.ts'
import { Directory } from '../utils/fileTree.ts'
import { Eta } from './Eta.ts'
import { UploadStatus } from './Upload.ts'
import { UploadFile } from './UploadFile.ts'
import { UploadFileTree } from './UploadFileTree.ts'

export const UploaderStatus = Object.freeze({
	IDLE: 0,
	UPLOADING: 1,
	PAUSED: 2,
})

type TUploaderStatus = typeof UploaderStatus[keyof typeof UploaderStatus]

interface BaseOptions {
	/**
	 * Abort signal to cancel the upload
	 */
	signal?: AbortSignal
}

interface UploadOptions extends BaseOptions {
	/**
	 * The root folder where to upload.
	 * Allows to override the current root of the uploader for this upload
	 */
	root?: string

	/**
	 * Number of retries for the upload
	 *
	 * @default 5
	 */
	retries?: number
}

interface BatchUploadOptions extends UploadOptions {
	callback?: ConflictsCallback
}

interface UploaderEventsMap {
	paused: CustomEvent
	resumed: CustomEvent
	progress: CustomEvent
	finished: CustomEvent
}

export class Uploader extends TypedEventTarget<UploaderEventsMap> {
	#eta = new Eta()
	#destinationFolder: IFolder
	#customHeaders: Map<string, string> = new Map()
	#status: TUploaderStatus = UploaderStatus.IDLE
	#uploadQueue: IUpload[] = []
	#jobQueue: PQueue = new PQueue({
		concurrency: getMaxParallelUploads(),
	})

	/**
	 * Initialize uploader
	 *
	 * @param isPublic are we in public mode ?
	 * @param destinationFolder the context folder to operate, relative to the root folder
	 */
	constructor(
		isPublic = false,
		destinationFolder?: IFolder,
	) {
		super()
		if (!destinationFolder) {
			const source = `${defaultRemoteURL}${defaultRootPath}`
			let owner: string

			if (isPublic) {
				owner = 'anonymous'
			} else {
				const user = getCurrentUser()?.uid
				if (!user) {
					throw new Error('User is not logged in')
				}
				owner = user
			}

			destinationFolder = new Folder({
				id: 0,
				owner,
				permissions: Permission.ALL,
				root: defaultRootPath,
				source,
			})
		}
		this.#destinationFolder = destinationFolder

		logger.debug('Upload workspace initialized', {
			root: this.#destinationFolder.source,
			isPublic,
			maxChunksSize: getMaxChunksSize(),
		})
	}

	public get status(): TUploaderStatus {
		return this.#status
	}

	/**
	 * Get the upload destination folder
	 */
	public get destination(): IFolder {
		return this.#destinationFolder
	}

	/**
	 * Set the upload destination path relative to the root folder
	 */
	public set destination(folder: IFolder) {
		if (!folder || folder.type !== FileType.Folder || !folder.source) {
			throw new Error('Invalid destination folder')
		}

		logger.debug('Destination set', { folder })
		this.#destinationFolder = folder
	}

	/**
	 * Get registered custom headers for uploads
	 */
	public get customHeaders(): Map<string, string> {
		return structuredClone(this.#customHeaders)
	}

	/**
	 * Set a custom header
	 *
	 * @param name The header to set
	 * @param value The string value
	 */
	public setCustomHeader(name: string, value: string = ''): void {
		this.#customHeaders.set(name, value)
	}

	/**
	 * Unset a custom header
	 *
	 * @param name The header to unset
	 */
	public deleteCustomerHeader(name: string): void {
		this.#customHeaders.delete(name)
	}

	/**
	 * Get the upload queue
	 */
	public get queue(): IUpload[] {
		return [...this.#uploadQueue]
	}

	/**
	 * Pause the uploader.
	 * Already started uploads will continue, but all other (not yet started) uploads
	 * will be paused until `start()` is called.
	 */
	public async pause() {
		this.#jobQueue.pause()
		this.#status = UploaderStatus.PAUSED
		await this.#jobQueue.onPendingZero()
		this.dispatchTypedEvent('paused', new CustomEvent('paused'))
		logger.debug('Uploader paused')
	}

	/**
	 * Resume any pending upload(s)
	 */
	public start() {
		this.#jobQueue.start()
		this.#status = UploaderStatus.UPLOADING
		this.dispatchTypedEvent('resumed', new CustomEvent('resumed'))
		logger.debug('Uploader resumed')
	}

	public reset() {
		for (const upload of this.#uploadQueue) {
			upload.cancel()
		}

		this.#uploadQueue = []
		this.#jobQueue.clear()
		this.#eta.reset()
		this.#status = UploaderStatus.IDLE
		logger.debug('Uploader reset')
	}

	/**
	 * Uploads multiple files or folders while preserving the relative path (if available)
	 *
	 * @param destination The destination path relative to the root folder. e.g. /foo/bar (a file "a.txt" will be uploaded then to "/foo/bar/a.txt")
	 * @param files The files and/or folders to upload
	 * @param options - optional parameters
	 * @param options.callback Callback that receives the nodes in the current folder and the current path to allow resolving conflicts, all nodes that are returned will be uploaded (if a folder does not exist it will be created)
	 * @throws {UploadCancelledError} - If the upload was canceled by the user via the abort signal
	 *
	 * @example
	 * ```ts
	 * // For example this is from handling the onchange event of an input[type=file]
	 * async handleFiles(files: File[]) {
	 *   this.uploads = await this.uploader.batchUpload('uploads', files, { callback: this.handleConflicts })
	 * }
	 *
	 * async handleConflicts(nodes: File[], currentPath: string) {
	 *   const conflicts = getConflicts(nodes, this.fetchContent(currentPath))
	 *   if (conflicts.length === 0) {
	 *     // No conflicts so upload all
	 *     return nodes
	 *   } else {
	 *     // Open the conflict picker to resolve conflicts
	 *     try {
	 *       const { selected, renamed } = await openConflictPicker(currentPath, conflicts, this.fetchContent(currentPath), { recursive: true })
	 *       return [...selected, ...renamed]
	 *     } catch (e) {
	 *       return false
	 *     }
	 *   }
	 * }
	 * ```
	 */
	public async batchUpload(
		destination: string,
		files: (File | FileSystemEntry)[],
		options?: BatchUploadOptions,
	): Promise<IUpload[]> {
		const rootFolder = new Directory('')
		await rootFolder.addChildren(files)
		// create a meta upload to ensure all ongoing child requests are listed
		const target = `${this.destination.source.replace(/\/$/, '')}/${destination.replace(/^\//, '')}`
		const headers = Object.fromEntries(this.#customHeaders.entries())
		const upload = new UploadFileTree(
			target,
			rootFolder,
			{ ...options, headers },
		)
		if (options?.signal) {
			options.signal.addEventListener('abort', upload.cancel)
		}

		const uploads = [...upload.initialize(), upload]
		for (const upload of uploads) {
			this.#attachEventListeners(upload)
		}
		this.#uploadQueue.push(...uploads)
		await upload.start(this.#jobQueue)
		return uploads
	}

	/**
	 * Upload a file to the given path
	 *
	 * @param destination - The destination path relative to the root folder. e.g. /foo/bar.txt
	 * @param fileHandle - The file to upload
	 * @param options - Optional parameters
	 */
	public async upload(destination: string, fileHandle: File | FileSystemFileEntry, options?: UploadOptions): Promise<IUpload> {
		const target = `${this.destination.source.replace(/\/$/, '')}/${destination.replace(/^\//, '')}`
		const headers = Object.fromEntries(this.#customHeaders.entries())
		const upload = new UploadFile(target, fileHandle, { ...options, headers })
		if (options?.signal) {
			options.signal.addEventListener('abort', upload.cancel)
		}

		this.#attachEventListeners(upload)
		this.#uploadQueue.push(upload)
		await upload.start(this.#jobQueue)
		return upload
	}

	/**
	 * Handle the progress event of an upload.
	 * Update the ETA and dispatch a progress event for the uploader.
	 */
	#onProgress() {
		const totalBytes = this.#uploadQueue.reduce((acc, upload) => acc + upload.totalBytes, 0)
		const uploadedBytes = this.#uploadQueue.reduce((acc, upload) => acc + upload.uploadedBytes, 0)
		this.#eta.update(uploadedBytes, totalBytes)
		this.dispatchTypedEvent('progress', new CustomEvent('progress'))
	}

	/**
	 * Handle the finished event of an upload.
	 *
	 * 1. Update the progress
	 * 2. if all uploads are finished dispatch a finished event for the uploader and clear the queue
	 */
	async #onFinished() {
		this.#onProgress()

		const finalStates = [
			UploadStatus.FINISHED,
			UploadStatus.CANCELLED,
			UploadStatus.FAILED,
		] as number[]
		if (this.#uploadQueue.every((upload) => finalStates.includes(upload.status))) {
			await this.#jobQueue.onIdle()
			this.dispatchTypedEvent('finished', new CustomEvent('finished'))
			this.reset()
		}
	}

	/**
	 * Attach progress listeners to an upload.
	 *
	 * @param upload - The upload to attach listeners to
	 */
	#attachEventListeners(upload: IUpload) {
		upload.addEventListener('progress', this.#onProgress)
		upload.addEventListener('finished', this.#onFinished)
	}
}
