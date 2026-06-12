/* eslint-disable @typescript-eslint/no-unused-vars */
/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import axios from '@nextcloud/axios'
import { CanceledError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { UploadStatus } from './Upload.ts'
import { UploadFile } from './UploadFile.ts'

const isPublicShareMock = vi.hoisted(() => vi.fn())
vi.mock('@nextcloud/sharing/public', async (original) => ({ ...await original(), isPublicShare: isPublicShareMock }))

const initChunkWorkspaceMock = vi.hoisted(() => vi.fn())
const uploadDataMock = vi.hoisted(() => vi.fn())
vi.mock('../utils/upload.ts', async () => ({
	...(await vi.importActual('../utils/upload.ts')),
	initChunkWorkspace: initChunkWorkspaceMock,
	uploadData: uploadDataMock,
}))

const getMaxChunksSizeMock = vi.hoisted(() => vi.fn())
const supportsPublicChunkingMock = vi.hoisted(() => vi.fn())
vi.mock('../utils/config.ts', () => ({
	getMaxChunksSize: getMaxChunksSizeMock,
	supportsPublicChunking: supportsPublicChunkingMock,
}))

describe('chunking', () => {
	it('enables chunking for non-public shares', () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(2048)], 'filename'), { noChunking: false })
		expect(uploadFile.isChunked).toBe(true)
	})

	it('enables chunking for public shares', () => {
		isPublicShareMock.mockReturnValue(true)
		supportsPublicChunkingMock.mockReturnValue(true)
		getMaxChunksSizeMock.mockReturnValue(1024)
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(2048)], 'filename'), { noChunking: false })
		expect(uploadFile.isChunked).toBe(true)
	})

	it('disables chunking if too small', () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1000)], 'filename'), { noChunking: false })
		expect(uploadFile.isChunked).toBe(false)
	})

	it('disables chunking if explicitly disabled', () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(2048)], 'filename'), { noChunking: true })
		expect(uploadFile.isChunked).toBe(false)
	})

	it('disables chunking if disabled by admin', () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(0)
		const uploadFile = new UploadFile('/destination', new File([], 'filename'), { noChunking: true })
		expect(uploadFile.isChunked).toBe(false)
	})

	it('disables chunking if not supported by public shares', () => {
		isPublicShareMock.mockReturnValue(true)
		supportsPublicChunkingMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(2048)], 'filename'), { noChunking: false })
		expect(uploadFile.isChunked).toBe(false)
	})

	it.each([
		[0, 1],
		[1024, 1],
		[1025, 2],
		[2048, 2],
		[2049, 3],
	])('calculates number of chunks correctly for file size %i', async (fileSize, expectedChunks) => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)

		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(fileSize)], 'filename'), { noChunking: false })
		expect(uploadFile.isChunked).toBe(expectedChunks > 1)

		const { resolve, promise } = Promise.withResolvers<void>()
		const queue = { add: vi.fn(() => resolve()) }
		uploadFile.start(queue as never)

		// wait for queue to be called
		await promise
		expect(uploadFile.numberOfChunks).toBe(expectedChunks)
	})
})

describe('upload status and events', () => {
	it('initialized', () => {
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(2048)], 'filename'), { noChunking: false })
		expect(uploadFile.status).toBe(UploadStatus.INITIALIZED)
	})

	it('converts FileSystemFileEntry to File when starting', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024 * 1024)

		const fileEntry = {
			file: vi.fn((resolve: (f: File) => void) => resolve(new File(['x'.repeat(1024)], 'entry.txt'))),
		} as unknown as FileSystemFileEntry

		uploadDataMock.mockImplementationOnce(() => Promise.resolve())

		const onFinish = vi.fn()
		const uploadFile = new UploadFile('/destination', fileEntry, { noChunking: false })
		uploadFile.addEventListener('finished', onFinish)

		const queue = { add: vi.fn((_fn: () => Promise<void>) => {}) }
		await uploadFile.start(queue as never)
		expect(fileEntry.file).toHaveBeenCalledOnce()
		// run the scheduled upload
		await queue.add.mock.calls[0][0]()
		expect(uploadFile.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('throws if start called twice', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024 * 1024)

		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(100)], 'filename'), { noChunking: false })
		const queue = { add: vi.fn((_fn: () => Promise<void>) => {}) }
		await uploadFile.start(queue as never)
		await expect(uploadFile.start(queue as never)).rejects.toThrow('Upload already started')
	})

	it('resets uploadedBytes on upload retry and emits progress', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024 * 1024)

		// Mock uploadData to call onUploadProgress and onUploadRetry synchronously
		uploadDataMock.mockImplementationOnce((_url: string, _chunk: Blob, options: any) => {
			options.onUploadProgress?.({ bytes: 100 })
			options.onUploadRetry?.()
			return Promise.resolve()
		})

		const onProgress = vi.fn()
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1024)], 'filename'), { noChunking: false })
		uploadFile.addEventListener('progress', onProgress)

		const queue = { add: vi.fn((fn: () => Promise<void>) => fn()) }
		await uploadFile.start(queue as never)
		// the queued function was executed immediately by our queue stub — wait for it to finish
		await queue.add.mock.calls[0][0]()
		expect(uploadFile.uploadedBytes).toBe(1024)
		expect(onProgress).toHaveBeenCalled()
	})

	it('chunked assemble finishes when MOVE succeeds', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		// make sure chunking is enabled
		initChunkWorkspaceMock.mockResolvedValue('/tmp/temporary')
		// each chunk upload succeeds
		uploadDataMock.mockImplementation(() => Promise.resolve())
		// axios MOVE succeeds
		vi.spyOn(axios, 'request').mockResolvedValueOnce({})

		const onFinish = vi.fn()
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(4096)], 'bigfile'), { noChunking: false })
		uploadFile.addEventListener('finished', onFinish)

		// simple queue that executes tasks immediately and returns their promise
		const queue = { add: vi.fn((fn: () => Promise<void>) => fn()) }

		await uploadFile.start(queue as never)
		// wait for all queued tasks to finish
		await Promise.all(queue.add.mock.results.map((r) => r.value))

		expect(uploadFile.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('scheduled', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)

		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1024)], 'filename'), { noChunking: false })
		const { resolve, promise } = Promise.withResolvers<void>()
		const queue = { add: vi.fn(() => resolve()) }

		uploadFile.start(queue as never)
		// wait for queue to be called
		await promise
		expect(uploadFile.status).toBe(UploadStatus.SCHEDULED)
	})

	it('uploading', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)

		const { promise: uploadDataPromise } = Promise.withResolvers<void>()
		uploadDataMock.mockImplementationOnce(() => uploadDataPromise)

		const { promise: queuePromise, resolve: queueResolve } = Promise.withResolvers<void>()
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1024)], 'filename'), { noChunking: false })
		const queue = { add: vi.fn((fn: () => Promise<void>) => (queueResolve(), fn())) }
		// start upload and wait for queue to be called
		uploadFile.start(queue as never)
		await queuePromise

		expect(uploadFile.status).toBe(UploadStatus.UPLOADING)
	})

	it('finished', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		uploadDataMock.mockImplementationOnce(() => Promise.resolve())

		const onFinish = vi.fn()
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1024)], 'filename'), { noChunking: false })
		uploadFile.addEventListener('finished', onFinish)

		const queue = { add: vi.fn((_fn: () => Promise<void>) => {}) }
		await uploadFile.start(queue as never)
		await queue.add.mock.calls[0][0]()
		expect(uploadFile.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('cancelled by DOM', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		uploadDataMock.mockImplementationOnce(() => Promise.reject(new DOMException('Aborted', 'AbortError')))

		const onFinish = vi.fn()
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1024)], 'filename'), { noChunking: false })
		uploadFile.addEventListener('finished', onFinish)

		const queue = { add: vi.fn((_fn: () => Promise<void>) => {}) }
		await uploadFile.start(queue as never)
		await queue.add.mock.calls[0][0]().catch(() => {})
		expect(uploadFile.status).toBe(UploadStatus.CANCELLED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('cancelled by axios', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		uploadDataMock.mockImplementationOnce(() => Promise.reject(new CanceledError()))

		const onFinish = vi.fn()
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1024)], 'filename'), { noChunking: false })
		uploadFile.addEventListener('finished', onFinish)

		const queue = { add: vi.fn((_fn: () => Promise<void>) => {}) }
		await uploadFile.start(queue as never)
		await queue.add.mock.calls[0][0]().catch(() => {})
		expect(uploadFile.status).toBe(UploadStatus.CANCELLED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('failed', async () => {
		isPublicShareMock.mockReturnValue(false)
		getMaxChunksSizeMock.mockReturnValue(1024)
		uploadDataMock.mockImplementationOnce(() => Promise.reject(new Error('generic error')))

		const onFinish = vi.fn()
		const uploadFile = new UploadFile('/destination', new File(['x'.repeat(1024)], 'filename'), { noChunking: false })
		uploadFile.addEventListener('finished', onFinish)

		const queue = { add: vi.fn((_fn: () => Promise<void>) => {}) }
		await uploadFile.start(queue as never)
		await queue.add.mock.calls[0][0]().catch(() => {})
		expect(uploadFile.status).toBe(UploadStatus.FAILED)
		expect(onFinish).toHaveBeenCalledOnce()
	})
})
