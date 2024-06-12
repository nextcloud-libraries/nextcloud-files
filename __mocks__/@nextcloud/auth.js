/**
 * SPDX-FileCopyrightText: 2022-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
export const getCurrentUser = function() {
	return {
		uid: 'test',
		displayName: 'Test',
		isAdmin: false,
	}
}

export const getRequestToken = function() {
	return 'some-token-string'
}
