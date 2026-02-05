/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ViewActionContext } from '../types.ts'

import { getRegistry } from '../registry.ts'
import logger from '../utils/logger.ts'

export interface IFileListAction {
	/** Unique ID */
	id: string

	/** Translated name of the action */
	displayName: (context: ViewActionContext) => string

	/** Raw svg string */
	iconSvgInline?: (context: ViewActionContext) => string

	/** Sort order */
	order: number

	/**
	 * Condition whether this action is shown or not
	 */
	enabled?: (context: ViewActionContext) => boolean

	/**
	 * Function executed on single file action
	 *
	 * @return true if the action was executed successfully,
	 * false otherwise and null if the action is silent/undefined.
	 * @throws {Error} If the action failed
	 */
	exec: (context: ViewActionContext) => Promise<boolean | null>
}

/**
 * Register a new file list action.
 *
 * @param action - The file list action to register
 */
export function registerFileListAction(action: IFileListAction) {
	validateAction(action)

	window._nc_filelistactions ??= []
	if (window._nc_filelistactions.find((listAction) => listAction.id === action.id)) {
		logger.error(`FileListAction with id "${action.id}" is already registered`, { action })
		return
	}

	window._nc_filelistactions.push(action)
	getRegistry()
		.dispatchTypedEvent('register:listAction', new CustomEvent('register:listAction', { detail: action }))
}

/**
 * Get all currently registered file list actions.
 */
export function getFileListActions(): IFileListAction[] {
	return [...(window._nc_filelistactions ?? [])]
}

/**
 * Validate a file list action.
 *
 * @param action - The action to validate
 */
function validateAction(action: IFileListAction) {
	if (!action.id || typeof action.id !== 'string') {
		throw new Error('Invalid id')
	}

	if (!action.displayName || typeof action.displayName !== 'function') {
		throw new Error('Invalid displayName function')
	}

	if ('iconSvgInline' in action && typeof action.iconSvgInline !== 'function') {
		throw new Error('Invalid iconSvgInline function')
	}

	if ('order' in action && typeof action.order !== 'number') {
		throw new Error('Invalid order')
	}

	if ('enabled' in action && typeof action.enabled !== 'function') {
		throw new Error('Invalid enabled function')
	}

	if (!action.exec || typeof action.exec !== 'function') {
		throw new Error('Invalid exec function')
	}
}
