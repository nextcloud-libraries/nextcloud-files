/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 */

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
	return `${base}/${encodeURIComponent(path)}`
}
