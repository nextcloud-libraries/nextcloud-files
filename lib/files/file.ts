/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { FileType } from './fileType'
import { type INode, Node } from './node'

export class File extends Node {

	get type(): FileType {
		return FileType.File
	}

	/**
	 * Returns a clone of the file
	 */
	clone(): File {
		return new File(this.data)
	}

}

/**
 * Interface of the File class
 */
export interface IFile extends INode {
	readonly type: FileType.File
}
