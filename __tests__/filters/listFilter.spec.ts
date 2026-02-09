/*
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileListFilterChip } from '../../lib/filters/index.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { FileListFilter, getFileListFilters, registerFileListFilter, unregisterFileListFilter } from '../../lib/filters/index.ts'
import { scopedGlobals } from '../../lib/globalScope.ts'
import { getRegistry } from '../../lib/registry.ts'

class TestFilter extends FileListFilter {
	public testUpdated() {
		this.filterUpdated()
	}

	public testUpdateChips(chips: IFileListFilterChip[]) {
		this.updateChips(chips)
	}
}

describe('File list filter class', () => {
	test('correctly sets ID', () => {
		const filter = new FileListFilter('my:id')
		expect(filter.id).toBe('my:id')
	})

	test('has fallback order', () => {
		const filter = new FileListFilter('my:id')
		expect(filter.order).toBe(100)
	})

	test('can set order', () => {
		const filter = new FileListFilter('my:id', 50)
		expect(filter.order).toBe(50)
	})

	test('emits filter updated event', () => {
		const filter = new TestFilter('my:id', 50)
		const spy = vi.fn()

		filter.addEventListener('update:filter', spy)
		filter.testUpdated()

		expect(spy).toBeCalled()
		expect(spy.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
		expect(spy.mock.calls[0][0].type).toBe('update:filter')
	})

	test('emits chips updated event', () => {
		const filter = new TestFilter('my:id', 50)
		const chips: IFileListFilterChip[] = [{ text: 'my chip', onclick: () => {} }]
		const spy = vi.fn()

		filter.addEventListener('update:chips', spy)
		filter.testUpdateChips(chips)

		expect(spy).toBeCalled()
		expect(spy.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
		expect(spy.mock.calls[0][0].type).toBe('update:chips')
		expect(spy.mock.calls[0][0].detail).toBe(chips)
	})

	test('requires filter function to be implemented', () => {
		const filter = new TestFilter('my:id')
		expect(() => filter.filter([])).toThrowError()
	})

	test('emits chips updated event', () => {
		const filter = new TestFilter('my:id', 50)
		const chips: IFileListFilterChip[] = [{ text: 'my chip', onclick: () => {} }]
		const spy = vi.fn()

		filter.addEventListener('update:chips', spy)
		filter.testUpdateChips(chips)

		expect(spy).toBeCalled()
		expect(spy.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
		expect(spy.mock.calls[0][0].type).toBe('update:chips')
		expect(spy.mock.calls[0][0].detail).toBe(chips)
	})
})

describe('File list filter functions', () => {
	beforeEach(() => {
		delete scopedGlobals.fileListFilters
	})

	test('can register a filter', () => {
		const filter = new FileListFilter('my:id', 50)

		registerFileListFilter(filter)
		expect(scopedGlobals.fileListFilters).toBeTypeOf('object')
		expect(scopedGlobals.fileListFilters!.has(filter.id)).toBe(true)
		expect(scopedGlobals.fileListFilters!.get(filter.id)).toBe(filter)
	})

	test('register a filter emits event', () => {
		const filter = new FileListFilter('my:id')
		const spy = vi.fn()

		getRegistry().addEventListener('register:listFilter', spy)

		expect(scopedGlobals.fileListFilters).toBe(undefined)

		registerFileListFilter(filter)
		expect(spy).toHaveBeenCalled()
		expect(spy.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
		expect(spy.mock.calls[0][0].detail).toBe(filter)
	})

	test('cannot register a filter twice', () => {
		const filter = new FileListFilter('my:id')
		const filter2 = new FileListFilter('my:id')

		registerFileListFilter(filter)
		expect(() => registerFileListFilter(filter2)).toThrowError(/already registered/)
	})

	test('can unregister a filter', () => {
		const filter = new FileListFilter('my:id')

		registerFileListFilter(filter)
		expect(scopedGlobals.fileListFilters!.has(filter.id)).toBe(true)

		// test
		unregisterFileListFilter(filter.id)
		expect(scopedGlobals.fileListFilters!.has(filter.id)).toBe(false)
	})

	test('unregister a filter twice does not throw', () => {
		const filter = new FileListFilter('my:id')

		registerFileListFilter(filter)
		expect(scopedGlobals.fileListFilters!.has(filter.id)).toBe(true)

		// test
		unregisterFileListFilter(filter.id)
		expect(scopedGlobals.fileListFilters!.has(filter.id)).toBe(false)
		expect(() => unregisterFileListFilter(filter.id)).not.toThrow()
	})

	test('unregister a filter emits event', () => {
		const filter = new FileListFilter('my:id')
		const spy = vi.fn()

		registerFileListFilter(filter)
		getRegistry().addEventListener('unregister:listFilter', spy)

		unregisterFileListFilter(filter.id)
		expect(spy).toHaveBeenCalled()
		expect(spy.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
		expect(spy.mock.calls[0][0].detail).toBe(filter.id)
	})

	test('can get registered filters', () => {
		const filter = new FileListFilter('my:id', 50)

		expect(getFileListFilters()).toEqual([])
		registerFileListFilter(filter)
		expect(getFileListFilters()).toEqual([filter])
	})
})
