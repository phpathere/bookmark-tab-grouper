import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
const packageJson = JSON.parse(read('package.json'));
const popup = read('popup/popup.js');
const buildScript = read('scripts/build-release.sh');
const indexHtml = read('docs/index.html');

test('release versions stay synchronized at 1.0.3', () => {
  assert.equal(manifest.version, '1.0.3');
  assert.equal(packageJson.version, manifest.version);
  assert.match(read('CHANGELOG.md'), /## \[1\.0\.3\]/);
});

test('MV3 package keeps executable code local and avoids string execution sinks', () => {
  assert.doesNotMatch(popup, /\beval\s*\(|new Function\s*\(/);
  assert.doesNotMatch(indexHtml, /<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(read('manifest.json'), /host_permissions|content_scripts/);
  assert.equal(manifest.content_security_policy.extension_pages, "script-src 'self'; object-src 'self'");
  assert.match(buildScript, /grep -R -nE/);
});

test('bookmark opening and export paths have production failure guards', () => {
  assert.match(popup, /totalLinks > IMPORT_LIMITS\.maxTabs/);
  assert.match(popup, /openBookmarkLinks\(links/);
  assert.match(popup, /chrome\.runtime\.lastError/);
  assert.match(popup, /persist: Boolean\(failedTabs\)/);
});

test('domain undo stores and restores affected group metadata', () => {
  assert.match(popup, /captureAffectedGroupSnapshot\(domainMap, allTabs\)/);
  assert.match(popup, /originalGroups/);
  assert.match(popup, /restoreAffectedGroups\(/);
  assert.match(popup, /collapsed: group\.collapsed/);
});

test('production logging avoids raw exception objects', () => {
  assert.match(popup, /function logExtensionError\(/);
  assert.doesNotMatch(popup, /console\.(log|warn|error)\([^\n]*,\s*e\s*\)/);
});
