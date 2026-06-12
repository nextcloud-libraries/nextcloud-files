/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type PQueue from 'p-queue'

import { CanceledError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadCancelledError } from '../errors/UploadCancelledError.ts'
import { UploadFailedError } from '../errors/UploadFailedError.ts'
import { Directory } from '../utils/fileTree.ts'
import { UploadStatus } from './Upload.ts'

const axiosRequestMock = vi.hoisted(() => vi.fn())
const isAxiosErrorMock = vi.hoisted(() => vi.fn())
const isCancelMock = vi.hoisted(() => vi.fn())

const uploadFileMocks = vi.hoisted(() => {
	const instances: Array<{
		source: string
		start: ReturnType<typeof vi.fn>
		cancel: ReturnType<typeof vi.fn>
		status: number
	}> = []

	class MockUploadFile {
		public source: string
		public status: number = UploadStatus.INITIALIZED
		public start = vi.fn(async () => {
			this.status = UploadStatus.FINISHED
		})

		public cancel = vi.fn(() => {
			this.status = UploadStatus.CANCELLED
		})

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		public constructor(source: string, _file: File, _options: unknown) {
			this.source = source
			instances.push(this)
		}
	}

	return { instances, MockUploadFile }
})

vi.mock('@nextcloud/axios', () => ({
	default: {
		request: axiosRequestMock,
	},
	isCancel: isCancelMock,
	isAxiosError: isAxiosErrorMock,
}))

vi.mock('./UploadFile.ts', () => ({
	UploadFile: uploadFileMocks.MockUploadFile,
}))

import { UploadFileTree } from './UploadFileTree.ts'

function createQueue(): PQueue {
	return {
		add: vi.fn((job: () => Promise<void>) => job()),
	} as never
}

async function createDirectoryTree(): Promise<Directory> {
	const root = new Directory('/destination')
	const folder = new Directory('/destination/folder')
	await folder.addChild(new File(['folder'], 'nested.txt', { lastModified: 1000 }))

	await root.addChildren([
		folder,
		new File(['root'], 'root.txt', { lastModified: 2000 }),
	])

	return root
}

beforeEach(() => {
	axiosRequestMock.mockReset()
	isAxiosErrorMock.mockReset()
	uploadFileMocks.instances.length = 0
})

afterEach(() => {
	vi.restoreAllMocks()
})

describe('UploadFileTree', () => {
	it('initializes child uploads recursively and exposes a defensive children copy', async () => {
		const directory = await createDirectoryTree()
		const tree = new UploadFileTree('/destination', directory, {})

		expect(tree.isChunked).toBe(false)
		expect(tree.status).toBe(UploadStatus.INITIALIZED)

		const children = tree.initialize()
		const snapshot = [...children]

		expect(children).toHaveLength(3)
		expect(tree.children).toHaveLength(2)
		expect(tree.children).not.toBe(children)

		children.pop()
		expect(tree.children).toHaveLength(2)

		expect(tree.children).toHaveLength(2)
		expect(tree.children[0]).toBeInstanceOf(UploadFileTree)
		expect(tree.children.map((child) => child.source)).toEqual([
			'/destination/folder',
			'/destination/root.txt',
		])
		expect(snapshot[0].source).toBe('/destination/folder')
		expect(snapshot[1].source).toBe('/destination/root.txt')
		expect(snapshot[2].source).toBe('/destination/folder/nested.txt')
	})

	it('cancels child uploads when aborted', async () => {
		const directory = await createDirectoryTree()
		const tree = new UploadFileTree('/destination', directory, {})
		tree.initialize()

		const child = tree.children[0] as UploadFileTree
		const cancelSpy = vi.spyOn(child, 'cancel')

		expect(tree.signal.aborted).toBe(false)
		tree.cancel()

		expect(tree.signal.aborted).toBe(true)
		expect(tree.status).toBe(UploadStatus.CANCELLED)
		expect(cancelSpy).toHaveBeenCalledOnce()
		expect(child.signal.aborted).toBe(true)
	})

	it('starts once and marks the upload as finished after child uploads resolve', async () => {
		axiosRequestMock.mockResolvedValue({})
		isAxiosErrorMock.mockReturnValue(false)

		const directory = await createDirectoryTree()
		const tree = new UploadFileTree('/destination', directory, {})
		const onFinish = vi.fn()
		tree.addEventListener('finished', onFinish)
		tree.initialize()

		const queue = createQueue()

		await tree.start(queue)

		expect(axiosRequestMock).toHaveBeenCalledTimes(2)
		expect(tree.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
		expect(uploadFileMocks.instances).toHaveLength(2)
		expect(uploadFileMocks.instances[0].start).toHaveBeenCalledOnce()
		expect(uploadFileMocks.instances[1].start).toHaveBeenCalledOnce()

		await expect(tree.start(queue)).rejects.toThrow('Upload already started')
	})

	it('renames children through the conflict callback when MKCOL reports an existing directory', async () => {
		axiosRequestMock.mockRejectedValueOnce({ response: { status: 405 } })
		isAxiosErrorMock.mockReturnValue(true)

		const conflictCallback = vi.fn(async () => ({
			'root.txt': 'root-renamed.txt',
		}))

		const directory = new Directory('/destination')
		await directory.addChild(new File(['root'], 'root.txt'))

		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		tree.initialize()

		const queue = createQueue()

		await tree.start(queue)

		expect(conflictCallback).toHaveBeenCalledOnce()
		expect(conflictCallback).toHaveBeenCalledWith(['root.txt'], '/destination')
		expect(tree.children[0].source).toBe('/destination/root-renamed.txt')
		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('cancels the upload when the conflict callback aborts it', async () => {
		axiosRequestMock.mockRejectedValueOnce({ response: { status: 405 } })
		isAxiosErrorMock.mockReturnValue(true)

		const conflictCallback = vi.fn(async () => false)
		const directory = new Directory('/destination')
		await directory.addChild(new File(['root'], 'root.txt'))

		const tree = new UploadFileTree(
			'/destination',
			directory,
			// @ts-expect-error -- mocked for testing purposes
			{ callback: conflictCallback },
		)
		tree.initialize()

		const queue = createQueue()

		await tree.start(queue)

		expect(conflictCallback).toHaveBeenCalledOnce()
		expect(tree.status).toBe(UploadStatus.CANCELLED)
		expect(uploadFileMocks.instances[0].start).not.toHaveBeenCalled()
	})

	it.each([
		['request cancellation', new CanceledError()],
		['tree cancellation', new UploadCancelledError(new Error('cancelled'))],
		['tree failure', new UploadFailedError(new Error('failed'))],
	])('propagates %s from child uploads', async (_label, rejection) => {
		axiosRequestMock.mockResolvedValue({})
		isAxiosErrorMock.mockReturnValue(false)
		isCancelMock.mockImplementation((error: unknown) => error instanceof CanceledError)

		const directory = new Directory('/destination')
		await directory.addChild(new File(['root'], 'root.txt'))

		const tree = new UploadFileTree('/destination', directory, {})
		tree.initialize()
		uploadFileMocks.instances[0].start.mockRejectedValueOnce(rejection)

		const queue = createQueue()

		if (rejection instanceof CanceledError) {
			await expect(tree.start(queue)).rejects.toBeInstanceOf(UploadCancelledError)
		} else {
			await expect(tree.start(queue)).rejects.toBe(rejection)
		}

		if (rejection instanceof UploadFailedError) {
			expect(tree.status).toBe(UploadStatus.FAILED)
		} else {
			expect(tree.status).toBe(UploadStatus.CANCELLED)
		}
		expect(uploadFileMocks.instances[0].cancel).toHaveBeenCalledOnce()
	})
})
