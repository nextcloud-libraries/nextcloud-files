/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AxiosProgressEvent, AxiosResponse } from 'axios'
import type { ConflictsCallback } from './UploadFileTree.ts'

import axios from '@nextcloud/axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Folder } from '../../node/folder.ts'
import { UploadStatus } from './Upload.ts'
import { Uploader, UploaderStatus } from './Uploader.ts'
import { fileWithPath, mockRequests } from '~/__tests__/helpers.ts'

// The uploader needs the current user to set up its default destination.
// `getCurrentUser()` caches its result, so this can not be toggled through the page state.
const authMock = vi.hoisted(() => ({
	getCurrentUser: vi.fn<() => ({ uid: string }) | null>(() => ({ uid: 'tester' })),
}))
vi.mock('@nextcloud/auth', async (original) => ({ ...await original(), ...authMock }))

/** The destination of the uploader used in the tests */
const root = 'https://localhost/remote.php/dav/files/tester'

beforeEach(() => {
	vi.restoreAllMocks()
	authMock.getCurrentUser.mockReturnValue({ uid: 'tester' })
	mockRequests()
})

describe('Uploader', () => {
	it('constructs with default destination and exposes status/destination', () => {
		const uploader = new Uploader()
		expect(uploader.status).toBe(UploaderStatus.IDLE)
		expect(uploader.destination).toBeInstanceOf(Folder)
		expect(uploader.destination.owner).toBe('tester')
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

	describe('status', () => {
		it('is UPLOADING while an upload is running', async () => {
			// the upload request only finishes when the test resolves it
			const { promise, resolve } = Promise.withResolvers<AxiosResponse>()
			vi.mocked(axios.request).mockReturnValueOnce(promise)

			const uploader = createUploader()
			const finished = whenFinished(uploader)
			await uploader.upload('/hello.txt', new File(['hello'], 'hello.txt'))
			expect(uploader.status).toBe(UploaderStatus.UPLOADING)

			resolve({} as AxiosResponse)
			await finished
			expect(uploader.status).toBe(UploaderStatus.IDLE)
		})

		it('is PAUSED even if already started uploads are still running', async () => {
			const { promise, resolve } = Promise.withResolvers<AxiosResponse>()
			vi.mocked(axios.request).mockReturnValueOnce(promise)

			const uploader = createUploader()
			const finished = whenFinished(uploader)
			await uploader.upload('/hello.txt', new File(['hello'], 'hello.txt'))
			// pausing waits for the running upload, so it can not be awaited here
			const paused = uploader.pause()
			expect(uploader.status).toBe(UploaderStatus.PAUSED)

			resolve({} as AxiosResponse)
			await paused
			await finished
		})
	})

	it('uploads a file and emits progress and finished events', async () => {
		const uploader = createUploader()
		const started = vi.fn()
		const progress = vi.fn()
		const finished = vi.fn()
		uploader.addEventListener('uploadStarted', started)
		uploader.addEventListener('uploadProgress', progress)
		uploader.addEventListener('uploadFinished', finished)

		const allFinished = whenFinished(uploader)
		const upload = await uploader.upload('/hello.txt', new File(['hello'], 'hello.txt'))
		await allFinished

		expect(upload.status).toBe(UploadStatus.FINISHED)
		expect(started).toHaveBeenCalledOnce()
		expect(progress).toHaveBeenCalled()
		expect(finished).toHaveBeenCalledOnce()
		expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT', url: `${root}/hello.txt` }))
	})

	it('uploads the files of a batch upload and creates their directories', async () => {
		const uploader = createUploader()
		const finished = whenFinished(uploader)
		const uploads = await uploader.batchUpload('/dir', [
			new File(['a'], 'a.txt'),
			fileWithPath('b', 'sub/b.txt'),
		])
		await finished

		// the child uploads followed by the upload of the batch itself
		expect(uploads.map((upload) => upload.source)).toEqual([
			`${root}/dir/a.txt`,
			`${root}/dir/sub`,
			`${root}/dir/sub/b.txt`,
			`${root}/dir`,
		])
		expect(uploads.every((upload) => upload.status === UploadStatus.FINISHED)).toBe(true)
		expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'MKCOL', url: `${root}/dir` }))
		expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'MKCOL', url: `${root}/dir/sub` }))
		expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT', url: `${root}/dir/a.txt` }))
		expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT', url: `${root}/dir/sub/b.txt` }))
	})

	describe('abort signal', () => {
		it('cancels a single upload when the signal is aborted', async () => {
			const controller = new AbortController()
			// keep the upload queued so it can be cancelled
			const uploader = createUploader()
			await uploader.pause()

			const upload = await uploader.upload('/hello.txt', new File(['a'], 'hello.txt'), { signal: controller.signal })
			expect(upload.signal.aborted).toBe(false)

			controller.abort()
			expect(upload.signal.aborted).toBe(true)
			expect(upload.status).toBe(UploadStatus.CANCELLED)
		})

		it('cancels a batch upload when the signal is aborted', async () => {
			const controller = new AbortController()
			const uploads = await createUploader().batchUpload('/dir', [new File(['a'], 'a.txt')], { signal: controller.signal })
			const batch = uploads.at(-1)!
			expect(batch.signal.aborted).toBe(false)

			controller.abort()
			expect(batch.signal.aborted).toBe(true)
			// the children are cancelled with the batch
			expect(uploads[0].signal.aborted).toBe(true)
		})

		// An already aborted signal cancels the upload before it is started,
		// but `start()` then refuses to run a cancelled upload and rejects with "Upload already started".
		// These tests document the intended behavior and are expected to fail until this is fixed.
		it.fails('cancels a single upload when the signal is already aborted', async () => {
			const controller = new AbortController()
			controller.abort()

			const upload = await createUploader().upload('/hello.txt', new File(['a'], 'hello.txt'), { signal: controller.signal })
			expect(upload.signal.aborted).toBe(true)
			expect(upload.status).toBe(UploadStatus.CANCELLED)
		})

		it.fails('cancels a batch upload when the signal is already aborted', async () => {
			const controller = new AbortController()
			controller.abort()

			const uploads = await createUploader().batchUpload('/dir', [new File(['a'], 'a.txt')], { signal: controller.signal })
			expect(uploads.at(-1)!.signal.aborted).toBe(true)
			expect(uploads.at(-1)!.status).toBe(UploadStatus.CANCELLED)
		})
	})

	describe('upload target resolution', () => {
		const otherRoot = `${root}/subfolder`

		it('uploads relative to the uploader destination by default', async () => {
			const upload = await createUploader().upload('/hello.txt', new File(['a'], 'hello.txt'))
			expect(upload.source).toBe(`${root}/hello.txt`)
		})

		it('honours the root override for a single upload', async () => {
			const uploader = createUploader()
			const upload = await uploader.upload('/hello.txt', new File(['a'], 'hello.txt'), { root: otherRoot })
			expect(upload.source).toBe(`${otherRoot}/hello.txt`)
			// the override must not leak into the uploader state
			expect(uploader.destination.source).toBe(root)
		})

		it('honours the root override for a batch upload', async () => {
			const uploader = createUploader()
			const uploads = await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')], { root: otherRoot })
			expect(uploads.map((upload) => upload.source)).toEqual([`${otherRoot}/dir/a.txt`, `${otherRoot}/dir`])
			expect(uploader.destination.source).toBe(root)
		})

		it('normalizes slashes between the root override and the destination', async () => {
			const upload = await createUploader().upload('hello.txt', new File(['a'], 'hello.txt'), { root: `${otherRoot}/` })
			expect(upload.source).toBe(`${otherRoot}/hello.txt`)
		})

		it('makes the batch upload conflicts callback relative to the overridden root', async () => {
			// the directories already exist, so conflicts need to be resolved
			vi.mocked(axios.head).mockResolvedValue({})
			const callback = vi.fn<ConflictsCallback>(async (nodes) => Object.fromEntries(nodes.map((node) => [node, node])))

			await createUploader().batchUpload('/dir', [fileWithPath('a', 'sub/file.txt')], { root: otherRoot, callback })
			expect(callback).toHaveBeenCalledWith(['sub'], '')
			expect(callback).toHaveBeenCalledWith(['file.txt'], 'sub')
		})
	})

	describe('batchUpload conflicts callback', () => {
		beforeEach(() => {
			// all directories already exist, so conflicts need to be resolved on every level
			vi.mocked(axios.head).mockResolvedValue({})
		})

		it('uploads everything without resolving conflicts if no callback was given', async () => {
			const uploader = createUploader()
			const finished = whenFinished(uploader)
			const uploads = await uploader.batchUpload('/dir', [new File(['a'], 'a.txt')])
			await finished

			expect(uploads.map((upload) => upload.status)).toEqual([UploadStatus.FINISHED, UploadStatus.FINISHED])
		})

		it('calls the callback with the path relative to the upload destination', async () => {
			const callback = vi.fn<ConflictsCallback>(async (nodes) => Object.fromEntries(nodes.map((node) => [node, node])))

			await createUploader().batchUpload('/dir', [
				new File(['a'], 'a.txt'),
				fileWithPath('b', 'sub/b.txt'),
				fileWithPath('c', 'sub/deep/c.txt'),
			], { callback })

			// the root of the batch upload maps to an empty relative path
			expect(callback).toHaveBeenCalledWith(['a.txt', 'sub'], '')
			// nested folder: the absolute upload prefix is stripped, no leading slash
			expect(callback).toHaveBeenCalledWith(['b.txt', 'deep'], 'sub')
			// deeper nesting keeps the inner separators
			expect(callback).toHaveBeenCalledWith(['c.txt'], 'sub/deep')
		})

		it('renames the uploads as resolved by the callback', async () => {
			const callback = vi.fn<ConflictsCallback>(async () => ({ 'a.txt': 'b.txt' }))

			const uploads = await createUploader().batchUpload('/dir', [new File(['a'], 'a.txt')], { callback })
			expect(uploads[0].source).toBe(`${root}/dir/b.txt`)
		})

		it('cancels the upload if the callback returns false', async () => {
			const callback = vi.fn<ConflictsCallback>(async () => false)

			const uploads = await createUploader().batchUpload('/dir', [new File(['a'], 'a.txt')], { callback })
			expect(uploads.map((upload) => upload.status)).toEqual([UploadStatus.CANCELLED, UploadStatus.CANCELLED])
			expect(axios.request).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT' }))
		})
	})

	describe('statistics', () => {
		const defaults = {
			eta: Infinity,
			progress: 0,
			speed: -1,
			speedReadable: '',
		}

		it('exposes default statistics before any upload', () => {
			expect(createUploader().statistics).toEqual(defaults)
		})

		it('reflects the upload progress in the statistics', async () => {
			// the request reports half of the file as sent before it finishes
			vi.mocked(axios.request).mockImplementationOnce(async (config) => {
				config.onUploadProgress!({ bytes: (config.data as Blob).size / 2 } as AxiosProgressEvent)
				return {} as AxiosResponse
			})

			const uploader = createUploader()
			const observedProgress: number[] = []
			uploader.addEventListener('uploadProgress', () => {
				observedProgress.push(uploader.statistics.progress)
			})

			const finished = whenFinished(uploader)
			await uploader.upload('/hello.txt', new File(['x'.repeat(100)], 'hello.txt'))
			await finished

			// the progress is reported while uploading, not only once the upload is finished
			expect(observedProgress.some((progress) => progress > 0 && progress < 100)).toBe(true)
			expect(observedProgress.at(-1)).toBe(100)
		})

		it('resets the statistics once all uploads are finished', async () => {
			const uploader = createUploader()
			const finished = whenFinished(uploader)
			await uploader.upload('/hello.txt', new File(['hello'], 'hello.txt'))
			await finished

			expect(uploader.statistics).toEqual(defaults)
		})

		it('does not track the progress of running uploads while paused', async () => {
			// the first upload keeps running until the test finishes it
			const { promise, resolve } = Promise.withResolvers<AxiosResponse>()
			vi.mocked(axios.request).mockReturnValueOnce(promise)

			const uploader = createUploader()
			const finished = whenFinished(uploader)
			await uploader.upload('/a.txt', new File(['x'.repeat(100)], 'a.txt'))
			await vi.waitFor(() => expect(axios.request).toHaveBeenCalledOnce())
			// pausing waits for the running upload, so it can not be awaited here
			const paused = uploader.pause()
			// queuing another upload while paused must not resume the statistics
			await uploader.upload('/b.txt', new File(['x'.repeat(100)], 'b.txt'))

			const { onUploadProgress } = vi.mocked(axios.request).mock.calls[0][0]
			onUploadProgress!({ bytes: 50 } as AxiosProgressEvent)
			expect(uploader.statistics.progress).toBe(0)

			resolve({} as AxiosResponse)
			await paused
			uploader.start()
			await finished
		})
	})
})

/**
 * Create an uploader with a fixed destination folder.
 */
function createUploader(): Uploader {
	return new Uploader(false, new Folder({ owner: 'tester', root: '/files/tester', source: root }))
}

/**
 * Get a promise that resolves once the uploader finished all of its uploads.
 * It needs to be created before the upload is started, as small uploads finish immediately.
 *
 * @param uploader - The uploader to wait for
 */
function whenFinished(uploader: Uploader): Promise<void> {
	return new Promise((resolve) => uploader.addEventListener('finished', () => resolve(), { once: true }))
}
