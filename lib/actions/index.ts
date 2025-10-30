/*
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type { FileActionData, IHotkeyConfig } from './fileAction.ts'

export { FileAction, getFileActions, registerFileAction, DefaultType } from './fileAction.ts'
export { getFileListActions, registerFileListAction, FileListAction } from './fileListAction.ts'
