/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { emit } from '@nextcloud/event-bus'
import { TypedEventTarget } from 'typescript-event-target'
import { Node } from './files/node'

/**
 * Active filters can provide one or more "chips" to show the currently active state.
 * Must at least provide a text representing the filters state and a callback to unset that state (disable this filter).
 */
export interface IFileListFilterChip {
	/**
	 * Text of the chip
	 */
	text: string

	/**
	 * Optional icon to be used on the chip (inline SVG as string)
	 */
	icon?: string

	/**
	 * Optional pass a user id to use a user avatar instead of an icon
	 */
	user?: string

	/**
	 * Handler to be called on click
	 */
	onclick: () => void
}

/**
 * This event is emitted when the the filter value changed and the file list needs to be updated
 */
export interface FilterUpdateEvent extends CustomEvent<never> {
	type: 'update:filter'
}

/**
 * This event is emitted when the the filter value changed and the file list needs to be updated
 */
export interface FilterUpdateChipsEvent extends CustomEvent<IFileListFilterChip[]> {
	type: 'update:chips'
}

interface IFileListFilterEvents {
	[name: string]: CustomEvent,
	'update:filter': FilterUpdateEvent
	'update:chips' : FilterUpdateChipsEvent
}

export interface IFileListFilter extends TypedEventTarget<IFileListFilterEvents> {

	/**
	 * Unique ID of this filter
	 */
	readonly id: string

	/**
	 * Order of the filter
	 *
	 * Use a low number to make this filter ordered in front.
	 */
	readonly order: number

	/**
	 * Filter function to decide if a node is shown.
	 *
	 * @param nodes Nodes to filter
	 * @return Subset of the `nodes` parameter to show
	 */
	filter(nodes: Node[]): Node[]

	/**
	 * If the filter needs a visual element for settings it can provide a function to mount it.
	 * @param el The DOM element to mount to
	 */
	mount?(el: HTMLElement): void

	/**
	 * Reset the filter to the initial state.
	 * This is called by the files app.
	 * Implementations should make sure,that if they provide chips they need to emit the `update:chips` event.
	 *
	 * @since 3.10.0
	 */
	reset?(): void
}

export class FileListFilter extends TypedEventTarget<IFileListFilterEvents> implements IFileListFilter {

	public id: string

	public order: number

	constructor(id: string, order: number = 100) {
		super()
		this.id = id
		this.order = order
	}

	public filter(nodes: Node[]): Node[] {
		throw new Error('Not implemented')
		return nodes
	}

	protected updateChips(chips: IFileListFilterChip[]) {
		this.dispatchTypedEvent('update:chips', new CustomEvent('update:chips', { detail: chips }) as FilterUpdateChipsEvent)
	}

	protected filterUpdated() {
		this.dispatchTypedEvent('update:filter', new CustomEvent('update:filter') as FilterUpdateEvent)
	}

}

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
