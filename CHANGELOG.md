# Changelog

All notable changes to this project will be documented in this file.

## 3.0.0-beta.27 - 2023-11-03
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.26...v3.0.0-beta.27)

### Enhancements
* feat: support nested actions by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/814

### Fixed
* fix(humanFileSize): Revert changes to default file sizes by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/822
* fix(newfilemenu): better sorting and proper fallback to displayName by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/806

### Dependencies
* chore(deps-dev): Bump @babel/traverse from 7.22.8 to 7.23.2 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/812
* chore(deps-dev): Bump @nextcloud/eslint-config from 8.3.0-beta.2 to 8.3.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/787
* chore(deps-dev): Bump @nextcloud/vite-config from 1.0.1 to 1.1.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/818
* chore(deps-dev): Bump @rollup-extras/plugin-clean from 1.3.8 to 1.3.9 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/810
* chore(deps-dev): Bump @rollup/plugin-commonjs from 25.0.4 to 25.0.7 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/811
* chore(deps-dev): Bump @rollup/plugin-node-resolve from 15.2.2 to 15.2.3 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/807
* chore(deps-dev): Bump @types/node from 20.8.3 to 20.8.9 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/819
* chore(deps-dev): Bump browserify-sign from 4.2.1 to 4.2.2 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/820
* chore(deps-dev): Bump rollup from 3.29.4 to 4.1.4 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/813
* chore(deps-dev): Bump typedoc from 0.25.1 to 0.25.2 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/808
* chore(deps-dev): Bump vite from 4.4.11 to 4.5.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/816
* chore(deps): Bump @nextcloud/router from 2.1.2 to 2.2.0 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/817

## 3.0.0-beta.26 - 2023-10-11
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.25...v3.0.0-beta.26)

### Enhancements
* feat: support new file menu entry order by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/781

### Dependencies
* chore(deps): Bump postcss from 8.4.27 to 8.4.31 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/796
* chore(deps-dev): Bump @nextcloud/vite-config from 1.0.0-beta.19 to 1.0.1 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/805
* chore(deps-dev): Bump @rollup-extras/plugin-clean from 1.3.7 to 1.3.8 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/797
* chore(deps-dev): Bump @rollup/plugin-node-resolve from 15.2.1 to 15.2.2 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/803
* chore(deps-dev): Bump @rollup/plugin-typescript from 11.1.4 to 11.1.5 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/801
* chore(deps-dev): Bump @types/node from 20.7.2 to 20.8.3 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/804
* chore(deps-dev): Bump fast-xml-parser from 4.3.1 to 4.3.2 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/802
* chore(deps-dev): Bump vite from 4.4.9 to 4.4.11 by @dependabot in https://github.com/nextcloud-libraries/nextcloud-files/pull/800

## 3.0.0-beta.25 - 2023-10-03
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.24...v3.0.0-beta.25)

### Enhancements
* feat(files): add encodedSource by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/794

## 3.0.0-beta.24 - 2023-09-25
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.23...v3.0.0-beta.24)

### Fixed
* docs: update documentation link by @kesselb in https://github.com/nextcloud-libraries/nextcloud-files/pull/780
* Fix export of `parseFileSize`

## 3.0.0-beta.23 - 2023-09-25
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.22...v3.0.0-beta.23)

### Enhancements
* feat(parseFileSize): Added parseFileSize function to parse a human readable file size to number of bytes [\#769](https://github.com/nextcloud-libraries/nextcloud-files/pull/769) \([\@susnux](https://github.com/susnux)\)

### Fixed
* fix(formatFileSize): Fix default value for binaryPrefixes [\#770](https://github.com/nextcloud-libraries/nextcloud-files/pull/770) \([\@susnux](https://github.com/susnux)\)
* fix: Node import type [\#754](https://github.com/nextcloud-libraries/nextcloud-files/pull/754) \([\@skjnldsv](https://github.com/skjnldsv)\)

## 3.0.0-beta.22 - 2023-09-20
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.21...v3.0.0-beta.22)

### Enhancements
* feat: add action title [\#767](https://github.com/nextcloud-libraries/nextcloud-files/pull/767) \([\@skjnldsv](https://github.com/skjnldsv)\)

## 3.0.0-beta.21 - 2023-09-01
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.20...v3.0.0-beta.21)

### Fixed
* fix: use Node and not string for the new file menu handler arg by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/753

## 3.0.0-beta.20 - 2023-08-29
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.19...v3.0.0-beta.20)

### Enhancements
* feat(files): add node status by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/744
* feat: provide fileList names as newFileMenu handler argument by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/752

## 3.0.0-beta.19 - 2023-08-24
[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.18...v3.0.0-beta.19)

### Fixed
* fix(dav): Fix resultToNode by adding some documenation how to use [\#741](https://github.com/nextcloud-libraries/nextcloud-files/pull/741) \([\@susnux](https://github.com/susnux)\)
* fix(newfilemenu): fix handler requirement, deprecate iconClass and fix context [\#742](https://github.com/nextcloud-libraries/nextcloud-files/pull/742) \([\@skjnldsv](https://github.com/skjnldsv)\)

## 3.0.0-beta.18 - 2023-08-23

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.17...v3.0.0-beta.18)

### Fixed
* fix: force bundle is-svg [\#740](https://github.com/nextcloud-libraries/nextcloud-files/pull/740) \([\@skjnldsv](https://github.com/skjnldsv)\)

## 3.0.0-beta.17 - 2023-08-23

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.16...v3.0.0-beta.17)

### Fixed
* fix: getNewFileMenuEntries usage [\#734](https://github.com/nextcloud-libraries/nextcloud-files/pull/734) \([\@skjnldsv](https://github.com/skjnldsv)\)

## 3.0.0-beta.16 - 2023-08-18

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.15...v3.0.0-beta.16)

### Enhancements
* feat: migrate Navigation and update FileAction from server by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/732
### Fixed
* fix(dav): Fix DAV functions to make work with them easier by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/725

## 3.0.0-beta.15 - 2023-08-18

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.14...v3.0.0-beta.15)

### Fixed
* fix: headers and actions empty variable init by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/724

### Enhancements
* feat: use Folder as filemenu context by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/731
* Various dependencies

## 3.0.0-beta.14 - 2023-08-09

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.13...v3.0.0-beta.14)

### Changed
* feat: add FileListHeader by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/717
* Various dependencies

## 3.0.0-beta.13 - 2023-08-03

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.12...v3.0.0-beta.13)

### Fixed
* fix(node): allow negative file ids by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/716
* fix: Move to `@nextcloud/vite-config` after package was transfered by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/715

## 3.0.0-beta.12 - 2023-08-01

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.11...v3.0.0-beta.12)

### Enhancements
* feat(dav): Add "recent files" SEARCH payload as an export by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/710

### Fixed
* fix: allow undefined properties in File and Folder by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/683
* fix: Bring back Typescript definitions by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/712
* fix: do not update mtime if not already defined by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/709

### Changed
* Add DAV functions for fetching nodes from Nextcloud by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/706
* chore: Cleanup package and make it a native ESM package by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/704
* chore: Drop babel dependency - not used anyways by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/703
* chore: Fix URLs after package got transfered by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/713
* docs: Add badge for documentation containing a link to it by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/708
* Use vite and vitest for bundling and testing the package by @susnux in https://github.com/nextcloud-libraries/nextcloud-files/pull/705

## 3.0.0-beta.11 - 2023-07-04

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.10...v3.0.0-beta.11)

### Fixed
- fix: fileid definition and fallback by @skjnldsv in https://github.com/nextcloud-libraries/nextcloud-files/pull/681

## 3.0.0-beta.10 - 2023-06-14

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.9...v3.0.0-beta.10)

### Fixed
- fix: Do not export the declaration of window.OC [\#667](https://github.com/nextcloud-libraries/nextcloud-files/pull/667) ([skjnldsv](https://github.com/skjnldsv))

## 3.0.0-beta.9 - 2023-04-24

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.8...v3.0.0-beta.9)

### Enhancement
- feat(files): update mtime on attributes tampering [\#602](https://github.com/nextcloud-libraries/nextcloud-files/pull/602) ([skjnldsv](https://github.com/skjnldsv))
- feat(actions): also test doc build on pull requests [\#621](https://github.com/nextcloud-libraries/nextcloud-files/pull/621) ([skjnldsv](https://github.com/skjnldsv))

### Fixed
- fix: prevent invalid roots to be defined [\#577](https://github.com/nextcloud-libraries/nextcloud-files/pull/577) ([skjnldsv](https://github.com/skjnldsv))
- fix(fileActions): improve typing and add silent actions [\#625](https://github.com/nextcloud-libraries/nextcloud-files/pull/625) ([skjnldsv](https://github.com/skjnldsv))
- fix(node): default permissions should be NONE and fix undefined return [\#630](https://github.com/nextcloud-libraries/nextcloud-files/pull/630) ([skjnldsv](https://github.com/skjnldsv))

## 3.0.0-beta.8 - 2023-04-07

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.7...v3.0.0-beta.8)

### Enhancement
- feat(FileAction): add file action support [\#608](https://github.com/nextcloud-libraries/nextcloud-files/pull/608) ([skjnldsv](https://github.com/skjnldsv))

### Changed
- Dependency updates

## 3.0.0-beta.7 - 2023-02-03

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.0.0-beta.6...v3.0.0-beta.7)

### Enhancements
- feat\(node\): allow and recommend to provide a specific root [\#574](https://github.com/nextcloud-libraries/nextcloud-files/pull/574) ([skjnldsv](https://github.com/skjnldsv))

### Fixed
- fix: also export Node [\#573](https://github.com/nextcloud-libraries/nextcloud-files/pull/573) ([skjnldsv](https://github.com/skjnldsv))

## 3.0.0-beta.6 - 2023-01-25

[Full Changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v2.1.0...v3.0.0-beta.6)

### Enhancements
- feat\(permissions\): add webdav permissions parser [\#565](https://github.com/nextcloud-libraries/nextcloud-files/pull/565) ([skjnldsv](https://github.com/skjnldsv))
- Add File and Folder API [\#501](https://github.com/nextcloud-libraries/nextcloud-files/pull/501) ([skjnldsv](https://github.com/skjnldsv))
- Add context to getEntries [\#484](https://github.com/nextcloud-libraries/nextcloud-files/pull/484) ([skjnldsv](https://github.com/skjnldsv))
- Add newFileMenu and refactor library with rollup [\#420](https://github.com/nextcloud-libraries/nextcloud-files/pull/420) ([skjnldsv](https://github.com/skjnldsv))
- Replace deprecated String.prototype.substr\(\) [\#390](https://github.com/nextcloud-libraries/nextcloud-files/pull/390) ([CommanderRoot](https://github.com/CommanderRoot))

### Fixed
- Also use context from exposed method [\#486](https://github.com/nextcloud-libraries/nextcloud-files/pull/486) ([skjnldsv](https://github.com/skjnldsv))

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
