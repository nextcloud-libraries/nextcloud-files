/*
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IView } from '../navigation/view.ts'
import type { IFolder } from '../node/folder.ts'

export interface HeaderData {
	/** Unique ID */
	id: string
	/** Order */
	order: number
	/** Condition wether this header is shown or not */
	enabled?: (folder: IFolder, view: IView) => boolean
	/** Executed when file list is initialized */
	render: (el: HTMLElement, folder: IFolder, view: IView) => void
	/** Executed when root folder changed */
	updated(folder: IFolder, view: IView)
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
