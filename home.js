// ===== Home Page Logic =====
const poemListEl = document.getElementById('poemList');
const poemCountEl = document.getElementById('poemCount');
const sortNewBtn = document.getElementById('sortNewBtn');
const sortOldBtn = document.getElementById('sortOldBtn');

let currentSort = 'newest';

function sortPoems(order) {
  currentSort = order;

  // Update button states
  sortNewBtn.classList.toggle('active', order === 'newest');
  sortOldBtn.classList.toggle('active', order === 'oldest');

  renderPoems();
}

function renderPoems() {
  const sorted = [...poems].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  poemCountEl.textContent = `(${sorted.length})`;

  poemListEl.innerHTML = sorted.map((poem, index) => `
    <a href="poem.html?id=${poem.id}" class="poem-list-card" style="animation-delay: ${index * 0.08}s" id="poem-card-${poem.id}">
      <div class="poem-list-card-accent"></div>
      <div class="poem-list-top">
        <span class="poem-list-emoji">${poem.emoji}</span>
        <span class="poem-list-date">📅 ${formatDate(poem.date)}</span>
      </div>
      <h2 class="poem-list-title">${poem.title}</h2>
      <p class="poem-list-author">✍️ ${poem.author}</p>
      <p class="poem-list-excerpt">${poem.excerpt}</p>
      <div class="poem-list-bottom">
        <div class="poem-list-tags">
          ${poem.tags.map(t => `<span class="poem-tag ${t.type}">${t.icon} ${t.label}</span>`).join('')}
        </div>
        <span class="poem-list-read">Baca →</span>
      </div>
    </a>
  `).join('');
}

// Initialize
renderPoems();
