/*
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { INode } from '../node/node.ts'
import type { IView } from './view.ts'

import { checkOptionalProperty } from '../utils/objectValidation.ts'

interface ColumnData {
	/** Unique column ID */
	id: string
	/** Translated column title */
	title: string
	/** The content of the cell. The element will be appended within */
	render: (node: INode, view: IView) => HTMLElement
	/** Function used to sort INodes between them */
	sort?: (nodeA: INode, nodeB: INode) => number
	/**
	 * Custom summary of the column to display at the end of the list.
	 * Will not be displayed if  nothing is provided
	 */
	summary?: (node: INode[], view: IView) => string
}

export class Column implements ColumnData {

	private _column: ColumnData

	constructor(column: ColumnData) {
		validateColumn(column)
		this._column = column
	}

	get id() {
		return this._column.id
	}

	get title() {
		return this._column.title
	}

	get render() {
		return this._column.render
	}

	get sort() {
		return this._column.sort
	}

	get summary() {
		return this._column.summary
	}

}

/**
 * Validate a column definition
 *
 * @param column - the column to check
 * @throws {Error} if the column is not valid
 */
export function validateColumn(column: ColumnData): void {
	if (typeof column !== 'object' || column === null) {
		throw new Error('View column must be an object')
	}

	if (!column.id || typeof column.id !== 'string') {
		throw new Error('A column id is required')
	}

	if (!column.title || typeof column.title !== 'string') {
		throw new Error('A column title is required')
	}

	if (!column.render || typeof column.render !== 'function') {
		throw new Error('A render function is required')
	}

	// Optional properties
	checkOptionalProperty(column, 'sort', 'function')
	checkOptionalProperty(column, 'summary', 'function')
}
