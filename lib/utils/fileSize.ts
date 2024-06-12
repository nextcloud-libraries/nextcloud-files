/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getCanonicalLocale } from '@nextcloud/l10n'

const humanList = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
const humanListBinary = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']

/**
 * Format a file size in a human-like format. e.g. 42GB
 *
 * The default for Nextcloud is like Windows using binary sizes but showing decimal units,
 * meaning 1024 bytes will show as 1KB instead of 1KiB or like on Apple 1.02 KB
 *
 * @param size in bytes
 * @param skipSmallSizes avoid rendering tiny sizes and return '< 1 KB' instead
 * @param binaryPrefixes True if size binary prefixes like `KiB` should be used as per IEC 80000-13
 * @param base1000 Set to true to use base 1000 as per SI or used by Apple (default is base 1024 like Linux or Windows)
 */
export function formatFileSize(size: number|string, skipSmallSizes = false, binaryPrefixes = false, base1000 = false): string {
	// Binary prefixes only work with base 1024
	binaryPrefixes = binaryPrefixes && !base1000

	if (typeof size === 'string') {
		size = Number(size)
	}

	// Calculate Log with base 1024 or 1000: size = base ** order
	let order = size > 0 ? Math.floor(Math.log(size) / Math.log(base1000 ? 1000 : 1024)) : 0

	// Stay in range of the byte sizes that are defined
	order = Math.min((binaryPrefixes ? humanListBinary.length : humanList.length) - 1, order)

	const readableFormat = binaryPrefixes ? humanListBinary[order] : humanList[order]
	let relativeSize = (size / Math.pow(base1000 ? 1000 : 1024, order)).toFixed(1)

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

/**
 * Returns a file size in bytes from a humanly readable string
 * Note: `b` and `B` are both parsed as bytes and not as bit or byte.
 *
 * @param  {string} value file size in human-readable format
 * @param  {boolean} forceBinary for backwards compatibility this allows values to be base 2 (so 2KB means 2048 bytes instead of 2000 bytes)
 * @return {number} or null if string could not be parsed
 */
export function parseFileSize(value: string, forceBinary = false) {
	try {
		value = `${value}`.toLocaleLowerCase().replaceAll(/\s+/g, '').replaceAll(',', '.')
	} catch (e) {
		return null
	}

	const match = value.match(/^([0-9]*(\.[0-9]*)?)([kmgtp]?)(i?)b?$/)
	// ignore not found, missing pre- and decimal, empty number
	if (match === null || match[1] === '.' || match[1] === '') {
		return null
	}

	const bytesArray = {
		'': 0,
		k: 1,
		m: 2,
		g: 3,
		t: 4,
		p: 5,
		e: 6,
	}

	const decimalString = `${match[1]}`
	const base = (match[4] === 'i' || forceBinary) ? 1024 : 1000

	return Math.round(Number.parseFloat(decimalString) * (base ** bytesArray[match[3]]))
}
