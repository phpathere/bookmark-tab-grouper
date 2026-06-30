let currentLang = 'vi';
let translations = null;
let bookmarkFolders = [];
let savedTabState = null;
const GROUP_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

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
    console.error("Storage get failed", e);
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
    console.error("Failed to load translations for", lang, e);
    translations = null;
  }
}

function getMessage(key) {
  if (translations && translations[key] && translations[key].message) {
    return translations[key].message;
  }
  return chrome.i18n.getMessage(key); // Fallback
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
    console.error("Storage theme get failed", e);
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
    console.warn("Could not get window info", e);
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
    
    // Format: Current: tabCount tab | groupCount group
    const isEn = getMessage('defaultOption') === '-- Choose a folder --';
    const prefix = isEn ? 'Current' : 'Hiện tại';
    
    statsBar.innerHTML = `${prefix}: ${tabCount} tab <span style="opacity:0.5; margin:0 4px;">|</span> ${groupCount} group`;
  } catch (e) {
    console.warn("Failed to update stats bar", e);
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
      settingsModal.classList.remove('hidden');
    });
  }
  
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }
  
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
      settingsModal.classList.add('hidden');
    });
  }

  const folderSelect = document.getElementById('folderSelect');
  const actionBtn = document.getElementById('actionBtn');
  
  // Reveal body immediately to prevent FOUC (Hanging UI)
  document.body.style.visibility = 'visible';
  
  // Set loading state
  folderSelect.innerHTML = '<option disabled selected>Loading...</option>';

  // Load bookmark tree asynchronously without blocking UI
  chrome.bookmarks.getTree().then(tree => {
    folderSelect.innerHTML = '<option value="" disabled selected data-i18n="defaultOption">-- Choose a folder --</option>';
    populateFolderSelect(tree[0], folderSelect);
    localizeHtmlPage(); // Re-localize the default option
  }).catch(error => {
    showStatus(error.message, 'error');
  });

  // Handle action button click
  actionBtn.addEventListener('click', handleOpenAndGroup);

  // Handle Sort Dropdown
  const sortMenuBtn = document.getElementById('sortMenuBtn');
  const sortDropdown = document.getElementById('sortDropdown');
  if (sortMenuBtn && sortDropdown) {
    sortMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sortDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      sortDropdown.classList.add('hidden');
    });
  }

  const groupByDomainBtn = document.getElementById('groupByDomainBtn');
  if (groupByDomainBtn) {
    groupByDomainBtn.addEventListener('click', handleGroupByDomain);
  }

  const undoGroupBtn = document.getElementById('undoGroupBtn');
  if (undoGroupBtn) {
    undoGroupBtn.addEventListener('click', handleUndoGroupByDomain);
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
    console.warn("Could not check tabs on load", e);
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
    let hasOpenedAny = false;
    let colorIndex = 0;

    const isValidUrl = (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch(_) {
        return false;
      }
    };

    // Phân loại: Link trực tiếp và Thư mục con
    const directLinks = [];
    const subFolders = [];
    
    if (parentNode.children) {
      for (const child of parentNode.children) {
        if (child.url && isValidUrl(child.url)) {
          directLinks.push(child);
        } else if (child.children && child.children.length > 0) {
          subFolders.push(child);
        }
      }
    }

    // Xử lý các link trực tiếp nằm trong thư mục gốc được chọn
    if (directLinks.length > 0) {
      hasOpenedAny = true;
      if (typeof chrome.tabGroups !== 'undefined') {
        const tabIds = [];
        for (const link of directLinks) {
          const tab = await chrome.tabs.create({ url: link.url, active: false });
          tabIds.push(tab.id);
        }

        if (tabIds.length > 0) {
          const groupId = await chrome.tabs.group({ tabIds });
          const color = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
          colorIndex++;

          await chrome.tabGroups.update(groupId, {
            title: parentNode.title || 'Group',
            color: color,
            collapsed: true
          });
        }
      } else {
        // Legacy fallback: Open in a new window
        const urls = directLinks.map(l => l.url);
        await chrome.windows.create({ url: urls, focused: true });
      }
    }

    // Xử lý các thư mục con
    for (const groupNode of subFolders) {
      const links = extractAllLinks(groupNode).filter(link => isValidUrl(link.url));
      
      if (links.length > 0) {
        hasOpenedAny = true;
        
        if (typeof chrome.tabGroups !== 'undefined') {
          const tabIds = [];
          for (const link of links) {
            const tab = await chrome.tabs.create({ url: link.url, active: false });
            tabIds.push(tab.id);
          }

          if (tabIds.length > 0) {
            const groupId = await chrome.tabs.group({ tabIds });
            
            const color = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
            colorIndex++;

            await chrome.tabGroups.update(groupId, {
              title: groupNode.title || 'Group',
              color: color,
              collapsed: true
            });
          }
        } else {
          // Legacy fallback: Open in a new window
          const urls = links.map(l => l.url);
          await chrome.windows.create({ url: urls, focused: false });
        }
      }
    }

    if (!hasOpenedAny) {
      showStatus(getMessage('noBookmarksFound'), 'error');
    } else {
      showStatus(getMessage('successMessage'), 'success');
      updateStatsBar();
    }
  } catch (error) {
    showStatus(error.message, 'error');
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

function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  
  setTimeout(() => {
    statusEl.classList.add('hidden');
  }, 3000);
}

async function handleGroupByDomain() {
  try {
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const ungroupedTabs = allTabs.filter(t => t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
    
    // Group by domain
    const domainMap = {};
    for (const tab of ungroupedTabs) {
      if (!tab.url) continue;
      try {
        const urlObj = new URL(tab.url);
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
          let hostname = urlObj.hostname;
          const parts = hostname.split('.');
          let rootDomain = hostname;
          let groupName;
          
          if (parts.length > 1 && !isNaN(parts[parts.length - 1])) {
             // IP address
             groupName = hostname; 
          } else {
             if (parts.length > 2) {
                const twoPartTLDs = ['co.uk', 'com.vn', 'co.jp', 'com.au', 'co.in', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn'];
                const tld = parts.slice(-2).join('.');
                if (twoPartTLDs.includes(tld)) {
                  rootDomain = parts.slice(-3).join('.');
                } else {
                  rootDomain = parts.slice(-2).join('.');
                }
             } else {
                rootDomain = hostname;
             }
             groupName = rootDomain.split('.')[0];
             groupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
          }

          if (!domainMap[groupName]) domainMap[groupName] = [];
          domainMap[groupName].push(tab.id);
        }
      } catch(e) {}
    }

    let colorIndex = 0;
    let createdGroups = 0;
    let newlyGroupedTabIds = [];
    for (const domain in domainMap) {
      const tabIds = domainMap[domain];
      if (tabIds.length > 1) { // Only group if > 1 tab
        newlyGroupedTabIds = newlyGroupedTabIds.concat(tabIds);
        const groupId = await chrome.tabs.group({ tabIds });
        const color = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
        colorIndex++;
        await chrome.tabGroups.update(groupId, {
          title: domain,
          color: color,
          collapsed: true
        });
        createdGroups++;
      }
    }
    
    if (createdGroups === 0) {
      showStatus(getMessage('noTabsToGroup') || 'Không có trang web nào có nhiều hơn 1 tab', 'success');
    } else {
      // Save state for undo
      savedTabState = { newlyGroupedTabIds };
      showStatus(getMessage('groupByDomainSuccess') || 'Đã nhóm theo trang web', 'success');
      updateStatsBar();
    }
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function handleUndoGroupByDomain() {
  if (!savedTabState || !savedTabState.newlyGroupedTabIds) {
    showStatus(getMessage('noUndoAvailable') || 'Không có hành động nào để hoàn tác', 'error');
    return;
  }
  
  try {
    const tabIdsToUngroup = savedTabState.newlyGroupedTabIds;
    if (tabIdsToUngroup.length > 0) {
      await chrome.tabs.ungroup(tabIdsToUngroup);
    }
    
    savedTabState = null; // Clear state after undo
    showStatus(getMessage('undoSuccess') || 'Đã khôi phục trạng thái cũ', 'success');
    updateStatsBar();
  } catch(error) {
    showStatus(error.message, 'error');
  }
}

async function handleExport() {
  const exportBtn = document.getElementById('exportBtn');
  exportBtn.disabled = true;
  showStatus('Exporting...', 'success');

  try {
    const windows = await chrome.windows.getAll({ populate: true });
    
    let lastFocusedWinId = null;
    try {
      const lastFocused = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
      if (lastFocused) lastFocusedWinId = lastFocused.id;
    } catch (e) {
      // fallback if getLastFocused fails
    }
    
    const exportData = {
      version: "2.0",
      generator: "Bookmark Tab Grouper",
      export_date: new Date().toISOString(),
      active_tab_url: null,
      windows: []
    };

    for (const win of windows) {
      if (win.type !== 'normal') continue;
      
      const groupMap = {};
      const ungrouped = [];
      
      for (const tab of win.tabs) {
        const isThisWindowFocused = lastFocusedWinId !== null ? (win.id === lastFocusedWinId) : win.focused;
        if (tab.active && isThisWindowFocused) {
          exportData.active_tab_url = tab.url;
        }
        
        if (typeof chrome.tabGroups !== 'undefined' && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
          if (!groupMap[tab.groupId]) {
            groupMap[tab.groupId] = [];
          }
          groupMap[tab.groupId].push(tab.url);
        } else {
          ungrouped.push(tab.url);
        }
      }
      
      const isThisWindowFocused = lastFocusedWinId !== null ? (win.id === lastFocusedWinId) : win.focused;
      const winData = {
        is_focused: isThisWindowFocused,
        groups: [],
        ungrouped_tabs: ungrouped
      };

      if (typeof chrome.tabGroups !== 'undefined') {
        for (const groupId in groupMap) {
          try {
            const groupInfo = await chrome.tabGroups.get(parseInt(groupId));
            winData.groups.push({
              title: groupInfo.title || '',
              color: groupInfo.color || 'grey',
              tabs: groupMap[groupId]
            });
          } catch(e) {
            winData.ungrouped_tabs = winData.ungrouped_tabs.concat(groupMap[groupId]);
          }
        }
      }
      
      exportData.windows.push(winData);
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
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    }, () => {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
    
    showStatus(getMessage('exportSuccess'), 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    exportBtn.disabled = false;
  }
}

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      // Decode from proprietary format
      const decodedStr = decodeURIComponent(atob(e.target.result));
      const data = JSON.parse(decodedStr);
      
      if (data.generator !== "Bookmark Tab Grouper") {
        throw new Error(getMessage('invalidFile'));
      }
      
      const isValidUrl = (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch(_) {
          return false;
        }
      };

      const activeUrl = data.active_tab_url;
      let hasActivated = false;
      
      let windowsToRestore = [];
      if (data.version === "2.0" && data.windows) {
        windowsToRestore = data.windows;
      } else {
        windowsToRestore = [{
          is_focused: true,
          groups: data.groups || [],
          ungrouped_tabs: data.ungrouped_tabs || []
        }];
      }
      
      let targetWindowId = null;
      
      const currentWin = await chrome.windows.getCurrent({ populate: true });
      const currentTabs = currentWin.tabs || [];
      // An empty window has exactly 1 tab, and it's not a normal website (e.g. new tab page)
      const isCurrentWinEmpty = currentTabs.length === 1 && !isValidUrl(currentTabs[0].url);
      let usedCurrentWin = false;
      
      for (const winData of windowsToRestore) {
        let winId;
        const createdTabIds = new Set();
        
        if (isCurrentWinEmpty && !usedCurrentWin) {
          winId = currentWin.id;
          usedCurrentWin = true;
        } else {
          // Create without focus to prevent subsequent windows from stealing focus
          const newWin = await chrome.windows.create({ focused: false });
          winId = newWin.id;
        }
        
        if (winData.is_focused) {
          targetWindowId = winId;
        }
        
        if (winData.groups && Array.isArray(winData.groups)) {
          for (const group of winData.groups) {
            if (!group.tabs || !Array.isArray(group.tabs)) continue;
            
            const validUrls = group.tabs.filter(isValidUrl);
            if (validUrls.length === 0) continue;
            
            const tabIds = [];
            for (const url of validUrls) {
              const isActive = (!hasActivated && url === activeUrl);
              if (isActive) hasActivated = true;
              
              const tab = await chrome.tabs.create({ url: url, windowId: winId, active: isActive });
              tabIds.push(tab.id);
              createdTabIds.add(tab.id);
            }
            
            if (typeof chrome.tabGroups !== 'undefined' && tabIds.length > 0) {
              const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: winId } });
              await chrome.tabGroups.update(groupId, {
                title: group.title || 'Group',
                color: group.color || 'grey',
                collapsed: true
              });
            }
          }
        }
        
        if (winData.ungrouped_tabs && Array.isArray(winData.ungrouped_tabs)) {
          const validUrls = winData.ungrouped_tabs.filter(isValidUrl);
          for (const url of validUrls) {
            const isActive = (!hasActivated && url === activeUrl);
            if (isActive) hasActivated = true;
            
            await chrome.tabs.create({ url: url, windowId: winId, active: isActive }).then(t => createdTabIds.add(t.id));
          }
        }
        
        // Clean up the exact initial tab(s) by removing anything we didn't just create
        const allTabs = await chrome.tabs.query({ windowId: winId });
        if (allTabs.length > createdTabIds.size && createdTabIds.size > 0) {
          for (const t of allTabs) {
            if (!createdTabIds.has(t.id)) {
              try {
                await chrome.tabs.remove(t.id);
              } catch (e) {
                // Ignore if it was already removed
              }
            }
          }
        }
      }
      
      // Finally, focus the correct window after everything is created
      if (targetWindowId !== null) {
        await chrome.windows.update(targetWindowId, { focused: true });
      }
      
      showStatus(getMessage('importSuccess'), 'success');
    } catch(err) {
      showStatus(getMessage('invalidFile') + " " + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
