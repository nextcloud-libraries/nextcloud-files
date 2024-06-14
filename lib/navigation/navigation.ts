/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { View } from './view'
import logger from '../utils/logger'

export class Navigation {

	private _views: View[] = []
	private _currentView: View | null = null

	register(view: View) {
		if (this._views.find(search => search.id === view.id)) {
			throw new Error(`View id ${view.id} is already registered`)
		}

		this._views.push(view)
	}

	remove(id: string) {
		const index = this._views.findIndex(view => view.id === id)
		if (index !== -1) {
			this._views.splice(index, 1)
		}
	}

	get views(): View[] {
		return this._views
	}

	setActive(view: View | null) {
		this._currentView = view
	}

	get active(): View | null {
		return this._currentView
	}

}

export const getNavigation = function(): Navigation {
	if (typeof window._nc_navigation === 'undefined') {
		window._nc_navigation = new Navigation()
		logger.debug('Navigation service initialized')
	}

	return window._nc_navigation
}
