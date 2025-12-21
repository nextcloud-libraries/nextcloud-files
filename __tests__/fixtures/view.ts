/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Folder, View } from '../../lib/index.ts'

/**
 * Creates a mock View and its associated Folder for testing purposes.
 */
export function mockView() {
	const folder = new Folder({
		source: 'https://example.org/dav/files/admin/',
		root: '/files/admin',
		owner: 'admin',
	})

	const view = new View({
		id: 'test',
		name: 'Test',
		caption: 'Test caption',
		emptyTitle: 'Test empty title',
		emptyCaption: 'Test empty caption',
		getContents: () => Promise.resolve({ folder, contents: [] }),
		hidden: true,
		icon: '<svg></svg>',
		order: 1,
		params: {},
		columns: [],
		emptyView: () => {},
		parent: 'parent',
		sticky: false,
		expanded: false,
		defaultSortKey: 'key',
		loadChildViews: async () => {},
	})

	return { folder, view }
}
