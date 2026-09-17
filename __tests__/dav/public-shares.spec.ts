/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { FileStat } from 'webdav'

import { beforeAll, describe, expect, test } from 'vitest'
import { getRemoteURL, getRootPath, resultToNode } from '../../lib/dav/dav.ts'
import { setPublicShare } from '../helpers.ts'

beforeAll(() => {
	window._oc_webroot = ''
	setPublicShare('token-1234')
})

describe('DAV path functions on public shares', () => {
	test('root path is correct', () => {
		expect(getRootPath()).toBe('/files/token-1234')
	})

	test('remote URL is correct', () => {
		expect(getRemoteURL()).toBe(`${window.location.origin}/public.php/dav`)
	})
})

describe('resultToNode on public shares', () => {
	/*
	* Result of:
	* davGetClient().getDirectoryContents(`${davRootPath}${path}`, { details: true })
	*/
	const result: FileStat = {
		filename: '/root/New folder/Neue Textdatei.md',
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

	test('has correct owner set', () => {
		const node = resultToNode(result, '/root', 'http://example.com/remote.php/dav')

		expect(node.isDavResource).toBe(true)
		expect(node.owner).toBe('anonymous')
	})
})
