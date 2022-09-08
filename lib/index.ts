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

export { formatFileSize } from './humanfilesize'
export { type Entry } from './newFileMenu'
import { type Entry, getNewFileMenu, NewFileMenu } from './newFileMenu'

declare global {
	interface Window {
		OC: any;
		_nc_newfilemenu: NewFileMenu;
	}
}

/**
 * Add a new menu entry to the upload manager menu
 */
export const addNewFileMenuEntry = function(entry: Entry) {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.registerEntry(entry)
}

/**
 * Remove a previously registered entry from the upload menu
 */
export const removeNewFileMenuEntry = function(entry: Entry | string) {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.unregisterEntry(entry)
}

/**
 * Get the list of registered entries from the upload menu
 */
export const getNewFileMenuEntries = function() {
	const newFileMenu = getNewFileMenu()
	return newFileMenu.getEntries()
}
