import { NewFileMenu, getNewFileMenu, type Entry } from '../lib/newFileMenu'
import logger from '../lib/utils/logger';

declare global {
	interface Window {
		OC: any;
		_nc_newfilemenu: NewFileMenu | undefined;
	}
}

describe('NewFileMenu init', () => {
	test('Initializing NewFileMenu', () => {
		logger.debug = jest.fn()
		const newFileMenu = getNewFileMenu()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewFileMenu)
		expect(window._nc_newfilemenu).toBe(newFileMenu)
		expect(logger.debug).toHaveBeenCalled()
	})

	test('Getting existing NewFileMenu', () => {
		const newFileMenu = new NewFileMenu()
		Object.assign(window, {_nc_newfilemenu: newFileMenu})

		expect(window._nc_newfilemenu).toBe(newFileMenu)
		expect(getNewFileMenu()).toBe(newFileMenu)
	})
})

describe('NewFileMenu addEntry', () => {
	test('Adding a valid Entry', () => {
		const newFileMenu = new NewFileMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {}
		}
		newFileMenu.registerEntry(entry)

		const entries = newFileMenu.getEntries()
		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry)
	})

	test('Adding multiple valid Entries', () => {
		const newFileMenu = new NewFileMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {}
		}
		newFileMenu.registerEntry(entry1)

		expect(newFileMenu.getEntries()).toHaveLength(1)
		expect(newFileMenu.getEntries()[0]).toBe(entry1)

		const entry2 = {
			id: 'image',
			displayName: 'Create new image',
			templateName: 'New drawing.png',
			iconClass: 'icon-filetype-image',
			handler: () => {}
		}
		newFileMenu.registerEntry(entry2)

		expect(newFileMenu.getEntries()).toHaveLength(2)
		expect(newFileMenu.getEntries()[1]).toBe(entry2)

		const entry3 = {
			id: 'folder',
			displayName: 'New folder',
			templateName: 'New folder',
			iconClass: 'icon-folder',
			handler: () => {}
		}
		newFileMenu.registerEntry(entry3)

		expect(newFileMenu.getEntries()).toHaveLength(3)
		expect(newFileMenu.getEntries()[2]).toBe(entry3)
	})

	test('Adding duplicate Entry', () => {
		const newFileMenu = new NewFileMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {}
		}
		newFileMenu.registerEntry(entry)

		const entries = newFileMenu.getEntries()
		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry)

		expect(() => {
			newFileMenu.registerEntry(entry)
		}).toThrowError('Duplicate entry')

		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry)
	})

	test('Adding invalid entry', () => {
		const newFileMenu = new NewFileMenu()
		expect(() => {
			newFileMenu.registerEntry({} as Entry)
		}).toThrowError('Invalid entry')

		expect(() => {
			newFileMenu.registerEntry({
				id: 123456,
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid id or displayName property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: 123456,
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid id or displayName property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 123465,
				iconClass: 'icon-filetype-text',
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid templateName property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 123456,
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid icon provided')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconSvgInline: 123456,
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid icon provided')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				if: true,
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid if property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				handler: 'handler'
			} as unknown as Entry)
		}).toThrowError('Invalid handler property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				iconClass: 'icon-filetype-text',
			} as unknown as Entry)
		}).toThrowError('At least a templateName or a handler must be provided')
	})
})

describe('NewFileMenu removeEntry', () => {
	test('Removing an existing Entry', () => {
		const newFileMenu = new NewFileMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {}
		}
		newFileMenu.registerEntry(entry)

		const entries = newFileMenu.getEntries()
		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry)

		newFileMenu.unregisterEntry(entry)
		expect(entries).toHaveLength(0)
	})

	test('Removing an existing Entry by id', () => {
		const newFileMenu = new NewFileMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {}
		}
		newFileMenu.registerEntry(entry)

		expect(newFileMenu.getEntries()).toHaveLength(1)
		expect(newFileMenu.getEntries()[0]).toBe(entry)

		newFileMenu.unregisterEntry('empty-file')
		expect(newFileMenu.getEntries()).toHaveLength(0)
	})

	test('Removing a non-existing entry', () => {
		logger.warn = jest.fn()
		const newFileMenu = new NewFileMenu()

		newFileMenu.unregisterEntry('unknown-entry')

		expect(newFileMenu.getEntries()).toHaveLength(0)
		expect(logger.warn).toHaveBeenCalled()
	})
})

describe('NewFileMenu getEntries filter', () => {
	test('Filter no entries', () => {
		const newFileMenu = new NewFileMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file',
			iconClass: 'icon-file',
			if: fileInfo => fileInfo.permissions.includes('CK'),
			handler: () => {}
		}
		newFileMenu.registerEntry(entry1)

		const entry2 = {
			id: 'empty-text-md',
			displayName: 'Create new markdown file',
			templateName: 'New text.md',
			iconClass: 'icon-filetype-text',
			if: fileInfo => fileInfo.permissions.includes('CK'),
			handler: () => {}
		}
		newFileMenu.registerEntry(entry2)

		const context = {
			basename:  'Folder',
			etag: '63071eedd82fe',
			fileid: '56',
			filename: '/Folder',
			hasPreview: false,
			lastmod: 1661410576,
			mime: 'httpd/unix-directory',
			month: '197001',
			permissions: 'CKGWDR',
			showShared: false,
			size: 2610077102,
			timestamp: 1661410,
			type: 'dir',
		}

		const entries = newFileMenu.getEntries(context)
		expect(entries).toHaveLength(2)
		expect(entries[0]).toBe(entry1)
		expect(entries[1]).toBe(entry2)
	})

	test('Filter all entries', () => {
		const newFileMenu = new NewFileMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file',
			iconClass: 'icon-file',
			if: fileInfo => fileInfo.permissions.includes('CK'),
			handler: () => {}
		}
		newFileMenu.registerEntry(entry1)

		const entry2 = {
			id: 'empty-text-md',
			displayName: 'Create new markdown file',
			templateName: 'New text.md',
			iconClass: 'icon-filetype-text',
			if: fileInfo => fileInfo.permissions.includes('CK'),
			handler: () => {}
		}
		newFileMenu.registerEntry(entry2)

		const context = {
			basename:  'Shared folder',
			etag: '63071eedd82fe',
			fileid: '56',
			filename: '/Shared folder',
			hasPreview: false,
			lastmod: 1661410576,
			mime: 'httpd/unix-directory',
			month: '197001',
			// Only read and share
			permissions: 'GR',
			showShared: false,
			size: 2610077102,
			timestamp: 1661410,
			type: 'dir',
		}

		const entries = newFileMenu.getEntries(context)
		expect(entries).toHaveLength(0)
	})

	test('Filter some entries', () => {
		const newFileMenu = new NewFileMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create template',
			templateName: 'New file',
			iconClass: 'icon-file',
			// No conditions
			handler: () => {}
		}
		newFileMenu.registerEntry(entry1)

		const entry2 = {
			id: 'empty-text-md',
			displayName: 'Create new markdown file',
			templateName: 'New text.md',
			iconClass: 'icon-filetype-text',
			if: fileInfo => fileInfo.permissions.includes('CK'),
			handler: () => {}
		}
		newFileMenu.registerEntry(entry2)

		const context = {
			basename:  'Shared folder',
			etag: '63071eedd82fe',
			fileid: '56',
			filename: '/Shared folder',
			hasPreview: false,
			lastmod: 1661410576,
			mime: 'httpd/unix-directory',
			month: '197001',
			// Only read and share
			permissions: 'GR',
			showShared: false,
			size: 2610077102,
			timestamp: 1661410,
			type: 'dir',
		}

		const entries = newFileMenu.getEntries(context)
		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry1)
	})
})