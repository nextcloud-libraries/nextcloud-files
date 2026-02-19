/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getCapabilities } from '@nextcloud/capabilities'

/**
 * Get the maximum number of parallel uploads based on the server configuration.
 */
export function getMaxParallelUploads(): number {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const capabilities = getCapabilities() as Record<string, any>
	return capabilities.files?.chunked_upload?.max_parallel_count ?? 5
}

/**
 * Checks if the server supports chunking for public shares.
 */
export function supportsPublicChunking(): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (getCapabilities() as Record<string, any>).dav?.public_shares_chunking ?? false
}

/**
 * Get the maximum chunk size for chunked uploads based on the server configuration and file size.
 *
 * @param fileSize - The size of the file to be uploaded. If not provided, the function will return the default chunk size.
 */
export function getMaxChunksSize(fileSize: number | undefined = undefined): number {
	const maxChunkSize = window.OC?.appConfig?.files?.max_chunk_size
	if (maxChunkSize <= 0) {
		return 0
	}

	// If invalid return default
	if (!Number(maxChunkSize)) {
		return 10 * 1024 * 1024
	}

	// v2 of chunked upload requires chunks to be 5 MB at minimum
	const minimumChunkSize = Math.max(Number(maxChunkSize), 5 * 1024 * 1024)

	if (fileSize === undefined) {
		return minimumChunkSize
	}

	// Adapt chunk size to fit the file in 10000 chunks for chunked upload v2
	return Math.max(minimumChunkSize, Math.ceil(fileSize / 10000))
}
