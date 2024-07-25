/**
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/// <reference types="@nextcloud/typings" />

import type { IFileListFilter, Navigation } from './lib'
import type { DavProperty } from './lib/dav/davProperties'
import type { FileAction } from './lib/fileAction'
import type { Header } from './lib/fileListHeaders'
import type { NewFileMenu } from './lib/newFileMenu'

export {}

declare global {
	interface Window {
		OC: Nextcloud.v27.OC | Nextcloud.v28.OC | Nextcloud.v29.OC;
		_nc_dav_namespaces?: DavProperty
		_nc_dav_properties?: string[]
		_nc_fileactions?: FileAction[]
		_nc_filelistheader?: Header[]
		_nc_newfilemenu?: NewFileMenu
		_nc_navigation?: Navigation
		_nc_filelist_filters?: Map<string, IFileListFilter>

		_oc_config?: {
			forbidden_filenames_characters: string[]
			/** @deprecated */
			blacklist_files_regex?: string
		}
	}
}
