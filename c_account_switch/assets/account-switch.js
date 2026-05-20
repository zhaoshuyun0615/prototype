document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-toast]');
  if (!target) return;
  const app = target.closest('.app');
  if (!app) return;
  const oldToast = app.querySelector('.toast.dynamic');
  if (oldToast) oldToast.remove();
  const toast = document.createElement('div');
  toast.className = 'toast dynamic';
  toast.textContent = target.dataset.toast;
  app.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
});