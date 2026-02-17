/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AxiosError, AxiosResponse } from 'axios'
import type { WebDAVClient } from 'webdav'
import type { IDirectory } from '../utils/fileTree.ts'

import { getCurrentUser } from '@nextcloud/auth'
import axios, { isCancel } from '@nextcloud/axios'
import { getCapabilities } from '@nextcloud/capabilities'
import { davGetClient, davRemoteURL, davRootPath, FileType, Folder, Permission } from '@nextcloud/files'
import { encodePath } from '@nextcloud/paths'
import PCancelable from 'p-cancelable'
import PQueue from 'p-queue'
import { normalize } from 'path'
import logger from '../../utils/logger.ts'
import { UploadCancelledError } from '../errors/UploadCancelledError.ts'
import { getMaxChunksSize } from '../utils/config.ts'
import { isFileSystemFileEntry } from '../utils/filesystem.ts'
import { Directory } from '../utils/fileTree.ts'
import { t } from '../utils/l10n.ts'
import { getChunk, initChunkWorkspace, uploadData } from '../utils/upload.ts'
import { Eta } from './Eta.ts'
import { Upload, Status as UploadStatus } from './Upload.ts'

export enum UploaderStatus {
	IDLE = 0,
	UPLOADING = 1,
	PAUSED = 2,
}

export class Uploader {
	// Initialized via setter in the constructor
	private _destinationFolder!: Folder
	private _isPublic: boolean
	private _customHeaders: Record<string, string>

	// Global upload queue
	private _uploadQueue: Array<Upload> = []
	private _jobQueue: PQueue = new PQueue({
		// Maximum number of concurrent uploads
		// @ts-expect-error TS2339 Object has no defined properties
		concurrency: getCapabilities().files?.chunked_upload?.max_parallel_count ?? 5,
	})

	private _queueSize = 0
	private _queueProgress = 0
	private _queueStatus: UploaderStatus = UploaderStatus.IDLE

	private _eta = new Eta()

	private _notifiers: Array<(upload: Upload) => void> = []

	/**
	 * Initialize uploader
	 *
	 * @param isPublic are we in public mode ?
	 * @param destinationFolder the context folder to operate, relative to the root folder
	 */
	constructor(
		isPublic = false,
		destinationFolder?: Folder,
	) {
		this._isPublic = isPublic
		this._customHeaders = {}

		if (!destinationFolder) {
			const source = `${davRemoteURL}${davRootPath}`
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
				root: davRootPath,
				source,
			})
		}
		this.destination = destinationFolder

		logger.debug('Upload workspace initialized', {
			destination: this.destination,
			root: this.root,
			isPublic,
			maxChunksSize: getMaxChunksSize(),
		})
	}

	/**
	 * Get the upload destination path relative to the root folder
	 */
	get destination(): Folder {
		return this._destinationFolder
	}

	/**
	 * Set the upload destination path relative to the root folder
	 */
	set destination(folder: Folder) {
		if (!folder || folder.type !== FileType.Folder || !folder.source) {
			throw new Error('Invalid destination folder')
		}

		logger.debug('Destination set', { folder })
		this._destinationFolder = folder
	}

	/**
	 * Get the root folder
	 */
	get root() {
		return this._destinationFolder.source
	}

	/**
	 * Get registered custom headers for uploads
	 */
	get customHeaders(): Record<string, string> {
		return structuredClone(this._customHeaders)
	}

	/**
	 * Set a custom header
	 *
	 * @param name The header to set
	 * @param value The string value
	 */
	setCustomHeader(name: string, value: string = ''): void {
		this._customHeaders[name] = value
	}

	/**
	 * Unset a custom header
	 *
	 * @param name The header to unset
	 */
	deleteCustomerHeader(name: string): void {
		delete this._customHeaders[name]
	}

	/**
	 * Get the upload queue
	 */
	get queue(): Upload[] {
		return this._uploadQueue
	}

	private reset() {
		// Reset the ETA
		this._eta.reset()
		// If there is no upload in the queue and no job in the queue
		if (this._uploadQueue.length === 0 && this._jobQueue.size === 0) {
			return
		}

		// Reset upload queue but keep the reference
		this._uploadQueue.splice(0, this._uploadQueue.length)
		this._jobQueue.clear()
		this._queueSize = 0
		this._queueProgress = 0
		this._queueStatus = UploaderStatus.IDLE
		logger.debug('Uploader state reset')
	}

	/**
	 * Pause any ongoing upload(s)
	 */
	public pause() {
		this._eta.pause()
		this._jobQueue.pause()
		this._queueStatus = UploaderStatus.PAUSED
		this.updateStats()
		logger.debug('Uploader paused')
	}

	/**
	 * Resume any pending upload(s)
	 */
	public start() {
		this._eta.resume()
		this._jobQueue.start()
		this._queueStatus = UploaderStatus.UPLOADING
		this.updateStats()
		logger.debug('Uploader resumed')
	}

	/**
	 * Get the estimation for the uploading time.
	 */
	get eta(): Eta {
		return this._eta
	}

	/**
	 * Get the upload queue stats
	 */
	get info() {
		return {
			size: this._queueSize,
			progress: this._queueProgress,
			status: this._queueStatus,
		}
	}

	private updateStats() {
		const size = this._uploadQueue.map((upload) => upload.size)
			.reduce((partialSum, a) => partialSum + a, 0)
		const uploaded = this._uploadQueue.map((upload) => upload.uploaded)
			.reduce((partialSum, a) => partialSum + a, 0)

		this._eta.update(uploaded, size)
		this._queueSize = size
		this._queueProgress = uploaded

		// If already paused keep it that way
		if (this._queueStatus !== UploaderStatus.PAUSED) {
			const pending = this._uploadQueue.find(({ status }) => [UploadStatus.INITIALIZED, UploadStatus.UPLOADING, UploadStatus.ASSEMBLING].includes(status))
			if (this._jobQueue.size > 0 || pending) {
				this._queueStatus = UploaderStatus.UPLOADING
			} else {
				this.eta.reset()
				this._queueStatus = UploaderStatus.IDLE
			}
		}
	}

	addNotifier(notifier: (upload: Upload) => void) {
		this._notifiers.push(notifier)
	}

	/**
	 * Notify listeners of the upload completion
	 *
	 * @param upload The upload that finished
	 */
	private _notifyAll(upload: Upload): void {
		for (const notifier of this._notifiers) {
			try {
				notifier(upload)
			} catch (error) {
				logger.warn('Error in upload notifier', { error, source: upload.source })
			}
		}
	}

	/**
	 * Uploads multiple files or folders while preserving the relative path (if available)
	 *
	 * @param destination The destination path relative to the root folder. e.g. /foo/bar (a file "a.txt" will be uploaded then to "/foo/bar/a.txt")
	 * @param files The files and/or folders to upload
	 * @param callback Callback that receives the nodes in the current folder and the current path to allow resolving conflicts, all nodes that are returned will be uploaded (if a folder does not exist it will be created)
	 * @return Cancelable promise that resolves to an array of uploads
	 *
	 * @example
	 * ```ts
	 * // For example this is from handling the onchange event of an input[type=file]
	 * async handleFiles(files: File[]) {
	 *   this.uploads = await this.uploader.batchUpload('uploads', files, this.handleConflicts)
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
	batchUpload(
		destination: string,
		files: (File | FileSystemEntry)[],
		callback?: (nodes: Array<File | IDirectory>, currentPath: string) => Promise<Array<File | IDirectory> | false>,
	): PCancelable<Upload[]> {
		if (!callback) {
			callback = async (files: Array<File | Directory>) => files
		}

		return new PCancelable(async (resolve, reject, onCancel) => {
			const rootFolder = new Directory('')
			await rootFolder.addChildren(files)
			// create a meta upload to ensure all ongoing child requests are listed
			const target = `${this.root.replace(/\/$/, '')}/${destination.replace(/^\//, '')}`
			const upload = new Upload(target, false, 0, rootFolder)
			upload.status = UploadStatus.UPLOADING
			this._uploadQueue.push(upload)

			logger.debug('Starting new batch upload', { target })
			try {
				// setup client with root and custom header
				const client = davGetClient(this.root, this._customHeaders)
				// Create the promise for the virtual root directory
				const promise = this.uploadDirectory(destination, rootFolder, callback, client)
				// Make sure to cancel it when requested
				onCancel(() => promise.cancel())
				// await the uploads and resolve with "finished" status
				const uploads = await promise
				upload.status = UploadStatus.FINISHED
				resolve(uploads)
			} catch (error) {
				if (isCancel(error) || error instanceof UploadCancelledError) {
					logger.info('Upload cancelled by user', { error })
					upload.status = UploadStatus.CANCELLED
					reject(new UploadCancelledError(error))
				} else {
					logger.error('Error in batch upload', { error })
					upload.status = UploadStatus.FAILED
					reject(error)
				}
			} finally {
				// Upload queue is cleared when all the uploading jobs are done
				// Meta upload unlike real uploading does not create a job
				// Removing it manually here to make sure it is remove even when no uploading happened and there was nothing to finish
				this._uploadQueue.splice(this._uploadQueue.indexOf(upload), 1)
				this._notifyAll(upload)
				this.updateStats()
			}
		})
	}

	/**
	 * Helper to create a directory wrapped inside an Upload class
	 *
	 * @param destination Destination where to create the directory
	 * @param directory The directory to create
	 * @param client The cached WebDAV client
	 */
	private createDirectory(destination: string, directory: Directory, client: WebDAVClient): PCancelable<Upload> {
		const folderPath = normalize(`${destination}/${directory.name}`).replace(/\/$/, '')
		const rootPath = `${this.root.replace(/\/$/, '')}/${folderPath.replace(/^\//, '')}`

		if (!directory.name) {
			throw new Error('Can not create empty directory')
		}

		// Add a new upload to the upload queue
		const currentUpload: Upload = new Upload(rootPath, false, 0, directory)
		this._uploadQueue.push(currentUpload)

		// Return the cancelable promise
		return new PCancelable(async (resolve, reject, onCancel) => {
			const abort = new AbortController()
			onCancel(() => abort.abort())
			currentUpload.signal.addEventListener('abort', () => reject(t('Upload has been cancelled')))

			// Add the request to the job queue -> wait for finish to resolve the promise
			await this._jobQueue.add(async () => {
				currentUpload.status = UploadStatus.UPLOADING
				try {
					await client.createDirectory(folderPath, { signal: abort.signal })
					resolve(currentUpload)
				} catch (error) {
					if (isCancel(error) || error instanceof UploadCancelledError) {
						currentUpload.status = UploadStatus.CANCELLED
						reject(new UploadCancelledError(error))
					} else if (error && typeof error === 'object' && 'status' in error && error.status === 405) {
						// Directory already exists, so just write into it and ignore the error
						logger.debug('Directory already exists, writing into it', { directory: directory.name })
						currentUpload.status = UploadStatus.FINISHED
						resolve(currentUpload)
					} else {
						// Another error happened, so abort uploading the directory
						currentUpload.status = UploadStatus.FAILED
						reject(error)
					}
				} finally {
					// Update statistics
					this._notifyAll(currentUpload)
					this.updateStats()
				}
			})
		})
	}

	// Helper for uploading directories (recursively)
	private uploadDirectory(
		destination: string,
		directory: Directory,
		callback: (nodes: Array<File | Directory>, currentPath: string) => Promise<Array<File | Directory> | false>,
		// client as parameter to cache it for performance
		client: WebDAVClient,
	): PCancelable<Upload[]> {
		const folderPath = normalize(`${destination}/${directory.name}`).replace(/\/$/, '')

		return new PCancelable(async (resolve, reject, onCancel) => {
			const abort = new AbortController()
			onCancel(() => abort.abort())

			// Let the user handle conflicts
			const selectedForUpload = await callback(directory.children, folderPath)
			if (selectedForUpload === false) {
				logger.debug('Upload canceled by user', { directory })
				reject(new UploadCancelledError('Conflict resolution cancelled by user'))
				return
			} else if (selectedForUpload.length === 0 && directory.children.length > 0) {
				logger.debug('Skipping directory, as all files were skipped by user', { directory })
				resolve([])
				return
			}

			const directories: PCancelable<Upload[]>[] = []
			const uploads: PCancelable<Upload>[] = []
			// Setup abort controller to cancel all child requests
			abort.signal.addEventListener('abort', () => {
				directories.forEach((upload) => upload.cancel())
				uploads.forEach((upload) => upload.cancel())
			})

			logger.debug('Start directory upload', { directory })
			try {
				if (directory.name) {
					// If not the virtual root we need to create the directory first before uploading
					// Make sure the promise is listed in the final result
					uploads.push(this.createDirectory(destination, directory, client) as PCancelable<Upload>)
					// Ensure the directory is created before uploading / creating children
					await uploads.at(-1)
				}

				for (const node of selectedForUpload) {
					if (node instanceof Directory) {
						directories.push(this.uploadDirectory(folderPath, node, callback, client))
					} else {
						uploads.push(this.upload(`${folderPath}/${node.name}`, node))
					}
				}

				const resolvedUploads = await Promise.all(uploads)
				const resolvedDirectoryUploads = await Promise.all(directories)
				resolve([resolvedUploads, ...resolvedDirectoryUploads].flat())
			} catch (e) {
				// Ensure a failure cancels all other requests
				abort.abort(e)
				reject(e)
			}
		})
	}

	/**
	 * Upload a file to the given path
	 *
	 * @param destination the destination path relative to the root folder. e.g. /foo/bar.txt
	 * @param fileHandle the file to upload
	 * @param root the root folder to upload to
	 * @param retries number of retries
	 */
	upload(destination: string, fileHandle: File | FileSystemFileEntry, root?: string, retries: number = 5): PCancelable<Upload> {
		root = root || this.root
		const destinationPath = `${root.replace(/\/$/, '')}/${destination.replace(/^\//, '')}`

		// Get the encoded source url to this object for requests purposes
		const { origin } = new URL(destinationPath)
		const encodedDestinationFile = origin + encodePath(destinationPath.slice(origin.length))

		this.eta.resume()
		logger.debug(`Uploading ${fileHandle.name} to ${encodedDestinationFile}`)

		const promise = new PCancelable(async (resolve, reject, onCancel): Promise<Upload> => {
			// Handle file system entries by retrieving the file handle
			if (isFileSystemFileEntry(fileHandle)) {
				fileHandle = await new Promise((resolve) => (fileHandle as FileSystemFileEntry).file(resolve, reject))
			}
			// We can cast here as we handled system entries in the if above
			const file = fileHandle as File

			// @ts-expect-error TS2339 Object has no defined properties
			const supportsPublicChunking = getCapabilities().dav?.public_shares_chunking ?? false
			const maxChunkSize = getMaxChunksSize('size' in file ? file.size : undefined)
			// If manually disabled or if the file is too small
			const disabledChunkUpload = (this._isPublic && !supportsPublicChunking)
				|| maxChunkSize === 0
				|| ('size' in file && file.size < maxChunkSize)

			const upload = new Upload(destinationPath, !disabledChunkUpload, file.size, file)
			this._uploadQueue.push(upload)
			this.updateStats()

			// Register cancellation caller
			onCancel(upload.cancel)

			if (!disabledChunkUpload) {
				logger.debug('Initializing chunked upload', { file, upload })

				// Let's initialize a chunk upload
				const tempUrl = await initChunkWorkspace(encodedDestinationFile, retries, this._isPublic, this._customHeaders)
				const chunksQueue: Array<Promise<void>> = []

				// Generate chunks array
				for (let chunk = 0; chunk < upload.chunks; chunk++) {
					const bufferStart = chunk * maxChunkSize
					// Don't go further than the file size
					const bufferEnd = Math.min(bufferStart + maxChunkSize, upload.size)
					// Make it a Promise function for better memory management
					const blob = () => getChunk(file, bufferStart, maxChunkSize)

					// Init request queue
					const request = () => {
						// bytes uploaded on this chunk (as upload.uploaded tracks all chunks)
						let chunkBytes = 0
						return uploadData(
							`${tempUrl}/${chunk + 1}`,
							blob,
							{
								signal: upload.signal,
								destinationFile: encodedDestinationFile,
								retries,
								onUploadProgress: ({ bytes }) => {
									// Only count 90% of bytes as the request is not yet processed by server
									// we set the remaining 10% when the request finished (server responded).
									const progressBytes = bytes * 0.9
									chunkBytes += progressBytes
									upload.uploaded += progressBytes
									this.updateStats()
								},
								onUploadRetry: () => {
									// Current try failed, so reset the stats for this chunk
									// meaning remove the uploaded chunk bytes from stats
									upload.uploaded -= chunkBytes
									chunkBytes = 0
									this.updateStats()
								},
								headers: {
									...this._customHeaders,
									...this._mtimeHeader(file),
									'OC-Total-Length': file.size,
									'Content-Type': 'application/octet-stream',
								},
							},
						)
							// Update upload progress on chunk completion
							.then(() => {
								// request fully done so we uploaded the full chunk
								// we first remove the intermediate chunkBytes from progress events
								// and then add the real full size
								upload.uploaded += bufferEnd - bufferStart - chunkBytes
								this.updateStats()
							})
							.catch((error) => {
								if (error?.response?.status === 507) {
									logger.error('Upload failed, not enough space on the server or quota exceeded. Cancelling the remaining chunks', { error, upload })
									upload.cancel()
									upload.status = UploadStatus.FAILED
									throw error
								}

								if (!isCancel(error)) {
									logger.error(`Chunk ${chunk + 1} ${bufferStart} - ${bufferEnd} uploading failed`, { error, upload })
									upload.cancel()
									upload.status = UploadStatus.FAILED
								}
								throw error
							})
					}
					chunksQueue.push(this._jobQueue.add(request))
				}

				const request = async () => {
					try {
						// Once all chunks are sent, assemble the final file
						await Promise.all(chunksQueue)

						// Assemble the chunks
						upload.status = UploadStatus.ASSEMBLING
						this.updateStats()

						// Send the assemble request
						upload.response = await axios.request({
							method: 'MOVE',
							url: `${tempUrl}/.file`,
							headers: {
								...this._customHeaders,
								...this._mtimeHeader(file),
								'OC-Total-Length': file.size,
								Destination: encodedDestinationFile,
							},
						})
						upload.status = UploadStatus.FINISHED
						this.updateStats()

						logger.debug(`Successfully uploaded ${file.name}`, { file, upload })
						resolve(upload)
					} catch (error) {
						if (isCancel(error) || error instanceof UploadCancelledError) {
							upload.status = UploadStatus.CANCELLED
							reject(new UploadCancelledError(error))
						} else {
							upload.status = UploadStatus.FAILED
							reject(t('Failed to assemble the chunks together'))
						}
						// Cleaning up temp directory
						axios.request({
							method: 'DELETE',
							url: `${tempUrl}`,
						})
					} finally {
						// Notify listeners of the upload completion
						this._notifyAll(upload)
					}
				}

				this._jobQueue.add(request)
			} else {
				logger.debug('Initializing regular upload', { file, upload })

				// Generating upload limit
				const blob = await getChunk(file, 0, upload.size)
				const request = async () => {
					try {
						upload.response = await uploadData(
							encodedDestinationFile,
							blob,
							{
								signal: upload.signal,
								onUploadProgress: ({ bytes }) => {
									// As this is only the sent bytes not the processed ones we only count 90%.
									// When the upload is finished (server acknowledged the upload) the remaining 10% will be correctly set.
									upload.uploaded += bytes * 0.9
									this.updateStats()
								},
								onUploadRetry: () => {
									upload.uploaded = 0
									this.updateStats()
								},
								headers: {
									...this._customHeaders,
									...this._mtimeHeader(file),
									'Content-Type': file.type,
								},
							},
						)

						// Update progress - now we set the uploaded size to 100% of the file size
						upload.uploaded = upload.size
						this.updateStats()

						// Resolve
						logger.debug(`Successfully uploaded ${file.name}`, { file, upload })
						resolve(upload)
					} catch (error) {
						if (isCancel(error) || error instanceof UploadCancelledError) {
							upload.status = UploadStatus.CANCELLED
							reject(new UploadCancelledError(error))
							return
						}

						// Attach response to the upload object
						if ((error as AxiosError)?.response) {
							upload.response = (error as AxiosError).response as AxiosResponse
						}

						upload.status = UploadStatus.FAILED
						logger.error(`Failed uploading ${file.name}`, { error, file, upload })
						reject(t('Failed to upload the file'))
					}

					// Notify listeners of the upload completion
					this._notifyAll(upload)
				}
				this._jobQueue.add(request)
				this.updateStats()
			}

			// Reset when upload queue is done
			// Only when we know we're closing on the last chunks
			// and/or assembling we can reset the uploader.
			// Otherwise he queue might be idle for a short time
			// and clear the Upload queue before we're done.
			this._jobQueue.onIdle()
				.then(() => this.reset())

			// Finally return the Upload
			return upload
		}) as PCancelable<Upload>

		return promise
	}

	/**
	 * Create modification time headers if valid value is available.
	 * It can be invalid on Android devices if SD cards with NTFS / FAT are used,
	 * as those files might use the NT epoch for time so the value will be negative.
	 *
	 * @param file The file to upload
	 */
	private _mtimeHeader(file: File): { 'X-OC-Mtime'?: number } {
		const mtime = Math.floor(file.lastModified / 1000)
		if (mtime > 0) {
			return { 'X-OC-Mtime': mtime }
		}
		return {}
	}
}
