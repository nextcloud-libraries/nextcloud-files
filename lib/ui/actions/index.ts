/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type { IFileAction, IHotkeyConfig } from './fileAction.ts'
export type { IFileListAction } from './fileListAction.ts'

export { DefaultType, getFileActions, registerFileAction } from './fileAction.ts'
export { getFileListActions, registerFileListAction } from './fileListAction.ts'
