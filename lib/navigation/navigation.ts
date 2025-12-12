/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IView } from './view'

import { validateView } from './view'
import { TypedEventTarget } from 'typescript-event-target'
import logger from '../utils/logger'

/**
 * The event is emitted when the navigation view was updated.
 * It contains the new active view in the `detail` attribute.
 */
interface UpdateActiveViewEvent extends CustomEvent<IView | null> {
	type: 'updateActive'
}

/**
 * This event is emitted when the list of registered views is changed
 */
interface UpdateViewsEvent extends CustomEvent<never> {
	type: 'update'
}

/**
 * The files navigation manages the available and active views
 *
 * Custom views for the files app can be registered (examples are the favorites views or the shared-with-you view).
 * It is also possible to listen on changes of the registered views or when the current active view is changed.
 * @example
 * ```js
 * const navigation = getNavigation()
 * navigation.addEventListener('update', () => {
 *     // This will be called whenever a new view is registered or a view is removed
 *     const viewNames = navigation.views.map((view) => view.name)
 *     console.warn('Registered views changed', viewNames)
 * })
 * // Or you can react to changes of the current active view
 * navigation.addEventListener('updateActive', (event) => {
 *     // This will be called whenever the active view changed
 *     const newView = event.detail // you could also use `navigation.active`
 *     console.warn('Active view changed to ' + newView.name)
 * })
 * ```
 */
export class Navigation extends TypedEventTarget<{ updateActive: UpdateActiveViewEvent, update: UpdateViewsEvent }> {

	private _views: IView[] = []
	private _currentView: IView | null = null

	/**
	 * Register a new view on the navigation
	 * @param view The view to register
	 * @throws {Error} if a view with the same id is already registered
	 * @throws {Error} if the registered view is invalid
	 */
	register(view: IView): void {
		if (this._views.find(search => search.id === view.id)) {
			throw new Error(`IView id ${view.id} is already registered`)
		}

		validateView(view)

		this._views.push(view)
		this.dispatchTypedEvent('update', new CustomEvent<never>('update') as UpdateViewsEvent)
	}

	/**
	 * Remove a registered view
	 * @param id The id of the view to remove
	 */
	remove(id: string): void {
		const index = this._views.findIndex(view => view.id === id)
		if (index !== -1) {
			this._views.splice(index, 1)
			this.dispatchTypedEvent('update', new CustomEvent('update') as UpdateViewsEvent)
		}
	}

	/**
	 * Set the currently active view
	 *
	 * @param id - The id of the view to set as active
	 * @throws {Error} If no view with the given id was registered
	 * @fires UpdateActiveViewEvent
	 */
	setActive(id: string | null): void {
		if (id === null) {
			this._currentView = null
		} else {
			const view = this._views.find(({ id: viewId }) => viewId === id)
			if (!view) {
				throw new Error(`No view with ${id} registered`)
			}
			this._currentView = view
		}

		const event = new CustomEvent<IView | null>('updateActive', { detail: this._currentView })
		this.dispatchTypedEvent('updateActive', event as UpdateActiveViewEvent)
	}

	/**
	 * The currently active files view
	 */
	get active(): IView | null {
		return this._currentView
	}

	/**
	 * All registered views
	 */
	get views(): IView[] {
		return this._views
	}

}

/**
 * Get the current files navigation
 */
export const getNavigation = function(): Navigation {
	if (typeof window._nc_navigation === 'undefined') {
		window._nc_navigation = new Navigation()
		logger.debug('Navigation service initialized')
	}

	return window._nc_navigation
}
