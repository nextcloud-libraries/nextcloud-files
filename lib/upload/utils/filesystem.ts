/*!
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
// Helpers for the File and Directory API
//
// The interfaces of the (legacy) File and Directory Entries API are not exposed as global
// constructors by Chromium, so `instanceof` can not be used and we check the shape instead.
// This also works for browsers that do not support the API at all.

/**
 * Check whether the given object is a `FileSystemEntry`
 *
 * @param o - The object to check
 */
export function isFileSystemEntry(o: unknown): o is FileSystemEntry {
	return typeof o === 'object' && o !== null
		&& 'isFile' in o && typeof o.isFile === 'boolean'
		&& 'isDirectory' in o && typeof o.isDirectory === 'boolean'
		&& 'fullPath' in o && typeof o.fullPath === 'string'
}

/**
 * Check whether the given object is a `FileSystemDirectoryEntry`
 *
 * @param o - The object to check
 */
export function isFileSystemDirectoryEntry(o: unknown): o is FileSystemDirectoryEntry {
	return isFileSystemEntry(o) && o.isDirectory && typeof (o as FileSystemDirectoryEntry).createReader === 'function'
}

/**
 * Check whether the given object is a `FileSystemFileEntry`
 *
 * @param o - The object to check
 */
export function isFileSystemFileEntry(o: unknown): o is FileSystemFileEntry {
	return isFileSystemEntry(o) && o.isFile && typeof (o as FileSystemFileEntry).file === 'function'
}
