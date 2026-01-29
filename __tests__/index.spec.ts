/*
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { NewMenuEntry } from '../lib/newMenu/NewMenu.ts'

import { describe, expect, test } from 'vitest'
import { getFileActions, registerFileAction } from '../lib/actions/fileAction.ts'
import {
	addNewFileMenuEntry,
	File,
	FileType,
	Folder,
	formatFileSize,
	getNewFileMenuEntries,
	Node,
	Permission,
	removeNewFileMenuEntry,
} from '../lib/index.ts'
import { NewMenu } from '../lib/newMenu/NewMenu.ts'

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
		iconSvgInline: '<svg></svg>',
		handler: () => {},
	} as NewMenuEntry

	test('Init NewFileMenu', () => {
		expect(window._nc_newfilemenu).toBeUndefined()

		const menuEntries = getNewFileMenuEntries()
		expect(menuEntries).toHaveLength(0)

		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewMenu)
	})

	test('Use existing initialized NewMenu', () => {
		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewMenu)

		addNewFileMenuEntry(entry)

		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewMenu)

		removeNewFileMenuEntry(entry)

		expect(window._nc_newfilemenu).toBeDefined()
		expect(window._nc_newfilemenu).toBeInstanceOf(NewMenu)
	})
})
