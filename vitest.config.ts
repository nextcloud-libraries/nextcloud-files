/**
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import config from './vite.config'

export default async (env) => {
	const cfg = await config(env)
	delete cfg.define

	return {
		...cfg,
		test: {
			env: {
				LANG: 'en-US',
			},
			environment: 'jsdom',
			coverage: {
				include: ['lib/**'],
				exclude: ['lib/utils/logger.ts'],
				provider: 'istanbul',
				reporter: ['lcov', 'text'],
			},
			globalSetup: '__tests__/test-global-setup.ts',
		},
	}
}
