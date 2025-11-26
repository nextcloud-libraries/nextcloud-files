/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Folder, Node } from './node/index.ts'
import { View } from './navigation/index.ts'

type ActionContextSingle = {
	nodes: [Node],
	view: View,
	folder: Folder,
	content: Node[],
}

type ActionContext = {
	nodes: Node[],
	view: View,
	folder: Folder,
	content: Node[],
}

type ViewActionContext = {
	view: View,
	folder: Folder,
}
