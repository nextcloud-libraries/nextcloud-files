import {
	formatFileSize,
	addNewFileMenuEntry,
	removeNewFileMenuEntry,
	getNewFileMenuEntries,
} from '../lib/index'
import { Entry, NewFileMenu } from '../lib/newFileMenu';

declare global {
	interface Window {
		OC: any;
		_nc_newfilemenu: NewFileMenu;
	}
}

describe('Exports checks', () => {
	test('formatFileSize', () => {
		expect(formatFileSize).toBeTruthy()
		expect(typeof formatFileSize).toBe('function')
	})

	test('addNewFileMenuEntry', () => {
		expect(addNewFileMenuEntry).toBeTruthy()
		expect(typeof addNewFileMenuEntry).toBe('function')
	})

	test('removeNewFileMenuEntry', () => {
		expect(removeNewFileMenuEntry).toBeTruthy()
		expect(typeof removeNewFileMenuEntry).toBe('function')
	})

	test('getNewFileMenuEntries', () => {
		expect(getNewFileMenuEntries).toBeTruthy()
		expect(typeof getNewFileMenuEntries).toBe('function')
	})
})


describe('NewFileMenu methods', () => {
	const entry = {
		id: 'empty-file',
		displayName: 'Create empty file',
		templateName: 'New file.txt',
		iconClass: 'icon-filetype-text',
		handler: () => {}
	} as Entry

	test('Init NewFileMenu', () => {
		expect(window._nc_newfilemenu).toBeUndefined()

		const menuEntries = getNewFileMenuEntries()
		expect(menuEntries).toHaveLength(0)

		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewFileMenu)
	})

	test('Use existing initialized NewFileMenu', () => {
		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewFileMenu)

		addNewFileMenuEntry(entry)

		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewFileMenu)

		removeNewFileMenuEntry(entry)

		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewFileMenu)
	})
})
