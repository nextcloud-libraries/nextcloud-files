/*
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFolder } from '../../node/index.ts'
import type { NewMenuEntry } from './NewMenu.ts'

import { scopedGlobals } from '../../globalScope.ts'
import { NewMenu } from './NewMenu.ts'

/**
 * Get the NewMenu instance used by the files app.
 */
export function getNewFileMenu(): NewMenu {
	scopedGlobals.newFileMenu ??= new NewMenu()
	return scopedGlobals.newFileMenu
}

/**
 * Add a new menu entry to the upload manager menu
 *
 * @param entry - The new file menu entry
 */
export function addNewFileMenuEntry(entry: NewMenuEntry): void {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.registerEntry(entry)
}

/**
 * Remove a previously registered entry from the upload menu
 *
 * @param entry - Entry or id of entry to remove
 */
export function removeNewFileMenuEntry(entry: NewMenuEntry | string) {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.unregisterEntry(entry)
}

/**
 * Get the list of registered entries from the upload menu
 *
 * @param context - The current folder to get the available entries
 */
export function getNewFileMenuEntries(context?: IFolder): NewMenuEntry[] {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.getEntries(context).sort((a: NewMenuEntry, b: NewMenuEntry) => {
		// If defined and different, sort by order
		if (a.order !== undefined
			&& b.order !== undefined
			&& a.order !== b.order) {
			return a.order - b.order
		}
		// else sort by display name
		return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' })
	})
}
