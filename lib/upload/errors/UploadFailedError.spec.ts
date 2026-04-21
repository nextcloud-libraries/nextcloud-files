/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AxiosRequestHeaders, AxiosResponse } from 'axios'

import { AxiosError } from 'axios'
import { expect, test } from 'vitest'
import { UploadFailedError } from './UploadFailedError.ts'

test('UploadFailedError - axios error but no response', () => {
	const cause = new AxiosError('Network error')
	const error = new UploadFailedError(cause)
	expect(error).toBeInstanceOf(Error)
	expect(error).toBeInstanceOf(UploadFailedError)
	expect(error.message).toBe('Upload has failed')
	expect(error.cause).toBe(cause)
	expect(error).toHaveProperty('__UPLOAD_FAILED__')
	expect(error.response).toBeUndefined()
})

test('UploadFailedError - axios error', () => {
	const response = {} as AxiosResponse
	const cause = new AxiosError('Network error', '200', { headers: {} as AxiosRequestHeaders }, {}, response)
	const error = new UploadFailedError(cause)
	expect(error).toBeInstanceOf(Error)
	expect(error).toBeInstanceOf(UploadFailedError)
	expect(error.message).toBe('Upload has failed')
	expect(error.cause).toBe(cause)
	expect(error).toHaveProperty('__UPLOAD_FAILED__')
	expect(error.response).toBe(response)
})

test('UploadFailedError - generic error', () => {
	const cause = new Error('Generic error')
	const error = new UploadFailedError(cause)
	expect(error).toBeInstanceOf(Error)
	expect(error).toBeInstanceOf(UploadFailedError)
	expect(error.message).toBe('Upload has failed')
	expect(error.cause).toBe(cause)
	expect(error).toHaveProperty('__UPLOAD_FAILED__')
	expect(error.response).toBeUndefined()
})
