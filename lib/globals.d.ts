/**
 * SPDX-FileCopyrightText: Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later or LGPL-3.0-or-later
 */

declare global {
	interface Window {
		_oc_config?: {
			forbidden_filenames_characters: string[]
			/** @deprecated */
			blacklist_files_regex?: string
		}
	}
}

export {}
