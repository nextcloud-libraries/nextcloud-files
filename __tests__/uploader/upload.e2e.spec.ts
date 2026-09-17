/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { FileStat } from 'webdav'

import { describe, expect, it, vi } from 'vitest'
import { createDirectoryEntry } from '../fixtures/filesystem.ts'
import { defaultRemoteURL, getClient } from '@/dav/index.ts'
import { Folder } from '@/node/index.ts'
import { Uploader, UploaderStatus, UploadStatus } from '@/upload/index.ts'

vi.mock('@nextcloud/auth', async (def) => ({
	...(await def()),
	getCurrentUser: () => ({ uid: 'admin' }),
}))

vi.hoisted(() => {
	window._oc_webroot = '/nextcloud'
})

describe('Uploader (current API)', () => {
	it('should upload a file', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test').catch(() => {})
		await client.createDirectory('/files/admin/test')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test`,
		})
		const uploader = new Uploader(false, folder)
		const upload = await uploader.upload('a.txt', new File(['test'], 'a.txt', { type: 'text/plain' }))
		await new Promise((resolve) => upload.addEventListener('finished', resolve))
		const result = await client.getFileContents('/files/admin/test/a.txt', { format: 'text' })
		expect(result).toBe('test')
	})

	it('should upload a file chunked', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test').catch(() => {})
		await client.createDirectory('/files/admin/test')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test`,
		})
		const uploader = new Uploader(false, folder)
		const finishedPromise = new Promise((resolve) => uploader.addEventListener('finished', resolve))

		const content = 'x'.repeat(21 * 1024 * 1024) // 21 MiB
		const upload = await uploader.upload('chunked.txt', new File([content], 'chunked.txt', { type: 'text/plain' }))
		await finishedPromise
		expect(upload.status).toBe(UploadStatus.FINISHED)

		const result = await client.getFileContents('/files/admin/test/chunked.txt', { format: 'text' })
		expect(result).toBe(content)
	})

	it('should upload multiple files', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-multi').catch(() => {})
		await client.createDirectory('/files/admin/test-multi')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-multi`,
		})
		const uploader = new Uploader(false, folder)

		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		const uploads = await uploader.batchUpload('', [
			new File(['content-a'], 'a.txt', { type: 'text/plain' }),
			new File(['content-b'], 'b.txt', { type: 'text/plain' }),
			new File(['content-c'], 'c.txt', { type: 'text/plain' }),
		])

		await finishedPromise
		expect(uploads).toHaveLength(4)
		expect(uploads.every((upload) => upload.status === UploadStatus.FINISHED)).toBe(true)

		await expect(client.getFileContents('/files/admin/test-multi/a.txt', { format: 'text' })).resolves.toBe('content-a')
		await expect(client.getFileContents('/files/admin/test-multi/b.txt', { format: 'text' })).resolves.toBe('content-b')
		await expect(client.getFileContents('/files/admin/test-multi/c.txt', { format: 'text' })).resolves.toBe('content-c')
	})

	it('should upload a new folder structure', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-folder').catch(() => {})
		await client.createDirectory('/files/admin/test-folder')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-folder`,
		})
		const uploader = new Uploader(false, folder)

		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		await uploader.batchUpload('', [
			fileWithPath('root file', 'root.txt'),
			fileWithPath('nested file', 'subdir/nested.txt'),
			fileWithPath('deep file', 'subdir/deep/deep.txt'),
		])
		await finishedPromise

		await expect(client.stat('/files/admin/test-folder')).resolves.toEqual(expect.objectContaining({ type: 'directory' }))
		await expect(client.getFileContents('/files/admin/test-folder/root.txt', { format: 'text' })).resolves.toBe('root file')
		await expect(client.getFileContents('/files/admin/test-folder/subdir/nested.txt', { format: 'text' })).resolves.toBe('nested file')
		await expect(client.getFileContents('/files/admin/test-folder/subdir/deep/deep.txt', { format: 'text' })).resolves.toBe('deep file')
	})

	it('should upload a folder structure into a subfolder', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-folder').catch(() => {})
		await client.createDirectory('/files/admin/test-folder')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-folder`,
		})
		const uploader = new Uploader(false, folder)

		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		await uploader.batchUpload('upload', [
			fileWithPath('root file', 'root.txt'),
			fileWithPath('nested file', 'subdir/nested.txt'),
			fileWithPath('deep file', 'subdir/deep/deep.txt'),
		])
		await finishedPromise

		await expect(client.stat('/files/admin/test-folder/upload')).resolves.toEqual(expect.objectContaining({ type: 'directory' }))
		await expect(client.getFileContents('/files/admin/test-folder/upload/root.txt', { format: 'text' })).resolves.toBe('root file')
		await expect(client.getFileContents('/files/admin/test-folder/upload/subdir/nested.txt', { format: 'text' })).resolves.toBe('nested file')
		await expect(client.getFileContents('/files/admin/test-folder/upload/subdir/deep/deep.txt', { format: 'text' })).resolves.toBe('deep file')
	})

	it('should upload a folder structure into an existing subfolder', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-folder').catch(() => {})
		await client.createDirectory('/files/admin/test-folder')
		await client.createDirectory('/files/admin/test-folder/upload')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-folder`,
		})
		const uploader = new Uploader(false, folder)

		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		await uploader.batchUpload('upload', [
			fileWithPath('root file', 'root.txt'),
			fileWithPath('nested file', 'subdir/nested.txt'),
			fileWithPath('deep file', 'subdir/deep/deep.txt'),
		])
		await finishedPromise

		await expect(client.stat('/files/admin/test-folder/upload')).resolves.toEqual(expect.objectContaining({ type: 'directory' }))
		await expect(client.getFileContents('/files/admin/test-folder/upload/root.txt', { format: 'text' })).resolves.toBe('root file')
		await expect(client.getFileContents('/files/admin/test-folder/upload/subdir/nested.txt', { format: 'text' })).resolves.toBe('nested file')
		await expect(client.getFileContents('/files/admin/test-folder/upload/subdir/deep/deep.txt', { format: 'text' })).resolves.toBe('deep file')
	})

	it('should upload all files of a dropped folder with more entries than one `readEntries` call returns', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-drop').catch(() => {})
		await client.createDirectory('/files/admin/test-drop')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-drop`,
		})
		const uploader = new Uploader(false, folder)

		// Chromium returns at most 100 entries per `readEntries` call,
		// so a folder with more entries is only fully read if `readEntries` is called repeatedly.
		const files = Object.fromEntries(Array.from({ length: 150 }, (_, index) => [`file-${index}.txt`, `content-${index}`]))
		const entry = await createDirectoryEntry(files)

		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		await uploader.batchUpload('', [entry])
		await finishedPromise

		const contents = await client.getDirectoryContents(`/files/admin/test-drop/${entry.name}`) as FileStat[]
		const uploaded = contents.filter(({ type }) => type === 'file').map(({ basename }) => basename)
		expect(uploaded.sort()).toEqual(Object.keys(files).sort())
		await expect(client.getFileContents(`/files/admin/test-drop/${entry.name}/file-149.txt`, { format: 'text' })).resolves.toBe('content-149')
	}, 120_000)

	it('should track upload status transitions', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-status').catch(() => {})
		await client.createDirectory('/files/admin/test-status')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-status`,
		})
		const uploader = new Uploader(false, folder)
		uploader.pause()

		const upload = await uploader.upload('status.txt', new File(['content'], 'status.txt'))

		// upload() returns after start() queues the job — status is SCHEDULED at this point
		expect(upload.status).toBe(UploadStatus.SCHEDULED)
		uploader.start()

		const observedStatuses: number[] = [upload.status]
		upload.addEventListener('progress', () => {
			observedStatuses.push(upload.status)
		})
		await new Promise<void>((resolve) => upload.addEventListener('finished', () => {
			observedStatuses.push(upload.status)
			resolve()
		}))

		expect(observedStatuses).toContain(UploadStatus.UPLOADING)
		expect(upload.status).toBe(UploadStatus.FINISHED)
	})

	it('should emit uploader-level events', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-events').catch(() => {})
		await client.createDirectory('/files/admin/test-events')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-events`,
		})
		const uploader = new Uploader(false, folder)

		const events: string[] = []
		uploader.addEventListener('uploadStarted', () => {
			events.push('uploadStarted')
		})
		uploader.addEventListener('uploadProgress', () => {
			events.push('uploadProgress')
		})
		uploader.addEventListener('uploadFinished', () => {
			events.push('uploadFinished')
		})

		const finishedPromise = new Promise<void>((resolve) => {
			uploader.addEventListener('finished', () => {
				events.push('finished')
				resolve()
			})
		})

		await uploader.upload('event.txt', new File(['data'], 'event.txt'))
		await finishedPromise

		expect(events).toContain('uploadStarted')
		expect(events).toContain('uploadFinished')
		expect(events).toContain('finished')
	})

	it('should expose upload statistics', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-stats').catch(() => {})
		await client.createDirectory('/files/admin/test-stats')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-stats`,
		})
		const uploader = new Uploader(false, folder)

		// Before any upload the statistics are at their defaults
		expect(uploader.statistics).toEqual({
			eta: Infinity,
			progress: 0,
			speed: -1,
			speedReadable: '',
		})

		// Capture the progress reported by the statistics while uploading
		const observedProgress: number[] = []
		uploader.addEventListener('uploadProgress', () => {
			observedProgress.push(uploader.statistics.progress)
		})

		// Upload a 9 MiB file: large enough that the request body is streamed in several
		// progress events, but below the default 10 MiB chunk size so it stays a single
		// upload with monotonically increasing progress. This lets us assert that the
		// statistics are updated *during* the upload, not only once it has finished.
		const content = 'x'.repeat(9 * 1024 * 1024)
		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		const upload = await uploader.upload('large.txt', new File([content], 'large.txt', { type: 'text/plain' }))
		await finishedPromise

		expect(upload.status).toBe(UploadStatus.FINISHED)

		// The statistics were updated several times while uploading …
		expect(observedProgress.length).toBeGreaterThan(1)
		// … with at least one intermediate value reported during (not only at the end of) the upload …
		expect(observedProgress.some((progress) => progress > 0 && progress < 100)).toBe(true)
		// … and finally reached completion.
		expect(Math.max(...observedProgress)).toBe(100)

		// Once all uploads are finished the uploader resets its statistics back to the defaults
		expect(uploader.statistics).toEqual({
			eta: Infinity,
			progress: 0,
			speed: -1,
			speedReadable: '',
		})

		await expect(client.getFileContents('/files/admin/test-stats/large.txt', { format: 'text' })).resolves.toBe(content)
	})

	it('should report the progress of a chunked upload without exceeding the file size', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-chunked-progress').catch(() => {})
		await client.createDirectory('/files/admin/test-chunked-progress')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-chunked-progress`,
		})
		const uploader = new Uploader(false, folder)

		// Pause so all chunks are queued before the listeners are attached,
		// this way no progress event can be missed.
		await uploader.pause()

		// 21 MiB exceeds the default 10 MiB chunk size, so this is uploaded in multiple chunks
		const content = 'x'.repeat(21 * 1024 * 1024)
		const upload = await uploader.upload('chunked.txt', new File([content], 'chunked.txt', { type: 'text/plain' }))
		expect(upload.isChunked).toBe(true)

		const observedBytes: number[] = []
		upload.addEventListener('progress', () => {
			observedBytes.push(upload.uploadedBytes)
		})
		const observedProgress: number[] = []
		uploader.addEventListener('uploadProgress', () => {
			observedProgress.push(uploader.statistics.progress)
		})

		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		uploader.start()
		await finishedPromise

		expect(upload.status).toBe(UploadStatus.FINISHED)
		// Every chunk reported progress …
		expect(observedBytes.length).toBeGreaterThan(1)
		// … but no chunk ever accounted more than the total size of the file …
		expect(Math.max(...observedBytes)).toBeLessThanOrEqual(upload.totalBytes)
		expect(Math.max(...observedProgress)).toBeLessThanOrEqual(100)
		// … and in the end all bytes are accounted for exactly once.
		expect(upload.uploadedBytes).toBe(upload.totalBytes)
		expect(Math.max(...observedProgress)).toBe(100)

		await expect(client.getFileContents('/files/admin/test-chunked-progress/chunked.txt', { format: 'text' })).resolves.toBe(content)
	})

	it('should not report a chunked upload as finished before it is assembled', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-chunked-status').catch(() => {})
		await client.createDirectory('/files/admin/test-chunked-status')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-chunked-status`,
		})
		const uploader = new Uploader(false, folder)
		await uploader.pause()

		const content = 'x'.repeat(21 * 1024 * 1024)
		const upload = await uploader.upload('chunked.txt', new File([content], 'chunked.txt', { type: 'text/plain' }))
		expect(upload.isChunked).toBe(true)

		const observedStatuses: number[] = []
		upload.addEventListener('progress', () => {
			observedStatuses.push(upload.status)
		})

		const finishedPromise = new Promise<void>((resolve) => uploader.addEventListener('finished', () => resolve()))
		uploader.start()
		await finishedPromise

		// While any chunk is still transferred the upload is uploading …
		expect(observedStatuses).toContain(UploadStatus.UPLOADING)
		// … a single finished chunk must not mark the whole file as finished …
		expect(observedStatuses).not.toContain(UploadStatus.FINISHED)
		// … only once the server assembled all chunks the upload is finished.
		expect(upload.status).toBe(UploadStatus.FINISHED)
	})

	it('should cancel a queued upload', async () => {
		const client = getClient()
		await client.deleteFile('/files/admin/test-cancel').catch(() => {})
		await client.createDirectory('/files/admin/test-cancel')

		const folder = new Folder({
			owner: 'admin',
			root: '/files/admin',
			source: `${defaultRemoteURL}/files/admin/test-cancel`,
		})
		const uploader = new Uploader(false, folder)

		// Pause so the job sits in the queue without starting
		await uploader.pause()
		expect(uploader.status).toBe(UploaderStatus.PAUSED)

		// upload() returns after start() adds the job to the queue — status is SCHEDULED
		const upload = await uploader.upload('cancel.txt', new File(['content'], 'cancel.txt'))
		expect(upload.status).toBe(UploadStatus.SCHEDULED)

		upload.cancel()
		expect(upload.status).toBe(UploadStatus.CANCELLED)

		// Resume so the queued job runs and fires 'finished' with CANCELLED status
		uploader.start()
		await new Promise((resolve) => upload.addEventListener('finished', resolve))

		expect(upload.status).toBe(UploadStatus.CANCELLED)
		expect(await client.exists('/files/admin/test-cancel/cancel.txt')).toBe(false)
	})
})

/**
 * Create a File with a custom webkitRelativePath for simulating folder-input uploads.
 * webkitRelativePath is a read-only prototype getter, so we shadow it with an own property.
 *
 * @param content - The file content
 * @param relativePath - The relative path to set on the file, e.g. 'subdir/file.txt'
 */
function fileWithPath(content: string, relativePath: string): File {
	const name = relativePath.split('/').at(-1)!
	const file = new File([content], name)
	Object.defineProperty(file, 'webkitRelativePath', { value: relativePath, configurable: true })
	return file
}
