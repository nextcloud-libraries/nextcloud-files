/*
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/// <reference types="@nextcloud/typings" />

import type {
	IFileListFilter,
	Navigation,
	FileAction,
	FileListAction,
	Header,
	NewMenu,
} from './index.ts'

import type {
	DavProperty,
} from './dav/index.ts'

export {}

declare global {
	interface Window {
		OC: Nextcloud.v27.OC | Nextcloud.v28.OC | Nextcloud.v29.OC;
		_nc_dav_namespaces?: DavProperty
		_nc_dav_properties?: string[]
		_nc_fileactions?: FileAction[]
		_nc_filelistactions?: FileListAction[]
		_nc_filelistheader?: Header[]
		_nc_newfilemenu?: NewMenu
		_nc_navigation?: Navigation
		_nc_filelist_filters?: Map<string, IFileListFilter>

		_oc_config?: {
			forbidden_filenames_characters: string[]
		}
	}
}
