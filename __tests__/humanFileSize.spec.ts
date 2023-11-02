import { describe, expect, it } from 'vitest'

import { formatFileSize, parseFileSize } from '../lib/humanfilesize'

describe('humanFileSize', () => {
	describe('formatFileSize', () => {
		it('renders binary size with decimal units by default', () => {
			expect(formatFileSize(2048)).toBe('2 KB')
		})

		it('renders file sizes with the correct unit', function() {
			const dataDecimal = [
				[0, '0 B'],
				['0', '0 B'],
				['A', 'NaN B'],
				[125, '125 B'],
				[125000, '125 KB'],
				[122100000, '122.1 MB'],
				[119200000000, '119.2 GB'],
				[116400000000000, '116.4 TB'],
				[116400000000000.0, '116.4 TB'],
				[113700000000000000.0, '113.7 PB'],
			]
			const dataBinary = [
				[0, '0 B'],
				['0', '0 B'],
				['A', 'NaN B'],
				[125, '125 B'],
				[128000, '125 KiB'],
				[128000000, '122.1 MiB'],
				[128000000000, '119.2 GiB'],
				[128000000000000, '116.4 TiB'],
				[128000000000000.0, '116.4 TiB'],
				[128000000000000000.0, '113.7 PiB'],
			] as const
			for (let i = 0; i < dataDecimal.length; i++) {
				expect(formatFileSize(dataDecimal[i][0], false, false, true)).toEqual(dataDecimal[i][1])
			}
			for (let i = 0; i < dataBinary.length; i++) {
				expect(formatFileSize(dataBinary[i][0], false, true)).toEqual(dataBinary[i][1])
				// Binary sizes but decimal units
				expect(formatFileSize(dataBinary[i][0], false, false)).toEqual(dataBinary[i][1].replace('i', ''))
			}
		})

		it('renders file sizes with the correct unit for small sizes', function() {
			const dataDecimal = [
				[0, '0 KB'],
				[125, '< 1 KB'],
				[125000, '125 KB'],
				[122100000, '122.1 MB'],
				[119200000000, '119.2 GB'],
				[116400000000000, '116.4 TB'],
				[116400000000000.0, '116.4 TB'],
				[113700000000000000.0, '113.7 PB'],
			]
			const dataBinary = [
				[0, '0 KiB'],
				[125, '< 1 KiB'],
				[128000, '125 KiB'],
				[128000000, '122.1 MiB'],
				[128000000000, '119.2 GiB'],
				[128000000000000, '116.4 TiB'],
				[128000000000000.0, '116.4 TiB'],
				[128000000000000000.0, '113.7 PiB'],
			] as const
			for (let i = 0; i < dataDecimal.length; i++) {
				expect(formatFileSize(dataDecimal[i][0], true, false, true)).toEqual(dataDecimal[i][1])
			}
			for (let i = 0; i < dataBinary.length; i++) {
				expect(formatFileSize(dataBinary[i][0], true, true)).toEqual(dataBinary[i][1])
				// Binary sizes but decimal units
				expect(formatFileSize(dataBinary[i][0], true, false)).toEqual(dataBinary[i][1].replace('i', ''))
			}
		})

		it('renders file sizes with the correct locale', function() {
			document.documentElement.dataset.locale = 'de'
			const dataDecimal = [
				[0, '0 B'],
				['0', '0 B'],
				['A', 'NaN B'],
				[125, '125 B'],
				[125000, '125 KB'],
				[122100000, '122,1 MB'],
				[119200000000, '119,2 GB'],
				[116400000000000, '116,4 TB'],
				[116400000000000.0, '116,4 TB'],
				[113700000000000000.0, '113,7 PB'],
			]
			const dataBinary = [
				[0, '0 B'],
				['0', '0 B'],
				['A', 'NaN B'],
				[125, '125 B'],
				[128000, '125 KiB'],
				[128000000, '122,1 MiB'],
				[128000000000, '119,2 GiB'],
				[128000000000000, '116,4 TiB'],
				[128000000000000.0, '116,4 TiB'],
				[128000000000000000.0, '113,7 PiB'],
			] as const
			for (let i = 0; i < dataDecimal.length; i++) {
				expect(formatFileSize(dataDecimal[i][0], false, false, true)).toEqual(dataDecimal[i][1])
			}
			for (let i = 0; i < dataBinary.length; i++) {
				expect(formatFileSize(dataBinary[i][0], false, true)).toEqual(dataBinary[i][1])
				// Binary sizes but decimal units
				expect(formatFileSize(dataBinary[i][0], false, false)).toEqual(dataBinary[i][1].replace('i', ''))
			}
		})
	})
})

describe('parseFileSize', () => {
	it('should return null on error', () => {
		const invalid = [
			'',
			'a',
			'.',
			'kb',
			'1.1.2',
			'10ob',
			'1z',
		]

		for (const line of invalid) {
			expect(parseFileSize(line)).toBeNull()
		}
	})

	it('can parse base 2', () => {
		const values = {
			'2kib': 2048,
			'2mib': 2 * (1024 ** 2),
			'2gib': 2 * (1024 ** 3),
			'2tib': 2 * (1024 ** 4),
			'2pib': 2 * (1024 ** 5),
		}

		for (const [text, value] of Object.entries(values)) {
			expect(parseFileSize(text)).toBe(value)
		}
	})

	it('can parse base 10', () => {
		const values = {
			'2kb': 2000,
			'2mb': 2 * (1000 ** 2),
			'2gb': 2 * (1000 ** 3),
			'2tb': 2 * (1000 ** 4),
			'2pb': 2 * (1000 ** 5),
		}

		for (const [text, value] of Object.entries(values)) {
			expect(parseFileSize(text)).toBe(value)
		}
	})

	it('parses missing binary prefixes if force is set true', () => {
		const values = {
			'2kb': 2048,
			'2mb': 2 * (1024 ** 2),
			'2gb': 2 * (1024 ** 3),
			'2tb': 2 * (1024 ** 4),
			'2pb': 2 * (1024 ** 5),
		}

		for (const [text, value] of Object.entries(values)) {
			expect(parseFileSize(text, true)).toBe(value)
		}
	})

	it('can parse with spaces', () => {
		const values = {
			'2kb': 2000,
			'2 kb': 2000,
			' 2kb': 2000,
			'2kb ': 2000,
			' 2 k b ': 2000,
			'2kib': 2048,
			'2 kIb': 2048,
			' 2kib': 2048,
			'2Kib ': 2048,
			' 2 k i b ': 2048,
		}

		for (const [text, value] of Object.entries(values)) {
			expect(parseFileSize(text)).toBe(value)
		}
	})

	it('can parse decimals', () => {
		const values = {
			'2kb': 2000,
			'2.2kb': 2200,
			'2.kb': 2000,
			'.2kb ': 200,
			',2kb': 200,
			'2,2kb': 2200,
		}

		for (const [text, value] of Object.entries(values)) {
			expect(parseFileSize(text)).toBe(value)
		}
	})
})
