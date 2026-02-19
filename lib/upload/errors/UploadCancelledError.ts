/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export class UploadCancelledError extends Error {
	__UPLOAD_CANCELLED__ = true

	public constructor(cause?: unknown) {
		super('Upload has been cancelled', { cause })
	}

	public static isCancelledError(error: unknown): error is UploadCancelledError {
		return typeof error === 'object' && error !== null && (error as UploadCancelledError).__UPLOAD_CANCELLED__ === true
	}
}
