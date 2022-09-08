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

import logger from "./utils/logger"

export interface Entry {
	/** Unique ID */
	id: string
	/** Translatable string displayed in the menu */
	displayName: string
	// Default new file name
	templateName: string
	// Condition wether this entry is shown or not
	if?: (context: Object) => Boolean
	/**
	 * Either iconSvgInline or iconClass must be defined
	 * Svg as inline string. <svg><path fill="..." /></svg>
	 */
	iconSvgInline?: string
	/** Existing icon css class */
	iconClass?: string
	/** Function to be run after creation */
	handler?: Function
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
			logger.warn('Entry not found, nothing removed', { entry , entries: this.getEntries() })
			return
		}

		this._entries.splice(entryIndex, 1)
	}
	
	/**
	 * Get the list of registered entries
	 * 
	 * @param {FileInfo} context the creation context. Usually the current folder FileInfo
	 */
	public getEntries(context?: Object): Array<Entry> {
		if (context) {
			return this._entries
				.filter(entry => typeof entry.if === 'function' ? entry.if(context) : true)
		}
		return this._entries
	}

	private getEntryIndex(id: string): number {
		return this._entries.findIndex(entry => entry.id === id)
	}

	private validateEntry(entry: Entry) {
		if (!entry.id || !entry.displayName || !entry.templateName || !(entry.iconSvgInline || entry.iconClass) ||!entry.handler) {
			throw new Error('Invalid entry')
		}

		if (typeof entry.id !== 'string'
			|| typeof entry.displayName !== 'string'
			|| typeof entry.templateName !== 'string'
			|| (entry.iconClass && typeof entry.iconClass !== 'string')
			|| (entry.iconSvgInline && typeof entry.iconSvgInline !== 'string')) {
			throw new Error('Invalid entry')
		}

		if (entry.if !== undefined && typeof entry.if !== 'function') {
			throw new Error('Invalid entry, if must be a valid function')
		}

		if (typeof entry.handler !== 'function') {
			throw new Error('Invalid entry handler')
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