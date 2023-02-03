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

import { join } from "path"
import { Permission } from "../permissions"

export interface Attribute { [key: string]: any }

export default interface NodeData {
	/** Unique ID */
	id?: number

	/**
	 * URL to the ressource.
	 * e.g. https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg
	 * or https://domain.com/Photos/picture.jpg
	 */
	source: string

	/** Last modified time */
	mtime?: Date

	/** Creation time */
	crtime?: Date

	/** The mime type */
	mime?: string

	/** The node size type */
	size?: number

	/** The node permissions */
	permissions?: Permission

	/** The owner  UID of this node */
	owner: string|null

	attributes?: Attribute

	/**
	 * The absolute root of the home relative to the service.
	 * It is highly recommended to provide that information.
	 * e.g. /files/emma
	 */
	root?: string
}

export const isDavRessource = function(source: string, davService: RegExp): boolean {
	return source.match(davService) !== null
}
 
/**
 * Validate Node construct data
 */
export const validateData = (data: NodeData, davService: RegExp) => {
	if ('id' in data && (typeof data.id !== 'number' || data.id < 0)) {
		throw new Error('Invalid id type of value')
	}

	if (!data.source) {
		throw new Error('Missing mandatory source')
	}

	if (!data.source.startsWith('http')) {
		throw new Error('Invalid source format')
	}

	if ('mtime' in data && !(data.mtime instanceof Date)) {
		throw new Error('Invalid mtime type')
	}

	if ('crtime' in data && !(data.crtime instanceof Date)) {
		throw new Error('Invalid crtime type')
	}

	if (!data.mime || typeof data.mime !== 'string'
		|| !data.mime.match(/^[-\w.]+\/[-+\w.]+$/gi)) {
		throw new Error('Missing or invalid mandatory mime')
	}

	if ('size' in data && typeof data.size !== 'number') {
		throw new Error('Invalid size type')
	}

	if ('permissions' in data && !(
			typeof data.permissions === 'number'
			&& data.permissions >= Permission.NONE
			&& data.permissions <= Permission.ALL
		)) {
		throw new Error('Invalid permissions')
	}

	if ('owner' in data
		&& data.owner !== null
		&& typeof data.owner !== 'string') {
		throw new Error('Invalid owner type')
	}

	if ('attributes' in data && typeof data.attributes !== 'object') {
		throw new Error('Invalid attributes format')
	}

	if ('root' in data && typeof data.root !== 'string') {
		throw new Error('Invalid root format')
	}

	if (data.root && !data.root.startsWith('/')) {
		throw new Error('Root must start with a leading slash')
	}

	if (data.root && !data.source.includes(data.root)) {
		throw new Error('Root must be part of the source')
	}

	if (data.root && isDavRessource(data.source, davService)) {
		const service = data.source.match(davService)![0]
		if (!data.source.includes(join(service, data.root))) {
			throw new Error('The root must be relative to the service. e.g /files/emma')
		}
	}
}
