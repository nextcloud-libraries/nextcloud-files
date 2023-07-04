/**
 * @copyright Copyright (c) 2022 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
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

export enum Permission {
	NONE = 0,
	CREATE = 4,
	READ = 1,
	UPDATE = 2,
	DELETE = 8,
	SHARE = 16,
	ALL = 31,
}

/**
 * Parse the webdav permission string to a permission enum
 * @see https://github.com/nextcloud/server/blob/71f698649f578db19a22457cb9d420fb62c10382/lib/public/Files/DavUtil.php#L58-L88
 */
export const parseWebdavPermissions = function(permString = ''): number {
	let permissions = Permission.NONE

	if (!permString) { return permissions }

	if (permString.includes('C') || permString.includes('K')) { permissions |= Permission.CREATE }

	if (permString.includes('G')) { permissions |= Permission.READ }

	if (permString.includes('W') || permString.includes('N') || permString.includes('V')) { permissions |= Permission.UPDATE }

	if (permString.includes('D')) { permissions |= Permission.DELETE }

	if (permString.includes('R')) { permissions |= Permission.SHARE }

	return permissions
}
