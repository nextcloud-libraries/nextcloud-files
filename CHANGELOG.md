<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# Changelog

All notable changes to this project will be documented in this file.

## 4.0.0 (UNRELEASED)
### 📝 Notes
* This package now is a pure ES module.
* Due to breaking changes this major version is only compatible with
  the files app of Nextcloud 33 or later.
* The Node API was changed, the `root` property of any node,
  including `File` or `Folder`, is now required.
* All methods now also accept the interface of the provided classes,
  meaning instead of accepting `View` they accept the more generic
  `IView` interface. This allows better integration with frameworks
  and custom implementations of the interface where needed.

#### DAV related export
The DAV related exports from the main entry point were deprecated
for a long time and are now removed from it.
Instead you have to use the `@nextcloud/files/dav` entry point.

For example:

```diff
- import { davRemoteURL } from '@nextcloud/files'
+ import { defaultRemoteURL } from '@nextcloud/files/dav'
```

#### File Actions API changes
The `FileAction` API has been changed to provide a more consistent
set of context to the action handlers.
We're now using destructuring objects for the context parameters.
For example:

```diff
type ActionContext = {
  nodes: INode[],
  view: IView,
  folder: IFolder,
  contents: INode[],
}

- action.exec(view: View, folder: Folder, dir: string): Promise<boolean>
+ action.exec({ nodes, view, folder, contents }): Promise<boolean>
```

## 4.0.0-beta.7 - 2025-12-23
### 🐛 Fixed bugs
* fix(column): validate interface rather than the instance type [\#1442](https://github.com/nextcloud-libraries/nextcloud-files/pull/1442) \([susnux](https://github.com/susnux)\)

### Other changes
* refactor(column): use interfaces rather than instances [\#1443](https://github.com/nextcloud-libraries/nextcloud-files/pull/1443) \([susnux](https://github.com/susnux)\)

## 4.0.0-beta.6 - 2025-12-22
### 🐛 Fixed bugs
* fix(view): ensure all optional properties are validated [\#1438](https://github.com/nextcloud-libraries/nextcloud-files/pull/1438) \([susnux](https://github.com/susnux)\)

### Other changes
* chore: adjust types to only use interfaces if possible [\#1440](https://github.com/nextcloud-libraries/nextcloud-files/pull/1440) \([susnux](https://github.com/susnux)\)
* ci: add workflow to check for Typescript issues [\#1439](https://github.com/nextcloud-libraries/nextcloud-files/pull/1439) \([susnux](https://github.com/susnux)\)

## 4.0.0-beta.5 - 2025-12-16
### 💥 Breaking changes
* refactor!(navigation): pass `id` of view to `setActive` [\#1418](https://github.com/nextcloud-libraries/nextcloud-files/pull/1418) \([susnux](https://github.com/susnux)\)
* refactor!: migrate from cancelable promise to AbortSignal [\#1428](https://github.com/nextcloud-libraries/nextcloud-files/pull/1428) \([susnux](https://github.com/susnux)\)
* chore!: remove commonjs entry point [\#1420](https://github.com/nextcloud-libraries/nextcloud-files/pull/1420) \([susnux](https://github.com/susnux)\)

### 🚀 Enhancements
* feat(sidebar): provide public API to register a sidebar tab with web components [\#1419](https://github.com/nextcloud-libraries/nextcloud-files/pull/1419) \([susnux](https://github.com/susnux)\)
* feat(sidebar): provide a proxy for the files sidebar [\#1306](https://github.com/nextcloud-libraries/nextcloud-files/pull/1306) \([susnux](https://github.com/susnux)\)

### Other changes
* refactor: use interfaces where possible instead of instances [\#1417](https://github.com/nextcloud-libraries/nextcloud-files/pull/1417) \([susnux](https://github.com/susnux)\)
* refactor: drop dependency on Node modules [\#1421](https://github.com/nextcloud-libraries/nextcloud-files/pull/1421) \([susnux](https://github.com/susnux)\)
* ci: update dependencies also on stable3 [\#1400](https://github.com/nextcloud-libraries/nextcloud-files/pull/1400) \([susnux](https://github.com/susnux)\)
* ci: drop npm token publishing and use trusted publisher [\#1416](https://github.com/nextcloud-libraries/nextcloud-files/pull/1416)
* Updated dependencies:
  * Bump `@nextcloud/logger` to 3.0.3
  * Bump `@nextcloud/paths` to 3.0.0

## 4.0.0-beta.4 - 2025-12-09
### 🐛 Fixed bugs
* fix(node): better special character encoding and detection [\#1398](https://github.com/nextcloud-libraries/nextcloud-files/pull/1398) \([skjnldsv](https://github.com/skjnldsv)\)

## 4.0.0-beta.3 - 2025-12-03
### 💥 Breaking changes
* refactor(Node)!: make `Node.root` a required attribute [\#1388](https://github.com/nextcloud-libraries/nextcloud-files/pull/1388) \([susnux](https://github.com/susnux)\)

### 🐛 Fixed bugs
* fix(actions): only pass a single node to renderInline [\#1391](https://github.com/nextcloud-libraries/nextcloud-files/pull/1391) \([skjnldsv](https://github.com/skjnldsv)\)
* fix(actions): add back nodes contents to view action params [\#1392](https://github.com/nextcloud-libraries/nextcloud-files/pull/1392) \([skjnldsv](https://github.com/skjnldsv)\)

### Other changes
* chore(Node)!: remove deprecated `isDavRessource` [\#1390](https://github.com/nextcloud-libraries/nextcloud-files/pull/1390) \([susnux](https://github.com/susnux)\)
* chore(deps): align and update vitest dependencies [\#1389](https://github.com/nextcloud-libraries/nextcloud-files/pull/1389) \([susnux](https://github.com/susnux)\)

## 4.0.0-beta.2 - 2025-11-27
### 💥 Breaking changes
* chore!: drop deprecated DAV exports from main entry point [\#1384](https://github.com/nextcloud-libraries/nextcloud-files/pull/1384) \([susnux](https://github.com/susnux)\)
* chore!: remove deprecated filename validation fallbacks for Nextcloud 29 and below [\#1383](https://github.com/nextcloud-libraries/nextcloud-files/pull/1383) \([susnux](https://github.com/susnux)\)
* chore!: remove deprecated `NewMenuEntry.iconClass` [\#1385](https://github.com/nextcloud-libraries/nextcloud-files/pull/1385) \([susnux](https://github.com/susnux)\)

### Other changes
* fix(actions): rename content to contents [\#1386](https://github.com/nextcloud-libraries/nextcloud-files/pull/1386) \([skjnldsv](https://github.com/skjnldsv)\)

## 4.0.0-beta.1 - 2025-11-27
### 🐛 Fixed bugs
* fix: actions type exports [\#1381](https://github.com/nextcloud-libraries/nextcloud-files/pull/1381) \([skjnldsv](https://github.com/skjnldsv)\)

## 4.0.0-beta.0 - 2025-11-27
### 💥 Breaking changes
* fix(node): cloning [\#1348](https://github.com/nextcloud-libraries/nextcloud-files/pull/1348) \([skjnldsv](https://github.com/skjnldsv)\)
* feat(actions): standardize contexts [\#1124](https://github.com/nextcloud-libraries/nextcloud-files/pull/1124) \([skjnldsv](https://github.com/skjnldsv)\)

### 🚀 Enhancements
* feat(node): allow to cast as JSON [\#1349](https://github.com/nextcloud-libraries/nextcloud-files/pull/1349) \([skjnldsv](https://github.com/skjnldsv)\)

### 🐛 Fixed bugs
* fix(sortNodes): do not trim "extension" of folder names [\#1291](https://github.com/nextcloud-libraries/nextcloud-files/pull/1291) \([susnux](https://github.com/susnux)\)

### Other changes
* chore: align devEngines with apps [\#1355](https://github.com/nextcloud-libraries/nextcloud-files/pull/1355) \([susnux](https://github.com/susnux)\)
* chore: remove legacy node attributes deprecation [\#1379](https://github.com/nextcloud-libraries/nextcloud-files/pull/1379) \([skjnldsv](https://github.com/skjnldsv)\)
* chore: work around bug in `corepack` blocking dependency updates [\#1292](https://github.com/nextcloud-libraries/nextcloud-files/pull/1292) \([susnux](https://github.com/susnux)\)
* docs(View): improve documentation of `View.emptyView` [\#1290](https://github.com/nextcloud-libraries/nextcloud-files/pull/1290) \([susnux](https://github.com/susnux)\)
* chore(deps): Bump @nextcloud/auth from 2.5.1 to 2.5.3
* chore(deps): Bump @nextcloud/capabilities from 1.2.0 to 1.2.1
* chore(deps): Bump @nextcloud/l10n from 3.3.0 to 3.4.1
* chore(deps): Bump @nextcloud/paths from 2.2.1 to 2.3.0
* chore(deps): Bump @nextcloud/router from 3.0.1 to 3.1.0
* chore(deps): Bump @nextcloud/sharing from 0.2.4 to 0.3.0
* chore(deps): Bump brace-expansion
* chore(deps): Bump is-svg from 6.0.0 to 6.1.0

## 3.12.1 - 2025-12-11
### 🐛 Fixed bugs
* fix(sortNodes): do not trim "extension" of folder names [\#1291](https://github.com/nextcloud-libraries/nextcloud-files/pull/1291) \([susnux](https://github.com/susnux)\)

### Changed
* docs(View): improve documentation of `View.emptyView` [\#1290](https://github.com/nextcloud-libraries/nextcloud-files/pull/1290) \([susnux](https://github.com/susnux)\)
* chore: work around bug in `corepack` blocking dependency updates [\#1292](https://github.com/nextcloud-libraries/nextcloud-files/pull/1292) \([susnux](https://github.com/susnux)\)
* ci: update workflows from organization [\#1354](https://github.com/nextcloud-libraries/nextcloud-files/pull/1354) \([susnux](https://github.com/susnux)\)
* chore: align devEngines with apps [\#1355](https://github.com/nextcloud-libraries/nextcloud-files/pull/1355) \([susnux](https://github.com/susnux)\)
* Updated dependencies:
  * Bump `is-svg` to 6.1.0
  * Bump `@nextcloud/sharing` to to 0.3.0
  * Bump `@nextcloud/auth` to to 2.5.3
  * Bump `@nextcloud/l10n` to to 3.4.1
  * Bump `@nextcloud/capabilities` to to 1.2.1
  * Bump `@nextcloud/router` to to 3.1.0
  * Bump `@nextcloud/paths` to to 2.3.0

## 3.12.0 - 2025-07-24
### 🚀 Enhancements
* feat(actions): allow to define hotkey for file action [\#1288](https://github.com/nextcloud-libraries/nextcloud-files/pull/1288) \([susnux](https://github.com/susnux)\)

### 🐛 Fixed bugs
* fix(sorting): also check attributes [\#1285](https://github.com/nextcloud-libraries/nextcloud-files/pull/1285) \([skjnldsv](https://github.com/skjnldsv)\)
* fix(sorting): adjust attribute fallback condition [\#1286](https://github.com/nextcloud-libraries/nextcloud-files/pull/1286) \([skjnldsv](https://github.com/skjnldsv)\)

### Other changes
* refactor: restructure source files [\#1287](https://github.com/nextcloud-libraries/nextcloud-files/pull/1287) \([susnux](https://github.com/susnux)\)

## 3.11.0 - 2025-07-02
### 🚀 Enhancements
* feat: allow changing Node mime type [\#1234](https://github.com/nextcloud-libraries/nextcloud-files/pull/1234) \([skjnldsv](https://github.com/skjnldsv)\)
* feat(view): add `hidden` attribute to the View [\#1281](https://github.com/nextcloud-libraries/nextcloud-files/pull/1281) \([susnux](https://github.com/susnux)\)

### Fixed
* fix(sorting): fallback basename to empty string just in case [\#1197](https://github.com/nextcloud-libraries/nextcloud-files/pull/1197) \([skjnldsv](https://github.com/skjnldsv)\)
* fix: also validate Node data on setter  [\#1235](https://github.com/nextcloud-libraries/nextcloud-files/pull/1235) \([skjnldsv](https://github.com/skjnldsv)\)
* fix: do not update mtime on move/rename [\#1236](https://github.com/nextcloud-libraries/nextcloud-files/pull/1236) \([skjnldsv](https://github.com/skjnldsv)\)

### Changed
* chore: update node version to all supported ones and add `devEngines` [\#1282](https://github.com/nextcloud-libraries/nextcloud-files/pull/1282) \([susnux](https://github.com/susnux)\)
* chore: make `package.json` consistent and update authors [\#1280](https://github.com/nextcloud-libraries/nextcloud-files/pull/1280) \([susnux](https://github.com/susnux)\)
* chore(deps): Bump @nextcloud/auth to 2.5.1
* chore(deps): Bump @nextcloud/l10n to 3.3.0
* chore(deps): Bump is-svg to 6.0.0
* chore(deps): Bump webdav to 5.8.0

## 3.10.2 - 2025-02-13
### Fixed
* fix: ensure FileListAction return `bool|null` on `exec` [\#1145](https://github.com/nextcloud-libraries/nextcloud-files/pull/1145) \([skjnldsv](https://github.com/skjnldsv)\)
* fix: Correctly export DAV types [\#1176](https://github.com/nextcloud-libraries/nextcloud-files/pull/1176) \([susnux](https://github.com/susnux)\)
* fix(deps): typedoc-plugin-missing-exports as dev dependency [\#1183](https://github.com/nextcloud-libraries/nextcloud-files/pull/1183) \([max-nextcloud](https://github.com/max-nextcloud)\)

### Changed
* Updated development dependencies
* chore(deps): Bump `@nextcloud/sharing` to 0.2.4
* ci: Update workflows from organization [\#1177](https://github.com/nextcloud-libraries/nextcloud-files/pull/1177) \([susnux](https://github.com/susnux)\)

## 3.10.1 - 2024-12-12
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.10.0...v3.10.1)

## Fixed
* fix: Allow omitting icon for file list actions [\#1143](https://github.com/nextcloud-libraries/nextcloud-files/pull/1143) \([Pytal](https://github.com/Pytal)\)
* fix: Do not rollup types [\#1142](https://github.com/nextcloud-libraries/nextcloud-files/pull/1142) \([@susnux](https://github.com/susnux)\)
* fix: Make types of File and Folder more explicit [\#1118](https://github.com/nextcloud-libraries/nextcloud-files/pull/1118) \([@susnux](https://github.com/susnux)\)
* fix: Typo in method name `isDavResource` instead of `isDavRessource` [\#1119](https://github.com/nextcloud-libraries/nextcloud-files/pull/1119) \([@susnux](https://github.com/susnux)\)
* fix(fileListAction): keep same method param pattern accross our APIs [\#1135](https://github.com/nextcloud-libraries/nextcloud-files/pull/1135) \([@skjnldsv](https://github.com/skjnldsv)\)

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
* chore(deps): Bump `dompurify` to 3.1.6

## 3.9.2 - 2024-11-13

### Changed
* Updated development dependencies
* Fix published package

## 3.9.1 - 2024-10-23

Broken - do not use.

## 3.9.0 - 2024-09-04
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.8.0...v3.9.0)

### Added
* feat: Allow views to be naturally sorted [\#1053](https://github.com/nextcloud-libraries/nextcloud-files/pull/1053) \([@Pytal](https://github.com/Pytal)\)

### Changed
* chore(deps-dev): Bump `@nextcloud/vite-config` to 2.2.2
* chore(deps-dev): Bump `vite` to 5.4.0
* chore(deps): Bump `webdav` to 5.7.1
* chore(deps-dev): Bump `@types/node` to 22.2.0
* chore(deps): Bump `is-svg` to 5.1.0
* chore(deps): Bump `@nextcloud/auth` to 2.4.0
* chore(deps-dev): Bump `vite` to 5.4.1
* chore(deps-dev): Bump `@types/node` to 22.4.0
* chore(deps-dev): Bump `elliptic` to 6.5.7
* chore(deps-dev): Bump `tslib` to 2.7.0
* chore(deps-dev): Bump `@types/node` to 22.5.0
* chore(deps-dev): Bump `typedoc` to 0.26.6
* chore(deps-dev): Bump `vite` to 5.4.2
* chore(deps-dev): Bump `@types/node` to 22.5.1
* Update dependabot-approve-merge.yml from main org [\#1066](https://github.com/nextcloud-libraries/nextcloud-files/pull/1066) \([@AndyScherzinger](https://github.com/AndyScherzinger)\)
* chore(deps-dev): Bump ``jsdom`` to 25.0.0

## 3.8.0 - 2024-08-08
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.7.0...v3.8.0)

### Added
* feat: Allow registration of load child views callback on view [\#1046](https://github.com/nextcloud-libraries/nextcloud-files/pull/1046) \([@Pytal](https://github.com/Pytal)\)

### Changed
* chore(deps-dev): Bump ``@vitest/coverage-istanbul`` to 2.0.4
* chore(deps-dev): Bump ``typedoc`` to 0.26.5
* chore(deps): Bump ``@nextcloud/paths`` to 2.2.1
* chore(deps): Bump ``@nextcloud/sharing`` to 0.2.3
* chore(deps-dev): Bump ``vite`` to 5.3.5
* chore(deps-dev): Bump ``jsdom`` to 24.1.1
* chore(deps-dev): Bump ``@types/node`` to 20.14.12
* chore(deps-dev): Bump ``typescript`` to 5.5.4
* chore(deps-dev): Bump ``fast-xml-parser`` to 4.4.1
* chore(deps-dev): Bump ``@vitest/coverage-istanbul`` to 2.0.5
* chore(deps): Bump ``webdav`` to 5.7.0
* chore(deps-dev): Bump ``@types/node`` to 22.1.0

## 3.7.0 - 2024-07-25
[Full changelog](https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.6.0...v3.7.0)

### Added
* feat: Implement API for file list filters [\#1027](https://github.com/nextcloud-libraries/nextcloud-files/pull/1027) \([susnux](https://github.com/susnux)\)

### Fixed
* fix(dav): Cast displayname to string in `resultToNode` [\#1028](https://github.com/nextcloud-libraries/nextcloud-files/pull/1028) \([susnux](https://github.com/susnux)\)
* fix: Correctly export public API [\#1026](https://github.com/nextcloud-libraries/nextcloud-files/pull/1026) \([susnux](https://github.com/susnux)\)

### Changed
* chore(deps): Bump ``@nextcloud/paths`` to 2.2.

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
* Bump `@nextcloud/sharing` to 0.2.
* Updated development dependencies

## 3.5.1 - 2024-06-20
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.5.0...v3.5.1

### Fixed
* fix `davResultToNode` on public shares \([\#993](https://github.com/nextcloud-libraries/nextcloud-files/pull/993)\)
* fix: make `davRootPath` and `davRemoteURL` support public shares \([\#996](https://github.com/nextcloud-libraries/nextcloud-files/pull/996)\)
* fix(dav): Add `displayname` and `creationdate` to default props \([\#991](https://github.com/nextcloud-libraries/nextcloud-files/pull/991)\)
* fix(sorting): The display name attribute is called `displayname` not `displayName` for DAV \([\#992](https://github.com/nextcloud-libraries/nextcloud-files/pull/992)\)

### Changed
* chore(deps-dev): Bump `ws` to 8.17.
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
* fix(node): remove auto mtime update on attributes change and allow mtime set [\#974](https://github.com/nextcloud-libraries/nextcloud-files/pull/974) \([@skjnldsv](https://github.com/skjnldsv)\)

### Changed
* chore(deps-dev): Bump `vite` to 5.2.12
* chore(deps-dev): Bump `@types/node` to 20.13.0
* chore(deps-dev): Bump `jsdom` to 24.1.0

## 3.4.0 - 2024-05-29
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.3.1...v3.4.0

### Added
* feat: Add `sortNodes` and generic `orderBy` [\#961](https://github.com/nextcloud-libraries/nextcloud-files/pull/961) \([@susnux](https://github.com/susnux)\)

### Fixed
* fix(Node): Do not drop readonly attributes but only forbid updating them [\#967](https://github.com/nextcloud-libraries/nextcloud-files/pull/967) \([@susnux](https://github.com/susnux)\)

### Changed
* chore(deps-dev): Bump @codecov/vite-plugin from 0.0.1-beta.6 to 0.0.1-beta.8 [\#965](https://github.com/nextcloud-libraries/nextcloud-files/pull/965) \([@dependabot](https://github.com/dependabot)\)
* chore(deps-dev): Bump `fast-xml-parser` to 4.4.0

## 3.3.1 - 2024-05-23
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.3.0...v3.3.1

### Fixed
* fix: Export `NewMenuEntryCategory` from package [\#960](https://github.com/nextcloud-libraries/nextcloud-files/pull/960) \([@susnux](https://github.com/susnux)\)

## 3.3.0 - 2024-05-21
### Added
* feat: Add and export `isFilenameValid` function [\#951](https://github.com/nextcloud-libraries/nextcloud-files/pull/951) \([@susnux](https://github.com/susnux)\)
* feat(files): allow updating attributes [\#947](https://github.com/nextcloud-libraries/nextcloud-files/pull/947) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(new-menu): Allow to set the category for entries [\#952](https://github.com/nextcloud-libraries/nextcloud-files/pull/952) \([@susnux](https://github.com/susnux)\)

### Fixed
* fix: Update workflows from organization [\#932](https://github.com/nextcloud-libraries/nextcloud-files/pull/932) \([@susnux](https://github.com/susnux)\)
* fix(fileAction): cover parent getter in tests [\#950](https://github.com/nextcloud-libraries/nextcloud-files/pull/950) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix(navigation): files import [\#949](https://github.com/nextcloud-libraries/nextcloud-files/pull/949) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix(dav): Add fallback for owner of dav nodes on public shares [\#959](https://github.com/nextcloud-libraries/nextcloud-files/pull/959) \([@susnux](https://github.com/susnux)\)

### Changed
* feat(ci): add codecov bundler [\#948](https://github.com/nextcloud-libraries/nextcloud-files/pull/948) \([@skjnldsv](https://github.com/skjnldsv)\)

### Dependencies
* chore(deps): Bump `@nextcloud/auth` to 2.3.0
* chore(deps): Bump `@nextcloud/l10n` to 3.1.0
* chore(deps): Bump `@nextcloud/logger` to 3.0.2
* chore(deps): Bump `@nextcloud/router` to 3.0.1
* chore(deps): Bump `is-svg` to 5.0.1
* chore(deps): Bump `webdav` to 5.6.0

**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.2.1...v3.3.0

## 3.2.1 - 2024-04-22
### Changed
* fix: Update NPM version to LTS version 10
* Updated development dependencies

## 3.2.0 - 2024-04-15
**Full Changelog**: https://github.com/nextcloud-libraries/nextcloud-files/compare/v3.1.1...v3.2.0

### Enhancements
* feat(dav): Make getFavoriteNodes cancelable [\#923](https://github.com/nextcloud-libraries/nextcloud-files/pull/923) \([@Pytal](https://github.com/Pytal)\)

## Changed
* Updated webdav from 5.4.0 to 5.5.0
* Updated development dependencies

## 3.1.1 - 2024-03-24
### Fixed
* fix(dav): various typings and owner string cast [\#882](https://github.com/nextcloud-libraries/nextcloud-files/pull/882) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix(dav): remove sharing attributes from default dav fetch and change duplicate registration from `error` to `warn` [\#902](https://github.com/nextcloud-libraries/nextcloud-files/pull/902) \([@skjnldsv](https://github.com/skjnldsv)\)

### Changed
* Update `@nextcloud/router` from 2.2.1 to 3.0.0
* Update `webdav` from 5.3.2 to 5.4.0

## 3.1.0 - 2023-12-21
### Enhancements
* enh(dav): Allow to set custom headers when creating the DAV client [\#849](https://github.com/nextcloud-libraries/nextcloud-files/pull/849) \([@susnux](https://github.com/susnux)\)

### Fixed
* fix(Node): Handle slash as root path for public webdav endpoint [\#847](https://github.com/nextcloud-libraries/nextcloud-files/pull/847) \([@susnux](https://github.com/susnux)\)
* fix(dav): davResultToNode real owner [\#862](https://github.com/nextcloud-libraries/nextcloud-files/pull/862) \([@skjnldsv](https://github.com/skjnldsv)\)

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
* Add context to getEntries [\#484](https://github.com/nextcloud-libraries/nextcloud-files/pull/484) \([@skjnldsv](https://github.com/skjnldsv)\)
* Add DAV functions for fetching nodes from Nextcloud [\#706](https://github.com/nextcloud-libraries/nextcloud-files/pull/706) \([@susnux](https://github.com/susnux)\)
* Add File and Folder API [\#501](https://github.com/nextcloud-libraries/nextcloud-files/pull/501) \([@skjnldsv](https://github.com/skjnldsv)\)
* Add newFileMenu and refactor library with rollup [\#420](https://github.com/nextcloud-libraries/nextcloud-files/pull/420) \([@skjnldsv](https://github.com/skjnldsv)\)
* Also use context from exposed method [\#486](https://github.com/nextcloud-libraries/nextcloud-files/pull/486) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat: add action title [\#767](https://github.com/nextcloud-libraries/nextcloud-files/pull/767) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat: add FileListHeader [\#717](https://github.com/nextcloud-libraries/nextcloud-files/pull/717) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat: migrate Navigation and update FileAction from server [\#732](https://github.com/nextcloud-libraries/nextcloud-files/pull/732) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat: provide fileList names as newFileMenu handler argument [\#752](https://github.com/nextcloud-libraries/nextcloud-files/pull/752) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat: support nested actions [\#814](https://github.com/nextcloud-libraries/nextcloud-files/pull/814) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat: support new file menu entry order [\#781](https://github.com/nextcloud-libraries/nextcloud-files/pull/781) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat: use Folder as filemenu context [\#731](https://github.com/nextcloud-libraries/nextcloud-files/pull/731) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(actions): also test doc build on pull requests [\#621](https://github.com/nextcloud-libraries/nextcloud-files/pull/621) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(dav): Add "recent files" SEARCH payload as an export [\#710](https://github.com/nextcloud-libraries/nextcloud-files/pull/710) \([@susnux](https://github.com/susnux)\)
* feat(FileAction): add file action support [\#608](https://github.com/nextcloud-libraries/nextcloud-files/pull/608) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(files): add encodedSource [\#794](https://github.com/nextcloud-libraries/nextcloud-files/pull/794) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(files): add node status [\#744](https://github.com/nextcloud-libraries/nextcloud-files/pull/744) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(files): update mtime on attributes tampering [\#602](https://github.com/nextcloud-libraries/nextcloud-files/pull/602) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(node): allow and recommend to provide a specific root [\#574](https://github.com/nextcloud-libraries/nextcloud-files/pull/574) \([@skjnldsv](https://github.com/skjnldsv)\)
* feat(parseFileSize): Added `parseFileSize` function to parse a human readable file size to number of bytes [\#769](https://github.com/nextcloud-libraries/nextcloud-files/pull/769) \([@susnux](https://github.com/susnux)\)
* feat(permissions): add webdav permissions parser [\#565](https://github.com/nextcloud-libraries/nextcloud-files/pull/565) \([@skjnldsv](https://github.com/skjnldsv)\)

### Fixed
* Fix `resultToNode` by adding some documenation how to use [\#741](https://github.com/nextcloud-libraries/nextcloud-files/pull/741) \([@susnux](https://github.com/susnux)\)
* Fix decimal prefixes and add option for binary prefixes per IEC 80000-13 [\#536](https://github.com/nextcloud-libraries/nextcloud-files/pull/536) \([@Zipdox](https://github.com/Zipdox)\)
* Fix templateName usage and errors strings [\#494](https://github.com/nextcloud-libraries/nextcloud-files/pull/494) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: allow undefined properties in File and Folder [\#683](https://github.com/nextcloud-libraries/nextcloud-files/pull/683) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: also export Node [\#573](https://github.com/nextcloud-libraries/nextcloud-files/pull/573) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: Bring back Typescript definitions [\#712](https://github.com/nextcloud-libraries/nextcloud-files/pull/712) \([@susnux](https://github.com/susnux)\)
* fix: Do not export the declaration of window.OC [\#667](https://github.com/nextcloud-libraries/nextcloud-files/pull/667) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: do not update mtime if not already defined [\#709](https://github.com/nextcloud-libraries/nextcloud-files/pull/709) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: fileid definition and fallback [\#681](https://github.com/nextcloud-libraries/nextcloud-files/pull/681) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: force bundle `is-svg` [\#740](https://github.com/nextcloud-libraries/nextcloud-files/pull/740) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: getNewFileMenuEntries usage [\#734](https://github.com/nextcloud-libraries/nextcloud-files/pull/734) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: headers and actions empty variable init [\#724](https://github.com/nextcloud-libraries/nextcloud-files/pull/724) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: Node import type [\#754](https://github.com/nextcloud-libraries/nextcloud-files/pull/754) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: prevent invalid roots to be defined [\#577](https://github.com/nextcloud-libraries/nextcloud-files/pull/577) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix: use Node and not string for the new file menu handler arg [\#753](https://github.com/nextcloud-libraries/nextcloud-files/pull/753) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix!(humanFileSize): Revert changes to default file sizes [\#822](https://github.com/nextcloud-libraries/nextcloud-files/pull/822) \([@susnux](https://github.com/susnux)\)
* fix(dav): Fix DAV functions to make work with them easier [\#725](https://github.com/nextcloud-libraries/nextcloud-files/pull/725) \([@susnux](https://github.com/susnux)\)
* fix(dav): use of webdav library [\#821](https://github.com/nextcloud-libraries/nextcloud-files/pull/821) \([@pulsejet](https://github.com/pulsejet)\)
* fix(fileActions): improve typing and add silent actions [\#625](https://github.com/nextcloud-libraries/nextcloud-files/pull/625) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix(formatFileSize): Fix default value for `binaryPrefixes` [\#770](https://github.com/nextcloud-libraries/nextcloud-files/pull/770) \([@susnux](https://github.com/susnux)\)
* fix(newfilemenu): better sorting and proper fallback to displayName [\#806](https://github.com/nextcloud-libraries/nextcloud-files/pull/806) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix(newfilemenu): fix handler requirement, deprecate iconClass and fix context [\#742](https://github.com/nextcloud-libraries/nextcloud-files/pull/742) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix(node): allow negative file ids [\#716](https://github.com/nextcloud-libraries/nextcloud-files/pull/716) \([@skjnldsv](https://github.com/skjnldsv)\)
* fix(node): default permissions should be NONE and fix undefined return [\#630](https://github.com/nextcloud-libraries/nextcloud-files/pull/630) \([@skjnldsv](https://github.com/skjnldsv)\)
* Replace deprecated String.prototype.substr() [\#390](https://github.com/nextcloud-libraries/nextcloud-files/pull/390) \([@CommanderRoot](https://github.com/CommanderRoot)\)

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
