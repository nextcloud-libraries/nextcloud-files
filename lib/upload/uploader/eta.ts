/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TypedEventTarget } from 'typescript-event-target'
import { n, t } from '../utils/l10n.ts'
import { formatFileSize } from '@nextcloud/files'

export enum EtaStatus {
	Idle = 0,
	Paused = 1,
	Running = 2,
}

interface EtaOptions {
	/** Low pass filter cutoff time for smoothing the speed */
	cutoffTime?: number
	/** Total number of bytes to be expected */
	total?: number
	/** Start the estimation directly */
	start?: boolean
}

export interface EtaEventsMap {
	pause: CustomEvent
	reset: CustomEvent
	resume: CustomEvent
	update: CustomEvent
}

export class Eta extends TypedEventTarget<EtaEventsMap> {

	/** Bytes done */
	private _done: number = 0
	/** Total bytes to do */
	private _total: number = 0
	/** Current progress (cached) as interval [0,1] */
	private _progress: number = 0
	/** Status of the ETA */
	private _status: EtaStatus = EtaStatus.Idle
	/** Time of the last update */
	private _startTime: number = -1
	/** Total elapsed time for current ETA */
	private _elapsedTime: number = 0
	/** Current speed in bytes per second */
	private _speed: number = -1
	/** Expected duration to finish in seconds */
	private _eta: number = Infinity

	/**
	 * Cutoff time for the low pass filter of the ETA.
	 * A higher value will consider more history information for calculation,
	 * and thus suppress spikes of the speed,
	 * but will make the overall resposiveness slower.
	 */
	private _cutoffTime = 2.5

	public constructor(options: EtaOptions = {}) {
		super()
		if (options.start) {
			this.resume()
		}
		if (options.total) {
			this.update(0, options.total)
		}
		this._cutoffTime = options.cutoffTime ?? 2.5
	}

	/**
	 * Add more transferred bytes.
	 * @param done Additional bytes done.
	 */
	public add(done: number): void {
		this.update(this._done + done)
	}

	/**
	 * Update the transmission state.
	 *
	 * @param done The new value of transferred bytes.
	 * @param total Optionally also update the total bytes we expect.
	 */
	public update(done: number, total?: number): void {
		if (this.status !== EtaStatus.Running) {
			return
		}
		if (total && total > 0) {
			this._total = total
		}

		const deltaDone = done - this._done
		const deltaTime = (Date.now() - this._startTime) / 1000

		this._startTime = Date.now()
		this._elapsedTime += deltaTime
		this._done = done
		this._progress = this._done / this._total

		// Only update speed when the history is large enough so we can estimate it
		const historyNeeded = this._cutoffTime + deltaTime
		if (this._elapsedTime > historyNeeded) {
			// Filter the done bytes using a low pass filter to suppress speed spikes
			const alpha = deltaTime / (deltaTime + (1 / this._cutoffTime))
			const filtered = (this._done - deltaDone) + (1 - alpha) * deltaDone
			// bytes per second - filtered
			this._speed = Math.round(filtered / this._elapsedTime)
		} else if (this._speed === -1 && this._elapsedTime > deltaTime) {
			// special case when uploading with high speed
			// it could be that the upload is finished before we reach the curoff time
			// so we already give an estimation
			const remaining = this._total - done
			const eta = remaining / (done / this._elapsedTime)
			// Only set the ETA when we either already set it for a previous update
			// or when the special case happened that we are in fast upload and we only got a couple of seconds for the whole upload
			// meaning we are below 2x the cutoff time.
			if (this._eta !== Infinity || eta <= 2 * this._cutoffTime) {
				// We only take a couple of seconds so we set the eta to the current ETA using current speed.
				// But we do not set the speed because we do not want to trigger the real ETA calculation below
				// and especially because the speed would be very spiky (we still have no filters in place).
				this._eta = eta
			}
		}

		// Update the eta if we have valid speed information (prevent divide by zero)
		if (this._speed > 0) {
			// Estimate transfer of remaining bytes with current average speed
			this._eta = Math.round((this._total - this._done) / this._speed)
		}

		this.dispatchTypedEvent('update', new CustomEvent('update', { cancelable: false }))
	}

	public reset(): void {
		this._done = 0
		this._total = 0
		this._progress = 0
		this._elapsedTime = 0
		this._eta = Infinity
		this._speed = -1
		this._startTime = -1
		this._status = EtaStatus.Idle
		this.dispatchTypedEvent('reset', new CustomEvent('reset'))
	}

	/**
	 * Pause the ETA calculation.
	 */
	public pause(): void {
		if (this._status === EtaStatus.Running) {
			this._status = EtaStatus.Paused
			this._elapsedTime += (Date.now() - this._startTime) / 1000
			this.dispatchTypedEvent('pause', new CustomEvent('pause'))
		}
	}

	/**
	 * Resume the ETA calculation.
	 */
	public resume(): void {
		if (this._status !== EtaStatus.Running) {
			this._startTime = Date.now()
			this._status = EtaStatus.Running
			this.dispatchTypedEvent('resume', new CustomEvent('resume'))
		}
	}

	/**
	 * Status of the Eta (paused, active, idle).
	 */
	public get status(): EtaStatus {
		return this._status
	}

	/**
	 * Progress (percent done)
	 */
	public get progress(): number {
		return Math.round(this._progress * 10000) / 100
	}

	/**
	 * Estimated time in seconds.
	 */
	public get time(): number {
		return this._eta
	}

	/**
	 * Human readable version of the estimated time.
	 */
	public get timeReadable(): string {
		if (this._eta === Infinity) {
			return t('estimating time left')
		} else if (this._eta < 10) {
			return t('a few seconds left')
		} else if (this._eta < 60) {
			return n('{seconds} seconds left', '{seconds} seconds left', this._eta, { seconds: this._eta })
		}

		const hours = String(Math.floor(this._eta / 3600)).padStart(2, '0')
		const minutes = String(Math.floor((this._eta % 3600) / 60)).padStart(2, '0')
		const seconds = String(this._eta % 60).padStart(2, '0')
		return t('{time} left', { time: `${hours}:${minutes}:${seconds}` }) // TRANSLATORS time has the format 00:00:00
	}

	/**
	 * Transfer speed in bytes per second.
	 * Returns `-1` if not yet estimated.
	 */
	public get speed(): number {
		return this._speed
	}

	/**
	 * Get the speed in human readable format using file sizes like 10KB/s.
	 * Returns the empty string if not yet estimated.
	 */
	public get speedReadable(): string {
		return this._speed > 0
			? `${formatFileSize(this._speed, true)}∕s`
			: ''
	}

}
