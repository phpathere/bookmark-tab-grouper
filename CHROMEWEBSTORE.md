# Chrome Web Store Listing - Bookmark Tab Grouper

## Metadata

**Name:** Bookmark Tab Grouper (Gộp Tab Bookmark)
**Short Name:** Tab Grouper
**Version:** 1.0.0
**Category:** Productivity

## Summary
Group and open bookmarks easily with one click. (Mở và gộp nhóm các trang đã bookmark một cách dễ dàng.)

## Description

Bookmark Tab Grouper is a lightweight, secure, and lightning-fast extension designed to boost your productivity. If you have many bookmarks organized in folders, this extension allows you to open entire folders of bookmarks at once and automatically categorizes them into neat, color-coded Chrome Tab Groups based on your folder structure.

**Features:**
- Browse and select your bookmark folders dynamically.
- Automatically group opened tabs using Chrome's native Tab Groups.
- Groups are automatically named and color-coded.
- Beautiful, modern Glassmorphism dark-mode UI.
- Fully localized in English and Vietnamese.
- Offline support and zero tracking (100% privacy).

---

## Permissions Justification

The Chrome Web Store review team requires specific reasons for each permission requested in `manifest.json`.

| Permission | Justification |
|------------|---------------|
| `bookmarks` | Required to read the user's bookmark tree and subfolders to determine which URLs to open. The extension does not modify or delete bookmarks. |
| `tabs` | Required to create new background tabs for each bookmarked URL inside the selected folder. |
| `tabGroups` | Required to group the newly created tabs together and assign a color and title based on the bookmark folder's name. |
| `storage` | Required to save the user's preferred UI language (English or Vietnamese) so the setting persists across sessions. |

---

## Privacy & Data Use

**Data Collection:**
This extension does **NOT** collect, store, or transmit any personal data, browsing history, or bookmark data to any external server. Everything is processed locally on your machine.

**Remote Code:**
This extension strictly complies with Manifest V3 and does not load any remote code. All scripts and fonts are bundled locally.

---

## Pre-Publish Checklist

Before zipping and uploading to the Chrome Web Store Developer Dashboard, ensure the following:

- [ ] Create 3 icons (`icon-16.png`, `icon-48.png`, `icon-128.png`) and place them in an `icons` folder.
- [ ] Add the `"icons"` field to `manifest.json` referencing those images.
- [ ] Take at least 1 high-resolution promotional screenshot (1280x800 or 640x400) of the extension popup.
- [ ] Zip the extension folder (excluding any `.git` or unrelated files).
- [ ] Upload the zip to the Chrome Developer Dashboard and copy-paste the justifications above.
