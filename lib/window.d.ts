/*
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/// <reference types="@nextcloud/typings" />

declare global {
	interface Window {
		OC: Nextcloud.v32.OC & {
			appConfig: {
				files: {
					max_chunk_size: number
				}
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OCA: any
		_nc_files_scope?: Record<string, Record<string, unknown>>
		_oc_config?: {
			forbidden_filenames_characters: string[]
		}
	}
}

export {}
