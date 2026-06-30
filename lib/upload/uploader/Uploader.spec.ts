/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IUpload, TUploadStatus } from './Upload.ts'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Folder } from '../../node/folder.ts'
import { UploadStatus } from './Upload.ts'
import { Uploader, UploaderStatus } from './Uploader.ts'

// Mock auth to provide a current user by default
const authMock = vi.hoisted(() => ({
	getCurrentUser: vi.fn<() => ({ uid: string }) | null>(() => ({ uid: 'tester' })),
}))
vi.mock('@nextcloud/auth', () => authMock)

vi.mock('../../dav/dav.ts', () => ({
	defaultRemoteURL: 'https://localhost/remote.php/dav',
	defaultRootPath: '/files/test',
}))

vi.mock('../../utils/logger.ts', () => ({ default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

// Provide simple mocks for UploadFile and UploadFileTree so we can deterministically
// simulate progress/finished events and exercise uploader logic.
vi.mock('./UploadFile.ts', () => ({
	UploadFile: class implements IUpload {
		source = 'file:///test'
		isChunked = false
		totalBytes: number
		uploadedBytes: number
		status: TUploadStatus
		response: any
		signal = new AbortController().signal
		children: IUpload[] = []
		private listeners: Record<string, ((ev?: CustomEvent) => void)[]>
		constructor(..._args: any[]) {
			const file = _args[1]
			this.listeners = {}
			this.totalBytes = (file && file.size) || 0
			this.uploadedBytes = 0
			this.status = UploadStatus.INITIALIZED
			this.response = undefined
		}

		addEventListener = ((ev: string, cb: (ev?: CustomEvent) => void) => {
			this.listeners[ev] = this.listeners[ev] || []
			this.listeners[ev].push(cb)
		}) as any

		removeEventListener() {}
		dispatchEvent = (() => true) as any
		dispatchTypedEvent = (() => true) as any
		cancel = vi.fn(() => {
			if (this.status !== UploadStatus.FINISHED) {
				this.status = UploadStatus.CANCELLED
			}
		})

		start = async () => {
			// simulate progress then finish
			this.uploadedBytes = this.totalBytes / 2
			this.listeners.progress?.forEach((cb) => cb(new CustomEvent('progress', { detail: this })))
			this.uploadedBytes = this.totalBytes
			this.status = UploadStatus.FINISHED
			this.response = { status: 201 }
			this.listeners.finished?.forEach((cb) => cb(new CustomEvent('finished', { detail: this })))
		}
	},
}))

// Capture the arguments the Uploader passes to UploadFileTree so we can assert
// on the (wrapped) conflicts callback.
const uploadFileTreeMock = vi.hoisted(() => ({
	instances: [] as Array<{ destination: string, options: Record<string, any> }>,
}))

vi.mock('./UploadFileTree.ts', () => ({
	UploadFileTree: class implements IUpload {
		source = 'file:///test'
		isChunked = false
		totalBytes = 0
		uploadedBytes = 0
		status: TUploadStatus = UploadStatus.FINISHED as TUploadStatus
		response = { status: 201 }
		signal = new AbortController().signal
		children: IUpload[] = []
		private listeners: Record<string, ((ev?: CustomEvent) => void)[]> = {}
		constructor(destination: string, _directory: unknown, options: Record<string, any> = {}) {
			uploadFileTreeMock.instances.push({ destination, options })
		}

		addEventListener = ((ev: string, cb: (ev?: CustomEvent) => void) => {
			this.listeners[ev] = this.listeners[ev] || []
			this.listeners[ev].push(cb)
		}) as any

		removeEventListener = (() => {}) as any
		dispatchEvent = (() => true) as any
		dispatchTypedEvent = (() => true) as any
		cancel = vi.fn(() => {
			if (this.status !== UploadStatus.FINISHED) {
				this.status = UploadStatus.CANCELLED as TUploadStatus
			}
		})

		initialize = () => []
		start = async () => {
			this.listeners.finished?.forEach((cb) => cb(new CustomEvent('finished', { detail: this })))
		}
	},
}))

describe('Uploader (current API)', () => {
	beforeEach(() => {
		authMock.getCurrentUser.mockReturnValue({ uid: 'tester' })
		uploadFileTreeMock.instances.length = 0
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('constructs with default destination and exposes status/destination', () => {
		const uploader = new Uploader()
		expect(uploader.status).toBe(UploaderStatus.IDLE)
		expect(uploader.destination).toBeInstanceOf(Folder)
	})

	it('throws when no user and not public', () => {
		authMock.getCurrentUser.mockReturnValue(null)
		expect(() => new Uploader(false)).toThrow()
	})

	it('allows public mode with anonymous owner', () => {
		authMock.getCurrentUser.mockReturnValue(null)
		const uploader = new Uploader(true)
		expect(uploader.destination.owner).toBe('anonymous')
	})

	it('manages custom headers and exposes a cloned map', () => {
		const uploader = new Uploader()
		uploader.setCustomHeader('X-Test', '1')
		const headers = uploader.customHeaders
		expect(headers.get('X-Test')).toBe('1')
		uploader.deleteCustomerHeader('X-Test')
		expect(uploader.customHeaders.get('X-Test')).toBeUndefined()
	})

	it('can pause, start and reset', async () => {
		const uploader = new Uploader()
		const paused = new Promise<void>((res) => uploader.addEventListener('paused', () => res()))
		const resumed = new Promise<void>((res) => uploader.addEventListener('resumed', () => res()))

		await uploader.pause()
		expect(uploader.status).toBe(UploaderStatus.PAUSED)
		await paused

		uploader.start()
		expect(uploader.status).toBe(UploaderStatus.UPLOADING)
		await resumed

		// reset should clear queue and set IDLE
		uploader.reset()
		expect(uploader.status).toBe(UploaderStatus.IDLE)
		expect(uploader.queue).toEqual([])
	})

	it('uploads a file and emits progress and finished events', async () => {
		const uploader = new Uploader()
		const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

		const started = vi.fn()
		const progress = vi.fn()
		const finished = vi.fn()

		uploader.addEventListener('uploadStarted', () => started())
		uploader.addEventListener('uploadProgress', () => progress())
		uploader.addEventListener('uploadFinished', () => finished())

		const upload = await uploader.upload('/hello.txt', file)

		// wait for upload to finish
		await vi.waitFor(() => {
			expect(upload.status).toBe(UploadStatus.FINISHED)
		})

		expect(started).toHaveBeenCalled()
		expect(progress).toHaveBeenCalled()
		expect(finished).toHaveBeenCalled()
	})

	it('performs batchUpload using UploadFileTree and initializes children', async () => {
		const uploader = new Uploader()
		const uploads = await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')])
		expect(Array.isArray(uploads)).toBe(true)
		expect(uploads.length).toBeGreaterThanOrEqual(1)
	})

	describe('batchUpload conflicts callback', () => {
		// destination folder source is mocked to https://localhost/remote.php/dav/files/test
		const target = 'https://localhost/remote.php/dav/files/test/dir'

		/** Run a batchUpload with the given callback and return the callback handed to UploadFileTree */
		const getWrappedCallback = async (callback?: unknown) => {
			uploadFileTreeMock.instances.length = 0
			const uploader = new Uploader()
			await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')], callback ? { callback } as any : undefined)
			expect(uploadFileTreeMock.instances).toHaveLength(1)
			expect(uploadFileTreeMock.instances[0].destination).toBe(target)
			return uploadFileTreeMock.instances[0].options.callback as
				| ((nodes: string[], path: string) => Promise<unknown>)
				| undefined
		}

		it('passes no callback to UploadFileTree when none was given', async () => {
			const wrapped = await getWrappedCallback()
			expect(wrapped).toBeFalsy()
		})

		it('wraps the callback so it receives a clean relative path', async () => {
			const userCallback = vi.fn(async () => ({}))
			const wrapped = await getWrappedCallback(userCallback)
			expect(wrapped).toBeTypeOf('function')

			// the root of the batch upload maps to an empty relative path
			await wrapped!(['file.txt'], target)
			expect(userCallback).toHaveBeenLastCalledWith(['file.txt'], '')

			// nested folder: the absolute upload prefix is stripped, no leading slash
			await wrapped!(['file.txt'], `${target}/sub`)
			expect(userCallback).toHaveBeenLastCalledWith(['file.txt'], 'sub')

			// deeper nesting keeps the inner separators
			await wrapped!(['file.txt'], `${target}/sub/deep`)
			expect(userCallback).toHaveBeenLastCalledWith(['file.txt'], 'sub/deep')
		})

		it('forwards the callback result (rename map / false) unchanged', async () => {
			const renameMap = { 'a.txt': 'b.txt' }
			const wrapped = await getWrappedCallback(vi.fn(async () => renameMap))
			await expect(wrapped!(['a.txt'], target)).resolves.toBe(renameMap)

			const wrappedCancel = await getWrappedCallback(vi.fn(async () => false))
			await expect(wrappedCancel!(['a.txt'], target)).resolves.toBe(false)
		})
	})

	describe('statistics', () => {
		it('exposes default statistics before any upload', () => {
			const uploader = new Uploader()
			expect(uploader.statistics).toEqual({
				eta: Infinity,
				progress: 0,
				speed: -1,
				speedReadable: '',
			})
		})

		it('reflects the upload progress in the statistics', async () => {
			const uploader = new Uploader()
			// 'hello' has a size of 5 bytes, the mock reports half (2.5) before finishing
			const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

			const observedProgress: number[] = []
			uploader.addEventListener('uploadProgress', () => {
				observedProgress.push(uploader.statistics.progress)
			})

			await uploader.upload('/hello.txt', file)

			// the mock emits progress at half (2.5 / 5 = 50%) and once more when finished (100%)
			expect(observedProgress).toContain(50)
			expect(observedProgress).toContain(100)
		})

		it('resets the statistics once all uploads are finished', async () => {
			const uploader = new Uploader()
			const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

			await uploader.upload('/hello.txt', file)

			// #onFinished resets the uploader (and its ETA) on the next tick
			await vi.waitFor(() => {
				expect(uploader.statistics).toEqual({
					eta: Infinity,
					progress: 0,
					speed: -1,
					speedReadable: '',
				})
			})
		})

		it('does not track statistics for uploads queued while paused', async () => {
			const uploader = new Uploader()
			const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

			await uploader.pause()

			const observedProgress: number[] = []
			uploader.addEventListener('uploadProgress', () => {
				observedProgress.push(uploader.statistics.progress)
			})

			await uploader.upload('/hello.txt', file)

			// while paused the ETA stays idle, so no progress is accumulated
			expect(observedProgress.every((progress) => progress === 0)).toBe(true)
		})
	})
})
