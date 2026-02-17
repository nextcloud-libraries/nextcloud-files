/// <reference types="@nextcloud/typings" />
/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { Uploader } from './lib/uploader'

// This is for private use only
declare global {
	interface Window {
		_nc_uploader?: Uploader

		OC: Nextcloud.v28.OC & {
			appConfig: {
				files: {
					max_chunk_size: number
				}
			}
		}
	}
}
