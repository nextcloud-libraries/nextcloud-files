/**
 * SPDX-FileCopyrightText: Ferdinand Thiessen <opensource@fthiessen.de>
 * SPDX-License-Identifier: AGPL-3.0-or-later or LGPL-3.0-or-later
 */

import { basename, extname } from 'path'

interface UniqueNameOptions {
	/**
	 * A function that takes an index and returns a suffix to add to the file name, defaults to '(index)'
	 * @param index The current index to add
	 */
	suffix?: (index: number) => string
	/**
	 * Set to true to ignore the file extension when adding the suffix (when getting a unique directory name)
	 */
	ignoreFileExtension?: boolean
}

/**
 * Create an unique file name
 * @param name The initial name to use
 * @param otherNames Other names that are already used
 * @param options Optional parameters for tuning the behavior
 * @return {string} Either the initial name, if unique, or the name with the suffix so that the name is unique
 */
export function getUniqueName(
	name: string,
	otherNames: string[],
	options?: UniqueNameOptions,
): string {
	const opts = {
		suffix: (n: number) => `(${n})`,
		ignoreFileExtension: false,
		...options,
	}

	let newName = name
	let i = 1
	while (otherNames.includes(newName)) {
		const ext = opts.ignoreFileExtension ? '' : extname(name)
		const base = basename(name, ext)
		newName = `${base} ${opts.suffix(i++)}${ext}`
	}
	return newName
}
