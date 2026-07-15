# Changelog

All notable changes to Tab Bookmark Grouper are documented in this file.

This project follows a practical release history format so users, reviewers, and future maintainers can understand what changed between Chrome Web Store uploads.

## [1.0.4] - 2026-07-15

### Fixed
- Capture and validate the exact active tab before writing a `.btg` export.
- Activate the restored tab, focus its window, then verify and retry activation if Chrome selected another tab.
- Verify A-to-Z group order after every import or domain-group action and use a tab-level fallback when group movement is not applied.
- Keep pinned tabs first, alphabetized groups second, and loose tabs last.
- Run session restoration in the MV3 service worker so focusing the restored window cannot terminate the import with the popup lifecycle.

## [1.0.3] - 2026-07-14

### Changed
- Hardened bookmark-folder opening with tab limits, partial-failure reporting, and safer progress feedback.
- Fixed export success handling so interrupted downloads are reported instead of shown as successful.
- Improved domain-group undo by restoring affected pre-existing groups and their metadata.
- Reduced production console noise and capped user-facing error details.
- Stabilized the landing-page demo header on mobile and optimized below-the-fold image loading.
- Anchored the post-demo pointer to the grouped tab-count badge, corrected the initial `0 tab` label, and added a non-reflow hover lift for the tab currently being collected.
- Refined the pointer placement so it points upward from below the count badge without covering the grouped label, and reduced the active-tab lift to a subtle hover distance.
- Redacted and capped import error details before logging or displaying them, and added reduced-motion handling for the popup and landing page.
- Fixed active-first session imports by restoring every tab and group before activating the exported tab, preventing early popup interruption and lost loose tabs.
- Kept post-group ordering deterministic: pinned tabs first, groups alphabetically from left to right, and loose tabs last.
- Preserved the active tab by a serialized group/tab reference, including duplicate URLs, and added a safe fallback for supported `chrome://` and `edge://` pages such as Extensions and Downloads.
- Export now captures the source tab as soon as the toolbar popup opens and writes its group/tab reference directly while serializing the session.
- Import activates the restored tab before focusing its window and falls back safely to the exported URL if a sanitized session changes an index.
- Sort groups deterministically by prepending them in reverse alphabetical order, producing A-to-Z groups from left to right before loose tabs.
- Apply the same alphabetical group ordering after session import.

## [1.0.2] - 2026-07-02

### Changed
- Prepared the next Chrome Web Store upload as a maintenance release.
- Added clearer public release history through `CHANGELOG.md`.
- Added Chrome Web Store release notes for version history transparency.
- Rebuilt the release ZIP from the current source after automated tests passed.

### Notes
- No new runtime permissions were added.
- No external servers, analytics, remote scripts, or remote fonts were added.

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
