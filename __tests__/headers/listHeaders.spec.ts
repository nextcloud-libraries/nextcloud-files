/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileListHeader, IFolder, IView } from '../../lib/index.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getFileListHeaders, registerFileListHeader } from '../../lib/headers/index.ts'
import { getRegistry } from '../../lib/registry.ts'
import logger from '../../lib/utils/logger.ts'

describe('FileListHeader init', () => {
	beforeEach(() => {
		delete window._nc_filelistheader
	})

	test('Getting empty uninitialized FileListHeader', () => {
		const headers = getFileListHeaders()
		expect(window._nc_filelistheader).toBeDefined()
		expect(headers).toHaveLength(0)
	})

	test('register FileListHeader', () => {
		const header: IFileListHeader = {
			id: 'test',
			order: 1,
			enabled: () => true,
			render: () => {},
			updated: () => {},
		}

		expect(header.id).toBe('test')
		expect(header.order).toBe(1)
		expect(header.enabled!({} as IFolder, {} as IView)).toBe(true)

		registerFileListHeader(header)

		expect(window._nc_filelistheader).toHaveLength(1)
		expect(getFileListHeaders()).toHaveLength(1)
		expect(getFileListHeaders()[0]).toStrictEqual(header)
	})

	test('register FileListHeader emits registry event', () => {
		logger.debug = vi.fn()
		const callback = vi.fn()
		const header: IFileListHeader = {
			id: 'test',
			order: 1,
			enabled: () => true,
			render: () => {},
			updated: () => {},
		}

		getRegistry().addEventListener('register:listHeader', callback)
		registerFileListHeader(header)
		expect(callback).toHaveBeenCalled()
		expect(callback.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
		expect(callback.mock.calls[0][0].type).toBe('register:listHeader')
		expect(callback.mock.calls[0][0].detail).toBe(header)
	})

	test('Duplicate Header gets rejected', () => {
		logger.error = vi.fn()
		const header: IFileListHeader = {
			id: 'test',
			order: 1,
			render: () => {},
			updated: () => {},
		}

		registerFileListHeader(header)
		expect(getFileListHeaders()).toHaveLength(1)
		expect(getFileListHeaders()[0]).toStrictEqual(header)

		const header2: IFileListHeader = {
			id: 'test',
			order: 2,
			render: () => {},
			updated: () => {},
		}

		registerFileListHeader(header2)
		expect(getFileListHeaders()).toHaveLength(1)
		expect(getFileListHeaders()[0]).toStrictEqual(header)
		expect(logger.error).toHaveBeenCalledWith('Header test already registered', { header: header2 })
	})
})

describe('FileListHeader validate', () => {
	test('Missing required props', () => {
		expect(() => registerFileListHeader({
			id: null,
			render: () => {},
			updated: () => {},
		} as unknown as IFileListHeader)).toThrowError('Invalid header: id, render and updated are required')

		expect(() => registerFileListHeader({
			id: '123',
			render: null,
			updated: () => {},
		} as unknown as IFileListHeader)).toThrowError('Invalid header: id, render and updated are required')

		expect(() => registerFileListHeader({
			id: '123',
			render: () => {},
			updated: null,
		} as unknown as IFileListHeader)).toThrowError('Invalid header: id, render and updated are required')
	})
	test('Invalid id', () => {
		expect(() => registerFileListHeader({
			id: true,
			render: () => {},
			updated: () => {},
		} as unknown as IFileListHeader)).toThrowError('Invalid id property')
	})
	test('Invalid enabled', () => {
		expect(() => registerFileListHeader({
			id: 'test',
			enabled: true,
			render: () => {},
			updated: () => {},
		} as unknown as IFileListHeader)).toThrowError('Invalid enabled property')
	})
	test('Invalid render', () => {
		expect(() => registerFileListHeader({
			id: 'test',
			enabled: () => {},
			render: true,
			updated: () => {},
		} as unknown as IFileListHeader)).toThrowError('Invalid render property')
	})
	test('Invalid updated', () => {
		expect(() => registerFileListHeader({
			id: 'test',
			enabled: () => {},
			render: () => {},
			updated: true,
		} as unknown as IFileListHeader)).toThrowError('Invalid updated property')
	})
})

describe('FileListHeader exec', () => {
	test('Initializing FileListHeader', () => {
		const enabled = vi.fn()
		const render = vi.fn()
		const updated = vi.fn()

		const header: IFileListHeader = {
			id: 'test',
			order: 1,
			enabled,
			render,
			updated,
		}

		expect(header.enabled).toBe(enabled)
		expect(header.render).toBe(render)
		expect(header.updated).toBe(updated)

		header.enabled!({} as IFolder, {} as IView)
		header.render(null as any as HTMLElement, {} as IFolder, {} as IView)
		header.updated({} as IFolder, {} as IView)

		expect(enabled).toHaveBeenCalled()
		expect(render).toHaveBeenCalled()
		expect(updated).toHaveBeenCalled()
	})
})
