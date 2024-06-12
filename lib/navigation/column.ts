/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { View } from './view'
import { Node } from '../files/node'

interface ColumnData {
	/** Unique column ID */
	id: string
	/** Translated column title */
	title: string
	/** The content of the cell. The element will be appended within */
	render: (node: Node, view: View) => HTMLElement
	/** Function used to sort Nodes between them */
	sort?: (nodeA: Node, nodeB: Node) => number
	/**
	 * Custom summary of the column to display at the end of the list.
	 * Will not be displayed if  nothing is provided
	 */
	summary?: (node: Node[], view: View) => string
}

export class Column implements ColumnData {

	private _column: ColumnData

	constructor(column: ColumnData) {
		isValidColumn(column)
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
 * Typescript cannot validate an interface.
 * Please keep in sync with the Column interface requirements.
 *
 * @param {ColumnData} column the column to check
 * @return {boolean} true if the column is valid
 */
const isValidColumn = function(column: ColumnData): boolean {
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
	if (column.sort && typeof column.sort !== 'function') {
		throw new Error('Column sortFunction must be a function')
	}

	if (column.summary && typeof column.summary !== 'function') {
		throw new Error('Column summary must be a function')
	}

	return true
}
