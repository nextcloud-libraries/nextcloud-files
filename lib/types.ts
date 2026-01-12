/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IView } from './navigation/index.ts'
import type { IFolder, INode } from './node/index.ts'

export type ActionContextSingle = {
	nodes: [INode]
	view: IView
	folder: IFolder
	contents: INode[]
}

export type ActionContext = {
	nodes: INode[]
	view: IView
	folder: IFolder
	contents: INode[]
}

export type ViewActionContext = {
	view: IView
	folder: IFolder
	contents: INode[]
}
