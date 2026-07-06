/**
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { playwright } from '@vitest/browser-playwright'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		env: {
			LANG: 'en-US',
		},
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			instances: [
				{
					name: 'unit',
					browser: 'chromium',
					screenshotFailures: false,
					exclude: ['**/*.e2e.spec.ts', '**/node_modules/**', '**/.git/**'],
				},
				{
					name: 'integration',
					browser: 'chromium',
					screenshotFailures: false,
					include: ['**/*.e2e.spec.ts'],
					globalSetup: '__tests__/start-nextcloud-server.js',
				},
			],
		},
		coverage: {
			include: ['lib/**'],
			exclude: ['lib/utils/logger.ts'],
			provider: 'istanbul',
			reporter: ['lcov', 'text'],
		},
		globalSetup: '__tests__/test-global-setup.ts',
	},
	resolve: {
		alias: {
			'~': resolve(__dirname, 'lib'),
		},
	},
	server: {
		proxy: {
			'/nextcloud': {
				target: 'http://localhost:8089',
				changeOrigin: true,
				configure(proxy) {
					// rewrite destination header to remove /nextcloud prefix, otherwise the MOVE request will fail
					proxy.on('proxyReq', (proxyReq) => {
						const header = proxyReq.getHeader('Destination')
						if (header) {
							proxyReq.removeHeader('Destination')
							proxyReq.setHeader('Destination', header.toString().replace(/\/nextcloud\/remote\.php/, '/remote.php'))
						}
					})
				},
				rewrite: (path) => path.replace(/^\/nextcloud/, ''),
				auth: 'admin:admin',
			},
		},
	},
})
