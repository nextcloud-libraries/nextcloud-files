# Changelog

All notable changes to this project will be documented in this file.

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
