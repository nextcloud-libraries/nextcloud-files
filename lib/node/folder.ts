/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { FileType } from './fileType'
import { Node } from './node'

export class Folder extends Node {

	constructor(...[data, davService]: ConstructorParameters<typeof Node>) {
		// enforcing mimes
		super({
			...data,
			mime: 'httpd/unix-directory',
		}, davService)
	}

	get type(): FileType.Folder {
		return FileType.Folder
	}

	get extension(): null {
		return null
	}

	get mime(): 'httpd/unix-directory' {
		return 'httpd/unix-directory'
	}

	/**
	 * Returns a clone of the folder
	 */
	clone(): Folder {
		return new Folder(structuredClone(this._data), this._knownDavService)
	}

}

/**
 * Interface of the folder class
 */
export type IFolder = Pick<Folder, keyof Folder>
