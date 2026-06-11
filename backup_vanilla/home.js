// ===== Spotify-Style Playlist & SPA Router Logic =====

const originalPlaylistData = [
  {
    id: 'tVj5jUW4LvI',
    title: 'Hindia - Ramai Sepi Bersama',
    artist: 'Hindia',
    thumb: 'https://i.ytimg.com/vi/tVj5jUW4LvI/hqdefault.jpg',
    duration: '4:28'
  },
  {
    id: '0ZWcOXVl8TQ',
    title: 'Officially Missing You - Tamia (Cover)',
    artist: 'CHILL PILL TV',
    thumb: 'https://i.ytimg.com/vi/0ZWcOXVl8TQ/hqdefault.jpg',
    duration: '4:52'
  }
];

const playlistData = [...originalPlaylistData];

let currentTrackIndex = -1;
let isShuffled = false;
let currentPoem = null;

// ===== DOM Elements (assigned on init) =====
let playBtn, songTitleEl, songArtistEl, progressFill, progressBar, currentTimeEl, totalTimeEl, playerArtwork;

// ===== Persistent YouTube Player State =====
let ytPlayer = null;
let isPlaying = false;
let progressInterval = null;
let currentPlayingVideoId = null;

// ===== Sidebar Toggle Logic =====
function initSidebar() {
  const sidebar = document.getElementById('playlistSidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const closeIcon = toggleBtn?.querySelector('.toggle-icon-close');

  if (!sidebar || !toggleBtn) return;

  function openSidebar() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    toggleBtn.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    toggleBtn.classList.remove('active');
    if (closeIcon) closeIcon.style.display = 'none';
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  toggleBtn.onclick = toggleSidebar;
  if (overlay) overlay.onclick = closeSidebar;
  if (closeBtn) closeBtn.onclick = closeSidebar;

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });
}

// Prepend or move current poem song to top of playlist
function setupPlaylistWithPoemSong() {
  playlistData.length = 0;
  playlistData.push(...originalPlaylistData);

  if (currentPoem && currentPoem.youtubeUrl) {
    const videoId = getYouTubeId(currentPoem.youtubeUrl);
    if (videoId) {
      const existsIndex = playlistData.findIndex(track => track.id === videoId);
      if (existsIndex !== -1) {
        // Move existing to top
        const existingTrack = playlistData.splice(existsIndex, 1)[0];
        playlistData.unshift(existingTrack);
      } else {
        // Insert new track
        playlistData.unshift({
          id: videoId,
          title: currentPoem.songTitle || 'Lagu Latar Puisi',
          artist: currentPoem.songArtist || currentPoem.author || 'Anonim',
          thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: '--:--'
        });
      }
    }
  }
}

function initPlaylist() {
  const tracksEl = document.getElementById('playlistTracks');
  const trackCountEl = document.getElementById('playlistTrackCount');
  
  if (!tracksEl) return;
  
  trackCountEl.textContent = `${playlistData.length} lagu`;
  
  tracksEl.innerHTML = playlistData.map((track, i) => `
    <div class="playlist-track" data-index="${i}" id="playlist-track-${i}">
      <span class="track-number">${i + 1}</span>
      <div class="track-play-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>
      <div class="track-thumb">
        <img src="${track.thumb}" alt="${track.title}" loading="lazy">
      </div>
      <div class="track-details">
        <div class="track-title">${track.title}</div>
        <div class="track-artist">${track.artist}</div>
      </div>
      <span class="track-duration">${track.duration}</span>
    </div>
  `).join('');

  // Click handler
  document.querySelectorAll('.playlist-track').forEach(el => {
    el.onclick = () => {
      const idx = parseInt(el.getAttribute('data-index'));
      playTrack(idx);
    };
  });

  // Play button on cover
  const playMainBtn = document.getElementById('playlistPlayMain');
  if (playMainBtn) {
    playMainBtn.onclick = () => playTrack(0);
  }

  // Shuffle button
  const shuffleBtn = document.getElementById('btnShuffle');
  if (shuffleBtn) {
    shuffleBtn.onclick = () => {
      isShuffled = !isShuffled;
      shuffleBtn.classList.toggle('active', isShuffled);
    };
  }
}

function highlightTrackInSidebar(index) {
  const track = playlistData[index];
  if (!track) return;
  
  document.querySelectorAll('.playlist-track').forEach((el, i) => {
    el.classList.toggle('playing', i === index);
    const playIcon = el.querySelector('.track-play-icon');
    if (playIcon) {
      if (i === index) {
        playIcon.innerHTML = `<div class="track-equalizer"><span></span><span></span><span></span></div>`;
      } else {
        playIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      }
    }
  });

  // Update cover
  const coverImg = document.getElementById('playlistCoverImg');
  if (coverImg) {
    coverImg.src = track.thumb;
  }
  
  // Show now playing drawer in sidebar
  const playerEl = document.getElementById('playlistPlayer');
  if (playerEl) {
    playerEl.classList.add('active');
    const tTitle = document.getElementById('playerTrackTitle');
    const tArtist = document.getElementById('playerTrackArtist');
    if (tTitle) tTitle.textContent = track.title;
    if (tArtist) tArtist.textContent = track.artist;
  }
}

function playTrack(index) {
  const track = playlistData[index];
  if (!track) return;
  
  currentTrackIndex = index;
  highlightTrackInSidebar(index);
  
  // Show bottom mini player if it is hidden
  const bottomPlayer = document.getElementById('musicPlayer');
  if (bottomPlayer) {
    bottomPlayer.style.display = '';
  }

  // Update bottom player text
  if (songTitleEl) songTitleEl.textContent = track.title;
  if (songArtistEl) songArtistEl.textContent = track.artist;
  if (playerArtwork) {
    const isDefault = currentPoem && track.id === getYouTubeId(currentPoem.youtubeUrl);
    playerArtwork.textContent = isDefault ? (currentPoem.emoji || '🎵') : '🎵';
  }

  isPlaying = true;
  if (playBtn) playBtn.textContent = '⏸';
  if (playerArtwork) playerArtwork.classList.add('spinning');
  
  currentPlayingVideoId = track.id;
  
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById({
      videoId: track.id,
      startSeconds: 0
    });
  } else {
    createYouTubePlayerWithVideo(track.id);
  }
}

// ===== Persistent YouTube Background Player =====

function createYouTubePlayerWithVideo(videoId) {
  if (!videoId) return;
  currentPlayingVideoId = videoId;

  // Destroy old player
  if (ytPlayer && ytPlayer.destroy) {
    try { ytPlayer.destroy(); } catch(e) {}
    ytPlayer = null;
  }
  
  const container = document.getElementById('ytContainer');
  if (container) {
    container.innerHTML = '<div id="ytPlayer"></div>';
  }

  ytPlayer = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    videoId: videoId,
    host: 'https://www.youtube-nocookie.com',
    playerVars: {
      autoplay: 1,
      controls: 0,
      loop: 1,
      playlist: videoId,
      playsinline: 1,
      origin: window.location.origin
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onYouTubeIframeAPIReady() {
  // Player is created on demand when first song is played
}

function onPlayerReady() {
  if (ytPlayer && ytPlayer.getDuration && totalTimeEl) {
    totalTimeEl.textContent = fmtTime(ytPlayer.getDuration());
  }
}

function onPlayerStateChange(event) {
  const playState = (event.data === YT.PlayerState.PLAYING) ? 'running' : 'paused';
  
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    if (playBtn) playBtn.textContent = '⏸';
    if (playerArtwork) playerArtwork.classList.add('spinning');
    startProgressUpdate();
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    if (playBtn) playBtn.textContent = '▶';
    if (playerArtwork) playerArtwork.classList.remove('spinning');
    stopProgressUpdate();
  }
  
  // Sync equalizer states
  document.querySelectorAll('.playlist-track.playing .track-equalizer span').forEach(span => span.style.animationPlayState = playState);
  document.querySelectorAll('#playerEqualizer span').forEach(span => span.style.animationPlayState = playState);
  document.querySelectorAll('.sidebar-toggle .toggle-eq span').forEach(span => span.style.animationPlayState = playState);
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
      if (progressFill) progressFill.style.width = (current / total * 100) + '%';
      if (currentTimeEl) currentTimeEl.textContent = fmtTime(current);
      if (totalTimeEl) totalTimeEl.textContent = fmtTime(total);
      
      // Lyric Sync Highlight
      const isDefaultSongPlaying = currentPoem && (playlistData[currentTrackIndex]?.id === getYouTubeId(currentPoem.youtubeUrl));
      if (isDefaultSongPlaying && currentPoem && currentPoem.timestamps && currentPoem.timestamps.length > 0) {
        let activeIdx = 0;
        for (let i = currentPoem.timestamps.length - 1; i >= 0; i--) {
          if (current >= currentPoem.timestamps[i] - 0.5) {
            activeIdx = i;
            break;
          }
        }
        document.querySelectorAll('.lyric-snippet').forEach((el) => {
          const idx = parseInt(el.id.split('-')[2]);
          el.classList.toggle('active', idx === activeIdx);
        });
      } else {
        document.querySelectorAll('.lyric-snippet').forEach((el) => {
          el.classList.remove('active');
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

// Seek on bottom progress bar click
function initProgressBarSeek() {
  if (progressBar) {
    progressBar.onclick = (e) => {
      if (!ytPlayer || !ytPlayer.seekTo) return;
      const pct = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
      const seekTo = pct * ytPlayer.getDuration();
      ytPlayer.seekTo(seekTo, true);
    };
  }
}

// ===== Home Page Logic (Poem List Rendering & Filtering) =====

const poemListEl = document.getElementById('poemList');
const poemCountEl = document.getElementById('poemCount');
const sortNewBtn = document.getElementById('sortNewBtn');
const sortOldBtn = document.getElementById('sortOldBtn');
const viewListBtn = document.getElementById('viewListBtn');
const viewGridBtn = document.getElementById('viewGridBtn');

let currentSort = 'newest';
let currentView = localStorage.getItem('poem_view') || 'list';

function sortPoems(order) {
  currentSort = order;
  if (sortNewBtn) sortNewBtn.classList.toggle('active', order === 'newest');
  if (sortOldBtn) sortOldBtn.classList.toggle('active', order === 'oldest');
  renderPoems();
}

function setView(view) {
  currentView = view;
  localStorage.setItem('poem_view', view);

  if (viewListBtn) viewListBtn.classList.toggle('active', view === 'list');
  if (viewGridBtn) viewGridBtn.classList.toggle('active', view === 'grid');

  if (poemListEl) poemListEl.classList.toggle('poem-grid', view === 'grid');
  renderPoems();
}

function renderPoems() {
  if (!poemListEl) return;

  const sorted = [...poems].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (poemCountEl) poemCountEl.textContent = `(${sorted.length})`;

  if (currentView === 'grid') {
    poemListEl.innerHTML = sorted.map((poem, index) => `
      <a href="?id=${poem.id}" class="poem-grid-card ${poem.isPrivate ? 'poem-grid-card--private' : ''}" style="animation-delay: ${index * 0.06}s" id="poem-card-${poem.id}">
        <div class="poem-grid-card-accent"></div>
        <div class="poem-grid-emoji">${poem.emoji}</div>
        <h2 class="poem-grid-title">${poem.title}</h2>
        <p class="poem-grid-author">✍️ ${poem.author}</p>
        <p class="poem-grid-excerpt ${poem.isPrivate ? 'poem-grid-excerpt--blurred' : ''}">${poem.isPrivate ? '🔒 Puisi ini dilindungi kata sandi...' : poem.excerpt}</p>
        <div class="poem-grid-footer">
          <span class="poem-grid-date">${formatDate(poem.date)}</span>
          ${poem.isPrivate ? '<span class="poem-grid-lock">🔒</span>' : '<span class="poem-grid-read">→</span>'}
        </div>
      </a>
    `).join('');
  } else {
    poemListEl.innerHTML = sorted.map((poem, index) => `
      <a href="?id=${poem.id}" class="poem-list-card ${poem.isPrivate ? 'poem-list-card--private' : ''}" style="animation-delay: ${index * 0.08}s" id="poem-card-${poem.id}">
        <div class="poem-list-card-accent"></div>
        <div class="poem-list-top">
          <span class="poem-list-emoji">${poem.emoji}</span>
          <div class="poem-list-top-right">
            ${poem.isPrivate ? '<span class="private-badge">🔒 Pribadi</span>' : ''}
            <span class="poem-list-date">📅 ${formatDate(poem.date)}</span>
          </div>
        </div>
        <h2 class="poem-list-title">${poem.title}</h2>
        <p class="poem-list-author">✍️ ${poem.author}</p>
        <p class="poem-list-excerpt ${poem.isPrivate ? 'poem-list-excerpt--blurred' : ''}">${poem.isPrivate ? '🔒 Puisi ini dilindungi kata sandi...' : poem.excerpt}</p>
        <div class="poem-list-bottom">
          <div class="poem-list-tags">
            ${poem.tags.map(t => `<span class="poem-tag ${t.type}">${t.icon} ${t.label}</span>`).join('')}
          </div>
          <span class="poem-list-read">${poem.isPrivate ? '🔑 Buka →' : 'Baca →'}</span>
        </div>
      </a>
    `).join('');
  }
}

// ===== Poem Detail View Render =====

function renderPoemDetail(poemObj) {
  currentPoem = poemObj;
  
  // Page Title
  document.title = `🪶 ${currentPoem.title} — Taman Puisi`;

  // Render Header
  const headerEl = document.getElementById('poemHeader');
  if (headerEl) {
    headerEl.innerHTML = `
      ${currentPoem.isPrivate ? '<div class="poem-private-badge">🔒 Puisi Pribadi</div>' : ''}
      <div class="poem-page-emoji">${currentPoem.emoji}</div>
      <h1 class="poem-page-title">${currentPoem.title}</h1>
      <div class="poem-page-meta">
        <span class="poem-page-author">✍️ ${currentPoem.author}</span>
        <span class="poem-page-date">📅 ${formatDate(currentPoem.date)}</span>
      </div>
      <div class="poem-page-tags">
        ${currentPoem.tags.map(t => `<span class="poem-tag ${t.type}">${t.icon} ${t.label}</span>`).join('')}
      </div>
    `;
  }

  // Render Body
  const bodyEl = document.getElementById('poemBody');
  if (bodyEl) {
    bodyEl.className = 'poem-page-body'; // Reset classes
    if (currentPoem.isPrivate) {
      // Locked content rendering (inspect proof)
      const placeholderHTML = currentPoem.stanzas.map(() => `
        <div class="poem-stanza-wrapper">
          <div class="poem-stanza poem-stanza-locked">
            <span class="locked-line"></span>
            <span class="locked-line"></span>
            <span class="locked-line"></span>
            <span class="locked-line short"></span>
          </div>
        </div>`).join('<div class="stanza-divider">✿</div>');

      bodyEl.innerHTML = placeholderHTML;
      bodyEl.classList.add('poem-body-blurred', 'poem-locked-overlay');

      const banner = document.createElement('div');
      banner.className = 'poem-lock-banner';
      banner.id = 'lockBanner';
      banner.innerHTML = `
        <div class="lock-icon-big">🔐</div>
        <div class="lock-title">Puisi Pribadi</div>
        <p class="lock-hint">Masukkan kata sandi untuk membuka puisi ini</p>
        <div class="password-row">
          <input type="password" class="password-input" id="passwordInput"
            placeholder="Kata sandi...">
          <button class="unlock-btn" id="unlockBtn">🔑 Buka</button>
        </div>
        <div class="unlock-error" id="unlockError"></div>
      `;
      bodyEl.appendChild(banner);
      
      const pwdInput = document.getElementById('passwordInput');
      const unlockBtn = document.getElementById('unlockBtn');
      if (pwdInput) {
        pwdInput.onkeydown = (e) => { if (e.key === 'Enter') tryUnlock(); };
      }
      if (unlockBtn) {
        unlockBtn.onclick = tryUnlock;
      }

      // Hide bottom player and sidebar playlist settings for private poems
      const botPlayer = document.getElementById('musicPlayer');
      if (botPlayer) botPlayer.style.display = 'none';
    } else {
      renderPublicStanzas();
      initPoemAudio();
    }
  }

  // Render Footer Actions & Prev/Next Links
  const footerEl = document.getElementById('poemFooter');
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="poem-footer-actions">
        <button class="download-full-btn ${currentPoem.isPrivate ? 'btn-hidden' : ''}" id="downloadFullBtn">
          <span>🖼️</span>
          <span>Unduh Puisi</span>
        </button>
      </div>
      <div class="poem-nav-links">
        ${getPrevPoem() ? `<a href="?id=${getPrevPoem().id}" class="poem-nav-link prev-link">← ${getPrevPoem().title}</a>` : '<span></span>'}
        ${getNextPoem() ? `<a href="?id=${getNextPoem().id}" class="poem-nav-link next-link">${getNextPoem().title} →</a>` : '<span></span>'}
      </div>
    `;
    
    const dlBtn = document.getElementById('downloadFullBtn');
    if (dlBtn) {
      dlBtn.onclick = downloadFullPoemPNG;
    }
  }

  initStanzaTapToggle();
}

function renderPublicStanzas() {
  const bodyEl = document.getElementById('poemBody');
  if (!bodyEl) return;
  
  const stanzasHTML = currentPoem.stanzas.map((stanza, i) => {
    const isHTML = /<[a-z][\s\S]*>/i.test(stanza);
    const content = isHTML ? stanza : stanza.replace(/\n/g, '<br>');
    const alignStyle = isHTML ? '' : 'style="text-align: center;"';
    return `
      <div class="poem-stanza-wrapper" id="stanza-wrapper-${i}">
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
        ${currentPoem.lyrics && currentPoem.lyrics[i] ? `
        <div class="lyric-snippet" id="lyric-snippet-${i}" onclick="syncStanza(${i}); event.stopPropagation();">
          <span class="lyric-icon">🎵</span> "${currentPoem.lyrics[i]}"
        </div>` : ''}
      </div>`;
  }).join('<div class="stanza-divider"><span>✦</span></div>');

  bodyEl.innerHTML = stanzasHTML;
}

function initPoemAudio() {
  setupPlaylistWithPoemSong();
  initPlaylist();

  const videoId = getYouTubeId(currentPoem.youtubeUrl);
  if (!videoId) {
    // Hide bottom player if poem has no default song
    const botPlayer = document.getElementById('musicPlayer');
    if (botPlayer) botPlayer.style.display = 'none';
    return;
  }

  // Display bottom player bar
  const botPlayer = document.getElementById('musicPlayer');
  if (botPlayer) botPlayer.style.display = '';
  if (songTitleEl) songTitleEl.textContent = currentPoem.songTitle || 'Lagu Latar';
  if (songArtistEl) songArtistEl.textContent = currentPoem.songArtist || 'YouTube';
  if (playerArtwork) playerArtwork.textContent = currentPoem.emoji || '🎵';

  // Highlight track 0 in sidebar
  currentTrackIndex = 0;
  highlightTrackInSidebar(0);

  // Play automatically if not already playing this video
  if (currentPlayingVideoId !== videoId) {
    playTrack(0);
  }
}

// Private Poem Unlocking
function tryUnlock() {
  const input = document.getElementById('passwordInput');
  const errorEl = document.getElementById('unlockError');
  const entered = input ? input.value.trim() : '';

  if (entered === currentPoem.password) {
    const banner = document.getElementById('lockBanner');
    if (banner) {
      banner.classList.add('hidden');
      setTimeout(() => banner.remove(), 500);
    }
    showUnlockToast();

    const body = document.getElementById('poemBody');
    if (body) {
      body.classList.remove('poem-body-blurred', 'poem-locked-overlay');
      body.classList.add('unlocked');
    }
    
    renderPublicStanzas();
    initPoemAudio();
    initStanzaTapToggle();

    // Reveal download full poem button
    const dlBtn = document.getElementById('downloadFullBtn');
    if (dlBtn) {
      dlBtn.classList.remove('btn-hidden');
      dlBtn.classList.add('btn-revealed');
    }
  } else {
    if (input) {
      input.classList.remove('error');
      void input.offsetWidth; // trigger reflow
      input.classList.add('error');
      input.value = '';
      input.focus();
    }
    if (errorEl) {
      errorEl.textContent = '❌ Kata sandi salah. Coba lagi!';
      setTimeout(() => {
        if (input) input.classList.remove('error');
        errorEl.textContent = '';
      }, 2000);
    }
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
  if (!currentPoem) return null;
  const sorted = [...poems].sort((a, b) => new Date(b.date) - new Date(a.date));
  const idx = sorted.findIndex(p => p.id === currentPoem.id);
  return idx < sorted.length - 1 ? sorted[idx + 1] : null;
}

function getNextPoem() {
  if (!currentPoem) return null;
  const sorted = [...poems].sort((a, b) => new Date(b.date) - new Date(a.date));
  const idx = sorted.findIndex(p => p.id === currentPoem.id);
  return idx > 0 ? sorted[idx - 1] : null;
}

// Tap stanza wrapper triggers for mobile
function initStanzaTapToggle() {
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
  if (!isMobile()) return;

  document.querySelectorAll('.poem-stanza-wrapper').forEach(wrapper => {
    wrapper.onclick = (e) => {
      if (e.target.closest('.stanza-btn')) return;
      const wasActive = wrapper.classList.contains('active');
      document.querySelectorAll('.poem-stanza-wrapper').forEach(w => w.classList.remove('active'));
      if (!wasActive) wrapper.classList.add('active');
    };
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.poem-stanza-wrapper')) {
      document.querySelectorAll('.poem-stanza-wrapper').forEach(w => w.classList.remove('active'));
    }
  });
}

// Sync Click Lyric timestamp seek
function syncStanza(idx) {
  if (!currentPoem || !currentPoem.timestamps || currentPoem.timestamps.length === 0 || !ytPlayer || !ytPlayer.seekTo) return;
  const targetTime = currentPoem.timestamps[idx] || 0;
  ytPlayer.seekTo(targetTime, true);
  if (!isPlaying) {
    ytPlayer.playVideo();
  }
}

// Copy Stanza to clipboard
function copyStanza(idx) {
  if (!currentPoem) return;
  const text = currentPoem.stanzas[idx];
  const credit = `\n\n— ${currentPoem.author}, "${currentPoem.title}"`;
  navigator.clipboard.writeText(text + credit).then(() => {
    showActionToast('📋 Kutipan disalin!');
  }).catch(() => {
    // fallback copy
    const ta = document.createElement('textarea');
    ta.value = text + credit;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showActionToast('📋 Kutipan disalin!');
  });
}

// PNG export builders
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

function getHtmlAlignment(html) {
  if (html.includes('text-align: center') || html.includes('align="center"')) return 'center';
  if (html.includes('text-align: right') || html.includes('align="right"')) return 'right';
  return 'left';
}

function downloadStanzaPNG(idx) {
  if (!currentPoem) return;
  if (typeof html2canvas === 'undefined') {
    showActionToast('⚠️ Modul gambar belum siap, coba lagi.');
    return;
  }
  const stanza = currentPoem.stanzas[idx];
  const isHTML = /<[a-z][\s\S]*>/i.test(stanza);
  const content = isHTML ? stanza : stanza.replace(/\n/g, '<br>');
  const align = getHtmlAlignment(content);

  const borderStyle = align === 'left' ? 'border-left:4px solid #d4a574; padding-left:24px;' : '';
  const quoteAlign = align === 'center' ? 'text-align:center' : (align === 'right' ? 'text-align:right' : 'text-align:left');

  const card = buildPNGCard(`
    <div style="margin-bottom:20px; ${borderStyle}">
      <div style="${quoteAlign}; font-size:54px; opacity:.15; font-family:serif; line-height:0.5; margin-bottom:10px;">\u201C</div>
      <div style="font-size:22px; line-height:1.9; color:#e0d8ec; font-family:inherit;">${content}</div>
      <div style="text-align:${align === 'left' ? 'right' : (align === 'right' ? 'left' : 'center')}; font-size:54px; opacity:.15; font-family:serif; line-height:0.5; margin-top:10px;">\u201D</div>
    </div>
    <div style="margin-top:30px;"></div>
    <div style="border-top:1px solid rgba(139,126,200,0.2); padding-top:20px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-style:italic; font-size:14px; color:#9a8fb0; opacity:0.8;">&mdash; ${currentPoem.author} &nbsp;\u00B7&nbsp; ${currentPoem.title}</span>
      <span style="font-size:11px; color:rgba(154,143,176,0.3); letter-spacing:0.5px;">roderikusro.github.io/Poem</span>
    </div>
  `, 700);

  html2canvas(card, { scale: 2, backgroundColor: null, logging: false, useCORS: true }).then(canvas => {
    card.remove();
    const link = document.createElement('a');
    link.download = `${currentPoem.title.replace(/\s+/g,'_')}_bait_${idx+1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showActionToast('🖼️ Gambar berhasil diunduh!');
  }).catch(err => {
    console.error(err);
    card.remove();
    showActionToast('❌ Gagal mengunduh gambar.');
  });
}

function downloadFullPoemPNG() {
  if (!currentPoem) return;
  if (typeof html2canvas === 'undefined') {
    showActionToast('⚠️ Modul gambar belum siap, coba lagi.');
    return;
  }

  const stanzasHTML = currentPoem.stanzas.map((stanza, si) => {
    const isHTML = /<[a-z][\s\S]*>/i.test(stanza);
    const content = isHTML ? stanza : stanza.replace(/\n/g, '<br>');
    const divider = si < currentPoem.stanzas.length - 1
      ? '<div style="text-align:center; color:rgba(107,158,138,0.4); font-size:18px; margin:30px 0;">&#x273F;</div>'
      : '';
    return `<div style="font-size:20px; line-height:2; color:#e0d8ec; margin-bottom:20px;">${content}</div>${divider}`;
  }).join('');

  const card = buildPNGCard(`
    <div style="text-align:center; margin-bottom:48px;">
      <div style="font-size:54px; margin-bottom:12px;">${currentPoem.emoji}</div>
      <div style="font-size:32px; font-weight:bold; color:#d4a574; margin-bottom:8px; letter-spacing:1px;">${currentPoem.title}</div>
      <div style="font-style:italic; font-size:15px; color:#9a8fb0; opacity:0.7;">${currentPoem.author} &nbsp;\u00B7&nbsp; ${formatDate(currentPoem.date)}</div>
      <div style="height:1px; background:linear-gradient(90deg,transparent,rgba(139,126,200,0.3),transparent); margin:24px auto; width:70%;"></div>
    </div>
    <div style="padding:0 20px;">
      ${stanzasHTML}
    </div>
    <div style="border-top:1px solid rgba(139,126,200,0.2); padding-top:24px; margin-top:48px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-style:italic; font-size:14px; color:#9a8fb0; opacity:0.8;">&mdash; ${currentPoem.author} &nbsp;\u00B7&nbsp; ${currentPoem.title}</span>
      <span style="font-size:11px; color:rgba(154,143,176,0.3); letter-spacing:0.5px;">roderikusro.github.io/Poem</span>
    </div>
  `, 750);

  html2canvas(card, { scale: 2, backgroundColor: null, logging: false, useCORS: true }).then(canvas => {
    card.remove();
    const link = document.createElement('a');
    link.download = `${currentPoem.title.replace(/\s+/g,'_')}_full.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showActionToast('🖼️ Puisi lengkap berhasil diunduh!');
  }).catch(err => {
    console.error(err);
    card.remove();
    showActionToast('❌ Gagal mengunduh gambar.');
  });
}

function showActionToast(msg) {
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

// ===== SPA Client Routing =====

function router() {
  const urlParams = new URLSearchParams(window.location.search);
  const poemId = urlParams.get('id');
  
  const homeEl = document.getElementById('homePageContent');
  const poemEl = document.getElementById('poemPageContent');
  
  if (poemId) {
    const poem = getPoemById(poemId);
    if (poem) {
      if (homeEl) homeEl.style.display = 'none';
      if (poemEl) poemEl.style.display = 'block';
      renderPoemDetail(poem);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
  }
  
  // Default homepage
  currentPoem = null;
  if (poemEl) poemEl.style.display = 'none';
  if (homeEl) homeEl.style.display = 'block';
  
  renderPoems();
}

function navigateToPoem(poemId) {
  const rootPath = window.location.pathname.replace('poem.html', '').replace('index.html', '');
  const targetUrl = rootPath + '?id=' + poemId;
  history.pushState(null, '', targetUrl);
  router();
}

function navigateToHome() {
  const rootPath = window.location.pathname.replace('poem.html', '').replace('index.html', '');
  history.pushState(null, '', rootPath || './');
  router();
}

// Intercept all layout link clicks for SPA routing
function initLinkInterceptors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    
    // Ignore middle-clicks, right-clicks, or modifier keys
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const href = a.getAttribute('href');
    if (!href) return;
    
    // Ignore external links
    if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
      return;
    }
    
    try {
      const url = new URL(a.href);
      const poemId = url.searchParams.get('id');
      
      if (poemId) {
        e.preventDefault();
        navigateToPoem(poemId);
      } else if (url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
        // Let admin navigation bubble normally
        if (window.location.pathname.includes('admin.html')) return;
        
        e.preventDefault();
        navigateToHome();
      }
    } catch (err) {
      console.error('Routing error:', err);
    }
  });
}

// ===== Application Initialization =====

document.addEventListener('DOMContentLoaded', () => {
  // Query bottom mini player elements
  playBtn = document.getElementById('playBtn');
  songTitleEl = document.getElementById('songTitle');
  songArtistEl = document.getElementById('songArtist');
  progressFill = document.getElementById('progressFill');
  progressBar = document.getElementById('progressBar');
  currentTimeEl = document.getElementById('currentTime');
  totalTimeEl = document.getElementById('totalTime');
  playerArtwork = document.getElementById('playerArtwork');

  // Initialize features
  initSidebar();
  setupPlaylistWithPoemSong();
  initPlaylist();
  initProgressBarSeek();
  initLinkInterceptors();
  initGallery();

  // Load correct page on start
  router();
  
  // Setup popstate back/forward listener
  window.addEventListener('popstate', router);

  // Dynamic version number logic
  const scripts = document.getElementsByTagName('script');
  let currentVersion = 'v1.0.0';
  for (let script of scripts) {
    if (script.src.includes('home.js?v=')) {
      currentVersion = 'v' + script.src.split('?v=')[1];
      break;
    }
  }
  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    versionEl.textContent = currentVersion;
  }
});

// ===== Gallery Collage Sidebar =====

const galleryPhotos = [];
for (let i = 4639; i <= 4762; i++) {
  if (i === 4742 || i === 4749 || i === 4750) continue;
  galleryPhotos.push(`Aset/MMJ0${i}.jpg`);
}

const GALLERY_BATCH_SIZE = 8;
let galleryLoadedCount = 0;
let galleryShuffled = [];
let galleryInitialized = false;
let lightboxCurrentIndex = -1;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initGallery() {
  const sidebar = document.getElementById('gallerySidebar');
  const toggleBtn = document.getElementById('galleryToggle');
  const overlay = document.getElementById('galleryOverlay');
  const closeBtn = document.getElementById('galleryCloseBtn');
  const closeIcon = toggleBtn?.querySelector('.toggle-icon-close-gallery');

  if (!sidebar || !toggleBtn) return;

  function openGallery() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    toggleBtn.classList.add('active');
    if (closeIcon) closeIcon.style.display = 'block';

    // Deferred rendering: only build photos on first open
    if (!galleryInitialized) {
      galleryShuffled = shuffleArray(galleryPhotos);
      galleryLoadedCount = 0;
      loadMorePhotos();
      galleryInitialized = true;
    }
  }

  function closeGallery() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    toggleBtn.classList.remove('active');
    if (closeIcon) closeIcon.style.display = 'none';
  }

  function toggleGallery() {
    if (sidebar.classList.contains('open')) {
      closeGallery();
    } else {
      openGallery();
    }
  }

  toggleBtn.onclick = toggleGallery;
  if (overlay) overlay.onclick = closeGallery;
  if (closeBtn) closeBtn.onclick = closeGallery;

  // Load More button
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.onclick = () => loadMorePhotos();
  }

  // Download Collage button
  const downloadCollageBtn = document.getElementById('downloadCollageBtn');
  if (downloadCollageBtn) {
    downloadCollageBtn.onclick = () => downloadCollagePNG();
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('galleryLightbox')?.classList.contains('active')) {
        closeLightbox();
      } else if (sidebar.classList.contains('open')) {
        closeGallery();
      }
    }
  });

  // Lightbox controls
  const lightboxCloseBtn = document.getElementById('lightboxClose');
  const lightboxPrevBtn = document.getElementById('lightboxPrev');
  const lightboxNextBtn = document.getElementById('lightboxNext');
  const lightboxBackdrop = document.querySelector('.lightbox-backdrop');

  if (lightboxCloseBtn) lightboxCloseBtn.onclick = closeLightbox;
  if (lightboxBackdrop) lightboxBackdrop.onclick = closeLightbox;
  if (lightboxPrevBtn) lightboxPrevBtn.onclick = () => navigateLightbox(-1);
  if (lightboxNextBtn) lightboxNextBtn.onclick = () => navigateLightbox(1);

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('galleryLightbox');
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
}

function loadMorePhotos() {
  const container = document.getElementById('collageMessy');
  const counterEl = document.getElementById('galleryCounter');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!container) return;

  const sizes = ['size-small', 'size-medium', 'size-large'];
  const decorations = ['', 'has-tape', 'has-pin'];
  const end = Math.min(galleryLoadedCount + GALLERY_BATCH_SIZE, galleryShuffled.length);

  for (let i = galleryLoadedCount; i < end; i++) {
    const photo = galleryShuffled[i];
    const rotation = (Math.random() * 24 - 12).toFixed(1);
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const deco = decorations[Math.floor(Math.random() * decorations.length)];
    const marginTop = Math.floor(Math.random() * 16 - 8);
    const delay = (i - galleryLoadedCount) * 0.07;

    const item = document.createElement('div');
    item.className = `collage-item ${size} ${deco}`;
    item.style.transform = `rotate(${rotation}deg)`;
    item.style.marginTop = `${marginTop}px`;
    item.style.animationDelay = `${delay}s`;
    item.dataset.index = i;

    const img = document.createElement('img');
    img.src = photo;
    img.alt = `Kenangan ${i + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';

    item.appendChild(img);
    item.onclick = () => openLightbox(parseInt(item.dataset.index));
    container.appendChild(item);
  }

  galleryLoadedCount = end;

  // Update counter
  if (counterEl) {
    counterEl.textContent = `${galleryLoadedCount} dari ${galleryShuffled.length} foto`;
  }

  // Hide load more if all loaded
  if (galleryLoadedCount >= galleryShuffled.length) {
    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
  }
}

function openLightbox(index) {
  const lightbox = document.getElementById('galleryLightbox');
  const img = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  if (!lightbox || !img) return;

  lightboxCurrentIndex = index;
  img.src = galleryShuffled[index];
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (counter) {
    counter.textContent = `${index + 1} / ${galleryShuffled.length}`;
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  lightboxCurrentIndex = -1;
}

function navigateLightbox(direction) {
  lightboxCurrentIndex = newIndex;
  const img = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');

  if (img) {
    img.style.animation = 'none';
    img.offsetHeight; // trigger reflow
    img.style.animation = '';
    img.src = galleryShuffled[newIndex];
  }
  if (counter) {
    counter.textContent = `${newIndex + 1} / ${galleryShuffled.length}`;
  }
}

function downloadCollagePNG() {
  if (typeof html2canvas === 'undefined') {
    showActionToast('⚠️ Modul gambar belum siap, coba lagi.');
    return;
  }
  
  if (!galleryPhotos || galleryPhotos.length === 0) {
    showActionToast('⚠️ Gambar belum dimuat.');
    return;
  }

  // Pilih 9 gambar secara acak setiap kali diunduh
  const imagesToDownload = [];
  const photosCopy = [...galleryPhotos];
  for (let i = 0; i < 9; i++) {
    if (photosCopy.length === 0) break;
    const rIdx = Math.floor(Math.random() * photosCopy.length);
    imagesToDownload.push(photosCopy[rIdx]);
    photosCopy.splice(rIdx, 1);
  }
  
  const collageContainer = document.createElement('div');
  collageContainer.className = 'collage-export-wrapper';
  collageContainer.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 1080px;
    height: 1350px;
    background: url('BG_kolase.webp') center/cover no-repeat;
    box-sizing: border-box;
    border-radius: 16px;
    border: 16px solid #13101e;
    overflow: hidden;
    box-shadow: inset 0 0 100px rgba(0,0,0,0.6);
  `;
  
  const decorations = ['', 'has-tape', 'has-pin'];

  imagesToDownload.forEach((src, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    
    const cellWidth = 1080 / 3;
    const cellHeight = 1350 / 3;
    
    const baseX = col * cellWidth + cellWidth / 2;
    const baseY = row * cellHeight + cellHeight / 2;
    
    const jitterX = (Math.random() - 0.5) * 150;
    const jitterY = (Math.random() - 0.5) * 150;
    
    const finalX = baseX + jitterX;
    const finalY = baseY + jitterY;
    
    const rotation = (Math.random() * 50 - 25).toFixed(1);
    
    const imgWidth = Math.floor(Math.random() * 150 + 250); 
    
    const zIndex = Math.floor(Math.random() * 30) + 1;

    const deco = decorations[Math.floor(Math.random() * decorations.length)];

    const item = document.createElement('div');
    item.className = `collage-item ${deco}`;
    item.style.cssText = `
      position: absolute;
      left: ${finalX}px;
      top: ${finalY}px;
      width: ${imgWidth}px;
      transform: translate(-50%, -50%) rotate(${rotation}deg);
      background: #f8f5f2;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 2px;
      padding: 8px 8px 32px 8px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3);
      z-index: ${zIndex};
      opacity: 1;
      transition: none;
      animation: none;
    `;

    const img = document.createElement('img');
    img.src = src;
    img.crossOrigin = "Anonymous";
    img.style.cssText = `
      width: 100%;
      height: auto;
      display: block;
      border-radius: 2px;
      object-fit: cover;
    `;
    item.appendChild(img);
    collageContainer.appendChild(item);
  });
  
  const watermark = document.createElement('div');
  watermark.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 20px;
    color: rgba(255, 255, 255, 0.25);
    font-family: 'Quicksand', sans-serif;
    font-size: 15px;
    z-index: 100;
    letter-spacing: 2px;
  `;
  watermark.textContent = "roderikusro.github.io/Poetry";
  collageContainer.appendChild(watermark);

  document.body.appendChild(collageContainer);
  
  showActionToast('⏳ Menyiapkan kolase...');
  
  const promises = Array.from(collageContainer.querySelectorAll('img')).map(img => {
    return new Promise(resolve => {
      if (img.complete) resolve();
      else {
        img.onload = resolve;
        img.onerror = resolve;
      }
    });
  });

  Promise.all(promises).then(() => {
    setTimeout(() => {
      html2canvas(collageContainer, { 
        scale: 2, 
        backgroundColor: null, 
        useCORS: true, 
        logging: false 
      }).then(canvas => {
        collageContainer.remove();
        const link = document.createElement('a');
        link.download = 'Kolase_Kenangan.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showActionToast('🖼️ Kolase berhasil diunduh!');
      }).catch(err => {
        console.error(err);
        collageContainer.remove();
        showActionToast('❌ Gagal mengunduh kolase.');
      });
    }, 500);
  });
}

// ===== AI Copilot (Homepage) =====
function toggleCopilotWidget() {
  const panel = document.getElementById('copilotPanel');
  if (panel) {
    panel.classList.toggle('open');
  }
}

async function homeGeneratePoem() {
  const promptInput = document.getElementById('homeCopilotPrompt').value.trim();
  const modelSelect = document.getElementById('homeCopilotModel').value;
  const statusEl = document.getElementById('homeCopilotStatus');
  const btnEl = document.getElementById('homeCopilotBtn');

  if (!promptInput) {
    statusEl.textContent = '⚠️ Masukkan topik untuk AI.';
    statusEl.style.color = '#ff6b6b';
    return;
  }

  try {
    statusEl.textContent = '⏳ AI sedang merangkai puisi...';
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
    reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const poemData = JSON.parse(reply);

    // Create complete poem object
    const newPoem = {
      id: poems.length > 0 ? Math.max(...poems.map(p => p.id)) + 1 : 1,
      title: poemData.judul || 'Puisi AI',
      author: 'AI Copilot',
      emoji: '✨',
      date: new Date().toISOString().split('T')[0],
      tags: [{ label: "Harapan", icon: "🌟", type: "hope" }],
      excerpt: (poemData.bait && poemData.bait[0]) ? poemData.bait[0].replace(/<[^>]*>?/gm, ' ').substring(0, 80) + '...' : 'Puisi yang digenerate AI...',
      stanzas: poemData.bait || ['Format puisi tidak dikenali.'],
      lyrics: [],
      timestamps: [],
      youtubeUrl: '',
      songTitle: '',
      songArtist: '',
      isPrivate: false
    };

    // Save
    poems.unshift(newPoem);
    savePoems(poems); // update localstorage

    // Refresh UI
    sortPoems('newest');

    statusEl.textContent = '✨ Puisi berhasil dibuat dan ditambahkan ke daftar!';
    statusEl.style.color = 'var(--text-accent)';
    
    // Clear inputs
    document.getElementById('homeCopilotPrompt').value = '';

  } catch (error) {
    console.error("Copilot Error:", error);
    statusEl.textContent = '❌ Gagal: ' + error.message;
    statusEl.style.color = '#ff6b6b';
  } finally {
    btnEl.disabled = false;
    btnEl.innerHTML = '✨ Generate & Tambahkan ke Daftar';
  }
}

