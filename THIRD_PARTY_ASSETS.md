# Asset Provenance

This file records the source and release status of visual assets used by Bookmark Tab Grouper.

## Included in Chrome Web Store Extension ZIP

| Asset | Status | Provenance | License / Notes |
| --- | --- | --- | --- |
| `icons/icon-16.png` | Included | Custom pixel-style extension icon generated for this project from the local icon design. | Project-owned under `LICENSE`. |
| `icons/icon-48.png` | Included | Custom pixel-style extension icon generated for this project from the local icon design. | Project-owned under `LICENSE`. |
| `icons/icon-128.png` | Included | Custom pixel-style extension icon generated for this project from the local icon design. | Project-owned under `LICENSE`. |
| Inline SVG app mark | Included | Custom pixel-style mark authored for this project. | Project-owned under `LICENSE`. |
| Popup UI SVG icons | Included | Lucide icons embedded as inline SVG. | ISC License. See `NOTICE`. |

## Not Included in Chrome Web Store Extension ZIP

The release script excludes the `docs/` directory and generator/test files. These files are repository support assets, not extension runtime assets:

- `docs/tabgroup_hero.jpg`
- `docs/tabgroup_main_ui.jpg`
- `docs/tab_sort_by_domain.jpg`
- `docs/favicon.png`
- `generate_icons.html`
- `generate_promo.html`
- `generate_btg.js`
- `generate_btg.py`
- `test_decode.js`

Before using any docs or promotional image in a public store listing, verify that the screenshot contains only the extension UI, developer-owned content, or content that the developer has the right to display.

## Brand Usage

The extension does not bundle third-party logos or brand artwork in the runtime package. Text references to Chrome, Edge, websites, or domains are descriptive compatibility/functionality references only.
