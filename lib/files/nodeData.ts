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

import { join } from 'path'
import { Permission } from '../permissions'
import { NodeStatus } from './node'

export interface Attribute { [key: string]: any }

export interface NodeData {
	/** Unique ID */
	id?: number

	/**
	 * URL to the ressource.
	 * e.g. https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg
	 * or https://domain.com/Photos/picture.jpg
	 */
	source: string

	/**
	 * Percent encoded URL to the ressource.
	 * e.g. https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture_with_%23.jpg
	 * or https://domain.com/Photos/picture_with_%23.jpg
	 */
	encodedSource: string

	/** Last modified time */
	mtime?: Date

	/** Creation time */
	crtime?: Date

	/** The mime type Optional for folders only */
	mime?: string

	/** The node size type */
	size?: number

	/** The node permissions */
	permissions?: Permission

	/** The owner  UID of this node */
	owner: string|null

	/** The node attributes */
	attributes?: Attribute

	/**
	 * The absolute root of the home relative to the service.
	 * It is highly recommended to provide that information.
	 * e.g. /files/emma
	 */
	root?: string

	/** The node status */
	status?: NodeStatus
}

/**
 * Check if a node source is from a specific DAV service
 *
 * @param source The source to check
 * @param davService Pattern to check if source is DAV ressource
 */
export const isDavRessource = function(source: string, davService: RegExp): boolean {
	return source.match(davService) !== null
}

/**
 * Validate Node construct data
 *
 * @param data The node data
 * @param davService Pattern to check if source is DAV ressource
 */
export const validateData = (data: NodeData, davService: RegExp) => {
	if (data.id && typeof data.id !== 'number') {
		throw new Error('Invalid id type of value')
	}

	if (!data.source) {
		throw new Error('Missing mandatory source')
	}

	if (!data.encodedSource) {
		throw new Error('Missing mandatory encodedSource')
	}

	try {
		// eslint-disable-next-line no-new
		new URL(data.source)
	} catch (e) {
		throw new Error('Invalid source format, source must be a valid URL')
	}

	try {
		// eslint-disable-next-line no-new
		new URL(data.encodedSource)
	} catch (e) {
		throw new Error('Invalid encodedSource format, encodedSource must be a valid URL')
	}

	if (!data.source.startsWith('http')) {
		throw new Error('Invalid source format, only http(s) is supported')
	}

	if (!data.encodedSource.startsWith('http')) {
		throw new Error('Invalid encodedSource format, only http(s) is supported')
	}

	if (data.mtime && !(data.mtime instanceof Date)) {
		throw new Error('Invalid mtime type')
	}

	if (data.crtime && !(data.crtime instanceof Date)) {
		throw new Error('Invalid crtime type')
	}

	if (!data.mime || typeof data.mime !== 'string'
		|| !data.mime.match(/^[-\w.]+\/[-+\w.]+$/gi)) {
		throw new Error('Missing or invalid mandatory mime')
	}

	// Allow size to be 0
	if ('size' in data && typeof data.size !== 'number' && data.size !== undefined) {
		throw new Error('Invalid size type')
	}

	// Allow permissions to be 0
	if ('permissions' in data
		&& data.permissions !== undefined
		&& !(typeof data.permissions === 'number'
			&& data.permissions >= Permission.NONE
			&& data.permissions <= Permission.ALL
		)) {
		throw new Error('Invalid permissions')
	}

	if (data.owner
		&& data.owner !== null
		&& typeof data.owner !== 'string') {
		throw new Error('Invalid owner type')
	}

	if (data.attributes && typeof data.attributes !== 'object') {
		throw new Error('Invalid attributes type')
	}

	if (data.root && typeof data.root !== 'string') {
		throw new Error('Invalid root type')
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

	if (data.status && !Object.values(NodeStatus).includes(data.status)) {
		throw new Error('Status must be a valid NodeStatus')
	}
}
