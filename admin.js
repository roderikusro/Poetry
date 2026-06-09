// ===== Admin Panel Logic =====

// ===== Login =====
function adminLogin() {
  const pw = document.getElementById('adminPassword').value.trim();
  const errEl = document.getElementById('loginError');
  
  if (typeof ADMIN_PASSWORD === 'undefined') {
    errEl.textContent = '⚠️ Error: Konfigurasi password tidak ditemukan.';
    return;
  }

  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_auth', 'true');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    // Ensure dashboard is fully initialized
    try {
      initDashboard();
      showActionToast('🔓 Selamat datang, Admin!');
    } catch (e) {
      console.error('Dashboard init error:', e);
      showActionToast('⚠️ Login berhasil, tapi ada masalah saat memuat dashboard.');
    }
  } else {
    errEl.textContent = '❌ Password salah! Silakan cek kembali.';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
    setTimeout(() => errEl.textContent = '', 3000);
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
    host: 'https://www.youtube-nocookie.com',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin
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
function formatTimeToMinutes(s) {
  if (!s || isNaN(s)) return '';
  const mins = Math.floor(s / 60);
  const secs = String(Math.floor(s % 60)).padStart(2, '0');
  return `${mins}:${secs}`;
}

function parseTimeToSeconds(str) {
  if (!str) return 0;
  if (str.includes(':')) {
    const parts = str.split(':');
    return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
  }
  return parseInt(str) || 0;
}

// ===== Stanza Fields =====
let stanzaCount = 0;

function addStanzaField(value = '', timestamp = 0, lyric = '') {
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
          <button type="button" class="toolbar-btn toolbar-bold" data-cmd="bold" onclick="formatStanza('bold', this)" title="Bold"><b>B</b></button>
          <button type="button" class="toolbar-btn toolbar-italic" data-cmd="italic" onclick="formatStanza('italic', this)" title="Italic"><i>I</i></button>
          <div class="toolbar-divider"></div>
          <button type="button" class="toolbar-btn" data-cmd="justifyLeft" onclick="formatStanza('justifyLeft', this)" title="Rata Kiri">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="0" y="4" width="10" height="2"/><rect x="0" y="8" width="14" height="2"/><rect x="0" y="12" width="8" height="2"/></svg>
          </button>
          <button type="button" class="toolbar-btn" data-cmd="justifyCenter" onclick="formatStanza('justifyCenter', this)" title="Rata Tengah">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="2" y="4" width="10" height="2"/><rect x="0" y="8" width="14" height="2"/><rect x="3" y="12" width="8" height="2"/></svg>
          </button>
          <button type="button" class="toolbar-btn" data-cmd="justifyRight" onclick="formatStanza('justifyRight', this)" title="Rata Kanan">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="14" height="2"/><rect x="4" y="4" width="10" height="2"/><rect x="0" y="8" width="14" height="2"/><rect x="6" y="12" width="8" height="2"/></svg>
          </button>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap: 8px; flex-wrap:wrap; margin-top: 8px;">
        <span style="font-size: 0.8rem; opacity: 0.7; min-width: 40px;">Lirik:</span>
        <input type="text" class="admin-input stanza-lyric-input" placeholder="Kutipan lirik lagu (opsional)..." value="${lyric ? lyric.replace(/"/g, '&quot;') : ''}" style="flex: 1; padding: 4px 8px; min-height: unset; height: 32px; font-size: 0.85rem;">
        <span style="font-size: 0.8rem; opacity: 0.7; margin-left: 8px;">Sync:</span>
        <input type="text" class="admin-input stanza-time-input" placeholder="00:00" value="${formatTimeToMinutes(timestamp)}" style="width: 70px; padding: 4px 8px; min-height: unset; height: 32px; text-align: center;" title="Menit:Detik (misal: 01:15)">
        <button class="admin-icon-btn delete-btn" onclick="removeStanza('stanza-field-${num}')" title="Hapus bait">✕</button>
      </div>
    </div>
    <div class="admin-textarea stanza-input" contenteditable="true" data-placeholder="Tulis bait puisi di sini..." 
         onmouseup="updateToolbarState(this)" onkeyup="updateToolbarState(this)" oninput="updateToolbarState(this)" onfocus="updateToolbarState(this)">${displayValue}</div>
  `;
  container.appendChild(div);
}

function updateToolbarState(editor) {
  const toolbar = editor.closest('.admin-stanza-field').querySelector('.stanza-toolbar');
  const btns = toolbar.querySelectorAll('.toolbar-btn');
  
  btns.forEach(btn => {
    const cmd = btn.getAttribute('data-cmd');
    if (!cmd) return;
    
    let isActive = false;
    if (cmd.startsWith('justify')) {
      // Alignment is special: queryCommandValue returns a boolean or string
      isActive = document.queryCommandState(cmd);
      // Fallback check if state isn't enough (some browsers are picky)
      if (!isActive && cmd === 'justifyLeft') {
         const center = document.queryCommandState('justifyCenter');
         const right = document.queryCommandState('justifyRight');
         if (!center && !right) isActive = true; // left is usually default
      }
    } else {
      isActive = document.queryCommandState(cmd);
    }
    
    btn.classList.toggle('active', isActive);
  });
}


function formatStanza(command, btn) {
  const field = btn.closest('.admin-stanza-field');
  const editor = field.querySelector('.stanza-input');
  editor.focus();
  document.execCommand(command, false, null);
  updateToolbarState(editor);
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

  // Collect stanzas, lyrics, and timestamps
  const stanzas = [];
  const lyrics = [];
  const timestamps = [];
  document.querySelectorAll('.admin-stanza-field').forEach(field => {
    const ta = field.querySelector('.stanza-input');
    const lyricInput = field.querySelector('.stanza-lyric-input');
    const timeInput = field.querySelector('.stanza-time-input');
    const val = ta.innerHTML.trim();
    // remove empty <br> or empty <div> generated by contenteditable
    if (val && val !== '<br>' && val !== '<div><br></div>') {
      stanzas.push(val);
      lyrics.push(lyricInput.value.trim());
      timestamps.push(parseTimeToSeconds(timeInput.value));
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
    lyrics,
    timestamps,
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
  p.stanzas.forEach((s, idx) => {
    const t = p.timestamps && p.timestamps[idx] ? p.timestamps[idx] : 0;
    const l = p.lyrics && p.lyrics[idx] ? p.lyrics[idx] : '';
    addStanzaField(s, t, l);
  });
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

// ===== AI Copilot (OpenRouter) =====
async function generatePoemWithAI() {
  const promptInput = document.getElementById('copilotPrompt').value.trim();
  const modelSelect = document.getElementById('copilotModel').value;
  const statusEl = document.getElementById('copilotStatus');
  const btnEl = document.getElementById('copilotBtn');

  if (!promptInput) {
    statusEl.textContent = '⚠️ Masukkan topik untuk AI.';
    statusEl.style.color = '#ff6b6b';
    return;
  }

  try {
    statusEl.textContent = '⏳ AI sedang merangkai kata...';
    statusEl.style.color = 'var(--text-secondary)';
    btnEl.disabled = true;
    btnEl.innerHTML = '⏳ Memproses...';

    // Dynamic API routing based on model
    const isAgentRouter = modelSelect.startsWith('claude');
    const apiKey = typeof ENV !== 'undefined' 
      ? (isAgentRouter ? ENV.API_KEY_AGENTROUTER : ENV.API_KEY_OPENROUTER) 
      : '';
    if (!apiKey) {
      throw new Error('API Key tidak ditemukan. Pastikan file env.js sudah dikonfigurasi.');
    }
    const apiUrl = isAgentRouter 
      ? 'https://agentrouter.org/v1/chat/completions' 
      : 'https://openrouter.ai/api/v1/chat/completions';
    let contentArr = [];
    
    // Add text prompt
    const systemInstruction = `Kamu adalah Roderikus, seorang penyair ahli yang romantis, puitis, dan sedikit melankolis. Tulisanmu adalah "sebuah novel tentang sunyi, dari manusia yang menyimpan percakapan dalam kepala". 

Tugasmu adalah membuat puisi berdasarkan topik yang diberikan.

PENTING - KONTEKS KHUSUS:
Jika topik berkaitan dengan atau menyebut nama "Sisi":
Gunakan metafora seni, musik, dan kupu-kupu. Pesan utamanya adalah kebahagiaan, harapan, dan membebaskannya dari cerita duka.
JUDUL PUISI: Judul puisi WAJIB memuat nama "Sisi" (contoh: "Untuk Sisi", "Sisi", dll).

Jika topik berkaitan dengan atau menyebut nama "Shofia":
Gunakan metafora hujan, ruang gelap, dan penyembuhan. Pesan utamanya adalah bagaimana kehadirannya adalah obat tak terduga untuk luka yang disembunyikan.
JUDUL PUISI: Judul puisi WAJIB memuat nama "Shofia" (contoh: "Untuk Shofia", "Shofia", dll).

Aturan Output:
Berikan hasil dalam format JSON persis seperti ini, tanpa markdown block, hanya JSON murni:
{
  "judul": "Judul Puisi",
  "bait": [
    "Baris 1 bait pertama<br>Baris 2 bait pertama<br>Baris 3 bait pertama",
    "Baris 1 bait kedua<br>Baris 2 bait kedua<br>Baris 3 bait kedua"
  ]
}
Setiap bait harus berupa string tunggal, dan gunakan <br> untuk pindah baris dalam bait tersebut. Jangan tambahkan penjelasan lain.`;

    let userPrompt = promptInput ? `Topik: ${promptInput}` : 'Buatkan puisi untukku.';
    
    // Automatically assign Sisi or Shofia if neither is mentioned
    const lowerPrompt = userPrompt.toLowerCase();
    if (!lowerPrompt.includes('sisi') && !lowerPrompt.includes('shofia')) {
      const randomName = Math.random() > 0.5 ? 'Sisi' : 'Shofia';
      userPrompt += `\n(Catatan: Puisi ini harus secara khusus ditujukan untuk ${randomName})`;
    }

    contentArr.push({ type: "text", text: userPrompt });



    const payload = isAgentRouter ? {
      model: modelSelect,
      messages: [
        { role: "user", content: systemInstruction + "\n\nTopik:\n" + userPrompt }
      ]
    } : {
      model: modelSelect,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: contentArr }
      ]
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    let reply = data.choices[0].message.content.trim();
    
    // Cleanup markdown if AI still outputs it
    reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const poemData = JSON.parse(reply);

    // Auto-fill form
    document.getElementById('poemTitle').value = poemData.judul || '';
    
    // Clear existing stanzas and fill with new ones
    document.querySelectorAll('.admin-stanza-field').forEach(el => el.remove());
    stanzaCount = 0;
    
    if (poemData.bait && Array.isArray(poemData.bait)) {
      poemData.bait.forEach(baitText => {
        addStanzaField(baitText);
      });
    } else {
      addStanzaField("Maaf, format balasan AI tidak sesuai.");
    }

    statusEl.textContent = '✨ Berhasil membuat puisi!';
    statusEl.style.color = 'var(--text-accent)';

  } catch (error) {
    console.error("Copilot Error:", error);
    statusEl.textContent = '❌ Gagal: ' + error.message;
    statusEl.style.color = '#ff6b6b';
  } finally {
    btnEl.disabled = false;
    btnEl.innerHTML = '✨ Generate Puisi dengan AI';
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
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
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        const normalized = normalizePoemArray(data);
        savePoems(normalized);
        renderStats();
        renderAdminPoemList();
        showActionToast('✅ Data berhasil diimpor!');
      } else {
        showActionToast('❌ Format file tidak valid.');
      }
    } catch (err) {
      showActionToast('❌ Gagal membaca file JSON.');
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
  const songs = typeof defaultSongs !== 'undefined' ? defaultSongs : [];
  
  // Format each poem object for the file
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
    if (p.lyrics && p.lyrics.length > 0 && p.lyrics.some(l => l)) {
      obj += `    lyrics: [\n`;
      obj += p.lyrics.map(l => `      ${JSON.stringify(l)}`).join(',\n');
      obj += `\n    ],\n`;
    }
    if (p.timestamps && p.timestamps.length > 0) {
      obj += `    timestamps: [${p.timestamps.join(', ')}],\n`;
    }
    obj += `    songTitle: ${JSON.stringify(p.songTitle || '')},\n`;
    obj += `    songArtist: ${JSON.stringify(p.songArtist || '')},\n`;
    obj += `    youtubeUrl: ${JSON.stringify(p.youtubeUrl || '')}\n`;
    obj += `  }`;
    return obj;
  }).join(',\n');

  const fileContent = `// ===== Shared Poem & Song Data =====
// Generated: ${new Date().toLocaleString()}

// Default poems (shipped with the site)
const defaultPoems = [
${poemsStr}
];

// ===== Default Background Songs (YouTube) =====
const defaultSongs = ${JSON.stringify(songs, null, 2)};

// Extract YouTube video ID from various URL formats
function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)([\\w-]{11})/,
    /^([\\w-]{11})$/
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
    try { 
      const data = JSON.parse(stored);
      return Array.isArray(data) ? normalizePoemArray(data) : [...defaultPoems];
    } catch (e) { return [...defaultPoems]; }
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

// Migration layer: ensures old data formats are compatible with new features
function normalizePoemArray(arr) {
  return arr.map(p => normalizePoem(p));
}

function normalizePoem(p) {
  const poem = { ...p };
  if (!poem.tags) poem.tags = [];
  if (!poem.stanzas) poem.stanzas = [];
  if (!poem.lyrics) poem.lyrics = [];
  if (!poem.timestamps) poem.timestamps = [];
  poem.stanzas = poem.stanzas.map(s => typeof s === 'string' ? s : JSON.stringify(s));
  return poem;
}

// Live poems array (used by home.js, script.js)
const poems = getPoems();

// ===== Utility =====
function formatDate(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
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
  showActionToast('✅ File data.js siap diunduh!');
}

// ===== UI Utility =====
function showActionToast(msg) {
  const toast = document.getElementById('actionToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
