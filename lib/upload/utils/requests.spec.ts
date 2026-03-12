/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 */

import { CanceledError } from 'axios'
import { expect, test } from 'vitest'
import { getMtimeHeader, isRequestAborted } from './requests.ts'

test('getMtimeHeader - valid mtime', () => {
	const file = new File([''], 'test.txt', { lastModified: 1620000000000 })
	const headers = getMtimeHeader(file)
	expect(headers).toHaveProperty('X-OC-Mtime', 1620000000)
})

test('getMtimeHeader - invalid mtime', () => {
	const file = new File([''], 'test.txt', { lastModified: -1000 })
	const headers = getMtimeHeader(file)
	expect(headers).not.toHaveProperty('X-OC-Mtime')
})

test('isRequestAborted - axios cancel error', () => {
	const error = new CanceledError('Upload cancelled')
	expect(isRequestAborted(error)).toBe(true)
})

test('isRequestAborted - DOMException with AbortError name', () => {
	const error = new DOMException('Upload cancelled', 'AbortError')
	expect(isRequestAborted(error)).toBe(true)
})

test('isRequestAborted - other error', () => {
	const error = new Error('Some other error')
	expect(isRequestAborted(error)).toBe(false)
})
