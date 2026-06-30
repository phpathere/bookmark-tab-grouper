# Chrome Web Store Listing - Bookmark Tab Grouper

## Metadata

**Name:** Bookmark Tab Grouper (Gộp Tab Bookmark)
**Short Name:** Tab Grouper
**Version:** 1.0.0
**Category:** Productivity

## Summary
Group and open bookmarks easily with one click. (Mở và gộp nhóm các trang đã bookmark một cách dễ dàng.)

## Description

Bookmark Tab Grouper is a lightweight, secure, and lightning-fast extension designed to boost your productivity by organizing the chaos of browser tabs. Whether you do research, development, or online shopping, this tool automates the tedious work of managing tabs.

**🌟 Features:**
- **1-Click Grouping:** Select a bookmark folder and it instantly opens all links, categorizing them into neat, color-coded Chrome Tab Groups.
- **Group by Website:** Automatically detect and group your currently open tabs by their root domain (e.g., all `github.com` tabs go into one group).
- **Smart Undo:** Revert auto-grouping with a single click if you change your mind.
- **Session Sync (Export/Import):** Save your multi-window layout, tabs, and groups to an offline `.btg` file, and restore them flawlessly anytime, anywhere.
- **Premium UI:** Neo-Brutalism design with a Dracula Dark Mode and Glassmorphism touches.
- **Local-first Privacy:** No tracking, no analytics, no external APIs. Bookmark, tab, and session data are processed locally on your machine.

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
This extension does **NOT** collect, transmit, sell, or share personal data, browsing history, bookmark data, session exports, analytics, or telemetry with any external server. Bookmark folders, tab URLs, tab groups, and `.btg` session files are processed locally on the user's machine only.

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
- [ ] Take at least 1 high-resolution promotional screenshot (1280x800 or 640x400) of the extension popup.
- [ ] Run `sh scripts/build-release.sh` and upload `dist/bookmark-tab-grouper-1.0.0.zip`.
- [ ] Verify the ZIP contains no `docs/`, `generate_*`, `test_*`, `.git`, `.DS_Store`, or remote script/font references.
- [ ] Publish or host the privacy policy from `PRIVACY.md` and enter its URL in the Chrome Web Store listing.
- [ ] Confirm `LICENSE`, `NOTICE`, and `THIRD_PARTY_ASSETS.md` are current.
- [ ] Upload the zip to the Chrome Developer Dashboard and copy-paste the justifications above.
