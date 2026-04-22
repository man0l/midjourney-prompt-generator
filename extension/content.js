(function () {
  'use strict';

  const MIN_CHARS_FOR_TOOLBAR = 15;
  const MIN_CHARS_FOR_CHATGPT_BTN = 3;
  const IS_CHATGPT = location.hostname === 'chatgpt.com';
  const IS_CLAUDE  = location.hostname === 'claude.ai';
  const IS_INLINE  = IS_CHATGPT || IS_CLAUDE;

  let state = null; // { el } when slash menu is open
  let dropdown = null;
  let selectedIndex = 0;

  let toolbar = null;
  let toolbarEl = null; // currently attached editable (non-ChatGPT sites)

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

  // ── Floating toolbar (non-ChatGPT sites) ───────────────────

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
    t.addEventListener('mousedown', (e) => e.preventDefault());
    t.addEventListener('click', (e) => {
      const btn = e.target.closest('.pp-tb-btn');
      if (!btn || !toolbarEl) return;
      const action = btn.dataset.action;
      if (action === 'improve') doImprove(btn, toolbarEl);
      else if (action === 'save') doSave(toolbarEl);
    });
    return t;
  }

  function showToolbar(el) {
    if (IS_INLINE) return; // inline sites use injected button instead
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
    if (IS_INLINE) return;
    if (!isEditable(el)) { hideToolbar(); return; }
    const text = getEditableText(el).trim();
    if (text.length < MIN_CHARS_FOR_TOOLBAR) { hideToolbar(); return; }
    if (dropdown) { hideToolbar(); return; }
    showToolbar(el);
  }

  // ── ChatGPT inline improve button ─────────────────────────

  let chatgptImproveBtn = null;

  function findChatGPTEditor() {
    // Prefer the visible ProseMirror div; fall back to the hidden textarea
    return document.querySelector('#prompt-textarea') ||
           document.querySelector('[aria-label="Chat with ChatGPT"]') ||
           document.querySelector('[aria-label="Message ChatGPT"]');
  }

  function findChatGPTComposer() {
    const editor = findChatGPTEditor();
    if (!editor) return null;
    // Walk up looking for grid-cols (logged-out) or form (logged-in)
    let el = editor.parentElement;
    while (el && el !== document.body) {
      const cls = el.nodeType === 1 ? (el.getAttribute('class') || '') : '';
      if (cls.includes('grid-cols') || el.tagName === 'FORM') return el;
      el = el.parentElement;
    }
    return null;
  }

  function findFlexRow(el) {
    // Walk up from el to find the nearest flex-row container
    let p = el?.parentElement;
    while (p) {
      const cls = p.getAttribute('class') || '';
      if (cls.includes('flex') && cls.includes('items-center')) return p;
      p = p.parentElement;
    }
    return el?.parentElement;
  }

  function findInsertionTarget(composer) {
    // 1. Trailing area: find via CSS attribute substring selector (safe — no SVGAnimatedString)
    const trailing = composer.querySelector('[class*="grid-area:trailing"]');
    if (trailing) {
      // The flex row is the first child of the trailing div
      const flexRow = trailing.firstElementChild;
      if (flexRow) {
        // Insert before the first child of the flex row (voice container or send wrapper)
        return { parent: flexRow, before: flexRow.firstElementChild };
      }
    }

    // 2. Fallback: walk up from the send button to the flex row
    const send = composer.querySelector('[data-testid="send-button"]') ||
                 composer.querySelector('[aria-label="Send prompt"]') ||
                 composer.querySelector('[aria-label="Send message"]') ||
                 composer.querySelector('button[type="submit"]');
    if (send) {
      const flexRow = findFlexRow(send);
      // insertBefore = the direct child of flexRow that contains the send button
      let insertBefore = send;
      while (insertBefore.parentElement !== flexRow && insertBefore.parentElement) {
        insertBefore = insertBefore.parentElement;
      }
      return { parent: flexRow, before: insertBefore };
    }

    return null;
  }

  function injectChatGPTButton() {
    const composer = findChatGPTComposer();
    if (!composer) return;
    if (composer.querySelector('[data-pp-btn]')) return; // already injected

    const target = findInsertionTarget(composer);
    if (!target || !target.parent) return;

    const btn = document.createElement('button');
    btn.setAttribute('data-pp-btn', '1');
    btn.setAttribute('aria-label', 'Improve prompt with AI');
    btn.setAttribute('title', 'Improve prompt (AI)');
    btn.type = 'button';
    btn.className = 'pp-chatgpt-btn';
    btn.hidden = true;
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l3.5 7.5L24 14l-7.5 3.5L13 25l-3.5-7.5L2 14l7.5-3.5z"/></svg>`;

    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      const editor = findChatGPTEditor();
      if (editor) doImprove(btn, editor);
    });

    target.parent.insertBefore(btn, target.before || null);
    chatgptImproveBtn = btn;

    // Set initial visibility from current editor text (don't start always-hidden)
    const editor = findChatGPTEditor();
    const currentText = editor ? getEditableText(editor).trim() : '';
    btn.hidden = currentText.length < MIN_CHARS_FOR_CHATGPT_BTN;

    console.log('[PP] Injected improve button. text.length:', currentText.length, 'hidden:', btn.hidden);
  }

  function updateChatGPTButton(text) {
    // Re-inject if ejected by React re-render
    if (!chatgptImproveBtn || !document.contains(chatgptImproveBtn)) {
      chatgptImproveBtn = null;
      injectChatGPTButton();
    }
    if (!chatgptImproveBtn) return;
    chatgptImproveBtn.hidden = text.trim().length < MIN_CHARS_FOR_CHATGPT_BTN;
  }

  // ── Claude.ai inline improve button ───────────────────────

  let claudeImproveBtn = null;

  function findClaudeEditor() {
    return document.querySelector('[aria-label="Write your prompt to Claude"]') ||
           document.querySelector('div[contenteditable="true"]');
  }

  function findClaudeInsertionTarget() {
    // When text is typed: send button appears
    const send = document.querySelector('[aria-label="Send message"]') ||
                 document.querySelector('[aria-label="Send Message"]') ||
                 document.querySelector('button[data-testid="send-button"]');
    if (send) {
      console.log('[PP] Claude: found send button');
      return { parent: send.parentElement, before: send };
    }

    // Fallback: voice/mic button (always present in bottom-right bar)
    const voice = document.querySelector('[aria-label*="oice"]') ||
                  document.querySelector('[aria-label*="icrophone"]') ||
                  document.querySelector('[aria-label*="udio"]');
    if (voice) {
      console.log('[PP] Claude: found voice button, label:', voice.getAttribute('aria-label'));
      return { parent: voice.parentElement, before: voice };
    }

    // Log all buttons to debug
    const allBtns = Array.from(document.querySelectorAll('button')).map(b => b.getAttribute('aria-label')).filter(Boolean);
    console.log('[PP] Claude: no target found. All button labels:', allBtns);
    return null;
  }

  function injectClaudeButton() {
    if (document.querySelector('[data-pp-btn]')) return; // already injected

    const target = findClaudeInsertionTarget();
    if (!target || !target.parent) return;

    const btn = document.createElement('button');
    btn.setAttribute('data-pp-btn', '1');
    btn.setAttribute('aria-label', 'Improve prompt with AI');
    btn.setAttribute('title', 'Improve prompt (AI)');
    btn.type = 'button';
    btn.className = 'pp-chatgpt-btn';
    btn.hidden = true;
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l3.5 7.5L24 14l-7.5 3.5L13 25l-3.5-7.5L2 14l7.5-3.5z"/></svg>`;

    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      const editor = findClaudeEditor();
      if (editor) doImprove(btn, editor);
    });

    target.parent.insertBefore(btn, target.before || null);
    claudeImproveBtn = btn;

    // Start hidden; updateClaudeButton shows it when text is present
    btn.hidden = true;
    console.log('[PP] Claude button injected before:', target.before?.getAttribute?.('aria-label') || target.before?.tagName);
  }

  function updateClaudeButton(text) {
    const hasText = text && text.trim().length >= MIN_CHARS_FOR_CHATGPT_BTN;

    if (!hasText) {
      if (claudeImproveBtn) claudeImproveBtn.hidden = true;
      return;
    }

    // When text is present, send button appears — re-inject next to it if needed
    const send = document.querySelector('[aria-label="Send message"]') ||
                 document.querySelector('[aria-label="Send Message"]') ||
                 document.querySelector('button[data-testid="send-button"]');

    if (claudeImproveBtn && document.contains(claudeImproveBtn)) {
      // Re-inject if send button exists but our button isn't right before it
      if (send && claudeImproveBtn.nextElementSibling !== send) {
        claudeImproveBtn.remove();
        claudeImproveBtn = null;
      }
    } else {
      claudeImproveBtn = null;
    }

    if (!claudeImproveBtn) injectClaudeButton();
    if (claudeImproveBtn) claudeImproveBtn.hidden = false;
  }

  function setupClaude() {
    console.log('[PP] setupClaude — hostname:', location.hostname);
    // Try immediately, then retry for slow Claude renders
    injectClaudeButton();
    setTimeout(() => { if (!claudeImproveBtn) injectClaudeButton(); }, 600);
    setTimeout(() => { if (!claudeImproveBtn) injectClaudeButton(); }, 1500);
    setTimeout(() => { if (!claudeImproveBtn) injectClaudeButton(); }, 3000);

    let timer = null;
    const observer = new MutationObserver(() => {
      if (claudeImproveBtn && document.contains(claudeImproveBtn)) return;
      clearTimeout(timer);
      timer = setTimeout(() => { claudeImproveBtn = null; injectClaudeButton(); }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function setupChatGPT() {
    console.log('[PP] setupChatGPT — hostname:', location.hostname);
    // Try immediately
    injectChatGPTButton();

    // Re-inject on DOM changes, but throttled so typing doesn't fight visibility
    let observerTimer = null;
    const observer = new MutationObserver(() => {
      if (chatgptImproveBtn && document.contains(chatgptImproveBtn)) return; // still alive
      clearTimeout(observerTimer);
      observerTimer = setTimeout(() => {
        chatgptImproveBtn = null;
        injectChatGPTButton();
      }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Shared improve / save actions ──────────────────────────

  function replaceEditableText(el, newText) {
    el.focus();
    if (el.isContentEditable) {
      document.execCommand('selectAll', false);
      document.execCommand('insertText', false, newText);
    } else {
      // TEXTAREA — use native input setter to trigger React's synthetic events
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeInputValueSetter.call(el, newText);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function doImprove(btn, editableEl) {
    if (!editableEl) return;
    const original = getEditableText(editableEl).trim();
    if (!original) return;

    btn.classList.add('loading');
    btn.disabled = true;

    try {
      chrome.runtime.sendMessage({ type: 'improve', prompt: original }, (response) => {
        btn.classList.remove('loading');
        btn.disabled = false;
        if (!IS_INLINE) positionToolbar();

        if (chrome.runtime.lastError) {
          showToast('Improve failed: ' + chrome.runtime.lastError.message, 'error');
          return;
        }
        if (!response?.ok) {
          showToast('Improve failed: ' + (response?.error || 'unknown'), 'error');
          return;
        }
        if (response.improved) {
          replaceEditableText(editableEl, response.improved);
          showToast('Improved ✨', 'success');
        }
      });
    } catch (e) {
      btn.classList.remove('loading');
      btn.disabled = false;
      showToast('Reload the page to use the extension (context reset)', 'error');
    }
  }

  function doSave(editableEl) {
    if (!editableEl) return;
    const text = getEditableText(editableEl).trim();
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
      if (IS_CHATGPT) {
        const editor = findChatGPTEditor();
        updateChatGPTButton(editor ? getEditableText(editor) : '');
      } else if (IS_CLAUDE) {
        const editor = findClaudeEditor();
        updateClaudeButton(editor ? getEditableText(editor) : '');
      } else {
        refreshToolbar(el);
      }
    }
  }, true);

  document.addEventListener('focusin', (e) => {
    if (!isEditable(e.target)) return;
    if (IS_CHATGPT) {
      const editor = findChatGPTEditor();
      updateChatGPTButton(editor ? getEditableText(editor) : '');
    } else if (IS_CLAUDE) {
      const editor = findClaudeEditor();
      updateClaudeButton(editor ? getEditableText(editor) : '');
    } else {
      refreshToolbar(e.target);
    }
  }, true);

  document.addEventListener('focusout', (e) => {
    if (IS_INLINE) return; // inline sites keep button visible while text is present
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

  // Keep toolbar glued to its editable on scroll/resize (non-inline sites)
  const reposition = () => { if (!IS_INLINE && toolbarEl) positionToolbar(); };
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);

  // ── Init ───────────────────────────────────────────────────

  if (IS_CHATGPT) setupChatGPT();
  else if (IS_CLAUDE) setupClaude();
})();
