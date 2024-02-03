import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { readFile } from 'node:fs/promises'

import { File, Folder, davRemoteURL, davGetFavoritesReport, davRootPath, getFavoriteNodes, davResultToNode } from '../../lib'
import { FileStat } from 'webdav'
import * as auth from '@nextcloud/auth'

// required as default URL will be the DOM URL class which will use the window.location
import { URL as FileURL } from 'node:url'

vi.mock('@nextcloud/auth')
vi.mock('@nextcloud/router')

afterAll(() => {
	vi.resetAllMocks()
})

describe('DAV functions', () => {
	test('root path is correct', () => {
		expect(davRootPath).toBe('/files/test')
	})

	test('remote url is correct', () => {
		expect(davRemoteURL).toBe('https://localhost/dav')
	})
})

describe('davResultToNode', () => {
	afterEach(() => {
		vi.resetAllMocks()
	})

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

	test('path does not contain root', () => {
		const node = davResultToNode(result)
		expect(node.basename).toBe(result.basename)
		expect(node.extension).toBe('.md')
		expect(node.source).toBe('https://localhost/dav/files/test/New folder/Neue Textdatei.md')
		expect(node.root).toBe(davRootPath)
		expect(node.path).toBe('/New folder/Neue Textdatei.md')
		expect(node.dirname).toBe('/New folder')
		expect(node.size).toBe(123)
		expect(node.mtime?.getTime()).toBe(Date.parse(result.lastmod))
		expect(node.mime).toBe(result.mime)
	})

	test('has correct root set', () => {
		const remoteResult = { ...result, filename: '/root/New folder/Neue Textdatei.md' }
		const node = davResultToNode(remoteResult, '/root')
		expect(node.basename).toBe(remoteResult.basename)
		expect(node.extension).toBe('.md')
		expect(node.root).toBe('/root')
		expect(node.source).toBe('https://localhost/dav/root/New folder/Neue Textdatei.md')
		expect(node.path).toBe('/New folder/Neue Textdatei.md')
		expect(node.dirname).toBe('/New folder')
	})

	test('has correct remote path set', () => {
		const remoteResult = { ...result, filename: '/root/New folder/Neue Textdatei.md' }
		const node = davResultToNode(remoteResult, '/root', 'http://example.com/dav')
		expect(node.basename).toBe(remoteResult.basename)
		expect(node.extension).toBe('.md')
		expect(node.source).toBe('http://example.com/dav/root/New folder/Neue Textdatei.md')
		expect(node.path).toBe('/New folder/Neue Textdatei.md')
		expect(node.dirname).toBe('/New folder')
	})

	// If owner-id is set, it will be used as owner
	test('has correct owner set', () => {
		vi.spyOn(auth, 'getCurrentUser').mockReturnValue({ uid: 'user1', displayName: 'User 1', isAdmin: false })

		result.props = { ...result.props, ...{ 'owner-id': 'user1' } } as FileStat['props']
		const remoteResult = { ...result, filename: '/root/New folder/Neue Textdatei.md' }
		const node = davResultToNode(remoteResult, '/root', 'http://example.com/remote.php/dav')

		expect(node.isDavRessource).toBe(true)
		expect(node.owner).toBe('user1')
	})

	test('has correct owner set if number', () => {
		vi.spyOn(auth, 'getCurrentUser').mockReturnValue({ uid: 'admin', displayName: 'admin', isAdmin: true })

		result.props = { ...result.props, ...{ 'owner-id': 123456789 } } as FileStat['props']
		const remoteResult = { ...result, filename: '/root/New folder/Neue Textdatei.md' }
		const node = davResultToNode(remoteResult, '/root', 'http://example.com/remote.php/dav')

		expect(node.isDavRessource).toBe(true)
		expect(node.owner).toBe('123456789')
	})
})

describe('DAV requests', () => {
	beforeEach(() => {
		vi.spyOn(auth, 'getCurrentUser').mockReturnValue({ uid: 'user1', displayName: 'User 1', isAdmin: false })
	})

	afterEach(() => {
		vi.resetAllMocks()
	})

	test('request all favorite files', async () => {
		const favoritesResponseJSON = JSON.parse((await readFile(new FileURL('../fixtures/favorites-response.json', import.meta.url))).toString())

		// Mock the WebDAV client
		const client = {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			getDirectoryContents: vi.fn((path: string, options: any) => {
				if (options?.details) {
					return {
						data: favoritesResponseJSON,
					}
				}
				return favoritesResponseJSON
			}),
		}

		// Get the favorite nodes
		const nodes = await getFavoriteNodes(client as never)

		// Check client was called correctly
		expect(client.getDirectoryContents).toBeCalled()
		expect(client.getDirectoryContents.mock.lastCall?.at(0)).toBe(`${davRootPath}/`)
		expect(client.getDirectoryContents.mock.lastCall?.at(1)?.data).toBe(davGetFavoritesReport())
		expect(client.getDirectoryContents.mock.lastCall?.at(1)?.headers?.method).toBe('REPORT')

		// Check for correct output
		expect(nodes.length).toBe(2)
		expect(nodes[0] instanceof Folder).toBe(true)
		expect(nodes[0].basename).toBe('Neuer Ordner')
		expect(nodes[0].mtime?.getTime()).toBe(Date.parse('Mon, 24 Jul 2023 16:30:44 GMT'))
		expect(nodes[1] instanceof File).toBe(true)
	})

	test('request inner favorites', async () => {
		const favoritesResponseJSON = JSON.parse((await readFile(new FileURL('../fixtures/favorites-inner-response.json', import.meta.url))).toString())

		// Mock the WebDAV client
		const client = {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			getDirectoryContents: vi.fn((path: string, options: any) => {
				if (options?.details) {
					return {
						data: favoritesResponseJSON,
					}
				}
				return favoritesResponseJSON
			}),
		}

		// Get the favorite nodes
		const nodes = await getFavoriteNodes(client as never, '/Neuer Ordner')

		// Check client was called correctly
		expect(client.getDirectoryContents).toBeCalled()
		expect(client.getDirectoryContents.mock.lastCall?.at(0)).toBe(`${davRootPath}/Neuer Ordner`)
		expect(client.getDirectoryContents.mock.lastCall?.at(1)?.data).toBe(davGetFavoritesReport())
		expect(client.getDirectoryContents.mock.lastCall?.at(1)?.headers?.method).toBe('REPORT')

		// There are no inner nodes
		expect(nodes.length).toBe(0)
	})
})
