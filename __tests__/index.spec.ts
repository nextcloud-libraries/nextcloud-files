import { describe, expect, test } from 'vitest'

import {
	formatFileSize,
	addNewFileMenuEntry,
	removeNewFileMenuEntry,
	getNewFileMenuEntries,
	FileType,
	File,
	Folder,
	Node,
	Permission,
	davParsePermissions,
} from '../lib/index'

import { Entry, NewFileMenu } from '../lib/newFileMenu'
import { FileAction, registerFileAction, getFileActions } from '../lib/fileAction'

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

	test('FileType', () => {
		expect(FileType).toBeTruthy()
		expect(typeof FileType).toBe('object')
	})

	test('Permission', () => {
		expect(Permission).toBeTruthy()
		expect(typeof Permission).toBe('object')
	})

	test('davParsePermissions', () => {
		expect(davParsePermissions).toBeTruthy()
		expect(typeof davParsePermissions).toBe('function')
	})

	test('File', () => {
		expect(File).toBeTruthy()
		expect(typeof File).toBe('function')
	})

	test('Folder', () => {
		expect(Folder).toBeTruthy()
		expect(typeof Folder).toBe('function')
	})

	test('Node', () => {
		expect(Node).toBeTruthy()
		expect(typeof Node).toBe('function')
	})

	test('FileAction', () => {
		expect(FileAction).toBeTruthy()
		expect(typeof FileAction).toBe('function')
	})

	test('registerFileAction', () => {
		expect(registerFileAction).toBeTruthy()
		expect(typeof Node).toBe('function')
	})

	test('getFileActions', () => {
		expect(getFileActions).toBeTruthy()
		expect(typeof Node).toBe('function')
	})
})

describe('NewFileMenu methods', () => {
	const entry = {
		id: 'empty-file',
		displayName: 'Create empty file',
		templateName: 'New file.txt',
		iconClass: 'icon-filetype-text',
		handler: () => {},
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
