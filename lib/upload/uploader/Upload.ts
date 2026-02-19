/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type PQueue from 'p-queue'

import { TypedEventTarget } from 'typescript-event-target'

export const UploadStatus = Object.freeze({
	/** The upload was initialized */
	INITIALIZED: 0,
	/** The upload was scheduled but is not yet uploading */
	SCHEDULED: 1,
	/** The upload itself is running */
	UPLOADING: 2,
	/** Chunks are being assembled */
	ASSEMBLING: 3,
	/** The upload finished successfully */
	FINISHED: 4,
	/** The upload was cancelled by the user */
	CANCELLED: 5,
	/** The upload failed */
	FAILED: 6,
})

export type TUploadStatus = typeof UploadStatus[keyof typeof UploadStatus]

interface UploadEvents {
	finished: CustomEvent<IUpload>
	progress: CustomEvent<IUpload>
}

export interface IUpload extends TypedEventTarget<UploadEvents> {
	/**
	 * The source of the upload
	 */
	readonly source: string
	/**
	 * Whether the upload is chunked or not
	 */
	readonly isChunked: boolean
	/**
	 * The total size of the upload in bytes
	 */
	readonly totalBytes: number
	/**
	 * Timestamp of when the upload started.
	 * Will return `undefined` if the upload has not started yet.
	 */
	readonly startTime?: number
	/**
	 * The number of bytes that have been uploaded so far
	 */
	readonly uploadedBytes: number
	/**
	 * The current status of the upload
	 */
	readonly status: TUploadStatus
	/**
	 * The internal abort signal
	 */
	readonly signal: AbortSignal

	/**
	 * Cancels the upload
	 */
	cancel(): void
}

export abstract class Upload extends TypedEventTarget<UploadEvents> implements Partial<IUpload> {
	#abortController = new AbortController()

	get signal(): AbortSignal {
		return this.#abortController.signal
	}

	/**
	 * Cancels the upload
	 */
	public cancel(): void {
		this.#abortController.abort()
	}

	/**
	 * Start the upload
	 *
	 * @param queue - The job queue. It is used to limit the number of concurrent upload jobs.
	 */
	public abstract start(queue: PQueue): Promise<void>
}
