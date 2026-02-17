/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { getGettextBuilder } from '@nextcloud/l10n/gettext'

const gtBuilder = getGettextBuilder()
	.detectLocale()

// @ts-expect-error __TRANSLATIONS__ is replaced by vite
__TRANSLATIONS__.map(data => gtBuilder.addTranslation(data.locale, data.json))

interface Gettext {
	/**
	 * Get translated string (singular form), optionally with placeholders
	 *
	 * @param original original string to translate
	 * @param placeholders map of placeholder key to value
	 */
	gettext(original: string, placeholders?: Record<string, string | number>): string

	/**
	 * Get translated string with plural forms
	 *
	 * @param singular Singular text form
	 * @param plural Plural text form to be used if `count` requires it
	 * @param count The number to insert into the text
	 * @param placeholders optional map of placeholder key to value
	 */
	ngettext(singular: string, plural: string, count: number, placeholders?: Record<string, string | number>): string
}

const gt = gtBuilder.build() as Gettext

export const n = gt.ngettext.bind(gt) as typeof gt.ngettext
export const t = gt.gettext.bind(gt) as typeof gt.gettext
