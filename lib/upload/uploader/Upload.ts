/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AxiosResponse } from 'axios'

import { getMaxChunksSize } from '../utils/config.ts'

export const UploadStatus = Object.freeze({
	INITIALIZED: 0,
	UPLOADING: 1,
	ASSEMBLING: 2,
	FINISHED: 3,
	CANCELLED: 4,
	FAILED: 5,
})

type TUploadStatus = typeof UploadStatus[keyof typeof UploadStatus]

export class Upload {
	private _source: string
	private _file: File
	private _isChunked: boolean
	private _chunks: number

	private _size: number
	private _uploaded = 0
	private _startTime = 0

	private _status: TUploadStatus = UploadStatus.INITIALIZED
	private _controller: AbortController
	private _response: AxiosResponse | null = null

	constructor(source: string, chunked = false, size: number, file: File) {
		const chunks = Math.min(getMaxChunksSize() > 0 ? Math.ceil(size / getMaxChunksSize()) : 1, 10000)
		this._source = source
		this._isChunked = chunked && getMaxChunksSize() > 0 && chunks > 1
		this._chunks = this._isChunked ? chunks : 1
		this._size = size
		this._file = file
		this._controller = new AbortController()
	}

	get source(): string {
		return this._source
	}

	get file(): File {
		return this._file
	}

	get isChunked(): boolean {
		return this._isChunked
	}

	get chunks(): number {
		return this._chunks
	}

	get size(): number {
		return this._size
	}

	get startTime(): number {
		return this._startTime
	}

	set response(response: AxiosResponse | null) {
		this._response = response
	}

	get response(): AxiosResponse | null {
		return this._response
	}

	get uploaded(): number {
		return this._uploaded
	}

	/**
	 * Update the uploaded bytes of this upload
	 */
	set uploaded(length: number) {
		if (length >= this._size) {
			this._status = this._isChunked
				? UploadStatus.ASSEMBLING
				: UploadStatus.FINISHED
			this._uploaded = this._size
			return
		}

		this._status = UploadStatus.UPLOADING
		this._uploaded = length

		// If first progress, let's log the start time
		if (this._startTime === 0) {
			this._startTime = new Date().getTime()
		}
	}

	get status(): TUploadStatus {
		return this._status
	}

	/**
	 * Update this upload status
	 */
	set status(status: TUploadStatus) {
		this._status = status
	}

	/**
	 * Returns the axios cancel token source
	 */
	get signal(): AbortSignal {
		return this._controller.signal
	}

	/**
	 * Cancel any ongoing requests linked to this upload
	 */
	cancel() {
		this._controller.abort()
		this._status = UploadStatus.CANCELLED
	}
}
