/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ISidebar, ISidebarContext } from '~/ui/index.ts'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { File } from '~/node/index.ts'
import { getSidebar } from '~/ui/index.ts'

const node = new File({
	id: 1,
	source: 'https://cloud.example.com/remote.php/dav/files/test/file.txt',
	owner: 'test',
	mime: 'text/plain',
	root: '/files/test',
})

/**
 * Get a mocked sidebar implementation as provided by the files app.
 */
function mockImplementation() {
	const implementation = {
		isOpen: true,
		activeTab: 'sharing',
		node,
		open: vi.fn(),
		close: vi.fn(),
		setActiveTab: vi.fn(),
		setFullScreenMode: vi.fn(),
		getTabs: vi.fn(() => []),
		getActions: vi.fn(() => []),
	} satisfies Omit<ISidebar, 'available' | 'mount' | 'registerTab' | 'registerAction'>

	window.OCA = { Files: { _sidebar: () => implementation } }
	return implementation
}

describe('Sidebar', () => {
	beforeEach(() => {
		window.OCA = {}
	})

	afterEach(() => {
		delete window.OCA.Files
	})

	it('is not available without an implementation', () => {
		const sidebar = getSidebar()

		expect(sidebar.available).toBe(false)
		expect(sidebar.isOpen).toBe(false)
		expect(sidebar.activeTab).toBeUndefined()
		expect(sidebar.node).toBeUndefined()
		expect(sidebar.getTabs()).toEqual([])
		expect(sidebar.getActions()).toEqual([])
	})

	it('does not fail without an implementation', () => {
		const sidebar = getSidebar()

		expect(() => sidebar.open(node)).not.toThrow()
		expect(() => sidebar.close()).not.toThrow()
		expect(() => sidebar.setActiveTab('sharing')).not.toThrow()
		expect(() => sidebar.setFullScreenMode(true)).not.toThrow()
	})

	describe('Rendering the sidebar within an app', () => {
		it('renders the sidebar into the requested element', () => {
			const mountSidebar = vi.fn()
			window.OCA = { Files: { _mountSidebar: mountSidebar } }
			const target = document.createElement('div')

			getSidebar().mount(target)
			expect(mountSidebar).toHaveBeenCalledWith(target)
		})

		it('reports if the sidebar was not loaded for the page', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

			expect(() => getSidebar().mount(document.createElement('div'))).not.toThrow()
			expect(consoleSpy).toHaveBeenCalledOnce()
		})

		it('is not available until it is rendered', () => {
			window.OCA = { Files: { _mountSidebar: vi.fn() } }

			expect(getSidebar().available).toBe(false)
		})
	})

	it('is available with an implementation', () => {
		mockImplementation()
		const sidebar = getSidebar()

		expect(sidebar.available).toBe(true)
		expect(sidebar.isOpen).toBe(true)
		expect(sidebar.activeTab).toBe('sharing')
		expect(sidebar.node).toBe(node)
	})

	it('proxies the state to the implementation', () => {
		const implementation = mockImplementation()
		const sidebar = getSidebar()

		sidebar.open(node, 'sharing')
		expect(implementation.open).toHaveBeenCalledWith(node, 'sharing')

		sidebar.setActiveTab('versions')
		expect(implementation.setActiveTab).toHaveBeenCalledWith('versions')

		sidebar.setFullScreenMode(true)
		expect(implementation.setFullScreenMode).toHaveBeenCalledWith(true)

		sidebar.close()
		expect(implementation.close).toHaveBeenCalledOnce()
	})

	it('proxies the context of tabs and actions', () => {
		const implementation = mockImplementation()
		const sidebar = getSidebar()

		// the folder and the view only exist if the sidebar is rendered within the files app
		const context: ISidebarContext = { node }

		sidebar.getTabs(context)
		expect(implementation.getTabs).toHaveBeenCalledWith(context)

		sidebar.getActions(context)
		expect(implementation.getActions).toHaveBeenCalledWith(context)
	})
})
