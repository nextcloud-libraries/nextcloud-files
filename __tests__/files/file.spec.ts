import { File } from '../../lib/files/file'
import { FileType } from '../../lib/files/fileType'
import { Permission } from '../../lib/permissions'

describe('File creation', () => {
	test('Valid dav file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
			crtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
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
		expect(file.isDavRessource).toBe(true)
		expect(file.permissions).toBe(Permission.READ)
	})

	test('Valid dav file with root', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma'
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
		expect(file.isDavRessource).toBe(true)
		expect(file.permissions).toBe(Permission.READ)
	})

	test('Valid remote file', () => {
		const file = new File({
			source: 'https://domain.com/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: null
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
		expect(file.dirname).toBe('https://domain.com/Photos')
		expect(file.root).toBeNull()
		expect(file.isDavRessource).toBe(false)
		expect(file.permissions).toBe(Permission.READ)
	})
})

describe('File data change', () => {
	test('Rename a file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
		})

		expect(file.basename).toBe('picture.jpg')
		expect(file.dirname).toBe('/')
		expect(file.root).toBe('/files/emma/Photos')
		expect(file.mtime?.toISOString()).toBe('2023-01-01T00:00:00.000Z')

		file.rename('picture-old.jpg')

		expect(file.basename).toBe('picture-old.jpg')
		expect(file.dirname).toBe('/')
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture-old.jpg')
		expect(file.root).toBe('/files/emma/Photos')

		// Check that mtime has been updated
		expect(file.mtime?.getDate()).toBe(new Date().getDate())
	})

	test('Moving a file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
		})

		expect(file.basename).toBe('picture.jpg')
		expect(file.dirname).toBe('/')
		expect(file.root).toBe('/files/emma/Photos')
		expect(file.mtime?.toISOString()).toBe('2023-01-01T00:00:00.000Z')

		file.move('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/picture-old.jpg')

		expect(file.basename).toBe('picture-old.jpg')
		expect(file.dirname).toBe('/')
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/picture-old.jpg')
		expect(file.root).toBe('/files/emma/Pictures')

		// Check that mtime has been updated
		expect(file.mtime?.getDate()).toBe(new Date().getDate())
	})

	test('Moving a file to a different folder with root', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma'
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
})


describe('Altering attributes updates mtime', () => {
	test('mtime is updated on existing attribute', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			attributes: {
				test: true
			},
		})
		expect(file.attributes.test).toBe(true)
		file.attributes.test = false
	
		// Check that mtime has been updated
		expect(file.mtime?.getDate()).toBe(new Date().getDate())
		expect(file.attributes.test).toBe(false)
	})

	test('mtime is updated on new attribute', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
		})
		expect(file.attributes.test).toBeFalsy()
		file.attributes.test = true
	
		// Check that mtime has been updated
		expect(file.mtime?.getDate()).toBe(new Date().getDate())
		expect(file.attributes.test).toBe(true)
	})

	test('mtime is updated on deleted attribute', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			attributes: {
				test: true
			},
		})
		expect(file.attributes.test).toBe(true)
		delete file.attributes.test
	
		// Check that mtime has been updated
		expect(file.mtime?.getDate()).toBe(new Date().getDate())
		expect(file.attributes.test).toBeUndefined()
	})
})
