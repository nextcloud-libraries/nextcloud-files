/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type { Eta, EtaEventsMap } from './uploader/index.ts'
export type { IDirectory, Directory } from './utils/fileTree.ts'

export { getUploader, upload } from './getUploader.ts'
export { Upload, Status as UploadStatus } from './upload.ts'
export { Uploader, UploaderStatus, EtaStatus } from './uploader/index.ts'
export { getConflicts, hasConflict } from './utils/conflicts.ts'
