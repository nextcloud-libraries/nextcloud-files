<!--
  - SPDX-FileCopyrightText: 2024-2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# Changelog

All notable changes to this project will be documented in this file.

## 3.10.0 - 2024-11-13
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.9.2...v3.10.0)

### Added
* Scope package into modules [\#1025](https://github.com/nextcloud-libraries/nextcloud-files/pull/1025) \([susnux](https://github.com/susnux)\)  
  All DAV related functions are now moved to the `@nextcloud/files/dav` module.
  You can still import them from the main entrypoint, but this is now deprecated.
  New functions will only be available in the `@nextcloud/files/dav` entrypoint.
* feat: Add reset method to file list filters [\#1116](https://github.com/nextcloud-libraries/nextcloud-files/pull/1116) \([susnux](https://github.com/susnux)\)  
* feat: Add current folder context for file list actions [\#1113](https://github.com/nextcloud-libraries/nextcloud-files/pull/1113) \([Pytal](https://github.com/Pytal)\)
* feat: Allow cloning a node [\#1077](https://github.com/nextcloud-libraries/nextcloud-files/pull/1077) \([Pytal](https://github.com/Pytal)\)
* feat(FileAction): Allow to set `destructive` flag [\#1076](https://github.com/nextcloud-libraries/nextcloud-files/pull/1076) \([susnux](https://github.com/susnux)\)

### Fixed
* fix: Document optional `user` property of FileListFilterChip [\#1075](https://github.com/nextcloud-libraries/nextcloud-files/pull/1075) \([susnux](https://github.com/susnux)\)
* fix deprecation warning `Node.attributes.displayname` should be accessed directly on the `Node` [\#1074](https://github.com/nextcloud-libraries/nextcloud-files/pull/1074) \([dvaerum](https://github.com/dvaerum)\)

### Changed
* chore(deps): Bump dompurify to 3.1.6

## 3.9.2 - 2024-11-13

### Changed
* Updated development dependencies
* Fix published package

## 3.9.1 - 2024-10-23

Broken - do not use.

## 3.9.0 - 2024-09-04
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.8.0...v3.9.0)

### Added
* feat: Allow views to be naturally sorted by @Pytal in https://github.com/nextcloud-libraries/nextcloud-files/pull/1053

### Changed
* chore(deps-dev): Bump @nextcloud/vite-config from 2.1.0 to 2.2.2 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1048
* chore(deps-dev): Bump vite from 5.3.5 to 5.4.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1051
* chore(deps): Bump webdav from 5.7.0 to 5.7.1 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1049
* chore(deps-dev): Bump @types/node from 22.1.0 to 22.2.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1050
* chore(deps): Bump is-svg from 5.0.1 to 5.1.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1052
* chore(deps): Bump @nextcloud/auth from 2.3.0 to 2.4.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1054
* chore(deps-dev): Bump vite from 5.4.0 to 5.4.1 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1055
* chore(deps-dev): Bump @types/node from 22.2.0 to 22.4.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1056
* chore(deps-dev): Bump elliptic from 6.5.5 to 6.5.7 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1057
* chore(deps-dev): Bump tslib from 2.6.3 to 2.7.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1059
* chore(deps-dev): Bump @types/node from 22.4.0 to 22.5.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1061
* chore(deps-dev): Bump typedoc from 0.26.5 to 0.26.6 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1062
* chore(deps-dev): Bump vite from 5.4.1 to 5.4.2 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1060
* chore(deps-dev): Bump @types/node from 22.5.0 to 22.5.1 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1064
* Update dependabot-approve-merge.yml from main org by @AndyScherzinger in https://github.com/nextcloud-libraries/nextcloud-files/pull/1066
* chore(deps-dev): Bump jsdom from 24.1.1 to 25.0.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1065

## 3.8.0 - 2024-08-08
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.7.0...v3.8.0)

### Added
* feat: Allow registration of load child views callback on view by @Pytal in https://github.com/nextcloud-libraries/nextcloud-files/pull/1046

### Changed
* chore(deps-dev): Bump @vitest/coverage-istanbul from 2.0.3 to 2.0.4 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1033
* chore(deps-dev): Bump typedoc from 0.26.4 to 0.26.5 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1031
* chore(deps): Bump @nextcloud/paths from 2.2.0 to 2.2.1 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1037
* chore(deps): Bump @nextcloud/sharing from 0.2.2 to 0.2.3 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1034
* chore(deps-dev): Bump vite from 5.3.4 to 5.3.5 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1036
* chore(deps-dev): Bump jsdom from 24.1.0 to 24.1.1 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1035
* chore(deps-dev): Bump @types/node from 20.14.11 to 20.14.12 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1032
* chore(deps-dev): Bump typescript from 5.5.3 to 5.5.4 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1038
* chore(deps-dev): Bump fast-xml-parser from 4.4.0 to 4.4.1 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1040
* chore(deps-dev): Bump @vitest/coverage-istanbul from 2.0.4 to 2.0.5 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1042
* chore(deps): Bump webdav from 5.6.0 to 5.7.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1043
* chore(deps-dev): Bump @types/node from 20.14.12 to 22.1.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/1044

## 3.7.0 - 2024-07-25
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.6.0...v3.7.0)

### Added
* feat: Implement API for file list filters [\#1027](https://github.com/nextcloud-libraries/nextcloud-files/pull/1027) \([susnux](https://github.com/susnux)\)

### Fixed
* fix(dav): Cast displayname to string in `resultToNode` [\#1028](https://github.com/nextcloud-libraries/nextcloud-files/pull/1028) \([susnux](https://github.com/susnux)\)
* fix: Correctly export public API [\#1026](https://github.com/nextcloud-libraries/nextcloud-files/pull/1026) \([susnux](https://github.com/susnux)\)

### Changed
* chore(deps): Bump @nextcloud/paths from 2.1.0 to 2.2.0

## 3.6.0 - 2024-07-18
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.5.1...v3.6.0)

### Added
* feat(filename): Improve filename validation to support Nextcloud 30 capabilities [\#1013](https://github.com/nextcloud-libraries/nextcloud-files/pull/1013) \([susnux](https://github.com/susnux)\)
* feat(node): Add `displayname` as top level attribute [\#1019](https://github.com/nextcloud-libraries/nextcloud-files/pull/1019) \([susnux](https://github.com/susnux)\)

### Fixed
* fix: `Node.move` should also adjust the displayname [\#1018](https://github.com/nextcloud-libraries/nextcloud-files/pull/1018) \([susnux](https://github.com/susnux)\)

### Changed
* Update README.md to add more info about the webDAV client [\#1007](https://github.com/nextcloud-libraries/nextcloud-files/pull/1007) \([StCyr](https://github.com/StCyr)\)
* test: Add missing test case for sorting equal values and ESLint warning [\#1014](https://github.com/nextcloud-libraries/nextcloud-files/pull/1014) \([susnux](https://github.com/susnux)\)
* Migrate REUSE to TOML format [\#1012](https://github.com/nextcloud-libraries/nextcloud-files/pull/1012) \([AndyScherzinger](https://github.com/AndyScherzinger)\)
* Bump @nextcloud/sharing from 0.2.1 to 0.2.2
* Updated development dependencies

## 3.5.1 - 2024-06-20
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.5.0...v3.5.1

### Fixed
* fix `davResultToNode` on public shares \([\#993](https://github.com/nextcloud-libraries/nextcloud-files/pull/993)\)
* fix: make `davRootPath` and `davRemoteURL` support public shares \([\#996](https://github.com/nextcloud-libraries/nextcloud-files/pull/996)\)
* fix(dav): Add `displayname` and `creationdate` to default props \([\#991](https://github.com/nextcloud-libraries/nextcloud-files/pull/991)\)
* fix(sorting): The display name attribute is called `displayname` not `displayName` for DAV \([\#992](https://github.com/nextcloud-libraries/nextcloud-files/pull/992)\)

### Changed
* chore(deps-dev): Bump ws from 8.17.0 to 8.17.1
* chore: Update development dependencies

## 3.5.0 - 2024-06-17
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.4.1...v3.5.0

### Added
* feat: Add filename util `getUniqueName` to generate a unique name \([\#986](https://github.com/nextcloud-libraries/nextcloud-files/pull/986)\)
* feat: Export public interfaces of `Node`, `File` and `Folder` \([\#976](https://github.com/nextcloud-libraries/nextcloud-files/pull/976)\)
* feat(navigation): Allow to listen for active navigation changes \([\#987](https://github.com/nextcloud-libraries/nextcloud-files/pull/987)\)

### Fixed
* fix(dav): Set `status` in `davResultToNode` when fileid is negative \([\#985](https://github.com/nextcloud-libraries/nextcloud-files/pull/985)\)
* fix: When sorting by filename the extension should only be considered if the basename is equal \([\#984](https://github.com/nextcloud-libraries/nextcloud-files/pull/984)\)

### Changed
* Add SPDX headers \([\#980](https://github.com/nextcloud-libraries/nextcloud-files/pull/980)\)
* Updated development dependencies

## 3.4.1 - 2024-06-05
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.4.0...v3.4.1

### Fixed
* fix(node): remove auto mtime update on attributes change and allow mtime set by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/974

### Changed
* chore(deps-dev): Bump vite from 5.2.11 to 5.2.12 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/971
* chore(deps-dev): Bump @types/node from 20.12.12 to 20.13.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/970
* chore(deps-dev): Bump jsdom from 24.0.0 to 24.1.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/972

## 3.4.0 - 2024-05-29
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.3.1...v3.4.0

### Added
* feat: Add `sortNodes` and generic `orderBy` by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/961

### Fixed
* fix(Node): Do not drop readonly attributes but only forbid updating them by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/967

### Changed
* chore(deps-dev): Bump @codecov/vite-plugin from 0.0.1-beta.6 to 0.0.1-beta.8 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/965
* chore(deps-dev): Bump fast-xml-parser from 4.3.6 to 4.4.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/966

## 3.3.1 - 2024-05-23
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.3.0...v3.3.1

### Fixed
* fix: Export `NewMenuEntryCategory` from package by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/960

## 3.3.0 - 2024-05-21
### Added
* feat: Add and export `isFilenameValid` function by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/951
* feat(files): allow updating attributes by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/947
* feat(new-menu): Allow to set the category for entries by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/952

### Fixed
* fix: Update workflows from organization by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/932
* fix(fileAction): cover parent getter in tests by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/950
* fix(navigation): files import by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/949
* fix(dav): Add fallback for owner of dav nodes on public shares by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/959

### Changed
* feat(ci): add codecov bundler by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/948

### Dependencies
* chore(deps): Bump @nextcloud/auth from 2.2.1 to 2.3.0 by @dependabot
* chore(deps): Bump @nextcloud/l10n from 2.2.0 to 3.1.0 by @dependabot
* chore(deps): Bump @nextcloud/logger from 2.7.0  to 3.0.2 by @dependabot
* chore(deps): Bump @nextcloud/router from 3.0.0 to 3.0.1 by @dependabot
* chore(deps): Bump is-svg from 5.0.0 to 5.0.1 by @dependabot
* chore(deps): Bump webdav from 5.5.0 to 5.6.0 by @dependabot

**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.2.1...v3.3.0

## 3.2.1 - 2024-04-22
### Changed
* fix: Update NPM version to LTS version 10
* Updated development dependencies

## 3.2.0 - 2024-04-15
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.1.1...v3.2.0

### Enhancements
* feat(dav): Make getFavoriteNodes cancelable by @Pytal in https://github.com/nextcloud-libraries/nextcloud-files/pull/923

## Changed
* Updated webdav from 5.4.0 to 5.5.0
* Updated development dependencies

## 3.1.1 - 2024-03-24
### Fixed
* fix(dav): various typings and owner string cast by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/882
* fix(dav): remove sharing attributes from default dav fetch and change duplicate registration from `error` to `warn` by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/902

### Changed
* Update `@nextcloud/router` from 2.2.1 to 3.0.0
* Update `webdav` from 5.3.2 to 5.4.0

## 3.1.0 - 2023-12-21
### Enhancements
* enh(dav): Allow to set custom headers when creating the DAV client by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/849

### Fixed
* fix(Node): Handle slash as root path for public webdav endpoint by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/847
* fix(dav): davResultToNode real owner by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/862

## Changed
* Update webdav from 5.3.0 to 5.3.1
* Update dev dependencies

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
