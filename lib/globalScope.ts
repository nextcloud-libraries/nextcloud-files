/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DavProperty } from './dav/index.ts'
import type {
	IFileListFilter,
	IFileListHeader,
	Navigation,
	NewMenu,
} from './index.ts'
import type { IFileAction, IFileListAction } from './ui/actions/index.ts'
import type { FilesRegistry } from './ui/registry.ts'
import type { ISidebarAction, ISidebarTab } from './ui/sidebar/index.ts'

interface InternalGlobalScope {
	davNamespaces?: DavProperty
	davProperties?: string[]

	newFileMenu?: NewMenu
	navigation?: Navigation
	registry?: FilesRegistry

	fileActions?: Map<string, IFileAction>
	fileListActions?: Map<string, IFileListAction>
	fileListFilters?: Map<string, IFileListFilter>
	fileListHeaders?: Map<string, IFileListHeader>

	filesSidebarActions?: Map<string, ISidebarAction>
	filesSidebarTabs?: Map<string, ISidebarTab>
}

window._nc_files_scope ??= {}
window._nc_files_scope.v4_0 ??= {}

/**
 * Get the global scope for the files library.
 * This is used to store global variables scoped to prevent breaking changes in the future.
 *
 * @internal
 */
export const scopedGlobals = window._nc_files_scope.v4_0 as InternalGlobalScope
