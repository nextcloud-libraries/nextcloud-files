/*
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFolder, INode } from '../node/index.ts'

import isSvg from 'is-svg'
import { Column } from './column.ts'

export type ContentsWithRoot = {
	folder: IFolder,
	contents: INode[]
}

export interface IGetContentsOptions {
	/**
	 * Abort signal to be able to cancel the request.
	 *
	 *@see https://developer.mozilla.org/en-US/docs/Web/API/AbortController
	 */
	signal: AbortSignal
}

export interface IView {
	/** Unique view ID */
	id: string
	/** Translated view name */
	name: string
	/** Translated accessible description of the view */
	caption?: string

	/** Translated title of the empty view */
	emptyTitle?: string
	/** Translated description of the empty view */
	emptyCaption?: string
	/**
	 * Custom implementation of the empty view.
	 * If set and no content is found for the current view,
	 * then this method is called with the container element
	 * where to render your empty view implementation.
	 *
	 * @param div - The container element to render into
	 */
	emptyView?: (div: HTMLDivElement) => void

	/**
	 * Method return the content of the provided path.
	 *
	 * This method _must_ also return the current directory
	 * information alongside with its content.
	 *
	 * An abort signal is provided to be able to
	 * cancel the request if the user change directory
	 * {@see https://developer.mozilla.org/en-US/docs/Web/API/AbortController }.
	 */
	getContents(path: string, options: IGetContentsOptions): Promise<ContentsWithRoot>

	/**
	 * If set then the view will be hidden from the navigation unless its the active view.
	 */
	hidden?: true

	/** The view icon as an inline svg */
	icon: string

	/**
	 * The view order.
	 * If not set will be natural sorted by view name.
	 */
	order?: number

	/**
	 * Custom params to give to the router on click
	 * If defined, will be treated as a dummy view and
	 * will just redirect and not fetch any contents.
	 */
	params?: Record<string, string>

	/**
	 * This view column(s). Name and actions are
	 * by default always included
	 */
	columns?: Column[]

	/** The parent unique ID */
	parent?: string
	/** This view is sticky (sent at the bottom) */
	sticky?: boolean

	/**
	 * This view has children and is expanded (by default)
	 * or not. This will be overridden by user config.
	 */
	expanded?: boolean

	/**
	 * Will be used as default if the user
	 * haven't customized their sorting column
	 */
	defaultSortKey?: string

	/**
	 * Method called to load child views if any
	 */
	loadChildViews?: (view: IView) => Promise<void>
}

export class View implements IView {

	private _view: IView

	constructor(view: IView) {
		validateView(view)
		this._view = view
	}

	get id() {
		return this._view.id
	}

	get name() {
		return this._view.name
	}

	get caption() {
		return this._view.caption
	}

	get emptyTitle() {
		return this._view.emptyTitle
	}

	get emptyCaption() {
		return this._view.emptyCaption
	}

	get getContents() {
		return this._view.getContents
	}

	get hidden() {
		return this._view.hidden
	}

	get icon() {
		return this._view.icon
	}

	set icon(icon) {
		this._view.icon = icon
	}

	get order() {
		return this._view.order
	}

	set order(order) {
		this._view.order = order
	}

	get params() {
		return this._view.params
	}

	set params(params) {
		this._view.params = params
	}

	get columns() {
		return this._view.columns
	}

	get emptyView() {
		return this._view.emptyView
	}

	get parent() {
		return this._view.parent
	}

	get sticky() {
		return this._view.sticky
	}

	get expanded() {
		return this._view.expanded
	}

	set expanded(expanded: boolean | undefined) {
		this._view.expanded = expanded
	}

	get defaultSortKey() {
		return this._view.defaultSortKey
	}

	get loadChildViews() {
		return this._view.loadChildViews
	}

}

/**
 * Validate a view interface to check all required properties are satisfied.
 *
 * @param view the view to check
 * @throws {Error} if the view is not valid
 */
export function validateView(view: IView) {
	if (!view.icon || typeof view.icon !== 'string' || !isSvg(view.icon)) {
		throw new Error('View icon is required and must be a valid svg string')
	}

	if (!view.id || typeof view.id !== 'string') {
		throw new Error('View id is required and must be a string')
	}

	if (!view.getContents || typeof view.getContents !== 'function') {
		throw new Error('View getContents is required and must be a function')
	}

	if (!view.name || typeof view.name !== 'string') {
		throw new Error('View name is required and must be a string')
	}

	// optional properties type checks

	checkOptionalProperty(view, 'caption', 'string')
	checkOptionalProperty(view, 'columns', 'array')
	checkOptionalProperty(view, 'defaultSortKey', 'string')
	checkOptionalProperty(view, 'emptyCaption', 'string')
	checkOptionalProperty(view, 'emptyTitle', 'string')
	checkOptionalProperty(view, 'emptyView', 'function')
	checkOptionalProperty(view, 'expanded', 'boolean')
	checkOptionalProperty(view, 'hidden', 'boolean')
	checkOptionalProperty(view, 'loadChildViews', 'function')
	checkOptionalProperty(view, 'order', 'number')
	checkOptionalProperty(view, 'params', 'object')
	checkOptionalProperty(view, 'parent', 'string')
	checkOptionalProperty(view, 'sticky', 'boolean')

	if (view.columns) {
		view.columns.forEach((column) => {
			if (!(column instanceof Column)) {
				throw new Error('View columns must be an array of Column. Invalid column found')
			}
		})
	}
}

/**
 * Check an optional property type
 *
 * @param obj - the object to check
 * @param property - the property name
 * @param type - the expected type
 * @throws {Error} if the property is defined and not of the expected type
 */
function checkOptionalProperty(
	obj: Partial<IView>,
	property: keyof IView,
	type: 'array' | 'function' | 'string' | 'boolean' | 'number' | 'object',
): void {
	if (typeof obj[property] !== 'undefined') {
		if (type === 'array') {
			if (!Array.isArray(obj[property])) {
				throw new Error(`View ${property} must be an array`)
			}
		// eslint-disable-next-line valid-typeof
		} else if (typeof obj[property] !== type) {
			throw new Error(`View ${property} must be a ${type}`)
		} else if (type === 'object' && (obj[property] === null || Array.isArray(obj[property]))) {
			throw new Error(`View ${property} must be an object`)
		}
	}
}
