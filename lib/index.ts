/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { type Entry, getNewFileMenu } from './newFileMenu'
import { type Folder } from './files/folder'

export { FileAction, getFileActions, registerFileAction, DefaultType } from './fileAction'
export { Header, getFileListHeaders, registerFileListHeaders } from './fileListHeaders'
export { type Entry, NewMenuEntryCategory } from './newFileMenu'
export { Permission } from './permissions'

export * from './dav/davProperties'
export * from './dav/davPermissions'
export * from './dav/dav'

export { FileType } from './files/fileType'
export { File, type IFile } from './files/file'
export { Folder, type IFolder } from './files/folder'
export { Node, NodeStatus, type INode } from './files/node'

export { isFilenameValid, getUniqueName } from './utils/filename'
export { formatFileSize, parseFileSize } from './utils/fileSize'
export { orderBy } from './utils/sorting'
export { sortNodes, FilesSortingMode, type FilesSortingOptions } from './utils/fileSorting'

export * from './navigation/navigation'
export * from './navigation/column'
export * from './navigation/view'

/**
 * Add a new menu entry to the upload manager menu
 *
 * @param entry The new file menu entry
 */
export const addNewFileMenuEntry = function(entry: Entry) {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.registerEntry(entry)
}

/**
 * Remove a previously registered entry from the upload menu
 *
 * @param entry Entry to remove (or name of entry)
 */
export const removeNewFileMenuEntry = function(entry: Entry | string) {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.unregisterEntry(entry)
}

/**
 * Get the list of registered entries from the upload menu
 *
 * @param {Folder} context the creation context. Usually the current folder FileInfo
 */
export const getNewFileMenuEntries = function(context?: Folder) {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.getEntries(context).sort((a: Entry, b: Entry) => {
		// If defined and different, sort by order
		if (a.order !== undefined
			&& b.order !== undefined
			&& a.order !== b.order) {
			return a.order - b.order
		}
		// else sort by display name
		return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' })
	})
}
