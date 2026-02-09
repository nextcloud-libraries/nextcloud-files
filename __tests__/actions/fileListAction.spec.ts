/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileListAction } from '../../lib/actions/index.ts'
import type { View } from '../../lib/navigation/view.ts'
import type { Folder } from '../../lib/node/index.ts'

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { getFileListActions, registerFileListAction } from '../../lib/actions/fileListAction.ts'
import { scopedGlobals } from '../../lib/globalScope.ts'
import { getRegistry } from '../../lib/registry.ts'
import logger from '../../lib/utils/logger.ts'

const folder = {} as Folder
const view = {} as View

function mockAction(id: string): IFileListAction {
	return {
		id,
		displayName: () => 'Test',
		iconSvgInline: () => '<svg></svg>',
		order: 0,
		// @ts-expect-error mocking for tests
		exec: async () => {},
	}
}

describe('FileListActions init', () => {
	beforeEach(() => {
		delete scopedGlobals.fileListActions
	})

	test('Uninitialized file list actions', () => {
		expect(scopedGlobals.fileListActions).toBe(undefined)
		const actions = getFileListActions()
		expect(actions).toHaveLength(0)
	})

	test('Register a single file list action', () => {
		expect(getFileListActions()).toHaveLength(0)

		const testAction = mockAction('test')

		expect(testAction.id).toBe('test')
		expect(testAction.displayName({ view, folder, contents: [] })).toBe('Test')
		expect(testAction.iconSvgInline!({ view, folder, contents: [] })).toBe('<svg></svg>')

		registerFileListAction(testAction)
		const actions = getFileListActions()
		expect(actions).toHaveLength(1)
		expect(actions.at(0)).toStrictEqual(testAction)
	})

	test('Register multiple file list actions', () => {
		expect(getFileListActions()).toHaveLength(0)

		const fooAction = mockAction('foo')
		const barAction = mockAction('bar')
		const bazAction = mockAction('baz')

		registerFileListAction(fooAction)
		registerFileListAction(barAction)
		registerFileListAction(bazAction)
		expect(getFileListActions()).toHaveLength(3)

		const actions = getFileListActions()
		expect(actions.find((action) => action.id === 'foo')).toStrictEqual(fooAction)
		expect(actions.find((action) => action.id === 'bar')).toStrictEqual(barAction)
		expect(actions.find((action) => action.id === 'baz')).toStrictEqual(bazAction)
	})

	test('Register an action with a duplicate id', () => {
		logger.error = vi.fn()

		expect(getFileListActions()).toHaveLength(0)

		const testActionA = mockAction('test')
		const testActionB = mockAction('test')

		registerFileListAction(testActionA)
		expect(getFileListActions()).toHaveLength(1)

		registerFileListAction(testActionB)
		expect(logger.error).toHaveBeenCalledWith('FileListAction with id "test" is already registered', { action: testActionB })
		expect(getFileListActions()).toHaveLength(1)
	})

	test('register FileAction emits registry event', () => {
		const callback = vi.fn()
		const testAction = mockAction('test')

		getRegistry().addEventListener('register:listAction', callback)
		registerFileListAction(testAction)

		expect(callback).toHaveBeenCalled()
		expect(callback.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
		expect(callback.mock.calls[0][0].type).toBe('register:listAction')
		expect(callback.mock.calls[0][0].detail).toBe(testAction)
	})
})

describe('Invalid IFileListAction registraction', () => {
	test('Invalid id', () => {
		expect(() => registerFileListAction({
			displayName: () => 'Test',
			iconSvgInline: () => '<svg></svg>',
			order: 0,
			exec: async () => {},
		} as unknown as IFileListAction)).toThrowError('Invalid id')
	})
	test('Invalid displayName', () => {
		expect(() => registerFileListAction({
			id: 'test',
			iconSvgInline: () => '<svg></svg>',
			order: 0,
			exec: async () => {},
		} as unknown as IFileListAction)).toThrowError('Invalid displayName function')
	})
	test('Invalid iconSvgInline', () => {
		expect(() => registerFileListAction({
			id: 'test',
			iconSvgInline: null,
			displayName: () => 'Test',
			order: 0,
			exec: async () => {},
		} as unknown as IFileListAction)).toThrowError('Invalid iconSvgInline function')
	})
	test('Invalid order', () => {
		expect(() => registerFileListAction({
			id: 'test',
			displayName: () => 'Test',
			iconSvgInline: () => '<svg></svg>',
			order: null,
			exec: async () => {},
		} as unknown as IFileListAction)).toThrowError('Invalid order')
	})
	test('Invalid enabled', () => {
		expect(() => registerFileListAction({
			id: 'test',
			displayName: () => 'Test',
			iconSvgInline: () => '<svg></svg>',
			order: 0,
			enabled: null,
			exec: async () => {},
		} as unknown as IFileListAction)).toThrowError('Invalid enabled function')
	})
	test('Invalid exec', () => {
		expect(() => registerFileListAction({
			id: 'test',
			displayName: () => 'Test',
			iconSvgInline: () => '<svg></svg>',
			exec: null,
		} as unknown as IFileListAction)).toThrowError('Invalid exec function')
	})
})

describe('IFileListAction creation', () => {
	test('Create a IFileListAction', async () => {
		const testAction: IFileListAction = {
			id: 'test',
			displayName: () => 'Test',
			iconSvgInline: () => '<svg></svg>',
			order: 0,
			enabled: () => true,
			// @ts-expect-error -- mocking for tests
			exec: async () => {},
		}

		expect(testAction.id).toBe('test')
		expect(testAction.displayName({ view, folder, contents: [] })).toBe('Test')
		expect(testAction.iconSvgInline!({ view, folder, contents: [] })).toBe('<svg></svg>')
		expect(testAction.order).toBe(0)
		expect(testAction.enabled?.({ view, folder, contents: [] })).toBe(true)
		await expect(testAction.exec({ view, folder, contents: [] })).resolves.toBe(undefined)
	})
})
