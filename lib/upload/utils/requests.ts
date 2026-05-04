/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 */

import { isCancel } from '@nextcloud/axios'

/**
 * Create modification time headers if valid value is available.
 * It can be invalid on Android devices if SD cards with NTFS / FAT are used,
 * as those files might use the NT epoch for time so the value will be negative.
 *
 * @param file - The file to upload
 */
export function getMtimeHeader(file: File): { 'X-OC-Mtime'?: number } {
	const mtime = Math.floor(file.lastModified / 1000)
	if (mtime > 0) {
		return { 'X-OC-Mtime': mtime }
	}
	return {}
}

/**
 * Check if the given error is an abort error
 *
 * @param error - Error to check
 */
export function isRequestAborted(error: unknown): boolean {
	return isCancel(error)
		|| (error instanceof DOMException && error.name === 'AbortError')
}
