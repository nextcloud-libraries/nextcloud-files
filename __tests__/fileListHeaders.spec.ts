/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileListHeader } from '../lib/fileListHeaders.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getFileListHeaders, registerFileListHeader } from '../lib/fileListHeaders.ts'
import logger from '../lib/utils/logger.ts'

const eventBusEmit = vi.hoisted(() => vi.fn())

vi.mock('@nextcloud/event-bus', () => {
	return {
		emit: eventBusEmit,
	}
})

describe('FileListHeader init', () => {
	beforeEach(() => {
		delete window._nc_filelistheader
		vi.resetAllMocks()
	})

	test('Getting empty uninitialized FileListHeader', () => {
		const headers = getFileListHeaders()
		expect(Array.isArray(headers)).toBe(true)
		expect(headers).toHaveLength(0)
	})

	test('Register FileListHeader', () => {
		logger.debug = vi.fn()
		const header: IFileListHeader = {
			id: 'test',
			order: 1,
			enabled: () => true,
			render: () => {},
			updated: () => {},
		}

		registerFileListHeader(header)
		expect(logger.debug).toHaveBeenCalled()

		expect(window._nc_filelistheader).toHaveLength(1)
		expect(getFileListHeaders()).toHaveLength(1)
		expect(getFileListHeaders()[0]).toStrictEqual(header)
	})

	test('registerFileListHeader() emits event', () => {
		const header: IFileListHeader = {
			id: 'test',
			order: 1,
			enabled: () => true,
			render: () => {},
			updated: () => {},
		}

		expect(eventBusEmit).not.toHaveBeenCalled()
		registerFileListHeader(header)
		expect(eventBusEmit).toHaveBeenCalledWith('file:header:added', header)
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

describe('FileListHeader validation', () => {
	test('Missing required props', () => {
		expect(() => {
			registerFileListHeader({
				id: null,
				render: () => {},
				updated: () => {},
			} as any as IFileListHeader)
		}).toThrowError('Invalid header: id, render and updated are required')

		expect(() => {
			registerFileListHeader({
				id: '123',
				render: null,
				updated: () => {},
			} as any as IFileListHeader)
		}).toThrowError('Invalid header: id, render and updated are required')

		expect(() => {
			registerFileListHeader({
				id: '123',
				render: () => {},
				updated: null,
			} as any as IFileListHeader)
		}).toThrowError('Invalid header: id, render and updated are required')
	})
	test('Invalid id', () => {
		expect(() => {
			registerFileListHeader({
				id: true,
				render: () => {},
				updated: () => {},
			} as any as IFileListHeader)
		}).toThrowError('Invalid id property')
	})
	test('Invalid enabled', () => {
		expect(() => {
			registerFileListHeader({
				id: 'test',
				enabled: true,
				render: () => {},
				updated: () => {},
			} as any as IFileListHeader)
		}).toThrowError('Invalid enabled property')
	})
	test('Invalid render', () => {
		expect(() => {
			registerFileListHeader({
				id: 'test',
				enabled: () => {},
				render: true,
				updated: () => {},
			} as any as IFileListHeader)
		}).toThrowError('Invalid render property')
	})
	test('Invalid updated', () => {
		expect(() => {
			registerFileListHeader({
				id: 'test',
				enabled: () => {},
				render: () => {},
				updated: true,
			} as any as IFileListHeader)
		}).toThrowError('Invalid updated property')
	})
})
