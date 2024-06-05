/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { FileType } from './fileType'
import { type INode, Node } from './node'
import { type NodeData } from './nodeData'

export class Folder extends Node {

	constructor(data: NodeData) {
		// enforcing mimes
		super({
			...data,
			mime: 'httpd/unix-directory',
		})
	}

	get type(): FileType {
		return FileType.Folder
	}

	get extension(): string|null {
		return null
	}

	get mime(): string {
		return 'httpd/unix-directory'
	}

}

/**
 * Interface of the folder class
 */
export interface IFolder extends INode {
	readonly type: FileType.Folder
	readonly extension: null
	readonly mime: 'httpd/unix-directory'
}
