/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { FileListFilter, getFileListFilters, IFileListFilterChip, registerFileListFilter, unregisterFileListFilter } from '../lib'
import { subscribe } from '@nextcloud/event-bus'

class TestFilter extends FileListFilter {

	public testUpdated() {
		this.filterUpdated()
	}

	public testUpdateChips(chips) {
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
})

describe('File list filter functions', () => {
	beforeEach(() => {
		delete window._nc_filelist_filters
	})

	test('can register a filter', () => {
		const filter = new FileListFilter('my:id', 50)

		registerFileListFilter(filter)
		expect(window._nc_filelist_filters).toBeTypeOf('object')
		expect(window._nc_filelist_filters!.has(filter.id)).toBe(true)
		expect(window._nc_filelist_filters!.get(filter.id)).toBe(filter)
	})

	test('register a filter emits event', () => {
		const filter = new FileListFilter('my:id')
		const spy = vi.fn()

		subscribe('files:filter:added', spy)

		expect(window._nc_filelist_filters).toBe(undefined)

		registerFileListFilter(filter)
		expect(spy).toHaveBeenCalled()
		expect(spy).toHaveBeenCalledWith(filter)
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
		expect(window._nc_filelist_filters!.has(filter.id)).toBe(true)

		// test
		unregisterFileListFilter(filter.id)
		expect(window._nc_filelist_filters!.has(filter.id)).toBe(false)
	})

	test('unregister a filter twice does not throw', () => {
		const filter = new FileListFilter('my:id')

		registerFileListFilter(filter)
		expect(window._nc_filelist_filters!.has(filter.id)).toBe(true)

		// test
		unregisterFileListFilter(filter.id)
		expect(window._nc_filelist_filters!.has(filter.id)).toBe(false)
		expect(() => unregisterFileListFilter(filter.id)).not.toThrow()
	})

	test('unregister a filter emits event', () => {
		const filter = new FileListFilter('my:id')
		const spy = vi.fn()

		registerFileListFilter(filter)
		subscribe('files:filter:removed', spy)

		unregisterFileListFilter(filter.id)
		expect(spy).toHaveBeenCalled()
		expect(spy).toHaveBeenCalledWith(filter.id)
	})

	test('can get registered filters', () => {
		const filter = new FileListFilter('my:id', 50)

		expect(getFileListFilters()).toEqual([])
		registerFileListFilter(filter)
		expect(getFileListFilters()).toEqual([filter])
	})
})
