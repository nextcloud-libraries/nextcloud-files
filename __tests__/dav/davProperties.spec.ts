import { beforeEach, describe, expect, test, vi } from 'vitest'
import { XMLValidator } from 'fast-xml-parser'

import {
	davGetDefaultPropfind,
	davGetFavoritesReport,
	getDavNameSpaces,
	getDavProperties,
	registerDavProperty,
	defaultDavNamespaces,
	defaultDavProperties,
} from '../../lib/dav/davProperties'

import logger from '../../lib/utils/logger'

describe('DAV Properties', () => {

	beforeEach(() => {
		delete window._nc_dav_properties
		delete window._nc_dav_namespaces
	})

	test('getDavNameSpaces fall back to defaults', () => {
		expect(window._nc_dav_namespaces).toBeUndefined()
		const namespace = getDavNameSpaces()
		expect(namespace).toBeTruthy()
		Object.keys(defaultDavNamespaces).forEach(n => expect(namespace.includes(n) && namespace.includes(defaultDavNamespaces[n])).toBe(true))
	})

	test('getDavProperties fall back to defaults', () => {
		expect(window._nc_dav_properties).toBeUndefined()
		const props = getDavProperties()
		expect(props).toBeTruthy()
		defaultDavProperties.forEach(p => expect(props.includes(p)).toBe(true))
	})

	test('davGetDefaultPropfind', () => {
		expect(typeof davGetDefaultPropfind()).toBe('string')
		expect(XMLValidator.validate(davGetDefaultPropfind())).toBe(true)
	})

	test('davGetFavoritesReport', () => {
		expect(typeof davGetFavoritesReport()).toBe('string')
		expect(XMLValidator.validate(davGetFavoritesReport())).toBe(true)
	})

	test('registerDavProperty registers successfully', () => {
		logger.error = vi.fn()

		expect(window._nc_dav_namespaces).toBeUndefined()
		expect(window._nc_dav_properties).toBeUndefined()

		expect(registerDavProperty('my:prop', { my: 'https://example.com/ns' })).toBe(true)
		expect(logger.error).not.toBeCalled()
		expect(getDavProperties().includes('my:prop')).toBe(true)
		expect(getDavNameSpaces().includes('xmlns:my="https://example.com/ns"')).toBe(true)
	})

	test('registerDavProperty fails when registered multipletimes', () => {
		logger.error = vi.fn()

		expect(window._nc_dav_namespaces).toBeUndefined()
		expect(window._nc_dav_properties).toBeUndefined()

		expect(registerDavProperty('my:prop', { my: 'https://example.com/ns' })).toBe(true)
		expect(registerDavProperty('my:prop')).toBe(false)
		expect(logger.error).toBeCalled()
		// but still included
		expect(getDavProperties().includes('my:prop')).toBe(true)
		expect(getDavNameSpaces().includes('xmlns:my="https://example.com/ns"')).toBe(true)
	})

	test('registerDavProperty fails with invalid props', () => {
		logger.error = vi.fn()

		expect(window._nc_dav_namespaces).toBeUndefined()
		expect(window._nc_dav_properties).toBeUndefined()

		expect(registerDavProperty('my:prop:invalid', { my: 'https://example.com/ns' })).toBe(false)
		expect(logger.error).toBeCalled()
		expect(getDavProperties().includes('my:prop')).toBe(false)

		expect(registerDavProperty('<my:prop />', { my: 'https://example.com/ns' })).toBe(false)
		expect(logger.error).toBeCalled()
		expect(getDavProperties().includes('my:prop')).toBe(false)
	})

	test('registerDavProperty fails with missing namespace', () => {
		logger.error = vi.fn()

		expect(window._nc_dav_namespaces).toBeUndefined()
		expect(window._nc_dav_properties).toBeUndefined()

		expect(registerDavProperty('my:prop', { other: 'https://example.com/ns' })).toBe(false)
		expect(logger.error).toBeCalled()
		expect(getDavProperties().includes('my:prop')).toBe(false)
	})
})
