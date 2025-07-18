/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Folder } from '../node/folder.ts'
import type { Node } from '../node/node.ts'
import type { View } from '../navigation/view.ts'

import logger from '../utils/logger.ts'

interface FileListActionData {
	/** Unique ID */
	id: string

	/** Translated name of the action */
	displayName: (view: View) => string

	/** Raw svg string */
	iconSvgInline?: (view: View) => string

	/** Sort order */
	order: number

	/**
	 * Condition whether this action is shown or not
	 * @param view The current view
	 * @param nodes The nodes in the current directory
	 * @param folder The current folder
	 */
	enabled?: (view: View, nodes: Node[], folder: Folder) => boolean

	/**
	 * Function executed on single file action
	 * @return true if the action was executed successfully,
	 * false otherwise and null if the action is silent/undefined.
	 * @throws Error if the action failed
	 */
	exec: (view: View, nodes: Node[], folder: Folder) => Promise<boolean|null>,
}

export class FileListAction {

	private _action: FileListActionData

	constructor(action: FileListActionData) {
		this.validateAction(action)
		this._action = action
	}

	get id() {
		return this._action.id
	}

	get displayName() {
		return this._action.displayName
	}

	get iconSvgInline() {
		return this._action.iconSvgInline
	}

	get order() {
		return this._action.order
	}

	get enabled() {
		return this._action.enabled
	}

	get exec() {
		return this._action.exec
	}

	private validateAction(action: FileListActionData) {
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

}

export const registerFileListAction = (action: FileListAction) => {
	if (typeof window._nc_filelistactions === 'undefined') {
		window._nc_filelistactions = []
	}

	if (window._nc_filelistactions.find(listAction => listAction.id === action.id)) {
		logger.error(`FileListAction with id "${action.id}" is already registered`, { action })
		return
	}

	window._nc_filelistactions.push(action)
}

export const getFileListActions = (): FileListAction[] => {
	if (typeof window._nc_filelistactions === 'undefined') {
		window._nc_filelistactions = []
	}

	return window._nc_filelistactions
}
