/* eslint-disable @typescript-eslint/no-unused-vars */
/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CanceledError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { UploadStatus } from './Upload.ts'
import { UploadFile } from './UploadFile.ts'

const isPublicShareMock = vi.hoisted(() => vi.fn())
vi.mock('@nextcloud/sharing/public', () => ({ isPublicShare: isPublicShareMock }))

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
