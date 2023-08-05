/// <reference types="@nextcloud/typings" />

import type { DavProperty } from './lib/dav/davProperties'
import type { FileAction } from './lib/fileAction'
import type { Header } from './lib/fileListHeaders'
import type { NewFileMenu } from './lib/newFileMenu'

export {}

declare global {
	interface Window {
		OC: Nextcloud.v25.OC | Nextcloud.v26.OC | Nextcloud.v27.OC;
		_nc_dav_namespaces?: DavProperty
		_nc_dav_properties?: string[]
		_nc_fileactions?: FileAction[]
		_nc_filelistheader?: Header[]
		_nc_newfilemenu?: NewFileMenu
	}
}
