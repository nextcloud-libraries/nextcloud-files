/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later or LGPL-3.0-or-later
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getUniqueName } from '../../lib/index'

describe('isFilenameValid', () => {
	beforeEach(() => {
		delete window._oc_config
		vi.resetModules()
	})

	it('works for valid filenames', async () => {
		const { isFilenameValid } = await import('../../lib/index')

		expect(isFilenameValid('foo.bar')).toBe(true)
	})

	it('has fallback invalid characters', async () => {
		const { isFilenameValid } = await import('../../lib/index')

		expect(isFilenameValid('foo\\bar')).toBe(false)
		expect(isFilenameValid('foo/bar')).toBe(false)
	})

	it('reads invalid characters from oc config', async () => {
		window._oc_config = { forbidden_filenames_characters: ['=', '?'] }
		const { isFilenameValid } = await import('../../lib/index')

		expect(isFilenameValid('foo.bar')).toBe(true)
		expect(isFilenameValid('foo=bar')).toBe(false)
		expect(isFilenameValid('foo?bar')).toBe(false)
	})

	it('supports invalid filename regex', async () => {
		window._oc_config = { forbidden_filenames_characters: ['/'], blacklist_files_regex: '\\.(part|filepart)$' }
		const { isFilenameValid } = await import('../../lib/index')

		expect(isFilenameValid('foo.bar')).toBe(true)
		expect(isFilenameValid('foo.part')).toBe(false)
		expect(isFilenameValid('foo.filepart')).toBe(false)
		expect(isFilenameValid('.filepart')).toBe(false)
	})
})

describe('getUniqueName', () => {
	it('returns the same name if unique', () => {
		const name = 'file.txt'
		const others = ['other.png', 'folder']

		expect(getUniqueName(name, others)).toBe(name)
	})

	it('adds the index as a suffix by default', () => {
		const name = 'file.txt'
		const others = ['file.txt', 'folder']

		expect(getUniqueName(name, others)).toBe('file (1).txt')
	})

	it('increases the index if needed', () => {
		const name = 'file.txt'
		const others = ['file.txt', 'file (1).txt']

		expect(getUniqueName(name, others)).toBe('file (2).txt')
	})

	it('uses custom suffix if provided', () => {
		const name = 'file.txt'
		const others = ['file.txt', 'folder']
		const suffix = vi.fn((i) => `[${i}]`)

		expect(getUniqueName(name, others, { suffix })).toBe('file [1].txt')
		expect(suffix).toBeCalledTimes(1)
		expect(suffix).toBeCalledWith(1)
	})

	it('can ignore the file extension', () => {
		const name = 'folder.with.dot'
		const others = ['folder', 'folder.with.dot', 'file.txt']

		expect(getUniqueName(name, others, { ignoreFileExtension: true })).toBe('folder.with.dot (1)')
	})
})
