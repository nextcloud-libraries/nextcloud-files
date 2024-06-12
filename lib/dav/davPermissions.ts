/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Permission } from '../permissions'

/**
 * Parse the webdav permission string to a permission enum
 *
 * @param permString The DAV permission string
 */
export const davParsePermissions = function(permString = ''): number {
	let permissions = Permission.NONE

	if (!permString) { return permissions }

	if (permString.includes('C') || permString.includes('K')) { permissions |= Permission.CREATE }

	if (permString.includes('G')) { permissions |= Permission.READ }

	if (permString.includes('W') || permString.includes('N') || permString.includes('V')) { permissions |= Permission.UPDATE }

	if (permString.includes('D')) { permissions |= Permission.DELETE }

	if (permString.includes('R')) { permissions |= Permission.SHARE }

	return permissions
}
