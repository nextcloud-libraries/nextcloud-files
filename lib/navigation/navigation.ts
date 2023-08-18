/**
 * @copyright Copyright (c) 2022 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import { View } from './view'
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
