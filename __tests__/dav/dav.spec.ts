import { afterAll, describe, expect, test, vi } from 'vitest'
import { readFile } from 'fs/promises'

import { File, Folder, davDefaultRootUrl, davGetDefaultPropfind, davGetFavoritesReport, davRootPath, getFavoriteNodes } from '../../lib'

vi.mock('@nextcloud/auth')
vi.mock('@nextcloud/router')

afterAll(() => {
	vi.resetAllMocks()
})

describe('DAV functions', () => {
	test('root path is correct', () => {
		expect(davRootPath).toBe('/files/test')
	})

	test('root url is correct', () => {
		expect(davDefaultRootUrl).toBe('https://localhost/dav/files/test')
	})
})

describe('DAV requests', () => {
	test('request all favorite files', async () => {
		const favoritesResponseJSON = JSON.parse((await readFile(new URL('../fixtures/favorites-response.json', import.meta.url))).toString())

		// Mock the WebDAV client
		const client = {
			getDirectoryContents: vi.fn((path: string, options: any) => {
				if (options?.details) {
					return {
						data: favoritesResponseJSON,
					}
				}
				return favoritesResponseJSON
			}),
		}

		const nodes = await getFavoriteNodes(client as never)
		// Check client was called correctly
		expect(client.getDirectoryContents).toBeCalled()
		expect(client.getDirectoryContents.mock.lastCall?.at(0)).toBe('/')
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
		const favoritesResponseJSON = JSON.parse((await readFile(new URL('../fixtures/favorites-inner-response.json', import.meta.url))).toString())

		// Mock the WebDAV client
		const client = {
			getDirectoryContents: vi.fn((path: string, options: any) => {
				if (options?.details) {
					return {
						data: favoritesResponseJSON,
					}
				}
				return favoritesResponseJSON
			}),
		}

		const nodes = await getFavoriteNodes(client as never, '/Neuer Ordner')
		// Check client was called correctly
		expect(client.getDirectoryContents).toBeCalled()
		expect(client.getDirectoryContents.mock.lastCall?.at(0)).toBe('/Neuer Ordner')
		expect(client.getDirectoryContents.mock.lastCall?.at(1)?.data).toBe(davGetDefaultPropfind())
		expect(client.getDirectoryContents.mock.lastCall?.at(1)?.headers?.method).toBe('PROPFIND')
		// There are no inner nodes
		expect(nodes.length).toBe(0)
	})
})
