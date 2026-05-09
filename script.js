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

  document.title = `🪶 ${poem.title} — Taman Puisi`;

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
    const btnHidden = poem.isPrivate ? 'btn-hidden' : '';
    return `
      <div class="poem-stanza-wrapper">
        <div class="poem-stanza" data-stanza-idx="${i}">${lines}</div>
        <div class="stanza-actions">
          <button class="stanza-btn copy-btn ${btnHidden}" onclick="copyStanza(${i})" title="Salin kutipan">
            <span class="stanza-btn-icon">📋</span>
            <span>Salin</span>
          </button>
          <button class="stanza-btn download-btn ${btnHidden}" onclick="downloadStanzaPNG(${i})" title="Unduh sebagai gambar">
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
    <div class="poem-footer-actions">
      <button class="download-full-btn ${poem.isPrivate ? 'btn-hidden' : ''}" id="downloadFullBtn" onclick="downloadFullPoemPNG()">
        <span>🖼️</span>
        <span>Unduh Puisi</span>
      </button>
    </div>
    <div class="poem-nav-links">
      ${getPrevPoem() ? `<a href="poem.html?id=${getPrevPoem().id}" class="poem-nav-link prev-link">← ${getPrevPoem().title}</a>` : '<span></span>'}
      ${getNextPoem() ? `<a href="poem.html?id=${getNextPoem().id}" class="poem-nav-link next-link">${getNextPoem().title} →</a>` : '<span></span>'}
    </div>
  `;

  initPlayer();
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
    // Reveal download full poem button
    const dlBtn = document.getElementById('downloadFullBtn');
    if (dlBtn) {
      dlBtn.classList.remove('btn-hidden');
      dlBtn.classList.add('btn-revealed');
    }
    // Reveal all per-stanza buttons with staggered pop-in
    document.querySelectorAll('.stanza-btn.btn-hidden').forEach((btn, idx) => {
      setTimeout(() => {
        btn.classList.remove('btn-hidden');
        btn.classList.add('btn-revealed');
      }, idx * 60);
    });
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



// ===== YouTube Music Player =====
let ytPlayer = null;
let isPlaying = false;
let progressInterval = null;

const playBtn = document.getElementById('playBtn');
const songTitleEl = document.getElementById('songTitle');
const songArtistEl = document.getElementById('songArtist');
const progressFill = document.getElementById('progressFill');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playerArtwork = document.getElementById('playerArtwork');

function initPlayer() {
  if (!poem) return;

  const videoId = getYouTubeId(poem.youtubeUrl);

  if (!videoId) {
    // No YouTube URL — hide player
    document.getElementById('musicPlayer').style.display = 'none';
    return;
  }

  songTitleEl.textContent = poem.songTitle || 'Lagu Latar';
  songArtistEl.textContent = poem.songArtist || 'YouTube';
  playerArtwork.textContent = poem.emoji || '🎵';
}

// YouTube IFrame API callback (called automatically)
function onYouTubeIframeAPIReady() {
  if (!poem) return;
  const videoId = getYouTubeId(poem.youtubeUrl);
  if (!videoId) return;

  ytPlayer = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: videoId
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerReady() {
  if (ytPlayer && ytPlayer.getDuration) {
    totalTimeEl.textContent = fmtTime(ytPlayer.getDuration());
  }
  // Autoplay after 4 second delay
  setTimeout(() => {
    if (ytPlayer && ytPlayer.playVideo) {
      ytPlayer.playVideo();
    }
  }, 4000);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    playBtn.textContent = '⏸';
    playerArtwork.classList.add('spinning');
    startProgressUpdate();
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    playBtn.textContent = '▶';
    playerArtwork.classList.remove('spinning');
    stopProgressUpdate();
  }
}

function togglePlay() {
  if (!ytPlayer || !ytPlayer.playVideo) return;

  if (isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function startProgressUpdate() {
  stopProgressUpdate();
  progressInterval = setInterval(() => {
    if (!ytPlayer || !ytPlayer.getCurrentTime) return;
    const current = ytPlayer.getCurrentTime();
    const total = ytPlayer.getDuration();
    if (total > 0) {
      progressFill.style.width = (current / total * 100) + '%';
      currentTimeEl.textContent = fmtTime(current);
      totalTimeEl.textContent = fmtTime(total);
    }
  }, 500);
}

function stopProgressUpdate() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// Click on progress bar to seek
progressBar.addEventListener('click', e => {
  if (!ytPlayer || !ytPlayer.seekTo) return;
  const pct = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
  const seekTo = pct * ytPlayer.getDuration();
  ytPlayer.seekTo(seekTo, true);
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

// ===== Download Stanza as PNG (formal + sweet) =====
function downloadStanzaPNG(idx) {
  const stanza = poem.stanzas[idx];
  const lines = stanza.split('\n');

  const W = 800;
  const LINE_H = 42;
  const textH = lines.length * LINE_H;
  const H = Math.max(360, textH + 220);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ---- Background: dark navy ----
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#1a1528');
  bgGrad.addColorStop(1, '#13101e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ---- Outer border ----
  ctx.strokeStyle = '#2e2840';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // ---- Top accent bar (gradient) ----
  const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
  accentGrad.addColorStop(0, '#d4a574');
  accentGrad.addColorStop(1, '#8b7ec8');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, W, 4);

  // ---- Subtle bottom bar ----
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, H - 4, W, 4);

  // ---- Opening quote mark ----
  ctx.textAlign = 'left';
  ctx.font = 'bold 64px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(212,165,116,0.3)';
  ctx.fillText('\u201C', 44, 78);

  // ---- Stanza text (centered) ----
  ctx.textAlign = 'center';
  ctx.font = '400 22px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#e0d8ec';
  const startY = H / 2 - (textH / 2) + LINE_H * 0.6;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * LINE_H);
  });

  // ---- Closing quote mark ----
  ctx.textAlign = 'right';
  ctx.font = 'bold 64px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(139,126,200,0.3)';
  ctx.fillText('\u201D', W - 44, H - 68);

  // ---- Thin divider line ----
  const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.3, '#3a3050');
  divGrad.addColorStop(0.7, '#3a3050');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, H - 54);
  ctx.lineTo(W - 100, H - 54);
  ctx.stroke();

  // ---- Credit: author · title ----
  ctx.textAlign = 'center';
  ctx.font = 'italic 14px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#9a8fb0';
  ctx.fillText(`\u2014 ${poem.author}  \u00B7  ${poem.title}`, W / 2, H - 34);

  // ---- Watermark ----
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = 'rgba(154,143,176,0.4)';
  ctx.fillText('roderikusro.github.io/Poem', W / 2, H - 14);

  // ---- Download ----
  const link = document.createElement('a');
  link.download = `${poem.title.replace(/\s+/g, '_')}_bait_${idx + 1}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showActionToast('\uD83D\uDDBC\uFE0F Gambar berhasil diunduh!');
}

// ===== Download Full Poem as PNG (responsive height) =====
function downloadFullPoemPNG() {
  const W = 800;
  const LINE_H = 38;
  const PAD_X = 100;

  // Calculate total canvas height dynamically
  let totalH = 0;
  totalH += 40;  // top padding
  totalH += 60;  // emoji
  totalH += 44;  // title
  totalH += 30;  // author + date
  totalH += 50;  // spacer after header
  poem.stanzas.forEach((stanza, i) => {
    totalH += stanza.split('\n').length * LINE_H;
    totalH += 24; // bottom padding per stanza
    if (i < poem.stanzas.length - 1) totalH += 44; // divider flower
  });
  totalH += 60;  // footer spacer
  totalH += 20;  // watermark line
  totalH += 30;  // bottom padding

  const H = Math.max(500, totalH);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ---- Background ----
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#1a1528');
  bgGrad.addColorStop(1, '#13101e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ---- Border ----
  ctx.strokeStyle = '#2e2840';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // ---- Top accent bar ----
  const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
  accentGrad.addColorStop(0, '#d4a574');
  accentGrad.addColorStop(0.5, '#8b7ec8');
  accentGrad.addColorStop(1, '#6b9e8a');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, W, 5);
  ctx.fillRect(0, H - 5, W, 5);

  let y = 50;

  // ---- Emoji ----
  ctx.textAlign = 'center';
  ctx.font = '40px serif';
  ctx.fillText(poem.emoji, W / 2, y + 10);
  y += 58;

  // ---- Title ----
  ctx.font = 'bold 30px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#d4a574';
  ctx.fillText(poem.title, W / 2, y);
  y += 32;

  // ---- Author · Date ----
  ctx.font = 'italic 15px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#9a8fb0';
  ctx.fillText(`${poem.author}  \u00B7  ${formatDate(poem.date)}`, W / 2, y);
  y += 40;

  // ---- Header divider ----
  const divGrad = ctx.createLinearGradient(PAD_X, 0, W - PAD_X, 0);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.3, '#3a3050');
  divGrad.addColorStop(0.7, '#3a3050');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD_X, y);
  ctx.lineTo(W - PAD_X, y);
  ctx.stroke();
  y += 36;

  // ---- Stanzas ----
  poem.stanzas.forEach((stanza, si) => {
    const lines = stanza.split('\n');
    ctx.textAlign = 'center';
    ctx.font = '400 19px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#e0d8ec';
    lines.forEach(line => {
      ctx.fillText(line, W / 2, y);
      y += LINE_H;
    });
    y += 20;

    // Divider between stanzas
    if (si < poem.stanzas.length - 1) {
      ctx.font = '16px serif';
      ctx.fillStyle = '#6b9e8a';
      ctx.fillText('\u2022', W / 2, y + 6);
      y += 40;
    }
  });

  y += 30;

  // ---- Footer divider ----
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD_X, y);
  ctx.lineTo(W - PAD_X, y);
  ctx.stroke();
  y += 22;

  // ---- Credit ----
  ctx.textAlign = 'center';
  ctx.font = 'italic 13px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#9a8fb0';
  ctx.fillText(`\u2014 ${poem.author}  \u00B7  ${poem.title}`, W / 2, y);
  y += 20;

  // ---- Watermark ----
  ctx.font = '11px Arial, sans-serif';
  ctx.fillStyle = 'rgba(154,143,176,0.4)';
  ctx.fillText('roderikusro.github.io/Poem', W / 2, y);

  // ---- Download ----
  const link = document.createElement('a');
  link.download = `${poem.title.replace(/\s+/g, '_')}_full.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showActionToast('\uD83D\uDDBC\uFE0F Puisi lengkap berhasil diunduh!');
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

// ===== Mobile: Tap stanza to toggle action buttons =====
function initStanzaTapToggle() {
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
  if (!isMobile()) return;

  document.querySelectorAll('.poem-stanza-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', e => {
      // If the click is on a button, let it fire — don't collapse
      if (e.target.closest('.stanza-btn')) return;

      const wasActive = wrapper.classList.contains('active');

      // Close all wrappers first
      document.querySelectorAll('.poem-stanza-wrapper').forEach(w => w.classList.remove('active'));

      // Toggle this one
      if (!wasActive) wrapper.classList.add('active');
    });
  });

  // Tap anywhere outside a wrapper → close all
  document.addEventListener('click', e => {
    if (!e.target.closest('.poem-stanza-wrapper')) {
      document.querySelectorAll('.poem-stanza-wrapper').forEach(w => w.classList.remove('active'));
    }
  });
}

// ===== Initialize =====
renderPoem();
initStanzaTapToggle();
