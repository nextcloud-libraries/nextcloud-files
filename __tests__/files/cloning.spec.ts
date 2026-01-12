/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { NodeData } from '../../lib/node/index.ts'

import { describe, expect, test } from 'vitest'
import { File, NodeStatus } from '../../lib/node/index.ts'
import { Permission } from '../../lib/permissions.ts'

describe('File cloning', () => {
	test('Clone preserves all basic properties', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
			crtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			size: 12345,
			permissions: Permission.ALL,
			root: '/files/emma',
			status: NodeStatus.NEW,
		})

		const clone = file.clone()

		expect(clone).toBeInstanceOf(File)
		expect(clone).not.toBe(file)
		expect(clone.source).toBe(file.source)
		expect(clone.mime).toBe(file.mime)
		expect(clone.owner).toBe(file.owner)
		expect(clone.size).toBe(file.size)
		expect(clone.permissions).toBe(file.permissions)
		expect(clone.root).toBe(file.root)
		expect(clone.status).toBe(file.status)
		expect(clone.mtime?.toISOString()).toBe(file.mtime?.toISOString())
		expect(clone.crtime?.toISOString()).toBe(file.crtime?.toISOString())
	})

	test('Clone preserves attributes', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			root: '/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			attributes: {
				favorite: true,
				customProp: 'value',
				nested: { key: 'value' },
			},
		})

		const clone = file.clone()

		expect(clone.attributes).toStrictEqual(file.attributes)
		expect(clone.attributes.favorite).toBe(true)
		expect(clone.attributes.customProp).toBe('value')
		expect(clone.attributes.nested).toStrictEqual({ key: 'value' })
	})

	test('Clone is independent from original', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			root: '/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			size: 100,
			attributes: {
				test: 'original',
			},
		})

		const clone = file.clone()

		// Modify the clone
		clone.size = 200
		clone.mime = 'image/png'
		clone.attributes.test = 'modified'
		clone.attributes.newProp = 'new'

		// Original should be unchanged
		expect(file.size).toBe(100)
		expect(file.mime).toBe('image/jpeg')
		expect(file.attributes.test).toBe('original')
		expect(file.attributes.newProp).toBeUndefined()
	})

	test('Clone works with minimal file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/file.txt',
			root: '/files/emma',
			owner: 'emma',
		})

		const clone = file.clone()

		expect(clone).toBeInstanceOf(File)
		expect(clone.source).toBe(file.source)
		expect(clone.mime).toBe('application/octet-stream')
		expect(clone.owner).toBe('emma')
	})

	test('Clone works with remote file', () => {
		const file = new File({
			source: 'https://domain.com/Photos/picture.jpg',
			root: '/',
			mime: 'image/jpeg',
			owner: null,
		})

		const clone = file.clone()

		expect(clone).toBeInstanceOf(File)
		expect(clone.source).toBe(file.source)
		expect(clone.owner).toBeNull()
		expect(clone.isDavResource).toBe(false)
		expect(clone.permissions).toBe(Permission.READ)
	})
})

describe('File serialization and deserialization', () => {
	test('toJSON and JSON.parse roundtrip preserves all properties', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
			crtime: new Date(Date.UTC(1990, 0, 1, 0, 0, 0)),
			size: 12345,
			permissions: Permission.ALL,
			root: '/files/emma',
			status: NodeStatus.LOADING,
		})

		const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
		const reconstructed = new File(parsed[0], parsed[1])

		expect(reconstructed).toBeInstanceOf(File)
		expect(reconstructed.source).toBe(file.source)
		expect(reconstructed.mime).toBe(file.mime)
		expect(reconstructed.owner).toBe(file.owner)
		expect(reconstructed.size).toBe(file.size)
		expect(reconstructed.permissions).toBe(file.permissions)
		expect(reconstructed.root).toBe(file.root)
		expect(reconstructed.status).toBe(file.status)
		expect(reconstructed.mtime?.toISOString()).toBe(file.mtime?.toISOString())
		expect(reconstructed.crtime?.toISOString()).toBe(file.crtime?.toISOString())
	})

	test('toString and JSON.parse preserves attributes', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			root: '/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			attributes: {
				favorite: true,
				tags: ['work', 'important'],
				metadata: { author: 'Emma', version: 2 },
			},
		})

		const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
		const reconstructed = new File(parsed[0], parsed[1])

		expect(reconstructed.attributes).toStrictEqual(file.attributes)
		expect(reconstructed.attributes.favorite).toBe(true)
		expect(reconstructed.attributes.tags).toStrictEqual(['work', 'important'])
		expect(reconstructed.attributes.metadata).toStrictEqual({ author: 'Emma', version: 2 })
	})

	test('toString and JSON.parse works with minimal file', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/file.txt',
			root: '/files/emma',
			owner: 'emma',
		})

		const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
		const reconstructed = new File(parsed[0], parsed[1])

		expect(reconstructed).toBeInstanceOf(File)
		expect(reconstructed.source).toBe(file.source)
		expect(reconstructed.mime).toBe('application/octet-stream')
		expect(reconstructed.owner).toBe('emma')
	})

	test('toString and JSON.parse is independent from original', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			root: '/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			size: 100,
			attributes: {
				test: 'original',
			},
		})

		const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
		const reconstructed = new File(parsed[0], parsed[1])

		// Modify the reconstructed file
		reconstructed.size = 200
		reconstructed.mime = 'image/png'
		reconstructed.attributes.test = 'modified'

		// Original should be unchanged
		expect(file.size).toBe(100)
		expect(file.mime).toBe('image/jpeg')
		expect(file.attributes.test).toBe('original')
	})

	test('toString and JSON.parse preserves displayname', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			root: '/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			displayname: 'My Vacation Photo',
		})

		const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
		const reconstructed = new File(parsed[0], parsed[1])

		expect(reconstructed.displayname).toBe('My Vacation Photo')
		expect(reconstructed.basename).toBe('picture.jpg')
	})

	test('toString and JSON.parse works with remote file', () => {
		const file = new File({
			source: 'https://domain.com/Photos/picture.jpg',
			root: '/',
			mime: 'image/jpeg',
			owner: null,
		})

		expect(file.owner).toBeNull()
		expect(file.isDavResource).toBe(false)
		expect(file.permissions).toBe(Permission.READ)

		const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
		const reconstructed = new File(parsed[0], parsed[1])

		expect(reconstructed).toBeInstanceOf(File)
		expect(reconstructed.source).toBe(file.source)
		expect(reconstructed.owner).toBeNull()
		expect(reconstructed.isDavResource).toBe(false)
		expect(reconstructed.permissions).toBe(Permission.READ)
	})

	test('toString and JSON.parse preserves all NodeStatus values', () => {
		const statuses = [NodeStatus.NEW, NodeStatus.FAILED, NodeStatus.LOADING, NodeStatus.LOCKED]

		for (const status of statuses) {
			const file = new File({
				source: 'https://cloud.domain.com/remote.php/dav/files/emma/file.txt',
				root: '/files/emma',
				owner: 'emma',
				status,
			})

			const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
			const reconstructed = new File(parsed[0], parsed[1])
			expect(reconstructed.status).toBe(status)
		}
	})

	test('toString output is valid JSON', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			root: '/files/emma',
			mime: 'image/jpeg',
			owner: 'emma',
			size: 12345,
		})

		const str = file.toJSON()
		expect(() => JSON.parse(str)).not.toThrow()

		const parsed = JSON.parse(str)
		expect(Array.isArray(parsed)).toBe(true)
		expect(parsed.length).toBeGreaterThanOrEqual(1)
		expect(parsed[0]).toHaveProperty('source')
	})
})

describe('Cloning methods comparison', () => {
	test('clone() and toString/parse produce equivalent files', () => {
		const file = new File({
			source: 'https://cloud.domain.com/remote.php/dav/files/emma/Photos/picture.jpg',
			mime: 'image/jpeg',
			owner: 'emma',
			mtime: new Date(Date.UTC(2023, 0, 1, 0, 0, 0)),
			size: 12345,
			permissions: Permission.ALL,
			root: '/files/emma',
			attributes: {
				favorite: true,
				tags: ['work'],
			},
		})

		const cloned = file.clone()
		const parsed = JSON.parse(file.toJSON()) as [NodeData, RegExp?]
		const reconstructed = new File(parsed[0], parsed[1])

		expect(cloned.source).toBe(reconstructed.source)
		expect(cloned.mime).toBe(reconstructed.mime)
		expect(cloned.owner).toBe(reconstructed.owner)
		expect(cloned.size).toBe(reconstructed.size)
		expect(cloned.permissions).toBe(reconstructed.permissions)
		expect(cloned.root).toBe(reconstructed.root)
		expect(cloned.mtime?.toISOString()).toBe(reconstructed.mtime?.toISOString())
		expect(cloned.attributes).toStrictEqual(reconstructed.attributes)
	})
})
