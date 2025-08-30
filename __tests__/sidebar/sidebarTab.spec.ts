/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSidebarTabs, ISidebarTab, registerSidebarTab } from '../../lib/sidebar'

// missing in JSDom but supported by every browser!
import 'css.escape'

describe('Sidebar tabs', () => {
	beforeEach(() => {
		delete window._nc_files_sidebar_tabs
	})

	it('can register a tab', () => {
		const tab = getExampleTab()
		registerSidebarTab(tab)
		expect(window._nc_files_sidebar_tabs).toBeInstanceOf(Map)
		expect(window._nc_files_sidebar_tabs!.has(tab.id)).toBe(true)
		expect(window._nc_files_sidebar_tabs!.get(tab.id)).toBe(tab)
	})

	it('can fetch empty list of sidebar tabs', () => {
		expect(getSidebarTabs()).toBeInstanceOf(Array)
		expect(getSidebarTabs()).toHaveLength(0)
	})

	it('can fetch list of sidebar tabs', () => {
		registerSidebarTab(getExampleTab())
		registerSidebarTab({ ...getExampleTab(), id: 'another-example' })

		expect(getSidebarTabs()).toBeInstanceOf(Array)
		expect(getSidebarTabs()).toHaveLength(2)
	})

	it('only registeres same id once', () => {
		const consoleSpy = vi.spyOn(console, 'warn')
		consoleSpy.mockImplementationOnce(() => {})

		registerSidebarTab(getExampleTab())
		registerSidebarTab(getExampleTab())
		expect(consoleSpy).toHaveBeenCalledOnce()
		expect(getSidebarTabs()).toHaveLength(1)
	})

	describe('Tab validation', () => {
		it('fails with an invalid parameter', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab(getExampleTab),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tab is not an object]')
		})

		it('fails with missing id', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), id: undefined }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an id conforming to the HTML id attribute specifications]')
		})

		it('fails with non conforming id', () => {
			expect(
				() => registerSidebarTab({ ...getExampleTab(), id: 'this is invalid' }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an id conforming to the HTML id attribute specifications]')
		})

		it('fails with missing name', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), displayName: undefined }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a name set]')
		})

		it('fails with invalid name', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), displayName: 1234 }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a name set]')
		})

		it('fails with missing icon', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), iconSvg: undefined }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an valid SVG icon]')
		})

		it('fails with invalid SVG icon', () => {
			expect(
				() => registerSidebarTab({ ...getExampleTab(), iconSvg: 'icon-group' }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an valid SVG icon]')
		})

		it('fails with missing order', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), order: undefined }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a numeric order set]')
		})

		it('fails with invalid order', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), order: '3' }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a numeric order set]')
		})

		it('fails with missing "enabled" method', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), enabled: undefined }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an "enabled" method]')
		})

		it('fails with missing "setActive" method', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), setActive: undefined }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a "setActive" method]')
		})

		it.for(['mount', 'unmount', 'update'])('fails with missing lifecylce methods', (method) => {
			expect(
				() => registerSidebarTab({ ...getExampleTab(), [method]: undefined }),
			).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tab is missing a required lifecycle method]')
		})

		it('works without specifying a scroll listener', () => {
			expect(
				() => registerSidebarTab({ ...getExampleTab(), onScrollBottomReached: undefined }),
			).not.toThrow()
		})

		it('fails with an invalid scroll listener', () => {
			expect(
				// @ts-expect-error mocking for testing
				() => registerSidebarTab({ ...getExampleTab(), onScrollBottomReached: 'not a method' }),
			).toThrowErrorMatchingInlineSnapshot('[Error: "onScrollBottomReached" of the sidebar tab needs to be a function]')
		})
	})
})

/**
 * Get a very basic mock of a sidebar tab
 */
function getExampleTab(): ISidebarTab {
	return {
		id: 'example-tab',
		displayName: 'Example',
		enabled: vi.fn(),
		iconSvg: '<svg><circle r="45" cx="50" cy="50" fill="red" /></svg>',
		order: 0,
		mount: vi.fn(),
		unmount: vi.fn(),
		update: vi.fn(),
		setActive: vi.fn(),
		onScrollBottomReached: vi.fn(),
	}
}
