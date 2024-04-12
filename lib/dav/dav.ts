/**
 * @copyright Copyright (c) 2023 John Molakvoæ <skjnldsv@protonmail.com>
 *
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 * @author Ferdinand Thiessen <opensource@fthiessen.de>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import type { DAVResultResponseProps, FileStat, ResponseDataDetailed, WebDAVClient } from 'webdav'
import type { Node } from '../files/node'

import { File } from '../files/file'
import { Folder } from '../files/folder'
import { NodeData } from '../files/nodeData'
import { davParsePermissions } from './davPermissions'
import { davGetFavoritesReport } from './davProperties'

import { getCurrentUser, getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'
import { generateRemoteUrl } from '@nextcloud/router'
import { createClient, getPatcher } from 'webdav'
import { CancelablePromise } from 'cancelable-promise'

/**
 * Nextcloud DAV result response
 */
interface ResponseProps extends DAVResultResponseProps {
	permissions: string
	mime: string
	fileid: number
	size: number
	'owner-id': string | number
}

/**
 * The DAV root path for the current user
 */
export const davRootPath = `/files/${getCurrentUser()?.uid}`

/**
 * The DAV remote URL used as base URL for the WebDAV client
 */
export const davRemoteURL = generateRemoteUrl('dav')

/**
 * Get a WebDAV client configured to include the Nextcloud request token
 *
 * @param remoteURL The DAV server remote URL
 * @param headers Optional additional headers to set for every request
 */
export const davGetClient = function(remoteURL = davRemoteURL, headers: Record<string, string> = {}) {
	const client = createClient(remoteURL, { headers })

	/**
	 * Set headers for DAV requests
	 * @param token CSRF token
	 */
	function setHeaders(token: string | null) {
		client.setHeaders({
			...headers,
			// Add this so the server knows it is an request from the browser
			'X-Requested-With': 'XMLHttpRequest',
			// Inject user auth
			requesttoken: token ?? '',
		})
	}

	// refresh headers when request token changes
	onRequestTokenUpdate(setHeaders)
	setHeaders(getRequestToken())

	/**
	 * Allow to override the METHOD to support dav REPORT
	 *
	 * @see https://github.com/perry-mitchell/webdav-client/blob/8d9694613c978ce7404e26a401c39a41f125f87f/source/request.ts
	 */
	const patcher = getPatcher()
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	// https://github.com/perry-mitchell/hot-patcher/issues/6
	patcher.patch('fetch', (url: string, options: RequestInit): Promise<Response> => {
		const headers = options.headers as Record<string, string>
		if (headers?.method) {
			options.method = headers.method
			delete headers.method
		}
		return fetch(url, options)
	})

	return client
}

/**
 * Use WebDAV to query for favorite Nodes
 *
 * @param davClient The WebDAV client to use for performing the request
 * @param path Base path for the favorites, if unset all favorites are queried
 * @param davRoot The root path for the DAV user (defaults to `davRootPath`)
 * @example
 * ```js
 * import { davGetClient, davRootPath, getFavoriteNodes } from '@nextcloud/files'
 *
 * const client = davGetClient()
 * // query favorites for the root
 * const favorites = await getFavoriteNodes(client)
 * // which is the same as writing:
 * const favorites = await getFavoriteNodes(client, '/', davRootPath)
 * ```
 */
export const getFavoriteNodes = (davClient: WebDAVClient, path = '/', davRoot = davRootPath): CancelablePromise<Node[]> => {
	const controller = new AbortController()
	return new CancelablePromise(async (resolve, reject, onCancel) => {
		onCancel(() => controller.abort())
		try {
			const contentsResponse = await davClient.getDirectoryContents(`${davRoot}${path}`, {
				signal: controller.signal,
				details: true,
				data: davGetFavoritesReport(),
				headers: {
					// see davGetClient for patched webdav client
					method: 'REPORT',
				},
				includeSelf: true,
			}) as ResponseDataDetailed<FileStat[]>

			const nodes = contentsResponse.data
				.filter(node => node.filename !== path) // exclude current dir
				.map((result) => davResultToNode(result, davRoot))
			resolve(nodes)
		} catch (error) {
			reject(error)
		}
	})
}

/**
 * Covert DAV result `FileStat` to `Node`
 *
 * @param node The DAV result
 * @param filesRoot The DAV files root path
 * @param remoteURL The DAV server remote URL (same as on `davGetClient`)
 */
export const davResultToNode = function(node: FileStat, filesRoot = davRootPath, remoteURL = davRemoteURL): Node {
	const userId = getCurrentUser()?.uid
	if (!userId) {
		throw new Error('No user id found')
	}

	const props = node.props as ResponseProps
	const permissions = davParsePermissions(props?.permissions)
	const owner = (props?.['owner-id'] || userId).toString()

	const nodeData: NodeData = {
		id: props?.fileid || 0,
		source: `${remoteURL}${node.filename}`,
		mtime: new Date(Date.parse(node.lastmod)),
		mime: node.mime || 'application/octet-stream',
		size: props?.size || Number.parseInt(props.getcontentlength || '0'),
		permissions,
		owner,
		root: filesRoot,
		attributes: {
			...node,
			...props,
			hasPreview: props?.['has-preview'],
		},
	}

	delete nodeData.attributes?.props

	return node.type === 'file' ? new File(nodeData) : new Folder(nodeData)
}
