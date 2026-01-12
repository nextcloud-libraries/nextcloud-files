/**
 * SPDX-FileCopyrightText: Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later or LGPL-3.0-or-later
 */

import { getCapabilities } from '@nextcloud/capabilities'

interface NextcloudCapabilities extends Record<string, unknown> {
	files: {
		bigfilechunking: boolean
		// those are new in Nextcloud 30
		forbidden_filenames?: string[]
		forbidden_filename_basenames?: string[]
		forbidden_filename_characters?: string[]
		forbidden_filename_extensions?: string[]
	}
}

export const InvalidFilenameErrorReason = Object.freeze({
	ReservedName: 'reserved name',
	Character: 'character',
	Extension: 'extension',
})

export type TInvalidFilenameErrorReason = typeof InvalidFilenameErrorReason[keyof typeof InvalidFilenameErrorReason]

interface InvalidFilenameErrorOptions {
	/**
	 * The filename that was validated
	 */
	filename: string

	/**
	 * Reason why the validation failed
	 */
	reason: TInvalidFilenameErrorReason

	/**
	 * Part of the filename that caused this error
	 */
	segment: string
}

export class InvalidFilenameError extends Error {
	public constructor(options: InvalidFilenameErrorOptions) {
		super(`Invalid ${options.reason} '${options.segment}' in filename '${options.filename}'`, { cause: options })
	}

	/**
	 * The filename that was validated
	 */
	public get filename() {
		return (this.cause as InvalidFilenameErrorOptions).filename
	}

	/**
	 * Reason why the validation failed
	 */
	public get reason() {
		return (this.cause as InvalidFilenameErrorOptions).reason
	}

	/**
	 * Part of the filename that caused this error
	 */
	public get segment() {
		return (this.cause as InvalidFilenameErrorOptions).segment
	}
}

/**
 * Validate a given filename
 *
 * @param filename The filename to check
 * @throws {InvalidFilenameError}
 */
export function validateFilename(filename: string): void {
	const capabilities = (getCapabilities() as NextcloudCapabilities).files

	// Handle forbidden characters
	// This needs to be done first as the other checks are case insensitive!
	const forbiddenCharacters = capabilities.forbidden_filename_characters ?? ['/', '\\']
	for (const character of forbiddenCharacters) {
		if (filename.includes(character)) {
			throw new InvalidFilenameError({ segment: character, reason: InvalidFilenameErrorReason.Character, filename })
		}
	}

	// everything else is case insensitive (the capabilities are returned lowercase)
	filename = filename.toLocaleLowerCase()

	// Handle forbidden filenames, on older Nextcloud versions without this capability it was hardcoded in the backend to '.htaccess'
	const forbiddenFilenames = capabilities.forbidden_filenames ?? ['.htaccess']
	if (forbiddenFilenames.includes(filename)) {
		throw new InvalidFilenameError({ filename, segment: filename, reason: InvalidFilenameErrorReason.ReservedName })
	}

	// Handle forbidden basenames
	const endOfBasename = filename.indexOf('.', 1)
	const basename = filename.substring(0, endOfBasename === -1 ? undefined : endOfBasename)
	const forbiddenFilenameBasenames = capabilities.forbidden_filename_basenames ?? []
	if (forbiddenFilenameBasenames.includes(basename)) {
		throw new InvalidFilenameError({ filename, segment: basename, reason: InvalidFilenameErrorReason.ReservedName })
	}

	const forbiddenFilenameExtensions = capabilities.forbidden_filename_extensions ?? []
	for (const extension of forbiddenFilenameExtensions) {
		if (filename.length > extension.length && filename.endsWith(extension)) {
			throw new InvalidFilenameError({ segment: extension, reason: InvalidFilenameErrorReason.Extension, filename })
		}
	}
}

/**
 * Check the validity of a filename
 * This is a convenient wrapper for `checkFilenameValidity` to only return a boolean for the valid
 *
 * @param filename Filename to check validity
 */
export function isFilenameValid(filename: string): boolean {
	try {
		validateFilename(filename)
		return true
	} catch (error) {
		if (error instanceof InvalidFilenameError) {
			return false
		}
		throw error
	}
}
