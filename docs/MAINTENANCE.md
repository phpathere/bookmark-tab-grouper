# Maintenance and Handoff Guide

This document explains how to understand, debug, test, release, and safely extend Tab Bookmark Grouper.

## Project Map

| Area | Files | Purpose |
| --- | --- | --- |
| Manifest | `manifest.json` | MV3 metadata, extension name/description via i18n, permissions, popup entry, service worker |
| Popup UI | `popup/index.html`, `popup/styles.css`, `popup/popup.js` | Main extension interface and user workflows |
| Session logic | `popup/session-utils.js` | URL validation, import normalization, empty-tab reuse, import restore helpers |
| Background | `background.js` | Opens `welcome.html` only on fresh install |
| Localization | `_locales/en/messages.json`, `_locales/vi/messages.json` | English/Vietnamese UI copy |
| Tests | `tests/session-utils.test.js` | Node tests for dangerous logic and Chrome API mock behavior |
| Release | `scripts/build-release.sh`, `dist/` | Build verified Chrome Web Store ZIP |
| Store/docs | `CHROMEWEBSTORE.md`, `PRIVACY.md`, `THIRD_PARTY_ASSETS.md`, `docs/` | Store listing copy, privacy, asset provenance, GitHub Pages |

## Main Runtime Workflows

### Open and Group Bookmark Folder

Entry point: `popup/popup.js`.

1. User selects a Chrome bookmark folder.
2. Popup reads bookmark children.
3. Direct links in the selected folder become one tab group named after the selected folder.
4. Each subfolder with supported URLs becomes its own tab group named after that subfolder.
5. Empty startup tabs are reused when safe.

Important invariant:

- Group names come from bookmark folder names. The code must not invent user-topic names.

### Group by Domain

Entry point: `handleGroupByDomain()` in `popup/popup.js`.

1. Read current-window tabs.
2. Build a map of existing group titles.
3. Convert web URLs into root-domain group names via `getDomainGroupName()` in `popup/session-utils.js`.
4. Merge duplicate groups with the same normalized domain title.
5. Create groups only when a domain has more than one matching tab, or when duplicate groups need merging.
6. Sort groups alphabetically.
7. Move loose tabs to the end.

Important invariant:

- Final layout should be: pinned tabs first, groups A-Z, loose tabs last.
- Repeated clicks should not create duplicate `Google`, `Github`, etc. groups.

### Export Session

Entry point: `handleExport()` in `popup/popup.js`.

Export captures:

- Windows
- Tab URLs
- Group titles/colors
- Ungrouped tabs
- Active tab URL
- Timestamp

Privacy note:

- Exported `.btg` files may contain URLs and group names. They are created only after user action.

### Import Session

Entry point: `handleImportFile()` in `popup/popup.js`, core logic in `restoreImportedSession()` in `popup/session-utils.js`.

Design:

- Import is best-effort.
- Bad tabs, failed windows, or group creation failures are recorded in `failures[]`.
- The rest of the session continues restoring.
- User sees a partial success summary such as `Imported 27/30 tabs; 3 failed.`

Important invariant:

- Never silently leave the browser in a partially restored state without a status message.

## URL Policy

URL helpers live in `popup/session-utils.js`.

Allowed for bookmark/session restore:

- `http:`
- `https:`
- `file:`
- `view-source:` wrapping a web URL
- Safe browser internal pages such as `chrome://extensions`
- Safe `about:` pages such as `about:blank`

Blocked:

- `javascript:`
- `data:`
- `blob:`
- app-launching schemes such as `mailto:`
- unsafe browser internals such as `chrome://crash`

When changing this policy:

1. Update helper functions.
2. Add tests in `tests/session-utils.test.js`.
3. Re-check Chrome Web Store permission/privacy copy.

## Common Bug Triage

### Duplicate Domain Groups

Check:

- `handleGroupByDomain()`
- Existing group title normalization
- `getDomainGroupName()`
- Whether the duplicated group title is a bookmark folder name, imported session title, or domain-derived title

Manual test:

1. Open multiple tabs from `google.com`, `mail.google.com`, `news.google.com`.
2. Create or leave a duplicate `Google` group.
3. Click `Group by Domain`.
4. Expected: one `Google` group.

### Loose Tabs Between Groups

Check:

- `organizeCurrentWindowGroupsAlphabetically()`
- `chrome.tabGroups.move()` fallback to `chrome.tabs.move()`

Expected:

- Pinned tabs first.
- Groups sorted alphabetically.
- Loose tabs last.

### Blank Startup Tab Remains

Check:

- `isBrowserEmptyTab()`
- `getSingleEmptyTabFromWindow()`
- `rememberReusableEmptyTab()`
- `openTabInWindow()`

Expected:

- If a new Chrome window has exactly one blank/new-tab page, the first opened/restored URL should reuse it.

### Import Stops Too Early

Check:

- `restoreImportedSession()`
- `recordFailure()`
- Test cases for partial tab/window/group failure

Expected:

- Import continues after individual failures.
- User sees a partial result message.

## Test Commands

Run before every release:

```sh
npm test
```

Expected:

```text
8/8 tests pass
```

Add or update tests when changing:

- URL validation
- Domain grouping
- Empty-tab reuse
- Import/export session shape
- Chrome API behavior
- Max limits

## Release Commands

Build Chrome Web Store ZIP:

```sh
sh scripts/build-release.sh
```

Verify ZIP:

```sh
unzip -l dist/bookmark-tab-grouper-<version>.zip
unzip -p dist/bookmark-tab-grouper-<version>.zip manifest.json
```

The build script:

- Reads version from `manifest.json`.
- Removes old ZIP files before building.
- Excludes repository-only files.
- Fails on remote script/font references.
- Verifies key source files are present and current.

## Versioning Rules

Use semantic-ish release increments:

- Patch version: bug fix, docs/release metadata, store copy, small UI fix.
- Minor version: new user-facing feature.
- Major version: breaking behavior or major permission/model change.

Before uploading a new Chrome Web Store package:

1. Update `manifest.json`.
2. Update `package.json`.
3. Update `CHANGELOG.md`.
4. Update `CHROMEWEBSTORE.md` release notes.
5. Run `npm test`.
6. Run `sh scripts/build-release.sh`.
7. Upload the new ZIP.

## Chrome Web Store Checklist

- ZIP version is higher than the current Store version.
- `manifest.json` permissions match actual behavior.
- Store description avoids absolute claims.
- Privacy policy URL is live.
- Support email is current.
- Screenshots in `docs/store/` are approved in `THIRD_PARTY_ASSETS.md`.
- No remote code, remote fonts, analytics SDKs, or external APIs in extension package.

## GitHub Pages Checklist

Files:

- `docs/index.html`
- `docs/styles.css`
- `docs/privacy.html`
- `docs/store/*`

Before pushing:

1. Check desktop layout.
2. Check mobile widths around 320, 360, 390, and 430 px.
3. Test English and Vietnamese copy.
4. Confirm links:
   - Chrome Web Store listing
   - Privacy policy
   - GitHub repo
   - Changelog

## Adding Comments Safely

Prefer comments only around:

- Invariants
- Cross-browser Chrome API quirks
- Security/privacy decisions
- Rollback/partial-failure behavior
- Non-obvious layout constraints

Avoid comments that repeat obvious code.
