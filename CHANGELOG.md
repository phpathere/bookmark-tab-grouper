# Changelog

All notable changes to Tab Bookmark Grouper are documented in this file.

This project follows a practical release history format so users, reviewers, and future maintainers can understand what changed between Chrome Web Store uploads.

## [1.0.1] - 2026-07-02

### Added
- Added a clearer Chrome Web Store and GitHub Pages asset set for the Tab Bookmark Grouper name.
- Added automated tests for import normalization, URL validation, empty-tab reuse, partial import failures, and Chrome API mock behavior.
- Added stricter release packaging checks so the uploaded ZIP is rebuilt from the current `manifest.json` version and verified before upload.

### Changed
- Renamed the public extension name from the Vietnamese listing name to `Tab Bookmark Grouper`.
- Improved the `Group by Domain` action so one click creates the final organized state.
- Sorted tab groups alphabetically after grouping.
- Moved loose, ungrouped tabs after grouped tabs for a cleaner `Groups first, loose tabs last` layout.
- Normalized subdomains into one root-domain group, for example `google.com`, `www.google.com`, and `mail.google.com` now map to `Google`.
- Improved import/session handling to continue restoring supported tabs when individual tabs, groups, or windows fail.
- Updated privacy and store-facing copy to use more accurate local-first wording.

### Fixed
- Fixed duplicate domain groups, such as two separate `Google` groups.
- Fixed the first-click Group by Domain sorting issue where loose tabs could remain between groups until the second click.
- Fixed empty startup tab behavior when opening bookmark folders or importing exported sessions.
- Fixed stale release artifacts by deleting old ZIP files before each release build.
- Fixed incomplete privacy contact copy by using `phpathere@gmail.com`.

### Security and Privacy
- Kept all bookmark, tab, and session processing local to the user's browser.
- Confirmed the release package does not load remote JavaScript, remote CSS, Google Fonts, analytics SDKs, or external APIs.
- Documented store-facing asset provenance in `THIRD_PARTY_ASSETS.md`.

## [1.0.0] - 2026-07-01

### Added
- Initial Chrome Web Store release.
- Open a selected bookmark folder into Chrome tabs.
- Group opened bookmark tabs into a named Chrome Tab Group.
- Group currently open tabs by website/domain.
- Undo the most recent automatic domain grouping action.
- Export supported windows, tabs, and groups into a local `.btg` session file.
- Import supported `.btg` session files.
- English and Vietnamese UI copy.
- Light, dark, and auto theme settings.
- Local-first privacy policy and Chrome Web Store listing copy.
