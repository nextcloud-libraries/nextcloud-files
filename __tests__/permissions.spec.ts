import { describe, it, expect } from 'vitest'

import { parseWebdavPermissions, Permission } from '../lib/permissions'

const dataSet = [
	{ input: undefined, permissions: Permission.NONE },
	{ input: null, permissions: Permission.NONE },
	{ input: '-', permissions: Permission.NONE },
	{ input: 'C', permissions: Permission.CREATE },
	{ input: 'K', permissions: Permission.CREATE },
	{ input: 'G', permissions: Permission.READ },
	{ input: 'W', permissions: Permission.UPDATE },
	{ input: 'N', permissions: Permission.UPDATE },
	{ input: 'V', permissions: Permission.UPDATE },
	{ input: 'D', permissions: Permission.DELETE },
	{ input: 'R', permissions: Permission.SHARE },
	{ input: 'CKGW', permissions: Permission.CREATE | Permission.READ | Permission.UPDATE },
	{ input: 'GR', permissions: Permission.READ | Permission.SHARE },
	{ input: 'GD', permissions: Permission.READ | Permission.DELETE },
	{ input: 'RGDNVW', permissions: Permission.UPDATE | Permission.READ | Permission.DELETE | Permission.SHARE },
	{ input: 'RGDNVCK', permissions: Permission.UPDATE | Permission.READ | Permission.DELETE | Permission.CREATE | Permission.SHARE },
]

describe('parseWebdavPermissions', () => {
	dataSet.forEach(({ input, permissions }) => {
		it(`expect ${input} to be ${permissions}`, () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(parseWebdavPermissions(input as any as string)).toBe(permissions)
		})
	})
})
