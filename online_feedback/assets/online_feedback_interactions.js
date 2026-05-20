function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(window.__toastTimer);
  window.__toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function activateInGroup(elements, target) {
  elements.forEach((element) => element.classList.toggle('active', element === target));
}

function bindStateSwitcher() {
  document.querySelectorAll('[data-switch-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.switchTarget;
      const state = button.dataset.state;
      const buttons = document.querySelectorAll(`[data-switch-target="${group}"]`);
      const views = document.querySelectorAll(`[data-state-group="${group}"]`);
      activateInGroup(buttons, button);
      views.forEach((view) => view.classList.toggle('active', view.dataset.state === state));
      initIcons();
    });
  });
}

function bindFlowSwitcher() {
  document.querySelectorAll('[data-flow-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.flowTarget;
      const state = button.dataset.flow;
      const views = document.querySelectorAll(`[data-flow-group="${group}"]`);
      const buttons = document.querySelectorAll(`[data-flow-target="${group}"]`);
      activateInGroup(buttons, button);
      views.forEach((view) => view.classList.toggle('active', view.dataset.flow === state));
      initIcons();
    });
  });
}

function bindModalControls() {
  document.querySelectorAll('[data-open-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      const modal = document.querySelector(button.dataset.openModal);
      if (modal) modal.classList.add('active');
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) modal.classList.remove('active');
    });
  });
}

function bindToastActions() {
  document.querySelectorAll('[data-toast]').forEach((button) => {
    button.addEventListener('click', () => showToast(button.dataset.toast));
  });
}

function bindPillGroups() {
  document.querySelectorAll('.pill-row').forEach((row) => {
    row.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('click', () => activateInGroup(row.querySelectorAll('.pill'), pill));
    });
  });
}

function bindSelectableRows() {
  document.querySelectorAll('[data-select-row]').forEach((row) => {
    row.addEventListener('click', () => {
      const table = row.closest('table');
      if (table) table.querySelectorAll('tr').forEach((item) => item.classList.remove('row-selected'));
      row.classList.add('row-selected');
      showToast(row.dataset.selectRow || '已切换右侧详情');
    });
  });
}

function bindSimulatedLoading() {
  document.querySelectorAll('[data-simulate-loading]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.simulateLoading);
      const doneState = button.dataset.doneState;
      const group = button.dataset.doneGroup;
      if (target) target.classList.add('active');
      window.setTimeout(() => {
        if (target) target.classList.remove('active');
        if (group && doneState) {
          const trigger = document.querySelector(`[data-switch-target="${group}"][data-state="${doneState}"]`);
          if (trigger) trigger.click();
        }
        showToast(button.dataset.toast || '操作成功');
      }, 700);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindStateSwitcher();
  bindFlowSwitcher();
  bindModalControls();
  bindToastActions();
  bindPillGroups();
  bindSelectableRows();
  bindSimulatedLoading();
  initIcons();
});
