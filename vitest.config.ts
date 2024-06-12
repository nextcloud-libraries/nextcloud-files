/**
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */
import config from './vite.config'

export default async (env) => {
	const cfg = await config(env)
	// Node externals does not work when testing
	cfg.plugins = cfg.plugins!.filter((plugin) => plugin && plugin.name !== 'node-externals')

	cfg.test = {
		environment: 'jsdom',
		coverage: {
			include: ['lib/**'],
			exclude: ['lib/utils/logger.ts'],
			provider: 'istanbul',
			reporter: ['lcov', 'text'],
		},
	}
	delete cfg.define
	return cfg
}
