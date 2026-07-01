# Asset Provenance and Store-Use Approval

This file is the release gate for every visual or third-party asset associated with Bookmark Tab Grouper. Chrome Web Store package assets and public listing assets must be verified before use.

## Runtime Package Assets

| File name | Purpose | Included in package? | Public listing use? | Source | Author | License | Permission/proof | Created by | Risk level | Verification status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `icons/icon-16.png` | Extension toolbar/icon asset | Yes | Yes | Local project icon design | Hoang Tat / project owner | Project MIT license | Project-owned generated icon; no third-party logo included | Local icon generator/design workflow | Low | APPROVED FOR PACKAGE AND STORE USE |
| `icons/icon-48.png` | Extension management/store icon asset | Yes | Yes | Local project icon design | Hoang Tat / project owner | Project MIT license | Project-owned generated icon; no third-party logo included | Local icon generator/design workflow | Low | APPROVED FOR PACKAGE AND STORE USE |
| `icons/icon-128.png` | Chrome Web Store icon asset | Yes | Yes | Local project icon design | Hoang Tat / project owner | Project MIT license | Project-owned generated icon; no third-party logo included | Local icon generator/design workflow | Low | APPROVED FOR PACKAGE AND STORE USE |
| Inline SVG app mark in `popup/index.html` and `welcome.html` | App mark inside extension UI | Yes | Yes | Authored in repository | Hoang Tat / project owner | Project MIT license | Custom pixel-style mark; no third-party logo included | Manual SVG authoring | Low | APPROVED FOR PACKAGE AND STORE USE |
| Inline SVG settings/filter/external-link icons in `popup/index.html` | UI controls | Yes | Yes, if screenshots show popup | Lucide icon set | Lucide contributors | ISC License | `NOTICE` includes Lucide source and license URL | Copied inline SVG paths from Lucide | Low | APPROVED WITH NOTICE |

## Public Docs / Store-Facing Assets

These files are not included in the Chrome Web Store extension ZIP by `scripts/build-release.sh`, but they may appear on the public landing page, screenshots, repository README, or Chrome Web Store listing. Unverified assets below must not be uploaded as store listing images until provenance is completed.

| File name | Purpose | Included in package? | Public listing use? | Source | Author | License | Permission/proof | Created by | Risk level | Verification status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `docs/store/store-promo-small-440x280.png` | Required Chrome Web Store small promotional image | No | Yes | Project-owned SVG rendered to PNG with Chrome headless | Hoang Tat / project owner | Project-owned promotional asset | Generated from `docs/store/store-promo-small-440x280.svg`; visual inspection found project UI artwork only and no personal data | Codex-generated project asset under user direction | Low | APPROVED FOR STORE USE |
| `docs/store/store-promo-small-440x280.svg` | Editable source for small promotional image | No | No | Project-owned SVG source | Hoang Tat / project owner | Project-owned promotional asset | Source file for approved PNG; no third-party logo included | Codex-generated project asset under user direction | Low | APPROVED AS SOURCE ASSET |
| `docs/store/store-marquee-1400x560.png` | Optional Chrome Web Store marquee promotional image | No | Yes | Project-owned SVG rendered to PNG with Chrome headless | Hoang Tat / project owner | Project-owned promotional asset | Generated from `docs/store/store-marquee-1400x560.svg`; visual inspection found project UI artwork only and no personal data | Codex-generated project asset under user direction | Low | APPROVED FOR STORE USE |
| `docs/store/store-marquee-1400x560.svg` | Editable source for marquee promotional image | No | No | Project-owned SVG source | Hoang Tat / project owner | Project-owned promotional asset | Source file for approved PNG; no third-party logo included | Codex-generated project asset under user direction | Low | APPROVED AS SOURCE ASSET |
| `docs/store/store-screenshot-1-main-1280x800.png` | Chrome Web Store screenshot showing main popup and core value proposition | No | Yes | Project-owned SVG rendered to PNG with Chrome headless | Hoang Tat / project owner | Project-owned promotional asset | Generated from `docs/store/store-screenshot-1-main-1280x800.svg`; visual inspection found synthetic extension UI only and no personal data | Codex-generated project asset under user direction | Low | APPROVED FOR STORE USE |
| `docs/store/store-screenshot-1-main-1280x800.svg` | Editable source for main popup screenshot | No | No | Project-owned SVG source | Hoang Tat / project owner | Project-owned promotional asset | Source file for approved PNG; no third-party logo, third-party content, or personal data included | Codex-generated project asset under user direction | Low | APPROVED AS SOURCE ASSET |
| `docs/store/store-screenshot-2-domain-1280x800.png` | Chrome Web Store screenshot showing domain grouping and undo state | No | Yes | Project-owned SVG rendered to PNG with Chrome headless | Hoang Tat / project owner | Project-owned promotional asset | Generated from `docs/store/store-screenshot-2-domain-1280x800.svg`; visual inspection found synthetic browser UI with fictional domains only and no personal data | Codex-generated project asset under user direction | Low | APPROVED FOR STORE USE |
| `docs/store/store-screenshot-2-domain-1280x800.svg` | Editable source for domain grouping screenshot | No | No | Project-owned SVG source | Hoang Tat / project owner | Project-owned promotional asset | Source file for approved PNG; uses fictional domains and no third-party logos | Codex-generated project asset under user direction | Low | APPROVED AS SOURCE ASSET |
| `docs/tabgroup-main-ui-1280x800.png` | Superseded public docs/README screenshot | No | No | User-provided screenshot/mockup of this extension UI | Hoang Tat / project owner | Project-owned promotional asset | Superseded by `docs/store/store-screenshot-1-main-1280x800.png`; keep as archive/reference only | User-created screenshot/mockup | Low | APPROVED FOR ARCHIVE USE, NOT CURRENT STORE ASSET |
| `docs/btabgroup-sort-1280x800.png` | Superseded public docs/README feature screenshot | No | No | User-provided screenshot/mockup of this extension UI | Hoang Tat / project owner | Project-owned promotional asset | Superseded by `docs/store/store-screenshot-2-domain-1280x800.png`; keep as archive/reference only | User-created screenshot/mockup | Low | APPROVED FOR ARCHIVE USE, NOT CURRENT STORE ASSET |
| `docs/favicon.png` | Public docs favicon | No | Yes | Project icon asset | Hoang Tat / project owner | Project MIT license | Custom pixel-style project icon; no third-party logo included | Local icon generator/design workflow | Low | APPROVED FOR STORE USE |
| `docs/tabgroup_hero.jpg` | Legacy landing/README hero image | No | No | Existing repository asset | Hoang Tat / project owner | Project-owned promotional asset, pending updated copy confirmation | Visual inspection not completed in this pass; no longer referenced by public docs/README | User-created screenshot/mockup | Medium | NOT APPROVED FOR STORE USE |
| `docs/tabgroup_main_ui.jpg` | Legacy product screenshot | No | No | Existing repository asset | Hoang Tat / project owner | Project-owned promotional asset, pending updated copy confirmation | Superseded by `docs/tabgroup-main-ui-1280x800.png` | User-created screenshot/mockup | Medium | NOT APPROVED FOR STORE USE |
| `docs/tab_sort_by_domain.jpg` | Legacy product screenshot | No | No | Existing repository asset | Hoang Tat / project owner | Project-owned promotional asset, pending updated copy confirmation | Superseded by `docs/btabgroup-sort-1280x800.png` | User-created screenshot/mockup | Medium | NOT APPROVED FOR STORE USE |
| `docs/tabgroup-en-hero-1280x800.jpg` | Chrome Web Store screenshot candidate | No | No | User-provided promotional screenshot | Hoang Tat / project owner | Project-owned promotional asset, pending updated copy confirmation | Visual inspection found old marketing wording and visible third-party browser UI labels; use only after refreshing copy/UI capture | User-created screenshot/mockup | Medium | NOT APPROVED FOR STORE USE |
| `docs/tabgroup-vi-hero-1280x800.jpg` | Chrome Web Store screenshot candidate | No | No | User-provided promotional screenshot | Hoang Tat / project owner | Project-owned promotional asset, pending updated copy confirmation | Visual inspection found old marketing wording and visible third-party browser UI labels; use only after refreshing copy/UI capture | User-created screenshot/mockup | Medium | NOT APPROVED FOR STORE USE |
| `docs/tabgroup-en-hero-1400x560.jpg` | Promotional banner candidate | No | No | User-provided promotional screenshot | Hoang Tat / project owner | Project-owned promotional asset, pending updated copy confirmation | Not visually verified in this pass; do not use until checked | User-created screenshot/mockup | Medium | NOT APPROVED FOR STORE USE |
| `docs/tabgroup-en-hero-440x280.jpg` | Promotional tile candidate | No | No | User-provided promotional screenshot | Hoang Tat / project owner | Project-owned promotional asset, pending updated copy confirmation | Not visually verified in this pass; do not use until checked | User-created screenshot/mockup | Medium | NOT APPROVED FOR STORE USE |

## Repository-Only Generator/Test Files

| File name | Purpose | Included in package? | Public listing use? | Source | Author | License | Permission/proof | Created by | Risk level | Verification status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `generate_icons.html` | Local icon generation helper | No | No | Repository utility | Hoang Tat / project owner | Project MIT license | Excluded from release package | Local code | Low | APPROVED FOR REPOSITORY ONLY |
| `generate_promo.html` | Local promo image generation helper | No | No | Repository utility; references Google Fonts and html2canvas CDN | Hoang Tat / project owner plus third-party CDN references | Project MIT for local code; third-party terms for CDN libraries | Excluded from release package; remote references blocked by build script | Local code | Medium | APPROVED FOR REPOSITORY ONLY, NOT PACKAGE |
| `generate_btg.js` | Local session test data generator | No | No | Repository utility | Hoang Tat / project owner | Project MIT license | Excluded from release package | Local code | Low | APPROVED FOR REPOSITORY ONLY |
| `generate_btg.py` | Local session test data generator | No | No | Repository utility | Hoang Tat / project owner | Project MIT license | Excluded from release package | Local code | Low | APPROVED FOR REPOSITORY ONLY |
| `test_decode.js` | Local decode/debug helper | No | No | Repository utility | Hoang Tat / project owner | Project MIT license | Excluded from release package | Local code | Low | APPROVED FOR REPOSITORY ONLY |

## Assets Not Approved for Store Use Before Manual Verification

- `docs/tabgroup_hero.jpg`
- `docs/tabgroup_main_ui.jpg`
- `docs/tab_sort_by_domain.jpg`
- `docs/tabgroup-en-hero-1280x800.jpg`
- `docs/tabgroup-vi-hero-1280x800.jpg`
- `docs/tabgroup-en-hero-1400x560.jpg`
- `docs/tabgroup-en-hero-440x280.jpg`
- `docs/tabgroup-main-ui-1280x800.png` for new Store uploads; use `docs/store/store-screenshot-1-main-1280x800.png` instead.
- `docs/btabgroup-sort-1280x800.png` for new Store uploads; use `docs/store/store-screenshot-2-domain-1280x800.png` instead.

Required proof before using those assets in a Chrome Web Store listing:

- Source file or generation prompt/process.
- Author/owner.
- License or written permission.
- Confirmation that screenshots contain only extension UI, developer-owned content, or content licensed for promotional use.
- Confirmation that no third-party logos, copyrighted page content, personal data, or private browsing data appear.
