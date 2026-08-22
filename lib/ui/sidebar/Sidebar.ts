/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { INode } from '../../node/node.ts'
import type { ISidebarAction } from './SidebarAction.ts'
import type { ISidebarContext, ISidebarTab } from './SidebarTab.ts'

import logger from '../../utils/logger.ts'
import { registerSidebarAction } from './SidebarAction.ts'
import { registerSidebarTab } from './SidebarTab.ts'

export interface ISidebar {
	/**
	 * If the files sidebar can currently be accessed,
	 * meaning it is rendered on the current page either by the files app
	 * or by an app rendering the sidebar within its own app.
	 * Registering tabs also works if the sidebar is currently not available.
	 */
	readonly available: boolean

	/**
	 * The current open state of the sidebar
	 */
	readonly isOpen: boolean

	/**
	 * The currently active sidebar tab id
	 */
	readonly activeTab?: string

	/**
	 * The currently opened node in the sidebar
	 */
	readonly node?: INode

	/**
	 * Open the sidebar for a specific node.
	 *
	 * When the sidebar is fully opened the `files:sidebar:opened` event is emitted,
	 * see also `@nextcloud/event-bus`.
	 *
	 * @param node - The node to open the sidebar for
	 * @param tab - The tab to open by default
	 */
	open(node: INode, tab?: string): void

	/**
	 * Close the sidebar.
	 *
	 * When the sidebar is fully closed the `files:sidebar:closed` event is emitted,
	 * see also `@nextcloud/event-bus`.
	 */
	close(): void

	/**
	 * Set the active sidebar tab
	 *
	 * @param tabId - The tab to set active
	 */
	setActiveTab(tabId: string): void

	/**
	 * Render the sidebar as a fullscreen overlay of the current page.
	 *
	 * @param isFullScreen - Whether to render the sidebar fullscreen
	 */
	setFullScreenMode(isFullScreen: boolean): void

	/**
	 * Render the sidebar into an element of the current app.
	 *
	 * The sidebar is rendered into the app content element as soon as the page is loaded,
	 * so this is only needed by apps that render the sidebar into a specific element
	 * or that set up their own layout after the page was loaded.
	 * Calling this again moves an already rendered sidebar into the requested element.
	 *
	 * Requires the app to request the sidebar for the current page,
	 * by dispatching the `OCA\Files\Event\LoadSidebar` event while rendering it.
	 * Within the files app the sidebar is part of the app layout, so this does nothing.
	 *
	 * @param target - The element to render the sidebar into
	 */
	mount(target: HTMLElement): void

	/**
	 * Register a new sidebar tab.
	 * This should ideally be done on app initialization using Nextcloud init scripts.
	 *
	 * @param tab - The sidebar tab to register
	 */
	registerTab(tab: ISidebarTab): void

	/**
	 * Get all registered sidebar tabs.
	 * If a node is passed only the enabled tabs are retrieved.
	 */
	getTabs(context?: ISidebarContext): ISidebarTab[]

	/**
	 * Get all registered sidebar actions.
	 *
	 * If a context is provided only the enabled actions are returned.
	 *
	 * @param context - The context
	 */
	getActions(context?: ISidebarContext): ISidebarAction[]

	/**
	 * Register a new sidebar action.
	 *
	 * @param action - The action to register
	 */
	registerAction(action: ISidebarAction): void
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
	get #impl(): Omit<ISidebar, 'available' | 'mount' | 'registerTab' | 'registerAction'> | undefined {
		return window.OCA?.Files?._sidebar?.()
	}

	get available(): boolean {
		return !!this.#impl
	}

	get isOpen(): boolean {
		return this.#impl?.isOpen ?? false
	}

	get activeTab(): string | undefined {
		return this.#impl?.activeTab
	}

	get node(): INode | undefined {
		return this.#impl?.node
	}

	open(node: INode, tab?: string): void {
		this.#impl?.open(node, tab)
	}

	close(): void {
		this.#impl?.close()
	}

	setActiveTab(tabId: string): void {
		this.#impl?.setActiveTab(tabId)
	}

	setFullScreenMode(isFullScreen: boolean): void {
		this.#impl?.setFullScreenMode(isFullScreen)
	}

	mount(target: HTMLElement): void {
		const mountSidebar = window.OCA?.Files?._mountSidebar
		if (mountSidebar === undefined) {
			logger.error('Cannot render the sidebar as it was not loaded for this page, see the `LoadSidebar` event.')
			return
		}

		mountSidebar(target)
	}

	registerTab(tab: ISidebarTab): void {
		registerSidebarTab(tab)
	}

	getTabs(context?: ISidebarContext): ISidebarTab[] {
		return this.#impl?.getTabs(context) ?? []
	}

	getActions(context?: ISidebarContext): ISidebarAction[] {
		return this.#impl?.getActions(context) ?? []
	}

	registerAction(action: ISidebarAction): void {
		registerSidebarAction(action)
	}
}

/**
 * Get a reference to the files sidebar.
 */
export function getSidebar(): ISidebar {
	return new SidebarProxy()
}
