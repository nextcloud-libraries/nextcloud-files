/*
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, test } from 'vitest'
import { File, FileType, NodeStatus } from '../../lib/node/index.ts'
import { Permission } from '../../lib/permissions.ts'

describe('File creation', () => {
	test('Valid dav file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
			crtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			status: NodeStatus.NEW,
		})

		expect(file).toBeInstanceOf(File)
		expect(file.type).toBe(FileType.File)

		// various data
		expect(file.mime).toBe('image/jpeg')
		expect(file.owner).toBe('emma')
		expect(file.size).toBeUndefined()
		expect(file.attributes).toStrictEqual({})

		// Times
		expect(file.mtime?.toISOString()).toBe('2023-01-01T00:00:00.000Z')
		expect(file.crtime?.toISOString()).toBe('1990-01-01T00:00:00.000Z')

		// path checks
		expect(file.basename).toBe('picture.jpg')
		expect(file.extension).toBe('.jpg')
		expect(file.dirname).toBe('/')
		expect(file.root).toBe('/files/emma/Photos')
		expect(file.path).toBe('/picture.jpg')
		expect(file.isDavResource).toBe(true)
		expect(file.permissions).toBe(Permission.NONE)
		expect(file.status).toBe(NodeStatus.NEW)
	})

	test('Valid dav file with root', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma',
		})

		expect(file).toBeInstanceOf(File)
		expect(file.type).toBe(FileType.File)

		// various data
		expect(file.mime).toBe('image/jpeg')
		expect(file.owner).toBe('emma')
		expect(file.size).toBeUndefined()
		expect(file.attributes).toStrictEqual({})

		// path checks
		expect(file.basename).toBe('picture.jpg')
		expect(file.extension).toBe('.jpg')
		expect(file.dirname).toBe('/Photos')
		expect(file.root).toBe('/files/emma')
		expect(file.path).toBe('/Photos/picture.jpg')
		expect(file.isDavResource).toBe(true)
		expect(file.permissions).toBe(Permission.NONE)
	})

	test('Valid remote file', () => {
		const file = new File({
			source: 'https://domain.com/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: null,
		})

		expect(file).toBeInstanceOf(File)
		expect(file.type).toBe(FileType.File)

		// various data
		expect(file.mime).toBe('image/jpeg')
		expect(file.owner).toBeNull()
		expect(file.size).toBeUndefined()
		expect(file.attributes).toStrictEqual({})

		// path checks
		expect(file.basename).toBe('picture.jpg')
		expect(file.extension).toBe('.jpg')
		expect(file.dirname).toBe('/Photos')
		expect(file.root).toBeNull()
		expect(file.isDavResource).toBe(false)
		expect(file.permissions).toBe(Permission.READ)
	})
})

describe('File data change', () => {
	test('Rename a file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})

		expect(file.basename).toBe('picture.jpg')
		expect(file.dirname).toBe('/')
		expect(file.root).toBe('/files/emma/Photos')

		file.rename('picture-old.jpg')

		expect(file.basename).toBe('picture-old.jpg')
		expect(file.dirname).toBe('/')
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture-old.jpg')
		expect(file.root).toBe('/files/emma/Photos')
	})

	test('Moving a file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})

		expect(file.basename).toBe('picture.jpg')
		expect(file.dirname).toBe('/')
		expect(file.root).toBe('/files/emma/Photos')

		file.move('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/picture-old.jpg')

		expect(file.basename).toBe('picture-old.jpg')
		expect(file.dirname).toBe('/')
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/picture-old.jpg')
		expect(file.root).toBe('/files/emma/Pictures')
	})

	test('Moving a file to an invalid destination throws', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
		})
		expect(() => {
			file.move('ftp://cloud.domain.com/remote.php/dav/files/emma/Pictures/picture-old.jpg')
		}).toThrowError('Invalid source format, only http(s) is supported')
	})

	test('Moving a file to a different folder with root', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma',
		})

		expect(file.basename).toBe('picture.jpg')
		expect(file.dirname).toBe('/Photos')
		expect(file.root).toBe('/files/emma')

		file.move('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/Old/picture-old.jpg')

		expect(file.basename).toBe('picture-old.jpg')
		expect(file.dirname).toBe('/Pictures/Old')
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/Old/picture-old.jpg')
		expect(file.root).toBe('/files/emma')
	})

	test('Changing status', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma',
		})

		expect(file.status).toBeUndefined()
		file.status = NodeStatus.NEW
		expect(file.status).toBe(NodeStatus.NEW)
	})
})

describe('Altering attributes does NOT updates mtime', () => {
	test('mtime is updated on existing attribute', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			attributes: {
				test: true,
			},
		})
		expect(file.attributes.test).toBe(true)
		file.attributes.test = false

		// Check that mtime has NOT been updated
		expect(file.mtime?.getDate()).toBe(1)
		expect(file.attributes.test).toBe(false)
	})

	test('mtime is NOT updated on new attribute', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
		})
		expect(file.attributes.test).toBeFalsy()
		file.attributes.test = true

		// Check that mtime has NOT been updated
		expect(file.mtime?.getDate()).toBe(1)
		expect(file.attributes.test).toBe(true)
	})

	test('mtime is NOT updated on deleted attribute', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			attributes: {
				test: true,
			},
		})
		expect(file.attributes.test).toBe(true)
		delete file.attributes.test

		// Check that mtime has NOT been updated
		expect(file.mtime?.getDate()).toBe(1)
		expect(file.attributes.test).toBeUndefined()
	})

	test('mtime is NOT updated if not initially defined', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			permissions: Permission.READ,
		})

		expect(file.permissions).toBe(Permission.READ)
		file.permissions = Permission.ALL

		// Check that mtime has been updated
		expect(file.mtime).toBeUndefined()
		expect(file.permissions).toBe(Permission.ALL)
	})

})

describe('Altering top-level properties updates mtime', () => {
	test('mtime is updated on permissions change', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			permissions: Permission.READ,
		})

		expect(file.permissions).toBe(Permission.READ)
		file.permissions = Permission.ALL

		// Check that mtime has been updated
		expect(file.mtime?.getDate()).toBe(new Date().getDate())
		expect(file.permissions).toBe(Permission.ALL)
	})

	test('mtime is updated on size change', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			size: 100,
		})

		expect(file.size).toBe(100)
		file.size = 200

		// Check that mtime has been updated
		expect(file.mtime?.getDate()).toBe(new Date().getDate())
		expect(file.size).toBe(200)
	})

})
