/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { join } from '@nextcloud/paths'
import { expect, test } from 'vitest'
import { defaultRemoteURL, defaultRootPath } from '../dav/dav.ts'
import { scopedGlobals } from '../globalScope.ts'
import { Folder } from '../node/folder.ts'
import { getUploader } from './getUploader.ts'
import { Uploader } from './uploader/Uploader.ts'

test('getUploader - should return the uploader instance from the global scope', async () => {
	const uploader = new Uploader(false, new Folder({ owner: 'test', root: defaultRootPath, source: join(defaultRemoteURL, defaultRootPath) }))
	scopedGlobals.uploader = uploader
	const returnedUploader = getUploader()
	expect(returnedUploader).toBe(uploader)
})

test('getUploader - should return the same instance on multiple calls', async () => {
	const uploader1 = getUploader()
	const uploader2 = getUploader()
	expect(uploader1).toBe(uploader2)
})

test('getUploader - should not return the same instance on multiple calls with forceRecreate', async () => {
	const uploader1 = getUploader(true)
	const uploader2 = getUploader(true, true)
	expect(uploader1).not.toBe(uploader2)
})
