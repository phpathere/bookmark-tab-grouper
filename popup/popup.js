let currentLang = 'vi';
let translations = null;
let bookmarkFolders = [];
const GROUP_COLORS = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

async function initLanguage() {
  try {
    if (chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get('lang');
      currentLang = data.lang || 'vi'; 
    }
  } catch(e) {
    console.error("Storage get failed", e);
    currentLang = 'vi';
  }
  
  await loadTranslations(currentLang);
  localizeHtmlPage();
  updateLangToggleBtn();
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

function updateLangToggleBtn() {
  const btn = document.getElementById('langToggleBtn');
  if (btn) {
    btn.setAttribute('data-active', currentLang);
  }
}

async function toggleLanguage() {
  currentLang = currentLang === 'vi' ? 'en' : 'vi';
  
  // Safe storage set
  try {
    if (chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ lang: currentLang });
    }
  } catch(e) {
    console.error("Storage set failed", e);
  }

  await loadTranslations(currentLang);
  localizeHtmlPage();
  updateLangToggleBtn();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initLanguage();

  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', toggleLanguage);
  }

  const folderSelect = document.getElementById('folderSelect');
  const actionBtn = document.getElementById('actionBtn');
  
  // Load bookmark tree
  try {
    const tree = await chrome.bookmarks.getTree();
    populateFolderSelect(tree[0], folderSelect);
  } catch (error) {
    showStatus(error.message, 'error');
  }

  // Handle action button click
  actionBtn.addEventListener('click', handleOpenAndGroup);

  // Handle Export/Import
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', handleFileImport);
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
    node.children.forEach(child => {
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
          collapsed: false
        });
      }
    }

    // Xử lý các thư mục con
    for (const groupNode of subFolders) {
      const links = extractAllLinks(groupNode).filter(link => isValidUrl(link.url));
      
      if (links.length > 0) {
        hasOpenedAny = true;
        
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
            collapsed: false
          });
        }
      }
    }

    if (!hasOpenedAny) {
      showStatus(getMessage('noBookmarksFound'), 'error');
    } else {
      showStatus(getMessage('successMessage'), 'success');
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

async function handleExport() {
  const exportBtn = document.getElementById('exportBtn');
  exportBtn.disabled = true;
  showStatus('Exporting...', 'success');

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const groupMap = {};
    const ungrouped = [];
    let activeUrl = null;
    
    for (const tab of tabs) {
      if (tab.active) {
        activeUrl = tab.url;
      }
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        if (!groupMap[tab.groupId]) {
          groupMap[tab.groupId] = [];
        }
        groupMap[tab.groupId].push(tab.url);
      } else {
        ungrouped.push(tab.url);
      }
    }
    
    const exportData = {
      version: "1.0",
      generator: "Bookmark Tab Grouper",
      export_date: new Date().toISOString(),
      active_tab_url: activeUrl,
      groups: [],
      ungrouped_tabs: ungrouped
    };
    
    for (const groupId in groupMap) {
      try {
        const groupInfo = await chrome.tabGroups.get(parseInt(groupId));
        exportData.groups.push({
          title: groupInfo.title || '',
          color: groupInfo.color || 'grey',
          tabs: groupMap[groupId]
        });
      } catch(e) {
        exportData.ungrouped_tabs = exportData.ungrouped_tabs.concat(groupMap[groupId]);
      }
    }
    
    // Encode data to proprietary format
    const encodedData = btoa(encodeURIComponent(JSON.stringify(exportData)));
    const blob = new Blob([encodedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Session_${new Date().toISOString().slice(0,10)}.btg`;
    a.click();
    URL.revokeObjectURL(url);
    
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

      const newWin = await chrome.windows.create({ focused: true });
      const winId = newWin.id;
      
      const activeUrl = data.active_tab_url;
      let hasActivated = false;
      
      if (data.groups && Array.isArray(data.groups)) {
        for (const group of data.groups) {
          if (!group.tabs || !Array.isArray(group.tabs)) continue;
          
          const validUrls = group.tabs.filter(isValidUrl);
          if (validUrls.length === 0) continue;
          
          const tabIds = [];
          for (const url of validUrls) {
            const isActive = (!hasActivated && url === activeUrl);
            if (isActive) hasActivated = true;
            
            const tab = await chrome.tabs.create({ url: url, windowId: winId, active: isActive });
            tabIds.push(tab.id);
          }
          
          const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: winId } });
          await chrome.tabGroups.update(groupId, {
            title: group.title || 'Group',
            color: group.color || 'grey',
            collapsed: false
          });
        }
      }
      
      if (data.ungrouped_tabs && Array.isArray(data.ungrouped_tabs)) {
        const validUrls = data.ungrouped_tabs.filter(isValidUrl);
        for (const url of validUrls) {
          const isActive = (!hasActivated && url === activeUrl);
          if (isActive) hasActivated = true;
          
          await chrome.tabs.create({ url: url, windowId: winId, active: isActive });
        }
      }
      
      // Clean up the default empty tab that comes with new window
      const allTabs = await chrome.tabs.query({ windowId: winId });
      if (allTabs.length > 1 && allTabs[0].url === "chrome://newtab/") {
        chrome.tabs.remove(allTabs[0].id);
      }
      
      showStatus(getMessage('importSuccess'), 'success');
    } catch(err) {
      showStatus(getMessage('invalidFile') + " " + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
