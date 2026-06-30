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
- **100% Privacy:** No tracking, no external APIs. Everything is processed locally on your machine.

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
