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
  if (poem.isPrivate) {
    // === SECURE: Don't render any poem content to DOM ===
    // Show only placeholder blocks (no real text, inspect-proof)
    const placeholderHTML = poem.stanzas.map(() => `
      <div class="poem-stanza-wrapper">
        <div class="poem-stanza poem-stanza-locked">
          <span class="locked-line"></span>
          <span class="locked-line"></span>
          <span class="locked-line"></span>
          <span class="locked-line short"></span>
        </div>
      </div>`).join('<div class="stanza-divider">✿</div>');

    document.getElementById('poemBody').innerHTML = placeholderHTML;
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

    // Hide music player for private poems until unlocked
    document.getElementById('musicPlayer').style.display = 'none';

  } else {
    const stanzasHTML = poem.stanzas.map((stanza, i) => {
      // Detect HTML stanza (from rich text editor) vs plain text
      const isHTML = /<[a-z][\s\S]*>/i.test(stanza);
      const content = isHTML ? stanza : stanza.replace(/\n/g, '<br>');
      const alignStyle = isHTML ? '' : 'style="text-align: center;"';
      return `
        <div class="poem-stanza-wrapper" id="stanza-wrapper-${i}" onclick="toggleStanzaActions(${i})">
          <div class="poem-stanza" data-stanza-idx="${i}" ${alignStyle}>${content}</div>

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
        </div>
        ${poem.lyrics && poem.lyrics[i] ? `
        <div class="lyric-snippet" id="lyric-snippet-${i}" onclick="syncStanza(${i})">
          <span class="lyric-icon">🎵</span> "${poem.lyrics[i]}"
        </div>` : ''}`;
    }).join('<div class="stanza-divider"><span>✦</span></div>');


    const poemBody = document.getElementById('poemBody');
    poemBody.innerHTML = stanzasHTML;
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

  // Only init player for non-private poems
  if (!poem.isPrivate) {
    initPlayer();
  }
}

// ===== Private Poem — Unlock =====
function tryUnlock() {
  const input = document.getElementById('passwordInput');
  const errorEl = document.getElementById('unlockError');
  const entered = input.value.trim();

  if (entered === poem.password) {
    // === UNLOCK: Now inject real content into DOM ===
    const banner = document.getElementById('lockBanner');
    banner.classList.add('hidden');
    setTimeout(() => banner.remove(), 500);
    showUnlockToast();

    // Build real stanza HTML
    const stanzasHTML = poem.stanzas.map((stanza, i) => {
      const isHTML = /<[a-z][\s\S]*>/i.test(stanza);
      const content = isHTML ? stanza : stanza.replace(/\n/g, '<br>');
      return `
        <div class="poem-stanza-wrapper" id="stanza-wrapper-${i}" onclick="toggleStanzaActions(${i})">
          <div class="poem-stanza" data-stanza-idx="${i}">${content}</div>
          <div class="stanza-actions">
            <button class="stanza-btn copy-btn btn-revealed" onclick="copyStanza(${i})" title="Salin kutipan">
              <span class="stanza-btn-icon">📋</span>
              <span>Salin</span>
            </button>
            <button class="stanza-btn download-btn btn-revealed" onclick="downloadStanzaPNG(${i})" title="Unduh sebagai gambar">
              <span class="stanza-btn-icon">🖼️</span>
              <span>Unduh PNG</span>
            </button>
          </div>
        </div>
        ${poem.lyrics && poem.lyrics[i] ? `
        <div class="lyric-snippet" id="lyric-snippet-${i}" onclick="syncStanza(${i})">
          <span class="lyric-icon">🎵</span> "${poem.lyrics[i]}"
        </div>` : ''}`;
    }).join('<div class="stanza-divider">✿</div>');

    // Replace placeholders with real content
    const body = document.getElementById('poemBody');
    body.innerHTML = stanzasHTML;
    body.classList.remove('poem-body-blurred', 'poem-locked-overlay');
    body.classList.add('unlocked');

    // Reveal download full poem button
    const dlBtn = document.getElementById('downloadFullBtn');
    if (dlBtn) {
      dlBtn.classList.remove('btn-hidden');
      dlBtn.classList.add('btn-revealed');
    }

    // Show music player, init UI, and create YouTube player with autoplay
    document.getElementById('musicPlayer').style.display = '';
    initPlayer();
    createYouTubePlayer();

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

  // Always show the player UI (even if autoplay fails on mobile)
  document.getElementById('musicPlayer').style.display = '';
  songTitleEl.textContent = poem.songTitle || 'Lagu Latar';
  songArtistEl.textContent = poem.songArtist || 'YouTube';
  playerArtwork.textContent = poem.emoji || '🎵';
}

// YouTube IFrame API callback (called automatically by the API)
function onYouTubeIframeAPIReady() {
  if (!poem) return;
  // Don't auto-create player for private poems — wait until unlocked
  if (poem.isPrivate) return;
  createYouTubePlayer();
}

function createYouTubePlayer() {
  const videoId = getYouTubeId(poem.youtubeUrl);
  if (!videoId) return;

  // Destroy old player if exists
  if (ytPlayer && ytPlayer.destroy) {
    try { ytPlayer.destroy(); } catch(e) {}
    ytPlayer = null;
  }
  document.getElementById('ytContainer').innerHTML = '<div id="ytPlayer"></div>';

  ytPlayer = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    videoId: videoId,
    host: 'https://www.youtube-nocookie.com',
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: videoId,
      playsinline: 1,  // Important for iOS
      origin: window.location.origin
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

// Fallback: if YouTube API loaded before this script, fire manually
// Also handles slow mobile connections with retry polling
function ensureYouTubePlayer() {
  if (ytPlayer) return; // Already created
  if (!poem) return;
  if (poem.isPrivate) return; // Wait for unlock

  if (typeof YT !== 'undefined' && YT.Player) {
    createYouTubePlayer();
  } else {
    // Retry every 500ms up to 10 seconds
    let retries = 0;
    const poller = setInterval(() => {
      retries++;
      if (typeof YT !== 'undefined' && YT.Player) {
        clearInterval(poller);
        createYouTubePlayer();
      }
      if (retries > 20) clearInterval(poller);
    }, 500);
  }
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
      
      // Lyric Sync Highlight
      if (poem && poem.timestamps && poem.timestamps.length > 0) {
        let activeIdx = 0; // Default to first stanza
        for (let i = poem.timestamps.length - 1; i >= 0; i--) {
          if (current >= poem.timestamps[i] - 0.5) { // 0.5s offset for smoother transition
            activeIdx = i;
            break;
          }
        }
        document.querySelectorAll('.lyric-snippet').forEach((el) => {
          const idx = parseInt(el.id.split('-')[2]);
          if (idx === activeIdx) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        });
      }
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

// ===== Mobile Tap to Reveal =====
function toggleStanzaActions(idx) {
  const wrapper = document.getElementById(`stanza-wrapper-${idx}`);
  if (wrapper) {
    const isCurrentlyActive = wrapper.classList.contains('active');
    document.querySelectorAll('.poem-stanza-wrapper').forEach(el => el.classList.remove('active'));
    if (!isCurrentlyActive) {
      wrapper.classList.add('active');
    }
  }
}

// ===== Sync Lyric Click =====
function syncStanza(idx) {
  if (!poem.timestamps || poem.timestamps.length === 0 || !ytPlayer || !ytPlayer.seekTo) return;
  
  const targetTime = poem.timestamps[idx] || 0;
  ytPlayer.seekTo(targetTime, true);
  
  if (!isPlaying) {
    ytPlayer.playVideo();
  }
}

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

// ===== Helper: build off-screen PNG card =====
function buildPNGCard(innerHTML, width = 800) {
  const card = document.createElement('div');
  card.style.cssText = [
    `position:fixed`, `top:-9999px`, `left:-9999px`,
    `width:${width}px`, `background:linear-gradient(135deg,#1a1528,#13101e)`,
    `padding:60px 80px`, `box-sizing:border-box`,
    `font-family:'Quicksand', Georgia, serif`,
    `color:#e0d8ec`, `border:1px solid #2e2840`
  ].join(';');
  card.innerHTML = innerHTML;
  document.body.appendChild(card);
  return card;
}

// Helper to detect alignment from HTML
function getHtmlAlignment(html) {
  if (html.includes('text-align: center') || html.includes('align="center"')) return 'center';
  if (html.includes('text-align: right') || html.includes('align="right"')) return 'right';
  return 'left';
}


// ===== Download Stanza as PNG (Responsive & Alignment aware) =====
function downloadStanzaPNG(idx) {
  if (typeof html2canvas === 'undefined') {
    showActionToast('⚠️ Modul gambar belum siap, coba lagi.');
    return;
  }
  const stanza = poem.stanzas[idx];
  const isHTML = /<[a-z][\s\S]*>/i.test(stanza);
  const content = isHTML ? stanza : stanza.replace(/\n/g, '<br>');
  const align = getHtmlAlignment(content);

  // Dynamic styles based on alignment
  const borderStyle = align === 'left' ? 'border-left:4px solid #d4a574; padding-left:24px;' : '';
  const quoteAlign = align === 'center' ? 'text-align:center' : (align === 'right' ? 'text-align:right' : 'text-align:left');

  const lyricHTML = poem.lyrics && poem.lyrics[idx] ? `
    <div style="margin-top:16px; margin-bottom:20px; font-style:italic; font-size:16px; color:#9a8fb0; text-align:right;">
      <span style="opacity:0.6;">🎵</span> "${poem.lyrics[idx]}"
    </div>
  ` : '<div style="margin-top:30px;"></div>';

  const card = buildPNGCard(`
    <div style="margin-bottom:20px; ${borderStyle}">
      <div style="${quoteAlign}; font-size:54px; opacity:.15; font-family:serif; line-height:0.5; margin-bottom:10px;">\u201C</div>
      <div style="font-size:22px; line-height:1.9; color:#e0d8ec; font-family:inherit;">${content}</div>
      <div style="text-align:${align === 'left' ? 'right' : (align === 'right' ? 'left' : 'center')}; font-size:54px; opacity:.15; font-family:serif; line-height:0.5; margin-top:10px;">\u201D</div>
    </div>
    ${lyricHTML}
    <div style="border-top:1px solid rgba(139,126,200,0.2); padding-top:20px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-style:italic; font-size:14px; color:#9a8fb0; opacity:0.8;">&mdash; ${poem.author} &nbsp;\u00B7&nbsp; ${poem.title}</span>
      <span style="font-size:11px; color:rgba(154,143,176,0.3); letter-spacing:0.5px;">roderikusro.github.io/Poem</span>
    </div>
  `, 700); // Slightly narrower for better focus on mobile

  html2canvas(card, { scale: 2, backgroundColor: null, logging: false, useCORS: true }).then(canvas => {
    card.remove();
    const link = document.createElement('a');
    link.download = `${poem.title.replace(/\s+/g,'_')}_bait_${idx+1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showActionToast('\uD83D\uDDBC\uFE0F Gambar berhasil diunduh!');
  }).catch(err => { 
    console.error(err);
    card.remove(); 
    showActionToast('❌ Gagal mengunduh gambar.'); 
  });
}


// ===== Download Full Poem as PNG (Responsive & Alignment aware) =====
function downloadFullPoemPNG() {
  if (typeof html2canvas === 'undefined') {
    showActionToast('⚠️ Modul gambar belum siap, coba lagi.');
    return;
  }

  const stanzasHTML = poem.stanzas.map((stanza, si) => {
    const isHTML = /<[a-z][\s\S]*>/i.test(stanza);
    const content = isHTML ? stanza : stanza.replace(/\n/g, '<br>');
    const divider = si < poem.stanzas.length - 1
      ? '<div style="text-align:center; color:rgba(107,158,138,0.4); font-size:18px; margin:30px 0;">&#x273F;</div>'
      : '';
    const lyricHTML = poem.lyrics && poem.lyrics[si] ? `
      <div style="margin-top:16px; margin-bottom: 30px; font-style:italic; font-size:16px; color:#9a8fb0; text-align:right; opacity:0.8;">
        <span style="opacity:0.6;">🎵</span> "${poem.lyrics[si]}"
      </div>
    ` : '';
    const bottomMargin = lyricHTML ? '0' : '20px';
    return `<div style="font-size:20px; line-height:2; color:#e0d8ec; margin-bottom:${bottomMargin};">${content}</div>${lyricHTML}${divider}`;
  }).join('');

  const card = buildPNGCard(`
    <div style="text-align:center; margin-bottom:48px;">
      <div style="font-size:54px; margin-bottom:12px;">${poem.emoji}</div>
      <div style="font-size:32px; font-weight:bold; color:#d4a574; margin-bottom:8px; letter-spacing:1px;">${poem.title}</div>
      <div style="font-style:italic; font-size:15px; color:#9a8fb0; opacity:0.7;">${poem.author} &nbsp;\u00B7&nbsp; ${formatDate(poem.date)}</div>
      <div style="height:1px; background:linear-gradient(90deg,transparent,rgba(139,126,200,0.3),transparent); margin:24px auto; width:70%;"></div>
    </div>
    <div style="padding:0 20px;">
      ${stanzasHTML}
    </div>
    <div style="border-top:1px solid rgba(139,126,200,0.2); padding-top:24px; margin-top:48px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-style:italic; font-size:14px; color:#9a8fb0; opacity:0.8;">&mdash; ${poem.author} &nbsp;\u00B7&nbsp; ${poem.title}</span>
      <span style="font-size:11px; color:rgba(154,143,176,0.3); letter-spacing:0.5px;">roderikusro.github.io/Poem</span>
    </div>
  `, 750);

  html2canvas(card, { scale: 2, backgroundColor: null, logging: false, useCORS: true }).then(canvas => {
    card.remove();
    const link = document.createElement('a');
    link.download = `${poem.title.replace(/\s+/g,'_')}_full.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showActionToast('\uD83D\uDDBC\uFE0F Puisi lengkap berhasil diunduh!');
  }).catch(err => {
    console.error(err);
    card.remove(); 
    showActionToast('❌ Gagal mengunduh gambar.'); 
  });
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
ensureYouTubePlayer();
