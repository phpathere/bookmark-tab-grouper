# Design System Guide

This document defines the visual and UX rules for Tab Bookmark Grouper's extension popup, GitHub Pages landing page, screenshots, and future related pages.

## Style Name

**Pixel Neo-Brutalist Mint**

Use this name when asking Codex or another developer to create matching pages/components.

## Design Principles

- Functional first: tools and docs should feel usable, not decorative.
- Bold but readable: thick borders, strong contrast, clear controls.
- Local-first trust: copy should sound concrete, calm, and privacy-aware.
- No overclaiming: avoid phrases such as `100% secure`, `flawless`, `perfect`.
- Responsive by default: every component must work from 320 px mobile to wide desktop.

## Color Tokens

Core colors:

```css
--ink: #1c1917;
--paper: #fffdf7;
--surface: #f8fafc;
--mint: #b9f6ca;
--cyan: #67e8f9;
--blue: #38bdf8;
--pink: #fb7185;
--violet: #a78bfa;
--yellow: #fef08a;
--muted: #475569;
--line: #1c1917;
```

Usage:

- `--ink`: text, borders, shadows.
- `--paper`: page background.
- `--mint`, `--cyan`, `--violet`: hero backgrounds and soft panels.
- `--pink`: primary CTA.
- `--yellow`: badges, highlights, active language state.
- `--surface`: quiet content cards.

## Typography

Landing page:

- Use system sans stack for body.
- Use `SFMono-Regular`, `Consolas`, or monospace for labels, counters, and small badges.
- Do not use remote fonts.
- Do not use negative letter spacing.
- Do not scale font size with viewport width alone; use `clamp()`.

Popup:

- Use `"Courier New", Courier, monospace`.
- Keep controls compact but readable.
- Avoid text smaller than 13 px for important UI.

## Layout Rules

Desktop:

- Main content width: `min(1120px, calc(100% - 32px))`.
- Use grid for hero/showcase sections.
- Keep page sections full-width or centered layouts, not cards inside cards.

Mobile:

- Use a narrow centered content container.
- Test at 320, 360, 390, and 430 px.
- Prefer one-column grids.
- Avoid sticky headers if they crowd the viewport.
- Use `overflow-wrap: anywhere` for long links/copy.
- Shadows must not create visible horizontal overflow.

## Component Rules

### Buttons

Use:

- Thick border.
- 8 px or smaller radius.
- Strong box shadow on desktop.
- Reduced shadow on mobile.
- Clear text label.

Primary:

- Pink background.
- White text.
- Use for install/open/export actions.

Secondary:

- White background.
- Ink text.
- Use for privacy/GitHub/support links.

### Cards

Use cards for:

- Feature cards.
- Privacy facts.
- Individual repeated items.
- Store screenshots/mockups.

Do not:

- Put cards inside cards.
- Use oversized rounded corners.
- Use decorative orbs/blobs.

### Labels and Badges

Use labels for:

- `Chrome Extension`
- `MV3`
- `Local-first`
- Step numbers
- Version markers

Style:

- Monospace.
- Uppercase when short.
- Thick border or quiet inline text.

### Icons

Runtime popup:

- Use extension icon and inline Lucide SVG icons already present in the package.
- Icon-only controls must have `aria-label`.

Docs/landing:

- Use local icon assets only.
- Avoid third-party logos unless legally approved and documented.

## Copy Rules

Preferred wording:

- `offline by design`
- `no external servers`
- `data stays on your device`
- `restore supported sessions`
- `Bảo mật cục bộ`
- `Không gửi dữ liệu lên máy chủ bên ngoài`

Avoid:

- `100% Privacy`
- `Bảo Mật Tuyệt Đối`
- `restore flawlessly`
- claims that imply guaranteed security, compatibility, or perfect restore.

## Accessibility Rules

- Buttons and links must have visible text or accessible names.
- Modals must trap focus and close with Escape.
- Focus should return to the trigger after modal close.
- Status messages need `role="status"` and `aria-live`.
- Color cannot be the only signal.
- Text must not overlap or clip at mobile widths.

## Responsive QA Checklist

For every new page/component:

- 320 px mobile: no horizontal clipping.
- 360 px mobile: buttons and language/copy controls fit.
- 390 px mobile: hero headline wraps cleanly.
- 430 px mobile: screenshots fit inside viewport.
- 768 px tablet: no awkward two-column squeeze.
- 1280 px desktop: content is centered and not too stretched.

## New Page Workflow

When adding a second or third page:

1. Reuse `docs/styles.css` tokens first.
2. Copy existing button/card/header/footer patterns.
3. Add only page-specific classes after shared layout rules.
4. Test English and Vietnamese if the page has public copy.
5. Render mobile screenshots before pushing.
6. Update `THIRD_PARTY_ASSETS.md` for new store-facing images.

## Extension UI Workflow

When adding popup controls:

1. Use existing button classes where possible.
2. Prefer icon + accessible label for compact commands.
3. Keep status messages persistent long enough for errors.
4. Add i18n strings in both English and Vietnamese.
5. Add tests if behavior touches tabs, groups, import/export, or URL policy.

## Screenshot/Store Asset Workflow

Store-facing images live in `docs/store/`.

Rules:

- Use project-owned screenshots/mockups.
- Avoid private browsing data.
- Avoid third-party copyrighted content.
- Document every new asset in `THIRD_PARTY_ASSETS.md`.
- Prefer 1280x800 for screenshots.
- Prefer 440x280 for small promo.
- Prefer 1400x560 for marquee promo.
