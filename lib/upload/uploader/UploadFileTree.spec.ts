/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ConflictsCallback } from './UploadFileTree.ts'

import axios from '@nextcloud/axios'
import { CanceledError } from 'axios'
import PQueue from 'p-queue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadCancelledError } from '../errors/UploadCancelledError.ts'
import { UploadFailedError } from '../errors/UploadFailedError.ts'
import { Directory } from '../utils/fileTree.ts'
import { UploadStatus } from './Upload.ts'
import { UploadFileTree } from './UploadFileTree.ts'
import { httpError, mockRequests, requestedUrls, requests } from '~/__tests__/helpers.ts'

beforeEach(() => {
	vi.restoreAllMocks()
	mockRequests()
})

describe('UploadFileTree', () => {
	it('initializes child uploads recursively and exposes a defensive children copy', async () => {
		const tree = new UploadFileTree('/destination', await createDirectoryTree(), {})
		expect(tree.isChunked).toBe(false)
		expect(tree.status).toBe(UploadStatus.INITIALIZED)

		const children = tree.initialize()
		// the direct children followed by their descendants
		expect(children.map((child) => child.source)).toEqual([
			'/destination/folder',
			'/destination/root.txt',
			'/destination/folder/nested.txt',
		])
		expect(tree.children[0]).toBeInstanceOf(UploadFileTree)
		expect(tree.children.map((child) => child.source)).toEqual([
			'/destination/folder',
			'/destination/root.txt',
		])

		// modifying the returned arrays does not affect the tree
		children.pop()
		tree.children.pop()
		expect(tree.children).toHaveLength(2)
	})

	it.each([
		['the default of 5', {}, 5],
		['the configured', { retries: 2 }, 2],
	])('passes %s retries down to nested child uploads', async (_label, options, retries) => {
		const tree = new UploadFileTree('/destination', await createDirectoryTree(), options)
		tree.initialize()

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		// both the direct child file and the one nested in a sub directory
		expect(requests('PUT')).toHaveLength(2)
		for (const upload of requests('PUT')) {
			expect(upload['axios-retry']).toMatchObject({ retries })
		}
	})

	it('cancels child uploads when aborted', async () => {
		const tree = new UploadFileTree('/destination', await createDirectoryTree(), {})
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
		const tree = new UploadFileTree('/destination', await createDirectoryTree(), {})
		const onFinish = vi.fn()
		tree.addEventListener('finished', onFinish)
		const children = tree.initialize()

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		expect(tree.status).toBe(UploadStatus.FINISHED)
		expect(onFinish).toHaveBeenCalledOnce()
		// the directories are created and all files are uploaded
		expect(requestedUrls('MKCOL')).toEqual(['/destination', '/destination/folder'])
		expect(requestedUrls('PUT').toSorted()).toEqual(['/destination/folder/nested.txt', '/destination/root.txt'])
		expect(children.every((child) => child.status === UploadStatus.FINISHED)).toBe(true)

		await expect(tree.start(queue)).rejects.toThrow('Upload already started')
	})

	it('renames children through the conflict callback when MKCOL reports an existing directory', async () => {
		// the directory was created in the meantime
		vi.mocked(axios.request).mockRejectedValueOnce(httpError(405))
		const conflictCallback = vi.fn<ConflictsCallback>(async () => ({ 'root.txt': 'root-renamed.txt' }))

		const directory = new Directory('/destination')
		await directory.addChild(new File(['root'], 'root.txt'))
		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		tree.initialize()

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		expect(conflictCallback).toHaveBeenCalledExactlyOnceWith(['root.txt'], '/destination')
		expect(tree.children[0].source).toBe('/destination/root-renamed.txt')
		expect(requestedUrls('PUT')).toEqual(['/destination/root-renamed.txt'])
		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('rebases already initialized children when a folder is renamed', async () => {
		// every directory already exists so conflicts are resolved on all levels
		vi.mocked(axios.head).mockResolvedValue({})
		const conflictCallback = vi.fn<ConflictsCallback>(async (nodes) => Object.fromEntries(nodes.map((node) => [node, node === 'folder' ? 'folder (2)' : node])))

		const tree = new UploadFileTree('/destination', await createDirectoryTree(), { callback: conflictCallback })
		const [, , nested] = tree.initialize()
		expect(nested.source).toBe('/destination/folder/nested.txt')

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		expect(tree.children[0].source).toBe('/destination/folder (2)')
		// the grandchild was already initialized, but still moved with its parent
		expect(nested.source).toBe('/destination/folder (2)/nested.txt')
		// so the renamed folder is checked - and entered - under its new name
		expect(requestedUrls('HEAD')).toEqual(['/destination', '/destination/folder%20(2)'])
		expect(conflictCallback).toHaveBeenCalledWith(['nested.txt'], '/destination/folder (2)')
		expect(requestedUrls('PUT').toSorted()).toEqual(['/destination/folder%20(2)/nested.txt', '/destination/root.txt'])
		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('keeps sources unencoded but encodes them for requests', async () => {
		// every directory already exists so conflicts are resolved on all levels
		vi.mocked(axios.head).mockResolvedValue({})
		const conflictCallback = vi.fn(keepAll)

		const directory = new Directory('/destination')
		const folder = new Directory('/destination/sub folder')
		await folder.addChild(new File(['nested'], 'näme #1.txt'))
		await directory.addChildren([folder, new File(['root'], 'a b&c.txt')])

		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		const children = tree.initialize()
		// the sources are the plain names, so the conflict callback can match them
		expect(children.map((child) => child.source)).toEqual([
			'/destination/sub folder',
			'/destination/a b&c.txt',
			'/destination/sub folder/näme #1.txt',
		])

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		expect(conflictCallback).toHaveBeenCalledWith(['sub folder', 'a b&c.txt'], '/destination')
		expect(conflictCallback).toHaveBeenCalledWith(['näme #1.txt'], '/destination/sub folder')
		// … while the requests use encoded URLs
		expect(requestedUrls('HEAD')).toEqual(['/destination', '/destination/sub%20folder'])
		expect(requestedUrls('PUT').toSorted()).toEqual(['/destination/a%20b%26c.txt', '/destination/sub%20folder/n%C3%A4me%20%231.txt'])
		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('skips children that the conflict callback did not return', async () => {
		// the root directory already exists so conflicts need to be resolved
		vi.mocked(axios.head).mockResolvedValueOnce({})
		// the callback keeps the existing version of 'root.txt' by not returning it
		const conflictCallback = vi.fn<ConflictsCallback>(async (nodes) => Object.fromEntries(nodes
			.filter((node) => node !== 'root.txt')
			.map((node) => [node, node])))

		const directory = new Directory('/destination')
		await directory.addChildren([
			new File(['root'], 'root.txt'),
			new File(['other'], 'other.txt'),
		])
		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		const [skipped, uploaded] = tree.initialize()

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		expect(conflictCallback).toHaveBeenCalledExactlyOnceWith(['root.txt', 'other.txt'], '/destination')
		// the skipped upload is cancelled instead of started, the other one is uploaded
		expect(skipped.source).toBe('/destination/root.txt')
		expect(skipped.status).toBe(UploadStatus.CANCELLED)
		expect(uploaded.status).toBe(UploadStatus.FINISHED)
		expect(requestedUrls('PUT')).toEqual(['/destination/other.txt'])
		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('skips whole folders - including their children - that the conflict callback did not return', async () => {
		// the root directory already exists so conflicts need to be resolved
		vi.mocked(axios.head).mockResolvedValueOnce({})
		// the callback keeps the existing version of the 'folder' directory by not returning it
		const conflictCallback = vi.fn<ConflictsCallback>(async (nodes) => Object.fromEntries(nodes
			.filter((node) => node !== 'folder')
			.map((node) => [node, node])))

		const tree = new UploadFileTree('/destination', await createDirectoryTree(), { callback: conflictCallback })
		const [folder, rootFile, nested] = tree.initialize()

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		// the conflict callback is only called for the root, the skipped folder is never entered
		expect(conflictCallback).toHaveBeenCalledExactlyOnceWith(['folder', 'root.txt'], '/destination')
		expect(folder.status).toBe(UploadStatus.CANCELLED)
		expect(requestedUrls('HEAD')).toEqual(['/destination'])
		expect(requestedUrls('MKCOL')).toEqual([])
		// the nested file of the skipped folder is not uploaded, but the root file is
		expect(nested.status).toBe(UploadStatus.CANCELLED)
		expect(rootFile.status).toBe(UploadStatus.FINISHED)
		expect(requestedUrls('PUT')).toEqual(['/destination/root.txt'])
		expect(tree.status).toBe(UploadStatus.FINISHED)
	})

	it('cancels the upload when the conflict callback aborts it', async () => {
		// the root directory already exists so conflicts need to be resolved
		vi.mocked(axios.head).mockResolvedValueOnce({})
		const conflictCallback = vi.fn<ConflictsCallback>(async () => false)

		const directory = new Directory('/destination')
		await directory.addChild(new File(['root'], 'root.txt'))
		const tree = new UploadFileTree('/destination', directory, { callback: conflictCallback })
		const [child] = tree.initialize()

		const queue = new PQueue()
		await tree.start(queue)
		await queue.onIdle()

		expect(conflictCallback).toHaveBeenCalledOnce()
		expect(tree.status).toBe(UploadStatus.CANCELLED)
		expect(child.status).toBe(UploadStatus.CANCELLED)
		expect(requestedUrls('PUT')).toEqual([])
	})

	it.each([
		['request cancellation', new CanceledError(), UploadCancelledError, UploadStatus.CANCELLED],
		['tree cancellation', new UploadCancelledError(new Error('cancelled')), UploadCancelledError, UploadStatus.CANCELLED],
		['tree failure', new UploadFailedError(new Error('failed')), UploadFailedError, UploadStatus.FAILED],
	])('propagates %s from child uploads', async (_label, rejection, expectedError, expectedStatus) => {
		const directory = new Directory('/destination')
		await directory.addChild(new File(['root'], 'root.txt'))
		const tree = new UploadFileTree('/destination', directory, {})
		const [child] = tree.initialize()
		vi.spyOn(child, 'start').mockRejectedValueOnce(rejection)
		const cancelSpy = vi.spyOn(child, 'cancel')

		await expect(tree.start(new PQueue())).rejects.toBeInstanceOf(expectedError)
		expect(tree.status).toBe(expectedStatus)
		expect(cancelSpy).toHaveBeenCalledOnce()
	})
})

/**
 * Create a directory tree with a file in the root and one in a nested folder.
 */
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

/**
 * Conflict resolution that keeps all nodes as they are.
 *
 * @param nodes - The nodes to upload
 */
async function keepAll(nodes: string[]): ReturnType<ConflictsCallback> {
	return Object.fromEntries(nodes.map((node) => [node, node]))
}
