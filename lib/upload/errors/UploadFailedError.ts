/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AxiosResponse } from '@nextcloud/axios'

import { isAxiosError } from '@nextcloud/axios'

export class UploadFailedError extends Error {
	private __UPLOAD_FAILED__ = true

	readonly response?: AxiosResponse

	public constructor(cause?: unknown) {
		super('Upload has failed', { cause })
		if (isAxiosError(cause) && cause.response) {
			this.response = cause.response
		}
	}
}
