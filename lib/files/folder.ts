/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { NodeData } from './nodeData'
import { FileType } from './fileType'
import { Node } from './node'

export class Folder extends Node {

	constructor(data: NodeData) {
		// enforcing mimes
		super({
			...data,
			mime: 'httpd/unix-directory',
		})
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
		return new Folder(this.data)
	}

}

/**
 * Interface of the folder class
 */
export type IFolder = Pick<Folder, keyof Folder>
