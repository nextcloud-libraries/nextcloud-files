/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AxiosError, AxiosProgressEvent, AxiosResponse } from 'axios'

import { getCurrentUser } from '@nextcloud/auth'
import axios from '@nextcloud/axios'
import { generateRemoteUrl, getBaseUrl } from '@nextcloud/router'
import { getSharingToken } from '@nextcloud/sharing/public'
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry'
import logger from '../../utils/logger.ts'

axiosRetry(axios, { retries: 0 })

type UploadData = Blob | (() => Promise<Blob>)

interface UploadDataOptions {
	/** The abort signal */
	signal: AbortSignal
	/** Upload progress event callback */
	onUploadProgress?: (event: AxiosProgressEvent) => void
	/** Request retry callback (e.g. network error of previous try) */
	onUploadRetry?: () => void
	/** The final destination file (for chunked uploads) */
	destinationFile?: string
	/** Additional headers */
	headers?: Record<string, string | number>
	/** Number of retries */
	retries?: number
}

/**
 * Upload some data to a given path
 *
 * @param url the url to upload to
 * @param uploadData the data to upload
 * @param uploadOptions upload options
 */
export async function uploadData(
	url: string,
	uploadData: UploadData,
	uploadOptions: UploadDataOptions,
): Promise<AxiosResponse> {
	const options = {
		headers: {},
		onUploadProgress: () => {},
		onUploadRetry: () => {},
		retries: 5,
		...uploadOptions,
	}

	let data: Blob

	// If the upload data is a blob, we can directly use it
	// Otherwise, we need to wait for the promise to resolve
	if (uploadData instanceof Blob) {
		data = uploadData
	} else {
		data = await uploadData()
	}

	// Helps the server to know what to do with the file afterwards (e.g. chunked upload)
	if (options.destinationFile) {
		options.headers.Destination = options.destinationFile
	}

	// If no content type is set, we default to octet-stream
	if (!options.headers['Content-Type']) {
		options.headers['Content-Type'] = 'application/octet-stream'
	}

	return await axios.request({
		method: 'PUT',
		url,
		data,
		signal: options.signal,
		onUploadProgress: options.onUploadProgress,
		headers: options.headers,
		'axios-retry': {
			retries: options.retries,
			retryDelay: (retryCount: number, error: AxiosError) => exponentialDelay(retryCount, error, 1000),
			retryCondition(error: AxiosError): boolean {
				// Do not retry on insufficient storage - this is permanent
				if (error.status === 507) {
					return false
				}
				// Do a retry on locked error as this is often just some preview generation
				if (error.status === 423) {
					return true
				}
				// Otherwise fallback to default behavior
				return isNetworkOrIdempotentRequestError(error)
			},
			onRetry: options.onUploadRetry,
		},
	})
}

/**
 * Get chunk of the file.
 * Doing this on the fly give us a big performance boost and proper garbage collection
 *
 * @param file File to upload
 * @param start Offset to start upload
 * @param length Size of chunk to upload
 */
export function getChunk(file: File, start: number, length: number): Promise<Blob> {
	if (start === 0 && file.size <= length) {
		return Promise.resolve(new Blob([file], { type: file.type || 'application/octet-stream' }))
	}

	return Promise.resolve(new Blob([file.slice(start, start + length)], { type: 'application/octet-stream' }))
}

/**
 * Create a temporary upload workspace to upload the chunks to
 *
 * @param destinationFile The file name after finishing the chunked upload
 * @param retries number of retries
 * @param isPublic whether this upload is in a public share or not
 * @param customHeaders Custom HTTP headers used when creating the workspace (e.g. X-NC-Nickname for file drops)
 */
export async function initChunkWorkspace(destinationFile: string | undefined = undefined, retries: number = 5, isPublic: boolean = false, customHeaders: Record<string, string> = {}): Promise<string> {
	let chunksWorkspace: string
	if (isPublic) {
		chunksWorkspace = `${getBaseUrl()}/public.php/dav/uploads/${getSharingToken()}`
	} else {
		chunksWorkspace = generateRemoteUrl(`dav/uploads/${getCurrentUser()?.uid}`)
	}

	const hash = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
	const tempWorkspace = `web-file-upload-${hash}`
	const url = `${chunksWorkspace}/${tempWorkspace}`
	const headers = customHeaders
	if (destinationFile) {
		headers.Destination = destinationFile
	}

	await axios.request({
		method: 'MKCOL',
		url,
		headers,
		'axios-retry': {
			retries,
			retryDelay: (retryCount: number, error: AxiosError) => exponentialDelay(retryCount, error, 1000),
		},
	})

	logger.debug('Created temporary upload workspace', { url })

	return url
}
