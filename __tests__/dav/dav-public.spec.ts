/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { FileStat } from 'webdav'
import type { davResultToNode } from '../../lib/dav/dav'
import { ArgumentsType, beforeEach, describe, expect, test, vi } from 'vitest'
import { isPublicShare } from '../../lib'

const initialState = vi.hoisted(() => ({ loadState: vi.fn() }))
const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))

vi.mock('@nextcloud/auth', () => auth)
vi.mock('@nextcloud/initial-state', () => initialState)

// Wrapper function as we can not static import the function to allow mocking the modules
const resultToNode = async (...rest: ArgumentsType<typeof davResultToNode>) => {
	const { davResultToNode } = await import('../../lib/dav/dav')
	return davResultToNode(...rest)
}

/* Result of:
	davGetClient().getDirectoryContents(`${davRootPath}${path}`, { details: true })
	 */
const result: FileStat = {
	filename: '/files/test/New folder/Neue Textdatei.md',
	basename: 'Neue Textdatei.md',
	lastmod: 'Tue, 25 Jul 2023 12:29:34 GMT',
	size: 123,
	type: 'file',
	etag: '7a27142de0a62ed27a7293dbc16e93bc',
	mime: 'text/markdown',
	props: {
		resourcetype: { collection: false },
		displayname: 'New File',
		getcontentlength: '123',
		getcontenttype: 'text/markdown',
		getetag: '"7a27142de0a62ed27a7293dbc16e93bc"',
		getlastmodified: 'Tue, 25 Jul 2023 12:29:34 GMT',
	},
}

describe('on public shares', () => {
	describe('isPublicShare', () => {
		test('no public share', async () => {
			initialState.loadState.mockImplementationOnce(() => null)

			expect(isPublicShare()).toBe(false)
			expect(initialState.loadState).toBeCalledWith('files_sharing', 'isPublic', null)
		})

		test('public share', async () => {
			initialState.loadState.mockImplementationOnce(() => true)

			expect(isPublicShare()).toBe(true)
			expect(initialState.loadState).toBeCalledWith('files_sharing', 'isPublic', null)
		})

		test('legacy public share', async () => {
			const input = document.createElement('input')
			input.id = 'isPublic'
			input.name = 'isPublic'
			input.type = 'hidden'
			input.value = '1'
			document.body.appendChild(input)

			expect(isPublicShare()).toBe(true)
		})
	})

	describe('davResultToNode', () => {
		beforeEach(() => {
			vi.resetModules()
			vi.resetAllMocks()

		})

		test('has correct owner set on public shares', async () => {
			auth.getCurrentUser.mockReturnValueOnce(null)
			initialState.loadState.mockImplementationOnce(() => true)

			const remoteResult = { ...result, filename: '/root/New folder/Neue Textdatei.md' }
			const node = await resultToNode(remoteResult, '/root', 'http://example.com/remote.php/dav')

			expect(node.isDavRessource).toBe(true)
			expect(node.owner).toBe('anonymous')
			expect(initialState.loadState).toBeCalledTimes(1)
			expect(initialState.loadState).toBeCalledWith('files_sharing', 'isPublic', null)
		})

		test('has correct owner set on legacy public shares', async () => {
			auth.getCurrentUser.mockReturnValueOnce(null)
			// no initial state
			initialState.loadState.mockImplementationOnce(() => null)
			// but legacy input element
			const input = document.createElement('input')
			input.id = 'isPublic'
			input.name = 'isPublic'
			input.type = 'hidden'
			input.value = '1'
			document.body.appendChild(input)

			const remoteResult = { ...result, filename: '/root/New folder/Neue Textdatei.md' }
			const node = await resultToNode(remoteResult, '/root', 'http://example.com/remote.php/dav')

			expect(node.isDavRessource).toBe(true)
			expect(node.owner).toBe('anonymous')
		})
	})
})
