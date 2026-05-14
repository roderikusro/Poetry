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

// ===== Luxurious Smokey Cursor Trail (Desktop Only) =====
const cursorContainer = document.createElement('div');
cursorContainer.id = 'cursor-trail-container';
document.body.appendChild(cursorContainer);

let lastParticleTime = 0;

document.addEventListener('mousemove', (e) => {
  if (window.innerWidth < 1024) return;
  
  const now = Date.now();
  if (now - lastParticleTime < 20) return; // Throttle to maintain performance
  lastParticleTime = now;
  
  const particle = document.createElement('div');
  particle.className = 'smoke-particle';
  
  // Masculine but luxurious colors: Deep Violet, Dark Amber, Slate Blue, Deep Burgundy
  const colors = [
    'rgba(80, 60, 150, 0.5)',   // Deep Violet
    'rgba(180, 110, 60, 0.4)',  // Dark Amber
    'rgba(50, 100, 130, 0.5)',  // Slate Blue
    'rgba(120, 40, 70, 0.4)'    // Deep Burgundy
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  particle.style.background = color;
  particle.style.left = `${e.clientX}px`;
  particle.style.top = `${e.clientY}px`;
  
  // Random drift and size
  const size = 30 + Math.random() * 40;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  
  const driftX = (Math.random() - 0.5) * 60; // Random horizontal drift
  particle.style.setProperty('--drift-x', `${driftX}px`);
  
  cursorContainer.appendChild(particle);
  
  // Remove after animation (1.2s)
  setTimeout(() => {
    particle.remove();
  }, 1200);
});
