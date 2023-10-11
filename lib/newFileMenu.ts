/**
 * @copyright Copyright (c) 2021 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import type { Folder, Node } from './index'
import logger from './utils/logger'

export interface Entry {
	/** Unique ID */
	id: string

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
	 * @param context the creation context. Usually the current folder
	 * @param content list of file/folders present in the context folder
	 */
	handler: (context: Folder, content: Node[]) => void
}

export class NewFileMenu {

	private _entries: Array<Entry> = []

	public registerEntry(entry: Entry) {
		this.validateEntry(entry)
		this._entries.push(entry)
	}

	public unregisterEntry(entry: Entry | string) {
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
	public getEntries(context?: Folder): Array<Entry> {
		if (context) {
			return this._entries
				.filter(entry => typeof entry.enabled === 'function' ? entry.enabled(context) : true)
		}
		return this._entries
	}

	private getEntryIndex(id: string): number {
		return this._entries.findIndex(entry => entry.id === id)
	}

	private validateEntry(entry: Entry) {
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

export const getNewFileMenu = function(): NewFileMenu {
	if (typeof window._nc_newfilemenu === 'undefined') {
		window._nc_newfilemenu = new NewFileMenu()
		logger.debug('NewFileMenu initialized')
	}
	return window._nc_newfilemenu
}
