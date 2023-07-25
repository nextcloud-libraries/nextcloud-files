import { describe, expect, test } from 'vitest'

import { Folder } from '../../lib/files/folder'
import { FileType } from '../../lib/files/fileType'
import { Permission } from '../../lib/permissions'

describe('Folder creation', () => {
	test('Valid dav folder', () => {
		const folder = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			owner: 'emma',
		})

		expect(folder).toBeInstanceOf(Folder)
		expect(folder.type).toBe(FileType.Folder)

		// various data
		expect(folder.mime).toBe('httpd/unix-directory')
		expect(folder.owner).toBe('emma')
		expect(folder.size).toBeUndefined()
		expect(folder.attributes).toStrictEqual({})

		// path checks
		expect(folder.basename).toBe('Photos')
		expect(folder.extension).toBeNull()
		expect(folder.dirname).toBe('/')
		expect(folder.root).toBe('/files/emma')
		expect(folder.isDavRessource).toBe(true)
		expect(folder.permissions).toBe(Permission.NONE)
	})

	test('Valid dav folder with root', () => {
		const folder = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/Berlin',
			owner: 'emma',
			root: '/files/emma',
		})

		expect(folder).toBeInstanceOf(Folder)
		expect(folder.type).toBe(FileType.Folder)

		// various data
		expect(folder.mime).toBe('httpd/unix-directory')
		expect(folder.owner).toBe('emma')
		expect(folder.size).toBeUndefined()
		expect(folder.attributes).toStrictEqual({})

		// path checks
		expect(folder.basename).toBe('Berlin')
		expect(folder.extension).toBeNull()
		expect(folder.dirname).toBe('/Photos')
		expect(folder.root).toBe('/files/emma')
		expect(folder.isDavRessource).toBe(true)
		expect(folder.permissions).toBe(Permission.NONE)
	})

	test('Valid remote folder', () => {
		const folder = new Folder({
			source: 'https://domain.com/Photos/',
			owner: null,
		})

		expect(folder).toBeInstanceOf(Folder)
		expect(folder.type).toBe(FileType.Folder)

		// various data
		expect(folder.mime).toBe('httpd/unix-directory')
		expect(folder.owner).toBeNull()
		expect(folder.size).toBeUndefined()
		expect(folder.attributes).toStrictEqual({})

		// path checks
		expect(folder.basename).toBe('Photos')
		expect(folder.extension).toBeNull()
		expect(folder.dirname).toBe('/')
		expect(folder.root).toBeNull()
		expect(folder.isDavRessource).toBe(false)
		expect(folder.permissions).toBe(Permission.READ)
	})
})

describe('Folder data change', () => {
	test('Rename a folder', () => {
		const folder = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos',
			owner: 'emma',
		})

		expect(folder.basename).toBe('Photos')
		expect(folder.dirname).toBe('/')
		expect(folder.root).toBe('/files/emma')

		folder.rename('Pictures')

		expect(folder.basename).toBe('Pictures')
		expect(folder.dirname).toBe('/')
		expect(folder.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures')
		expect(folder.root).toBe('/files/emma')
	})

	test('Moving a folder', () => {
		const folder = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			owner: 'emma',
		})

		expect(folder.basename).toBe('Photos')
		expect(folder.dirname).toBe('/')
		expect(folder.root).toBe('/files/emma')

		folder.move('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/')

		expect(folder.basename).toBe('Pictures')
		expect(folder.dirname).toBe('/')
		expect(folder.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures')
		expect(folder.root).toBe('/files/emma')
	})

	test('Moving a folder to a different location with root', () => {
		const folder = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			owner: 'emma',
			root: '/files/emma',
		})

		expect(folder.basename).toBe('Photos')
		expect(folder.dirname).toBe('/')
		expect(folder.root).toBe('/files/emma')

		folder.move('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/1/2/3')

		expect(folder.basename).toBe('3')
		expect(folder.dirname).toBe('/Pictures/1/2')
		expect(folder.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/1/2/3')
		expect(folder.root).toBe('/files/emma')
	})
})
