/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class UploadCancelledError extends Error {
	private __UPLOAD_CANCELLED__ = true

	public constructor(cause?: unknown) {
		super('Upload has been cancelled', { cause })
	}
}
