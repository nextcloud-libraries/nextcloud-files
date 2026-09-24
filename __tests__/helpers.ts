/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/**
 * Helpers shared by the unit tests.
 *
 * Instead of mocking modules, the tests set up the page state the Nextcloud server would provide
 * and only mock the network requests.
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'

import axios from '@nextcloud/axios'
import { AxiosError } from 'axios'
import { vi } from 'vitest'

declare global {
	interface Window {
		/** The web root of the server, used by `@nextcloud/router` */
		_oc_webroot?: string
		/** The cache of the parsed initial state, used by `@nextcloud/initial-state` */
		_nc_initial_state?: Map<string, unknown>
	}
}

/**
 * Set the initial state the server provides for the page.
 * `loadState` caches the parsed value, so the cache is invalidated to allow changing the state between tests.
 *
 * @param app - The app providing the state
 * @param key - The key of the state
 * @param value - The value of the state, `undefined` removes it
 */
export function setInitialState(app: string, key: string, value: unknown): void {
	const id = `initial-state-${app}-${key}`
	document.getElementById(id)?.remove()
	window._nc_initial_state?.delete(`#${id}`)

	if (value !== undefined) {
		const input = document.createElement('input')
		input.type = 'hidden'
		input.id = id
		input.value = btoa(JSON.stringify(value))
		document.head.appendChild(input)
	}
}

/**
 * Set the capabilities of the server.
 *
 * @param capabilities - The capabilities as provided by the server
 */
export function setCapabilities(capabilities: Record<string, unknown>): void {
	setInitialState('core', 'capabilities', capabilities)
}

/**
 * Mark the page as a public share - or as a regular page if no token is given.
 *
 * @param sharingToken - The token of the public share
 */
export function setPublicShare(sharingToken?: string): void {
	setInitialState('files_sharing', 'isPublic', sharingToken !== undefined)
	setInitialState('files_sharing', 'sharingToken', sharingToken)
}

/**
 * Mock all requests: no directory exists yet and every other request succeeds.
 * Tests adjust the mocked `axios.head` and `axios.request` for their scenario.
 */
export function mockRequests(): void {
	vi.spyOn(axios, 'head').mockRejectedValue(httpError(404))
	vi.spyOn(axios, 'request').mockResolvedValue({} as AxiosResponse)
}

/**
 * Create the error thrown by axios when the server responds with the given HTTP status.
 *
 * @param status - The HTTP status code
 */
export function httpError(status: number): AxiosError {
	return new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, undefined, undefined, { status } as AxiosResponse)
}

/**
 * Get the configuration of all mocked requests sent with the given method.
 *
 * @param method - The HTTP method
 */
export function requests(method: 'MKCOL' | 'MOVE' | 'PUT'): AxiosRequestConfig[] {
	return vi.mocked(axios.request).mock.calls
		.map(([config]) => config)
		.filter((config) => config.method === method)
}

/**
 * Get the URLs of all mocked requests sent with the given method.
 *
 * @param method - The HTTP method
 */
export function requestedUrls(method: 'HEAD' | 'MKCOL' | 'MOVE' | 'PUT'): string[] {
	if (method === 'HEAD') {
		return vi.mocked(axios.head).mock.calls.map(([url]) => url)
	}
	return requests(method).map((config) => config.url!)
}

/**
 * Create a file of the given size.
 *
 * @param size - The file size in bytes
 * @param name - The file name
 */
export function createFile(size: number, name = 'file.txt'): File {
	return new File([new ArrayBuffer(size)], name)
}

/**
 * Create a file with the given relative path, like the browser does for folder uploads.
 *
 * @param content - The file content
 * @param relativePath - The relative path of the file, e.g. 'subdir/file.txt'
 */
export function fileWithPath(content: string, relativePath: string): File {
	const file = new File([content], relativePath.split('/').at(-1)!)
	// webkitRelativePath is a read-only prototype getter, so it is shadowed with an own property
	Object.defineProperty(file, 'webkitRelativePath', { value: relativePath })
	return file
}
