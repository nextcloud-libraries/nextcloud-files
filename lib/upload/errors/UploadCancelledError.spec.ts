/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect, test } from 'vitest'
import { UploadCancelledError } from './UploadCancelledError.ts'

test('UploadCancelledError', () => {
	const cause = new Error('Network error')
	const error = new UploadCancelledError(cause)
	expect(error).toBeInstanceOf(Error)
	expect(error).toBeInstanceOf(UploadCancelledError)
	expect(error.message).toBe('Upload has been cancelled')
	expect(error.cause).toBe(cause)
	expect(error).toHaveProperty('__UPLOAD_CANCELLED__')
})
