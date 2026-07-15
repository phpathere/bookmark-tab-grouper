export const GROUP_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

export const IMPORT_LIMITS = {
  maxFileBytes: 1024 * 1024,
  maxWindows: 10,
  maxGroupsPerWindow: 50,
  maxTabs: 300,
  maxUrlLength: 2048,
  maxTitleLength: 80
};

const BLOCKED_URL_PROTOCOLS = new Set(['javascript:', 'data:', 'blob:']);
const RESTORABLE_SESSION_PROTOCOLS = new Set(['http:', 'https:', 'file:', 'view-source:']);
const SAFE_BROWSER_INTERNAL_HOSTS = new Set([
  'bookmarks',
  'downloads',
  'extensions',
  'flags',
  'history',
  'inspect',
  'newtab',
  'settings',
  'version'
]);
const SAFE_ABOUT_PAGES = new Set(['blank', 'newtab']);

function getChromeApi(chromeApi = globalThis.chrome) {
  if (!chromeApi) {
    throw new Error('Chrome API is unavailable.');
  }
  return chromeApi;
}

function safeErrorMessage(error) {
  const message = typeof error?.message === 'string'
    ? error.message
    : String(error || 'Unknown error');
  return message
    .replace(/(?:https?|file|chrome|edge|view-source):[^\s)]+/gi, '[URL]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 240) || 'Unknown error';
}

function countWindowTabs(winData) {
  const groupedCount = Array.isArray(winData.groups)
    ? winData.groups.reduce((sum, group) => sum + (Array.isArray(group.tabs) ? group.tabs.length : 0), 0)
    : 0;
  const ungroupedCount = Array.isArray(winData.ungrouped_tabs) ? winData.ungrouped_tabs.length : 0;
  return groupedCount + ungroupedCount;
}

export function parseUrl(url) {
  try {
    if (typeof url !== 'string' || url.length > IMPORT_LIMITS.maxUrlLength) return null;
    return new URL(url);
  } catch(_) {
    return null;
  }
}

export function isWebUrl(url) {
  const parsed = parseUrl(url);
  return parsed?.protocol === 'http:' || parsed?.protocol === 'https:';
}

export function isRestorableSessionUrl(url) {
  const parsed = parseUrl(url);
  if (!parsed || BLOCKED_URL_PROTOCOLS.has(parsed.protocol)) return false;

  if (parsed.protocol === 'view-source:') {
    return isWebUrl(url.slice('view-source:'.length));
  }

  if (parsed.protocol === 'chrome:' || parsed.protocol === 'edge:') {
    return SAFE_BROWSER_INTERNAL_HOSTS.has(parsed.hostname);
  }

  if (parsed.protocol === 'about:') {
    return SAFE_ABOUT_PAGES.has(parsed.pathname);
  }

  return RESTORABLE_SESSION_PROTOCOLS.has(parsed.protocol);
}

export function isOpenableBookmarkUrl(url) {
  return isRestorableSessionUrl(url);
}

export function getDomainGroupName(url) {
  const parsed = parseUrl(url);
  if (!parsed || !isWebUrl(url)) return null;

  const hostname = parsed.hostname.toLowerCase();
  const parts = hostname.split('.');
  let rootDomain = hostname;

  if (parts.length > 1 && !Number.isNaN(Number(parts[parts.length - 1]))) {
    return hostname;
  }

  if (parts.length > 2) {
    const twoPartTLDs = ['co.uk', 'com.vn', 'co.jp', 'com.au', 'co.in', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn'];
    const tld = parts.slice(-2).join('.');
    rootDomain = twoPartTLDs.includes(tld)
      ? parts.slice(-3).join('.')
      : parts.slice(-2).join('.');
  }

  const groupName = rootDomain.split('.')[0] || rootDomain;
  return groupName.charAt(0).toUpperCase() + groupName.slice(1);
}

export function isBrowserEmptyTab(tab) {
  const url = tab?.pendingUrl || tab?.url || '';
  return !url
    || url === 'about:blank'
    || url.startsWith('chrome://newtab')
    || url.startsWith('chrome://new-tab-page')
    || url.startsWith('edge://newtab')
    || url.startsWith('browser://newtab');
}

export function getSingleEmptyTabFromWindow(win) {
  const tabs = win?.tabs || [];
  return tabs.length === 1 && isBrowserEmptyTab(tabs[0]) ? tabs[0] : null;
}

export function findActiveTabSnapshot(windows, preferredTab = null, preferredWindowId = null) {
  const normalWindows = (Array.isArray(windows) ? windows : [])
    .filter(win => win?.type === 'normal' && Array.isArray(win.tabs));

  if (preferredTab?.id !== undefined) {
    for (const win of normalWindows) {
      const tab = win.tabs.find(candidate => candidate.id === preferredTab.id);
      if (tab) return { id: tab.id, windowId: win.id, url: tab.url };
    }
  }

  if (preferredWindowId !== null && preferredWindowId !== undefined) {
    const preferredWindow = normalWindows.find(win => win.id === preferredWindowId);
    const activeTab = preferredWindow?.tabs.find(tab => tab.active);
    if (activeTab) return { id: activeTab.id, windowId: preferredWindow.id, url: activeTab.url };
  }

  const focusedWindow = normalWindows.find(win => win.focused);
  const focusedTab = focusedWindow?.tabs.find(tab => tab.active);
  if (focusedTab) return { id: focusedTab.id, windowId: focusedWindow.id, url: focusedTab.url };

  if (normalWindows.length === 1) {
    const activeTab = normalWindows[0].tabs.find(tab => tab.active);
    if (activeTab) return { id: activeTab.id, windowId: normalWindows[0].id, url: activeTab.url };
  }

  return null;
}

export async function sortGroupsFirstLooseTabsLast(chromeApi = globalThis.chrome, { windowId = null } = {}) {
  const api = getChromeApi(chromeApi);
  if (!api.tabGroups) return [];

  const queryInfo = windowId === null ? { currentWindow: true } : { windowId };
  const tabs = await api.tabs.query(queryInfo);
  const pinnedCount = tabs.filter(tab => tab.pinned).length;
  const groupTabs = new Map();

  for (const tab of tabs) {
    if (tab.pinned || tab.groupId === api.tabGroups.TAB_GROUP_ID_NONE) continue;
    if (!groupTabs.has(tab.groupId)) groupTabs.set(tab.groupId, []);
    groupTabs.get(tab.groupId).push(tab);
  }

  const groups = [];
  for (const [groupId, tabsInGroup] of groupTabs.entries()) {
    try {
      const groupInfo = await api.tabGroups.get(groupId);
      groups.push({
        id: groupId,
        title: String(groupInfo.title || '').trim(),
        tabIds: tabsInGroup.sort((a, b) => a.index - b.index).map(tab => tab.id)
      });
    } catch (_) {
      // A group can disappear if the user closes it while the popup is open.
    }
  }

  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  groups.sort((a, b) => collator.compare(a.title, b.title) || a.id - b.id);

  // Prepend groups in reverse order at the same boundary. This avoids relying
  // on indexes that Chrome recalculates after moving an entire collapsed group.
  for (const group of [...groups].reverse()) {
    if (typeof api.tabGroups.move === 'function') {
      await api.tabGroups.move(group.id, { index: pinnedCount });
    } else if (group.tabIds.length > 0) {
      await api.tabs.move(group.tabIds, { index: pinnedCount });
    }
  }

  const refreshedTabs = await api.tabs.query(queryInfo);
  const looseTabIds = refreshedTabs
    .filter(tab => !tab.pinned && tab.groupId === api.tabGroups.TAB_GROUP_ID_NONE)
    .sort((a, b) => a.index - b.index)
    .map(tab => tab.id);
  if (looseTabIds.length > 0) {
    await api.tabs.move(looseTabIds, { index: -1 });
  }

  return groups.map(group => group.title);
}

export async function rememberReusableEmptyTab(winId, reusableEmptyTabIds, populatedWin = null, chromeApi = globalThis.chrome) {
  const api = getChromeApi(chromeApi);
  const win = Array.isArray(populatedWin?.tabs)
    ? populatedWin
    : await api.windows.get(winId, { populate: true });
  const emptyTab = getSingleEmptyTabFromWindow(win);
  if (emptyTab?.id) {
    reusableEmptyTabIds.set(winId, emptyTab.id);
  }
}

export async function openTabInWindow(url, { windowId, active = false, reusableEmptyTabIds = null, chromeApi = globalThis.chrome } = {}) {
  const api = getChromeApi(chromeApi);
  if (reusableEmptyTabIds?.has(windowId)) {
    const tabId = reusableEmptyTabIds.get(windowId);
    reusableEmptyTabIds.delete(windowId);
    return api.tabs.update(tabId, { url, active });
  }

  try {
    return await api.tabs.create({ url, windowId, active });
  } catch (error) {
    const parsed = parseUrl(url);
    if (parsed?.protocol !== 'chrome:' && parsed?.protocol !== 'edge:') throw error;

    // Some Chromium builds reject direct creation of a browser-internal URL.
    // Creating a background blank tab first gives those builds a second valid
    // navigation path without weakening the URL allowlist.
    let fallbackTab = null;
    try {
      fallbackTab = await api.tabs.create({ url: 'about:blank', windowId, active: false });
      return await api.tabs.update(fallbackTab.id, { url, active });
    } catch (fallbackError) {
      if (fallbackTab?.id) {
        try {
          await api.tabs.remove(fallbackTab.id);
        } catch (_) {
          // Best effort cleanup only.
        }
      }
      throw fallbackError;
    }
  }
}

export function normalizeImportData(data, getMessage = () => '') {
  if (!data || data.generator !== 'Bookmark Tab Grouper') {
    throw new Error(getMessage('invalidFile') || 'Invalid session file.');
  }

  const rawWindows = (data.version === '2.0' && Array.isArray(data.windows))
    ? data.windows
    : [{
      is_focused: true,
      groups: data.groups || [],
      ungrouped_tabs: data.ungrouped_tabs || []
    }];

  if (rawWindows.length === 0 || rawWindows.length > IMPORT_LIMITS.maxWindows) {
    throw new Error(getMessage('importTooManyWindows') || `Too many windows. Maximum: ${IMPORT_LIMITS.maxWindows}.`);
  }

  let totalTabs = 0;
  const sanitizedWindows = rawWindows.map((winData, windowIndex) => {
    const rawGroups = Array.isArray(winData.groups) ? winData.groups : [];
    if (rawGroups.length > IMPORT_LIMITS.maxGroupsPerWindow) {
      throw new Error(getMessage('importTooManyGroups') || `Too many groups in one window. Maximum: ${IMPORT_LIMITS.maxGroupsPerWindow}.`);
    }

    const groups = rawGroups.map(group => {
      const tabs = Array.isArray(group.tabs) ? group.tabs.filter(isRestorableSessionUrl) : [];
      totalTabs += tabs.length;
      const safeTitle = typeof group.title === 'string'
        ? group.title.slice(0, IMPORT_LIMITS.maxTitleLength)
        : 'Group';
      const safeColor = GROUP_COLORS.includes(group.color) ? group.color : 'grey';
      return { title: safeTitle || 'Group', color: safeColor, tabs };
    }).filter(group => group.tabs.length > 0);

    const ungroupedTabs = Array.isArray(winData.ungrouped_tabs)
      ? winData.ungrouped_tabs.filter(isRestorableSessionUrl)
      : [];
    totalTabs += ungroupedTabs.length;

    return {
      is_focused: Boolean(winData.is_focused || windowIndex === 0),
      groups,
      ungrouped_tabs: ungroupedTabs
    };
  }).filter(winData => winData.groups.length > 0 || winData.ungrouped_tabs.length > 0);

  if (sanitizedWindows.length === 0 || totalTabs === 0) {
    throw new Error(getMessage('noBookmarksFound') || 'No restorable tabs found.');
  }

  if (totalTabs > IMPORT_LIMITS.maxTabs) {
    throw new Error(getMessage('importTooManyTabs') || `Too many tabs. Maximum: ${IMPORT_LIMITS.maxTabs}.`);
  }

  return {
    active_tab_url: isRestorableSessionUrl(data.active_tab_url) ? data.active_tab_url : null,
    active_tab_ref: normalizeActiveTabRef(data.active_tab_ref),
    windows: sanitizedWindows,
    totalTabs,
    totalGroups: sanitizedWindows.reduce((sum, winData) => sum + winData.groups.length, 0)
  };
}

function normalizeActiveTabRef(ref) {
  if (!ref || typeof ref !== 'object') return null;
  const validKind = ref.kind === 'group' || ref.kind === 'ungrouped';
  const validIndexes = Number.isInteger(ref.window_index)
    && ref.window_index >= 0
    && Number.isInteger(ref.tab_index)
    && ref.tab_index >= 0
    && (ref.kind === 'ungrouped' || (Number.isInteger(ref.group_index) && ref.group_index >= 0));
  if (!validKind || !validIndexes || !isRestorableSessionUrl(ref.url)) return null;
  return {
    window_index: ref.window_index,
    kind: ref.kind,
    group_index: ref.kind === 'group' ? ref.group_index : null,
    tab_index: ref.tab_index,
    url: ref.url
  };
}

export async function restoreImportedSession(importData, { chromeApi = globalThis.chrome, logger = null } = {}) {
  const api = getChromeApi(chromeApi);
  const failures = [];
  const reusableEmptyTabIds = new Map();
  let importedTabs = 0;
  let activeTabId = null;
  let activeTabWindowId = null;
  let fallbackActiveTab = null;
  let targetWindowId = null;

  const recordFailure = (failure) => {
    const safeFailure = {
      scope: failure.scope,
      action: failure.action,
      windowIndex: failure.windowIndex,
      groupTitle: failure.groupTitle,
      message: safeErrorMessage(failure.error)
    };
    failures.push(safeFailure);
    if (logger?.warn) {
      logger.warn('Bookmark Tab Grouper import issue', {
        scope: safeFailure.scope,
        action: safeFailure.action,
        windowIndex: safeFailure.windowIndex,
        message: safeFailure.message
      });
    }
  };

  const currentWin = await api.windows.getCurrent({ populate: true });
  const currentTabs = currentWin.tabs || [];
  const isCurrentWinEmpty = currentTabs.length === 1 && isBrowserEmptyTab(currentTabs[0]);
  let usedCurrentWin = false;

  // Best-effort restore: one bad tab, group, or window should be recorded in
  // failures[] without aborting the remaining supported session data.
  for (let windowIndex = 0; windowIndex < importData.windows.length; windowIndex++) {
    const winData = importData.windows[windowIndex];
    let winId;
    const createdTabIds = new Set();

    try {
      if (isCurrentWinEmpty && !usedCurrentWin) {
        winId = currentWin.id;
        usedCurrentWin = true;
        // Keep the currently active blank tab untouched until all tabs have
        // been restored. Navigating it mid-import can close this popup and
        // interrupt the remaining restore work.
      } else {
        const newWin = await api.windows.create({ focused: false });
        winId = newWin.id;
        await rememberReusableEmptyTab(winId, reusableEmptyTabIds, newWin, api);
      }
    } catch (error) {
      recordFailure({ scope: 'window', action: 'createWindow', windowIndex, error });
      continue;
    }

    if (winData.is_focused) {
      targetWindowId = winId;
    }

    for (const [groupIndex, group] of (winData.groups || []).entries()) {
      const tabIds = [];
      for (const [tabIndex, url] of (group.tabs || []).entries()) {
        const activeRef = importData.active_tab_ref;
        const shouldActivate = activeTabId === null && activeRef
          ? activeRef.window_index === windowIndex
            && activeRef.kind === 'group'
            && activeRef.group_index === groupIndex
            && activeRef.tab_index === tabIndex
            && activeRef.url === url
          : activeTabId === null && !activeRef && url === importData.active_tab_url;
        try {
          const tab = await openTabInWindow(url, {
            windowId: winId,
            active: false,
            reusableEmptyTabIds,
            chromeApi: api
          });
          if (!fallbackActiveTab && url === importData.active_tab_url) {
            fallbackActiveTab = { id: tab.id, windowId: winId };
          }
          if (shouldActivate) {
            activeTabId = tab.id;
            activeTabWindowId = winId;
          }
          importedTabs++;
          tabIds.push(tab.id);
          createdTabIds.add(tab.id);
        } catch (error) {
          recordFailure({ scope: 'tab', action: 'createGroupedTab', windowIndex, groupTitle: group.title, error });
        }
      }

      if (api.tabGroups && tabIds.length > 0) {
        try {
          const groupId = await api.tabs.group({ tabIds, createProperties: { windowId: winId } });
          await api.tabGroups.update(groupId, {
            title: group.title || 'Group',
            color: group.color || 'grey',
            collapsed: true
          });
        } catch (error) {
          recordFailure({ scope: 'group', action: 'restoreGroup', windowIndex, groupTitle: group.title, error });
        }
      }
    }

    for (const [tabIndex, url] of (winData.ungrouped_tabs || []).entries()) {
      const activeRef = importData.active_tab_ref;
      const shouldActivate = activeTabId === null && activeRef
        ? activeRef.window_index === windowIndex
          && activeRef.kind === 'ungrouped'
          && activeRef.tab_index === tabIndex
          && activeRef.url === url
        : activeTabId === null && !activeRef && url === importData.active_tab_url;
      try {
        const tab = await openTabInWindow(url, {
          windowId: winId,
          active: false,
          reusableEmptyTabIds,
          chromeApi: api
        });
        if (!fallbackActiveTab && url === importData.active_tab_url) {
          fallbackActiveTab = { id: tab.id, windowId: winId };
        }
        if (shouldActivate) {
          activeTabId = tab.id;
          activeTabWindowId = winId;
        }
        importedTabs++;
        createdTabIds.add(tab.id);
      } catch (error) {
        recordFailure({ scope: 'tab', action: 'createUngroupedTab', windowIndex, error });
      }
    }

    try {
      const allTabs = await api.tabs.query({ windowId: winId });
      if (allTabs.length > createdTabIds.size && createdTabIds.size > 0) {
        for (const tab of allTabs) {
          if (!createdTabIds.has(tab.id)) {
            try {
              await api.tabs.remove(tab.id);
            } catch (error) {
              recordFailure({ scope: 'cleanup', action: 'removeInitialTab', windowIndex, error });
            }
          }
        }
      }
    } catch (error) {
      recordFailure({ scope: 'cleanup', action: 'queryTabsForCleanup', windowIndex, error });
    }

    try {
      await sortGroupsFirstLooseTabsLast(api, { windowId: winId });
    } catch (error) {
      recordFailure({ scope: 'sort', action: 'sortImportedGroups', windowIndex, error });
    }
  }

  if (activeTabId === null && fallbackActiveTab) {
    activeTabId = fallbackActiveTab.id;
    activeTabWindowId = fallbackActiveTab.windowId;
  }

  if (activeTabId !== null) {
    try {
      await api.tabs.update(activeTabId, { active: true });
    } catch (error) {
      recordFailure({ scope: 'tab', action: 'activateImportedTab', windowIndex: null, error });
    }
  }

  const finalWindowId = activeTabWindowId ?? targetWindowId;
  if (finalWindowId !== null) {
    try {
      await api.windows.update(finalWindowId, { focused: true });
    } catch (error) {
      recordFailure({ scope: 'window', action: 'focusWindow', windowIndex: null, error });
    }
  }

  return {
    attemptedTabs: importData.totalTabs,
    importedTabs,
    failedTabs: Math.max(importData.totalTabs - importedTabs, 0),
    failures,
    skippedTabsDueToWindowFailures: importData.windows.reduce((sum, winData, index) => {
      const windowFailed = failures.some(failure => failure.scope === 'window' && failure.action === 'createWindow' && failure.windowIndex === index);
      return windowFailed ? sum + countWindowTabs(winData) : sum;
    }, 0)
  };
}

export function formatImportResult(result, getMessage = () => '') {
  if (result.failedTabs === 0 && result.failures.length === 0) {
    return getMessage('importSuccess') || 'Session imported successfully.';
  }

  const template = getMessage('importPartialSuccess') || 'Imported {IMPORTED}/{TOTAL} tabs; {FAILED} failed.';
  let message = template
    .replace('{IMPORTED}', String(result.importedTabs))
    .replace('{TOTAL}', String(result.attemptedTabs))
    .replace('{FAILED}', String(result.failedTabs));

  if (result.failures.some(failure => failure.scope === 'group')) {
    message += ` ${getMessage('importGroupPartialWarning') || 'Some groups could not be restored.'}`;
  }

  return message;
}
