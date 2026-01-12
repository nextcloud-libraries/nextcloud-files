/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, test } from 'vitest'
import { orderBy } from '../../lib/utils/sorting.ts'

describe('orderBy', () => {
	test('By default the identify and ascending order is used', () => {
		const array = ['a', 'z', 'b']
		expect(orderBy(array)).toEqual(['a', 'b', 'z'])
	})

	test('Use identifiy but descending', () => {
		const array = ['a', 'z', 'b']
		expect(orderBy(array, undefined, ['desc'])).toEqual(['z', 'b', 'a'])
	})

	test('Can set identifier function', () => {
		const array = [
			{ text: 'a', order: 2 },
			{ text: 'z', order: 1 },
			{ text: 'b', order: 3 },
		] as const
		expect(orderBy(array, [(v) => v.order]).map((v) => v.text)).toEqual(['z', 'a', 'b'])
	})

	test('Can set multiple identifier functions', () => {
		const array = [
			{ text: 'a', order: 2, secondOrder: 2 },
			{ text: 'z', order: 1, secondOrder: 3 },
			{ text: 'b', order: 2, secondOrder: 1 },
		] as const
		expect(orderBy(array, [(v) => v.order, (v) => v.secondOrder]).map((v) => v.text)).toEqual(['z', 'b', 'a'])
	})

	test('Can set order partially', () => {
		const array = [
			{ text: 'a', order: 2, secondOrder: 2 },
			{ text: 'z', order: 1, secondOrder: 3 },
			{ text: 'b', order: 2, secondOrder: 1 },
		] as const

		expect(orderBy(
			array,
			[(v) => v.order, (v) => v.secondOrder],
			['desc'],
		).map((v) => v.text)).toEqual(['b', 'a', 'z'])
	})

	test('Can set order array', () => {
		const array = [
			{ text: 'a', order: 2, secondOrder: 2 },
			{ text: 'z', order: 1, secondOrder: 3 },
			{ text: 'b', order: 2, secondOrder: 1 },
		] as const

		expect(orderBy(
			array,
			[(v) => v.order, (v) => v.secondOrder],
			['desc', 'desc'],
		).map((v) => v.text)).toEqual(['a', 'b', 'z'])
	})

	test('Numbers are handled correctly', () => {
		const array = [
			{ text: '2.3' },
			{ text: '2.10' },
			{ text: '2.0' },
			{ text: '2.2' },
		] as const

		expect(orderBy(
			array,
			[(v) => v.text],
		).map((v) => v.text)).toEqual(['2.0', '2.2', '2.3', '2.10'])
	})

	test('Numbers with suffixes are handled correctly', () => {
		const array = [
			{ text: '2024-01-05' },
			{ text: '2024-05-01' },
			{ text: '2024-01-10' },
			{ text: '2024-01-05 Foo' },
		] as const

		expect(orderBy(
			array,
			[(v) => v.text],
		).map((v) => v.text)).toEqual(['2024-01-05', '2024-01-05 Foo', '2024-01-10', '2024-05-01'])
	})

	test('Numbers with multiple dots are handled correctly', () => {
		const array = [
			{ text: '2.11' },
			{ text: '2.10' },
			{ text: '2.10.1' },
		] as const

		expect(orderBy(
			array,
			[(v) => v.text],
		).map((v) => v.text)).toEqual(['2.10', '2.10.1', '2.11'])
	})

	test('Dates are handled correctly', () => {
		const array = [
			{ text: 'monday', date: new Date(1716212366 * 1000) },
			{ text: 'wednesday', date: new Date(1716385166 * 1000) },
			{ text: 'tuesday', date: new Date(1716298766 * 1000) },
		]

		expect(orderBy(
			array,
			[(v) => v.date],
		).map((v) => v.text)).toEqual(['monday', 'tuesday', 'wednesday'])
	})

	test('sort with equal values', () => {
		const array = [
			{ text: 'Dienstag', value: 2 },
			{ text: 'Monday', value: 1 },
			{ text: 'Wednesday', value: 3 },
			{ text: 'Tuesday', value: 2 },
		]

		const ordered = orderBy(
			array,
			[(v) => v.value],
		)

		expect(ordered[0].text).toBe('Monday')
		expect(ordered[3].text).toBe('Wednesday')
		// the rest can be in any order
	})
})
