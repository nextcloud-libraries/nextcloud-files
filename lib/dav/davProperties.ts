/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { getCurrentUser } from '@nextcloud/auth'
import logger from '../utils/logger'

export type DavProperty = { [key: string]: string }

export const defaultDavProperties = [
	'd:getcontentlength',
	'd:getcontenttype',
	'd:getetag',
	'd:getlastmodified',
	'd:creationdate',
	'd:displayname',
	'd:quota-available-bytes',
	'd:resourcetype',
	'nc:has-preview',
	'nc:is-encrypted',
	'nc:mount-type',
	'oc:comments-unread',
	'oc:favorite',
	'oc:fileid',
	'oc:owner-display-name',
	'oc:owner-id',
	'oc:permissions',
	'oc:size',
]

export const defaultDavNamespaces = {
	d: 'DAV:',
	nc: 'http://nextcloud.org/ns',
	oc: 'http://owncloud.org/ns',
	ocs: 'http://open-collaboration-services.org/ns',
}

/**
 * Register custom DAV properties
 *
 * Can be used if your app introduces custom DAV properties, so e.g. the files app can make use of it.
 *
 * @param prop The property
 * @param namespace The namespace of the property
 */
export const registerDavProperty = function(prop: string, namespace: DavProperty = { nc: 'http://nextcloud.org/ns' }): boolean {
	if (typeof window._nc_dav_properties === 'undefined') {
		window._nc_dav_properties = [...defaultDavProperties]
		window._nc_dav_namespaces = { ...defaultDavNamespaces }
	}

	const namespaces = { ...window._nc_dav_namespaces, ...namespace }

	// Check duplicates
	if (window._nc_dav_properties.find((search) => search === prop)) {
		logger.warn(`${prop} already registered`, { prop })
		return false
	}

	if (prop.startsWith('<') || prop.split(':').length !== 2) {
		logger.error(`${prop} is not valid. See example: 'oc:fileid'`, { prop })
		return false
	}

	const ns = prop.split(':')[0]
	if (!namespaces[ns]) {
		logger.error(`${prop} namespace unknown`, { prop, namespaces })
		return false
	}

	window._nc_dav_properties.push(prop)
	window._nc_dav_namespaces = namespaces
	return true
}

/**
 * Get the registered dav properties
 */
export const getDavProperties = function(): string {
	if (typeof window._nc_dav_properties === 'undefined') {
		window._nc_dav_properties = [...defaultDavProperties]
	}

	return window._nc_dav_properties.map((prop) => `<${prop} />`).join(' ')
}

/**
 * Get the registered dav namespaces
 */
export const getDavNameSpaces = function(): string {
	if (typeof window._nc_dav_namespaces === 'undefined') {
		window._nc_dav_namespaces = { ...defaultDavNamespaces }
	}

	return Object.keys(window._nc_dav_namespaces)
		.map((ns) => `xmlns:${ns}="${window._nc_dav_namespaces?.[ns]}"`)
		.join(' ')
}

/**
 * Get the default PROPFIND request body
 */
export const davGetDefaultPropfind = function(): string {
	return `<?xml version="1.0"?>
		<d:propfind ${getDavNameSpaces()}>
			<d:prop>
				${getDavProperties()}
			</d:prop>
		</d:propfind>`
}

/**
 * Get the REPORT body to filter for favorite nodes
 */
export const davGetFavoritesReport = function(): string {
	return `<?xml version="1.0"?>
		<oc:filter-files ${getDavNameSpaces()}>
			<d:prop>
				${getDavProperties()}
			</d:prop>
			<oc:filter-rules>
				<oc:favorite>1</oc:favorite>
			</oc:filter-rules>
		</oc:filter-files>`
}

/**
 * Get the SEARCH body to search for recently modified files
 *
 * @param lastModified Oldest timestamp to include (Unix timestamp)
 * @example
 * ```ts
 * // SEARCH for recent files need a different DAV endpoint
 * const client = davGetClient(generateRemoteUrl('dav'))
 * // Timestamp of last week
 * const lastWeek = Math.round(Date.now() / 1000) - (60 * 60 * 24 * 7)
 * const contentsResponse = await client.getDirectoryContents(path, {
 *     details: true,
 *     data: davGetRecentSearch(lastWeek),
 *     headers: {
 *         method: 'SEARCH',
 *         'Content-Type': 'application/xml; charset=utf-8',
 *     },
 *     deep: true,
 * }) as ResponseDataDetailed<FileStat[]>
 * ```
 */
export const davGetRecentSearch = function(lastModified: number): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<d:searchrequest ${getDavNameSpaces()}
	xmlns:ns="https://github.com/icewind1991/SearchDAV/ns">
	<d:basicsearch>
		<d:select>
			<d:prop>
				${getDavProperties()}
			</d:prop>
		</d:select>
		<d:from>
			<d:scope>
				<d:href>/files/${getCurrentUser()?.uid}/</d:href>
				<d:depth>infinity</d:depth>
			</d:scope>
		</d:from>
		<d:where>
			<d:and>
				<d:or>
					<d:not>
						<d:eq>
							<d:prop>
								<d:getcontenttype/>
							</d:prop>
							<d:literal>httpd/unix-directory</d:literal>
						</d:eq>
					</d:not>
					<d:eq>
						<d:prop>
							<oc:size/>
						</d:prop>
						<d:literal>0</d:literal>
					</d:eq>
				</d:or>
				<d:gt>
					<d:prop>
						<d:getlastmodified/>
					</d:prop>
					<d:literal>${lastModified}</d:literal>
				</d:gt>
			</d:and>
		</d:where>
		<d:orderby>
			<d:order>
				<d:prop>
					<d:getlastmodified/>
				</d:prop>
				<d:descending/>
			</d:order>
		</d:orderby>
		<d:limit>
			<d:nresults>100</d:nresults>
			<ns:firstresult>0</ns:firstresult>
		</d:limit>
	</d:basicsearch>
</d:searchrequest>`
}
