/**
 * SPDX-FileCopyrightText: Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later or LGPL-3.0-or-later
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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
