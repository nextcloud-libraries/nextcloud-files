/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileAction, IFileListAction } from './actions/index.ts'
import type { IFileListFilter } from './filters/index.ts'
import type { IFileListHeader } from './headers/index.ts'

import { TypedEventTarget } from 'typescript-event-target'

interface FilesRegistryEvents {
	'register:action': CustomEvent<IFileAction>
	'register:listAction': CustomEvent<IFileListAction>
	'register:listFilter': CustomEvent<IFileListFilter>
	'unregister:listFilter': CustomEvent<IFileListFilter>
	'register:listHeader': CustomEvent<IFileListHeader>
}

export class FilesRegistryV4 extends TypedEventTarget<FilesRegistryEvents> {}

export type PublicFilesRegistry = Pick<FilesRegistryV4, 'addEventListener' | 'removeEventListener'>

/**
 * Get the global files registry
 *
 * @internal
 */
export function getRegistry() {
	window._nc_files_registry_v4 ??= new FilesRegistryV4()
	return window._nc_files_registry_v4
}

/**
 * Get the global files registry
 *
 * This allows to listen for new registrations of actions, filters, headers, etc.
 * Events are dispatched by the respective registration functions.
 */
export function getFilesRegistry(): PublicFilesRegistry {
	return getRegistry()
}
