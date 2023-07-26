/**
 * @copyright Copyright (c) 2023 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 * @author Ferdinand Thiessen <opensource@fthiessen.de>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
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
