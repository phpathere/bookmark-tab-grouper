import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const docsCss = read('docs/styles.css');
const indexHtml = read('docs/index.html');
const privacyHtml = read('docs/privacy.html');
const popupCss = read('popup/styles.css');

function pngDimensions(file) {
  const data = fs.readFileSync(new URL(file, root));
  assert.equal(data.toString('ascii', 1, 4), 'PNG', `${file} must be a PNG`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function cssBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `Missing CSS block: ${selector}`);
  return match[1];
}

function cssToken(block, name) {
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(match, `Missing CSS token: --${name}`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const light = Math.max(firstLuminance, secondLuminance);
  const dark = Math.min(firstLuminance, secondLuminance);
  return (light + 0.05) / (dark + 0.05);
}

test('pink action buttons meet WCAG AA contrast in docs and popup themes', () => {
  const docsRoot = cssBlock(docsCss, ':root');
  const popupRoot = cssBlock(popupCss, ':root');
  const popupDark = cssBlock(popupCss, '[data-theme="dark"]');

  assert.ok(contrastRatio(cssToken(docsRoot, 'pink'), cssToken(docsRoot, 'ink')) >= 4.5);
  assert.ok(contrastRatio(cssToken(popupRoot, 'accent-color'), cssToken(popupRoot, 'accent-text')) >= 4.5);
  assert.ok(contrastRatio(cssToken(popupDark, 'accent-color'), cssToken(popupRoot, 'accent-text')) >= 4.5);
  assert.match(cssBlock(docsCss, '.button.primary'), /color:\s*var\(--ink\)/);
  assert.match(cssBlock(popupCss, '.primary-btn'), /color:\s*var\(--accent-text\)/);
  assert.match(cssBlock(popupCss, '.context-btn'), /color:\s*var\(--accent-text\)/);
});

test('popup controls fit compact width without truncating core action labels', () => {
  assert.match(popupCss, /\*,\s*\n\*::before,\s*\n\*::after\s*\{\s*box-sizing:\s*border-box/);
  assert.match(cssBlock(popupCss, '.settings-btn'), /width:\s*32px/);
  assert.match(cssBlock(popupCss, '.settings-btn'), /height:\s*32px/);
  const secondaryButton = cssBlock(popupCss, '.secondary-btn');
  assert.match(secondaryButton, /white-space:\s*normal/);
  assert.match(secondaryButton, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(secondaryButton, /text-overflow:\s*ellipsis/);
  assert.match(cssBlock(popupCss, '.modal-actions'), /grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test('public pages reserve image space and expose responsive navigation structure', () => {
  assert.match(indexHtml, /real-grouped-tabs-1280x800\.png" width="1280" height="800"/);
  assert.match(indexHtml, /real-popup-interface-1280x800\.png" width="1280" height="800"/);
  assert.match(privacyHtml, /class="nav-actions policy-nav-actions"/);
  assert.match(privacyHtml, /class="policy-nav-links"/);
  assert.match(docsCss, /@media \(max-width: 960px\)[\s\S]*?\.nav\s*\{[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(docsCss, /@media \(max-width: 960px\)[\s\S]*?\.nav-demo-items\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(docsCss, /@media \(max-width: 680px\)[\s\S]*?\.nav-demo-cluster\s*\{[\s\S]*?min-height:\s*72px/);
  assert.match(docsCss, /\.policy-nav-links\s*\{[\s\S]*?overflow-x:\s*auto/);
});

test('real product image set has exact Store dimensions', () => {
  assert.deepEqual(pngDimensions('docs/store/real-grouped-tabs-1280x800.png'), { width: 1280, height: 800 });
  assert.deepEqual(pngDimensions('docs/store/real-popup-interface-1280x800.png'), { width: 1280, height: 800 });
  assert.deepEqual(pngDimensions('docs/store/real-how-it-works-1280x800.png'), { width: 1280, height: 800 });
  assert.deepEqual(pngDimensions('docs/store/real-promo-small-440x280.png'), { width: 440, height: 280 });
  assert.deepEqual(pngDimensions('docs/store/real-marquee-1400x560.png'), { width: 1400, height: 560 });
});
