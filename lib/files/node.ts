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
import { basename, extname, dirname } from 'path'
import { Permission } from '../permissions'
import { FileType } from './fileType'
import NodeData, { Attribute, validateData } from './nodeData'

export abstract class Node {
	private _data: NodeData
	private _attributes: Attribute[]
	private _knownDavService = /(remote|public)\.php\/(web)?dav/i

	constructor(data: NodeData, davService?: RegExp) {
		// Validate data
		validateData(data)

		this._data = data
		this._attributes = data.attributes || {} as any
		delete this._data.attributes

		if (davService) {
			this._knownDavService = davService
		}
	}

	/**
	 * Get the source url to this object
	 */
	get source(): string {
		// strip any ending slash
		return this._data.source.replace(/\/$/i, '')
	}

	/**
	 * Get this object name
	 */
	get basename(): string {
		return basename(this.source)
	}

	/**
	 * Get this object's extension
	 */
	get extension(): string|null {
		return extname(this.source)
	}

	/**
	 * Get the directory path leading to this object
	 */
	get dirname(): string {
		return dirname(this.source)
	}

	/**
	 * Is it a file or a folder ?
	 */
	abstract get type(): FileType

	/**
	 * Get the file mime
	 */
	get mime(): string|undefined {
		return this._data.mime
	}

	/**
	 * Get the file size
	 */
	get size(): number|undefined {
		return this._data.size
	}

	/**
	 * Get the file attribute
	 */
	get attributes(): Attribute {
		return this._attributes
	}

	/**
	 * Get the file permissions
	 */
	get permissions(): Permission {
		// If this is not a dav ressource, we can only read it
		if (this.owner === null && !this.isDavRessource) {
			return Permission.READ
		}

		return this._data.permissions || Permission.READ
	}

	/**
	 * Get the file owner
	 */
	get owner(): string|null {
		// Remote ressources have no owner
		if (!this.isDavRessource) {
			return null
		}
		return this._data.owner
	}

	/**
	 * Is this a dav-related ressource ?
	 */
	get isDavRessource(): boolean {
		return this.source.match(this._knownDavService) !== null
	}

	/**
	 * Get the dav root of this object
	 */
	get root(): string|null {
		if (this.isDavRessource) {
			return this.dirname.split(this._knownDavService).pop() || null
		}
		return null
	}

	/**
	 * Move the node to a new destination
	 *
	 * @param {string} destination the new source.
	 * e.g. https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg
	 */
	move(destination: string) {
		this._data.source = destination
	}

	/**
	 * Rename the node
	 * This aliases the move method for easier usage
	 */
	rename(basename) {
		if (basename.includes('/')) {
			throw new Error('Invalid basename')
		}
		this.move(this.dirname + '/' + basename)
	}
}
