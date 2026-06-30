document.addEventListener('DOMContentLoaded', () => {
  const btnClose = document.getElementById('btnClose');
  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.preventDefault();
      window.close();
    });
  }
});
