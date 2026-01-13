/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { NodeConstructorData } from './node.ts'

import { FileType } from './fileType.ts'
import { Node } from './node.ts'

export class File extends Node {
	public constructor(...[data, davService]: NodeConstructorData) {
		super(data, davService)
	}

	get type(): typeof FileType.File {
		return FileType.File
	}
}

/**
 * Interface of the File class
 */
export type IFile = Pick<File, keyof File>
