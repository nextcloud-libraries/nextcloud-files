/*
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export * from './actions/index.ts'
export * from './fileListFilters.ts'
export * from './fileListHeaders.ts'
export * from './navigation/index.ts'
export * from './newMenu/index.ts'
export * from './node/index.ts'
export * from './permissions.ts'
export * from './sidebar/index.ts'
export * from './utils/index.ts'

// Legacy export of dav utils
// TODO: Remove with version 4 (breaking change)
export {
	type DavProperty,

	/**
	 * @inheritdoc
	 * @deprecated use `defaultRemoteURL` from `@nextcloud/files/dav`
	 */
	defaultRemoteURL as davRemoteURL,
	/**
	 * @inheritdoc
	 * @deprecated use `defaultRootPath` from `@nextcloud/files/dav`
	 */
	defaultRootPath as davRootPath,
	/**
	 * @inheritdoc
	 * @deprecated use `defaultDavNamespaces` from `@nextcloud/files/dav`
	 */
	defaultDavNamespaces,
	/**
	 * @inheritdoc
	 * @deprecated use `defaultDavProperties` from `@nextcloud/files/dav`
	 */
	defaultDavProperties,

	/**
	 * @inheritdoc
	 * @deprecated use `getFavoriteNodes` from `@nextcloud/files/dav`
	 */
	getFavoriteNodes,
	/**
	 * @inheritdoc
	 * @deprecated use `getClient` from `@nextcloud/files/dav`
	 */
	getClient as davGetClient,
	/**
	 * @inheritdoc
	 * @deprecated use `getRemoteURL` from `@nextcloud/files/dav`
	 */
	getRemoteURL as davGetRemoteURL,
	/**
	 * @inheritdoc
	 * @deprecated use `getRootPath` from `@nextcloud/files/dav`
	 */
	getRootPath as davGetRootPath,
	/**
	 * @inheritdoc
	 * @deprecated use `resultToNode` from `@nextcloud/files/dav`
	 */
	resultToNode as davResultToNode,
	/**
	 * @inheritdoc
	 * @deprecated use `getDefaultPropfind` from `@nextcloud/files/dav`
	 */
	getDefaultPropfind as davGetDefaultPropfind,
	/**
	 * @inheritdoc
	 * @deprecated use `getFavoritesReport` from `@nextcloud/files/dav`
	 */
	getFavoritesReport as davGetFavoritesReport,
	/**
	 * @inheritdoc
	 * @deprecated use `getRecentSearch` from `@nextcloud/files/dav`
	 */
	getRecentSearch as davGetRecentSearch,
	/**
	 * @inheritdoc
	 * @deprecated use `parsePermissions` from `@nextcloud/files/dav`
	 */
	parsePermissions as davParsePermissions,
	/**
	 * @inheritdoc
	 * @deprecated use `getDavNameSpaces` from `@nextcloud/files/dav`
	 */
	getDavNameSpaces,
	/**
	 * @inheritdoc
	 * @deprecated use `getDavProperties` from `@nextcloud/files/dav`
	 */
	getDavProperties,
	/**
	 * @inheritdoc
	 * @deprecated use `registerDavProperty` from `@nextcloud/files/dav`
	 */
	registerDavProperty,
} from './dav/index.ts'
