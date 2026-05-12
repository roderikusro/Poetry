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
  const sel = document.getElementById('poemSongSelect');
  // Insert default songs before the "custom" option
  const customOpt = sel.querySelector('option[value="custom"]');
  defaultSongs.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = `default_${i}`;
    opt.textContent = `${s.icon} ${s.title} — ${s.artist}`;
    sel.insertBefore(opt, customOpt);
  });
}

function onSongSelect() {
  const sel = document.getElementById('poemSongSelect');
  const val = sel.value;
  const customFields = document.getElementById('customSongFields');

  if (val === 'custom') {
    customFields.style.display = 'block';
    document.getElementById('poemYoutubeUrl').value = '';
    document.getElementById('poemSongTitle').value = '';
    document.getElementById('poemSongArtist').value = '';
  } else if (val.startsWith('default_')) {
    customFields.style.display = 'none';
    const idx = parseInt(val.split('_')[1]);
    const song = defaultSongs[idx];
    document.getElementById('poemYoutubeUrl').value = song.youtubeUrl;
    document.getElementById('poemSongTitle').value = song.title;
    document.getElementById('poemSongArtist').value = song.artist;
  } else {
    // "Tanpa musik"
    customFields.style.display = 'none';
    document.getElementById('poemYoutubeUrl').value = '';
    document.getElementById('poemSongTitle').value = '';
    document.getElementById('poemSongArtist').value = '';
  }
}

// ===== Song Preview =====
let adminYtPlayer = null;
let previewActive = false;

function togglePreview() {
  if (previewActive) {
    stopPreview();
    return;
  }

  const url = document.getElementById('poemYoutubeUrl').value.trim();
  const videoId = getYouTubeId(url);

  if (!videoId) {
    alert('⚠️ Pilih lagu terlebih dahulu, atau paste YouTube URL.');
    return;
  }

  const title = document.getElementById('poemSongTitle').value || 'Lagu';
  const artist = document.getElementById('poemSongArtist').value || 'YouTube';

  // Show preview panel
  document.getElementById('previewPlayer').style.display = 'block';
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewArtist').textContent = artist;
  document.getElementById('previewBtn').innerHTML = '⏸ Stop';

  previewActive = true;

  // Destroy old player if exists
  if (adminYtPlayer && adminYtPlayer.destroy) {
    try { adminYtPlayer.destroy(); } catch(e) {}
    adminYtPlayer = null;
  }

  // Re-create the div
  document.getElementById('adminYtContainer').innerHTML = '<div id="adminYtPlayer"></div>';

  // Create YouTube player
  adminYtPlayer = new YT.Player('adminYtPlayer', {
    height: '180',
    width: '100%',
    videoId: videoId,
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0
    }
  });
}

function stopPreview() {
  previewActive = false;
  document.getElementById('previewPlayer').style.display = 'none';
  document.getElementById('previewBtn').innerHTML = '▶ Preview';

  if (adminYtPlayer && adminYtPlayer.destroy) {
    try { adminYtPlayer.destroy(); } catch(e) {}
    adminYtPlayer = null;
  }
  document.getElementById('adminYtContainer').innerHTML = '<div id="adminYtPlayer"></div>';
}

// Prevent YouTube API from auto-initializing on admin page
function onYouTubeIframeAPIReady() {
  // Do nothing on admin — preview is manual
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

  // Convert plain \n to <br> for contenteditable; HTML is kept as-is
  const isHTML = /<[a-z][\s\S]*>/i.test(value);
  const displayValue = isHTML ? value : value.replace(/\n/g, '<br>');

  div.innerHTML = `
    <div class="stanza-field-header">
      <div style="display:flex; align-items:center; gap: 12px; flex-wrap:wrap;">
        <span class="stanza-field-label">Bait ${container.querySelectorAll('.admin-stanza-field').length + 1}</span>
        <div class="stanza-toolbar">
          <button type="button" class="toolbar-btn toolbar-bold" onclick="formatStanza('bold', this)" title="Bold"><b>B</b></button>
          <button type="button" class="toolbar-btn toolbar-italic" onclick="formatStanza('italic', this)" title="Italic"><i>I</i></button>
          <div class="toolbar-divider"></div>
          <button type="button" class="toolbar-btn" onclick="formatStanza('justifyLeft', this)" title="Rata Kiri">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="0" y="4" width="10" height="2"/><rect x="0" y="8" width="14" height="2"/><rect x="0" y="12" width="8" height="2"/></svg>
          </button>
          <button type="button" class="toolbar-btn" onclick="formatStanza('justifyCenter', this)" title="Rata Tengah">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="2" y="4" width="10" height="2"/><rect x="0" y="8" width="14" height="2"/><rect x="3" y="12" width="8" height="2"/></svg>
          </button>
          <button type="button" class="toolbar-btn" onclick="formatStanza('justifyRight', this)" title="Rata Kanan">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="4" y="4" width="10" height="2"/><rect x="0" y="8" width="14" height="2"/><rect x="6" y="12" width="8" height="2"/></svg>
          </button>
        </div>
      </div>
      <button class="admin-icon-btn delete-btn" onclick="removeStanza('stanza-field-${num}')" title="Hapus bait">✕</button>
    </div>
    <div class="admin-textarea stanza-input" contenteditable="true" data-placeholder="Tulis bait puisi di sini...">${displayValue}</div>
  `;
  container.appendChild(div);
}

function formatStanza(command, btn) {
  // Focus the sibling stanza-input then execute command
  const editor = btn.closest('.admin-stanza-field').querySelector('.stanza-input');
  editor.focus();
  document.execCommand(command, false, null);
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
  const youtubeUrl = document.getElementById('poemYoutubeUrl').value.trim();
  const songTitle = document.getElementById('poemSongTitle').value.trim();
  const songArtist = document.getElementById('poemSongArtist').value.trim();
  const isPrivate = document.getElementById('poemPrivate').checked;
  const password = document.getElementById('poemPassword').value.trim();
  const editId = document.getElementById('editPoemId').value;

  // Collect stanzas
  const stanzas = [];
  document.querySelectorAll('.stanza-input').forEach(ta => {
    const val = ta.innerHTML.trim();
    // remove empty <br> or empty <div> generated by contenteditable
    if (val && val !== '<br>' && val !== '<div><br></div>') {
      stanzas.push(val);
    }
  });

  // Validation
  if (!title) return showFormStatus('❌ Judul puisi wajib diisi!', 'error');
  if (!date) return showFormStatus('❌ Tanggal wajib diisi!', 'error');
  if (stanzas.length === 0) return showFormStatus('❌ Minimal satu bait puisi!', 'error');
  if (isPrivate && !password) return showFormStatus('❌ Password wajib diisi untuk puisi pribadi!', 'error');
  if (selectedTags.length === 0) return showFormStatus('❌ Pilih minimal satu tag!', 'error');

  const tags = selectedTags.map(type => availableTags.find(t => t.type === type));
  // create plain text excerpt by stripping HTML tags
  const plainTextStanza = stanzas[0] ? stanzas[0].replace(/<[^>]*>?/gm, ' ').trim() : '';
  const autoExcerpt = excerpt || plainTextStanza.substring(0, 80) + '...';

  const poemData = {
    title, author, emoji, date, tags,
    excerpt: autoExcerpt,
    stanzas,
    youtubeUrl: youtubeUrl || '',
    songTitle: songTitle || '',
    songArtist: songArtist || ''
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
  document.getElementById('poemYoutubeUrl').value = p.youtubeUrl || '';
  document.getElementById('poemSongTitle').value = p.songTitle || '';
  document.getElementById('poemSongArtist').value = p.songArtist || '';

  // Set song dropdown
  const sel = document.getElementById('poemSongSelect');
  const customFields = document.getElementById('customSongFields');
  const matchIdx = defaultSongs.findIndex(s => s.youtubeUrl === p.youtubeUrl);
  if (!p.youtubeUrl) {
    sel.value = '';
    customFields.style.display = 'none';
  } else if (matchIdx >= 0) {
    sel.value = `default_${matchIdx}`;
    customFields.style.display = 'none';
  } else {
    sel.value = 'custom';
    customFields.style.display = 'block';
  }

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
  document.getElementById('poemYoutubeUrl').value = '';
  document.getElementById('poemSongTitle').value = '';
  document.getElementById('poemSongArtist').value = '';
  document.getElementById('poemSongSelect').value = '';
  document.getElementById('customSongFields').style.display = 'none';
  selectEmoji('🌸');
  selectedTags = [];
  document.querySelectorAll('.tag-option').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.admin-stanza-field').forEach(el => el.remove());
  stanzaCount = 0;
  addStanzaField();
  setDefaultDate();
  document.getElementById('formStatus').textContent = '';
}

// ===== Settings: Export JSON (backup) =====
function exportData() {
  const data = getPoems();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = 'roderikus_poems_backup.json';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// ===== Settings: Import JSON =====
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const raw = JSON.parse(e.target.result);
      if (!Array.isArray(raw)) throw new Error('Format tidak valid');
      // Migrate old formats → current schema
      const data = normalizePoemArray(raw);
      savePoems(data);
      renderStats();
      renderAdminPoemList();
      alert('✅ Data berhasil diimpor! ' + data.length + ' puisi dimuat.');

    } catch (err) {
      alert('❌ Gagal mengimpor data: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== Settings: Reset =====
function resetToDefaults() {
  if (!confirm('⚠️ Yakin ingin reset? Semua puisi yang ditambahkan lewat admin akan hilang.')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderStats();
  renderAdminPoemList();
  alert('✅ Data berhasil direset ke default.');
}

// ===== PUBLISH: Generate data.js for GitHub =====
function publishToFile() {
  const all = getPoems();

  // Build each poem as a JS object string
  const poemsStr = all.map(p => {
    let obj = `  {\n`;
    obj += `    id: ${p.id},\n`;
    obj += `    title: ${JSON.stringify(p.title)},\n`;
    obj += `    author: ${JSON.stringify(p.author)},\n`;
    obj += `    emoji: ${JSON.stringify(p.emoji)},\n`;
    obj += `    date: ${JSON.stringify(p.date)},\n`;
    obj += `    tags: [${p.tags.map(t => `{ label: ${JSON.stringify(t.label)}, icon: ${JSON.stringify(t.icon)}, type: ${JSON.stringify(t.type)} }`).join(', ')}],\n`;
    obj += `    excerpt: ${JSON.stringify(p.excerpt)},\n`;
    if (p.isPrivate) {
      obj += `    isPrivate: true,\n`;
      obj += `    password: ${JSON.stringify(p.password)},\n`;
    }
    obj += `    stanzas: [\n`;
    obj += p.stanzas.map(s => `      ${JSON.stringify(s)}`).join(',\n');
    obj += `\n    ],\n`;
    obj += `    songTitle: ${JSON.stringify(p.songTitle || '')},\n`;
    obj += `    songArtist: ${JSON.stringify(p.songArtist || '')},\n`;
    obj += `    youtubeUrl: ${JSON.stringify(p.youtubeUrl || '')}\n`;
    obj += `  }`;
    return obj;
  }).join(',\n');

  const fileContent = `// ===== Shared Poem & Song Data =====

// Default poems (shipped with the site)
const defaultPoems = [
${poemsStr}
];

// ===== Default Background Songs (YouTube) =====
const defaultSongs = [
  { title: "Clair de Lune", artist: "Debussy", icon: "🌙", youtubeUrl: "https://www.youtube.com/watch?v=CvFH_6DNRCY" },
  { title: "River Flows in You", artist: "Yiruma", icon: "🌊", youtubeUrl: "https://www.youtube.com/watch?v=7maJOI3QMu0" },
  { title: "Gymnopédie No.1", artist: "Erik Satie", icon: "☁️", youtubeUrl: "https://www.youtube.com/watch?v=S-Xm7s9eGxU" },
  { title: "Nocturne Op.9 No.2", artist: "Chopin", icon: "🌌", youtubeUrl: "https://www.youtube.com/watch?v=9E6b3swbnWg" },
  { title: "Experience", artist: "Ludovico Einaudi", icon: "✨", youtubeUrl: "https://www.youtube.com/watch?v=_VONMkKkdf4" }
];

// Extract YouTube video ID from various URL formats
function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)([\\\\w-]{11})/,
    /^([\\\\w-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ===== Admin Config =====
const ADMIN_PASSWORD = ${JSON.stringify(ADMIN_PASSWORD)};
const STORAGE_KEY = "roderikus_poems";

// ===== Data Layer — merges defaults with localStorage =====
function getPoems() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { /* fallback */ }
  }
  return [...defaultPoems];
}

function savePoems(poemArr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(poemArr));
}

function getNextId() {
  const all = getPoems();
  return all.length > 0 ? Math.max(...all.map(p => p.id)) + 1 : 1;
}

// Live poems array (used by home.js, script.js)
const poems = getPoems();

// ===== Utility =====
function formatDate(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(dateStr);
  return \\\`\\\${d.getDate()} \\\${months[d.getMonth()]} \\\${d.getFullYear()}\\\`;
}

function getPoemById(id) {
  return poems.find(p => p.id === parseInt(id));
}

// ===== Available Tags =====
const availableTags = [
  { label: "Cinta", icon: "💕", type: "love" },
  { label: "Alam", icon: "🌿", type: "nature" },
  { label: "Mimpi", icon: "✨", type: "dream" },
  { label: "Harapan", icon: "🌟", type: "hope" }
];

// ===== Available Emojis =====
const availableEmojis = ["🌙", "🌻", "💌", "🌧️", "🦋", "🌸", "🔥", "🌹", "☀️", "🍂", "🌈", "💫", "🌊", "🎭", "📝", "🕊️"];
`;

  const blob = new Blob([fileContent], { type: 'application/javascript' });
  const link = document.createElement('a');
  link.download = 'data.js';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  alert('✅ File data.js berhasil diunduh!\\n\\nLangkah selanjutnya:\\n1. Replace file data.js di folder project\\n2. Jalankan: git add . → git commit → git push\\n3. Semua device akan melihat perubahan!');
}
