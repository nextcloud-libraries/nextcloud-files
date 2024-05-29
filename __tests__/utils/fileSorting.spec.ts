/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { ArgumentsType, describe, expect, test } from 'vitest'
import { File, FilesSortingMode, Folder, sortNodes as originalSortNodes } from '../../lib'

const file = (name: string, size?: number, modified?: number, favorite = false) => new File({
	source: `https://cloud.domain.com/remote.php/dav/${name}`,
	mime: 'text/plain',
	owner: 'jdoe',
	mtime: new Date(modified ?? Date.now()),
	size,
	attributes: favorite
		? {
			favorite: 1,
		}
		: undefined,
})

const folder = (name: string, size?: number, modified?: number, favorite = false) => new Folder({
	source: `https://cloud.domain.com/remote.php/dav/${name}`,
	owner: 'jdoe',
	mtime: new Date(modified ?? Date.now()),
	size,
	attributes: favorite
		? {
			favorite: 1,
		}
		: undefined,
})

const sortNodes = (...args: ArgumentsType<typeof originalSortNodes>) => originalSortNodes(...args).map((node) => node.basename)

describe('sortNodes', () => {
	test('By default files are sorted by name', () => {
		const array = [
			file('a', 500, 100),
			file('b', 100, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array)).toEqual(['a', 'b', 'c'])
	})

	test('By default folders are handled like files', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 100, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array)).toEqual(['a', 'b', 'c'])
	})

	test('By default favorites are not handled special', () => {
		const array = [
			file('a', 500, 100),
			file('b', 100, 100, true),
			file('c', 100, 500),
		]

		expect(sortNodes(array)).toEqual(['a', 'b', 'c'])
	})

	test('If a display name is available the displayname is prefered over the basename', () => {
		const array = [
			// File with basename "d" but displayname "a"
			new File({
				owner: 'jdoe',
				mime: 'text/plain',
				// Resulting in name "d"
				source: 'https://cloud.domain.com/remote.php/dav/d',
				mtime: new Date(100),
				size: 100,
				attributes: {
					displayName: 'a',
				},
			}),
			file('b', 100, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array)).toEqual(['d', 'b', 'c'])
	})

	test('If same display name, then the basename is used', () => {
		const array = [
			// File with basename "c" but displayname "a"
			new File({
				owner: 'jdoe',
				mime: 'text/plain',
				// Resulting in name "d"
				source: 'https://cloud.domain.com/remote.php/dav/c',
				mtime: new Date(100),
				size: 100,
				attributes: {
					displayName: 'a',
				},
			}),
			// File with basename "b" but displayname "a"
			new File({
				owner: 'jdoe',
				mime: 'text/plain',
				// Resulting in name "d"
				source: 'https://cloud.domain.com/remote.php/dav/b',
				mtime: new Date(100),
				size: 100,
				attributes: {
					displayName: 'a',
				},
			}),
		]

		expect(sortNodes(array)).toEqual(['b', 'c'])
	})

	test('Can sort favorites first', () => {
		const array = [
			file('a', 500, 100),
			file('b', 100, 100, true),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortFavoritesFirst: true })).toEqual(['b', 'a', 'c'])
	})

	test('Can sort folders first', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 100, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortFoldersFirst: true })).toEqual(['b', 'a', 'c'])
	})

	test('Can sort folders first when sorting descending', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 100, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortFoldersFirst: true, sortingOrder: 'desc' })).toEqual(['b', 'c', 'a'])
	})

	test('Can sort favorite folders first', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 100, 100),
			folder('c', 100, 500, true),
		]

		expect(sortNodes(array, { sortFoldersFirst: true, sortFavoritesFirst: true })).toEqual(['c', 'b', 'a'])
	})

	test('Can sort favorites before folders', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 100, 100),
			file('c', 100, 500, true),
		]

		expect(sortNodes(array, { sortFoldersFirst: true, sortFavoritesFirst: true })).toEqual(['c', 'b', 'a'])
	})

	test('Sort nodes (with default mode) descending', () => {
		const array = [
			file('a', 500, 100),
			file('b', 100, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortingOrder: 'desc' })).toEqual(['c', 'b', 'a'])
	})

	test('Sort nodes by name descending', () => {
		const array = [
			file('a', 500, 100),
			file('b', 100, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortingOrder: 'desc', sortingMode: FilesSortingMode.Name })).toEqual(['c', 'b', 'a'])
	})

	test('Sort nodes by size', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 150, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortingMode: FilesSortingMode.Size })).toEqual(['c', 'b', 'a'])
	})

	test('Sort nodes by size descending', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 150, 100),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortingMode: FilesSortingMode.Size, sortingOrder: 'desc' })).toEqual(['a', 'b', 'c'])
	})

	test('Sort nodes by mtime', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 100, 250),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortingMode: FilesSortingMode.Modified })).toEqual(['c', 'b', 'a'])
	})

	test('Sort nodes by mtime descending', () => {
		const array = [
			file('a', 500, 100),
			folder('b', 100, 250),
			file('c', 100, 500),
		]

		expect(sortNodes(array, { sortingMode: FilesSortingMode.Modified, sortingOrder: 'desc' })).toEqual(['a', 'b', 'c'])
	})
})
