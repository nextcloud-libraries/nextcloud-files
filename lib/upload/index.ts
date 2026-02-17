/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type { Eta, EtaEventsMap } from './uploader/index.ts'
export type { Directory, IDirectory } from './utils/fileTree.ts'

export { getUploader, upload } from './getUploader.ts'
export { Upload, Status as UploadStatus } from './uploader/Upload.ts'
export { EtaStatus, Uploader, UploaderStatus } from './uploader/index.ts'
export { getConflicts, hasConflict } from './utils/conflicts.ts'
