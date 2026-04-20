'use strict';

let prompts = [];
let editingId = null;

function load() {
  chrome.storage.local.get('prompts', (data) => {
    prompts = data.prompts || [];
    render();
  });
}

function persist(cb) {
  chrome.storage.local.set({ prompts }, cb);
}

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const list = document.getElementById('prompt-list');
  const visible = q
    ? prompts.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
    : prompts;

  if (visible.length === 0) {
    list.innerHTML = '<p class="empty">' +
      (q ? 'No prompts match your search.' : 'No prompts yet — click <strong>+ Add Prompt</strong> to start.') +
      '</p>';
    return;
  }

  list.innerHTML = visible.map(p =>
    '<div class="card" data-id="' + p.id + '">' +
      '<div class="card-body">' +
        '<div class="card-title">' + esc(p.title) + '</div>' +
        '<div class="card-preview">' + esc(p.body.slice(0, 90)) + (p.body.length > 90 ? '…' : '') + '</div>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button class="btn-edit" data-id="' + p.id + '">Edit</button>' +
        '<button class="btn-del" data-id="' + p.id + '">Delete</button>' +
      '</div>' +
    '</div>'
  ).join('');

  list.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openModal(b.dataset.id)));
  list.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => del(b.dataset.id)));
}

function openModal(id) {
  editingId = id || null;
  const p = id ? prompts.find(x => x.id === id) : null;
  document.getElementById('modal-heading').textContent = p ? 'Edit Prompt' : 'Add Prompt';
  document.getElementById('form-title').value = p ? p.title : '';
  document.getElementById('form-body').value = p ? p.body : '';
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('form-title').focus();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  editingId = null;
}

function save() {
  const title = document.getElementById('form-title').value.trim();
  const body = document.getElementById('form-body').value.trim();
  if (!title || !body) return;

  if (editingId) {
    const idx = prompts.findIndex(p => p.id === editingId);
    if (idx !== -1) prompts[idx] = { id: editingId, title, body };
  } else {
    prompts.push({ id: Date.now().toString(), title, body });
  }

  persist(() => { load(); closeModal(); });
}

function del(id) {
  if (!confirm('Delete this prompt?')) return;
  prompts = prompts.filter(p => p.id !== id);
  persist(() => render());
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
  load();

  document.getElementById('add-btn').addEventListener('click', () => openModal());
  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  document.getElementById('save-btn').addEventListener('click', save);
  document.getElementById('search').addEventListener('input', render);

  // Close modal on backdrop click
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
  });
});
