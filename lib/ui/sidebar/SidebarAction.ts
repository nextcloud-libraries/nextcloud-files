/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ISidebarContext } from './SidebarTab.ts'

import { scopedGlobals } from '../../globalScope.ts'
import logger from '../../utils/logger.ts'

/**
 * Implementation of a custom sidebar tab within the files app.
 */
export interface ISidebarAction {
	/**
	 * Unique id of the sidebar tab.
	 * This has to conform to the HTML id attribute specification.
	 */
	id: string

	/**
	 * The order of this tab.
	 * Use a low number to make this tab ordered in front.
	 */
	order: number

	/**
	 * The localized name of the sidebar tab.
	 *
	 * @param context - The current context of the files app
	 */
	displayName(context: ISidebarContext): string

	/**
	 * The icon, as SVG, of the sidebar tab.
	 *
	 * @param context - The current context of the files app
	 */
	iconSvgInline(context: ISidebarContext): string

	/**
	 * Callback to check if the sidebar tab should be shown for the selected node.
	 *
	 * @param context - The current context of the files app
	 */
	enabled(context: ISidebarContext): boolean

	/**
	 * Handle the sidebar action.
	 *
	 * @param context - The current context of the files app
	 */
	onClick(context: ISidebarContext): void
}

/**
 * Register a new sidebar action.
 *
 * @param action - The sidebar action to register
 * @throws {Error} If the provided action is not a valid sidebar action and thus cannot be registered.
 */
export function registerSidebarAction(action: ISidebarAction): void {
	validateSidebarAction(action)

	scopedGlobals.filesSidebarActions ??= new Map<string, ISidebarAction>()
	if (scopedGlobals.filesSidebarActions.has(action.id)) {
		logger.warn(`Sidebar action with id "${action.id}" already registered. Skipping.`)
		return
	}
	scopedGlobals.filesSidebarActions.set(action.id, action)
	logger.debug(`New sidebar action with id "${action.id}" registered.`)
}

/**
 * Get all currently registered sidebar actions.
 */
export function getSidebarActions(): ISidebarAction[] {
	if (scopedGlobals.filesSidebarActions) {
		return [...scopedGlobals.filesSidebarActions.values()]
	}
	return []
}

/**
 * Check if a given sidebar action object implements all necessary fields.
 *
 * @param action - The sidebar action to validate
 */
function validateSidebarAction(action: ISidebarAction): void {
	if (typeof action !== 'object') {
		throw new Error('Sidebar action is not an object')
	}

	if (!action.id || (typeof action.id !== 'string') || action.id !== CSS.escape(action.id)) {
		throw new Error('Sidebar actions need to have an id conforming to the HTML id attribute specifications')
	}

	if (!action.displayName || typeof action.displayName !== 'function') {
		throw new Error('Sidebar actions need to have a displayName function')
	}

	if (!action.iconSvgInline || typeof action.iconSvgInline !== 'function') {
		throw new Error('Sidebar actions need to have a iconSvgInline function')
	}

	if (!action.enabled || typeof action.enabled !== 'function') {
		throw new Error('Sidebar actions need to have an enabled function')
	}

	if (!action.onClick || typeof action.onClick !== 'function') {
		throw new Error('Sidebar actions need to have an onClick function')
	}
}
