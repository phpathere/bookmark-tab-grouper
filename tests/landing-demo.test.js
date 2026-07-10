import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const indexHtml = fs.readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const stylesCss = fs.readFileSync(new URL('../docs/styles.css', import.meta.url), 'utf8');

test('landing demo exposes an accessible status and visible grouped toggle', () => {
  assert.match(indexHtml, /class="nav-demo-title" type="button"/);
  assert.match(indexHtml, /class="demo-toggle-cue" aria-hidden="true"/);
  assert.match(indexHtml, /class="demo-status visually-hidden" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(indexHtml, /demoTitle\?\.addEventListener\('click', toggleDemo\)/);
});

test('landing demo keeps mobile header height stable after grouping', () => {
  assert.match(stylesCss, /\.nav-demo-cluster[\s\S]*?min-height: 108px/);
  assert.match(stylesCss, /\.nav\.is-demo-animating \.nav-demo-cluster[\s\S]*?min-height: 108px/);
  assert.match(stylesCss, /\.nav\.is-demo-grouped \.nav-demo-cluster[\s\S]*?min-height: 108px/);
});

test('landing demo announces progress and scales the mascot with each count', () => {
  assert.match(indexHtml, /demoStatusProgress/);
  assert.match(indexHtml, /--demo-creature-width/);
  assert.match(stylesCss, /width: var\(--demo-creature-width, 58px\)/);
});

test('landing demo removes hidden focus targets after grouping', () => {
  assert.match(indexHtml, /demoButton\?\.setAttribute\('tabindex', isGrouped \? '-1' : '0'\)/);
  assert.match(stylesCss, /\.nav\.is-demo-animating \.brand,[\s\S]*?visibility: hidden;[\s\S]*?pointer-events: none;/);
  assert.match(stylesCss, /\.nav\.is-demo-grouped \.demo-toggle-cue[\s\S]*?display: block;/);
});
