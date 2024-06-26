/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Node permissions
 */
export enum Permission {
	NONE = 0,
	CREATE = 4,
	READ = 1,
	UPDATE = 2,
	DELETE = 8,
	SHARE = 16,
	ALL = 31,
}
