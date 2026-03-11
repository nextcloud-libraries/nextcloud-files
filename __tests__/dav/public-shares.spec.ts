/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { FileStat } from 'webdav'
import type { resultToNode as IResultToNode } from '../../lib/dav/dav.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'

const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))
const router = vi.hoisted(() => ({ generateRemoteUrl: vi.fn() }))
const sharing = vi.hoisted(() => ({ isPublicShare: vi.fn(), getSharingToken: vi.fn() }))

vi.mock('@nextcloud/auth', () => auth)
vi.mock('@nextcloud/router', () => router)
vi.mock('@nextcloud/sharing/public', () => sharing)

function restoreMocks() {
	vi.resetAllMocks()
	router.generateRemoteUrl.mockImplementation((service) => `https://example.com/remote.php/${service}`)
}

function mockPublicShare() {
	auth.getCurrentUser.mockImplementationOnce(() => null)
	sharing.isPublicShare.mockImplementation(() => true)
	sharing.getSharingToken.mockImplementation(() => 'token-1234')
}

describe('DAV path functions', () => {
	beforeEach(() => {
		vi.resetModules()
		restoreMocks()
	})

	test('root path is correct on public shares', async () => {
		mockPublicShare()

		const { getRootPath } = await import('../../lib/dav/dav.ts')
		expect(getRootPath()).toBe('/files/token-1234')
	})

	test('remote URL is correct on public shares', async () => {
		mockPublicShare()

		const { getRemoteURL } = await import('../../lib/dav/dav.ts')
		expect(getRemoteURL()).toBe('https://example.com/public.php/dav')
	})
})

describe('on public shares', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		vi.resetModules()
	})

	// Wrapper function as we can not static import the function to allow mocking the modules
	const resultToNode = async (...rest: Parameters<typeof IResultToNode>) => {
		const { resultToNode } = await import('../../lib/dav/dav.ts')
		return resultToNode(...rest)
	}

	/*
	* Result of:
	* davGetClient().getDirectoryContents(`${davRootPath}${path}`, { details: true })
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

	describe('resultToNode', () => {
		beforeEach(() => {
			vi.resetModules()
			restoreMocks()
		})

		test('has correct owner set on public shares', async () => {
			mockPublicShare()

			const remoteResult = { ...result, filename: '/root/New folder/Neue Textdatei.md' }
			const node = await resultToNode(remoteResult, '/root', 'http://example.com/remote.php/dav')

			expect(node.isDavResource).toBe(true)
			expect(node.owner).toBe('anonymous')
		})
	})
})
