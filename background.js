import { restoreImportedSession } from './popup/session-utils.js';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: "welcome.html" });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'RESTORE_SESSION') return undefined;

  restoreImportedSession(message.importData, { chromeApi: chrome, logger: console })
    .then(result => sendResponse({ ok: true, result }))
    .catch(error => {
      const safeMessage = typeof error?.message === 'string'
        ? error.message.replace(/[\r\n]+/g, ' ').slice(0, 240)
        : 'Session import failed.';
      sendResponse({ ok: false, error: safeMessage });
    });

  // Keep the MV3 message event alive while the background import completes.
  return true;
});
