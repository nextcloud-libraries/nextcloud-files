/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { type Entry, getNewFileMenu } from './newFileMenu'
import { type Folder } from './files/folder'

export { FileAction, getFileActions, registerFileAction, DefaultType } from './fileAction'
export { getFileListActions, registerFileListAction, FileListAction } from './fileListAction.ts'
export { Header, getFileListHeaders, registerFileListHeaders } from './fileListHeaders'
export { type Entry, NewMenuEntryCategory } from './newFileMenu'
export { Permission } from './permissions'

export { FileType } from './files/fileType'
export { File, type IFile } from './files/file'
export { Folder, type IFolder } from './files/folder'
export { Node, NodeStatus, type INode } from './files/node'
export type { NodeData } from './files/nodeData.ts'

export * from './utils/filename-validation'
export { getUniqueName } from './utils/filename'
export { formatFileSize, parseFileSize } from './utils/fileSize'
export { orderBy, type SortingOrder } from './utils/sorting'
export { sortNodes, FilesSortingMode, type FilesSortingOptions } from './utils/fileSorting'

export * from './navigation/index'
export * from './fileListFilters'

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

// Legacy export of dav utils
// TODO: Remove with version 4 (breaking change)
export {
	type DavProperty,

	/**
	 * @inheritdoc
	 * @deprecated use `defaultRemoteURL` from `@nextcloud/files/dav`
	 */
	defaultRemoteURL as davRemoteURL,
	/**
	 * @inheritdoc
	 * @deprecated use `defaultRootPath` from `@nextcloud/files/dav`
	 */
	defaultRootPath as davRootPath,
	/**
	 * @inheritdoc
	 * @deprecated use `defaultDavNamespaces` from `@nextcloud/files/dav`
	 */
	defaultDavNamespaces,
	/**
	 * @inheritdoc
	 * @deprecated use `defaultDavProperties` from `@nextcloud/files/dav`
	 */
	defaultDavProperties,

	/**
	 * @inheritdoc
	 * @deprecated use `getFavoriteNodes` from `@nextcloud/files/dav`
	 */
	getFavoriteNodes,
	/**
	 * @inheritdoc
	 * @deprecated use `getClient` from `@nextcloud/files/dav`
	 */
	getClient as davGetClient,
	/**
	 * @inheritdoc
	 * @deprecated use `getRemoteURL` from `@nextcloud/files/dav`
	 */
	getRemoteURL as davGetRemoteURL,
	/**
	 * @inheritdoc
	 * @deprecated use `getRootPath` from `@nextcloud/files/dav`
	 */
	getRootPath as davGetRootPath,
	/**
	 * @inheritdoc
	 * @deprecated use `resultToNode` from `@nextcloud/files/dav`
	 */
	resultToNode as davResultToNode,
	/**
	 * @inheritdoc
	 * @deprecated use `getDefaultPropfind` from `@nextcloud/files/dav`
	 */
	getDefaultPropfind as davGetDefaultPropfind,
	/**
	 * @inheritdoc
	 * @deprecated use `getFavoritesReport` from `@nextcloud/files/dav`
	 */
	getFavoritesReport as davGetFavoritesReport,
	/**
	 * @inheritdoc
	 * @deprecated use `getRecentSearch` from `@nextcloud/files/dav`
	 */
	getRecentSearch as davGetRecentSearch,
	/**
	 * @inheritdoc
	 * @deprecated use `parsePermissions` from `@nextcloud/files/dav`
	 */
	parsePermissions as davParsePermissions,
	/**
	 * @inheritdoc
	 * @deprecated use `getDavNameSpaces` from `@nextcloud/files/dav`
	 */
	getDavNameSpaces,
	/**
	 * @inheritdoc
	 * @deprecated use `getDavProperties` from `@nextcloud/files/dav`
	 */
	getDavProperties,
	/**
	 * @inheritdoc
	 * @deprecated use `registerDavProperty` from `@nextcloud/files/dav`
	 */
	registerDavProperty,
} from './dav/index'
