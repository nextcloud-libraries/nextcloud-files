/*
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IView } from './navigation/view.ts'
import type { IFolder } from './node/folder.ts'

import { emit } from '@nextcloud/event-bus'
import logger from './utils/logger.ts'

export interface IFileListHeader {
	/** Unique ID */
	id: string
	/** Order */
	order: number

	/**
	 * Condition wether this header is shown or not
	 * If undefined this header is always shown.
	 *
	 * @param folder - The current folder
	 * @param view - The current view
	 */
	enabled?: (folder: IFolder, view: IView) => boolean

	/**
	 * Executed when file list is initialized to render the header
	 *
	 * @param el - The element where to render the header
	 * @param folder - The current folder
	 * @param view - The current view
	 */
	render(el: HTMLElement, folder: IFolder, view: IView): void

	/**
	 * Executed when root folder changed
	 *
	 * @param folder - The current folder
	 * @param view - The current view
	 */
	updated(folder: IFolder, view: IView): void
}

/**
 * Register a new file list header.
 *
 * @param header - The header to register
 */
export function registerFileListHeader(header: IFileListHeader): void {
	validateHeader(header)

	window._nc_filelistheader ??= []
	if (window._nc_filelistheader.find((search) => search.id === header.id)) {
		logger.error(`Header ${header.id} already registered`, { header })
		return
	}

	window._nc_filelistheader.push(header)
	logger.debug(`Registered FileListHeader ${header.id}`, { header })
	emit('file:header:added', header)
}

/**
 * Get all currently registered file list headers.
 */
export function getFileListHeaders(): IFileListHeader[] {
	return [...(window._nc_filelistheader ?? [])]
}

/**
 * Validate a file list header.
 *
 * @param header - The header to validate
 */
function validateHeader(header: IFileListHeader) {
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
