import { File } from '../../lib/files/file'
import { FileType } from '../../lib/files/fileType'
import { Permission } from '../../lib/permissions'

describe('File creation', () => {
	test('Valid dav file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma'
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
		expect(file.dirname).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos')
		expect(file.root).toBe('/files/emma/Photos')
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
			owner: 'emma'
		})

		expect(file.basename).toBe('picture.jpg')
		expect(file.dirname).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos')
		expect(file.root).toBe('/files/emma/Photos')

		file.rename('picture-old.jpg')

		expect(file.basename).toBe('picture-old.jpg')
		expect(file.dirname).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos')
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture-old.jpg')
		expect(file.root).toBe('/files/emma/Photos')
	})

	test('Changing source', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma'
		})

		expect(file.basename).toBe('picture.jpg')
		expect(file.dirname).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos')
		expect(file.root).toBe('/files/emma/Photos')

		file.move('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/picture-old.jpg')

		expect(file.basename).toBe('picture-old.jpg')
		expect(file.dirname).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures')
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Pictures/picture-old.jpg')
		expect(file.root).toBe('/files/emma/Pictures')
	})
})
