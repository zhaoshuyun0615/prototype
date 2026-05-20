(() => {
  const userConfig = window.PROTOTYPE_REQUIREMENTS_CONFIG || {};
  const cssEscape = (value) => (window.CSS?.escape ? CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
  const storageKey = userConfig.storageKey || `prototype-requirements:${location.pathname}`;
  let pageBindings = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function normalizeId(value, fallback) {
    return String(value || fallback || `page-${Date.now()}`).replace(/\.html?$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }

  function getFrameCard(iframe) {
    return iframe.closest('.proto-card, .screen-card') || iframe.parentElement;
  }

  function getFrameTitle(card, iframe, fallback) {
    return card?.querySelector('.proto-title, .screen-name')?.textContent?.trim() || iframe.title || fallback;
  }

  function ensureWorkspace() {
    const wall = document.querySelector('.proto-wall, .prototype-wall') || document.body;
    let board = document.querySelector('[data-requirement-board]');
    if (board) return board;

    let workspace = document.querySelector('.prototype-workspace');
    let canvas = document.querySelector('.prototype-canvas');
    let panel = document.querySelector('.requirement-panel');

    if (!workspace) {
      workspace = document.createElement('section');
      workspace.className = 'prototype-workspace';
      canvas = document.createElement('div');
      canvas.className = 'prototype-canvas';
      canvas.setAttribute('aria-label', '原型页面区域');
      panel = document.createElement('aside');
      panel.className = 'requirement-panel';
      panel.setAttribute('aria-label', '需求卡片区域');

      Array.from(wall.children).forEach((child) => {
        if (!child.classList?.contains('wall-head') && !child.classList?.contains('wall-header')) canvas.appendChild(child);
      });
      workspace.append(canvas, panel);
      wall.appendChild(workspace);
    }

    if (!panel) {
      panel = document.createElement('aside');
      panel.className = 'requirement-panel';
      workspace.appendChild(panel);
    }

    board = document.createElement('section');
    board.className = 'requirement-board';
    board.dataset.requirementBoard = 'true';
    board.innerHTML = `
      <div class="requirement-board-head">
        <div>
          <span>${escapeHtml(userConfig.codePrefix || 'REQ')}</span>
          <h2>${escapeHtml(userConfig.boardTitle || '原型需求卡片')}</h2>
          <p>${escapeHtml(userConfig.boardDescription || '统一记录所有页面、模块对应的需求描述，并可点击定位到绑定位置。')}</p>
          <div class="requirement-total" aria-live="polite">当前已有 <strong>0</strong> 张需求卡片</div>
        </div>
        <div class="requirement-head-actions">
          <button class="requirement-add" type="button"><i class="fa-solid fa-plus"></i>新增需求</button>
          <button class="requirement-pick" type="button"><i class="fa-solid fa-crosshairs"></i>点选模块</button>
        </div>
      </div>
      <div class="requirement-tools">
        <label><i class="fa-solid fa-magnifying-glass"></i><input type="search" placeholder="查询需求、页面或模块"></label>
        <select class="requirement-page-filter" aria-label="按页面筛选"></select>
      </div>
      <div class="requirement-list"></div>
      <div class="requirement-empty">未查询到需求卡片</div>
    `;
    panel.appendChild(board);
    return board;
  }

  function discoverPages() {
    const configuredPages = userConfig.pages || [];
    const configuredMap = new Map(configuredPages.map((page) => [page.id, page]));
    const frames = Array.from(document.querySelectorAll('.proto-card iframe, .screen-card iframe, .prototype-canvas iframe'));

    pageBindings = frames.map((iframe, index) => {
      const card = getFrameCard(iframe);
      const srcName = iframe.getAttribute('src')?.split('/').pop() || `page-${index + 1}`;
      const id = iframe.dataset.pageId || iframe.id || normalizeId(srcName, `page-${index + 1}`);
      const configured = configuredMap.get(id) || configuredPages.find((page) => page.src === iframe.getAttribute('src')) || {};
      const title = configured.title || getFrameTitle(card, iframe, id);
      const modules = configured.modules?.length ? configured.modules : [{ id: 'page-root', title: '整页', selector: 'body' }];

      iframe.dataset.pageId = id;
      card?.setAttribute('data-page-id', id);
      return { id, title, modules, iframe };
    });

    configuredPages.forEach((page) => {
      if (!pageBindings.some((entry) => entry.id === page.id)) {
        pageBindings.push({ ...page, modules: page.modules?.length ? page.modules : [{ id: 'page-root', title: '整页', selector: 'body' }] });
      }
    });

    return pageBindings;
  }

  function getPage(pageId) {
    return pageBindings.find((page) => page.id === pageId) || pageBindings[0];
  }

  function getStoredModule(item) {
    const page = getPage(item.pageId);
    const fallback = page?.modules?.[0] || { id: 'page-root', title: '整页', selector: 'body' };
    const module = page?.modules?.find((entry) => entry.id === item.moduleId);
    return {
      id: item.moduleId || module?.id || fallback.id,
      title: item.moduleTitle || module?.title || fallback.title,
      selector: item.moduleSelector || module?.selector || fallback.selector
    };
  }

  function buildCode(items) {
    const prefix = userConfig.codePrefix || 'REQ';
    const nextNumber = items.reduce((max, item) => {
      const matched = String(item.code || '').match(/(\d+)$/);
      return matched ? Math.max(max, Number(matched[1])) : max;
    }, 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(2, '0')}`;
  }

  function collectLegacyRequirements() {
    const results = [];
    document.querySelectorAll('.req-note-board[data-frame]').forEach((board) => {
      const frame = document.getElementById(board.dataset.frame);
      const pageId = frame?.dataset.pageId || frame?.id || board.dataset.frame;
      board.querySelectorAll('.req-note-card').forEach((card, index) => {
        const code = card.querySelector('.req-note-summary span')?.textContent?.trim() || buildCode(results);
        const title = card.querySelector('.req-note-summary strong')?.textContent?.trim() || '需求备注';
        const descButtons = Array.from(card.querySelectorAll('.req-desc'));
        const firstTarget = descButtons.find((button) => button.dataset.target)?.dataset.target;
        results.push({
          id: `legacy-${pageId}-${index}-${Date.now()}`,
          code,
          title,
          description: descButtons.map((button) => button.textContent.trim()).filter(Boolean).join('\n'),
          pageId,
          moduleId: firstTarget || 'page-root',
          moduleTitle: firstTarget || '整页',
          moduleSelector: firstTarget ? `#${cssEscape(firstTarget)}` : 'body'
        });
      });
    });
    return results;
  }

  function readRequirements() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore broken localStorage data
    }
    const defaults = userConfig.defaultRequirements || collectLegacyRequirements();
    return Array.isArray(defaults) ? defaults : [];
  }

  function saveRequirements(items) {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }

  function renderPageFilter(select) {
    select.innerHTML = ['<option value="all">全部页面</option>', ...pageBindings.map((page) => `<option value="${page.id}">${escapeHtml(page.title)}</option>`)].join('');
  }

  function renderRequirements(board, items) {
    const list = board.querySelector('.requirement-list');
    const total = board.querySelector('.requirement-total strong');
    const searchValue = board.querySelector('input[type="search"]').value.trim().toLowerCase();
    const pageFilter = board.querySelector('.requirement-page-filter').value;
    const filtered = items.filter((item) => {
      const page = getPage(item.pageId);
      const module = getStoredModule(item);
      const haystack = `${item.code} ${item.title} ${item.description} ${page?.title || ''} ${module.title}`.toLowerCase();
      return (!searchValue || haystack.includes(searchValue)) && (pageFilter === 'all' || item.pageId === pageFilter);
    });

    if (total) total.textContent = String(items.length);
    list.innerHTML = filtered.map((item) => {
      const page = getPage(item.pageId);
      const module = getStoredModule(item);
      return `
        <article class="requirement-item" data-id="${item.id}" tabindex="0" role="button">
          <div class="requirement-item-head">
            <div class="requirement-item-title"><span>${escapeHtml(item.code)}</span><strong>${escapeHtml(item.title)}</strong></div>
            <div class="requirement-actions"><button class="requirement-edit" type="button">编辑</button><button class="requirement-delete" type="button">删除</button></div>
          </div>
          <p>${escapeHtml(item.description).replace(/\n/g, '<br>')}</p>
          <div class="requirement-binding"><i class="fa-solid fa-link"></i><span>${escapeHtml(page?.title || item.pageId)}</span><b>${escapeHtml(module.title)}</b></div>
        </article>
      `;
    }).join('');
    board.dataset.empty = filtered.length ? 'false' : 'true';
  }

  function getModuleOptions(pageId, current = {}) {
    const page = getPage(pageId);
    const options = [...(page?.modules || [])];
    if (current.moduleId && !options.some((module) => module.id === current.moduleId)) {
      options.push({ id: current.moduleId, title: current.moduleTitle || '点选模块', selector: current.moduleSelector || 'body' });
    }
    return options.map((module) => `<option value="${module.id}">${escapeHtml(module.title)}</option>`).join('');
  }

  function getSelectedModulePayload(pageId, moduleId, current = {}) {
    const page = getPage(pageId);
    const module = page?.modules?.find((entry) => entry.id === moduleId);
    if (module) return { moduleId: module.id, moduleTitle: module.title, moduleSelector: module.selector };
    return { moduleId, moduleTitle: current.moduleTitle || '点选模块', moduleSelector: current.moduleSelector || 'body' };
  }

  function openRequirementEditor({ mode, item, items }) {
    return new Promise((resolve) => {
      const firstPage = pageBindings[0] || { id: 'page', modules: [{ id: 'page-root' }] };
      const current = item || { code: buildCode(items), title: '新增需求卡片', description: '请补充该页面模块的需求描述内容。', pageId: firstPage.id, moduleId: firstPage.modules[0]?.id || 'page-root' };
      const overlay = document.createElement('div');
      overlay.className = 'requirement-editor-mask';
      overlay.innerHTML = `
        <form class="requirement-editor" novalidate>
          <div class="requirement-editor-head"><strong>${mode === 'add' ? '新增需求卡片' : '编辑需求卡片'}</strong><button class="requirement-editor-close" type="button" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="requirement-editor-grid">
            <label>需求编号<input name="code" type="text" value="${escapeHtml(current.code)}" placeholder="${escapeHtml(userConfig.codePrefix || 'REQ')}-01"></label>
            <label>绑定页面<select name="pageId">${pageBindings.map((page) => `<option value="${page.id}">${escapeHtml(page.title)}</option>`).join('')}</select></label>
          </div>
          <label>绑定模块<select name="moduleId">${getModuleOptions(current.pageId, current)}</select></label>
          <label>标题<input name="title" type="text" value="${escapeHtml(current.title)}" placeholder="请输入需求标题"></label>
          <label>内容<textarea name="description" rows="5" placeholder="请输入需求描述内容">${escapeHtml(current.description)}</textarea></label>
          <div class="requirement-editor-actions"><button class="requirement-editor-cancel" type="button">取消</button><button class="requirement-editor-save" type="submit">保存</button></div>
        </form>
      `;

      document.body.appendChild(overlay);
      const form = overlay.querySelector('form');
      const codeInput = form.elements.code;
      const pageSelect = form.elements.pageId;
      const moduleSelect = form.elements.moduleId;
      const titleInput = form.elements.title;
      const descriptionInput = form.elements.description;
      pageSelect.value = current.pageId;
      moduleSelect.value = current.moduleId;
      titleInput.focus();
      titleInput.select();

      const close = (value) => {
        overlay.remove();
        resolve(value);
      };
      pageSelect.addEventListener('change', () => {
        moduleSelect.innerHTML = getModuleOptions(pageSelect.value);
      });
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay || event.target.closest('.requirement-editor-close, .requirement-editor-cancel')) close(null);
      });
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const result = {
          code: codeInput.value.trim(),
          title: titleInput.value.trim(),
          description: descriptionInput.value.trim(),
          pageId: pageSelect.value,
          ...getSelectedModulePayload(pageSelect.value, moduleSelect.value, current)
        };
        if (!result.code || !result.title || !result.description || !result.pageId || !result.moduleId) {
          form.dataset.error = 'true';
          return;
        }
        close(result);
      });
    });
  }

  function injectHighlightStyle(frameDocument) {
    if (frameDocument.getElementById('requirement-highlight-style')) return;
    const style = frameDocument.createElement('style');
    style.id = 'requirement-highlight-style';
    style.textContent = `.requirement-target-highlight{outline:3px solid #fa7500!important;outline-offset:4px!important;box-shadow:0 0 0 8px rgba(250,117,0,.18),0 0 24px rgba(250,117,0,.35)!important;position:relative!important;z-index:30!important}.requirement-pick-hover{outline:2px dashed #1677ff!important;outline-offset:3px!important;cursor:crosshair!important}body.requirement-pick-mode,body.requirement-pick-mode *{cursor:crosshair!important}`;
    frameDocument.head.appendChild(style);
  }

  function clearHighlights() {
    document.querySelectorAll('.proto-card.is-bound-active, .screen-card.is-bound-active').forEach((card) => card.classList.remove('is-bound-active'));
    document.querySelectorAll('iframe[data-page-id]').forEach((iframe) => {
      try {
        iframe.contentDocument?.querySelectorAll('.requirement-target-highlight,.requirement-pick-hover').forEach((node) => node.classList.remove('requirement-target-highlight', 'requirement-pick-hover'));
      } catch {
        // ignore inaccessible frames
      }
    });
  }

  function focusBoundModule(item) {
    const page = getPage(item.pageId);
    const module = getStoredModule(item);
    const card = document.querySelector(`.proto-card[data-page-id="${page?.id}"], .screen-card[data-page-id="${page?.id}"]`);
    const iframe = document.querySelector(`iframe[data-page-id="${page?.id}"]`);
    clearHighlights();
    card?.classList.add('is-bound-active');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    window.setTimeout(() => {
      try {
        const frameDocument = iframe?.contentDocument;
        const target = frameDocument?.querySelector(module.selector);
        if (!frameDocument || !target) return;
        injectHighlightStyle(frameDocument);
        target.classList.add('requirement-target-highlight');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        card?.classList.add('is-bound-active');
      }
    }, 260);
  }

  function buildElementSelector(element) {
    if (element.id) return `#${cssEscape(element.id)}`;
    let node = element;
    const path = [];
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html' && path.length < 4) {
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

  function getPickedModule(page, target) {
    const known = page.modules.find((module) => target.closest(module.selector));
    if (known) return known;
    const text = target.textContent?.trim().replace(/\s+/g, ' ').slice(0, 16);
    const className = Array.from(target.classList || []).find((name) => !name.startsWith('fa-'));
    const tag = target.tagName.toLowerCase();
    return { id: `picked-${Date.now()}`, title: text || className || `${tag} 模块`, selector: buildElementSelector(target) };
  }

  function setPickingMode(enabled, pickButton) {
    document.body.classList.toggle('is-requirement-picking', enabled);
    pickButton?.classList.toggle('is-active', enabled);
    pickButton?.setAttribute('aria-pressed', String(enabled));
    document.querySelectorAll('iframe[data-page-id]').forEach((iframe) => {
      try {
        const frameDocument = iframe.contentDocument;
        if (!frameDocument) return;
        injectHighlightStyle(frameDocument);
        frameDocument.body.classList.toggle('requirement-pick-mode', enabled);
        frameDocument.querySelectorAll('.requirement-pick-hover').forEach((node) => node.classList.remove('requirement-pick-hover'));
      } catch {
        // ignore inaccessible frames
      }
    });
  }

  function setupPrototypePicker(iframe, onPick) {
    const bind = () => {
      try {
        const frameDocument = iframe.contentDocument;
        if (!frameDocument || frameDocument.body.dataset.requirementPickerReady === 'true') return;
        frameDocument.body.dataset.requirementPickerReady = 'true';
        injectHighlightStyle(frameDocument);
        frameDocument.addEventListener('mouseover', (event) => {
          if (!document.body.classList.contains('is-requirement-picking')) return;
          frameDocument.querySelectorAll('.requirement-pick-hover').forEach((node) => node.classList.remove('requirement-pick-hover'));
          event.target.classList?.add('requirement-pick-hover');
        }, true);
        frameDocument.addEventListener('mouseout', (event) => {
          event.target.classList?.remove('requirement-pick-hover');
        }, true);
        frameDocument.addEventListener('click', (event) => {
          if (!document.body.classList.contains('is-requirement-picking')) return;
          event.preventDefault();
          event.stopPropagation();
          onPick({ pageId: iframe.dataset.pageId, target: event.target });
        }, true);
      } catch {
        // ignore inaccessible frames
      }
    };
    iframe.addEventListener('load', bind);
    bind();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const board = ensureWorkspace();
    discoverPages();
    let items = readRequirements();
    const pageFilter = board.querySelector('.requirement-page-filter');
    const pickButton = board.querySelector('.requirement-pick');
    renderPageFilter(pageFilter);
    renderRequirements(board, items);

    board.querySelector('input[type="search"]').addEventListener('input', () => renderRequirements(board, items));
    pageFilter.addEventListener('change', () => renderRequirements(board, items));
    pickButton?.addEventListener('click', () => setPickingMode(!document.body.classList.contains('is-requirement-picking'), pickButton));

    document.querySelectorAll('iframe[data-page-id]').forEach((iframe) => {
      setupPrototypePicker(iframe, async ({ pageId, target }) => {
        const page = getPage(pageId);
        const pickedModule = getPickedModule(page, target);
        setPickingMode(false, pickButton);
        clearHighlights();
        target.classList?.add('requirement-target-highlight');
        if (!page.modules.some((module) => module.id === pickedModule.id)) page.modules.push(pickedModule);
        const draft = { code: buildCode(items), title: `${pickedModule.title}需求`, description: '请补充该页面模块的需求描述内容。', pageId, moduleId: pickedModule.id, moduleTitle: pickedModule.title, moduleSelector: pickedModule.selector };
        const result = await openRequirementEditor({ mode: 'add', item: draft, items });
        if (!result) return;
        items = [...items, { id: `req-${Date.now()}`, ...result }];
        saveRequirements(items);
        renderRequirements(board, items);
        focusBoundModule(items[items.length - 1]);
      });
    });

    board.addEventListener('click', async (event) => {
      const addButton = event.target.closest('.requirement-add');
      const editButton = event.target.closest('.requirement-edit');
      const deleteButton = event.target.closest('.requirement-delete');
      const itemNode = event.target.closest('.requirement-item');
      if (addButton) {
        const result = await openRequirementEditor({ mode: 'add', items });
        if (!result) return;
        items = [...items, { id: `req-${Date.now()}`, ...result }];
        saveRequirements(items);
        renderRequirements(board, items);
        return;
      }
      if (!itemNode) return;
      const current = items.find((item) => item.id === itemNode.dataset.id);
      if (!current) return;
      if (editButton) {
        const result = await openRequirementEditor({ mode: 'edit', item: current, items });
        if (!result) return;
        items = items.map((item) => item.id === current.id ? { ...item, ...result } : item);
        saveRequirements(items);
        renderRequirements(board, items);
        return;
      }
      if (deleteButton) {
        const confirmed = window.confirm(`确认删除“${current.title}”？`);
        if (!confirmed) return;
        items = items.filter((item) => item.id !== current.id);
        saveRequirements(items);
        renderRequirements(board, items);
        clearHighlights();
        return;
      }
      focusBoundModule(current);
    });

    board.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const itemNode = event.target.closest('.requirement-item');
      const current = items.find((item) => item.id === itemNode?.dataset.id);
      if (current) focusBoundModule(current);
    });
  });
})();
