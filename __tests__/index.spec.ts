/*
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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
