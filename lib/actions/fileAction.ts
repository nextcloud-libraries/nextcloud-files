/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ActionContext, ActionContextSingle } from '../types.ts'

import logger from '../utils/logger.ts'

export const DefaultType = Object.freeze({
	DEFAULT: 'default',
	HIDDEN: 'hidden',
})

export type TDefaultType = typeof DefaultType[keyof typeof DefaultType]

export interface IHotkeyConfig {
	/**
	 * Short, translated, description what this action is doing.
	 * This will be used as the description next to the hotkey in the shortcuts overview.
	 */
	description: string

	/**
	 * The key to be pressed.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
	 */
	key: string

	/**
	 * If set then the callback is only called when the shift key is (not) pressed.
	 * When left `undefined` a pressed shift key is ignored (callback is run with and without shift pressed).
	 */
	shift?: boolean

	/**
	 * Only execute the action if the control key is pressed.
	 * On Mac devices the command key is used instead.
	 */
	ctrl?: true

	/**
	 * Only execute the action if the alt key is pressed
	 */
	alt?: true
}

export interface IFileAction {
	/** Unique ID */
	id: string
	/** Translatable string displayed in the menu */
	displayName: (context: ActionContext) => string
	/** Translatable title for of the action */
	title?: (context: ActionContext) => string
	/** Svg as inline string. <svg><path fill="..." /></svg> */
	iconSvgInline: (context: ActionContext) => string
	/** Condition wether this action is shown or not */
	enabled?: (context: ActionContext) => boolean

	/**
	 * Function executed on single file action
	 *
	 * @return true if the action was executed successfully,
	 * false otherwise and null if the action is silent/undefined.
	 * @throws {Error} If the action failed
	 */
	exec: (context: ActionContextSingle) => Promise<boolean | null>
	/**
	 * Function executed on multiple files action
	 *
	 * @return true if the action was executed successfully,
	 * false otherwise and null if the action is silent/undefined.
	 * @throws {Error} If the action failed
	 */
	execBatch?: (context: ActionContext) => Promise<(boolean | null)[]>

	/** This action order in the list */
	order?: number

	/**
	 * Allows to define a hotkey which will trigger this action for the selected node.
	 */
	hotkey?: IHotkeyConfig

	/**
	 * Set to true if this action is a destructive action, like "delete".
	 * This will change the appearance in the action menu more prominent (e.g. red colored)
	 */
	destructive?: boolean

	/**
	 * This action's parent id in the list.
	 * If none found, will be displayed as a top-level action.
	 */
	parent?: string

	/**
	 * Make this action the default.
	 *
	 * If multiple actions are default, the first one will be used.
	 * The other ones will be put as first entries in the actions menu iff `DefaultType.Hidden` is not used.
	 *
	 * A `DefaultType.Hidden` action will never be shown
	 * in the actions menu even if another action takes
	 * its place as default.
	 *
	 * @see DefaultType
	 */
	default?: TDefaultType
	/**
	 * If true, the renderInline function will be called
	 */
	inline?: (context: ActionContextSingle) => boolean
	/**
	 * If defined, the returned html element will be
	 * appended before the actions menu.
	 */
	renderInline?: (context: ActionContextSingle) => Promise<HTMLElement | null>
}

/**
 * Register a new file action.
 *
 * @param action - The file list action to register
 */
export function registerFileAction(action: IFileAction): void {
	validateAction(action)

	window._nc_fileactions ??= []
	if (window._nc_fileactions.find((search) => search.id === action.id)) {
		logger.error(`FileAction ${action.id} already registered`, { action })
		return
	}

	window._nc_fileactions.push(action)
}

/**
 * Get all registered file actions.
 */
export function getFileActions(): IFileAction[] {
	return window._nc_fileactions ?? []
}

/**
 * Validate a file action.
 *
 * @param action - The action to validate
 */
function validateAction(action: IFileAction) {
	if (!action.id || typeof action.id !== 'string') {
		throw new Error('Invalid id')
	}

	if (!action.displayName || typeof action.displayName !== 'function') {
		throw new Error('Invalid displayName function')
	}

	if ('title' in action && typeof action.title !== 'function') {
		throw new Error('Invalid title function')
	}

	if (!action.iconSvgInline || typeof action.iconSvgInline !== 'function') {
		throw new Error('Invalid iconSvgInline function')
	}

	if (!action.exec || typeof action.exec !== 'function') {
		throw new Error('Invalid exec function')
	}

	// Optional properties --------------------------------------------
	if ('enabled' in action && typeof action.enabled !== 'function') {
		throw new Error('Invalid enabled function')
	}

	if ('execBatch' in action && typeof action.execBatch !== 'function') {
		throw new Error('Invalid execBatch function')
	}

	if ('order' in action && typeof action.order !== 'number') {
		throw new Error('Invalid order')
	}

	if (action.destructive !== undefined && typeof action.destructive !== 'boolean') {
		throw new Error('Invalid destructive flag')
	}

	if ('parent' in action && typeof action.parent !== 'string') {
		throw new Error('Invalid parent')
	}

	if (action.default && !Object.values(DefaultType).includes(action.default)) {
		throw new Error('Invalid default')
	}

	if ('inline' in action && typeof action.inline !== 'function') {
		throw new Error('Invalid inline function')
	}

	if ('renderInline' in action && typeof action.renderInline !== 'function') {
		throw new Error('Invalid renderInline function')
	}

	if ('hotkey' in action && action.hotkey !== undefined) {
		if (typeof action.hotkey !== 'object') {
			throw new Error('Invalid hotkey configuration')
		}

		if (typeof action.hotkey.key !== 'string' || !action.hotkey.key) {
			throw new Error('Missing or invalid hotkey key')
		}

		if (typeof action.hotkey.description !== 'string' || !action.hotkey.description) {
			throw new Error('Missing or invalid hotkey description')
		}
	}
}
