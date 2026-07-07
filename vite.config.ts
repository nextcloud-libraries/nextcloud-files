/**
 * SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: CC0-1.0
 */

import { createLibConfig } from '@nextcloud/vite-config'

export default createLibConfig({
	index: 'lib/index.ts',
	dav: 'lib/dav/index.ts',
	upload: 'lib/upload/index.ts',
})
