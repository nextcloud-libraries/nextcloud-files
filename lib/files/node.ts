/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { basename, extname, dirname } from 'path'
import { encodePath } from '@nextcloud/paths'

import { Permission } from '../permissions'
import { FileType } from './fileType'
import { Attribute, NodeData, isDavRessource, validateData } from './nodeData'
import logger from '../utils/logger'

export enum NodeStatus {
	/** This is a new node and it doesn't exists on the filesystem yet */
	NEW = 'new',
	/** This node has failed and is unavailable  */
	FAILED = 'failed',
	/** This node is currently loading or have an operation in progress */
	LOADING = 'loading',
	/** This node is locked and cannot be modified */
	LOCKED = 'locked',
}

export abstract class Node {

	private _data: NodeData
	private _attributes: Attribute
	private _knownDavService = /(remote|public)\.php\/(web)?dav/i

	private readonlyAttributes = Object.entries(Object.getOwnPropertyDescriptors(Node.prototype))
		.filter(e => typeof e[1].get === 'function' && e[0] !== '__proto__')
		.map(e => e[0])

	private handler = {
		set: (target: Attribute, prop: string, value: unknown): boolean => {
			if (this.readonlyAttributes.includes(prop)) {
				return false
			}

			// Apply original changes
			return Reflect.set(target, prop, value)
		},
		deleteProperty: (target: Attribute, prop: string): boolean => {
			if (this.readonlyAttributes.includes(prop)) {
				return false
			}

			// Apply original changes
			return Reflect.deleteProperty(target, prop)
		},
		// TODO: This is deprecated and only needed for files v3
		get: (target: Attribute, prop: string, receiver) => {
			if (this.readonlyAttributes.includes(prop)) {
				logger.warn(`Accessing "Node.attributes.${prop}" is deprecated, access it directly on the Node instance.`)
				return Reflect.get(this, prop)
			}
			return Reflect.get(target, prop, receiver)
		},
	} as ProxyHandler<Attribute>

	constructor(data: NodeData, davService?: RegExp) {
		// Validate data
		validateData(data, davService || this._knownDavService)

		this._data = {
			// TODO: Remove with next major release, this is just for compatibility
			displayname: data.attributes?.displayname,
			...data,
			attributes: {},
		}

		// Proxy the attributes to update the mtime on change
		this._attributes = new Proxy(this._data.attributes!, this.handler)

		// Update attributes, this sanitizes the attributes to only contain valid attributes
		this.update(data.attributes ?? {})

		if (davService) {
			this._knownDavService = davService
		}
	}

	/**
	 * Get the source url to this object
	 * There is no setter as the source is not meant to be changed manually.
	 * You can use the rename or move method to change the source.
	 */
	get source(): string {
		// strip any ending slash
		return this._data.source.replace(/\/$/i, '')
	}

	/**
	 * Get the encoded source url to this object for requests purposes
	 */
	get encodedSource(): string {
		const { origin } = new URL(this.source)
		return origin + encodePath(this.source.slice(origin.length))
	}

	/**
	 * Get this object name
	 * There is no setter as the source is not meant to be changed manually.
	 * You can use the rename or move method to change the source.
	 */
	get basename(): string {
		return basename(this.source)
	}

	/**
	 * The nodes displayname
	 * By default the display name and the `basename` are identical,
	 * but it is possible to have a different name. This happens
	 * on the files app for example for shared folders.
	 */
	get displayname(): string {
		return this._data.displayname || this.basename
	}

	/**
	 * Set the displayname
	 */
	set displayname(displayname: string) {
		this._data.displayname = displayname
	}

	/**
	 * Get this object's extension
	 * There is no setter as the source is not meant to be changed manually.
	 * You can use the rename or move method to change the source.
	 */
	get extension(): string|null {
		return extname(this.source)
	}

	/**
	 * Get the directory path leading to this object
	 * Will use the relative path to root if available
	 *
	 * There is no setter as the source is not meant to be changed manually.
	 * You can use the rename or move method to change the source.
	 */
	get dirname(): string {
		if (this.root) {
			let source = this.source
			if (this.isDavRessource) {
				// ensure we only work on the real path in case root is not distinct
				source = source.split(this._knownDavService).pop()!
			}
			// Using replace would remove all part matching root
			const firstMatch = source.indexOf(this.root)
			// Ensure we do not remove the leading slash
			const root = this.root.replace(/\/$/, '')
			return dirname(source.slice(firstMatch + root.length) || '/')
		}

		// This should always be a valid URL
		// as this is tested in the constructor
		const url = new URL(this.source)
		return dirname(url.pathname)
	}

	/**
	 * Is it a file or a folder ?
	 */
	abstract get type(): FileType

	/**
	 * Get the file mime
	 * There is no setter as the mime is not meant to be changed
	 */
	get mime(): string|undefined {
		return this._data.mime
	}

	/**
	 * Get the file modification time
	 */
	get mtime(): Date|undefined {
		return this._data.mtime
	}

	/**
	 * Set the file modification time
	 */
	set mtime(mtime: Date|undefined) {
		this._data.mtime = mtime
	}

	/**
	 * Get the file creation time
	 * There is no setter as the creation time is not meant to be changed
	 */
	get crtime(): Date|undefined {
		return this._data.crtime
	}

	/**
	 * Get the file size
	 */
	get size(): number|undefined {
		return this._data.size
	}

	/**
	 * Set the file size
	 */
	set size(size: number|undefined) {
		this.updateMtime()
		this._data.size = size
	}

	/**
	 * Get the file attribute
	 * This contains all additional attributes not provided by the Node class
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

		// If the permissions are not defined, we have none
		return this._data.permissions !== undefined
			? this._data.permissions
			: Permission.NONE
	}

	/**
	 * Set the file permissions
	 */
	set permissions(permissions: Permission) {
		this.updateMtime()
		this._data.permissions = permissions
	}

	/**
	 * Get the file owner
	 * There is no setter as the owner is not meant to be changed
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
		return isDavRessource(this.source, this._knownDavService)
	}

	/**
	 * Get the dav root of this object
	 * There is no setter as the root is not meant to be changed
	 */
	get root(): string|null {
		// If provided (recommended), use the root and strip away the ending slash
		if (this._data.root) {
			return this._data.root.replace(/^(.+)\/$/, '$1')
		}

		// Use the source to get the root from the dav service
		if (this.isDavRessource) {
			const root = dirname(this.source)
			return root.split(this._knownDavService).pop() || null
		}

		return null
	}

	/**
	 * Get the absolute path of this object relative to the root
	 */
	get path(): string {
		if (this.root) {
			let source = this.source
			if (this.isDavRessource) {
				// ensure we only work on the real path in case root is not distinct
				source = source.split(this._knownDavService).pop()!
			}
			// Using replace would remove all part matching root
			const firstMatch = source.indexOf(this.root)
			// Ensure we do not remove the leading slash
			const root = this.root.replace(/\/$/, '')
			return source.slice(firstMatch + root.length) || '/'
		}
		return (this.dirname + '/' + this.basename).replace(/\/\//g, '/')
	}

	/**
	 * Get the node id if defined.
	 * There is no setter as the fileid is not meant to be changed
	 */
	get fileid(): number|undefined {
		return this._data?.id
	}

	/**
	 * Get the node status.
	 */
	get status(): NodeStatus|undefined {
		return this._data?.status
	}

	/**
	 * Set the node status.
	 */
	set status(status: NodeStatus|undefined) {
		this._data.status = status
	}

	/**
	 * Get the node data
	 */
	get data(): NodeData {
		return structuredClone(this._data)
	}

	/**
	 * Move the node to a new destination
	 *
	 * @param {string} destination the new source.
	 * e.g. https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg
	 */
	move(destination: string) {
		validateData({ ...this._data, source: destination }, this._knownDavService)
		const oldBasename = this.basename

		this._data.source = destination
		// Check if the displayname and the (old) basename were the same
		// meaning no special displayname was set but just a fallback to the basename by Nextclouds WebDAV server
		if (this.displayname === oldBasename
			&& this.basename !== oldBasename) {
			// We have to assume that the displayname was not set but just a copy of the basename
			// this can not be guaranteed, so to be sure users should better refetch the node
			this.displayname = this.basename
		}
		this.updateMtime()
	}

	/**
	 * Rename the node
	 * This aliases the move method for easier usage
	 *
	 * @param basename The new name of the node
	 */
	rename(basename: string) {
		if (basename.includes('/')) {
			throw new Error('Invalid basename')
		}
		this.move(dirname(this.source) + '/' + basename)
	}

	/**
	 * Update the mtime if exists
	 */
	updateMtime() {
		if (this._data.mtime) {
			this._data.mtime = new Date()
		}
	}

	/**
	 * Update the attributes of the node
	 * Warning, updating attributes will NOT automatically update the mtime.
	 *
	 * @param attributes The new attributes to update on the Node attributes
	 */
	update(attributes: Attribute) {
		for (const [name, value] of Object.entries(attributes)) {
			try {
				if (value === undefined) {
					delete this.attributes[name]
				} else {
					this.attributes[name] = value
				}
			} catch (e) {
				// Ignore readonly attributes
				if (e instanceof TypeError) {
					continue
				}
				// Throw all other exceptions
				throw e
			}
		}
	}

	/**
	 * Returns a clone of the node
	 */
	abstract clone(): Node

}

/**
 * Interface of the node class
 */
export type INode = Pick<Node, keyof Node>
