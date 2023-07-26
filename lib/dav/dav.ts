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
import type { DAVResultResponseProps, FileStat, Response, ResponseDataDetailed, WebDAVClient } from 'webdav'
import type { Node } from '../files/node'

import { File } from '../files/file'
import { Folder } from '../files/folder'
import { NodeData } from '../files/nodeData'
import { davParsePermissions } from './davPermissions'
import { davGetDefaultPropfind, davGetFavoritesReport } from './davProperties'

import { getCurrentUser, getRequestToken } from '@nextcloud/auth'
import { generateRemoteUrl } from '@nextcloud/router'
import { createClient, getPatcher, RequestOptions } from 'webdav'
import { request } from 'webdav/dist/node/request.js'

/**
 * Nextcloud DAV result response
 */
interface ResponseProps extends DAVResultResponseProps {
	permissions: string
	fileid: number
	size: number
}

export const davRootPath = `/files/${getCurrentUser()?.uid}`
export const davDefaultRootUrl = generateRemoteUrl('dav' + davRootPath)

/**
 * Get a WebDAV client configured to include the Nextcloud request token
 *
 * @param davURL The DAV root URL
 */
export const davGetClient = function(davURL = davDefaultRootUrl) {
	const client = createClient(davURL, {
		headers: {
			requesttoken: getRequestToken() || '',
		},
	})

	/**
	 * Allow to override the METHOD to support dav REPORT
	 *
	 * @see https://github.com/perry-mitchell/webdav-client/blob/8d9694613c978ce7404e26a401c39a41f125f87f/source/request.ts
	 */
	const patcher = getPatcher()
	// https://github.com/perry-mitchell/hot-patcher/issues/6
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	patcher.patch('request', (options: RequestOptions): Promise<Response> => {
		if (options.headers?.method) {
			options.method = options.headers.method
			delete options.headers.method
		}
		return request(options)
	})
	return client
}

/**
 * Use WebDAV to query for favorite Nodes
 *
 * @param davClient The WebDAV client to use for performing the request
 * @param path Base path for the favorites, if unset all favorites are queried
 */
export const getFavoriteNodes = async (davClient: WebDAVClient, path = '/') => {
	const contentsResponse = await davClient.getDirectoryContents(path, {
		details: true,
		// Only filter favorites if we're at the root
		data: path === '/' ? davGetFavoritesReport() : davGetDefaultPropfind(),
		headers: {
			// Patched in WebdavClient.ts
			method: path === '/' ? 'REPORT' : 'PROPFIND',
		},
		includeSelf: true,
	}) as ResponseDataDetailed<FileStat[]>

	return contentsResponse.data.filter(node => node.filename !== path).map((result) => davResultToNode(result))
}

/**
 * Covert DAV result `FileStat` to `Node`
 *
 * @param node The DAV result
 * @param davRoot The DAV root path
 */
export const davResultToNode = function(node: FileStat, davRoot = davRootPath): Node {
	const props = node.props as ResponseProps
	const permissions = davParsePermissions(props?.permissions)
	const owner = getCurrentUser()?.uid as string

	const nodeData: NodeData = {
		id: (props?.fileid as number) || 0,
		source: generateRemoteUrl(`dav${davRoot}${node.filename}`),
		mtime: new Date(Date.parse(node.lastmod)),
		mime: node.mime as string,
		size: (props?.size as number) || 0,
		permissions,
		owner,
		root: davRoot,
		attributes: {
			...node,
			...props,
			hasPreview: props?.['has-preview'],
		},
	}

	delete nodeData.attributes?.props

	return node.type === 'file' ? new File(nodeData) : new Folder(nodeData)
}
