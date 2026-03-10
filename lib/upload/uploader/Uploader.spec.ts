/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Folder } from '../../node/folder.ts'
import { Permission } from '../../permissions.ts'
import { UploadCancelledError } from '../errors/UploadCancelledError.ts'
import { UploadStatus } from './Upload.ts'
import { Uploader, UploaderStatus } from './Uploader.ts'

const nextcloudAuth = vi.hoisted(() => ({
	getCurrentUser: vi.fn(() => ({ uid: 'test', displayName: 'Test', isAdmin: false })),
}))
vi.mock('@nextcloud/auth', () => nextcloudAuth)

const nextcloudCapabilities = vi.hoisted(() => ({
	getCapabilities: vi.fn(() => ({
		files: { chunked_upload: { max_parallel_count: 2 } },
		dav: { public_shares_chunking: true },
	})),
}))
vi.mock('@nextcloud/capabilities', () => nextcloudCapabilities)

const nextcloudAxios = vi.hoisted(() => ({
	default: {
		request: vi.fn(),
	},
	isCancel: vi.fn(() => false),
}))
vi.mock('@nextcloud/axios', () => nextcloudAxios)

const dav = vi.hoisted(() => ({
	getClient: vi.fn(() => ({
		createDirectory: vi.fn(),
	})),
	defaultRemoteURL: 'https://localhost/remote.php/dav',
	defaultRootPath: '/files/test',
}))
vi.mock('../../dav/dav.ts', () => dav)

const uploadUtils = vi.hoisted(() => ({
	getChunk: vi.fn(async (file: File) => new Blob([file], { type: file.type || 'application/octet-stream' })),
	initChunkWorkspace: vi.fn(),
	uploadData: vi.fn(async (_url: string, _blob: Blob, options: any) => {
		options?.onUploadProgress?.({ bytes: 50 })
		return {
			status: 201,
			statusText: 'Created',
			headers: {},
			config: { headers: {} },
			data: { ok: true },
		}
	}),
}))
vi.mock('../utils/upload.ts', () => uploadUtils)

vi.mock('../utils/filesystem.ts', () => ({
	isFileSystemDirectoryEntry: vi.fn(() => false),
	isFileSystemFileEntry: vi.fn(() => false),
}))

vi.mock('../../utils/logger.ts', () => ({
	default: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}))

describe('Uploader', () => {
	beforeEach(() => {
		(window as any).OC = {
			appConfig: {
				files: {
					max_chunk_size: 0,
				},
			},
		}

		nextcloudAuth.getCurrentUser.mockReturnValue({ uid: 'test', displayName: 'Test', isAdmin: false })
		nextcloudCapabilities.getCapabilities.mockReturnValue({
			files: { chunked_upload: { max_parallel_count: 2 } },
			dav: { public_shares_chunking: true },
		})
		nextcloudAxios.isCancel.mockReturnValue(false)
		uploadUtils.getChunk.mockClear()
		uploadUtils.uploadData.mockClear()
		dav.getClient.mockClear()
	})

	afterEach(() => {
		delete (window as any).OC
		vi.restoreAllMocks()
	})

	it('initializes with the default destination for logged in users', () => {
		const uploader = new Uploader()

		expect(uploader.destination).toBeInstanceOf(Folder)
		expect(uploader.destination.owner).toBe('test')
		expect(uploader.root).toBe('https://localhost/remote.php/dav/files/test')
		expect(uploader.info.status).toBe(UploaderStatus.IDLE)
	})

	it('throws when no user is logged in and uploader is not public', () => {
		nextcloudAuth.getCurrentUser.mockReturnValue(null as any)

		expect(() => new Uploader(false)).toThrowError('User is not logged in')
	})

	it('uses anonymous owner in public mode', () => {
		nextcloudAuth.getCurrentUser.mockReturnValue(null as any)
		const uploader = new Uploader(true)

		expect(uploader.destination.owner).toBe('anonymous')
	})

	it('manages custom headers through a cloned public getter', () => {
		const uploader = new Uploader()
		uploader.setCustomHeader('X-NC-Test', '1')

		const headers = uploader.customHeaders
		headers['X-NC-Test'] = '2'

		expect(uploader.customHeaders['X-NC-Test']).toBe('1')

		uploader.deleteCustomerHeader('X-NC-Test')
		expect(uploader.customHeaders['X-NC-Test']).toBeUndefined()
	})

	it('rejects invalid destination values', () => {
		const uploader = new Uploader()

		expect(() => {
			uploader.destination = { type: null, source: '' } as any
		}).toThrowError('Invalid destination folder')
	})

	it('uploads files in regular mode and notifies listeners', async () => {
		const uploader = new Uploader()
		uploader.setCustomHeader('X-NC-Test', 'value')
		const notifier = vi.fn()
		uploader.addNotifier(notifier)

		const file = new File(['x'.repeat(100)], 'report.txt', { type: 'text/plain', lastModified: 1000 })
		const upload = await uploader.upload('/docs/report.txt', file)

		await vi.waitFor(() => {
			expect(upload.status).toBe(UploadStatus.FINISHED)
		})

		expect(upload.uploaded).toBe(upload.size)
		expect(upload.response?.status).toBe(201)
		expect(uploadUtils.getChunk).toHaveBeenCalledTimes(1)
		expect(uploadUtils.uploadData).toHaveBeenCalledTimes(1)
		expect(notifier).toHaveBeenCalledTimes(1)
		expect(notifier).toHaveBeenCalledWith(upload)

		await vi.waitFor(() => {
			expect(uploader.info.status).toBe(UploaderStatus.IDLE)
		})
	})

	it('converts callback cancellation in batch upload to UploadCancelledError', async () => {
		const uploader = new Uploader(false, new Folder({
			id: 1,
			owner: 'test',
			permissions: Permission.ALL,
			root: '/files/test',
			source: 'https://localhost/dav/files/test',
		}))

		const notifier = vi.fn()
		uploader.addNotifier(notifier)
		const file = new File(['data'], 'a.txt', { type: 'text/plain' })

		await expect(uploader.batchUpload('/uploads', [file], {
			callback: async () => false,
		})).rejects.toBeInstanceOf(UploadCancelledError)

		expect(dav.getClient).toHaveBeenCalledTimes(1)
		expect(notifier).toHaveBeenCalledTimes(1)
		expect(notifier.mock.calls[0][0].status).toBe(UploadStatus.CANCELLED)
	})
})
