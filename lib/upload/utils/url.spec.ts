/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 */

import { describe, expect, it } from 'vitest'
import { concatUrl, encodeUrl } from './url.ts'

describe('concatUrl', () => {
	it('joins base and path', () => {
		expect(concatUrl('https://example.com/dav', 'test.txt')).toBe('https://example.com/dav/test.txt')
	})

	it('normalizes slashes', () => {
		expect(concatUrl('https://example.com/dav/', '/test.txt')).toBe('https://example.com/dav/test.txt')
	})

	it('does not encode the path', () => {
		expect(concatUrl('https://example.com/dav', 'a b&c#1.txt')).toBe('https://example.com/dav/a b&c#1.txt')
	})
})

describe('encodeUrl', () => {
	it('encodes the path of an absolute URL', () => {
		expect(encodeUrl('https://example.com/dav/a b&c#1.txt')).toBe('https://example.com/dav/a%20b%26c%231.txt')
	})

	it('encodes a plain path', () => {
		expect(encodeUrl('/dav/sub folder/ä.txt')).toBe('/dav/sub%20folder/%C3%A4.txt')
	})

	it('keeps the origin untouched', () => {
		expect(encodeUrl('http://localhost:8080/remote.php/dav/files/admin/+ 1.txt'))
			.toBe('http://localhost:8080/remote.php/dav/files/admin/%2B%201.txt')
	})

	it('does not double encode path separators', () => {
		expect(encodeUrl('https://example.com/a/b/c')).toBe('https://example.com/a/b/c')
	})
})
