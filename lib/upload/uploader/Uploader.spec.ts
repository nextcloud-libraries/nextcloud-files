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
		constructor() {}
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
})
