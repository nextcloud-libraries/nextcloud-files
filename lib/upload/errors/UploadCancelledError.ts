/*!
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { t } from '../utils/l10n.ts'

export class UploadCancelledError extends Error {

	public constructor(cause?: unknown) {
		super(t('Upload has been cancelled'), { cause })
	}

}
