/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { IFileAction, IFileListAction } from './actions/index.ts'
import type { IFileListFilter } from './filters/index.ts'
import type { IFileListHeader } from './headers/index.ts'

import { TypedEventTarget } from 'typescript-event-target'
import { scopedGlobals } from './globalScope.ts'

interface FilesRegistryEvents {
	'register:action': RegistrationEvent<IFileAction>
	'register:listAction': RegistrationEvent<IFileListAction>
	'register:listFilter': RegistrationEvent<IFileListFilter>
	'register:listHeader': RegistrationEvent<IFileListHeader>
	'unregister:listFilter': UnregisterEvent
}

/**
 * Custom event for registry events.
 * The detail is the registered item.
 */
class RegistrationEvent<T> extends CustomEvent<T> {}

/**
 * Custom event for unregistering items from the registry.
 * The detail is the id of the unregistered item.
 */
class UnregisterEvent extends RegistrationEvent<string> {}

/**
 * The registry for files app.
 * This is used to keep track of registered actions, filters, headers, etc. and to emit events when new items are registered.
 * Allowing to keep a reactive state of the registered items in the UI without being coupled to one specific reactivity framework.
 *
 * This is an internal implementation detail and should not be used directly.
 *
 * @internal
 * @see PublicFilesRegistry - for the public API to listen to registry events.
 */
export class FilesRegistry extends TypedEventTarget<FilesRegistryEvents> {}

/**
 * The registry for files app.
 * This is used to keep track of registered actions, filters, headers, etc. and to emit events when new items are registered.
 * Allowing to keep a reactive state of the registered items in the UI without being coupled to one specific reactivity framework.
 */
export type PublicFilesRegistry = Pick<FilesRegistry, 'addEventListener' | 'removeEventListener'>

/**
 * Get the global files registry.
 *
 * @internal
 */
export function getRegistry() {
	scopedGlobals.registry ??= new FilesRegistry()
	return scopedGlobals.registry
}

/**
 * Get the global files registry.
 *
 * This allows to listen for new registrations of actions, filters, headers, etc.
 * Events are dispatched by the respective registration functions.
 */
export function getFilesRegistry(): PublicFilesRegistry {
	return getRegistry()
}
