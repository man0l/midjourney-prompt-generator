(function () {
  'use strict';

  const API_ENDPOINT = 'https://midjourney-prompt-generator.eu/api/improve';
  const MIN_CHARS_FOR_TOOLBAR = 15;

  let state = null; // { el } when slash menu is open
  let dropdown = null;
  let selectedIndex = 0;

  let toolbar = null;
  let toolbarEl = null; // currently attached editable
  let toolbarTrackTimer = null;

  // ── Helpers ────────────────────────────────────────────────

  function isEditable(el) {
    return el && (el.isContentEditable || el.tagName === 'TEXTAREA');
  }

  function getEditableText(el) {
    return el.isContentEditable ? (el.innerText || '') : (el.value || '');
  }

  function getTextBeforeCaret(el) {
    if (el.isContentEditable) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return '';
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const pre = document.createRange();
      pre.selectNodeContents(el);
      pre.setEnd(range.startContainer, range.startOffset);
      return pre.toString();
    }
    return el.value.slice(0, el.selectionStart);
  }

  function getCaretRect(el) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rects = range.getClientRects();
      if (rects.length) return rects[0];
    }
    return el.getBoundingClientRect();
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Slash dropdown ─────────────────────────────────────────

  function positionDropdown(el) {
    if (!dropdown) return;
    const rect = getCaretRect(el);
    const dh = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = spaceBelow >= dh || spaceBelow >= rect.top
      ? rect.bottom + window.scrollY + 6
      : rect.top + window.scrollY - dh - 6;
    let left = Math.min(rect.left + window.scrollX, window.innerWidth - 320);
    if (left < 4) left = 4;
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
  }

  function showDropdown(el, query) {
    chrome.storage.local.get('prompts', (data) => {
      const all = data.prompts || [];
      const q = query.toLowerCase();
      const filtered = q ? all.filter((p) => p.title.toLowerCase().includes(q)) : all;

      if (dropdown) dropdown.remove();
      dropdown = document.createElement('div');
      dropdown.id = 'pp-dropdown';

      if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'pp-empty';
        empty.textContent = query ? 'No matches' : 'No saved prompts';
        dropdown.appendChild(empty);
      } else {
        filtered.forEach((p, i) => {
          const item = document.createElement('div');
          item.className = 'pp-item' + (i === 0 ? ' active' : '');
          item.dataset.body = p.body;
          item.innerHTML =
            '<div class="pp-item-title">' + esc(p.title) + '</div>' +
            '<div class="pp-item-preview">' + esc(p.body.slice(0, 70)) + (p.body.length > 70 ? '…' : '') + '</div>';
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            insertPrompt(p.body, el);
          });
          dropdown.appendChild(item);
        });
      }

      document.body.appendChild(dropdown);
      selectedIndex = 0;
      positionDropdown(el);
    });
  }

  function hideDropdown() {
    if (dropdown) { dropdown.remove(); dropdown = null; }
    state = null;
    selectedIndex = 0;
  }

  function moveSelection(dir) {
    if (!dropdown) return;
    const items = dropdown.querySelectorAll('.pp-item');
    if (!items.length) return;
    items[selectedIndex]?.classList.remove('active');
    selectedIndex = (selectedIndex + dir + items.length) % items.length;
    items[selectedIndex]?.classList.add('active');
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }

  function insertPrompt(body, el) {
    if (!el) return;
    el.focus();

    if (el.isContentEditable) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;
      const text = typeof node.textContent === 'string' ? node.textContent : '';

      let slashIdx = -1;
      for (let i = offset - 1; i >= 0; i--) {
        if (text[i] === '/') { slashIdx = i; break; }
        if (text[i] === ' ' || text[i] === '\n') break;
      }
      if (slashIdx !== -1) {
        const newRange = document.createRange();
        newRange.setStart(node, slashIdx);
        newRange.setEnd(node, offset);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      document.execCommand('insertText', false, body);
    }
    hideDropdown();
  }

  // ── Floating toolbar ───────────────────────────────────────

  function buildToolbar() {
    const t = document.createElement('div');
    t.id = 'pp-toolbar';
    t.innerHTML = `
      <button class="pp-tb-btn" data-action="improve" title="Improve prompt (AI)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l3.5 7.5L24 14l-7.5 3.5L13 25l-3.5-7.5L2 14l7.5-3.5z"/>
        </svg>
        <span class="pp-tb-label">Improve</span>
      </button>
      <button class="pp-tb-btn" data-action="save" title="Save prompt">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        <span class="pp-tb-label">Save</span>
      </button>
    `;
    t.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus on editable
    t.addEventListener('click', (e) => {
      const btn = e.target.closest('.pp-tb-btn');
      if (!btn || !toolbarEl) return;
      const action = btn.dataset.action;
      if (action === 'improve') doImprove(btn);
      else if (action === 'save') doSave(btn);
    });
    return t;
  }

  function showToolbar(el) {
    if (!toolbar) { toolbar = buildToolbar(); document.body.appendChild(toolbar); }
    toolbarEl = el;
    toolbar.classList.add('visible');
    positionToolbar();
  }

  function hideToolbar() {
    if (toolbar) toolbar.classList.remove('visible');
    toolbarEl = null;
  }

  function positionToolbar() {
    if (!toolbar || !toolbarEl) return;
    const rect = toolbarEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { hideToolbar(); return; }
    const top = rect.top + window.scrollY - toolbar.offsetHeight - 6;
    const left = rect.right + window.scrollX - toolbar.offsetWidth;
    toolbar.style.top = Math.max(4 + window.scrollY, top) + 'px';
    toolbar.style.left = Math.max(4, left) + 'px';
  }

  function refreshToolbar(el) {
    if (!isEditable(el)) { hideToolbar(); return; }
    const text = getEditableText(el).trim();
    if (text.length < MIN_CHARS_FOR_TOOLBAR) { hideToolbar(); return; }
    if (dropdown) { hideToolbar(); return; } // avoid overlap with slash menu
    showToolbar(el);
  }

  function replaceEditableText(el, newText) {
    el.focus();
    if (el.isContentEditable) {
      document.execCommand('selectAll', false);
      document.execCommand('insertText', false, newText);
    } else {
      el.select();
      document.execCommand('insertText', false, newText);
    }
  }

  async function doImprove(btn) {
    const el = toolbarEl;
    if (!el) return;
    const original = getEditableText(el).trim();
    if (!original) return;

    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: original }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error || `HTTP ${res.status}`);
      }
      const { improved } = await res.json();
      if (improved && typeof improved === 'string') {
        replaceEditableText(el, improved);
        showToast('Improved ✨', 'success');
      }
    } catch (err) {
      showToast('Improve failed: ' + (err?.message || 'unknown'), 'error');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
      positionToolbar();
    }
  }

  function doSave(btn) {
    const el = toolbarEl;
    if (!el) return;
    const text = getEditableText(el).trim();
    if (!text) return;

    const title = deriveTitle(text);
    chrome.storage.local.get('prompts', (data) => {
      const prompts = data.prompts || [];
      prompts.push({ id: Date.now().toString(), title, body: text });
      chrome.storage.local.set({ prompts }, () => {
        showToast(`Saved as "${title}"`, 'success');
      });
    });
  }

  function deriveTitle(text) {
    const firstLine = text.split('\n')[0].trim();
    const words = firstLine.split(/\s+/).slice(0, 6).join(' ');
    const title = words.length > 50 ? words.slice(0, 50) + '…' : words;
    return title || 'Untitled prompt';
  }

  // ── Toast ──────────────────────────────────────────────────

  let toastTimer = null;
  function showToast(msg, kind) {
    let toast = document.getElementById('pp-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pp-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.dataset.kind = kind || 'info';
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  // ── Listeners ──────────────────────────────────────────────

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!isEditable(el)) return;

    const text = getTextBeforeCaret(el);
    const match = text.match(/(?:^|\s)\/(\S*)$/);
    if (match) {
      state = { el };
      hideToolbar();
      showDropdown(el, match[1]);
    } else {
      hideDropdown();
      refreshToolbar(el);
    }
  }, true);

  document.addEventListener('focusin', (e) => {
    if (isEditable(e.target)) refreshToolbar(e.target);
  }, true);

  document.addEventListener('focusout', (e) => {
    // Delay so button clicks can land first
    setTimeout(() => {
      const active = document.activeElement;
      const inToolbar = toolbar && toolbar.contains(active);
      if (!inToolbar && !isEditable(active)) hideToolbar();
    }, 120);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (!dropdown) return;
    if (e.key === 'Escape') { hideDropdown(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); return; }
    if (e.key === 'Enter' || e.key === 'Tab') {
      const active = dropdown.querySelector('.pp-item.active');
      if (active) {
        e.preventDefault();
        e.stopPropagation();
        insertPrompt(active.dataset.body, state?.el);
      }
    }
  }, true);

  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target)) hideDropdown();
  }, true);

  // Keep toolbar glued to its editable on scroll/resize
  const reposition = () => { if (toolbarEl) positionToolbar(); };
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);
})();
