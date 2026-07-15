# Chrome Web Store Listing - Tab Bookmark Grouper

## Metadata

**Name:** Tab Bookmark Grouper
**Short Name:** Tab Grouper
**Version:** 1.0.4
**Category:** Productivity
**Policy review:** Updated for the Chrome Web Store policy changes announced July 1, 2026 and enforced August 1, 2026.

## Release Notes

### Version 1.0.4
- Restored the tab that was active when a supported session was exported.
- Sorted tab groups alphabetically from left to right and kept loose tabs last.
- Moved session restoration to the MV3 service worker so importing can finish after Chrome focuses the restored window.
- Improved support for permitted Chrome internal pages and partial import failures.

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

## Store Summary

### English
Open bookmark folders as tab groups, group open tabs by website, and export or import supported sessions locally.

### Vietnamese
Mở folder bookmark thành nhóm tab, nhóm tab theo website và xuất hoặc nhập các session được hỗ trợ ngay trên thiết bị.

## Detailed Description - English

Use this text for the English locale in **Product details > Detailed description**:

```text
Tab Bookmark Grouper helps you organize and restore Chrome tabs. Its single purpose is tab organization: open bookmarks as a group, group matching open tabs by website, and save or restore supported tab sessions.

Main features

- Open a bookmark folder: Select a folder and open its supported bookmark URLs in a Chrome tab group named after that folder.
- Group by website: Group matching open web tabs by root domain. Groups are ordered alphabetically from left to right, with loose tabs placed after groups.
- Undo automatic grouping: Restore the affected tabs and groups after the most recent Group by Website action.
- Export and import sessions: Create a local .btg file containing supported normal windows, tab URLs, group titles and colors, and the active-tab reference. Importing restores supported items and reports partial failures when an individual tab, group, or window cannot be created.
- Choose English or Vietnamese and use light, dark, or automatic theme settings.

How it handles data

To provide these features, the extension processes bookmark folder names and URLs, open-tab URLs, tab-group metadata, and user-selected .btg session files. Processing takes place locally in Chrome. This data is not transmitted to the developer or to an external server.

The extension contains no advertising, analytics, telemetry, remote code, or user account system. It stores only language and theme preferences in Chrome local storage. A session file is created only when you select Export Session, and a file is read only when you select it and confirm the import.

Permissions

- Bookmarks: Read the bookmark tree so you can choose a folder and open its URLs. The extension does not modify or delete bookmarks.
- Tabs and tabGroups: Create, group, move, and restore tabs and Chrome tab groups.
- Storage: Save language and theme preferences locally.
- Downloads: Save a .btg session file after you select Export Session.

The extension does not read webpage content. Some browser pages or URL types cannot be restored because Chrome restricts extensions from opening them.

Basic use

1. Open Tab Bookmark Grouper from the Chrome toolbar.
2. Select a bookmark folder and choose Open and Group.
3. To organize existing tabs, choose Group by Website.
4. Use Export Session or Import Session when you want to save or restore a supported local session.

Privacy policy: https://tinhxuanghiacu.com/privacy.html
Support: phpathere@gmail.com
```

## Detailed Description - Vietnamese

Use this text for the Vietnamese locale in **Thông tin chi tiết về sản phẩm > Mô tả chi tiết**:

```text
Tab Bookmark Grouper giúp bạn sắp xếp và khôi phục các tab Chrome. Extension có một mục đích duy nhất là tổ chức tab: mở bookmark thành nhóm, nhóm các tab đang mở theo website và lưu hoặc khôi phục những session được hỗ trợ.

Tính năng chính

- Mở folder bookmark: Chọn một folder để mở các URL bookmark được hỗ trợ trong một Chrome Tab Group mang tên folder đó.
- Nhóm theo website: Nhóm các tab web phù hợp theo tên miền gốc. Các group được xếp theo thứ tự chữ cái từ trái sang phải và tab lẻ được đặt sau các group.
- Hoàn tác nhóm tự động: Khôi phục các tab và group bị ảnh hưởng bởi lần dùng tính năng Nhóm theo website gần nhất.
- Xuất và nhập session: Tạo file .btg cục bộ chứa các cửa sổ thông thường được hỗ trợ, URL của tab, tên và màu group, cùng thông tin tab đang active. Khi import, extension khôi phục những mục được hỗ trợ và thông báo nếu một tab, group hoặc cửa sổ không thể tạo được.
- Hỗ trợ tiếng Anh, tiếng Việt và chế độ giao diện sáng, tối hoặc tự động.

Cách extension xử lý dữ liệu

Để cung cấp các tính năng trên, extension xử lý tên và URL trong folder bookmark, URL của các tab đang mở, thông tin tab group và file session .btg do người dùng chọn. Việc xử lý diễn ra cục bộ trong Chrome. Dữ liệu này không được gửi cho nhà phát triển hoặc máy chủ bên ngoài.

Extension không chứa quảng cáo, analytics, telemetry, mã chạy từ xa hoặc hệ thống tài khoản. Extension chỉ lưu lựa chọn ngôn ngữ và giao diện trong bộ nhớ cục bộ của Chrome. File session chỉ được tạo khi bạn chọn Xuất session và chỉ được đọc khi bạn chủ động chọn file rồi xác nhận import.

Quyền được sử dụng

- Bookmarks: Đọc cây bookmark để bạn chọn folder và mở URL. Extension không sửa hoặc xóa bookmark.
- Tabs và tabGroups: Tạo, nhóm, di chuyển và khôi phục tab cùng Chrome Tab Group.
- Storage: Lưu lựa chọn ngôn ngữ và giao diện trên thiết bị.
- Downloads: Lưu file session .btg sau khi bạn chọn Xuất session.

Extension không đọc nội dung bên trong trang web. Một số trang nội bộ của trình duyệt hoặc loại URL không thể khôi phục do giới hạn bảo mật của Chrome.

Cách sử dụng cơ bản

1. Mở Tab Bookmark Grouper từ thanh công cụ Chrome.
2. Chọn một folder bookmark rồi bấm Mở và nhóm tab.
3. Để sắp xếp các tab hiện có, bấm Nhóm theo website.
4. Dùng Xuất session hoặc Nhập session khi cần lưu hay khôi phục một session cục bộ được hỗ trợ.

Chính sách quyền riêng tư: https://tinhxuanghiacu.com/privacy.html
Hỗ trợ: phpathere@gmail.com
```

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
