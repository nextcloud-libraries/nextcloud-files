/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IUpload, TUploadStatus } from './Upload.ts'

import PQueue from 'p-queue'
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
// The constructor arguments are captured so we can assert on the resolved upload target.
const uploadFileMock = vi.hoisted(() => ({
	instances: [] as Array<{ destination: string, options: Record<string, any> }>,
}))

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
			uploadFileMock.instances.push({ destination: _args[0], options: _args[2] ?? {} })
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

		// Mirrors the real `Upload.cancel`: a method that accesses private state,
		// so calling it with a foreign `this` throws instead of silently working.
		#cancelled = false
		get cancelled(): boolean {
			return this.#cancelled
		}

		cancel() {
			this.#cancelled = true
			if (this.status !== UploadStatus.FINISHED) {
				this.status = UploadStatus.CANCELLED
			}
		}

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

		// Mirrors the real `Upload.cancel`: a method that accesses private state,
		// so calling it with a foreign `this` throws instead of silently working.
		#cancelled = false
		get cancelled(): boolean {
			return this.#cancelled
		}

		cancel() {
			this.#cancelled = true
			if (this.status !== UploadStatus.FINISHED) {
				this.status = UploadStatus.CANCELLED as TUploadStatus
			}
		}

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
		uploadFileMock.instances.length = 0
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
		// The status is derived from the job queue: with no queued/running jobs
		// a started (not paused) uploader is IDLE, not UPLOADING.
		expect(uploader.status).toBe(UploaderStatus.IDLE)
		await resumed

		// reset should clear queue and set IDLE
		uploader.reset()
		expect(uploader.status).toBe(UploaderStatus.IDLE)
		expect(uploader.queue).toEqual([])
	})

	it('returns to IDLE when reset while paused', async () => {
		const uploader = new Uploader()

		await uploader.pause()
		expect(uploader.status).toBe(UploaderStatus.PAUSED)

		// resetting must un-pause so the uploader is usable again afterwards
		uploader.reset()
		expect(uploader.status).toBe(UploaderStatus.IDLE)
	})

	describe('status (derived from the job queue)', () => {
		// The status getter is pure logic over the underlying p-queue state,
		// so we drive it by stubbing the queue's getters.
		const stubQueue = (state: { isPaused: boolean, pending: number, size: number }) => {
			vi.spyOn(PQueue.prototype, 'isPaused', 'get').mockReturnValue(state.isPaused)
			vi.spyOn(PQueue.prototype, 'pending', 'get').mockReturnValue(state.pending)
			vi.spyOn(PQueue.prototype, 'size', 'get').mockReturnValue(state.size)
		}

		it('is IDLE when the queue is running but empty', () => {
			stubQueue({ isPaused: false, pending: 0, size: 0 })
			expect(new Uploader().status).toBe(UploaderStatus.IDLE)
		})

		it('is PAUSED when the queue is paused', () => {
			// Paused takes precedence even if jobs are still in flight
			stubQueue({ isPaused: true, pending: 2, size: 3 })
			expect(new Uploader().status).toBe(UploaderStatus.PAUSED)
		})

		it('is UPLOADING when a single upload is in flight (nothing queued behind it)', () => {
			// Regression guard: a lone running job has pending === 1, size === 0
			stubQueue({ isPaused: false, pending: 1, size: 0 })
			expect(new Uploader().status).toBe(UploaderStatus.UPLOADING)
		})

		it('is UPLOADING when uploads are queued behind running ones', () => {
			stubQueue({ isPaused: false, pending: 5, size: 3 })
			expect(new Uploader().status).toBe(UploaderStatus.UPLOADING)
		})

		it('is UPLOADING when uploads are only waiting in the queue', () => {
			stubQueue({ isPaused: false, pending: 0, size: 4 })
			expect(new Uploader().status).toBe(UploaderStatus.UPLOADING)
		})
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

	describe('abort signal', () => {
		it('cancels a single upload when the signal is aborted', async () => {
			const uploader = new Uploader()
			const controller = new AbortController()

			const upload = await uploader.upload('/hello.txt', new File(['a'], 'hello.txt'), { signal: controller.signal })
			expect((upload as unknown as { cancelled: boolean }).cancelled).toBe(false)

			controller.abort()
			expect((upload as unknown as { cancelled: boolean }).cancelled).toBe(true)
		})

		it('cancels a batch upload when the signal is aborted', async () => {
			const uploader = new Uploader()
			const controller = new AbortController()

			const uploads = await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')], { signal: controller.signal })
			const root = uploads.at(-1) as unknown as { cancelled: boolean }
			expect(root.cancelled).toBe(false)

			controller.abort()
			expect(root.cancelled).toBe(true)
		})

		it('cancels a single upload when the signal is already aborted', async () => {
			const uploader = new Uploader()
			const controller = new AbortController()
			controller.abort()

			const upload = await uploader.upload('/hello.txt', new File(['a'], 'hello.txt'), { signal: controller.signal })
			expect((upload as unknown as { cancelled: boolean }).cancelled).toBe(true)
		})

		it('cancels a batch upload when the signal is already aborted', async () => {
			const uploader = new Uploader()
			const controller = new AbortController()
			controller.abort()

			const uploads = await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')], { signal: controller.signal })
			expect((uploads.at(-1) as unknown as { cancelled: boolean }).cancelled).toBe(true)
		})
	})

	describe('upload target resolution', () => {
		// destination folder source is mocked to https://localhost/remote.php/dav/files/test
		const defaultRoot = 'https://localhost/remote.php/dav/files/test'
		const otherRoot = 'https://localhost/remote.php/dav/files/test/subfolder'

		it('uploads relative to the uploader destination by default', async () => {
			const uploader = new Uploader()
			await uploader.upload('/hello.txt', new File(['a'], 'hello.txt'))
			expect(uploadFileMock.instances[0].destination).toBe(`${defaultRoot}/hello.txt`)
		})

		it('honours the root override for a single upload', async () => {
			const uploader = new Uploader()
			await uploader.upload('/hello.txt', new File(['a'], 'hello.txt'), { root: otherRoot })
			expect(uploadFileMock.instances[0].destination).toBe(`${otherRoot}/hello.txt`)
			// the override must not leak into the uploader state
			expect(uploader.destination.source).toBe(defaultRoot)
		})

		it('honours the root override for a batch upload', async () => {
			const uploader = new Uploader()
			await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')], { root: otherRoot })
			expect(uploadFileTreeMock.instances[0].destination).toBe(`${otherRoot}/dir`)
			expect(uploader.destination.source).toBe(defaultRoot)
		})

		it('normalizes slashes between the root override and the destination', async () => {
			const uploader = new Uploader()
			await uploader.upload('hello.txt', new File(['a'], 'hello.txt'), { root: `${otherRoot}/` })
			expect(uploadFileMock.instances[0].destination).toBe(`${otherRoot}/hello.txt`)
		})

		it('makes the batch upload conflicts callback relative to the overridden root', async () => {
			const userCallback = vi.fn(async () => ({}))
			const uploader = new Uploader()
			await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')], { root: otherRoot, callback: userCallback })

			const wrapped = uploadFileTreeMock.instances[0].options.callback as (nodes: string[], path: string) => Promise<unknown>
			await wrapped(['file.txt'], `${otherRoot}/dir/sub`)
			expect(userCallback).toHaveBeenLastCalledWith(['file.txt'], 'sub')
		})
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
