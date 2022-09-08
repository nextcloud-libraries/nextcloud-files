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

const humanList = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Format a file size in a human-like format. e.g. 42GB
 *
 * @param size in bytes
 * @param skipSmallSizes avoid rendering tiny sizes and return '< 1 KB' instead
 */
export function formatFileSize(size: number|string, skipSmallSizes: boolean = false): string {

	if (typeof size === 'string') {
		size = Number(size)
	}

	// Calculate Log with base 1024: size = 1024 ** order
	let order = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
	// Stay in range of the byte sizes that are defined
	order = Math.min(humanList.length - 1, order);
	const readableFormat = humanList[order];
	let relativeSize = (size / Math.pow(1024, order)).toFixed(1);

	if (skipSmallSizes === true && order === 0) {
		if (relativeSize !== '0.0') {
			return '< 1 KB';
		} else {
			return '0 KB';
		}
	}

	if (order < 2) {
		relativeSize = parseFloat(relativeSize).toFixed(0);
	} else {
		relativeSize = parseFloat(relativeSize).toLocaleString(getCanonicalLocale());
	}

	return relativeSize + ' ' + readableFormat;
}
