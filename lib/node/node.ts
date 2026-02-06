/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileType } from './fileType.ts'
import type { Attribute, INodeStatus, NodeData } from './nodeData.ts'

import { basename, dirname, encodePath, extname } from '@nextcloud/paths'
import { Permission } from '../permissions.ts'
import { fixDates, fixRegExp, isDavResource, validateData } from './nodeData.ts'

export type NodeConstructorData = [NodeData, RegExp?]

export abstract class Node {
	private _attributes: Attribute

	protected _data: NodeData
	protected _knownDavService = /(remote|public)\.php\/(web)?dav/i

	private readonlyAttributes = Object.entries(Object.getOwnPropertyDescriptors(Node.prototype))
		.filter((e) => typeof e[1].get === 'function' && e[0] !== '__proto__')
		.map((e) => e[0])

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
	} as ProxyHandler<Attribute>

	protected constructor(...[data, davService]: NodeConstructorData) {
		if (!data.mime) {
			data.mime = 'application/octet-stream'
		}

		// Fix primitive types if needed
		fixDates(data)
		davService = fixRegExp(davService || this._knownDavService)

		// Validate data
		validateData(data, davService)

		this._data = {
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
		validateData({ ...this._data, displayname }, this._knownDavService)
		this._data.displayname = displayname
	}

	/**
	 * Get this object's extension
	 * There is no setter as the source is not meant to be changed manually.
	 * You can use the rename or move method to change the source.
	 */
	get extension(): string | null {
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
		return dirname(this.path)
	}

	/**
	 * Is it a file or a folder ?
	 */
	abstract get type(): IFileType

	/**
	 * Get the file mime
	 */
	get mime(): string {
		return this._data.mime || 'application/octet-stream'
	}

	/**
	 * Set the file mime
	 * Removing the mime type will set it to `application/octet-stream`
	 */
	set mime(mime: string | undefined) {
		mime ??= 'application/octet-stream'

		validateData({ ...this._data, mime }, this._knownDavService)
		this._data.mime = mime
	}

	/**
	 * Get the file modification time
	 */
	get mtime(): Date | undefined {
		return this._data.mtime
	}

	/**
	 * Set the file modification time
	 */
	set mtime(mtime: Date | undefined) {
		validateData({ ...this._data, mtime }, this._knownDavService)
		this._data.mtime = mtime
	}

	/**
	 * Get the file creation time
	 * There is no setter as the creation time is not meant to be changed
	 */
	get crtime(): Date | undefined {
		return this._data.crtime
	}

	/**
	 * Get the file size
	 */
	get size(): number | undefined {
		return this._data.size
	}

	/**
	 * Set the file size
	 */
	set size(size: number | undefined) {
		validateData({ ...this._data, size }, this._knownDavService)
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
	get permissions(): number {
		// If this is not a dav resource, we can only read it
		if (this.owner === null && !this.isDavResource) {
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
	set permissions(permissions: number) {
		validateData({ ...this._data, permissions }, this._knownDavService)
		this.updateMtime()
		this._data.permissions = permissions
	}

	/**
	 * Get the file owner
	 * There is no setter as the owner is not meant to be changed
	 */
	get owner(): string | null {
		// Remote resources have no owner
		if (!this.isDavResource) {
			return null
		}
		return this._data.owner
	}

	/**
	 * Is this a dav-related resource ?
	 */
	get isDavResource(): boolean {
		return isDavResource(this.source, this._knownDavService)
	}

	/**
	 * Get the dav root of this object
	 * There is no setter as the root is not meant to be changed
	 */
	get root(): string {
		return this._data.root.replace(/^(.+)\/$/, '$1')
	}

	/**
	 * Get the absolute path of this object relative to the root
	 */
	get path(): string {
		// Extract the path part from the source URL
		// e.g. https://cloud.domain.com/remote.php/dav/files/username/Path/To/File.txt
		const idx = this.source.indexOf('://')
		const protocol = this.source.slice(0, idx) // e.g. https
		const remainder = this.source.slice(idx + 3) // e.g. cloud.domain.com/remote.php/dav/files/username/Path/To/File.txt

		const slashIndex = remainder.indexOf('/')
		const host = remainder.slice(0, slashIndex) // e.g. cloud.domain.com
		const rawPath = remainder.slice(slashIndex) // e.g. /remote.php/dav/files/username/Path/To/File.txt

		// Rebuild a safe URL with encoded path
		const safeUrl = `${protocol}://${host}${encodePath(rawPath)}`
		const url = new URL(safeUrl)

		let source = decodeURIComponent(url.pathname)

		if (this.isDavResource) {
			// ensure we only work on the real path in case root is not distinct
			source = source.split(this._knownDavService).pop()!
		}
		// Using replace would remove all part matching root
		const firstMatch = source.indexOf(this.root)
		// Ensure we do not remove the leading slash
		const root = this.root.replace(/\/$/, '')
		return source.slice(firstMatch + root.length) || '/'
	}

	/**
	 * Get the node id if defined.
	 * There is no setter as the fileid is not meant to be changed
	 */
	get fileid(): number | undefined {
		return this._data?.id
	}

	/**
	 * Get the node status.
	 */
	get status(): INodeStatus | undefined {
		return this._data?.status
	}

	/**
	 * Set the node status.
	 */
	set status(status: INodeStatus | undefined) {
		validateData({ ...this._data, status }, this._knownDavService)
		this._data.status = status
	}

	/**
	 * Move the node to a new destination
	 *
	 * @param destination the new source.
	 * e.g. https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg
	 */
	move(destination: string) {
		validateData({ ...this._data, source: destination }, this._knownDavService)
		const oldBasename = this.basename

		this._data.source = destination
		// Check if the displayname and the (old) basename were the same
		// meaning no special displayname was set but just a fallback to the basename by Nextcloud's WebDAV server
		if (this.displayname === oldBasename
			&& this.basename !== oldBasename) {
			// We have to assume that the displayname was not set but just a copy of the basename
			// this can not be guaranteed, so to be sure users should better refetch the node
			this.displayname = this.basename
		}
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
	clone(): this {
		// @ts-expect-error -- this class is abstract and cannot be instantiated directly but all its children can
		return new this.constructor(structuredClone(this._data), this._knownDavService)
	}

	/**
	 * JSON representation of the node
	 */
	toJSON(): string {
		return JSON.stringify([structuredClone(this._data), this._knownDavService.toString()])
	}
}

/**
 * Interface of the node class
 */
export type INode = Pick<Node, keyof Node>
