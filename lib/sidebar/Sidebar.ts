/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ISidebarContext, ISidebarTab } from './SidebarTab.ts'

import { getSidebarTabs, registerSidebarTab } from './SidebarTab.ts'

export interface ISidebar {
	/**
	 * If the files sidebar can currently be accessed.
	 * Registering tabs also works if the sidebar is currently not available.
	 */
	readonly available: boolean

	/**
	 * The current open state of the sidebar
	 */
	readonly open: boolean

	/**
	 * Open or close the sidebar
	 *
	 * @param open - The new open state
	 */
	setOpen(open: boolean): void

	/**
	 * Register a new sidebar tab
	 *
	 * @param tab - The sidebar tab to register
	 */
	registerTab(tab: ISidebarTab): void

	/**
	 * Get all registered sidebar tabs.
	 * If a node is passed only the enabled tabs are retrieved.
	 */
	getTabs(context?: ISidebarContext): ISidebarTab[]
}

/**
 * This is just a proxy allowing an arbitrary `@nextcloud/files` library version to access the defined interface of the sidebar.
 * By proxying this instead of providing the implementation here we ensure that if apps use different versions of the library,
 * we do not end up with version conflicts between them.
 *
 * If we add new properties they just will be available in new library versions.
 * If we decide to do a breaking change we can either add compatibility wrappers in the implementation in the files app.
 */
class SidebarProxy implements ISidebar {

	get available(): boolean {
		return !!window.OCA?.Files?.Sidebar
	}

	get open(): boolean {
		return !!window.OCA?.Files?.Sidebar?.state.file
	}

	setOpen(open: boolean): void {
		if (open) {
			window.OCA?.Files?.Sidebar?.open()
		} else {
			window.OCA?.Files?.Sidebar?.close()
		}
	}

	setActiveTab(tabId: string): void {
		window.OCA?.Files?.Sidebar?.setActiveTab(tabId)
	}

	registerTab(tab: ISidebarTab): void {
		registerSidebarTab(tab)
	}

	getTabs(context?: ISidebarContext): ISidebarTab[] {
		const tabs = getSidebarTabs()
		if (context) {
			return tabs.filter((tab) => tab.enabled(context))
		}
		return tabs
	}

}

/**
 * Get a reference to the files sidebar.
 */
export function getSidebar(): ISidebar {
	return new SidebarProxy()
}
