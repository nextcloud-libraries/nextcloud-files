/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFolder, INode } from '../../node/index.ts'
import type { IView } from '../navigation/view.ts'

import isSvg from 'is-svg'
import { scopedGlobals } from '../../globalScope.ts'
import logger from '../../utils/logger.ts'

export interface ISidebarContext {
	/**
	 * The active node in the sidebar
	 */
	node: INode

	/**
	 * The current open folder in the files app
	 */
	folder: IFolder

	/**
	 * The currently active view
	 */
	view: IView
}

/**
 * This component describes the custom web component that should be registered for a sidebar tab.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components
 * @see https://vuejs.org/guide/extras/web-components#building-custom-elements-with-vue
 */
export interface SidebarTabComponent extends ISidebarContext {
	/**
	 * The active state of the sidebar tab.
	 * It will be set to true if this component is the currently active tab.
	 */
	active: boolean
}

/**
 * The instance type of a sidebar tab web component.
 */
export type SidebarTabComponentInstance = SidebarTabComponent & HTMLElement

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
	iconSvgInline: string

	/**
	 * The order of this tab.
	 * Use a low number to make this tab ordered in front.
	 */
	order: number

	/**
	 * The tag name of the web component.
	 *
	 * The web component must be defined using this name with `CustomElementRegistry.define()`,
	 * either on initialization or within the `onInit` callback (preferred).
	 * When rendering the sidebar tab, the files app will wait for the component to be defined in the registry (`customElements.whenDefined()`).
	 *
	 * To avoid name clashes the name has to start with your appid (e.g. `your_app`).
	 * So in addition with the web component naming rules a good name would be `your_app-files-sidebar-tab`.
	 */
	tagName: string

	/**
	 * Callback to check if the sidebar tab should be shown for the selected node.
	 *
	 * If not provided, the tab will always be shown.
	 *
	 * @param context - The current context of the files app
	 */
	enabled?: (context: ISidebarContext) => boolean

	/**
	 * Called when the sidebar tab is active and rendered the first time in the sidebar.
	 * This should be used to register the web componen (`CustomElementRegistry.define()`).
	 *
	 * The sidebar itself will anyways wait for the component to be defined in the registry (`customElements.whenDefined()`).
	 * But also will wait for the promise returned by this method to resolve before rendering the tab.
	 */
	onInit?: () => Promise<void>
}

/**
 * Register a new sidebar tab for the files app.
 *
 * @param tab - The sidebar tab to register
 * @throws {Error} If the provided tab is not a valid sidebar tab and thus cannot be registered.
 */
export function registerSidebarTab(tab: ISidebarTab): void {
	validateSidebarTab(tab)

	scopedGlobals.filesSidebarTabs ??= new Map<string, ISidebarTab>()
	if (scopedGlobals.filesSidebarTabs.has(tab.id)) {
		logger.warn(`Sidebar tab with id "${tab.id}" already registered. Skipping.`)
		return
	}
	scopedGlobals.filesSidebarTabs.set(tab.id, tab)
	logger.debug(`New sidebar tab with id "${tab.id}" registered.`)
}

/**
 * Get all currently registered sidebar tabs.
 */
export function getSidebarTabs(): ISidebarTab[] {
	if (scopedGlobals.filesSidebarTabs) {
		return [...scopedGlobals.filesSidebarTabs.values()]
	}
	return []
}

/**
 * Check if a given sidebar tab objects implements all necessary fields.
 *
 * @param tab - The sidebar tab to validate
 * @throws {Error} If the provided tab is not valid
 */
function validateSidebarTab(tab: ISidebarTab): void {
	if (typeof tab !== 'object') {
		throw new Error('Sidebar tab is not an object')
	}

	if (!tab.id || (typeof tab.id !== 'string') || tab.id !== CSS.escape(tab.id)) {
		throw new Error('Sidebar tabs need to have an id conforming to the HTML id attribute specifications')
	}

	if (!tab.tagName || typeof tab.tagName !== 'string') {
		throw new Error('Sidebar tabs need to have the tagName name set')
	}

	if (!tab.tagName.match(/^[a-z][a-z0-9-_]+$/)) {
		throw new Error('Sidebar tab "tagName" is invalid')
	}

	if (!tab.displayName || typeof tab.displayName !== 'string') {
		throw new Error('Sidebar tabs need to have a name set')
	}

	if (typeof tab.iconSvgInline !== 'string' || !isSvg(tab.iconSvgInline)) {
		throw new Error('Sidebar tabs need to have an valid SVG icon')
	}

	if (typeof tab.order !== 'number') {
		throw new Error('Sidebar tabs need to have a numeric order set')
	}

	if (tab.enabled && typeof tab.enabled !== 'function') {
		throw new Error('Sidebar tab "enabled" is not a function')
	}

	if (tab.onInit && typeof tab.onInit !== 'function') {
		throw new Error('Sidebar tab "onInit" is not a function')
	}
}
