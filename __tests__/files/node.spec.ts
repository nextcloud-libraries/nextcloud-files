import { File } from '../../lib/files/file'
import { Folder } from '../../lib/files/folder'
import NodeData, { Attribute } from '../../lib/files/nodeData'

describe('Node testing', () => {
	test('Root null fallback', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma'
		})
		expect(file.root).toBeNull()
	})

	test('Remove source ending slash', () => {
		const file = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			owner: 'emma'
		})
		expect(file.source).toBe('https://cloud.domain.com/remote.php/dav/files/emma/Photos')
	})

	test('Invalid rename', () => {
		const file = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			owner: 'emma'
		})
		expect(() => file.rename('new/folder')).toThrowError('Invalid basename')
	})
})

describe('FileId attribute', () => {
	test('FileId null fallback', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma'
		})
		expect(file.fileid).toBeUndefined()
	})

	test('FileId source ending slash', () => {
		const file = new Folder({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/',
			mime: 'image/jpeg',
			owner: 'emma',
			attributes: {
				fileid: 1234
			}
		})
		expect(file.fileid).toBe(1234)
	})
})

describe('Sanity checks', () => {
	test('Invalid id', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			id: '1234' as unknown as number,
		})).toThrowError('Invalid id type of value')

		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			id: -1234,
		})).toThrowError('Invalid id type of value')
	})

	test('Invalid source', () => {
		expect(() => new File({} as unknown as NodeData)).toThrowError('Missing mandatory source')
		expect(() => new File({
			source: 'cloud.domain.com/remote.php/dav/Photos',
			mime: 'image/jpeg',
			owner: 'emma'
		})).toThrowError('Invalid source')
		expect(() => new File({
			source: '/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma'
		})).toThrowError('Invalid source')

	})

	test('Invalid mtime', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/Photos',
			mime: 'image',
			owner: 'emma',
			mtime: 'invalid' as unknown as Date
		})).toThrowError('Invalid mtime type')
	})


	test('Invalid crtime', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/Photos',
			mime: 'image',
			owner: 'emma',
			crtime: 'invalid' as unknown as Date
		})).toThrowError('Invalid crtime type')
	})

	test('Invalid mime', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image',
			owner: 'emma'
		})).toThrowError('Missing or invalid mandatory mime')
	})

	test('Invalid attributes', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			attributes: 'test' as unknown as Attribute,
		})).toThrowError('Invalid attributes format')
	})

	test('Invalid permissions', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			permissions: 324 as unknown as number,
		})).toThrowError('Invalid permissions')
	})

	test('Invalid size', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			size: 'test' as unknown as number,
		})).toThrowError('Invalid size type')
	})

	test('Invalid owner', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: true as unknown as string,
		})).toThrowError('Invalid owner')
	})

	test('Invalid root', () => {
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: true as unknown as string,
		})).toThrowError('Invalid root format')
		expect(() => new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: 'https://cloud.domain.com/remote.php/dav/',
		})).toThrowError('Root must start with a leading slash')
	})
})

describe('Dav service detection', () => {
	test('Known dav services', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file1.isDavRessource).toBe(true)

		const file2 = new File({
			source: 'https://cloud.domain.com/remote.php/webdav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file2.isDavRessource).toBe(true)

		const file3 = new File({
			source: 'https://cloud.domain.com/public.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file3.isDavRessource).toBe(true)

		const file4 = new File({
			source: 'https://cloud.domain.com/public.php/webdav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file4.isDavRessource).toBe(true)
	})

	test('Custom dav service', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/test.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		}, /test\.php\/dav/)
		expect(file1.isDavRessource).toBe(true)

		const file2 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		}, /test\.php\/dav/)
		expect(file2.isDavRessource).toBe(false)
	})
})


describe('Root and paths detection', () => {
	test('Unknown root', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
		})
		expect(file1.root).toBe('/files/emma/Photos')
		expect(file1.dirname).toBe('/')
	})

	test('Provided root dav service', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma',
		})
		expect(file1.root).toBe('/files/emma')
		expect(file1.dirname).toBe('/Photos')
	})

	test('Root with ending slash is removed', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma/',
		})
		expect(file1.root).toBe('/files/emma')
	})

	test('Root and source are the same', () => {
		const file1 = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			root: '/files/emma',
		})
		expect(file1.dirname).toBe('/')
	})
})