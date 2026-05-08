// ===== Admin Panel Logic =====

// ===== Login =====
function adminLogin() {
  const pw = document.getElementById('adminPassword').value.trim();
  const errEl = document.getElementById('loginError');
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_auth', 'true');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    initDashboard();
  } else {
    errEl.textContent = '❌ Password salah!';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
    setTimeout(() => errEl.textContent = '', 2500);
  }
}

function adminLogout() {
  sessionStorage.removeItem('admin_auth');
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPassword').value = '';
}

// Auto-login if already authenticated
if (sessionStorage.getItem('admin_auth') === 'true') {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  setTimeout(initDashboard, 50);
}

// ===== Dashboard Init =====
function initDashboard() {
  renderStats();
  renderAdminPoemList();
  initEmojiPicker();
  initTagPicker();
  initSongSelector();
  addStanzaField(); // First stanza field
  setDefaultDate();
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('poemDate').value = today;
}

// ===== Stats =====
function renderStats() {
  const all = getPoems();
  const pub = all.filter(p => !p.isPrivate).length;
  const priv = all.filter(p => p.isPrivate).length;

  document.getElementById('adminStats').innerHTML = `
    <div class="admin-stat-card">
      <div class="stat-icon">📚</div>
      <div class="stat-number">${all.length}</div>
      <div class="stat-label">Total Puisi</div>
    </div>
    <div class="admin-stat-card">
      <div class="stat-icon">📖</div>
      <div class="stat-number">${pub}</div>
      <div class="stat-label">Publik</div>
    </div>
    <div class="admin-stat-card">
      <div class="stat-icon">🔒</div>
      <div class="stat-number">${priv}</div>
      <div class="stat-label">Pribadi</div>
    </div>
  `;
}

// ===== Tab Switching =====
function switchTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.admin-tab-content').forEach(c => {
    c.classList.remove('active');
  });
  document.getElementById('tab-' + tabName).classList.add('active');

  if (tabName === 'poems') renderAdminPoemList();
}

// ===== Poem List (Admin) =====
function renderAdminPoemList() {
  const all = getPoems();
  const sorted = [...all].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    document.getElementById('adminPoemList').innerHTML = `
      <div class="admin-empty">
        <div class="admin-empty-icon">📝</div>
        <p>Belum ada puisi. Buat puisi pertamamu!</p>
      </div>`;
    return;
  }

  document.getElementById('adminPoemList').innerHTML = sorted.map(p => `
    <div class="admin-poem-item" id="admin-poem-${p.id}">
      <div class="admin-poem-info">
        <div class="admin-poem-emoji">${p.emoji}</div>
        <div class="admin-poem-details">
          <div class="admin-poem-title">${p.title} ${p.isPrivate ? '<span class="admin-badge-private">🔒</span>' : ''}</div>
          <div class="admin-poem-meta">✍️ ${p.author} · 📅 ${formatDate(p.date)} · ${p.stanzas.length} bait</div>
        </div>
      </div>
      <div class="admin-poem-actions">
        <button class="admin-icon-btn edit-btn" onclick="editPoem(${p.id})" title="Edit">✏️</button>
        <button class="admin-icon-btn delete-btn" onclick="deletePoem(${p.id})" title="Hapus">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ===== Emoji Picker =====
function initEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = availableEmojis.map(e =>
    `<button class="emoji-option ${e === '🌸' ? 'selected' : ''}" data-emoji="${e}" onclick="selectEmoji('${e}')">${e}</button>`
  ).join('');
}

function selectEmoji(emoji) {
  document.getElementById('poemEmoji').value = emoji;
  document.querySelectorAll('.emoji-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.emoji === emoji);
  });
}

// ===== Tag Picker =====
let selectedTags = [];

function initTagPicker() {
  const picker = document.getElementById('tagPicker');
  picker.innerHTML = availableTags.map(t =>
    `<button class="tag-option" data-type="${t.type}" onclick="toggleTag('${t.type}')">${t.icon} ${t.label}</button>`
  ).join('');
}

function toggleTag(type) {
  const idx = selectedTags.indexOf(type);
  if (idx > -1) {
    selectedTags.splice(idx, 1);
  } else {
    selectedTags.push(type);
  }
  document.querySelectorAll('.tag-option').forEach(el => {
    el.classList.toggle('selected', selectedTags.includes(el.dataset.type));
  });
}

// ===== Song Selector =====
function initSongSelector() {
  const sel = document.getElementById('poemSong');
  sel.innerHTML = songs.map((s, i) =>
    `<option value="${i}">${s.icon} ${s.title} — ${s.artist}</option>`
  ).join('');
}

// ===== Stanza Fields =====
let stanzaCount = 0;

function addStanzaField(value = '') {
  stanzaCount++;
  const container = document.getElementById('stanzasContainer');
  const div = document.createElement('div');
  div.className = 'admin-stanza-field';
  div.id = `stanza-field-${stanzaCount}`;
  const num = stanzaCount;
  div.innerHTML = `
    <div class="stanza-field-header">
      <span class="stanza-field-label">Bait ${container.querySelectorAll('.admin-stanza-field').length + 1}</span>
      <button class="admin-icon-btn delete-btn" onclick="removeStanza('stanza-field-${num}')" title="Hapus bait">✕</button>
    </div>
    <textarea class="admin-textarea stanza-input" rows="4" placeholder="Tulis bait puisi...\n(Tekan Enter untuk baris baru)">${value}</textarea>
  `;
  container.appendChild(div);
}

function removeStanza(id) {
  const fields = document.querySelectorAll('.admin-stanza-field');
  if (fields.length <= 1) return; // Keep at least 1
  document.getElementById(id).remove();
  renumberStanzas();
}

function renumberStanzas() {
  document.querySelectorAll('.admin-stanza-field').forEach((el, i) => {
    el.querySelector('.stanza-field-label').textContent = `Bait ${i + 1}`;
  });
}

// ===== Private Toggle =====
function togglePrivateFields() {
  const checked = document.getElementById('poemPrivate').checked;
  document.getElementById('privateFields').style.display = checked ? 'block' : 'none';
}

// ===== Save Poem =====
function savePoem() {
  const title = document.getElementById('poemTitle').value.trim();
  const author = document.getElementById('poemAuthor').value.trim() || 'Anonim';
  const emoji = document.getElementById('poemEmoji').value;
  const date = document.getElementById('poemDate').value;
  const excerpt = document.getElementById('poemExcerpt').value.trim();
  const songIndex = parseInt(document.getElementById('poemSong').value);
  const isPrivate = document.getElementById('poemPrivate').checked;
  const password = document.getElementById('poemPassword').value.trim();
  const editId = document.getElementById('editPoemId').value;

  // Collect stanzas
  const stanzas = [];
  document.querySelectorAll('.stanza-input').forEach(ta => {
    const val = ta.value.trim();
    if (val) stanzas.push(val);
  });

  // Validation
  if (!title) return showFormStatus('❌ Judul puisi wajib diisi!', 'error');
  if (!date) return showFormStatus('❌ Tanggal wajib diisi!', 'error');
  if (stanzas.length === 0) return showFormStatus('❌ Minimal satu bait puisi!', 'error');
  if (isPrivate && !password) return showFormStatus('❌ Password wajib diisi untuk puisi pribadi!', 'error');
  if (selectedTags.length === 0) return showFormStatus('❌ Pilih minimal satu tag!', 'error');

  const tags = selectedTags.map(type => availableTags.find(t => t.type === type));
  const autoExcerpt = excerpt || stanzas[0].substring(0, 80).replace(/\n/g, ', ') + '...';

  const poemData = {
    title, author, emoji, date, tags,
    excerpt: autoExcerpt,
    stanzas, songIndex
  };

  if (isPrivate) {
    poemData.isPrivate = true;
    poemData.password = password;
  }

  const all = getPoems();

  if (editId) {
    // Update existing
    const idx = all.findIndex(p => p.id === parseInt(editId));
    if (idx > -1) {
      poemData.id = parseInt(editId);
      all[idx] = poemData;
      savePoems(all);
      showFormStatus('✅ Puisi berhasil diperbarui!', 'success');
    }
  } else {
    // Create new
    poemData.id = getNextId();
    all.push(poemData);
    savePoems(all);
    showFormStatus('✅ Puisi berhasil disimpan!', 'success');
  }

  renderStats();
  renderAdminPoemList();
  setTimeout(() => {
    resetForm();
    switchTab('poems');
  }, 1500);
}

function showFormStatus(msg, type) {
  const el = document.getElementById('formStatus');
  el.textContent = msg;
  el.className = `admin-form-status ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'admin-form-status'; }, 3000);
}

// ===== Edit Poem =====
function editPoem(id) {
  const all = getPoems();
  const p = all.find(x => x.id === id);
  if (!p) return;

  switchTab('create');
  document.getElementById('formTitle').textContent = '✏️ Edit Puisi';
  document.getElementById('editPoemId').value = p.id;
  document.getElementById('poemTitle').value = p.title;
  document.getElementById('poemAuthor').value = p.author;
  document.getElementById('poemDate').value = p.date;
  document.getElementById('poemExcerpt').value = p.excerpt;
  document.getElementById('poemSong').value = p.songIndex || 0;

  // Emoji
  selectEmoji(p.emoji);

  // Tags
  selectedTags = p.tags.map(t => t.type);
  document.querySelectorAll('.tag-option').forEach(el => {
    el.classList.toggle('selected', selectedTags.includes(el.dataset.type));
  });

  // Private
  document.getElementById('poemPrivate').checked = !!p.isPrivate;
  document.getElementById('privateFields').style.display = p.isPrivate ? 'block' : 'none';
  document.getElementById('poemPassword').value = p.password || '';

  // Stanzas
  document.querySelectorAll('.admin-stanza-field').forEach(el => el.remove());
  stanzaCount = 0;
  p.stanzas.forEach(s => addStanzaField(s));
}

// ===== Delete Poem =====
function deletePoem(id) {
  const all = getPoems();
  const p = all.find(x => x.id === id);
  if (!p) return;

  if (!confirm(`Hapus puisi "${p.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;

  const updated = all.filter(x => x.id !== id);
  savePoems(updated);
  renderStats();
  renderAdminPoemList();
}

// ===== Reset Form =====
function resetForm() {
  document.getElementById('formTitle').textContent = '✨ Buat Puisi Baru';
  document.getElementById('editPoemId').value = '';
  document.getElementById('poemTitle').value = '';
  document.getElementById('poemAuthor').value = 'Anonim';
  document.getElementById('poemExcerpt').value = '';
  document.getElementById('poemPrivate').checked = false;
  document.getElementById('poemPassword').value = '';
  document.getElementById('privateFields').style.display = 'none';
  document.getElementById('poemSong').value = 0;
  selectEmoji('🌸');
  selectedTags = [];
  document.querySelectorAll('.tag-option').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.admin-stanza-field').forEach(el => el.remove());
  stanzaCount = 0;
  addStanzaField();
  setDefaultDate();
  document.getElementById('formStatus').textContent = '';
}

// ===== Settings: Export =====
function exportData() {
  const data = getPoems();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = 'roderikus_poems_backup.json';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// ===== Settings: Import =====
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Format tidak valid');
      savePoems(data);
      renderStats();
      renderAdminPoemList();
      alert('✅ Data berhasil diimpor! ' + data.length + ' puisi dimuat.');
    } catch (err) {
      alert('❌ Gagal mengimpor data: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // Reset file input
}

// ===== Settings: Reset =====
function resetToDefaults() {
  if (!confirm('⚠️ Yakin ingin reset? Semua puisi yang ditambahkan lewat admin akan hilang.')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderStats();
  renderAdminPoemList();
  alert('✅ Data berhasil direset ke default.');
}
