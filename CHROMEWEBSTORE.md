# Chrome Web Store Listing - Tab Bookmark Grouper

## Metadata

**Name:** Tab Bookmark Grouper
**Short Name:** Tab Grouper
**Version:** 1.0.2
**Category:** Productivity

## Release Notes

### Version 1.0.2
- Maintenance release for the next Chrome Web Store upload.
- Added clear public changelog and release notes for version history transparency.
- Rebuilt the release package from the current source with automated tests passing.

### Version 1.0.1
- Renamed the extension to Tab Bookmark Grouper.
- Improved Group by Domain so one click groups matching domains, sorts groups alphabetically, and moves loose tabs after grouped tabs.
- Fixed duplicate domain groups, such as multiple Google groups.
- Fixed empty startup tab handling when opening bookmark folders or importing exported sessions.
- Improved import resilience so supported tabs continue restoring even when individual tabs, groups, or windows fail.
- Updated privacy and store-facing copy for clearer local-first wording.

### Version 1.0.0
- Initial Chrome Web Store release.
- Open bookmark folders into grouped Chrome tabs.
- Group open tabs by website/domain.
- Export and import supported local session files.

## Summary
Open and group bookmarks easily with one click. (Mở và gộp nhóm các trang đã bookmark một cách dễ dàng.)

## Description

Tab Bookmark Grouper is a lightweight extension designed to help organize browser tabs from bookmark folders and saved sessions. Whether you do research, development, or online shopping, this tool reduces the tedious work of managing tabs.

**🌟 Features:**
- **1-Click Grouping:** Select a bookmark folder and it instantly opens all links, categorizing them into neat, color-coded Chrome Tab Groups.
- **Group by Website:** Automatically detect and group your currently open tabs by their root domain (e.g., all `github.com` tabs go into one group).
- **Smart Undo:** Revert auto-grouping with a single click if you change your mind.
- **Session Export/Import:** Save your supported multi-window layout, tabs, and groups to an offline `.btg` file, and restore supported sessions when needed.
- **Focused UI:** Neo-Brutalism-inspired design with dark mode, clear controls, and keyboard-accessible interactions.
- **Offline by Design:** No tracking, no analytics, no external servers. Bookmark, tab, and session data stay on your device.

**🛠️ How to Use:**
1. Click the 👾 Extension icon in your toolbar.
2. Select a folder from your Chrome Bookmarks and click **Open & Group**.
3. *Alternatively*, click the 🌪️ Filter icon and choose **Group by Website** to organize your currently open tabs.
4. Use the **Export/Import Session** buttons to backup and restore your entire workspace.

---

## Permissions Justification

The Chrome Web Store review team requires specific reasons for each permission requested in `manifest.json`.

| Permission | Justification |
|------------|---------------|
| `bookmarks` | Required to read the user's bookmark tree and subfolders to determine which URLs to open. The extension does not modify or delete bookmarks. |
| `tabs` | Required to create new background tabs for each bookmarked URL inside the selected folder. |
| `tabGroups` | Required to group the newly created tabs together and assign a color and title based on the bookmark folder's name. |
| `storage` | Required to save the user's preferred UI language (English or Vietnamese) so the setting persists across sessions. |
| `downloads` | Required only when the user clicks Export Session, so the extension can save the offline `.btg` session backup file to the browser's Downloads folder. |

---

## Privacy & Data Use

**Data Collection:**
This extension does **not** collect, transmit, sell, or share personal data, browsing history, bookmark data, session exports, analytics, or telemetry with any external server. Bookmark folders, tab URLs, tab groups, and `.btg` session files are processed locally on the user's device.

**Local Storage:**
The extension stores only language and theme preferences in `chrome.storage.local`.

**Session Files:**
Exported `.btg` files may contain tab URLs, group titles/colors, window layout, active-tab URL, and export timestamp. These files are created only after the user clicks Export Session. Imported `.btg` files are read only after the user chooses a file and confirms the import summary.

**Privacy Policy:**
Use `https://tinhxuanghiacu.com/privacy.html` as the Chrome Web Store privacy policy URL after GitHub Pages deploys the latest `docs/` content. `PRIVACY.md` remains the source text.

**Remote Code:**
The Chrome Web Store release package is self-contained and does not load remote JavaScript, remote CSS, Google Fonts, analytics SDKs, or external APIs. Build the submission ZIP with `sh scripts/build-release.sh`; the script fails if remote script/font references are found in the packaged extension.

---

## Pre-Publish Checklist

Before zipping and uploading to the Chrome Web Store Developer Dashboard, ensure the following:

- [ ] Create 3 icons (`icon-16.png`, `icon-48.png`, `icon-128.png`) and place them in an `icons` folder.
- [ ] Add the `"icons"` field to `manifest.json` referencing those images.
- [x] Use the approved screenshot set in `docs/store/`: `store-screenshot-1-main-1280x800.png`, `store-screenshot-2-domain-1280x800.png`, `store-promo-small-440x280.png`, and optional `store-marquee-1400x560.png`.
- [x] Confirm the privacy contact is present in `PRIVACY.md` and `docs/privacy.html`.
- [x] Verify every public screenshot/listing image in `THIRD_PARTY_ASSETS.md`; do not use assets marked `NOT APPROVED FOR STORE USE`.
- [ ] Run `npm test`.
- [ ] Run `sh scripts/build-release.sh` and upload `dist/bookmark-tab-grouper-<version>.zip`.
- [ ] Verify the ZIP contains no `docs/`, `generate_*`, `test_*`, `.git`, `.DS_Store`, or remote script/font references.
- [ ] Publish or host the privacy policy from `PRIVACY.md` and enter its URL in the Chrome Web Store listing.
- [ ] Confirm `LICENSE`, `NOTICE`, and `THIRD_PARTY_ASSETS.md` are current.
- [ ] Upload the zip to the Chrome Developer Dashboard and copy-paste the justifications above.
