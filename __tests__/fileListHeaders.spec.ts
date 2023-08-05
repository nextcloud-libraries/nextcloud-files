import { describe, expect, test, beforeEach, vi } from 'vitest'
import { Header, getFileListHeaders, registerFileListHeaders } from '../lib/fileListHeaders'
import logger from '../lib/utils/logger'
import { Folder } from '../lib/files/folder'

describe('FileListHeader init', () => {

	beforeEach(() => {
		delete window._nc_filelistheader
	})

	test('Getting empty uninitialized FileListHeader', () => {
		logger.debug = vi.fn()
		const headers = getFileListHeaders()
		expect(window._nc_filelistheader).toBeUndefined()
		expect(headers).toHaveLength(0)
		expect(logger.debug).toHaveBeenCalledTimes(0)
	})

	test('Initializing FileListHeader', () => {
		logger.debug = vi.fn()
		const header = new Header({
			id: 'test',
			order: 1,
			enabled: () => true,
			render: () => {},
			updated: () => {},
		})

		expect(header.id).toBe('test')
		expect(header.order).toBe(1)
		expect(header.enabled!({} as Folder, {})).toBe(true)

		registerFileListHeaders(header)

		expect(window._nc_filelistheader).toHaveLength(1)
		expect(getFileListHeaders()).toHaveLength(1)
		expect(getFileListHeaders()[0]).toStrictEqual(header)
		expect(logger.debug).toHaveBeenCalled()
	})

	test('Duplicate Header gets rejected', () => {
		logger.error = vi.fn()
		const header = new Header({
			id: 'test',
			order: 1,
			render: () => {},
			updated: () => {},
		})

		registerFileListHeaders(header)
		expect(getFileListHeaders()).toHaveLength(1)
		expect(getFileListHeaders()[0]).toStrictEqual(header)

		const header2 = new Header({
			id: 'test',
			order: 2,
			render: () => {},
			updated: () => {},
		})

		registerFileListHeaders(header2)
		expect(getFileListHeaders()).toHaveLength(1)
		expect(getFileListHeaders()[0]).toStrictEqual(header)
		expect(logger.error).toHaveBeenCalledWith('Header test already registered', { header: header2 })
	})
})
