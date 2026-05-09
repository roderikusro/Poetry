// ===== Shared Poem & Song Data =====

// Default poems (shipped with the site)
const defaultPoems = [
  {
    id: 1,
    title: "Malam yang Sunyi",
    author: "Anonim",
    emoji: "🌙",
    date: "2025-12-15",
    tags: [{ label: "Mimpi", icon: "✨", type: "dream" }, { label: "Alam", icon: "🌿", type: "nature" }],
    excerpt: "Di malam yang sunyi aku mendengar, bisikan angin yang lembut menyapa...",
    stanzas: [
      "Di malam yang sunyi aku mendengar,\nBisikan angin yang lembut menyapa,\nBintang-bintang berkedip tak henti,\nSeolah bercerita tentang rindu yang terlupa.",
      "Bulan menemani langkah kecilku,\nMenyinari jalan yang penuh bayang,\nDi setiap sudut kesunyian itu,\nAku menemukan kedamaian yang datang."
    ],
    songTitle: "Clair de Lune",
    songArtist: "Debussy",
    youtubeUrl: "https://www.youtube.com/watch?v=CvFH_6DNRCY"
  },
  {
    id: 2,
    title: "Bunga di Pagi Hari",
    author: "Anonim",
    emoji: "🌻",
    date: "2026-01-22",
    tags: [{ label: "Alam", icon: "🌿", type: "nature" }, { label: "Harapan", icon: "🌟", type: "hope" }],
    excerpt: "Embun menetes di kelopak bunga, pagi menyapa dengan senyum hangat...",
    stanzas: [
      "Embun menetes di kelopak bunga,\nPagi menyapa dengan senyum hangat,\nMentari terbit membawa cahaya,\nDunia terasa begitu dekat.",
      "Kumbang kecil terbang riang,\nDari satu bunga ke bunga yang lain,\nSeperti hati yang sedang berpetualang,\nMencari makna di balik hujan."
    ],
    songTitle: "Gymnopédie No.1",
    songArtist: "Erik Satie",
    youtubeUrl: "https://www.youtube.com/watch?v=S-Xm7s9eGxU"
  },
  {
    id: 3,
    title: "Surat Cinta Tak Terkirim",
    author: "Anonim",
    emoji: "💌",
    date: "2026-03-08",
    tags: [{ label: "Cinta", icon: "💕", type: "love" }, { label: "Mimpi", icon: "✨", type: "dream" }],
    excerpt: "Ada kata yang tak pernah terucap, tersimpan rapi di lembar hati...",
    isPrivate: true,
    password: "cinta123",
    stanzas: [
      "Ada kata yang tak pernah terucap,\nTersimpan rapi di lembar hati,\nSeperti surat yang tak pernah sampai,\nTapi selalu ditulis setiap hari.",
      "Jika angin bisa membawa pesan,\nAkan kukirimkan seribu rindu,\nAgar kau tahu di balik keheningan,\nAda cinta yang tumbuh untukmu."
    ],
    songTitle: "Nocturne Op.9 No.2",
    songArtist: "Chopin",
    youtubeUrl: "https://www.youtube.com/watch?v=9E6b3swbnWg"
  },
  {
    id: 4,
    title: "Untuk Shofia",
    author: "Roderikus",
    emoji: "🌧️",
    date: "2026-04-18",
    tags: [{ label: "Alam", icon: "🌿", type: "nature" }, { label: "Mimpi", icon: "✨", type: "dream" }],
    excerpt: "Rintik hujan mengetuk jendela, mengundang kenangan yang lama pergi...",
    stanzas: [
      "Jika ada buku panduan percaya diri tetapi fiksi\nKalimat awal, bagaimana cara bertindak tanpa dipikir?",
      "Kuambil benih yang ada di hati kamu.\nKusimpan dalam lemari kosong.\nKutersirat bisa mengambil jika butuh.",
      "Namun, siapa menyangka seminggu kemudian.\nBenih itu tumbuh di lemari.\nBungannya pink memenuhi lemari.\nBuahnya biru, dengan banyak motif.",
      "Rasa buahnya tidak bisa ditebak\nBisa manis, dan pahit.\nBiji buahnya mirip dengan bentuk mahkota.",
      "Benih yang dianggap aneh itu.\nBuahnya memiliki kemampuan.\nKemampuan untuk pengisi ruang gelap.\nPenyembuh dari luka yang sengaja ditutupi.\nKunamain obat itu \"Shofia\""
    ],
    songTitle: "River Flows in You",
    songArtist: "Yiruma",
    youtubeUrl: "https://www.youtube.com/watch?v=7maJOI3QMu0"
  },
  {
    id: 5,
    title: "Langkah Pertama",
    author: "Anonim",
    emoji: "🦋",
    date: "2026-05-01",
    tags: [{ label: "Harapan", icon: "🌟", type: "hope" }, { label: "Cinta", icon: "💕", type: "love" }],
    excerpt: "Setiap langkah pertama adalah keberanian, setiap jatuh adalah pelajaran...",
    isPrivate: true,
    password: "harapan456",
    stanzas: [
      "Setiap langkah pertama adalah keberanian,\nSetiap jatuh adalah pelajaran berharga,\nSeperti kupu-kupu meninggalkan kepompong,\nKita terlahir kembali dalam keindahan.",
      "Jangan takut pada jalan yang gelap,\nKarena bintang hanya terlihat di malam,\nDan bunga yang paling indah,\nTumbuh dari tanah yang pernah retak.",
      "Langkahmu mungkin kecil dan pelan,\nTapi setiap satu langkah bermakna,\nKarena perjalanan seribu mil,\nDimulai dari satu tekad yang nyata."
    ],
    songTitle: "A Thousand Years",
    songArtist: "Christina Perri",
    youtubeUrl: "https://www.youtube.com/watch?v=rtOvBOTyX00"
  }
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
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
    /^([\w-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ===== Admin Config =====
const ADMIN_PASSWORD = "admin2026";
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
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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
