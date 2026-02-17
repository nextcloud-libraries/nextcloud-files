/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { afterAll, beforeAll, describe, expect, it, test, vi } from 'vitest'
import { Eta, EtaStatus } from './eta.ts'

describe('ETA - status', () => {
	it('has default set', () => {
		const eta = new Eta()
		expect(eta.progress).toBe(0)
		expect(eta.time).toBe(Infinity)
		expect(eta.timeReadable).toBe('estimating time left')
		expect(eta.speed).toBe(-1)
		expect(eta.status).toBe(EtaStatus.Idle)
	})

	it('can autostart in constructor', () => {
		const eta = new Eta({ start: true, total: 100 })
		expect(eta.status).toBe(EtaStatus.Running)
		expect(eta.progress).toBe(0)
		expect(eta.time).toBe(Infinity)
		expect(eta.timeReadable).toBe('estimating time left')
		expect(eta.speed).toBe(-1)
	})

	it('can reset', () => {
		const eta = new Eta({ start: true, total: 100 })
		expect(eta.status).toBe(EtaStatus.Running)

		eta.add(10)
		expect(eta.progress).toBe(10)

		eta.reset()
		expect(eta.status).toBe(EtaStatus.Idle)
		expect(eta.progress).toBe(0)
	})

	it('does not update when idle', () => {
		const eta = new Eta()
		expect(eta.progress).toBe(0)

		eta.update(10, 100)
		expect(eta.progress).toBe(0)

		eta.add(10)
		expect(eta.progress).toBe(0)
		expect(eta.status).toBe(EtaStatus.Idle)
	})

	it('does not update when paused', () => {
		const eta = new Eta({ start: true, total: 100 })
		eta.add(10)
		expect(eta.progress).toBe(10)

		eta.pause()
		eta.add(10)
		expect(eta.progress).toBe(10)
		expect(eta.status).toBe(EtaStatus.Paused)
	})

	it('can resume', () => {
		const eta = new Eta()
		expect(eta.status).toBe(EtaStatus.Idle)
		eta.resume()
		expect(eta.status).toBe(EtaStatus.Running)
	})
})

describe('ETA - progress', () => {
	beforeAll(() => vi.useFakeTimers())
	afterAll(() => vi.useRealTimers())

	test('progress calculation', () => {
		const eta = new Eta({ start: true, total: 100 * 1024 * 1024, cutoffTime: 2.5 })
		expect(eta.progress).toBe(0)

		// First upload some parts with about 5MiB/s which should take 3s (total 20s)
		for (let i = 1; i <= 6; i++) {
			vi.advanceTimersByTime(500)
			eta.add(2.5 * 1024 * 1024)
			expect(eta.progress).toBe(i * 2.5)
			expect(eta.speed).toBe(-1)
			expect(eta.speedReadable).toBe('')
			expect(eta.time).toBe(Infinity)
		}

		// this is reached after (virtual) 3s with 6 * 2.5MiB (=15MiB) data of 100MiB total
		expect(eta.timeReadable).toBe('estimating time left')

		// Adding another 500ms with 5MiB/s will result in enough information for estimating
		vi.advanceTimersByTime(500)
		eta.add(2.5 * 1024 * 1024)
		expect(eta.progress).toBe(17.5)
		expect(eta.speed).toMatchInlineSnapshot('4826778')
		expect(eta.speedReadable).toMatchInlineSnapshot('"4.6 MB∕s"')
		expect(eta.time).toMatchInlineSnapshot('18')
		expect(eta.timeReadable).toMatchInlineSnapshot('"18 seconds left"')

		// Skip forward another 4.5seconds
		for (let i = 0; i < 9; i++) {
			vi.advanceTimersByTime(500)
			eta.add(2.5 * 1024 * 1024)
		}
		// See we made some progress
		expect(eta.progress).toBe(40)
		// See as we have constant speed, the speed is closing to 5MiB/s (5242880)
		expect(eta.speed).toMatchInlineSnapshot('5060836')
		expect(eta.speedReadable).toMatchInlineSnapshot('"4.8 MB∕s"')
		expect(eta.time).toMatchInlineSnapshot('12')
		expect(eta.timeReadable).toMatchInlineSnapshot('"12 seconds left"')

		// Having a spike of 10MiB/s will not result in halfing the eta
		vi.advanceTimersByTime(500)
		eta.add(5 * 1024 * 1024)
		expect(eta.progress).toBe(45)
		// See the value is not doubled
		expect(eta.speed).toMatchInlineSnapshot('5208613')
		expect(eta.speedReadable).toMatchInlineSnapshot('"5 MB∕s"')
		// And the time has not halved
		expect(eta.time).toMatchInlineSnapshot('11')
		expect(eta.timeReadable).toMatchInlineSnapshot('"11 seconds left"')

		// Add another 3 seconds so we should see 'few seconds left'
		for (let i = 0; i < 6; i++) {
			vi.advanceTimersByTime(500)
			eta.add(2.5 * 1024 * 1024)
		}
		expect(eta.progress).toBe(60)
		expect(eta.speed).toMatchInlineSnapshot('5344192')
		expect(eta.time).toMatchInlineSnapshot('8')
		expect(eta.timeReadable).toMatchInlineSnapshot('"a few seconds left"')
	})

	test('long running progress', () => {
		const eta = new Eta({ start: true, total: 100 * 1024 * 1024, cutoffTime: 2.5 })
		expect(eta.progress).toBe(0)

		// First upload some parts with about 1MiB/s
		for (let i = 1; i <= 6; i++) {
			vi.advanceTimersByTime(500)
			eta.add(512 * 1024)
			expect(eta.progress).toBe(i / 2)
			expect(eta.speed).toBe(-1)
			expect(eta.time).toBe(Infinity)
		}

		// Now we should be able to see some progress
		vi.advanceTimersByTime(500)
		eta.add(512 * 1024)
		expect(eta.progress).toBe(3.5)
		expect(eta.time).toBe(105)
		// time is over 1 minute so we see the formatted output
		expect(eta.timeReadable).toMatchInlineSnapshot('"00:01:45 left"')

		// Add another minute and we should see only seconds:
		for (let i = 0; i < 120; i++) {
			vi.advanceTimersByTime(500)
			eta.add(512 * 1024)
			expect(eta.progress).toBe(4 + 0.5 * i)
		}

		// Now we have uploaded 63.5 MiB - so 36.5 MiB missing by having 1MiB/s upload speed we expect 37 seconds left:
		expect(eta.progress).toBe(63.5)
		expect(eta.time).toBe(37)
		expect(eta.timeReadable).toMatchInlineSnapshot('"37 seconds left"')
	})

	test('progress calculation for fast uploads', () => {
		const eta = new Eta({ start: true, total: 100 * 1024 * 1024, cutoffTime: 2.5 })
		expect(eta.progress).toBe(0)

		// we have 100 MiB - when uploading with 40 MiB/s the time will be just like 2.5 seconds
		// so not enough for estimation, instead we use the current speed to at least show that it is very fast

		// First chunk will not show any information as we initialize the system
		vi.advanceTimersByTime(500)
		eta.add(20 * 1024 * 1024)
		expect(eta.progress).toBe(20)
		expect(eta.speed).toBe(-1)
		expect(eta.time).toBe(Infinity)
		expect(eta.timeReadable).toBe('estimating time left')

		// Now we have some information but not enough for normal estimation
		// yet we show some information as the upload is very fast (40% per second)
		vi.advanceTimersByTime(500)
		eta.add(20 * 1024 * 1024)
		expect(eta.progress).toBe(40)
		expect(eta.time).toBe(1.5)
		expect(eta.timeReadable).toBe('a few seconds left')
		// still no speed information
		expect(eta.speed).toBe(-1)

		// same check for the last 60MiB
		for (let i = 1; i <= 3; i++) {
			vi.advanceTimersByTime(500)
			eta.add(20 * 1024 * 1024)
			expect(eta.progress).toBe(40 + i * 20)
			expect(eta.time).toBe(1.5 - (i / 2))
			expect(eta.timeReadable).toBe('a few seconds left')
			// still no speed information
			expect(eta.speed).toBe(-1)
		}
		expect(eta.progress).toBe(100)
	})

	it('can autostart in constructor', () => {
		const eta = new Eta({ start: true, total: 100 })
		expect(eta.status).toBe(EtaStatus.Running)
		expect(eta.progress).toBe(0)
		expect(eta.time).toBe(Infinity)
		expect(eta.timeReadable).toBe('estimating time left')
		expect(eta.speed).toBe(-1)
	})

	it('can reset', () => {
		const eta = new Eta({ start: true, total: 100 })
		expect(eta.status).toBe(EtaStatus.Running)

		eta.add(10)
		expect(eta.progress).toBe(10)

		eta.reset()
		expect(eta.status).toBe(EtaStatus.Idle)
		expect(eta.progress).toBe(0)
	})

	it('does not update when idle', () => {
		const eta = new Eta()
		expect(eta.progress).toBe(0)

		eta.update(10, 100)
		expect(eta.progress).toBe(0)

		eta.add(10)
		expect(eta.progress).toBe(0)
		expect(eta.status).toBe(EtaStatus.Idle)
	})

	it('does not update when paused', () => {
		const eta = new Eta({ start: true, total: 100 })
		eta.add(10)
		expect(eta.progress).toBe(10)

		eta.pause()
		eta.add(10)
		expect(eta.progress).toBe(10)
		expect(eta.status).toBe(EtaStatus.Paused)
	})

	it('can resume', () => {
		const eta = new Eta()
		expect(eta.status).toBe(EtaStatus.Idle)
		eta.resume()
		expect(eta.status).toBe(EtaStatus.Running)
	})
})

describe('ETA - events', () => {
	it('emits updated event', () => {
		const spy = vi.fn()
		const eta = new Eta()
		eta.addEventListener('update', spy)

		// only works when running so nothing should happen
		eta.update(10, 100)
		expect(spy).not.toBeCalled()

		// now start and update
		eta.resume()
		eta.update(10, 100)
		expect(spy).toBeCalledTimes(1)
	})

	it('emits reset event', () => {
		const spy = vi.fn()
		const eta = new Eta()
		eta.addEventListener('reset', spy)

		eta.reset()
		expect(spy).toBeCalledTimes(1)
	})

	it('emits pause event', () => {
		const spy = vi.fn()
		const eta = new Eta()
		eta.addEventListener('pause', spy)

		// cannot pause if not running
		eta.pause()
		expect(spy).toBeCalledTimes(0)

		// start
		eta.resume()
		expect(spy).toBeCalledTimes(0)

		// Pause - this time the event should be emitted
		eta.pause()
		expect(spy).toBeCalledTimes(1)
		// double pause does nothing
		eta.pause()
		expect(spy).toBeCalledTimes(1)
	})

	it('emits resume event', () => {
		const spy = vi.fn()
		const eta = new Eta()
		eta.addEventListener('resume', spy)

		eta.resume()
		expect(spy).toBeCalledTimes(1)
		// already resumed so nothing happens
		eta.resume()
		expect(spy).toBeCalledTimes(1)
	})
})
