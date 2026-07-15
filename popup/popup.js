import {
  GROUP_COLORS,
  IMPORT_LIMITS,
  findActiveTabSnapshot,
  formatImportResult,
  getDomainGroupName,
  isOpenableBookmarkUrl,
  isRestorableSessionUrl,
  isWebUrl,
  normalizeImportData,
  openTabInWindow,
  rememberReusableEmptyTab,
  restoreImportedSession,
  sortGroupsFirstLooseTabsLast
} from './session-utils.js';

let currentLang = 'vi';
let translations = null;
let bookmarkFolders = [];
let savedTabState = null;
let statusHideTimer = null;
let activeModal = null;
let modalReturnFocus = null;

// Capture the page behind the toolbar popup immediately. Once asynchronous UI
// work starts, relying on the browser's current/last-focused window can point
// at a different window and lose the tab that the user actually exported from.
let popupSourceTabPromise;
try {
  popupSourceTabPromise = chrome.tabs.query({ active: true, currentWindow: true })
    .then(([tab]) => tab || null)
    .catch(() => null);
} catch (_) {
  popupSourceTabPromise = Promise.resolve(null);
}

function getSafeErrorMessage(error, fallback = 'Something went wrong.') {
  const message = typeof error?.message === 'string' ? error.message : fallback;
  return message
    .replace(/(?:https?|file|chrome|edge|view-source):[^\s)]+/gi, '[URL]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 240) || fallback;
}

function logExtensionError(context, error, level = 'warn') {
  const message = `[Tab Bookmark Grouper] ${context}: ${getSafeErrorMessage(error)}`;
  (console[level] || console.warn)(message);
}

async function initLanguage() {
  try {
    let savedLang = 'auto';
    if (chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get('lang');
      savedLang = data.lang || 'auto'; 
    }
    
    if (savedLang === 'auto') {
      let defaultLang = 'vi';
      if (chrome.i18n && chrome.i18n.getUILanguage) {
        const uiLang = chrome.i18n.getUILanguage().split('-')[0];
        defaultLang = (uiLang === 'vi') ? 'vi' : 'en';
      }
      currentLang = defaultLang;
    } else {
      currentLang = savedLang;
    }
    
    // Pre-select the dropdown
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = savedLang;
    
  } catch(e) {
    logExtensionError('Storage get failed', e, 'error');
    currentLang = 'en';
  }
  
  await loadTranslations(currentLang);
  localizeHtmlPage();
}

async function loadTranslations(lang) {
  try {
    const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    const response = await fetch(url);
    translations = await response.json();
  } catch (e) {
    logExtensionError(`Failed to load translations for ${lang}`, e, 'error');
    translations = null;
  }
}

function getMessage(key) {
  if (translations && translations[key] && translations[key].message) {
    return translations[key].message;
  }
  return chrome.i18n.getMessage(key); // Fallback
}

function createOption(value, text, options = {}) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  if (options.disabled) option.disabled = true;
  if (options.selected) option.selected = true;
  if (options.i18nKey) option.dataset.i18n = options.i18nKey;
  return option;
}

function replaceChildrenWithOption(selectElement, option) {
  selectElement.replaceChildren(option);
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll([
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(','))).filter(element => element.offsetParent !== null || element === document.activeElement);
}

function openModal(modal, initialFocus = null) {
  if (!modal) return;
  activeModal = modal;
  modalReturnFocus = document.activeElement;
  modal.classList.remove('hidden');
  const focusTarget = initialFocus || getFocusableElements(modal)[0] || modal;
  focusTarget.focus();
}

function closeModal(modal = activeModal) {
  if (!modal) return;
  modal.classList.add('hidden');
  activeModal = null;
  if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') {
    modalReturnFocus.focus();
  }
  modalReturnFocus = null;
}

function localizeHtmlPage() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const msg = el.getAttribute('data-i18n');
    const localizedStr = getMessage(msg);
    if (localizedStr) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = localizedStr;
      } else {
        el.textContent = localizedStr;
      }
    }
  });
}

async function initTheme() {
  try {
    let savedTheme = 'light';
    if (chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get('theme');
      savedTheme = data.theme || 'light';
    }
    
    applyTheme(savedTheme);
    
    // Pre-select the dropdown
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = savedTheme;
    
  } catch(e) {
    logExtensionError('Storage theme get failed', e, 'error');
  }
}

function applyTheme(theme) {
  if (theme === 'auto') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Watch for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
  if (chrome.storage && chrome.storage.local) {
    const data = await chrome.storage.local.get('theme');
    if (!data.theme || data.theme === 'auto') {
      applyTheme('auto');
    }
  }
});


async function getProfileName() {
  let profileName = 'Session';
  try {
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) profileName = "Edge";
    else if (ua.includes("Chrome/")) profileName = "Chrome";
    else profileName = "Browser";
    
    const currentWindow = await chrome.windows.getCurrent();
    if (currentWindow && currentWindow.id) {
      profileName += `_${currentWindow.id}`;
    }
  } catch (e) {
    logExtensionError('Could not get window info', e);
  }
  return profileName;
}

async function updateStatsBar() {
  const statsBar = document.getElementById('statsBar');
  if (!statsBar) return;
  
  try {
    const profile = await getProfileName();
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabCount = tabs.length;
    
    // Count unique groups
    const groupIds = new Set();
    for (const tab of tabs) {
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        groupIds.add(tab.groupId);
      }
    }
    const groupCount = groupIds.size;
    
    const isEn = getMessage('defaultOption') === '-- Choose a folder --';
    const prefix = isEn ? 'Current' : 'Hiện tại';

    const leadingText = document.createTextNode(`${prefix}: ${tabCount} tab `);
    const separator = document.createElement('span');
    separator.className = 'stats-separator';
    separator.textContent = '|';
    const trailingText = document.createTextNode(` ${groupCount} group`);
    statsBar.replaceChildren(leadingText, separator, trailingText);
  } catch (e) {
    logExtensionError('Failed to update stats bar', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initLanguage();
  await initTheme();
  await updateStatsBar();

  // Settings Modal Logic
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  
  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      openModal(settingsModal, closeSettingsBtn);
    });
  }
  
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => {
      closeModal(settingsModal);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (!activeModal) return;

    if (event.key === 'Escape' && activeModal === settingsModal) {
      event.preventDefault();
      closeModal(settingsModal);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements(activeModal);
    if (focusable.length === 0) {
      event.preventDefault();
      activeModal.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const newTheme = e.target.value;
      if (chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ theme: newTheme });
      }
      applyTheme(newTheme);
    });
  }

  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      if (chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ lang: newLang });
      }
      await initLanguage();
    });
  }

  const resetSettingsBtn = document.getElementById('resetSettingsBtn');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', async () => {
      if (chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(['theme', 'lang']);
      }
      
      if (themeSelect) themeSelect.value = 'light';
      if (langSelect) langSelect.value = 'auto';
      
      applyTheme('light');
      await initLanguage();
      
      showStatus(getMessage('resetSuccess') || 'Settings reset to default.', 'success');
      closeModal(settingsModal);
    });
  }

  const folderSelect = document.getElementById('folderSelect');
  const actionBtn = document.getElementById('actionBtn');
  
  // Reveal body immediately to prevent FOUC (Hanging UI)
  document.body.style.visibility = 'visible';
  
  // Set loading state
  replaceChildrenWithOption(folderSelect, createOption('', 'Loading...', { disabled: true, selected: true }));

  // Load bookmark tree asynchronously without blocking UI
  chrome.bookmarks.getTree().then(tree => {
    replaceChildrenWithOption(folderSelect, createOption('', '-- Choose a folder --', {
      disabled: true,
      selected: true,
      i18nKey: 'defaultOption'
    }));
    populateFolderSelect(tree[0], folderSelect);
    localizeHtmlPage(); // Re-localize the default option
  }).catch(error => {
    logExtensionError('Opening bookmarks failed', error, 'error');
    showStatus(getSafeErrorMessage(error), 'error', { persist: true });
  });

  // Handle action button click
  actionBtn.addEventListener('click', handleOpenAndGroup);

  const groupByDomainBtn = document.getElementById('groupByDomainBtn');
  if (groupByDomainBtn) {
    updateGroupByDomainButton();
    groupByDomainBtn.addEventListener('click', async () => {
      if (savedTabState?.newlyGroupedTabIds?.length) {
        await handleUndoGroupByDomain();
      } else {
        await handleGroupByDomain();
      }
    });
  }

  // Handle Export/Import
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleFileImport);
  
  // Hide export button if there's nothing to export
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const exportBtn = document.getElementById('exportBtn');
    
    let hasExportableData = false;
    const hasGroup = tabs.some(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);
    
    if (tabs.length > 1) {
      hasExportableData = true;
    } else if (tabs.length === 1) {
      const url = tabs[0].url;
      if (url && !url.startsWith('chrome://') && !url.startsWith('edge://') && url !== 'about:blank') {
        hasExportableData = true;
      }
    }
    
    if (!hasExportableData && !hasGroup) {
      exportBtn.style.display = 'none';
    }
  } catch(e) {
    logExtensionError('Could not check tabs on load', e);
  }
});

// Recursively find and populate bookmark folders
function populateFolderSelect(node, selectElement, depth = 0) {
  if (!node.url && node.id !== "0") {
    bookmarkFolders.push(node);
    const option = document.createElement('option');
    option.value = node.id;
    option.textContent = ' '.repeat(depth * 4) + (node.title || 'Unknown');
    selectElement.appendChild(option);
  }

  if (node.children) {
    // Sort children alphabetically for aesthetics
    const sortedChildren = [...node.children].sort((a, b) => {
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      return titleA.localeCompare(titleB);
    });
    
    sortedChildren.forEach(child => {
      populateFolderSelect(child, selectElement, node.id === "0" ? depth : depth + 1);
    });
  }
}

async function openBookmarkLinks(links, { windowId, reusableEmptyTabIds }) {
  const tabIds = [];
  const failures = [];

  for (const link of links) {
    try {
      const tab = await openTabInWindow(link.url, {
        windowId,
        active: false,
        reusableEmptyTabIds
      });
      if (typeof tab?.id === 'number') tabIds.push(tab.id);
      else failures.push({ action: 'createTab', error: new Error('Chrome returned no tab id.') });
    } catch (error) {
      failures.push({ action: 'createTab', error });
    }
  }

  return { tabIds, failures };
}

function formatBookmarkResult(opened, total, failures) {
  if (failures === 0) return getMessage('successMessage');
  return (getMessage('bookmarkPartialSuccess') || 'Opened {OPENED}/{TOTAL} tabs; {FAILED} failed.')
    .replace('{OPENED}', String(opened))
    .replace('{TOTAL}', String(total))
    .replace('{FAILED}', String(failures));
}

async function handleOpenAndGroup() {
  const folderSelect = document.getElementById('folderSelect');
  const actionBtn = document.getElementById('actionBtn');
  const selectedId = folderSelect.value;
  
  if (!selectedId) {
    showStatus(getMessage('noFolderSelected'), 'error');
    return;
  }

  actionBtn.disabled = true;
  showStatus('Processing...', 'success');

  try {
    const subTrees = await chrome.bookmarks.getSubTree(selectedId);
    if (!subTrees || subTrees.length === 0 || !subTrees[0].children) {
      showStatus(getMessage('noBookmarksFound'), 'error');
      actionBtn.disabled = false;
      return;
    }

    const parentNode = subTrees[0];
    let openedTabs = 0;
    let failedTabs = 0;
    let colorIndex = 0;
    const currentWin = await chrome.windows.getCurrent({ populate: true });
    const reusableEmptyTabIds = new Map();
    await rememberReusableEmptyTab(currentWin.id, reusableEmptyTabIds, currentWin);

    // Phân loại: Link trực tiếp và Thư mục con
    const directLinks = [];
    const subFolders = [];
    
    if (parentNode.children) {
      for (const child of parentNode.children) {
        if (child.url && isOpenableBookmarkUrl(child.url)) {
          directLinks.push(child);
        } else if (child.children && child.children.length > 0) {
          subFolders.push(child);
        }
      }
    }

    const linkGroups = [
      { node: parentNode, links: directLinks }
    ];
    subFolders.forEach((groupNode) => {
      linkGroups.push({
        node: groupNode,
        links: extractAllLinks(groupNode).filter(link => isOpenableBookmarkUrl(link.url))
      });
    });
    const totalLinks = linkGroups.reduce((sum, group) => sum + group.links.length, 0);

    if (totalLinks === 0) {
      showStatus(getMessage('noBookmarksFound'), 'error', { persist: true });
      return;
    }

    if (totalLinks > IMPORT_LIMITS.maxTabs) {
      const message = (getMessage('bookmarkTooManyTabs') || 'This folder contains {COUNT} supported tabs. Maximum: {MAX}.')
        .replace('{COUNT}', String(totalLinks))
        .replace('{MAX}', String(IMPORT_LIMITS.maxTabs));
      showStatus(message, 'error', { persist: true });
      return;
    }

    // Xử lý các link trực tiếp nằm trong thư mục gốc được chọn
    for (const [groupIndex, group] of linkGroups.entries()) {
      if (typeof chrome.tabGroups === 'undefined') {
        try {
          await chrome.windows.create({
            url: group.links.map(link => link.url),
            focused: groupIndex === 0
          });
          openedTabs += group.links.length;
        } catch (error) {
          failedTabs += group.links.length;
          logExtensionError('Opening bookmark window failed', error);
        }
        continue;
      }

      const result = await openBookmarkLinks(group.links, {
        windowId: currentWin.id,
        reusableEmptyTabIds
      });
      openedTabs += result.tabIds.length;
      failedTabs += result.failures.length;
      result.failures.forEach(failure => logExtensionError(failure.action, failure.error));

      if (result.tabIds.length === 0) continue;

      try {
        const groupId = await chrome.tabs.group({ tabIds: result.tabIds });
        const color = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
        colorIndex++;
        await chrome.tabGroups.update(groupId, {
          title: group.node.title || 'Group',
          color,
          collapsed: true
        });
      } catch (error) {
        failedTabs++;
        logExtensionError('Grouping opened bookmarks failed', error);
      }
    }

    showStatus(formatBookmarkResult(openedTabs, totalLinks, failedTabs), failedTabs ? 'warning' : 'success', { persist: Boolean(failedTabs) });
    updateStatsBar();
  } catch (error) {
    logExtensionError('Opening bookmarks failed', error, 'error');
    showStatus(getSafeErrorMessage(error), 'error', { persist: true });
  } finally {
    actionBtn.disabled = false;
  }
}

function extractAllLinks(node) {
  let links = [];
  if (node.url) {
    links.push(node);
  }
  if (node.children) {
    node.children.forEach(child => {
      links = links.concat(extractAllLinks(child));
    });
  }
  return links;
}

function showStatus(message, type, options = {}) {
  const statusEl = document.getElementById('statusMessage');
  if (!statusEl) return;
  if (statusHideTimer) {
    clearTimeout(statusHideTimer);
    statusHideTimer = null;
  }
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.setAttribute('aria-live', type === 'error' || type === 'warning' ? 'assertive' : 'polite');

  if (options.persist) return;

  statusHideTimer = setTimeout(() => {
    statusEl.classList.add('hidden');
    statusHideTimer = null;
  }, type === 'success' ? 5000 : 12000);
}

function updateGroupByDomainButton() {
  const groupByDomainBtn = document.getElementById('groupByDomainBtn');
  if (!groupByDomainBtn) return;

  const hasUndo = Boolean(
    savedTabState?.newlyGroupedTabIds?.length || savedTabState?.originalGroups?.length
  );
  groupByDomainBtn.textContent = hasUndo
    ? (getMessage('undoGroupByWebsite') || 'Undo Group by Domain')
    : (getMessage('groupByWebsite') || 'Group by Domain');
  groupByDomainBtn.classList.toggle('undo-mode', hasUndo);
  groupByDomainBtn.setAttribute('aria-pressed', String(hasUndo));
}

async function handleGroupByDomain() {
  try {
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const existingGroupsByTitle = new Map();

    // Phase 1: detect existing group titles so duplicate domain groups can be merged
    // instead of creating a second "Google", "Github", etc.
    if (typeof chrome.tabGroups !== 'undefined') {
      const seenGroupIds = new Set();
      for (const tab of allTabs) {
        if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE || seenGroupIds.has(tab.groupId)) continue;
        seenGroupIds.add(tab.groupId);
        try {
          const groupInfo = await chrome.tabGroups.get(tab.groupId);
          const title = normalizeGroupTitle(groupInfo.title);
          if (title) {
            if (!existingGroupsByTitle.has(title)) {
              existingGroupsByTitle.set(title, []);
            }
            existingGroupsByTitle.get(title).push(tab.groupId);
          }
        } catch (_) {
          // The group may disappear while the popup is open; skip and continue.
        }
      }
    }

    // Phase 2: bucket unpinned web tabs by normalized root domain.
    // Single-tab domains are intentionally left loose unless they help merge duplicates.
    const domainMap = new Map();
    for (const tab of allTabs) {
      if (tab.pinned || !tab.url || !isWebUrl(tab.url)) continue;
      const groupName = getDomainGroupName(tab.url);
      if (!groupName) continue;
      const key = normalizeGroupTitle(groupName);
      if (!domainMap.has(key)) {
        const existingGroupIds = existingGroupsByTitle.get(key) || [];
        domainMap.set(key, {
          title: groupName,
          ungroupedTabIds: [],
          groupedTabs: [],
          existingGroupIds,
          targetGroupId: existingGroupIds[0] || null
        });
      }

      const domainEntry = domainMap.get(key);
      if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        domainEntry.ungroupedTabIds.push(tab.id);
      } else {
        domainEntry.groupedTabs.push({ id: tab.id, groupId: tab.groupId });
        if (!domainEntry.targetGroupId) {
          domainEntry.targetGroupId = tab.groupId;
        }
      }
    }

    const originalGroups = await captureAffectedGroupSnapshot(domainMap, allTabs);

    let colorIndex = 0;
    let changedGroups = 0;
    let newlyGroupedTabIds = [];
    for (const domainEntry of domainMap.values()) {
      const totalDomainTabs = domainEntry.ungroupedTabIds.length + domainEntry.groupedTabs.length;
      const hasDuplicateGroups = new Set(domainEntry.existingGroupIds).size > 1;
      if (totalDomainTabs <= 1 || (domainEntry.ungroupedTabIds.length === 0 && !hasDuplicateGroups)) continue;

      newlyGroupedTabIds = newlyGroupedTabIds.concat(domainEntry.ungroupedTabIds);
      const tabIdsToGroup = hasDuplicateGroups
        ? domainEntry.ungroupedTabIds.concat(
          domainEntry.groupedTabs
            .filter(tab => tab.groupId !== domainEntry.targetGroupId)
            .map(tab => tab.id)
        )
        : domainEntry.ungroupedTabIds;
      if (tabIdsToGroup.length === 0) continue;
      const groupOptions = { tabIds: tabIdsToGroup };
      if (domainEntry.targetGroupId) {
        groupOptions.groupId = domainEntry.targetGroupId;
      }
      const groupId = await chrome.tabs.group(groupOptions);

      if (!domainEntry.targetGroupId) {
        const color = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
        colorIndex++;
        await chrome.tabGroups.update(groupId, {
          title: domainEntry.title,
          color: color,
          collapsed: true
        });
      }
      changedGroups++;
    }
    
    if (changedGroups === 0) {
      await organizeCurrentWindowGroupsAlphabetically();
      showStatus(getMessage('noTabsToGroup') || 'Không có trang web nào có nhiều hơn 1 tab', 'success');
      updateGroupByDomainButton();
    } else {
      // Save state for undo
      savedTabState = { newlyGroupedTabIds, originalGroups };
      try {
        await organizeCurrentWindowGroupsAlphabetically();
        showStatus(getMessage('groupByDomainSuccess') || 'Đã nhóm theo trang web', 'success');
      } catch (sortError) {
        showStatus(getMessage('groupSortWarning') || 'Grouped tabs, but could not sort groups.', 'warning');
      }
      updateGroupByDomainButton();
      updateStatsBar();
    }
  } catch (error) {
    logExtensionError('Domain grouping failed', error, 'error');
    showStatus(getSafeErrorMessage(error), 'error', { persist: true });
  }
}

async function organizeCurrentWindowGroupsAlphabetically() {
  return sortGroupsFirstLooseTabsLast(chrome);
}

function normalizeGroupTitle(title) {
  return String(title || '').trim().toLowerCase();
}

async function captureAffectedGroupSnapshot(domainMap, allTabs) {
  if (typeof chrome.tabGroups === 'undefined') return [];

  const affectedGroupIds = new Set();
  for (const entry of domainMap.values()) {
    entry.existingGroupIds.forEach(groupId => affectedGroupIds.add(groupId));
    entry.groupedTabs.forEach(tab => affectedGroupIds.add(tab.groupId));
  }

  const snapshot = [];
  for (const groupId of affectedGroupIds) {
    try {
      const groupInfo = await chrome.tabGroups.get(groupId);
      const tabIds = allTabs
        .filter(tab => tab.groupId === groupId)
        .sort((a, b) => a.index - b.index)
        .map(tab => tab.id);
      if (tabIds.length > 0) {
        snapshot.push({
          tabIds,
          title: groupInfo.title || '',
          color: groupInfo.color || 'grey',
          collapsed: Boolean(groupInfo.collapsed)
        });
      }
    } catch (_) {
      // A group can disappear while the popup is open; it cannot be restored.
    }
  }

  return snapshot;
}

async function restoreAffectedGroups(snapshot, looseTabIds) {
  const tabIdsToRestore = [...new Set([
    ...looseTabIds,
    ...snapshot.flatMap(group => group.tabIds)
  ])];
  if (tabIdsToRestore.length > 0) {
    await chrome.tabs.ungroup(tabIdsToRestore);
  }

  const currentTabs = await chrome.tabs.query({ currentWindow: true });
  for (const group of snapshot) {
    const existingTabIds = group.tabIds.filter(tabId => currentTabs.some(tab => tab.id === tabId));
    if (existingTabIds.length === 0) continue;
    const groupId = await chrome.tabs.group({ tabIds: existingTabIds });
    await chrome.tabGroups.update(groupId, {
      title: group.title,
      color: group.color,
      collapsed: group.collapsed
    });
  }
}

async function handleUndoGroupByDomain() {
  if (!savedTabState || !savedTabState.newlyGroupedTabIds) {
    showStatus(getMessage('noUndoAvailable') || 'Không có hành động nào để hoàn tác', 'error');
    return;
  }
  
  try {
    await restoreAffectedGroups(
      savedTabState.originalGroups || [],
      savedTabState.newlyGroupedTabIds
    );
    
    savedTabState = null; // Clear state after undo
    showStatus(getMessage('undoSuccess') || 'Đã khôi phục trạng thái cũ', 'success');
    updateGroupByDomainButton();
    updateStatsBar();
  } catch(error) {
    logExtensionError('Undo grouping failed', error, 'error');
    showStatus(getSafeErrorMessage(error), 'error', { persist: true });
  }
}

async function handleExport() {
  const exportBtn = document.getElementById('exportBtn');
  exportBtn.disabled = true;
  showStatus('Exporting...', 'success');

  try {
    const windows = await chrome.windows.getAll({ populate: true });

    const popupSourceTab = await popupSourceTabPromise;
    let lastFocusedWindowId = null;
    try {
      const lastFocusedWindow = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
      lastFocusedWindowId = lastFocusedWindow?.id ?? null;
    } catch (_) {
      // Populated window/tab state below remains the fallback.
    }
    const activeTabSnapshot = findActiveTabSnapshot(windows, popupSourceTab, lastFocusedWindowId);
    if (!activeTabSnapshot) {
      throw new Error('Could not identify the active tab. Close and reopen the extension, then export again.');
    }
    
    const exportData = {
      version: "2.0",
      generator: "Bookmark Tab Grouper",
      export_date: new Date().toISOString(),
      active_tab_url: null,
      active_tab_ref: null,
      windows: []
    };

    for (const win of windows) {
      if (win.type !== 'normal') continue;

      const windowIndex = exportData.windows.length;
      const groupMap = new Map();
      const ungrouped = [];
      let activeTabLocation = null;

      for (const tab of win.tabs) {
        const isThisWindowFocused = activeTabSnapshot
          ? win.id === activeTabSnapshot.windowId
          : Boolean(win.focused);
        const isActiveTab = activeTabSnapshot
          ? tab.id === activeTabSnapshot.id
          : Boolean(tab.active && isThisWindowFocused);
        if (isActiveTab && isThisWindowFocused) {
          exportData.active_tab_url = tab.url;
        }

        if (typeof chrome.tabGroups !== 'undefined' && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
          if (!groupMap.has(tab.groupId)) {
            groupMap.set(tab.groupId, []);
          }
          const groupTabs = groupMap.get(tab.groupId);
          if (isActiveTab && isThisWindowFocused) {
            activeTabLocation = {
              kind: 'group',
              groupId: tab.groupId,
              tabIndex: groupTabs.length,
              url: tab.url
            };
          }
          groupTabs.push(tab.url);
        } else {
          if (isActiveTab && isThisWindowFocused) {
            activeTabLocation = {
              kind: 'ungrouped',
              tabIndex: ungrouped.length,
              url: tab.url
            };
          }
          ungrouped.push(tab.url);
        }
      }

      const isThisWindowFocused = activeTabSnapshot
        ? win.id === activeTabSnapshot.windowId
        : Boolean(win.focused);
      const winData = {
        is_focused: isThisWindowFocused,
        groups: [],
        ungrouped_tabs: ungrouped
      };

      if (typeof chrome.tabGroups !== 'undefined') {
        for (const [groupId, groupTabs] of groupMap.entries()) {
          try {
            const groupInfo = await chrome.tabGroups.get(groupId);
            const groupIndex = winData.groups.length;
            winData.groups.push({
              title: groupInfo.title || '',
              color: groupInfo.color || 'grey',
              tabs: groupTabs
            });
            if (activeTabLocation?.kind === 'group' && activeTabLocation.groupId === groupId) {
              exportData.active_tab_ref = {
                window_index: windowIndex,
                kind: 'group',
                group_index: groupIndex,
                tab_index: activeTabLocation.tabIndex,
                url: activeTabLocation.url
              };
            }
          } catch (_) {
            const firstUngroupedIndex = winData.ungrouped_tabs.length;
            winData.ungrouped_tabs = winData.ungrouped_tabs.concat(groupTabs);
            if (activeTabLocation?.kind === 'group' && activeTabLocation.groupId === groupId) {
              exportData.active_tab_ref = {
                window_index: windowIndex,
                kind: 'ungrouped',
                group_index: null,
                tab_index: firstUngroupedIndex + activeTabLocation.tabIndex,
                url: activeTabLocation.url
              };
            }
          }
        }
      }

      if (activeTabLocation?.kind === 'ungrouped') {
        exportData.active_tab_ref = {
          window_index: windowIndex,
          kind: 'ungrouped',
          group_index: null,
          tab_index: activeTabLocation.tabIndex,
          url: activeTabLocation.url
        };
      }

      exportData.windows.push(winData);
    }

    if (isRestorableSessionUrl(activeTabSnapshot.url) && !exportData.active_tab_ref) {
      throw new Error('Could not preserve the active tab in this export. Close and reopen the extension, then export again.');
    }
    
    // Encode data to proprietary format
    const encodedData = btoa(encodeURIComponent(JSON.stringify(exportData)));
    const blob = new Blob([encodedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    // Helpers for file name
    const removeAccents = (str) => {
      return str.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                .replace(/[^a-zA-Z0-9]/g, '_');
    };
    
    const getBrowserName = () => {
      const ua = navigator.userAgent;
      if (ua.includes("Edg/")) return "Edge";
      if (ua.includes("Chrome/")) return "Chrome";
      return "Browser";
    };
    
    let profileName = await getProfileName();
    profileName = removeAccents(profileName);
    
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dateStr = `${dd}_${mm}_${yyyy}_${hh}_${min}_${ss}`;
    
    const filename = `tabgroupexport/Session_${getBrowserName()}_${profileName}_${dateStr}.btg`;
    
    await new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || 'Download could not be started.'));
          return;
        }
        if (typeof downloadId !== 'number') {
          reject(new Error('Download could not be started.'));
          return;
        }
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve(downloadId);
      });
    });
    
    showStatus(getMessage('exportSuccess'), 'success');
  } catch (error) {
    logExtensionError('Export failed', error, 'error');
    showStatus(getSafeErrorMessage(error), 'error', { persist: true });
  } finally {
    exportBtn.disabled = false;
  }
}

function confirmImport(summary) {
  const modal = document.getElementById('importConfirmModal');
  const summaryEl = document.getElementById('importConfirmSummary');
  const confirmBtn = document.getElementById('confirmImportBtn');
  const cancelBtn = document.getElementById('cancelImportBtn');

  if (!modal || !summaryEl || !confirmBtn || !cancelBtn) {
    return Promise.resolve(false);
  }

  const template = getMessage('importConfirmSummary') ||
    'This will open {TAB_COUNT} tabs in {WINDOW_COUNT} windows and {GROUP_COUNT} groups.';
  summaryEl.textContent = template
    .replace('{TAB_COUNT}', String(summary.totalTabs))
    .replace('{WINDOW_COUNT}', String(summary.windows.length))
    .replace('{GROUP_COUNT}', String(summary.totalGroups));

  openModal(modal, confirmBtn);

  return new Promise(resolve => {
    const cleanup = (result) => {
      closeModal(modal);
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    };

    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onKeydown = (event) => {
      if (event.key === 'Escape') cleanup(false);
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    document.addEventListener('keydown', onKeydown);
  });
}

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > IMPORT_LIMITS.maxFileBytes) {
    showStatus(getMessage('importFileTooLarge') || 'Import file is too large.', 'error');
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const decodedStr = decodeURIComponent(atob(e.target.result));
      const importData = normalizeImportData(JSON.parse(decodedStr), getMessage);
      const confirmed = await confirmImport(importData);
      if (!confirmed) {
        showStatus(getMessage('importCancelled') || 'Import cancelled.', 'success');
        return;
      }

      const result = await restoreImportedSession(importData, { chromeApi: chrome, logger: console });
      const statusType = result.failedTabs > 0 || result.failures.length > 0 ? 'warning' : 'success';
      showStatus(formatImportResult(result, getMessage), statusType, { persist: statusType !== 'success' });
      updateStatsBar();
    } catch(err) {
      showStatus(`${getMessage('invalidFile')} ${getSafeErrorMessage(err)}`, 'error', { persist: true });
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
