import { NewFileMenu, getNewFileMenu, FileType, type Entry } from '../lib/newFileMenu'
import logger from '../lib/utils/logger';

declare global {
	interface Window {
		OC: any;
		_nc_newfilemenu: NewFileMenu;
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
			fileType: 'file' as FileType,
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
			fileType: 'file' as FileType,
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
			fileType: 'file' as FileType,
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
			fileType: 'folder' as FileType,
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
			fileType: 'file' as FileType,
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
				id: 'empty-file',
				displayName: 123456,
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				fileType: 'file' as FileType,
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid entry')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				fileType: 'image' as FileType,
				handler: () => {}
			} as unknown as Entry)
		}).toThrowError('Invalid entry fileType')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				fileType: 'folder' as FileType,
				handler: 'handler'
			} as unknown as Entry)
		}).toThrowError('Invalid entry handler')
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
			fileType: 'file' as FileType,
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
			fileType: 'file' as FileType,
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