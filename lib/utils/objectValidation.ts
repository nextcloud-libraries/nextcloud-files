/*
 * SPDX-FileCopyrightText: Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Check an optional property type
 *
 * @param obj - the object to check
 * @param property - the property name
 * @param type - the expected type
 * @throws {Error} if the property is defined and not of the expected type
 */
export function checkOptionalProperty<T extends object>(
	obj: T,
	property: Exclude<keyof T, symbol>,
	type: 'array' | 'function' | 'string' | 'boolean' | 'number' | 'object',
): void {
	if (typeof obj[property] !== 'undefined') {
		if (type === 'array') {
			if (!Array.isArray(obj[property])) {
				throw new Error(`View ${property} must be an array`)
			}
		// eslint-disable-next-line valid-typeof
		} else if (typeof obj[property] !== type) {
			throw new Error(`View ${property} must be a ${type}`)
		} else if (type === 'object' && (obj[property] === null || Array.isArray(obj[property]))) {
			throw new Error(`View ${property} must be an object`)
		}
	}
}
