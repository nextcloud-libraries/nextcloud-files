/*
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/// <reference types="@nextcloud/typings" />

import type { DavProperty } from './dav/index.ts'
import type {
	FileAction,
	FileListAction,
	Header,
	IFileListFilter,
	Navigation,
	NewMenu,
} from './index.ts'
import type { ISidebarTab } from './sidebar/index.ts'
import type { ISidebarAction } from './sidebar/SidebarAction.ts'

export {}

declare global {
	interface Window {
		OC: Nextcloud.v32.OC
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OCA: any
		_nc_dav_namespaces?: DavProperty
		_nc_dav_properties?: string[]
		_nc_fileactions?: FileAction[]
		_nc_filelistactions?: FileListAction[]
		_nc_filelistheader?: Header[]
		_nc_newfilemenu?: NewMenu
		_nc_navigation?: Navigation
		_nc_filelist_filters?: Map<string, IFileListFilter>
		_nc_files_sidebar_actions?: Map<string, ISidebarAction>
		_nc_files_sidebar_tabs?: Map<string, ISidebarTab>

		_oc_config?: {
			forbidden_filenames_characters: string[]
		}
	}
}
