// ===== Poem Page + Music Player =====

// ===== Get Poem from URL =====
const urlParams = new URLSearchParams(window.location.search);
const poemId = urlParams.get('id');
const poem = getPoemById(poemId);

// ===== Render Poem =====
function renderPoem() {
  if (!poem) {
    document.getElementById('poemPage').innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="font-size:4rem;margin-bottom:16px;">😢</div>
        <h2 style="font-family:'Caveat',cursive;font-size:1.8rem;color:var(--text-accent);">Puisi tidak ditemukan</h2>
        <p style="color:var(--text-secondary);margin-top:8px;">Kembali ke <a href="index.html" style="color:var(--pink-dark);">beranda</a></p>
      </div>`;
    document.getElementById('musicPlayer').style.display = 'none';
    return;
  }

  document.title = `🌸 ${poem.title} — Taman Puisi`;

  // Header
  document.getElementById('poemHeader').innerHTML = `
    ${poem.isPrivate ? '<div class="poem-private-badge">🔒 Puisi Pribadi</div>' : ''}
    <div class="poem-page-emoji">${poem.emoji}</div>
    <h1 class="poem-page-title">${poem.title}</h1>
    <div class="poem-page-meta">
      <span class="poem-page-author">✍️ ${poem.author}</span>
      <span class="poem-page-date">📅 ${formatDate(poem.date)}</span>
    </div>
    <div class="poem-page-tags">
      ${poem.tags.map(t => `<span class="poem-tag ${t.type}">${t.icon} ${t.label}</span>`).join('')}
    </div>
  `;

  // Body - stanzas
  const stanzasHTML = poem.stanzas.map((stanza, i) => {
    const lines = stanza.replace(/\n/g, '<br>');
    return `
      <div class="poem-stanza-wrapper">
        <div class="poem-stanza" data-stanza-idx="${i}">${lines}</div>
        <div class="stanza-actions">
          <button class="stanza-btn copy-btn" onclick="copyStanza(${i})" title="Salin kutipan">
            <span class="stanza-btn-icon">📋</span>
            <span>Salin</span>
          </button>
          <button class="stanza-btn download-btn" onclick="downloadStanzaPNG(${i})" title="Unduh sebagai gambar">
            <span class="stanza-btn-icon">🖼️</span>
            <span>Unduh PNG</span>
          </button>
        </div>
      </div>`;
  }).join('<div class="stanza-divider">✿</div>');

  if (poem.isPrivate) {
    document.getElementById('poemBody').innerHTML = stanzasHTML;
    document.getElementById('poemBody').classList.add('poem-body-blurred', 'poem-locked-overlay');
    // Inject lock banner
    const banner = document.createElement('div');
    banner.className = 'poem-lock-banner';
    banner.id = 'lockBanner';
    banner.innerHTML = `
      <div class="lock-icon-big">🔐</div>
      <div class="lock-title">Puisi Pribadi</div>
      <p class="lock-hint">Masukkan kata sandi untuk membuka puisi ini</p>
      <div class="password-row">
        <input type="password" class="password-input" id="passwordInput"
          placeholder="Kata sandi..."
          onkeydown="if(event.key==='Enter') tryUnlock()">
        <button class="unlock-btn" onclick="tryUnlock()">🔑 Buka</button>
      </div>
      <div class="unlock-error" id="unlockError"></div>
    `;
    document.getElementById('poemBody').appendChild(banner);
  } else {
    document.getElementById('poemBody').innerHTML = stanzasHTML;
  }

  // Footer
  document.getElementById('poemFooter').innerHTML = `
    <button class="like-poem-btn" id="likePoemBtn" onclick="toggleLikePoem()">
      <span class="like-icon">🤍</span>
      <span class="like-text">Suka puisi ini</span>
    </button>
    <div class="poem-nav-links">
      ${getPrevPoem() ? `<a href="poem.html?id=${getPrevPoem().id}" class="poem-nav-link prev-link">← ${getPrevPoem().title}</a>` : '<span></span>'}
      ${getNextPoem() ? `<a href="poem.html?id=${getNextPoem().id}" class="poem-nav-link next-link">${getNextPoem().title} →</a>` : '<span></span>'}
    </div>
  `;

  currentSongIndex = poem.songIndex || 0;
  initSongList();
  updatePlayerUI();
}

// ===== Private Poem — Unlock =====
function tryUnlock() {
  const input = document.getElementById('passwordInput');
  const errorEl = document.getElementById('unlockError');
  const entered = input.value.trim();

  if (entered === poem.password) {
    // Unlock!
    document.getElementById('poemBody').classList.add('unlocked');
    const banner = document.getElementById('lockBanner');
    banner.classList.add('hidden');
    showUnlockToast();
    // Auto remove banner after animation
    setTimeout(() => banner.remove(), 500);
  } else {
    // Wrong password — shake effect
    input.classList.remove('error');
    void input.offsetWidth; // reflow
    input.classList.add('error');
    errorEl.textContent = '❌ Kata sandi salah. Coba lagi!';
    setTimeout(() => {
      input.classList.remove('error');
      errorEl.textContent = '';
    }, 2000);
    input.value = '';
    input.focus();
  }
}

function showUnlockToast() {
  const toast = document.createElement('div');
  toast.className = 'unlock-success-toast';
  toast.textContent = '✨ Puisi berhasil dibuka!';
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}


function getPrevPoem() {
  const sorted = [...poems].sort((a, b) => new Date(b.date) - new Date(a.date));
  const idx = sorted.findIndex(p => p.id === poem.id);
  return idx < sorted.length - 1 ? sorted[idx + 1] : null;
}

function getNextPoem() {
  const sorted = [...poems].sort((a, b) => new Date(b.date) - new Date(a.date));
  const idx = sorted.findIndex(p => p.id === poem.id);
  return idx > 0 ? sorted[idx - 1] : null;
}

function toggleLikePoem() {
  const btn = document.getElementById('likePoemBtn');
  const icon = btn.querySelector('.like-icon');
  const text = btn.querySelector('.like-text');
  btn.classList.toggle('liked');
  if (btn.classList.contains('liked')) {
    icon.textContent = '💖';
    text.textContent = 'Disukai!';
  } else {
    icon.textContent = '🤍';
    text.textContent = 'Suka puisi ini';
  }
}

// ===== Music Player =====
let currentSongIndex = 0;
let isPlaying = false;
let audioCtx = null;
let currentOscillators = [];
let currentGainNode = null;
let startTime = 0;
let songDuration = 32;
let animFrameId = null;
let masterVolume = 0.3;

const playBtn = document.getElementById('playBtn');
const songTitleEl = document.getElementById('songTitle');
const songArtistEl = document.getElementById('songArtist');
const progressFill = document.getElementById('progressFill');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playerArtwork = document.getElementById('playerArtwork');
const songSelector = document.getElementById('songSelector');
const songListEl = document.getElementById('songList');

const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
};

function initSongList() {
  songListEl.innerHTML = '';
  songs.forEach((song, index) => {
    const li = document.createElement('li');
    li.className = `song-item ${index === currentSongIndex ? 'active' : ''}`;
    li.innerHTML = `
      <div class="song-icon">${song.icon}</div>
      <div class="song-details">
        <div class="song-name">${song.title}</div>
        <div class="song-artist-name">${song.artist}</div>
      </div>`;
    li.onclick = () => selectSong(index);
    songListEl.appendChild(li);
  });
}

function selectSong(index) {
  stopAll();
  currentSongIndex = index;
  updatePlayerUI();
  initSongList();
  songSelector.classList.remove('show');
  playSong();
}

function updatePlayerUI() {
  const song = songs[currentSongIndex];
  songTitleEl.textContent = song.title;
  songArtistEl.textContent = song.artist;
  playerArtwork.textContent = song.icon;
  totalTimeEl.textContent = fmtTime(songDuration);
}

function fmtTime(s) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playNote(ctx, dest, freq, start, dur, type = 'sine', vol = 0.12) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.05);
  gain.gain.setValueAtTime(vol, start + dur - 0.1);
  gain.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + dur);
  currentOscillators.push(osc);
}

function createMelody(type) {
  const ctx = getCtx();
  const mg = ctx.createGain();
  mg.gain.value = masterVolume;
  mg.connect(ctx.destination);
  currentGainNode = mg;
  const now = ctx.currentTime;
  startTime = now;
  songDuration = 32;

  const melodies = {
    morning: {
      notes: [[NOTES.E4, 0], [NOTES.G4, 1], [NOTES.A4, 2], [NOTES.B4, 3], [NOTES.C5, 4.5], [NOTES.B4, 5.5], [NOTES.A4, 6.5], [NOTES.G4, 7.5], [NOTES.E4, 9], [NOTES.G4, 10], [NOTES.B4, 11], [NOTES.C5, 12], [NOTES.D5, 13.5], [NOTES.C5, 14.5], [NOTES.B4, 15.5], [NOTES.A4, 16.5], [NOTES.E4, 18], [NOTES.G4, 19], [NOTES.A4, 20], [NOTES.C5, 21], [NOTES.B4, 22.5], [NOTES.A4, 23.5], [NOTES.G4, 24.5], [NOTES.E4, 25.5], [NOTES.G4, 27], [NOTES.A4, 28], [NOTES.B4, 29], [NOTES.E5, 30]],
      pads: [[NOTES.C3, 0, 4], [NOTES.E3, 0, 4], [NOTES.G3, 0, 4], [NOTES.A3, 4, 4], [NOTES.C4, 4, 4], [NOTES.E4, 4, 4], [NOTES.C3, 8, 4], [NOTES.E3, 8, 4], [NOTES.G3, 8, 4], [NOTES.F3, 12, 4], [NOTES.A3, 12, 4], [NOTES.C4, 12, 4], [NOTES.C3, 16, 4], [NOTES.E3, 16, 4], [NOTES.G3, 16, 4], [NOTES.A3, 20, 4], [NOTES.C4, 20, 4], [NOTES.E4, 20, 4], [NOTES.F3, 24, 4], [NOTES.A3, 24, 4], [NOTES.C4, 24, 4], [NOTES.C3, 28, 4], [NOTES.E3, 28, 4], [NOTES.G3, 28, 4]]
    },
    rain: {
      notes: [[NOTES.E5, 0], [NOTES.D5, .3], [NOTES.C5, .6], [NOTES.B4, 1.5], [NOTES.A4, 1.8], [NOTES.G4, 2.1], [NOTES.E5, 3], [NOTES.C5, 3.4], [NOTES.A4, 3.8], [NOTES.G4, 4.5], [NOTES.E4, 5], [NOTES.D4, 5.5], [NOTES.E5, 7], [NOTES.D5, 7.3], [NOTES.C5, 7.6], [NOTES.B4, 8.5], [NOTES.A4, 8.8], [NOTES.G4, 9.1], [NOTES.C5, 10], [NOTES.A4, 10.4], [NOTES.G4, 10.8], [NOTES.F4, 11.5], [NOTES.E4, 12], [NOTES.C4, 12.5], [NOTES.E5, 14], [NOTES.D5, 14.3], [NOTES.C5, 14.6], [NOTES.B4, 15.5], [NOTES.A4, 15.8], [NOTES.G4, 16.1], [NOTES.E5, 17], [NOTES.C5, 17.4], [NOTES.A4, 17.8], [NOTES.G4, 18.5], [NOTES.E4, 19], [NOTES.D4, 19.5], [NOTES.E5, 21], [NOTES.D5, 21.3], [NOTES.C5, 21.6], [NOTES.B4, 22.5], [NOTES.A4, 22.8], [NOTES.G4, 23.1], [NOTES.C5, 24], [NOTES.E4, 26], [NOTES.G4, 27], [NOTES.C5, 28], [NOTES.E5, 29], [NOTES.C5, 30], [NOTES.G4, 31]],
      pads: [[NOTES.C3, 0, 8], [NOTES.G3, 0, 8], [NOTES.A3, 8, 6], [NOTES.E3, 8, 6], [NOTES.F3, 14, 7], [NOTES.C3, 14, 7], [NOTES.C3, 21, 6], [NOTES.G3, 21, 6], [NOTES.C3, 27, 5], [NOTES.E3, 27, 5]]
    },
    starry: {
      notes: [[NOTES.C5, 0], [NOTES.E5, .7], [NOTES.G5, 1.4], [NOTES.E5, 2.5], [NOTES.C5, 3.2], [NOTES.D5, 4], [NOTES.B4, 5], [NOTES.G4, 5.7], [NOTES.A4, 6.5], [NOTES.C5, 7.5], [NOTES.E5, 8.2], [NOTES.G5, 9], [NOTES.A5, 10], [NOTES.G5, 10.7], [NOTES.E5, 11.4], [NOTES.D5, 12.5], [NOTES.C5, 13.2], [NOTES.E5, 14], [NOTES.G4, 15], [NOTES.B4, 15.7], [NOTES.D5, 16.4], [NOTES.C5, 18], [NOTES.E5, 18.7], [NOTES.G5, 19.4], [NOTES.E5, 20.5], [NOTES.C5, 21.2], [NOTES.A4, 22], [NOTES.B4, 23], [NOTES.D5, 23.7], [NOTES.G5, 24.5], [NOTES.E5, 25.5], [NOTES.C5, 26.2], [NOTES.G4, 27], [NOTES.C5, 28], [NOTES.E5, 29], [NOTES.G5, 30], [NOTES.C5, 31]],
      pads: [[NOTES.C3, 0, 3], [NOTES.E3, 1.5, 1.5], [NOTES.A3, 3, 3], [NOTES.C3, 4.5, 1.5], [NOTES.F3, 6, 3], [NOTES.A3, 7.5, 1.5], [NOTES.G3, 9, 3], [NOTES.B3, 10.5, 1.5], [NOTES.C3, 12, 3], [NOTES.E3, 13.5, 1.5], [NOTES.A3, 15, 3], [NOTES.C3, 16.5, 1.5], [NOTES.C3, 18, 3], [NOTES.E3, 19.5, 1.5], [NOTES.F3, 21, 3], [NOTES.A3, 22.5, 1.5], [NOTES.G3, 24, 3], [NOTES.B3, 25.5, 1.5], [NOTES.C3, 27, 5]]
    },
    cherry: {
      notes: [[NOTES.E4, 0], [NOTES.A4, .8], [NOTES.B4, 1.6], [NOTES.E5, 2.5], [NOTES.D5, 3.5], [NOTES.B4, 4.3], [NOTES.A4, 5.2], [NOTES.E4, 6], [NOTES.A4, 7], [NOTES.B4, 8], [NOTES.D5, 8.8], [NOTES.E5, 9.6], [NOTES.D5, 10.5], [NOTES.B4, 11.5], [NOTES.A4, 12.3], [NOTES.E4, 13.2], [NOTES.A4, 14.2], [NOTES.B4, 15], [NOTES.E4, 16], [NOTES.A4, 16.8], [NOTES.B4, 17.6], [NOTES.E5, 18.5], [NOTES.D5, 19.5], [NOTES.B4, 20.3], [NOTES.A4, 21.2], [NOTES.E4, 22], [NOTES.A4, 23], [NOTES.B4, 24], [NOTES.D5, 24.8], [NOTES.E5, 25.6], [NOTES.B4, 26.5], [NOTES.A4, 27.5], [NOTES.E4, 28.5], [NOTES.A4, 29.5], [NOTES.E5, 30.5]],
      pads: [[NOTES.A3, 0, 4], [NOTES.E3, 0, 4], [NOTES.A3, 4, 4], [NOTES.C3, 4, 4], [NOTES.D3, 8, 4], [NOTES.A3, 8, 4], [NOTES.E3, 12, 4], [NOTES.B3, 12, 4], [NOTES.A3, 16, 4], [NOTES.E3, 16, 4], [NOTES.A3, 20, 4], [NOTES.C3, 20, 4], [NOTES.D3, 24, 4], [NOTES.A3, 24, 4], [NOTES.E3, 28, 4], [NOTES.A3, 28, 4]]
    }
  };

  const m = melodies[type];
  if (!m) return;
  m.notes.forEach(([f, t]) => playNote(ctx, mg, f, now + t, 0.7, 'sine', 0.11));
  m.pads.forEach(([f, t, d]) => playNote(ctx, mg, f, now + t, d, 'triangle', 0.055));
}

function playSong() {
  stopAll();
  isPlaying = true;
  playBtn.textContent = '⏸';
  playerArtwork.classList.add('spinning');
  updatePlayerUI();
  createMelody(songs[currentSongIndex].melody);
  updateProgress();
  setTimeout(() => { if (isPlaying) nextSong(); }, songDuration * 1000);
}

function stopAll() {
  isPlaying = false;
  playBtn.textContent = '▶';
  playerArtwork.classList.remove('spinning');
  currentOscillators.forEach(o => { try { o.stop(); } catch (e) { } });
  currentOscillators = [];
  if (currentGainNode) { try { currentGainNode.disconnect(); } catch (e) { } currentGainNode = null; }
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
}

function togglePlay() { isPlaying ? stopAll() : playSong(); }
function nextSong() { stopAll(); currentSongIndex = (currentSongIndex + 1) % songs.length; initSongList(); playSong(); }
function prevSong() { stopAll(); currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length; initSongList(); playSong(); }

function updateProgress() {
  if (!isPlaying || !audioCtx) return;
  const elapsed = audioCtx.currentTime - startTime;
  progressFill.style.width = Math.min((elapsed / songDuration) * 100, 100) + '%';
  currentTimeEl.textContent = fmtTime(Math.min(elapsed, songDuration));
  if (elapsed < songDuration) animFrameId = requestAnimationFrame(updateProgress);
}

progressBar.addEventListener('click', e => {
  const pct = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
  progressFill.style.width = (pct * 100) + '%';
  currentTimeEl.textContent = fmtTime(pct * songDuration);
});

function toggleSongList() { songSelector.classList.toggle('show'); }
document.addEventListener('click', e => {
  if (!songSelector.contains(e.target) && e.target.id !== 'listBtn') songSelector.classList.remove('show');
});

// ===== Copy Stanza =====
function copyStanza(idx) {
  const text = poem.stanzas[idx];
  const credit = `\n\n— ${poem.author}, "${poem.title}"`;
  navigator.clipboard.writeText(text + credit).then(() => {
    showActionToast('📋 Kutipan disalin!');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text + credit;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showActionToast('📋 Kutipan disalin!');
  });
}

// ===== Download Stanza as PNG =====
function downloadStanzaPNG(idx) {
  const stanza = poem.stanzas[idx];
  const lines = stanza.split('\n');

  const W = 800, H = 500;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ---- Background gradient ----
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,   '#fff0f8');
  grad.addColorStop(0.5, '#f3eeff');
  grad.addColorStop(1,   '#e8faf4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ---- Decorative blobs ----
  function blob(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  blob(100, 100, 200, 'rgba(255,182,213,0.22)');
  blob(700, 400, 220, 'rgba(212,184,255,0.2)');
  blob(400, 250, 150, 'rgba(168,240,216,0.12)');

  // ---- Decorative corner emojis ----
  ctx.font = '32px serif';
  ctx.fillText('🌸', 28, 52);
  ctx.fillText('✨', W - 62, 52);
  ctx.fillText('🍃', 28, H - 24);
  ctx.fillText('💫', W - 62, H - 24);

  // ---- Top accent bar ----
  const barGrad = ctx.createLinearGradient(60, 0, W - 60, 0);
  barGrad.addColorStop(0,    '#ff7eb3');
  barGrad.addColorStop(0.5,  '#b388ff');
  barGrad.addColorStop(1,    '#3db88c');
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(60, 54, W - 120, 5, 10);
  ctx.fill();

  // ---- Opening quote mark ----
  ctx.fillStyle = 'rgba(255,126,179,0.18)';
  ctx.font = 'bold 140px Georgia, serif';
  ctx.fillText('\u201C', 44, 170);

  // ---- Poem stanza lines ----
  ctx.fillStyle = '#5a4a6a';
  ctx.font = '500 26px \'Quicksand\', \'Segoe UI\', sans-serif';
  ctx.textAlign = 'center';
  const lineH = 44;
  const startY = H / 2 - ((lines.length - 1) * lineH) / 2 - 10;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineH);
  });

  // ---- Closing quote mark (right-aligned) ----
  ctx.fillStyle = 'rgba(179,136,255,0.18)';
  ctx.font = 'bold 140px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('\u201D', W - 44, H - 90);

  // ---- Bottom accent bar ----
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(60, H - 60, W - 120, 5, 10);
  ctx.fill();

  // ---- Poem emoji + title ----
  ctx.textAlign = 'center';
  ctx.font = '500 17px \'Quicksand\', \'Segoe UI\', sans-serif';
  ctx.fillStyle = '#d46b9e';
  ctx.fillText(`${poem.emoji}  ${poem.title}`, W / 2, H - 64);

  // ---- Author credit ----
  ctx.font = 'italic 15px \'Quicksand\', \'Segoe UI\', sans-serif';
  ctx.fillStyle = '#8a7a9a';
  ctx.fillText(`— ${poem.author}`, W / 2, H - 38);

  // ---- Watermark ----
  ctx.font = '12px \'Quicksand\', \'Segoe UI\', sans-serif';
  ctx.fillStyle = 'rgba(138,122,154,0.45)';
  ctx.fillText('🌸 Roderikus Poem', W / 2, H - 14);

  // ---- Download ----
  const link = document.createElement('a');
  link.download = `${poem.title.replace(/\s+/g, '_')}_stanza_${idx + 1}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showActionToast('🖼️ Gambar berhasil diunduh!');
}

// ===== Action Toast =====
function showActionToast(msg) {
  // Remove existing
  document.querySelectorAll('.action-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'action-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ===== Initialize =====
renderPoem();
