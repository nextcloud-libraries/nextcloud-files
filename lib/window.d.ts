/*
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/// <reference types="@nextcloud/typings" />

import type { IFileAction, IFileListAction } from './actions/index.ts'
import type { DavProperty } from './dav/index.ts'
import type {
	Header,
	IFileListFilter,
	Navigation,
	NewMenu,
} from './index.ts'
import type { FilesRegistryV4 } from './registry.ts'
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
		_nc_fileactions?: IFileAction[]
		_nc_filelistactions?: IFileListAction[]
		_nc_filelistheader?: Header[]
		_nc_newfilemenu?: NewMenu
		_nc_navigation?: Navigation
		_nc_filelist_filters?: Map<string, IFileListFilter>
		_nc_files_sidebar_actions?: Map<string, ISidebarAction>
		_nc_files_sidebar_tabs?: Map<string, ISidebarTab>

		_nc_files_registry_v4?: FilesRegistryV4

		_oc_config?: {
			forbidden_filenames_characters: string[]
		}
	}
}
