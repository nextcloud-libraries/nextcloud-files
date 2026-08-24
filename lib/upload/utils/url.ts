/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 */

import { encodePath } from '@nextcloud/paths'

/**
 * Concatenates a base URL (allowing protocol) and a path segment
 *
 * @param base - the base URL, e.g. "https://example.com/dav"
 * @param path - the path segment to concatenate, e.g. "test.txt"
 */
export function concatUrl(base: string, path: string): string {
	if (base.endsWith('/')) {
		base = base.slice(0, -1)
	}
	if (path.startsWith('/')) {
		path = path.slice(1)
	}
	return `${base}/${path}`
}

/**
 * URL encode the path of a decoded URL, leaving a potential origin untouched.
 * This must be used whenever a source is used for a request (URL or `Destination` header).
 *
 * @param url - The decoded URL, either absolute ("https://example.com/dav/a b.txt") or a path ("/dav/a b.txt")
 */
export function encodeUrl(url: string): string {
	// Only the path must be encoded, so keep a potential origin as-is
	const origin = url.match(/^[a-z][a-z\d+\-.]*:\/\/[^/]*/i)?.[0] ?? ''
	return origin + encodePath(url.slice(origin.length))
}
