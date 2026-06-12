/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { configureNextcloud, startNextcloud, stopNextcloud, waitOnNextcloud } from '@nextcloud/e2e-test-server/docker'

export async function setup(project) {
	// Start the Nextcloud docker container
	const ip = await start()
	await waitOnNextcloud(ip)
	await configureNextcloud(['end_to_end_encryption'])

	project.provide('ip', ip)

	return stop
}

async function start() {
	const branch = process.env.BRANCH || 'master'

	return await startNextcloud(branch, true, {
		exposePort: 8089,
	})
}

async function stop() {
	process.stderr.write('Stopping Nextcloud server…\n')
	await stopNextcloud()
	process.exit(0)
}
