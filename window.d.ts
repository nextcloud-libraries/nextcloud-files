/// <reference types="@nextcloud/typings" />

import type { FileAction } from './lib/fileAction'
import type { NewFileMenu } from './lib/newFileMenu'
import type { DavProperty } from './lib/dav/davProperties'

export {}

declare global {
	interface Window {
		OC: Nextcloud.v25.OC | Nextcloud.v26.OC | Nextcloud.v27.OC;
		_nc_newfilemenu?: NewFileMenu
		_nc_fileactions?: FileAction[]
		_nc_dav_properties?: string[]
		_nc_dav_namespaces?: DavProperty
	}
}
