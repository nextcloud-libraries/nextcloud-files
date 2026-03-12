/*!
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { INode } from '../../node/index.ts'

/**
 * Check if there is a conflict between two sets of files
 *
 * @param files the incoming files
 * @param content all the existing files in the directory
 * @return true if there is a conflict
 */
export function hasConflict(files: (File | FileSystemEntry | INode)[], content: INode[]): boolean {
	return getConflicts(files, content).length > 0
}

/**
 * Get the conflicts between two sets of files
 *
 * @param files the incoming files
 * @param content all the existing files in the directory
 * @return true if there is a conflict
 */
export function getConflicts<T extends File | FileSystemEntry | INode>(files: T[], content: INode[]): T[] {
	const contentNames = content.map((node: INode) => node.basename)
	const conflicts = files.filter((node: File | FileSystemEntry | INode) => {
		const name = 'basename' in node ? node.basename : node.name
		return contentNames.indexOf(name) !== -1
	})

	return conflicts
}
