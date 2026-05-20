(() => {
  const cssEscape = (value) => (window.CSS?.escape ? CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
  let isPicking = false;
  let currentPageId = '';
  let currentModules = [];

  function injectHighlightStyle() {
    if (document.getElementById('requirement-frame-picker-style')) return;
    const style = document.createElement('style');
    style.id = 'requirement-frame-picker-style';
    style.textContent = `.requirement-target-highlight{outline:3px solid #fa7500!important;outline-offset:4px!important;box-shadow:0 0 0 8px rgba(250,117,0,.18),0 0 24px rgba(250,117,0,.35)!important;position:relative!important;z-index:30!important}.requirement-pick-hover{outline:2px dashed #1677ff!important;outline-offset:3px!important;cursor:crosshair!important}body.requirement-pick-mode,body.requirement-pick-mode *{cursor:crosshair!important}`;
    document.head.appendChild(style);
  }

  function clearHover() {
    document.querySelectorAll('.requirement-pick-hover').forEach((node) => node.classList.remove('requirement-pick-hover'));
  }

  function buildElementSelector(element) {
    if (element.id) return `#${cssEscape(element.id)}`;
    let node = element;
    const path = [];
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html' && path.length < 5) {
      const tag = node.tagName.toLowerCase();
      const className = Array.from(node.classList || []).find((name) => !name.startsWith('fa-') && !name.startsWith('requirement-'));
      if (className) {
        path.unshift(`${tag}.${cssEscape(className)}`);
        break;
      }
      const siblings = Array.from(node.parentElement?.children || []).filter((child) => child.tagName === node.tagName);
      const index = siblings.indexOf(node) + 1;
      path.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag);
      node = node.parentElement;
    }
    return path.join(' > ') || 'body';
  }

  function getElementTitle(element) {
    const text = element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 24);
    const aria = element.getAttribute?.('aria-label');
    const alt = element.getAttribute?.('alt');
    const className = Array.from(element.classList || []).find((name) => !name.startsWith('fa-') && !name.startsWith('requirement-'));
    return text || aria || alt || className || element.tagName.toLowerCase();
  }

  function findKnownModule(target) {
    return currentModules.find((module) => {
      try {
        return module.selector && target.closest(module.selector);
      } catch {
        return false;
      }
    });
  }

  function setPicking(enabled, pageId, modules) {
    isPicking = enabled;
    currentPageId = pageId || currentPageId;
    currentModules = Array.isArray(modules) ? modules : [];
    injectHighlightStyle();
    clearHover();
    document.body?.classList.toggle('requirement-pick-mode', enabled);
  }

  document.addEventListener('mouseover', (event) => {
    if (!isPicking) return;
    clearHover();
    event.target.classList?.add('requirement-pick-hover');
  }, true);

  document.addEventListener('mouseout', (event) => {
    event.target.classList?.remove('requirement-pick-hover');
  }, true);

  document.addEventListener('click', (event) => {
    if (!isPicking) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const target = event.target;
    const knownModule = findKnownModule(target);
    const elementTitle = getElementTitle(target);
    const elementSelector = buildElementSelector(target);
    window.parent?.postMessage({
      type: 'prototype-requirement-picked',
      pageId: currentPageId,
      module: knownModule || null,
      element: {
        title: elementTitle,
        selector: elementSelector,
        tag: target.tagName.toLowerCase()
      }
    }, '*');
  }, true);

  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type !== 'prototype-requirement-picking') return;
    setPicking(Boolean(data.enabled), data.pageId, data.modules);
  });

  injectHighlightStyle();
})();
