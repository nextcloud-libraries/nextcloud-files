/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileListFilter } from './listFilters.ts'

import { scopedGlobals } from '../../globalScope.ts'
import { getRegistry } from '../registry.ts'

/**
 * Register a new filter on the file list
 *
 * This only must be called once to register the filter,
 * when the filter state changes you need to call `filterUpdated` on the filter instead.
 *
 * @param filter The filter to register on the file list
 */
export function registerFileListFilter(filter: IFileListFilter): void {
	scopedGlobals.fileListFilters ??= new Map<string, IFileListFilter>()
	if (scopedGlobals.fileListFilters.has(filter.id)) {
		throw new Error(`File list filter "${filter.id}" already registered`)
	}

	scopedGlobals.fileListFilters.set(filter.id, filter)
	getRegistry()
		.dispatchTypedEvent('register:listFilter', new CustomEvent('register:listFilter', { detail: filter }))
}

/**
 * Remove a registered filter from the file list
 *
 * @param filterId The unique ID of the filter to remove
 */
export function unregisterFileListFilter(filterId: string): void {
	if (scopedGlobals.fileListFilters && scopedGlobals.fileListFilters.has(filterId)) {
		scopedGlobals.fileListFilters.delete(filterId)
		getRegistry()
			.dispatchTypedEvent('unregister:listFilter', new CustomEvent('unregister:listFilter', { detail: filterId }))
	}
}

/**
 * Get all registered file list filters
 */
export function getFileListFilters(): IFileListFilter[] {
	if (scopedGlobals.fileListFilters) {
		return [...scopedGlobals.fileListFilters.values()]
	}
	return []
}
