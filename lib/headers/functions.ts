/*
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Header } from './listHeaders.ts'

import logger from '../utils/logger.ts'

/**
 * Register a new file list header.
 *
 * @param header - The header to register
 */
export function registerFileListHeaders(header: Header): void {
	if (typeof window._nc_filelistheader === 'undefined') {
		window._nc_filelistheader = []
		logger.debug('FileListHeaders initialized')
	}

	// Check duplicates
	if (window._nc_filelistheader.find((search) => search.id === header.id)) {
		logger.error(`Header ${header.id} already registered`, { header })
		return
	}

	window._nc_filelistheader.push(header)
}

/**
 * Get all currently registered file list headers.
 */
export function getFileListHeaders(): Header[] {
	if (typeof window._nc_filelistheader === 'undefined') {
		window._nc_filelistheader = []
		logger.debug('FileListHeaders initialized')
	}

	return window._nc_filelistheader
}
