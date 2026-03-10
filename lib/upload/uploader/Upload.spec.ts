/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Upload, UploadStatus } from './Upload.ts'

describe('Upload', () => {
	beforeEach(() => {
		(window as any).OC = {
			appConfig: {
				files: {
					max_chunk_size: 5 * 1024 * 1024,
				},
			},
		}
	})

	afterEach(() => {
		delete (window as any).OC
		vi.useRealTimers()
	})

	it('initializes non-chunked uploads by default', () => {
		const file = new File(['data'], 'document.txt')
		const upload = new Upload('/remote.php/dav/files/user/document.txt', false, 1024, file)

		expect(upload.source).toBe('/remote.php/dav/files/user/document.txt')
		expect(upload.file).toBe(file)
		expect(upload.size).toBe(1024)
		expect(upload.isChunked).toBe(false)
		expect(upload.chunks).toBe(1)
		expect(upload.status).toBe(UploadStatus.INITIALIZED)
		expect(upload.uploaded).toBe(0)
		expect(upload.startTime).toBe(0)
	})

	it('enables chunking when configured and multiple chunks are needed', () => {
		const file = new File(['data'], 'video.mp4')
		const upload = new Upload('/remote.php/dav/files/user/video.mp4', true, 12 * 1024 * 1024, file)

		expect(upload.isChunked).toBe(true)
		expect(upload.chunks).toBe(3)
	})

	it('limits the number of chunks to 10000', () => {
		const file = new File(['data'], 'huge.bin')
		const upload = new Upload('/remote.php/dav/files/user/huge.bin', true, 5 * 1024 * 1024 * 20000, file)

		expect(upload.isChunked).toBe(true)
		expect(upload.chunks).toBe(10000)
	})

	it('tracks upload progress and keeps first start time', () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-03-09T10:00:00.000Z'))

		const file = new File(['data'], 'archive.zip')
		const upload = new Upload('/remote.php/dav/files/user/archive.zip', false, 100, file)
		upload.uploaded = 10

		expect(upload.status).toBe(UploadStatus.UPLOADING)
		expect(upload.uploaded).toBe(10)
		expect(upload.startTime).toBe(new Date('2026-03-09T10:00:00.000Z').getTime())

		vi.setSystemTime(new Date('2026-03-09T10:00:10.000Z'))
		upload.uploaded = 20

		expect(upload.status).toBe(UploadStatus.UPLOADING)
		expect(upload.uploaded).toBe(20)
		expect(upload.startTime).toBe(new Date('2026-03-09T10:00:00.000Z').getTime())
	})

	it('marks non-chunked uploads as finished when all bytes are uploaded', () => {
		const file = new File(['data'], 'photo.jpg')
		const upload = new Upload('/remote.php/dav/files/user/photo.jpg', false, 10, file)

		upload.uploaded = 10

		expect(upload.status).toBe(UploadStatus.FINISHED)
		expect(upload.uploaded).toBe(10)
	})

	it('marks chunked uploads as assembling when all bytes are uploaded', () => {
		const file = new File(['data'], 'dataset.csv')
		const upload = new Upload('/remote.php/dav/files/user/dataset.csv', true, 12 * 1024 * 1024, file)

		upload.uploaded = 12 * 1024 * 1024

		expect(upload.status).toBe(UploadStatus.ASSEMBLING)
		expect(upload.uploaded).toBe(12 * 1024 * 1024)
	})

	it('stores and exposes the server response', () => {
		const file = new File(['data'], 'result.txt')
		const upload = new Upload('/remote.php/dav/files/user/result.txt', false, 10, file)
		const response = {
			status: 201,
			statusText: 'Created',
			headers: {},
			config: { headers: {} },
			data: { ok: true },
		} as any

		expect(upload.response).toBeNull()
		upload.response = response
		expect(upload.response).toBe(response)

		upload.response = null
		expect(upload.response).toBeNull()
	})

	it('can update status directly', () => {
		const file = new File(['data'], 'manual.txt')
		const upload = new Upload('/remote.php/dav/files/user/manual.txt', false, 10, file)

		upload.status = UploadStatus.FAILED

		expect(upload.status).toBe(UploadStatus.FAILED)
	})

	it('aborts signal and marks upload as cancelled', () => {
		const file = new File(['data'], 'cancelled.txt')
		const upload = new Upload('/remote.php/dav/files/user/cancelled.txt', false, 10, file)

		expect(upload.signal.aborted).toBe(false)

		upload.cancel()

		expect(upload.signal.aborted).toBe(true)
		expect(upload.status).toBe(UploadStatus.CANCELLED)
	})
})
