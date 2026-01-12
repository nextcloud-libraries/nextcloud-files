/*!
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Permission } from '../permissions.ts'

/**
 * Parse the WebDAV permission string to a permission enum
 *
 * @param permString - The DAV permission string
 */
export function parsePermissions(permString = ''): number {
	let permissions = Permission.NONE
	if (!permString) {
		return permissions
	}

	if (permString.includes('G')) {
		permissions |= Permission.READ
	}
	if (permString.includes('W')) {
		permissions |= Permission.WRITE
	}
	if (permString.includes('CK')) {
		permissions |= Permission.CREATE
	}
	if (permString.includes('NV')) {
		permissions |= Permission.UPDATE
	}
	if (permString.includes('D')) {
		permissions |= Permission.DELETE
	}
	if (permString.includes('R')) {
		permissions |= Permission.SHARE
	}

	return permissions
}
