/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { isPublicShare } from '@nextcloud/sharing/public'
import { Uploader } from './uploader/uploader.ts'

/**
 * Get the global Uploader instance.
 *
 * Note: If you need a local uploader you can just create a new instance,
 * this global instance will be shared with other apps.
 *
 * @param isPublic Set to true to use public upload endpoint (by default it is auto detected)
 * @param forceRecreate Force a new uploader instance - main purpose is for testing
 */
export function getUploader(isPublic: boolean = isPublicShare(), forceRecreate = false): Uploader {
	if (forceRecreate || window._nc_uploader === undefined) {
		window._nc_uploader = new Uploader(isPublic)
	}

	return window._nc_uploader
}
