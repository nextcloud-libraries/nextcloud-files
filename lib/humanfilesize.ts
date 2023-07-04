/**
 * @copyright 2019 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @author Christoph Wurst <christoph@winzerhof-wurst.at>
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

import { getCanonicalLocale } from '@nextcloud/l10n'

const humanList = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
const humanListBinary = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']

/**
 * Format a file size in a human-like format. e.g. 42GB
 *
 * @param size in bytes
 * @param skipSmallSizes avoid rendering tiny sizes and return '< 1 KB' instead
 * @param binaryPrefixes
 */
export function formatFileSize(size: number|string, skipSmallSizes = false, binaryPrefixes = false): string {

	if (typeof size === 'string') {
		size = Number(size)
	}

	/*
	* @note This block previously used Log base 1024, per IEC 80000-13;
	* however, the wrong prefix was used. Now we use decimal calculation
	* with base 1000 per the SI. Base 1024 calculation with binary
	* prefixes is optional, but has yet to be added to the UI.
	*/
	// Calculate Log with base 1024 or 1000: size = base ** order
	let order = size > 0 ? Math.floor(Math.log(size) / Math.log(binaryPrefixes ? 1024 : 1000)) : 0
	// Stay in range of the byte sizes that are defined
	order = Math.min((binaryPrefixes ? humanListBinary.length : humanList.length) - 1, order)
	const readableFormat = binaryPrefixes ? humanListBinary[order] : humanList[order]
	let relativeSize = (size / Math.pow(binaryPrefixes ? 1024 : 1000, order)).toFixed(1)

	if (skipSmallSizes === true && order === 0) {
		return (relativeSize !== '0.0' ? '< 1 ' : '0 ') + (binaryPrefixes ? humanListBinary[1] : humanList[1])
	}

	if (order < 2) {
		relativeSize = parseFloat(relativeSize).toFixed(0)
	} else {
		relativeSize = parseFloat(relativeSize).toLocaleString(getCanonicalLocale())
	}

	return relativeSize + ' ' + readableFormat
}
