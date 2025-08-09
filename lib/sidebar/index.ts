/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFolder, INode } from '../node/index.ts'

import isSvg from 'is-svg'
import logger from '../utils/logger.ts'

interface SidebarUpdateContext {
	/**
	 * The currently selected node for which the sidebar is shown.
	 */
	node: INode

	/**
	 * The parent of the current selected node.
	 * This is not necessarily the real parent folder of the node in means of the real filesystem tree,
	 * but rather the parent folder in the current view of the files app.
	 */
	parent: IFolder
}

/**
 * Implementation of a custom sidebar tab within the files app.
 */
export interface ISidebarTab {
	/**
	 * Unique id of the sidebar tab.
	 * This has to conform to the HTML id attribute specification.
	 */
	id: string

	/**
	 * The localized name of the sidebar tab.
	 */
	displayName: string

	/**
	 * The icon, as SVG, of the sidebar tab.
	 */
	iconSvg: string

	/**
	 * The order of this tab.
	 * Use a low number to make this tab ordered in front.
	 */
	order: number

	/**
	 * Callback to check if the sidebar tab should be shown for the selected node.
	 *
	 * @param node - The currently selected node
	 */
	enabled: (node: INode) => boolean

	/**
	 * Called by the files app if this tab has become the active tab or was deactivated.
	 *
	 * @param active - The new active state of this tab
	 */
	setActive: (active: boolean) => void | Promise<void>

	/**
	 * The lifecylce method for mounting the sidebar tab onto the sidebar.
	 *
	 * @param el - The element to mount the sidebar tab to
	 * @param context - The current sidebar context
	 */
	mount: (el: HTMLElement, context: SidebarUpdateContext) => void | Promise<void>

	/**
	 * The lifecycle method for updating the sidebar tab.
	 * This is called if the currently selected node changes.
	 *
	 * @param context - The current sidebar context
	 */
	update: (context: SidebarUpdateContext) => void | Promise<void>

	/**
	 * The lifecycle method for unmounting the sidebar tab.
	 * This is called if the sidebar is unmounted from the files app and thus the sidebar tab needs to do its cleanup and unmounting.
	 */
	unmount: () => void | Promise<void>

	/**
	 * Called when the bottom of the sidebar was reached during scrolling.
	 */
	onScrollBottomReached?: () => void | Promise<void>
}

/**
 * Register a new sidebar tab for the files app.
 *
 * @param tab - The sidebar tab to register
 * @throws If the provided tab is not a valid sidebar tab and thus cannot be registered.
 */
export function registerSidebarTab(tab: ISidebarTab): void {
	validateSidebarTab(tab)

	window._nc_files_sidebar_tabs ??= new Map<string, ISidebarTab>()
	if (window._nc_files_sidebar_tabs.has(tab.id)) {
		logger.warn(`Sidebar tab with id "${tab.id}" already registered. Skipping.`)
		return
	}
	window._nc_files_sidebar_tabs.set(tab.id, tab)
	logger.debug(`New sidebar tab with id "${tab.id}" registered.`)
}

/**
 * Get all currently registered sidebar tabs.
 */
export function getSidebarTabs(): ISidebarTab[] {
	if (window._nc_files_sidebar_tabs) {
		return [...window._nc_files_sidebar_tabs.values()]
	}
	return []
}

/**
 * Check if a given sidebar tab objects implements all necessary fields.
 *
 * @param tab - The sidebar tab to validate
 */
function validateSidebarTab(tab: ISidebarTab): void {
	if (typeof tab !== 'object') {
		throw new Error('Sidebar tab is not an object')
	}

	if (!tab.id || (typeof tab.id !== 'string') || tab.id !== CSS.escape(tab.id)) {
		throw new Error('Sidebar tabs need to have an id conforming to the HTML id attribute specifications')
	}

	if (!tab.displayName || typeof tab.displayName !== 'string') {
		throw new Error('Sidebar tabs need to have a name set')
	}

	if (typeof tab.iconSvg !== 'string' || !isSvg(tab.iconSvg)) {
		throw new Error('Sidebar tabs need to have an valid SVG icon')
	}

	if (typeof tab.order !== 'number') {
		throw new Error('Sidebar tabs need to have a numeric order set')
	}

	if (typeof tab.enabled !== 'function') {
		throw new Error('Sidebar tabs need to have an "enabled" method')
	}

	if (typeof tab.setActive !== 'function') {
		throw new Error('Sidebar tabs need to have a "setActive" method')
	}

	if (typeof tab.mount !== 'function'
		|| typeof tab.update !== 'function'
		|| typeof tab.unmount !== 'function'
	) {
		throw new Error('Sidebar tab is missing a required lifecycle method')
	}

	if (tab.onScrollBottomReached && typeof tab.onScrollBottomReached !== 'function') {
		throw new Error('"onScrollBottomReached" of the sidebar tab needs to be a function')
	}
}
