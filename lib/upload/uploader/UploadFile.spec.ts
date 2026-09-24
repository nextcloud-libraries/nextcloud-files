/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AxiosProgressEvent, AxiosRequestConfig, AxiosResponse } from 'axios'

import axios from '@nextcloud/axios'
import { AxiosError, CanceledError } from 'axios'
import PQueue from 'p-queue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadStatus } from './Upload.ts'
import { UploadFile } from './UploadFile.ts'
import { createFile, mockRequests, requestedUrls, requests, setCapabilities, setPublicShare } from '~/__tests__/helpers.ts'

// The current user is read on import (by the logger), so it has to be set before
vi.hoisted(() => {
	document.head.dataset.user = 'tester'
})

/** The maximum chunk size used by the tests - the server does not allow smaller chunks */
const CHUNK_SIZE = 5 * 1024 * 1024

/** The temporary chunk workspace created for the current user */
const WORKSPACE = /\/remote\.php\/dav\/uploads\/tester\/web-file-upload-[0-9a-f]{16}/

beforeEach(() => {
	vi.restoreAllMocks()
	// by default this is not a public share, chunking uses the minimum chunk size and all requests succeed
	setPublicShare()
	setCapabilities({})
	setMaxChunkSize(CHUNK_SIZE)
	mockRequests()
})

describe('chunking', () => {
	it('enables chunking for non-public shares', () => {
		const uploadFile = new UploadFile('/destination', createFile(2 * CHUNK_SIZE))
		expect(uploadFile.isChunked).toBe(true)
	})

	it('enables chunking for public shares', () => {
		setPublicShare('token-1234')
		setCapabilities({ dav: { public_shares_chunking: true } })

		const uploadFile = new UploadFile('/destination', createFile(2 * CHUNK_SIZE))
		expect(uploadFile.isChunked).toBe(true)
	})

	it('disables chunking if too small', () => {
		const uploadFile = new UploadFile('/destination', createFile(CHUNK_SIZE - 1))
		expect(uploadFile.isChunked).toBe(false)
	})

	it('disables chunking if explicitly disabled', () => {
		const uploadFile = new UploadFile('/destination', createFile(2 * CHUNK_SIZE), { noChunking: true })
		expect(uploadFile.isChunked).toBe(false)
	})

	it('disables chunking if disabled by admin', () => {
		setMaxChunkSize(0)

		const uploadFile = new UploadFile('/destination', createFile(2 * CHUNK_SIZE))
		expect(uploadFile.isChunked).toBe(false)
	})

	it('disables chunking if not supported by public shares', () => {
		setPublicShare('token-1234')

		const uploadFile = new UploadFile('/destination', createFile(2 * CHUNK_SIZE))
		expect(uploadFile.isChunked).toBe(false)
	})

	it.each([
		[0, 1],
		[CHUNK_SIZE, 1],
		[CHUNK_SIZE + 1, 2],
		[2 * CHUNK_SIZE, 2],
		[2 * CHUNK_SIZE + 1, 3],
	])('calculates number of chunks correctly for file size %i', async (fileSize, expectedChunks) => {
		const uploadFile = new UploadFile('/destination', createFile(fileSize))
		expect(uploadFile.isChunked).toBe(expectedChunks > 1)

		// the chunks are calculated when the upload is started, the jobs do not need to run for this
		await uploadFile.start(createQueue({ autoStart: false }))
		expect(uploadFile.numberOfChunks).toBe(expectedChunks)
	})
})

describe('retries', () => {
	it.each([
		['the default of 5', {}, 5],
		['the configured', { retries: 2 }, 2],
	])('forwards %s retries to the upload request', async (_label, options, retries) => {
		const uploadFile = new UploadFile('/destination', createFile(100), options)
		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		expect(requests('PUT')).toHaveLength(1)
		expect(requests('PUT')[0]['axios-retry']).toMatchObject({ retries })
	})

	it('forwards the configured retries to chunked uploads and the workspace creation', async () => {
		const uploadFile = new UploadFile('/destination', createFile(4 * CHUNK_SIZE), { retries: 2 })
		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		expect(requests('MKCOL')).toHaveLength(1)
		expect(requests('MKCOL')[0]).toMatchObject({
			url: expect.stringMatching(WORKSPACE),
			headers: { Destination: '/destination' },
			'axios-retry': expect.objectContaining({ retries: 2 }),
		})
		expect(requests('PUT')).toHaveLength(4)
		for (const upload of requests('PUT')) {
			expect(upload['axios-retry']).toMatchObject({ retries: 2 })
		}
	})
})

describe('upload status and events', () => {
	it('is initialized', () => {
		const uploadFile = new UploadFile('/destination', createFile(100))
		expect(uploadFile.status).toBe(UploadStatus.INITIALIZED)
	})

	it('is scheduled once started', async () => {
		const uploadFile = new UploadFile('/destination', createFile(100))
		// the queue is not started, so the upload job does not run yet
		await uploadFile.start(createQueue({ autoStart: false }))
		expect(uploadFile.status).toBe(UploadStatus.SCHEDULED)
	})

	it('is uploading while the request is running', async () => {
		// the request never settles
		mockUploads(() => new Promise(() => {}))

		const uploadFile = new UploadFile('/destination', createFile(100))
		await uploadFile.start(createQueue())
		expect(uploadFile.status).toBe(UploadStatus.UPLOADING)
	})

	it('is finished when the request succeeded', async () => {
		const uploadFile = new UploadFile('/destination', createFile(100))
		const onFinish = vi.fn()
		uploadFile.addEventListener('finished', onFinish)

		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()
		expect(uploadFile.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it.each([
		['cancelled if the request was aborted', new DOMException('Aborted', 'AbortError'), UploadStatus.CANCELLED],
		['cancelled if the request was cancelled by axios', new CanceledError(), UploadStatus.CANCELLED],
		['failed if the request failed', new Error('generic error'), UploadStatus.FAILED],
	])('is %s', async (_label, error, expectedStatus) => {
		mockUploads(() => Promise.reject(error))

		const uploadFile = new UploadFile('/destination', createFile(100))
		const onFinish = vi.fn()
		uploadFile.addEventListener('finished', onFinish)

		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()
		expect(uploadFile.status).toBe(expectedStatus)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('throws if start called twice', async () => {
		const uploadFile = new UploadFile('/destination', createFile(100))
		const queue = createQueue()
		await uploadFile.start(queue)
		await expect(uploadFile.start(queue)).rejects.toThrow('Upload already started')
	})

	it('converts FileSystemFileEntry to File when starting', async () => {
		const fileEntry = {
			file: vi.fn((resolve: (file: File) => void) => resolve(createFile(100, 'entry.txt'))),
		} as unknown as FileSystemFileEntry

		const uploadFile = new UploadFile('/destination', fileEntry)
		const onFinish = vi.fn()
		uploadFile.addEventListener('finished', onFinish)

		const queue = createQueue()
		await uploadFile.start(queue)
		expect(fileEntry.file).toHaveBeenCalledOnce()

		await queue.onIdle()
		expect(uploadFile.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('resets uploadedBytes on upload retry and emits progress', async () => {
		// the first try is retried after some progress was reported
		mockUploads(async (config) => {
			reportProgress(config, 100)
			reportRetry(config)
		})

		const uploadFile = new UploadFile('/destination', createFile(1024))
		const onProgress = vi.fn()
		uploadFile.addEventListener('progress', onProgress)

		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()
		expect(uploadFile.uploadedBytes).toBe(1024)
		expect(onProgress).toHaveBeenCalled()
	})

	it('chunked assemble finishes when MOVE succeeds', async () => {
		const uploadFile = new UploadFile('/destination', createFile(4 * CHUNK_SIZE))
		const onFinish = vi.fn()
		uploadFile.addEventListener('finished', onFinish)

		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		// the chunks are uploaded to the workspace and assembled to the destination
		expect(requestedUrls('PUT')).toEqual([0, 1, 2, 3].map((chunk) => expect.stringMatching(new RegExp(`${WORKSPACE.source}/${chunk}$`))))
		expect(requests('MOVE')).toHaveLength(1)
		expect(requests('MOVE')[0]).toMatchObject({
			url: expect.stringMatching(new RegExp(`${WORKSPACE.source}/.file$`)),
			headers: expect.objectContaining({ Destination: '/destination', 'OC-Total-Length': 4 * CHUNK_SIZE }),
		})
		expect(uploadFile.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('keeps the source unencoded but encodes the request URL', async () => {
		const uploadFile = new UploadFile('/destination/a b&c.txt', createFile(1, 'a b&c.txt'))
		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		expect(uploadFile.source).toBe('/destination/a b&c.txt')
		expect(requestedUrls('PUT')).toEqual(['/destination/a%20b%26c.txt'])
	})

	it('encodes the destination header of chunked uploads', async () => {
		const uploadFile = new UploadFile('/destination/a b&c.txt', createFile(4 * CHUNK_SIZE, 'a b&c.txt'))
		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		expect(uploadFile.source).toBe('/destination/a b&c.txt')
		// the workspace is created with the encoded destination …
		expect(requests('MKCOL')[0].headers).toMatchObject({ Destination: '/destination/a%20b%26c.txt' })
		// … and so is the assemble request
		expect(requests('MOVE')[0].headers).toMatchObject({ Destination: '/destination/a%20b%26c.txt' })
	})

	it('rebases the upload to a new destination', () => {
		const uploadFile = new UploadFile('/destination/a.txt', createFile(1, 'a.txt'))
		uploadFile.rebase('/destination/folder (2)/a.txt')
		expect(uploadFile.source).toBe('/destination/folder (2)/a.txt')
	})
})

describe('chunked upload progress and status', () => {
	// four chunks
	const fileSize = 4 * CHUNK_SIZE

	it('is not finished while other chunks are still uploading', async () => {
		// the last of the four chunks never settles, all others succeed
		let uploads = 0
		mockUploads(() => (++uploads < 4 ? Promise.resolve() : new Promise(() => {})))

		const uploadFile = new UploadFile('/destination', createFile(fileSize))
		await uploadFile.start(createQueue())

		// wait for the three succeeding chunks to settle
		await vi.waitFor(() => expect(uploadFile.uploadedBytes).toBe(3 * CHUNK_SIZE))
		expect(uploadFile.status).toBe(UploadStatus.UPLOADING)
	})

	it('never reports more uploaded bytes than the file size', async () => {
		// the whole chunk is reported as sent before the request succeeds
		mockUploads(async (config) => reportProgress(config, config.data.size))

		const uploadFile = new UploadFile('/destination', createFile(fileSize))
		const reported: number[] = []
		uploadFile.addEventListener('progress', () => {
			reported.push(uploadFile.uploadedBytes)
		})

		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		expect(Math.max(...reported)).toBeLessThanOrEqual(fileSize)
		expect(uploadFile.uploadedBytes).toBe(fileSize)
		expect(uploadFile.status).toBe(UploadStatus.FINISHED)
	})

	it('only discards the progress of the retried chunk', async () => {
		// the second chunk has to be retried after it was already fully sent, all other chunks are uploaded without retry
		let uploads = 0
		mockUploads(async (config) => {
			reportProgress(config, config.data.size)
			if (++uploads === 2) {
				reportRetry(config)
				reportProgress(config, config.data.size)
			}
		})

		const uploadFile = new UploadFile('/destination', createFile(fileSize))
		const reported: number[] = []
		uploadFile.addEventListener('progress', () => {
			reported.push(uploadFile.uploadedBytes)
		})

		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		// a retry of one chunk must not drop the progress of the other chunks
		expect(Math.max(...reported)).toBeLessThanOrEqual(fileSize)
		expect(uploadFile.uploadedBytes).toBe(fileSize)
	})

	it('does not overwrite a failed status with a later successful chunk', async () => {
		// the first chunk fails, all other chunks succeed but only after the failure was handled
		let uploads = 0
		mockUploads(() => (++uploads === 1
			? Promise.reject(new Error('chunk failed'))
			: new Promise((resolve) => setTimeout(resolve, 20))))

		const uploadFile = new UploadFile('/destination', createFile(fileSize))
		const queue = createQueue()
		await uploadFile.start(queue)
		await queue.onIdle()

		expect(uploadFile.status).toBe(UploadStatus.FAILED)
	})
})

/**
 * Set the maximum chunk size configured by the admin.
 *
 * @param size - The chunk size in bytes, `0` disables chunking
 */
function setMaxChunkSize(size: number): void {
	window.OC = { ...window.OC, appConfig: { files: { max_chunk_size: size } } } as typeof window.OC
}

/**
 * Create the job queue for an upload.
 *
 * The upload does not await the jobs it adds to the queue, so a failed upload job
 * would be reported as unhandled rejection - thus the rejections are handled here.
 *
 * @param options - The queue options
 */
function createQueue(options?: ConstructorParameters<typeof PQueue>[0]): PQueue {
	const queue = new PQueue(options)
	const add = queue.add.bind(queue)
	queue.add = ((...args: Parameters<typeof add>) => {
		const job = add(...args)
		job.catch(() => {})
		return job
	}) as typeof queue.add
	return queue
}

/**
 * Mock the upload requests (PUT) with the given handler, all other requests succeed.
 *
 * @param handler - Handles the upload request, its result is the result of the request
 */
function mockUploads(handler: (config: AxiosRequestConfig) => Promise<unknown>): void {
	vi.mocked(axios.request).mockImplementation(async (config) => {
		if (config.method === 'PUT') {
			await handler(config)
		}
		return {} as AxiosResponse
	})
}

/**
 * Report the given number of bytes of an upload request as sent.
 *
 * @param config - The request
 * @param bytes - The number of bytes sent
 */
function reportProgress(config: AxiosRequestConfig, bytes: number): void {
	config.onUploadProgress!({ bytes } as AxiosProgressEvent)
}

/**
 * Report an upload request as retried.
 *
 * @param config - The request
 */
function reportRetry(config: AxiosRequestConfig): void {
	config['axios-retry']!.onRetry!(1, new AxiosError('Network Error'), config)
}
