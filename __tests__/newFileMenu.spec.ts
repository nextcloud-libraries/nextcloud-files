/*
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { NewMenuEntry } from '../lib/newMenu/index.ts'

import { describe, expect, test, vi, afterEach } from 'vitest'
import { addNewFileMenuEntry, getNewFileMenu, getNewFileMenuEntries } from '../lib/newMenu/index.ts'
import { NewMenu, NewMenuEntryCategory } from '../lib/newMenu/NewMenu.ts'
import { Folder } from '../lib/node/index.ts'
import { Permission } from '../lib/permissions.ts'
import logger from '../lib/utils/logger'

describe('NewFileMenu init', () => {
	test('Initializing NewFileMenu', () => {
		logger.debug = vi.fn()
		const newFileMenu = getNewFileMenu()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewMenu)
		expect(window._nc_newfilemenu).toBe(newFileMenu)
		expect(logger.debug).toHaveBeenCalled()
	})

	test('Getting existing NewMenu', () => {
		const newFileMenu = new NewMenu()
		Object.assign(window, { _nc_newfilemenu: newFileMenu })

		expect(window._nc_newfilemenu).toBe(newFileMenu)
		expect(getNewFileMenu()).toBe(newFileMenu)
	})
})

describe('NewMenu addEntry', () => {
	test('Adding a valid Entry', () => {
		const newFileMenu = new NewMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry)

		const entries = newFileMenu.getEntries()
		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry)
	})

	test('Adding multiple valid Entries', () => {
		const newFileMenu = new NewMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry1)

		expect(newFileMenu.getEntries()).toHaveLength(1)
		expect(newFileMenu.getEntries()[0]).toBe(entry1)

		const entry2 = {
			id: 'image',
			displayName: 'Create new image',
			templateName: 'New drawing.png',
			iconClass: 'icon-filetype-image',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry2)

		expect(newFileMenu.getEntries()).toHaveLength(2)
		expect(newFileMenu.getEntries()[1]).toBe(entry2)

		const entry3 = {
			id: 'folder',
			displayName: 'New folder',
			templateName: 'New folder',
			iconClass: 'icon-folder',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry3)

		expect(newFileMenu.getEntries()).toHaveLength(3)
		expect(newFileMenu.getEntries()[2]).toBe(entry3)
	})

	test('Adding duplicate Entry', () => {
		const newFileMenu = new NewMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
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
		const newFileMenu = new NewMenu()
		expect(() => {
			newFileMenu.registerEntry({} as NewMenuEntry)
		}).toThrowError('Invalid entry')

		expect(() => {
			newFileMenu.registerEntry({
				id: 123456,
				displayName: '123456',
				templateName: 'New file.txt',
				handler: () => {},
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid entry')

		expect(() => {
			newFileMenu.registerEntry({
				id: 123456,
				displayName: '123456',
				iconSvgInline: '<svg></svg>',
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid entry')

		expect(() => {
			newFileMenu.registerEntry({
				id: 123456,
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				handler: () => {},
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid id or displayName property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: 123456,
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				handler: () => {},
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid id or displayName property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 123456,
				handler: () => {},
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid icon provided')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconSvgInline: 123456,
				handler: () => {},
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid icon provided')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				enabled: true,
				handler: () => {},
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid enabled property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				order: true,
				handler: () => {},
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid order property')

		expect(() => {
			newFileMenu.registerEntry({
				id: 'empty-file',
				displayName: '123456',
				templateName: 'New file.txt',
				iconClass: 'icon-filetype-text',
				handler: 'handler',
			} as unknown as NewMenuEntry)
		}).toThrowError('Invalid handler property')
	})

	test('Adding a Entry without category', () => {
		const newFileMenu = new NewMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry)

		const entries = newFileMenu.getEntries()
		expect(entries).toHaveLength(1)
		expect(entries[0].category).toBe(NewMenuEntryCategory.CreateNew)
	})

	test('Adding a Entry with category', () => {
		const newFileMenu = new NewMenu()
		const entry = {
			id: 'empty-file',
			category: NewMenuEntryCategory.Other,
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry)

		const entries = newFileMenu.getEntries()
		expect(entries).toHaveLength(1)
		expect(entries[0].category).toBe(NewMenuEntryCategory.Other)
	})
})

describe('NewMenu removeEntry', () => {
	test('Removing an existing Entry', () => {
		const newFileMenu = new NewMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry)

		const entries = newFileMenu.getEntries()
		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry)

		newFileMenu.unregisterEntry(entry)
		expect(entries).toHaveLength(0)
	})

	test('Removing an existing Entry by id', () => {
		const newFileMenu = new NewMenu()
		const entry = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry)

		expect(newFileMenu.getEntries()).toHaveLength(1)
		expect(newFileMenu.getEntries()[0]).toBe(entry)

		newFileMenu.unregisterEntry('empty-file')
		expect(newFileMenu.getEntries()).toHaveLength(0)
	})

	test('Removing a non-existing entry', () => {
		logger.warn = vi.fn()
		const newFileMenu = new NewMenu()

		newFileMenu.unregisterEntry('unknown-entry')

		expect(newFileMenu.getEntries()).toHaveLength(0)
		expect(logger.warn).toHaveBeenCalled()
	})
})

describe('NewMenu getEntries filter', () => {
	test('Filter no entries', () => {
		const newFileMenu = new NewMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file',
			iconClass: 'icon-file',
			enabled: folder => (folder.permissions & Permission.CREATE) !== 0,
			handler: () => {},
		}
		newFileMenu.registerEntry(entry1)

		const entry2 = {
			id: 'empty-text-md',
			displayName: 'Create new markdown file',
			templateName: 'New text.md',
			iconClass: 'icon-filetype-text',
			enabled: folder => (folder.permissions & Permission.CREATE) !== 0,
			handler: () => {},
		}
		newFileMenu.registerEntry(entry2)

		const context = new Folder({
			id: 56,
			owner: 'admin',
			size: 2610077102,
			source: 'https://example.com/remote.php/dav/files/admin/Folder',
			permissions: Permission.ALL,
		})

		const entries = newFileMenu.getEntries(context)
		expect(entries).toHaveLength(2)
		expect(entries[0]).toBe(entry1)
		expect(entries[1]).toBe(entry2)
	})

	test('Filter all entries', () => {
		const newFileMenu = new NewMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file',
			iconClass: 'icon-file',
			enabled: folder => (folder.permissions & Permission.CREATE) !== 0,
			handler: () => {},
		}
		newFileMenu.registerEntry(entry1)

		const entry2 = {
			id: 'empty-text-md',
			displayName: 'Create new markdown file',
			templateName: 'New text.md',
			iconClass: 'icon-filetype-text',
			enabled: folder => (folder.permissions & Permission.CREATE) !== 0,
			handler: () => {},
		}
		newFileMenu.registerEntry(entry2)

		const context = new Folder({
			id: 56,
			owner: 'admin',
			size: 2610077102,
			source: 'https://example.com/remote.php/dav/files/admin/Folder',
			permissions: Permission.READ,
		})

		const entries = newFileMenu.getEntries(context)
		expect(entries).toHaveLength(0)
	})

	test('Filter some entries', () => {
		const newFileMenu = new NewMenu()
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create template',
			templateName: 'New file',
			iconClass: 'icon-file',
			handler: () => {},
		}
		newFileMenu.registerEntry(entry1)

		const entry2 = {
			id: 'empty-text-md',
			displayName: 'Create new markdown file',
			templateName: 'New text.md',
			iconClass: 'icon-filetype-text',
			enabled: folder => (folder.permissions & Permission.CREATE) !== 0,
			handler: () => {},
		}
		newFileMenu.registerEntry(entry2)

		const context = new Folder({
			id: 56,
			owner: 'admin',
			size: 2610077102,
			source: 'https://example.com/remote.php/dav/files/admin/Foo/Bar',
			permissions: Permission.NONE,
			root: '/files/admin',
		})

		const entries = newFileMenu.getEntries(context)
		expect(entries).toHaveLength(1)
		expect(entries[0]).toBe(entry1)
	})
})

describe('NewMenu sort test', () => {
	afterEach(() => {
		delete window._nc_newfilemenu
	})

	test('Specified NewMenu order', () => {
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			order: 3,
			handler: () => {},
		}

		const entry2 = {
			id: 'image',
			displayName: 'Create new image',
			templateName: 'New drawing.png',
			iconClass: 'icon-filetype-image',
			order: 2,
			handler: () => {},
		}

		const entry3 = {
			id: 'folder',
			displayName: 'New folder',
			templateName: 'New folder',
			iconClass: 'icon-folder',
			order: 1,
			handler: () => {},
		}

		addNewFileMenuEntry(entry1)
		addNewFileMenuEntry(entry2)
		addNewFileMenuEntry(entry3)

		const entries = getNewFileMenuEntries()
		expect(entries).toHaveLength(3)
		expect(entries[0]).toBe(entry3)
		expect(entries[1]).toBe(entry2)
		expect(entries[2]).toBe(entry1)
	})

	test('Fallback to displayName', () => {
		const entry1 = {
			id: 'empty-file',
			displayName: 'Create empty file',
			templateName: 'New file.txt',
			iconClass: 'icon-filetype-text',
			handler: () => {},
		}

		const entry2 = {
			id: 'image',
			displayName: 'Create new image 2',
			templateName: 'New drawing.png',
			iconClass: 'icon-filetype-image',
			order: 1,
			handler: () => {},
		}

		const entry3 = {
			id: 'folder',
			displayName: 'New folder',
			templateName: 'New folder',
			iconClass: 'icon-folder',
			order: 0,
			handler: () => {},
		}

		const entry4 = {
			id: 'image2',
			displayName: 'Create new image 1',
			templateName: 'New drawing 2.png',
			iconClass: 'icon-filetype-image',
			order: 1,
			handler: () => {},
		}

		addNewFileMenuEntry(entry1)
		addNewFileMenuEntry(entry2)
		addNewFileMenuEntry(entry3)
		addNewFileMenuEntry(entry4)

		const entries = getNewFileMenuEntries()
		expect(entries).toHaveLength(4)
		expect(entries[0]).toBe(entry1)
		expect(entries[1]).toBe(entry3)
		expect(entries[2]).toBe(entry4)
		expect(entries[3]).toBe(entry2)
	})
})
