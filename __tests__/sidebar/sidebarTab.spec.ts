/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ISidebarTab } from '../../lib/sidebar/SidebarTab.ts'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scopedGlobals } from '../../lib/globalScope.ts'
import { getSidebarTabs, registerSidebarTab } from '../../lib/sidebar/SidebarTab.ts'

// missing in JSDom but supported by every browser!
import 'css.escape'

describe('Sidebar tabs', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
		delete scopedGlobals.filesSidebarTabs
	})

	it('can register a tab', () => {
		const tab = getExampleTab()

		registerSidebarTab(tab)
		expect(scopedGlobals.filesSidebarTabs).toBeInstanceOf(Map)
		expect(scopedGlobals.filesSidebarTabs!.has(tab.id)).toBe(true)
		expect(scopedGlobals.filesSidebarTabs!.get(tab.id)).toBe(tab)
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
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab(getExampleTab)
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tab is not an object]')
		})

		it('fails with missing id', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), id: undefined })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an id conforming to the HTML id attribute specifications]')
		})

		it('fails with non conforming id', () => {
			expect(() => registerSidebarTab({ ...getExampleTab(), id: 'this is invalid' })).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an id conforming to the HTML id attribute specifications]')
		})

		it('fails with missing tagName name', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), tagName: undefined })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have the tagName name set]')
		})

		it('fails with invalid tagName name', () => {
			expect(() => registerSidebarTab({ ...getExampleTab(), tagName: 'MyAppSidebarTab' }))
				.toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tab "tagName" is invalid]')
		})

		it('fails with missing name', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), displayName: undefined })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a name set]')
		})

		it('fails with invalid name', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), displayName: 1234 })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a name set]')
		})

		it('fails with missing icon', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), iconSvgInline: undefined })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an valid SVG icon]')
		})

		it('fails with invalid SVG icon', () => {
			expect(() => registerSidebarTab({ ...getExampleTab(), iconSvgInline: 'icon-group' })).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have an valid SVG icon]')
		})

		it('fails with missing order', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), order: undefined })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a numeric order set]')
		})

		it('fails with invalid order', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), order: '3' })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tabs need to have a numeric order set]')
		})

		it('fails with invalid "enabled" method', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), enabled: 'true' })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tab "enabled" is not a function]')
		})

		it('fails with invalid "onInit" method', () => {
			expect(() => {
				// @ts-expect-error mocking for testing
				registerSidebarTab({ ...getExampleTab(), onInit: 'not a method' })
			}).toThrowErrorMatchingInlineSnapshot('[Error: Sidebar tab "onInit" is not a function]')
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
		tagName: 'example_app-files-sidebar-tab',
		enabled: vi.fn(),
		iconSvgInline: '<svg><circle r="45" cx="50" cy="50" fill="red" /></svg>',
		order: 0,
	}
}
