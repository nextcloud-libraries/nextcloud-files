# Changelog

All notable changes to this project will be documented in this file.

## 3.0.0 - 2023-11-08

### Breaking
- Node requirements are now node 20 and npm 9
- Lots of new APIs:
  - `Node` standards: https://nextcloud-libraries.github.io/nextcloud-files/classes/Node.html
    - `File`: https://nextcloud-libraries.github.io/nextcloud-files/classes/File.html
    - `Folder`: https://nextcloud-libraries.github.io/nextcloud-files/classes/Folder.html
  - `FileAction`: https://nextcloud-libraries.github.io/nextcloud-files/classes/FileAction.html
  - `Header`: https://nextcloud-libraries.github.io/nextcloud-files/classes/Header.html
  - `View`: https://nextcloud-libraries.github.io/nextcloud-files/classes/View.html
    - Works in sync with `Column`: https://nextcloud-libraries.github.io/nextcloud-files/classes/Column.html
- Lots of changes with Nextcloud 28, please see server changelog as well

### Enhancements
* Add context to getEntries by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/484
* Add DAV functions for fetching nodes from Nextcloud by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/706
* Add File and Folder API by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/501
* Add newFileMenu and refactor library with rollup by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/420
* Also use context from exposed method by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/486
* feat: add action title by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/767
* feat: add FileListHeader by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/717
* feat: migrate Navigation and update FileAction from server by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/732
* feat: provide fileList names as newFileMenu handler argument by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/752
* feat: support nested actions by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/814
* feat: support new file menu entry order by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/781
* feat: use Folder as filemenu context by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/731
* feat(actions): also test doc build on pull requests by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/621
* feat(dav): Add "recent files" SEARCH payload as an export by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/710
* feat(FileAction): add file action support by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/608
* feat(files): add encodedSource by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/794
* feat(files): add node status by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/744
* feat(files): update mtime on attributes tampering by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/602
* feat(node): allow and recommend to provide a specific root by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/574
* feat(parseFileSize): Added `parseFileSize` function to parse a human readable file size to number of bytes by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/769
* feat(permissions): add webdav permissions parser by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/565

### Fixed
* Fix `resultToNode` by adding some documenation how to use by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/741
* Fix decimal prefixes and add option for binary prefixes per IEC 80000-13 by @Zipdox in https://github.com/nextcloud-libraries/nextcloud-files/pull/536
* Fix templateName usage and errors strings by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/494
* fix: allow undefined properties in File and Folder by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/683
* fix: also export Node by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/573
* fix: Bring back Typescript definitions by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/712
* fix: Do not export the declaration of window.OC by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/667
* fix: do not update mtime if not already defined by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/709
* fix: fileid definition and fallback by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/681
* fix: force bundle `is-svg` by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/740
* fix: getNewFileMenuEntries usage by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/734
* fix: headers and actions empty variable init by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/724
* fix: Node import type by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/754
* fix: prevent invalid roots to be defined by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/577
* fix: use Node and not string for the new file menu handler arg by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/753
* fix!(humanFileSize): Revert changes to default file sizes by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/822
* fix(dav): Fix DAV functions to make work with them easier by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/725
* fix(dav): use of webdav library by @pulsejet in https://github.com/nextcloud-libraries/nextcloud-files/pull/821
* fix(fileActions): improve typing and add silent actions by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/625
* fix(formatFileSize): Fix default value for `binaryPrefixes` by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/770
* fix(newfilemenu): better sorting and proper fallback to displayName by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/806
* fix(newfilemenu): fix handler requirement, deprecate iconClass and fix context by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/742
* fix(node): allow negative file ids by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/716
* fix(node): default permissions should be NONE and fix undefined return by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/630
* Replace deprecated String.prototype.substr() by @CommanderRoot in https://github.com/nextcloud-libraries/nextcloud-files/pull/390

**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v2.1.0...v3.0.0

## 2.1.0 – 2021-09-28
### Changed
- Dependency updates

## 2.0.0 – 2021-04-07
### Changed
- Browserslist config updated, which means some older browsers are not supported anymore
- Dependency updates

## 1.1.0 - 2020-06-04
### Changed
- formatFileSize works without the global OC
- Dependency updates

## 1.0.1 - 2020-03-19
### Changed
- Dependency updates
### Fixed
- Update vulnerable packages
