/**
 * @copyright 2019 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @author Christoph Wurst <christoph@winzerhof-wurst.at>
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { type Entry, getNewFileMenu } from './newFileMenu'
import { type Folder } from './files/folder'

export { formatFileSize, parseFileSize } from './humanfilesize'
export { FileAction, getFileActions, registerFileAction, DefaultType } from './fileAction'
export { Header, getFileListHeaders, registerFileListHeaders } from './fileListHeaders'
export { type Entry } from './newFileMenu'
export { Permission } from './permissions'

export * from './dav/davProperties'
export * from './dav/davPermissions'
export * from './dav/dav'

export { FileType } from './files/fileType'
export { File } from './files/file'
export { Folder } from './files/folder'
export { Node, NodeStatus } from './files/node'

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
		if (a.order !== undefined && b.order !== undefined) {
			return a.order - b.order
		}
		return a.displayName.localeCompare(b.displayName)
	})
}
