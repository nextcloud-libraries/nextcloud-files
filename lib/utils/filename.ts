/**
 * SPDX-FileCopyrightText: Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later or LGPL-3.0-or-later
 */

const forbiddenCharacters = window._oc_config?.forbidden_filenames_characters ?? ['/', '\\']
const forbiddenFilenameRegex = window._oc_config?.blacklist_files_regex ? new RegExp(window._oc_config.blacklist_files_regex) : null

/**
 * Check the validity of a filename
 * This is a convinient wrapper for `checkFilenameValidity` to only return a boolean for the valid
 * @param filename Filename to check validity
 */
export function isFilenameValid(filename: string): boolean {
	// Check forbidden characters (available with Nextcloud 29)
	if (forbiddenCharacters.some((character) => filename.includes(character))) {
		return false
	}
	// Check forbidden filename regex
	if (forbiddenFilenameRegex !== null && filename.match(forbiddenFilenameRegex)) {
		return false
	}
	// in Nextcloud 30 also check forbidden file extensions and file prefixes
	return true
}
