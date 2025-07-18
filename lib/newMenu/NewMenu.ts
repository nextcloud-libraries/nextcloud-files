/*
 * SPDX-FileCopyrightText: 2021 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Folder, Node } from '../node/index.ts'

import logger from '../utils/logger.ts'

export enum NewMenuEntryCategory {
	/**
	 * For actions where the user is intended to upload from their device
	 */
	UploadFromDevice = 0,

	/**
	 * For actions that create new nodes on the server without uploading
	 */
	CreateNew = 1,

	/**
	 * For everything not matching the other categories
	 */
	Other = 2,
}

export interface NewMenuEntry {
	/** Unique ID */
	id: string

	/**
	 * Category to put this entry in
	 * (supported since Nextcloud 30)
	 * @since 3.3.0
	 * @default NewMenuEntryCategory.CreateNew
	 */
	category?: NewMenuEntryCategory

	/** Translatable string displayed in the menu */
	displayName: string

	/**
	 * Condition wether this entry is shown or not
	 * @param context the creation context. Usually the current folder
	 */
	enabled?: (context: Folder) => boolean

	/**
	 * Either iconSvgInline or iconClass must be defined
	 * Svg as inline string. <svg><path fill="..." /></svg>
	 */
	iconSvgInline?: string

	/**
	 * Existing icon css class
	 * @deprecated use iconSvgInline instead
	 */
	iconClass?: string

	/** Order of the entry in the menu */
	order?: number

	/**
	 * Function to be run after creation
	 * @param context - The creation context. Usually the current folder
	 * @param content - List of file/folders present in the context folder
	 */
	handler: (context: Folder, content: Node[]) => void
}

export class NewMenu {

	private _entries: Array<NewMenuEntry> = []

	public registerEntry(entry: NewMenuEntry) {
		this.validateEntry(entry)
		entry.category = entry.category ?? NewMenuEntryCategory.CreateNew
		this._entries.push(entry)
	}

	public unregisterEntry(entry: NewMenuEntry | string) {
		const entryIndex = typeof entry === 'string'
			? this.getEntryIndex(entry)
			: this.getEntryIndex(entry.id)

		if (entryIndex === -1) {
			logger.warn('Entry not found, nothing removed', { entry, entries: this.getEntries() })
			return
		}

		this._entries.splice(entryIndex, 1)
	}

	/**
	 * Get the list of registered entries
	 *
	 * @param {Folder} context the creation context. Usually the current folder
	 */
	public getEntries(context?: Folder): Array<NewMenuEntry> {
		if (context) {
			return this._entries
				.filter(entry => typeof entry.enabled === 'function' ? entry.enabled(context) : true)
		}
		return this._entries
	}

	private getEntryIndex(id: string): number {
		return this._entries.findIndex(entry => entry.id === id)
	}

	private validateEntry(entry: NewMenuEntry) {
		if (!entry.id || !entry.displayName || !(entry.iconSvgInline || entry.iconClass) || !entry.handler) {
			throw new Error('Invalid entry')
		}

		if (typeof entry.id !== 'string'
			|| typeof entry.displayName !== 'string') {
			throw new Error('Invalid id or displayName property')
		}

		if ((entry.iconClass && typeof entry.iconClass !== 'string')
			|| (entry.iconSvgInline && typeof entry.iconSvgInline !== 'string')) {
			throw new Error('Invalid icon provided')
		}

		if (entry.enabled !== undefined && typeof entry.enabled !== 'function') {
			throw new Error('Invalid enabled property')
		}

		if (typeof entry.handler !== 'function') {
			throw new Error('Invalid handler property')
		}

		if ('order' in entry && typeof entry.order !== 'number') {
			throw new Error('Invalid order property')
		}

		if (this.getEntryIndex(entry.id) !== -1) {
			throw new Error('Duplicate entry')
		}
	}

}
