import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IMPORT_LIMITS,
  formatImportResult,
  getDomainGroupName,
  isOpenableBookmarkUrl,
  isRestorableSessionUrl,
  normalizeImportData,
  openTabInWindow,
  restoreImportedSession
} from '../popup/session-utils.js';

function makeSession(overrides = {}) {
  return {
    generator: 'Bookmark Tab Grouper',
    version: '2.0',
    active_tab_url: 'https://active.example',
    windows: [{
      is_focused: true,
      groups: [{
        title: 'Work',
        color: 'blue',
        tabs: ['https://active.example', 'file:///tmp/report.html', 'javascript:alert(1)']
      }],
      ungrouped_tabs: ['chrome://extensions', 'mailto:test@example.com']
    }],
    ...overrides
  };
}

function createChromeMock(options = {}) {
  const state = {
    nextWindowId: 2,
    nextTabId: 2,
    nextGroupId: 1,
    updateCalls: [],
    windows: new Map([[1, { id: 1, focused: true, tabs: [{ id: 1, windowId: 1, url: 'chrome://newtab/', active: true }] }]])
  };
  const failCreateUrls = new Set(options.failCreateUrls || []);
  let remainingWindowCreateFailures = options.windowCreateFailures || 0;

  const findTab = (tabId) => {
    for (const win of state.windows.values()) {
      const tab = win.tabs.find(item => item.id === tabId);
      if (tab) return { win, tab };
    }
    return null;
  };

  return {
    state,
    tabGroups: {
      TAB_GROUP_ID_NONE: -1,
      async update(groupId, props) {
        if (options.failGroupUpdate) throw new Error('group update failed');
        return { id: groupId, ...props };
      }
    },
    tabs: {
      async update(tabId, props) {
        state.updateCalls.push({ tabId, props });
        if (failCreateUrls.has(props.url)) throw new Error('tab update failed');
        const found = findTab(tabId);
        if (!found) throw new Error('tab not found');
        Object.assign(found.tab, props);
        return found.tab;
      },
      async create(props) {
        if (failCreateUrls.has(props.url)) throw new Error('tab create failed');
        const win = state.windows.get(props.windowId || 1);
        if (!win) throw new Error('window not found');
        const tab = {
          id: state.nextTabId++,
          windowId: win.id,
          url: props.url,
          active: Boolean(props.active)
        };
        win.tabs.push(tab);
        return tab;
      },
      async group() {
        if (options.failGroupCreate) throw new Error('group create failed');
        return state.nextGroupId++;
      },
      async query(queryInfo) {
        return [...(state.windows.get(queryInfo.windowId)?.tabs || [])];
      },
      async remove(tabId) {
        const found = findTab(tabId);
        if (!found) throw new Error('tab not found');
        found.win.tabs = found.win.tabs.filter(tab => tab.id !== tabId);
      }
    },
    windows: {
      async getCurrent() {
        return state.windows.get(1);
      },
      async get(winId) {
        return state.windows.get(winId);
      },
      async create() {
        if (remainingWindowCreateFailures > 0) {
          remainingWindowCreateFailures--;
          throw new Error('window create failed');
        }
        const win = {
          id: state.nextWindowId++,
          focused: false,
          tabs: [{ id: state.nextTabId++, windowId: state.nextWindowId - 1, url: 'chrome://newtab/', active: true }]
        };
        state.windows.set(win.id, win);
        return win;
      },
      async update(winId, props) {
        const win = state.windows.get(winId);
        if (!win) throw new Error('window not found');
        Object.assign(win, props);
        return win;
      }
    }
  };
}

test('normalizeImportData filters dangerous URLs and keeps restorable browser URLs', () => {
  const normalized = normalizeImportData(makeSession());
  assert.equal(normalized.totalTabs, 3);
  assert.deepEqual(normalized.windows[0].groups[0].tabs, [
    'https://active.example',
    'file:///tmp/report.html'
  ]);
  assert.deepEqual(normalized.windows[0].ungrouped_tabs, ['chrome://extensions']);
});

test('URL policy blocks dangerous and app-launching schemes', () => {
  assert.equal(isOpenableBookmarkUrl('https://example.com'), true);
  assert.equal(isOpenableBookmarkUrl('file:///tmp/a.html'), true);
  assert.equal(isRestorableSessionUrl('view-source:https://example.com'), true);
  assert.equal(isOpenableBookmarkUrl('javascript:alert(1)'), false);
  assert.equal(isOpenableBookmarkUrl('data:text/html,hi'), false);
  assert.equal(isOpenableBookmarkUrl('mailto:test@example.com'), false);
  assert.equal(isRestorableSessionUrl('chrome://crash'), false);
});

test('getDomainGroupName normalizes subdomains into one domain group', () => {
  assert.equal(getDomainGroupName('https://google.com/search?q=a'), 'Google');
  assert.equal(getDomainGroupName('https://www.google.com/maps'), 'Google');
  assert.equal(getDomainGroupName('https://mail.google.com/mail/u/0'), 'Google');
  assert.equal(getDomainGroupName('https://news.google.com/home'), 'Google');
  assert.equal(getDomainGroupName('https://shop.example.com.vn/item'), 'Example');
  assert.equal(getDomainGroupName('https://192.168.1.10/admin'), '192.168.1.10');
  assert.equal(getDomainGroupName('chrome://extensions'), null);
});

test('normalizeImportData enforces max tab limits', () => {
  const tooManyTabs = Array.from({ length: IMPORT_LIMITS.maxTabs + 1 }, (_, index) => `https://example.com/${index}`);
  assert.throws(() => normalizeImportData(makeSession({
    windows: [{ is_focused: true, groups: [], ungrouped_tabs: tooManyTabs }]
  })), /Too many tabs|Maximum/);
});

test('openTabInWindow reuses a remembered empty tab instead of creating a new one', async () => {
  const chromeApi = createChromeMock();
  const reusableEmptyTabIds = new Map([[1, 1]]);
  const tab = await openTabInWindow('https://example.com', {
    windowId: 1,
    active: false,
    reusableEmptyTabIds,
    chromeApi
  });

  assert.equal(tab.id, 1);
  assert.equal(chromeApi.state.windows.get(1).tabs.length, 1);
  assert.equal(chromeApi.state.windows.get(1).tabs[0].url, 'https://example.com');
});

test('restoreImportedSession continues after partial tab creation failure', async () => {
  const chromeApi = createChromeMock({ failCreateUrls: ['https://bad.example'] });
  const importData = normalizeImportData(makeSession({
    active_tab_url: 'https://good.example/1',
    windows: [{
      is_focused: true,
      groups: [{ title: 'Work', color: 'blue', tabs: ['https://good.example/1', 'https://bad.example'] }],
      ungrouped_tabs: ['https://good.example/2']
    }]
  }));

  const result = await restoreImportedSession(importData, { chromeApi });
  assert.equal(result.importedTabs, 2);
  assert.equal(result.failedTabs, 1);
  assert.equal(result.failures.some(failure => failure.scope === 'tab'), true);
  assert.match(formatImportResult(result), /Imported 2\/3 tabs; 1 failed/);
});

test('restoreImportedSession activates the exported first tab only after all tabs are restored', async () => {
  const chromeApi = createChromeMock();
  const importData = normalizeImportData(makeSession({
    active_tab_url: 'https://first.example',
    windows: [{
      is_focused: true,
      groups: [{ title: 'First', color: 'blue', tabs: ['https://first.example', 'https://second.example'] }],
      ungrouped_tabs: ['https://loose.example']
    }]
  }));

  const result = await restoreImportedSession(importData, { chromeApi });
  const currentTabs = chromeApi.state.windows.get(1).tabs;

  assert.equal(result.importedTabs, 3);
  assert.equal(currentTabs.some(tab => tab.url === 'chrome://newtab/'), false);
  assert.equal(currentTabs.filter(tab => tab.active).length, 1);
  assert.equal(currentTabs.find(tab => tab.active)?.url, 'https://first.example');
  assert.deepEqual(chromeApi.state.updateCalls.map(call => call.props.active), [true]);
});

test('restoreImportedSession reports skipped tabs when a new window cannot be created', async () => {
  const chromeApi = createChromeMock({ windowCreateFailures: 1 });
  const importData = normalizeImportData(makeSession({
    windows: [
      { is_focused: true, groups: [], ungrouped_tabs: ['https://first.example'] },
      { is_focused: false, groups: [], ungrouped_tabs: ['https://second.example'] }
    ]
  }));

  const result = await restoreImportedSession(importData, { chromeApi });
  assert.equal(result.importedTabs, 1);
  assert.equal(result.failedTabs, 1);
  assert.equal(result.skippedTabsDueToWindowFailures, 1);
  assert.equal(result.failures.some(failure => failure.action === 'createWindow'), true);
});

test('restoreImportedSession records group failures without losing created tabs', async () => {
  const chromeApi = createChromeMock({ failGroupCreate: true });
  const importData = normalizeImportData(makeSession({
    windows: [{
      is_focused: true,
      groups: [{ title: 'Work', color: 'blue', tabs: ['https://one.example', 'https://two.example'] }],
      ungrouped_tabs: []
    }]
  }));

  const result = await restoreImportedSession(importData, { chromeApi });
  assert.equal(result.importedTabs, 2);
  assert.equal(result.failedTabs, 0);
  assert.equal(result.failures.some(failure => failure.scope === 'group'), true);
  assert.match(formatImportResult(result), /Some groups could not be restored/);
});
