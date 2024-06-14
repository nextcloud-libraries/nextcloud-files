/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { INode } from '../files/node'
import { orderBy } from './sorting'

export enum FilesSortingMode {
	Name = 'basename',
	Modified = 'mtime',
	Size = 'size',
}

export interface FilesSortingOptions {
	/**
	 * They key to order the files by
	 * @default FilesSortingMode.Name
	 */
	sortingMode?: FilesSortingMode

	/**
	 * @default 'asc'
	 */
	sortingOrder?: 'asc'|'desc'

	/**
	 * If set to true nodes marked as favorites are ordered on top of all other nodes
	 * @default false
	 */
	sortFavoritesFirst?: boolean

	/**
	 * If set to true folders are ordered on top of files
	 * @default false
	 */
	sortFoldersFirst?: boolean
}

/**
 * Sort files and folders according to the sorting options
 * @param nodes Nodes to sort
 * @param options Sorting options
 */
export function sortNodes(nodes: readonly INode[], options: FilesSortingOptions = {}): INode[] {
	const sortingOptions = {
		// Default to sort by name
		sortingMode: FilesSortingMode.Name,
		// Default to sort ascending
		sortingOrder: 'asc' as const,
		...options,
	}

	/**
	 * Get the basename without any extension
	 * @param name The filename to extract the basename from
	 */
	const basename = (name: string) => name.lastIndexOf('.') > 0 ? name.slice(0, name.lastIndexOf('.')) : name

	const identifiers = [
		// 1: Sort favorites first if enabled
		...(sortingOptions.sortFavoritesFirst ? [(v: INode) => v.attributes?.favorite !== 1] : []),
		// 2: Sort folders first if sorting by name
		...(sortingOptions.sortFoldersFirst ? [(v: INode) => v.type !== 'folder'] : []),
		// 3: Use sorting mode if NOT basename (to be able to use displayName too)
		...(sortingOptions.sortingMode !== FilesSortingMode.Name ? [(v: INode) => v[sortingOptions.sortingMode]] : []),
		// 4: Use displayName if available, fallback to name
		(v: INode) => basename(v.attributes?.displayName || v.basename),
		// 5: Finally, use basename if all previous sorting methods failed
		(v: INode) => v.basename,
	]
	const orders = [
		// (for 1): always sort favorites before normal files
		...(sortingOptions.sortFavoritesFirst ? ['asc'] : []),
		// (for 2): always sort folders before files
		...(sortingOptions.sortFoldersFirst ? ['asc'] : []),
		// (for 3): Reverse if sorting by mtime as mtime higher means edited more recent -> lower
		...(sortingOptions.sortingMode === FilesSortingMode.Modified ? [sortingOptions.sortingOrder === 'asc' ? 'desc' : 'asc'] : []),
		// (also for 3 so make sure not to conflict with 2 and 3)
		...(sortingOptions.sortingMode !== FilesSortingMode.Modified && sortingOptions.sortingMode !== FilesSortingMode.Name ? [sortingOptions.sortingOrder] : []),
		// for 4: use configured sorting direction
		sortingOptions.sortingOrder,
		// for 5: use configured sorting direction
		sortingOptions.sortingOrder,
	] as ('asc'|'desc')[]

	return orderBy(nodes, identifiers, orders)
}
