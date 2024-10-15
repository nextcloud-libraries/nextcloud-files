/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Node } from './files/node.ts'
import { View } from './navigation/view.ts'

export interface ViewActionData {
	/** Unique ID */
	id: string

	/** Translated name of the action */
	displayName: (view: View) => string

	/** Translated title of the action */
	title?: (view: View) => string

	/** Raw svg string */
	iconSvgInline: (view: View) => string

	/** Returns true if this action shoud be shown */
	show?: (view: View, nodes: Node[]) => boolean

	/** Returns true if the action should be disabled */
	disabled?: (view: View, nodes: Node[]) => boolean

	/** Function to execute */
	exec: (view: View, nodes: Node[]) => Promise<void>,
}

export class ViewAction {

	private _action: ViewActionData

	constructor(action: ViewActionData) {
		this.validateAction(action)
		this._action = action
	}

	get id() {
		return this._action.id
	}

	get displayName() {
		return this._action.displayName
	}

	get title() {
		return this._action.title
	}

	get iconSvgInline() {
		return this._action.iconSvgInline
	}

	get show() {
		return this._action.show
	}

	get disabled() {
		return this._action.disabled
	}

	get exec() {
		return this._action.exec
	}

	private validateAction(action: ViewActionData) {
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

		if ('show' in action && typeof action.show !== 'function') {
			throw new Error('Invalid show function')
		}

		if ('disabled' in action && typeof action.disabled !== 'function') {
			throw new Error('Invalid disabled function')
		}

		if (!action.exec || typeof action.exec !== 'function') {
			throw new Error('Invalid exec function')
		}
	}

}
