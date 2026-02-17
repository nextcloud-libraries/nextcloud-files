/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Node } from '@nextcloud/files'

/**
 * Check if there is a conflict between two sets of files
 * @param {Array<File|FileSystemEntry|Node>} files the incoming files
 * @param {Node[]} content all the existing files in the directory
 * @return {boolean} true if there is a conflict
 */
export function hasConflict(files: (File|FileSystemEntry|Node)[], content: Node[]): boolean {
	return getConflicts(files, content).length > 0
}

/**
 * Get the conflicts between two sets of files
 * @param {Array<File|FileSystemEntry|Node>} files the incoming files
 * @param {Node[]} content all the existing files in the directory
 * @return {boolean} true if there is a conflict
 */
export function getConflicts<T extends File|FileSystemEntry|Node>(files: T[], content: Node[]): T[] {
	const contentNames = content.map((node: Node) => node.basename)
	const conflicts = files.filter((node: File|FileSystemEntry|Node) => {
		const name = 'basename' in node ? node.basename : node.name
		return contentNames.indexOf(name) !== -1
	})

	return conflicts
}
