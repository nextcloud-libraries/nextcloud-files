/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import { isFileSystemDirectoryEntry, isFileSystemEntry, isFileSystemFileEntry } from './filesystem.ts'
import { Directory } from './fileTree.ts'
import { createDirectoryEntry } from '~/__tests__/fixtures/filesystem.ts'

describe('file system entry detection', () => {
	it('detects real file system entries', async () => {
		const directoryEntry = await createDirectoryEntry({ 'a.txt': 'a' })
		const fileEntry = await new Promise<FileSystemEntry>((resolve, reject) => directoryEntry.getFile('a.txt', {}, resolve, reject))

		expect(isFileSystemEntry(directoryEntry)).toBe(true)
		expect(isFileSystemDirectoryEntry(directoryEntry)).toBe(true)
		expect(isFileSystemFileEntry(directoryEntry)).toBe(false)

		expect(isFileSystemEntry(fileEntry)).toBe(true)
		expect(isFileSystemFileEntry(fileEntry)).toBe(true)
		expect(isFileSystemDirectoryEntry(fileEntry)).toBe(false)
	})

	it('does not detect files or directories as file system entries', () => {
		expect(isFileSystemEntry(new File(['a'], 'a.txt'))).toBe(false)
		expect(isFileSystemEntry(new Directory('folder'))).toBe(false)
		expect(isFileSystemEntry(null)).toBe(false)
		expect(isFileSystemEntry({ name: 'a.txt' })).toBe(false)
	})
})

describe('Directory (file tree)', () => {
	it('adds all entries of a directory with more entries than one `readEntries` call returns', async () => {
		// Chromium returns at most 100 entries per `readEntries` call
		const files = Object.fromEntries(Array.from({ length: 150 }, (_, index) => [`file-${index}.txt`, `content-${index}`]))
		const entry = await createDirectoryEntry(files)

		const root = new Directory('')
		await root.addChild(entry)

		const directory = root.getChild(entry.name) as Directory
		expect(directory.children).toHaveLength(150)
		expect(directory.children.map(({ name }) => name).sort()).toEqual(Object.keys(files).sort())
	})

	it('adds all entries of a nested directory with more entries than one `readEntries` call returns', async () => {
		const files = Object.fromEntries(Array.from({ length: 150 }, (_, index) => [`nested/file-${index}.txt`, `content-${index}`]))
		const entry = await createDirectoryEntry(files)

		const root = new Directory('')
		await root.addChild(entry)

		const nested = (root.getChild(entry.name) as Directory).getChild('nested') as Directory
		expect(nested.children).toHaveLength(150)
	})
})
