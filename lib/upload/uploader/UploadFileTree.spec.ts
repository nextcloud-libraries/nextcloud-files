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
		signal: AbortSignal
		start: ReturnType<typeof vi.fn>
		cancel: ReturnType<typeof vi.fn>
		status: number
	}> = []

	class MockUploadFile {
		public source: string
		public status: number = UploadStatus.INITIALIZED

		#abortController = new AbortController()

		public get signal(): AbortSignal {
			return this.#abortController.signal
		}

		public start = vi.fn(async () => {
			this.status = UploadStatus.FINISHED
		})

		public cancel = vi.fn(() => {
			this.#abortController.abort()
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

	it('keeps sources unencoded but encodes them for requests', async () => {
		// MKCOL fails with 405 so the directories already exist and conflicts need to be resolved
		axiosRequestMock.mockRejectedValue({ response: { status: 405 } })
		isAxiosErrorMock.mockReturnValue(true)

		const conflictCallback = vi.fn(async (nodes: string[]) => Object.fromEntries(nodes.map((node) => [node, node])))

		const directory = new Directory('/destination')
		const folder = new Directory('/destination/sub folder')
		await folder.addChild(new File(['nested'], 'näme #1.txt'))
		await directory.addChildren([folder, new File(['root'], 'a b&c.txt')])

		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		const children = tree.initialize()

		// the sources are the plain (unencoded) names so they can be matched by the conflict callback
		expect(children.map((child) => child.source)).toEqual([
			'/destination/sub folder',
			'/destination/a b&c.txt',
			'/destination/sub folder/näme #1.txt',
		])

		await tree.start(createQueue())

		// the conflict callback receives plain names, not encoded ones
		expect(conflictCallback).toHaveBeenCalledWith(['sub folder', 'a b&c.txt'], '/destination')
		expect(conflictCallback).toHaveBeenCalledWith(['näme #1.txt'], '/destination/sub folder')
		// … while the requests use the encoded URLs
		expect(axiosRequestMock.mock.calls.map(([{ url }]) => url)).toEqual([
			'/destination',
			'/destination/sub%20folder',
		])
		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('skips children that the conflict callback did not return', async () => {
		// MKCOL fails with 405 so the directory already exists and conflicts need to be resolved
		axiosRequestMock.mockRejectedValueOnce({ response: { status: 405 } })
		isAxiosErrorMock.mockReturnValue(true)

		// The callback keeps the existing version of 'root.txt' by not returning it
		const conflictCallback = vi.fn(async (nodes: string[]) => Object.fromEntries(nodes
			.filter((node) => node !== 'root.txt')
			.map((node) => [node, node])))

		const directory = new Directory('/destination')
		await directory.addChildren([
			new File(['root'], 'root.txt'),
			new File(['other'], 'other.txt'),
		])

		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		tree.initialize()

		const queue = createQueue()

		await tree.start(queue)

		expect(conflictCallback).toHaveBeenCalledOnce()
		expect(conflictCallback).toHaveBeenCalledWith(['root.txt', 'other.txt'], '/destination')

		// the skipped upload is not started but cancelled, the other one is uploaded
		expect(uploadFileMocks.instances[0].source).toBe('/destination/root.txt')
		expect(uploadFileMocks.instances[0].start).not.toHaveBeenCalled()
		expect(uploadFileMocks.instances[0].status).toBe(UploadStatus.CANCELLED)
		expect(uploadFileMocks.instances[1].source).toBe('/destination/other.txt')
		expect(uploadFileMocks.instances[1].start).toHaveBeenCalledOnce()

		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('skips whole folders - including their children - that the conflict callback did not return', async () => {
		// MKCOL fails with 405 so the directory already exists and conflicts need to be resolved
		axiosRequestMock.mockRejectedValueOnce({ response: { status: 405 } })
		axiosRequestMock.mockResolvedValue({})
		isAxiosErrorMock.mockReturnValue(true)

		// The callback keeps the existing version of the 'folder' directory by not returning it
		const conflictCallback = vi.fn(async (nodes: string[]) => Object.fromEntries(nodes
			.filter((node) => node !== 'folder')
			.map((node) => [node, node])))

		const directory = await createDirectoryTree()
		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		tree.initialize()

		const queue = createQueue()

		await tree.start(queue)

		// the conflict callback is only called for the root, the skipped folder is never entered
		expect(conflictCallback).toHaveBeenCalledOnce()
		expect(conflictCallback).toHaveBeenCalledWith(['folder', 'root.txt'], '/destination')

		const folderUpload = tree.children[0]
		expect(folderUpload.source).toBe('/destination/folder')
		expect(folderUpload.status).toBe(UploadStatus.CANCELLED)

		// no MKCOL for the skipped folder, only the root directory was created
		expect(axiosRequestMock).toHaveBeenCalledOnce()

		// the nested file of the skipped folder is not uploaded
		expect(uploadFileMocks.instances[0].source).toBe('/destination/folder/nested.txt')
		expect(uploadFileMocks.instances[0].start).not.toHaveBeenCalled()
		// but the not skipped root file is
		expect(uploadFileMocks.instances[1].source).toBe('/destination/root.txt')
		expect(uploadFileMocks.instances[1].start).toHaveBeenCalledOnce()

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
