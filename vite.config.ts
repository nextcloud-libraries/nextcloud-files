/**
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */
import { codecovVitePlugin } from '@codecov/vite-plugin'
import { createLibConfig } from '@nextcloud/vite-config'

export default createLibConfig({
	index: 'lib/index.ts',
}, {
	libraryFormats: ['es', 'cjs'],
	nodeExternalsOptions: {
		// Force bundle pure ESM module
		exclude: ['is-svg'],
	},

	config: {
		plugins: [
			// Put the Codecov vite plugin after all other plugins
			codecovVitePlugin({
				enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
				bundleName: '@nextcloud/files',
				uploadToken: process.env.CODECOV_TOKEN,
			}),
		],
	},
})
