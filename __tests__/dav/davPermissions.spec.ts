/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { describe, expect, it } from 'vitest'
import { parsePermissions } from '../../lib/dav/davPermissions'
import { Permission } from '../../lib/permissions'

const dataSet = [
	{ input: undefined, permissions: Permission.NONE },
	{ input: null, permissions: Permission.NONE },
	{ input: '-', permissions: Permission.NONE },
	{ input: 'CK', permissions: Permission.CREATE },
	{ input: 'G', permissions: Permission.READ },
	{ input: 'W', permissions: Permission.WRITE },
	{ input: 'NV', permissions: Permission.UPDATE },
	{ input: 'D', permissions: Permission.DELETE },
	{ input: 'R', permissions: Permission.SHARE },
	{ input: 'GCK', permissions: Permission.READ | Permission.CREATE },
	{ input: 'GNV', permissions: Permission.READ | Permission.UPDATE },
	{ input: 'GNVCK', permissions: Permission.READ | Permission.CREATE | Permission.UPDATE },
	{ input: 'GR', permissions: Permission.READ | Permission.SHARE },
	{ input: 'GD', permissions: Permission.READ | Permission.DELETE },
	{ input: 'RGDNVW', permissions: Permission.READ | Permission.UPDATE | Permission.WRITE | Permission.DELETE | Permission.SHARE },
	{ input: 'RGDNVCK', permissions: Permission.READ | Permission.UPDATE | Permission.CREATE | Permission.DELETE | Permission.SHARE },
]

describe('davParsePermissions', () => {
	dataSet.forEach(({ input, permissions }) => {
		it(`expect ${input} to be ${permissions}`, () => {
			expect(parsePermissions(input as any as string)).toBe(permissions)
		})
	})
})
