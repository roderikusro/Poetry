// ===== Spotify-Style Playlist Logic =====
const playlistData = [
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

let currentTrackIndex = -1;
let isShuffled = false;

function initPlaylist() {
  const tracksEl = document.getElementById('playlistTracks');
  const trackCountEl = document.getElementById('playlistTrackCount');
  
  if (!tracksEl) return;
  
  trackCountEl.textContent = `${playlistData.length} lagu`;
  
  tracksEl.innerHTML = playlistData.map((track, i) => `
    <div class="playlist-track" data-index="${i}" id="playlist-track-${i}" onclick="playTrack(${i})">
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

  // Play button on cover
  const playMainBtn = document.getElementById('playlistPlayMain');
  if (playMainBtn) {
    playMainBtn.addEventListener('click', () => playTrack(0));
  }

  // Shuffle button
  const shuffleBtn = document.getElementById('btnShuffle');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      isShuffled = !isShuffled;
      shuffleBtn.classList.toggle('active', isShuffled);
    });
  }
}

function playTrack(index) {
  const track = playlistData[index];
  if (!track) return;
  
  currentTrackIndex = index;
  
  // Update playing state on tracks
  document.querySelectorAll('.playlist-track').forEach((el, i) => {
    el.classList.toggle('playing', i === index);
    const playIcon = el.querySelector('.track-play-icon');
    if (i === index) {
      playIcon.innerHTML = `<div class="track-equalizer"><span></span><span></span><span></span></div>`;
    } else {
      playIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    }
  });
  
  // Update cover image
  const coverImg = document.getElementById('playlistCoverImg');
  if (coverImg) {
    coverImg.src = track.thumb;
  }
  
  // Show player
  const playerEl = document.getElementById('playlistPlayer');
  playerEl.classList.add('active');
  
  // Update player info
  document.getElementById('playerTrackTitle').textContent = track.title;
  document.getElementById('playerTrackArtist').textContent = track.artist;
  
  // Load iframe
  const iframeWrap = document.getElementById('playerIframeWrap');
  iframeWrap.innerHTML = `<iframe 
    src="https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0&modestbranding=1" 
    allow="autoplay; encrypted-media" 
    allowfullscreen
    title="${track.title}"
  ></iframe>`;
  
  // Scroll player into view inside sidebar
  const playlistContainer = document.querySelector('.playlist-sidebar .playlist-container');
  if (playlistContainer) {
    playlistContainer.scrollTo({ top: playlistContainer.scrollHeight, behavior: 'smooth' });
  }
}

// ===== Sidebar Toggle Logic =====
function initSidebar() {
  const sidebar = document.getElementById('playlistSidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const musicIcon = toggleBtn?.querySelector('.sidebar-toggle-music');
  const closeIcon = toggleBtn?.querySelector('.sidebar-toggle-close');

  if (!sidebar || !toggleBtn) return;

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    toggleBtn.classList.add('active');
    if (musicIcon) musicIcon.style.display = 'none';
    if (closeIcon) closeIcon.style.display = 'block';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    toggleBtn.classList.remove('active');
    if (musicIcon) musicIcon.style.display = 'block';
    if (closeIcon) closeIcon.style.display = 'none';
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  toggleBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);
  closeBtn.addEventListener('click', closeSidebar);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });
}

// Initialize playlist + sidebar on load
document.addEventListener('DOMContentLoaded', () => {
  initPlaylist();
  initSidebar();
});

// ===== Home Page Logic =====
const poemListEl = document.getElementById('poemList');
const poemCountEl = document.getElementById('poemCount');
const sortNewBtn = document.getElementById('sortNewBtn');
const sortOldBtn = document.getElementById('sortOldBtn');
const viewListBtn = document.getElementById('viewListBtn');
const viewGridBtn = document.getElementById('viewGridBtn');

let currentSort = 'newest';
let currentView = localStorage.getItem('poem_view') || 'list';

// Apply saved view on load
if (currentView === 'grid') {
  poemListEl.classList.add('poem-grid');
  viewListBtn.classList.remove('active');
  viewGridBtn.classList.add('active');
}

function sortPoems(order) {
  currentSort = order;
  sortNewBtn.classList.toggle('active', order === 'newest');
  sortOldBtn.classList.toggle('active', order === 'oldest');
  renderPoems();
}

function setView(view) {
  currentView = view;
  localStorage.setItem('poem_view', view);

  viewListBtn.classList.toggle('active', view === 'list');
  viewGridBtn.classList.toggle('active', view === 'grid');

  poemListEl.classList.toggle('poem-grid', view === 'grid');
  renderPoems();
}

function renderPoems() {
  const sorted = [...poems].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  poemCountEl.textContent = `(${sorted.length})`;

  if (currentView === 'grid') {
    poemListEl.innerHTML = sorted.map((poem, index) => `
      <a href="poem.html?id=${poem.id}" class="poem-grid-card ${poem.isPrivate ? 'poem-grid-card--private' : ''}" style="animation-delay: ${index * 0.06}s" id="poem-card-${poem.id}">
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
      <a href="poem.html?id=${poem.id}" class="poem-list-card ${poem.isPrivate ? 'poem-list-card--private' : ''}" style="animation-delay: ${index * 0.08}s" id="poem-card-${poem.id}">
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

// Initialize
renderPoems();

// ===== Dynamic Version Display =====
document.addEventListener('DOMContentLoaded', () => {
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


