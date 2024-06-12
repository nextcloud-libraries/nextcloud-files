/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { FileType } from './fileType'
import { Node } from './node'

export class File extends Node {

	get type(): FileType {
		return FileType.File
	}

}
