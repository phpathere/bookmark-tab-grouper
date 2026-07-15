import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IMPORT_LIMITS,
  findActiveTabSnapshot,
  formatImportResult,
  getDomainGroupName,
  isOpenableBookmarkUrl,
  isRestorableSessionUrl,
  normalizeImportData,
  openTabInWindow,
  restoreImportedSession,
  sortGroupsFirstLooseTabsLast
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
    groups: new Map(),
    windows: new Map([[1, { id: 1, focused: true, tabs: [{
      id: 1,
      windowId: 1,
      url: 'chrome://newtab/',
      active: true,
      pinned: false,
      groupId: -1,
      index: 0
    }] }]])
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

  const reindexWindow = (win) => {
    win.tabs.forEach((tab, index) => { tab.index = index; });
  };

  const moveTabs = (tabIds, index) => {
    const ids = new Set(Array.isArray(tabIds) ? tabIds : [tabIds]);
    const firstMatch = [...state.windows.values()].find(win => win.tabs.some(tab => ids.has(tab.id)));
    if (!firstMatch) throw new Error('tab not found');
    const movingTabs = firstMatch.tabs.filter(tab => ids.has(tab.id));
    const remainingTabs = firstMatch.tabs.filter(tab => !ids.has(tab.id));
    const targetIndex = index === -1 ? remainingTabs.length : Math.min(index, remainingTabs.length);
    remainingTabs.splice(targetIndex, 0, ...movingTabs);
    firstMatch.tabs = remainingTabs;
    reindexWindow(firstMatch);
    return movingTabs;
  };

  return {
    state,
    tabGroups: {
      TAB_GROUP_ID_NONE: -1,
      async update(groupId, props) {
        if (options.failGroupUpdate) throw new Error('group update failed');
        const group = { id: groupId, ...(state.groups.get(groupId) || {}), ...props };
        state.groups.set(groupId, group);
        return group;
      },
      async get(groupId) {
        const group = state.groups.get(groupId);
        if (!group) throw new Error('group not found');
        return group;
      },
      async move(groupId, props) {
        const tabIds = [];
        for (const win of state.windows.values()) {
          for (const tab of win.tabs) {
            if (tab.groupId === groupId) tabIds.push(tab.id);
          }
        }
        if (!options.noOpGroupMove) moveTabs(tabIds, props.index);
        return state.groups.get(groupId);
      }
    },
    tabs: {
      async update(tabId, props) {
        state.updateCalls.push({ tabId, props });
        if (failCreateUrls.has(props.url)) throw new Error('tab update failed');
        const found = findTab(tabId);
        if (!found) throw new Error('tab not found');
        if (props.active) {
          found.win.tabs.forEach(tab => { tab.active = tab.id === tabId; });
        }
        Object.assign(found.tab, props);
        return found.tab;
      },
      async create(props) {
        if (options.failDirectInternal && /^chrome:\/\//.test(props.url)) {
          throw new Error('direct internal URL creation failed');
        }
        if (failCreateUrls.has(props.url)) throw new Error('tab create failed');
        const win = state.windows.get(props.windowId || 1);
        if (!win) throw new Error('window not found');
        const tab = {
          id: state.nextTabId++,
          windowId: win.id,
          url: props.url,
          active: Boolean(props.active),
          pinned: false,
          groupId: -1,
          index: win.tabs.length
        };
        win.tabs.push(tab);
        return tab;
      },
      async group({ tabIds }) {
        if (options.failGroupCreate) throw new Error('group create failed');
        const groupId = state.nextGroupId++;
        state.groups.set(groupId, { id: groupId, title: '', color: 'grey' });
        for (const tabId of tabIds) {
          const found = findTab(tabId);
          if (found) found.tab.groupId = groupId;
        }
        return groupId;
      },
      async query(queryInfo) {
        const win = state.windows.get(queryInfo.windowId || 1);
        if (win) reindexWindow(win);
        const tabs = [...(win?.tabs || [])];
        return queryInfo.active ? tabs.filter(tab => tab.active) : tabs;
      },
      async move(tabIds, props) {
        return moveTabs(tabIds, props.index);
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
          tabs: [{
            id: state.nextTabId++,
            windowId: state.nextWindowId - 1,
            url: 'chrome://newtab/',
            active: true,
            pinned: false,
            groupId: -1,
            index: 0
          }]
        };
        state.windows.set(win.id, win);
        return win;
      },
      async update(winId, props) {
        const win = state.windows.get(winId);
        if (!win) throw new Error('window not found');
        Object.assign(win, props);
        if (props.focused && options.focusResetsActiveToFirstLoose) {
          const firstLooseTab = win.tabs.find(tab => tab.groupId === -1);
          if (firstLooseTab) {
            win.tabs.forEach(tab => { tab.active = tab.id === firstLooseTab.id; });
          }
        }
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

test('findActiveTabSnapshot keeps the tab captured when the popup opened', () => {
  const windows = [
    { id: 10, type: 'normal', focused: false, tabs: [{ id: 101, active: true, url: 'https://loose.example' }] },
    { id: 20, type: 'normal', focused: true, tabs: [{ id: 201, active: true, url: 'https://group.example/active' }] }
  ];

  assert.deepEqual(findActiveTabSnapshot(windows, { id: 201, windowId: 20 }), {
    id: 201,
    windowId: 20,
    url: 'https://group.example/active'
  });
});

test('sortGroupsFirstLooseTabsLast produces A-to-Z groups before loose tabs when group move is a no-op', async () => {
  const chromeApi = createChromeMock({ noOpGroupMove: true });
  const win = chromeApi.state.windows.get(1);
  win.tabs = [
    { id: 1, windowId: 1, pinned: true, groupId: -1, index: 0 },
    { id: 2, windowId: 1, pinned: false, groupId: -1, index: 1 },
    { id: 3, windowId: 1, pinned: false, groupId: 20, index: 2 },
    { id: 4, windowId: 1, pinned: false, groupId: 20, index: 3 },
    { id: 5, windowId: 1, pinned: false, groupId: -1, index: 4 },
    { id: 6, windowId: 1, pinned: false, groupId: 10, index: 5 },
    { id: 7, windowId: 1, pinned: false, groupId: 10, index: 6 }
  ];
  chromeApi.state.groups.set(20, { id: 20, title: 'Bravo' });
  chromeApi.state.groups.set(10, { id: 10, title: 'Alpha' });

  const titles = await sortGroupsFirstLooseTabsLast(chromeApi, { windowId: 1 });

  assert.deepEqual(titles, ['Alpha', 'Bravo']);
  assert.deepEqual(win.tabs.map(tab => tab.id), [1, 6, 7, 3, 4, 2, 5]);
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

test('openTabInWindow retries supported Chrome internal URLs through a blank tab', async () => {
  const chromeApi = createChromeMock({ failDirectInternal: true });
  const tab = await openTabInWindow('chrome://extensions/', {
    windowId: 1,
    active: false,
    chromeApi
  });

  assert.equal(tab.url, 'chrome://extensions/');
  assert.equal(chromeApi.state.windows.get(1).tabs.some(item => item.url === 'chrome://extensions/'), true);
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

test('restoreImportedSession activates the exported last tab in a group only after all tabs are restored', async () => {
  const chromeApi = createChromeMock();
  const importData = normalizeImportData(makeSession({
    active_tab_url: 'https://second.example',
    active_tab_ref: {
      window_index: 0,
      kind: 'group',
      group_index: 0,
      tab_index: 1,
      url: 'https://second.example'
    },
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
  assert.equal(currentTabs.find(tab => tab.active)?.url, 'https://second.example');
  assert.deepEqual(chromeApi.state.updateCalls.map(call => call.props.active), [true]);
});

test('restoreImportedSession keeps the active grouped tab while sorting imported groups A-to-Z', async () => {
  const chromeApi = createChromeMock({ focusResetsActiveToFirstLoose: true });
  const importData = normalizeImportData(makeSession({
    active_tab_url: 'https://zulu.example/active',
    active_tab_ref: {
      window_index: 0,
      kind: 'group',
      group_index: 0,
      tab_index: 1,
      url: 'https://zulu.example/active'
    },
    windows: [{
      is_focused: true,
      groups: [
        { title: 'Zulu', color: 'blue', tabs: ['https://zulu.example/first', 'https://zulu.example/active'] },
        { title: 'Alpha', color: 'green', tabs: ['https://alpha.example/first', 'https://alpha.example/second'] }
      ],
      ungrouped_tabs: ['https://loose.example']
    }]
  }));

  await restoreImportedSession(importData, { chromeApi });
  const restoredTabs = chromeApi.state.windows.get(1).tabs;
  const orderedLabels = restoredTabs.map(tab => {
    if (tab.groupId === -1) return 'loose';
    return chromeApi.state.groups.get(tab.groupId)?.title;
  });

  assert.deepEqual(orderedLabels, ['Alpha', 'Alpha', 'Zulu', 'Zulu', 'loose']);
  assert.equal(restoredTabs.find(tab => tab.active)?.url, 'https://zulu.example/active');
  assert.equal(chromeApi.state.updateCalls.filter(call => call.props.active).length, 1);
});

test('restoreImportedSession preserves a 15-tab session with Chrome internal pages', async () => {
  const chromeApi = createChromeMock();
  const firstGroup = ['chrome://extensions/', ...Array.from({ length: 7 }, (_, index) => `https://first.example/${index}`)];
  const secondGroup = Array.from({ length: 5 }, (_, index) => `https://second.example/${index}`);
  const looseTabs = ['chrome://downloads/', 'https://loose.example'];
  const importData = normalizeImportData({
    generator: 'Bookmark Tab Grouper',
    version: '2.0',
    active_tab_url: 'chrome://extensions/',
    active_tab_ref: {
      window_index: 0,
      kind: 'group',
      group_index: 0,
      tab_index: 0,
      url: 'chrome://extensions/'
    },
    windows: [{
      is_focused: true,
      groups: [
        { title: 'Extensions', color: 'blue', tabs: firstGroup },
        { title: 'Second', color: 'green', tabs: secondGroup }
      ],
      ungrouped_tabs: looseTabs
    }]
  });

  const result = await restoreImportedSession(importData, { chromeApi });
  const restoredUrls = chromeApi.state.windows.get(1).tabs.map(tab => tab.url);

  assert.equal(importData.totalTabs, 15);
  assert.equal(result.importedTabs, 15);
  assert.equal(result.failedTabs, 0);
  assert.equal(restoredUrls.includes('chrome://extensions/'), true);
  assert.equal(restoredUrls.includes('chrome://downloads/'), true);
  assert.equal(chromeApi.state.windows.get(1).tabs.find(tab => tab.active)?.url, 'chrome://extensions/');
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
