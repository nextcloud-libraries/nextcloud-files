/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type PQueue from 'p-queue'

import { describe, expect, it } from 'vitest'
import { Upload } from './Upload.ts'

class TestUpload extends Upload {
	public source: string = '/destination/file.txt'

	constructor() {
		super({})
	}

	public async start(queue: PQueue): Promise<void> {
		queue.add(() => Promise.resolve())
	}
}

describe('Upload', () => {
	it('cancels an upload', () => {
		const a = new TestUpload()
		expect(a.signal.aborted).toBe(false)
		a.cancel()
		expect(a.signal.aborted).toBe(true)
	})

	it('rebases an upload', () => {
		const a = new TestUpload()
		a.rebase('/other/renamed.txt')
		expect(a.source).toBe('/other/renamed.txt')
	})
})
