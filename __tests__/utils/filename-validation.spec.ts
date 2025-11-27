/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later or LGPL-3.0-or-later
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidFilenameError, InvalidFilenameErrorReason, isFilenameValid, validateFilename } from '../../lib/index'

const nextcloudCapabilities = vi.hoisted(() => ({ getCapabilities: vi.fn(() => ({ files: {} })) }))
vi.mock('@nextcloud/capabilities', () => nextcloudCapabilities)

describe('isFilenameValid', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
		delete window._oc_config
	})

	it('works for valid filenames', async () => {
		expect(isFilenameValid('foo.bar')).toBe(true)
	})

	it('works for invalid filenames', async () => {
		expect(isFilenameValid('foo\\bar')).toBe(false)
	})

	it('does not catch any interal exceptions', async () => {
		// invalid capability just to get an exception here
		nextcloudCapabilities.getCapabilities.mockImplementationOnce(() => ({ files: { forbidden_filename_extensions: 3 } }))
		expect(() => isFilenameValid('hello')).toThrowError(TypeError)
	})
})

describe('validateFilename', () => {

	beforeEach(() => {
		vi.resetAllMocks()
		delete window._oc_config
	})

	it('works for valid filenames', async () => {
		expect(() => validateFilename('foo.bar')).not.toThrow()
	})

	it('has fallback invalid characters', async () => {
		expect(() => validateFilename('foo\\bar')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('foo/bar')).toThrowError(InvalidFilenameError)
	})

	it('has fallback invalid names', async () => {
		expect(() => validateFilename('.htaccess')).toThrowError(InvalidFilenameError)
	})

	// Nextcloud 30+
	it('fetches forbidden characters from capabilities', async () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_characters: ['=', '?'] } }))
		expect(() => validateFilename('foo')).not.toThrow()
		expect(() => validateFilename('foo?')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('foo=bar')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('?foo')).toThrowError(InvalidFilenameError)
	})

	it('fetches forbidden extensions from capabilities', async () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_extensions: ['.txt', '.tar.gz'] } }))
		expect(() => validateFilename('foo.md')).not.toThrow()
		expect(() => validateFilename('foo.txt')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('foo.tar.gz')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('foo.tar.zstd')).not.toThrow()
	})

	it('fetches forbidden filenames from capabilities', async () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filenames: ['thumbs.db'] } }))
		expect(() => validateFilename('thumbs.png')).not.toThrow()
		expect(() => validateFilename('thumbs.db')).toThrowError(InvalidFilenameError)
	})

	it('fetches forbidden filename basenames from capabilities', async () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_basenames: ['com0'] } }))
		expect(() => validateFilename('com1.txt')).not.toThrow()
		expect(() => validateFilename('com0.txt')).toThrowError(InvalidFilenameError)
	})

	it('handles forbidden filenames case-insensitive', () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filenames: ['thumbs.db'] } }))
		expect(() => validateFilename('thumbS.db')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('thumbs.DB')).toThrowError(InvalidFilenameError)
	})

	it('handles forbidden filename basenames case-insensitive', () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_basenames: ['com0'] } }))
		expect(() => validateFilename('COM0')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('com0')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('com0.namespace')).toThrowError(InvalidFilenameError)
	})

	it('handles forbidden filename extensions case-insensitive', () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_extensions: ['.txt'] } }))
		expect(() => validateFilename('file.TXT')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('FILE.txt')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('FiLe.TxT')).toThrowError(InvalidFilenameError)
	})

	it('handles hidden files correctly', () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_basenames: ['.hidden'], forbidden_filename_extensions: ['.txt'] } }))
		// forbidden basename '.hidden'
		expect(() => validateFilename('.hidden')).toThrowError(InvalidFilenameError)
		expect(() => validateFilename('.hidden.png')).toThrowError(InvalidFilenameError)
		// basename is .txt so not forbidden
		expect(() => validateFilename('.txt')).not.toThrowError(InvalidFilenameError)
		expect(() => validateFilename('.txt.png')).not.toThrowError(InvalidFilenameError)
		// forbidden extension
		expect(() => validateFilename('.other-hidden.txt')).toThrowError(InvalidFilenameError)
	})

	it('sets error properties correctly on invalid filename', async () => {
		try {
			validateFilename('.htaccess')
			expect(true, 'should not be reached').toBeFalsy()
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidFilenameError)
			expect((error as InvalidFilenameError).reason).toBe(InvalidFilenameErrorReason.ReservedName)
			expect((error as InvalidFilenameError).segment).toBe('.htaccess')
			expect((error as InvalidFilenameError).filename).toBe('.htaccess')
		}
	})

	it('sets error properties correctly on invalid extension', async () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_extensions: ['.txt'] } }))

		try {
			validateFilename('file.txt')
			expect(true, 'should not be reached').toBeFalsy()
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidFilenameError)
			expect((error as InvalidFilenameError).reason).toBe(InvalidFilenameErrorReason.Extension)
			expect((error as InvalidFilenameError).segment).toBe('.txt')
			expect((error as InvalidFilenameError).filename).toBe('file.txt')
		}
	})

	it('sets error properties correctly on invalid character', async () => {
		try {
			validateFilename('file\\name')
			expect(true, 'should not be reached').toBeFalsy()
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidFilenameError)
			expect((error as InvalidFilenameError).reason).toBe(InvalidFilenameErrorReason.Character)
			expect((error as InvalidFilenameError).segment).toBe('\\')
			expect((error as InvalidFilenameError).filename).toBe('file\\name')
		}
	})

	it('sets error properties correctly on invalid basename', async () => {
		nextcloudCapabilities.getCapabilities.mockImplementation(() => ({ files: { forbidden_filename_basenames: ['com0'] } }))
		try {
			validateFilename('com0.namespace')
			expect(true, 'should not be reached').toBeFalsy()
		} catch (error) {
			expect(error).toBeInstanceOf(InvalidFilenameError)
			expect((error as InvalidFilenameError).reason).toBe(InvalidFilenameErrorReason.ReservedName)
			expect((error as InvalidFilenameError).segment).toBe('com0')
			expect((error as InvalidFilenameError).filename).toBe('com0.namespace')
		}
	})
})

describe('InvalidFilenameError', () => {

	it('sets the filename', () => {
		const error = new InvalidFilenameError({ filename: 'file', segment: 'fi', reason: InvalidFilenameErrorReason.Extension })
		expect(error.filename).toBe('file')
	})

	it('sets the segment', () => {
		const error = new InvalidFilenameError({ filename: 'file', segment: 'fi', reason: InvalidFilenameErrorReason.Extension })
		expect(error.segment).toBe('fi')
	})

	it('sets the reason', () => {
		const error = new InvalidFilenameError({ filename: 'file', segment: 'fi', reason: InvalidFilenameErrorReason.Extension })
		expect(error.reason).toBe(InvalidFilenameErrorReason.Extension)
	})

	it('sets the message', () => {
		const error = new InvalidFilenameError({ filename: 'file', segment: 'fi', reason: InvalidFilenameErrorReason.Extension })
		expect(error.message).toMatchInlineSnapshot('"Invalid extension \'fi\' in filename \'file\'"')
	})
})
