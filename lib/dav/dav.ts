/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { DAVResultResponseProps, FileStat, ResponseDataDetailed, WebDAVClient } from 'webdav'
import type { Node } from '../files/node'

import { File } from '../files/file'
import { Folder } from '../files/folder'
import { NodeStatus } from '../files/node'
import { NodeData } from '../files/nodeData'
import { parsePermissions } from './davPermissions'
import { getFavoritesReport } from './davProperties'

import { CancelablePromise } from 'cancelable-promise'
import { createClient, getPatcher } from 'webdav'
import { generateRemoteUrl } from '@nextcloud/router'
import { getCurrentUser, getRequestToken, onRequestTokenUpdate } from '@nextcloud/auth'
import { getSharingToken, isPublicShare } from '@nextcloud/sharing/public'

/**
 * Nextcloud DAV result response
 */
interface ResponseProps extends DAVResultResponseProps {
	creationdate: string
	permissions: string
	mime: string
	fileid: number
	size: number
	'owner-id': string | number
}

/**
 * Get the DAV root path for the current user or public share
 */
export function getRootPath(): string {
	if (isPublicShare()) {
		return `/files/${getSharingToken()}`
	}
	return `/files/${getCurrentUser()?.uid}`
}

/**
 * The DAV root path for the current user
 * This is a cached version of `getRemoteURL`
 */
export const defaultRootPath = getRootPath()

/**
 * Get the DAV remote URL used as base URL for the WebDAV client
 * It also handles public shares
 */
export function getRemoteURL(): string {
	const url = generateRemoteUrl('dav')
	if (isPublicShare()) {
		return url.replace('remote.php', 'public.php')
	}
	return url
}

/**
 * The DAV remote URL used as base URL for the WebDAV client
 * This is a cached version of `getRemoteURL`
 */
export const defaultRemoteURL = getRemoteURL()

/**
 * Get a WebDAV client configured to include the Nextcloud request token
 *
 * @param remoteURL The DAV server remote URL
 * @param headers Optional additional headers to set for every request
 */
export const getClient = function(remoteURL = defaultRemoteURL, headers: Record<string, string> = {}) {
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
 * @param davRoot The root path for the DAV user (defaults to `defaultRootPath`)
 * @example
 * ```js
 * import { getClient, defaultRootPath, getFavoriteNodes } from '@nextcloud/files'
 *
 * const client = getClient()
 * // query favorites for the root
 * const favorites = await getFavoriteNodes(client)
 * // which is the same as writing:
 * const favorites = await getFavoriteNodes(client, '/', defaultRootPath)
 * ```
 */
export const getFavoriteNodes = (davClient: WebDAVClient, path = '/', davRoot = defaultRootPath): CancelablePromise<Node[]> => {
	const controller = new AbortController()
	return new CancelablePromise(async (resolve, reject, onCancel) => {
		onCancel(() => controller.abort())
		try {
			const contentsResponse = await davClient.getDirectoryContents(`${davRoot}${path}`, {
				signal: controller.signal,
				details: true,
				data: getFavoritesReport(),
				headers: {
					// see getClient for patched webdav client
					method: 'REPORT',
				},
				includeSelf: true,
			}) as ResponseDataDetailed<FileStat[]>

			const nodes = contentsResponse.data
				.filter(node => node.filename !== path) // exclude current dir
				.map((result) => resultToNode(result, davRoot))
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
 * @param remoteURL The DAV server remote URL (same as on `getClient`)
 */
export const resultToNode = function(node: FileStat, filesRoot = defaultRootPath, remoteURL = defaultRemoteURL): Node {
	let userId = getCurrentUser()?.uid
	if (isPublicShare()) {
		userId = userId ?? 'anonymous'
	} else if (!userId) {
		throw new Error('No user id found')
	}

	const props = node.props as ResponseProps
	const permissions = parsePermissions(props?.permissions)
	const owner = String(props?.['owner-id'] || userId)
	const id = props.fileid || 0

	const mtime = new Date(Date.parse(node.lastmod))
	const crtime = new Date(Date.parse(props.creationdate))

	const nodeData: NodeData = {
		id,
		source: `${remoteURL}${node.filename}`,
		mtime: !isNaN(mtime.getTime()) && mtime.getTime() !== 0 ? mtime : undefined,
		crtime: !isNaN(crtime.getTime()) && crtime.getTime() !== 0 ? crtime : undefined,
		mime: node.mime || 'application/octet-stream',
		// Manually cast to work around for https://github.com/perry-mitchell/webdav-client/pull/380
		displayname: props.displayname !== undefined ? String(props.displayname) : undefined,
		size: props?.size || Number.parseInt(props.getcontentlength || '0'),
		// The fileid is set to -1 for failed requests
		status: id < 0 ? NodeStatus.FAILED : undefined,
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

	return (node.type === 'file' ? new File(nodeData) : new Folder(nodeData)) as Node
}
