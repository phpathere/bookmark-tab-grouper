document.addEventListener('DOMContentLoaded', () => {
  // Localization
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const message = chrome.i18n.getMessage(element.getAttribute('data-i18n'));
    if (message) {
      element.innerHTML = message;
    }
  });

  const btnClose = document.getElementById('btnClose');
  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.preventDefault();
      window.close();
    });
  }
});
