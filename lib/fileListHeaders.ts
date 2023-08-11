/**
 * @copyright Copyright (c) 2023 John Molakvoæ <skjnldsv@protonmail.com>
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

import { Folder } from './files/folder'
import logger from './utils/logger'

export interface HeaderData {
	/** Unique ID */
	id: string
	/** Order */
	order: number
	/** Condition wether this header is shown or not */
	enabled?: (folder: Folder, view) => boolean
	/** Executed when file list is initialized */
	render: (el: HTMLElement, folder: Folder, view) => void
	/** Executed when root folder changed */
	updated(folder: Folder, view)
}

export class Header {

	private _header: HeaderData

	constructor(header: HeaderData) {
		this.validateHeader(header)
		this._header = header
	}

	get id() {
		return this._header.id
	}

	get order() {
		return this._header.order
	}

	get enabled() {
		return this._header.enabled
	}

	get render() {
		return this._header.render
	}

	get updated() {
		return this._header.updated
	}

	private validateHeader(header: HeaderData) {
		if (!header.id || !header.render || !header.updated) {
			throw new Error('Invalid header: id, render and updated are required')
		}

		if (typeof header.id !== 'string') {
			throw new Error('Invalid id property')
		}

		if (header.enabled !== undefined && typeof header.enabled !== 'function') {
			throw new Error('Invalid enabled property')
		}

		if (header.render && typeof header.render !== 'function') {
			throw new Error('Invalid render property')
		}

		if (header.updated && typeof header.updated !== 'function') {
			throw new Error('Invalid updated property')
		}
	}

}

export const registerFileListHeaders = function(header: Header): void {
	if (typeof window._nc_filelistheader === 'undefined') {
		window._nc_filelistheader = []
		logger.debug('FileListHeaders initialized')
	}

	// Check duplicates
	if (window._nc_filelistheader.find(search => search.id === header.id)) {
		logger.error(`Header ${header.id} already registered`, { header })
		return
	}

	window._nc_filelistheader.push(header)
}

export const getFileListHeaders = function(): Header[] {
	if (typeof window._nc_filelistheader === 'undefined') {
		window._nc_filelistheader = []
		logger.debug('FileListHeaders initialized')
	}

	return window._nc_filelistheader
}
