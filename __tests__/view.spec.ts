/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, test } from 'vitest'

import { View } from '../lib/navigation/view.ts'
import { Folder } from '../lib/index.ts'

describe('Invalid View creation', () => {
	test('Invalid id', () => {
		expect(() => new View({
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
		} as unknown as View),
		).toThrowError('View id is required and must be a string')
	})
	test('Invalid name', () => {
		expect(() => new View({
			id: 'test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
		} as unknown as View),
		).toThrowError('View name is required and must be a string')
	})
	test('Invalid caption', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			caption: null,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
		} as unknown as View),
		).toThrowError('View caption must be a string')
	})
	test('Invalid getContents', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: null,
		} as unknown as View),
		).toThrowError('View getContents is required and must be a function')
	})
	test('Invalid icon', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '',
			getContents: () => Promise.reject(new Error()),
		} as unknown as View),
		).toThrowError('View icon is required and must be a valid svg string')
	})

	test('Invalid hidden', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			hidden: 'true',
			getContents: () => Promise.reject(new Error()),
		} as unknown as View),
		).toThrowError('View hidden must be a boolean')
	})

	test('Invalid order', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: null,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
		} as unknown as View),
		).toThrowError('View order must be a number')
	})
	test('Invalid columns', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
			columns: [null],
		} as unknown as View),
		).toThrowError('View columns must be an array of Column. Invalid column found')
	})
	test('Invalid emptyView', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
			emptyView: true,
		} as unknown as View),
		).toThrowError('View emptyView must be a function')
	})
	test('Invalid parent', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
			parent: 1,
		} as unknown as View),
		).toThrowError('View parent must be a string')
	})
	test('Invalid sticky', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
			sticky: null,
		} as unknown as View),
		).toThrowError('View sticky must be a boolean')
	})
	test('Invalid expanded', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
			expanded: null,
		} as unknown as View),
		).toThrowError('View expanded must be a boolean')
	})
	test('Invalid defaultSortKey', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
			defaultSortKey: 1,
		} as unknown as View),
		).toThrowError('View defaultSortKey must be a string')
	})
	test('Invalid loadChildViews', () => {
		expect(() => new View({
			id: 'test',
			name: 'Test',
			order: 1,
			icon: '<svg></svg>',
			getContents: () => Promise.reject(new Error()),
			loadChildViews: true,
		} as unknown as View),
		).toThrowError('View loadChildViews must be a function')
	})
})

describe('View creation', () => {
	test('Create a View', async () => {
		const folder = new Folder({ source: 'https://example.org', owner: 'admin' })
		const view = new View({
			id: 'test',
			name: 'Test',
			caption: 'Test caption',
			emptyTitle: 'Test empty title',
			emptyCaption: 'Test empty caption',
			getContents: () => Promise.resolve({ folder, contents: [] }),
			hidden: true,
			icon: '<svg></svg>',
			order: 1,
			params: {},
			columns: [],
			emptyView: () => {},
			parent: 'parent',
			sticky: false,
			expanded: false,
			defaultSortKey: 'key',
			loadChildViews: async () => {},
		})

		expect(view.id).toBe('test')
		expect(view.name).toBe('Test')
		expect(view.caption).toBe('Test caption')
		expect(view.emptyTitle).toBe('Test empty title')
		expect(view.emptyCaption).toBe('Test empty caption')
		await expect(view.getContents('/')).resolves.toStrictEqual({ folder, contents: [] })
		expect(view.hidden).toBe(true)
		expect(view.icon).toBe('<svg></svg>')
		expect(view.order).toBe(1)
		expect(view.params).toStrictEqual({})
		expect(view.columns).toStrictEqual([])
		expect(view.emptyView?.({} as unknown as HTMLDivElement)).toBe(undefined)
		expect(view.parent).toBe('parent')
		expect(view.sticky).toBe(false)
		expect(view.expanded).toBe(false)
		expect(view.defaultSortKey).toBe('key')
		await expect(view.loadChildViews?.({} as unknown as View)).resolves.toBe(undefined)
	})
})
