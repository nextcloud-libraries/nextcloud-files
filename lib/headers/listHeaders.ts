/*
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IView } from '../navigation/view.ts'
import type { IFolder } from '../node/folder.ts'

import { scopedGlobals } from '../globalScope.ts'
import { getRegistry } from '../registry.ts'
import logger from '../utils/logger.ts'

export interface IFileListHeader {
	/** Unique ID */
	id: string
	/** Order */
	order: number
	/** Condition wether this header is shown or not */
	enabled?: (folder: IFolder, view: IView) => boolean
	/** Executed when file list is initialized */
	render(el: HTMLElement, folder: IFolder, view: IView): void
	/** Executed when root folder changed */
	updated(folder: IFolder, view: IView): void
}

/**
 * Register a new file list header.
 *
 * @param header - The header to register
 */
export function registerFileListHeader(header: IFileListHeader): void {
	validateHeader(header)

	scopedGlobals.fileListHeaders ??= new Map<string, IFileListHeader>()
	if (scopedGlobals.fileListHeaders.has(header.id)) {
		logger.error(`Header ${header.id} already registered`, { header })
		return
	}

	scopedGlobals.fileListHeaders.set(header.id, header)
	getRegistry()
		.dispatchTypedEvent('register:listHeader', new CustomEvent('register:listHeader', { detail: header }))
}

/**
 * Get all currently registered file list headers.
 */
export function getFileListHeaders(): IFileListHeader[] {
	if (!scopedGlobals.fileListHeaders) {
		return []
	}
	return [...scopedGlobals.fileListHeaders.values()]
}

/**
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
