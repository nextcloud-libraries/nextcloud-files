/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, it, vi } from 'vitest'
import { defaultRemoteURL, getClient } from '~/dav/index.ts'
import { Folder } from '~/node/index.ts'
import { Uploader, UploaderStatus, UploadStatus } from '~/upload/index.ts'

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

	it('should upload a folder structure', async () => {
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
