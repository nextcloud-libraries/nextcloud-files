/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileListFilter } from './listFilters.ts'

import { emit } from '@nextcloud/event-bus'

/**
 * Register a new filter on the file list
 *
 * This only must be called once to register the filter,
 * when the filter state changes you need to call `filterUpdated` on the filter instead.
 *
 * @param filter The filter to register on the file list
 */
export function registerFileListFilter(filter: IFileListFilter): void {
	if (!window._nc_filelist_filters) {
		window._nc_filelist_filters = new Map<string, IFileListFilter>()
	}
	if (window._nc_filelist_filters.has(filter.id)) {
		throw new Error(`File list filter "${filter.id}" already registered`)
	}
	window._nc_filelist_filters.set(filter.id, filter)
	emit('files:filter:added', filter)
}

/**
 * Remove a registered filter from the file list
 *
 * @param filterId The unique ID of the filter to remove
 */
export function unregisterFileListFilter(filterId: string): void {
	if (window._nc_filelist_filters && window._nc_filelist_filters.has(filterId)) {
		window._nc_filelist_filters.delete(filterId)
		emit('files:filter:removed', filterId)
	}
}

/**
 * Get all registered file list filters
 */
export function getFileListFilters(): IFileListFilter[] {
	if (!window._nc_filelist_filters) {
		return []
	}
	return [...window._nc_filelist_filters.values()]
}
