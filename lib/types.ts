/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Folder, Node } from './node/index.ts'
import { View } from './navigation/index.ts'

export type ActionContextSingle = {
	nodes: [Node],
	view: View,
	folder: Folder,
	contents: Node[],
}

export type ActionContext = {
	nodes: Node[],
	view: View,
	folder: Folder,
	contents: Node[],
}

export type ViewActionContext = {
	view: View,
	folder: Folder,
	contents: Node[],
}
