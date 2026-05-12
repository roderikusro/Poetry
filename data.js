// ===== Shared Poem & Song Data =====

// Default poems (shipped with the site)
const defaultPoems = [
  {
    id: 1,
    title: "Amsal 31-10",
    author: "Roderikus",
    emoji: "🌙",
    date: "2024-11-05",
    tags: [{ label: "Mimpi", icon: "✨", type: "dream" }, { label: "Alam", icon: "🌿", type: "nature" }],
    excerpt: "Di malam yang sunyi aku mendengar, bisikan angin yang lembut menyapa...",
    stanzas: [
      "Di atas altar, di bawah basilika santo petrus, \ndi belakang tubuh kristus, di sampingku perempuan ini. \nMengenakan mantilla putih, gaun putih.\nKurasakan mantilla tidak bisa menutupi cantikmu, \ndan gaun panjang kalah elegan dengan kamu.",
      "Ia lebih berharga daripada permata,\ntidak bohong didalam matanya bisa menangkap cahaya di sekitarnya. \nSatu tangannya saja tidak ingin kulepas, dan dua tangannya membuatku nyaman.",
      "Berada di antara kita, menjadi saksi doa kita. \nKita bersama membuat pengakuan, satu hati, satu jiwa, satu raga.\nKita berjanji bersama dalam suka dan duka, sehat maupun sakit. \nDengan cincin melekat, kuminta dia menjadi milikku."
    ],
    songTitle: "",
    songArtist: "",
    youtubeUrl: ""
  },
  {
    id: 2,
    title: "Taman Bunga",
    author: "Roderikus",
    emoji: "🌻",
    date: "2025-01-22",
    tags: [{ label: "Alam", icon: "🌿", type: "nature" }, { label: "Harapan", icon: "🌟", type: "hope" }],
    excerpt: "Embun menetes di kelopak bunga, pagi menyapa dengan senyum hangat...",
    stanzas: [
      "Aku berjalan di taman bunga,  \nUdara segar membelai rambutku.  \nDi kejauhan, kulihat kamu datang, \nDengan senyum yang menghilangkan kesunyian.",
      "\"Kamu terlambat,\" kataku sambil menutupi senyum,  \nTapi sebenarnya, aku tidak menunggu lama.\nLangkahmu yang mendekat, Membuat aku tenang,\nSeolah kebahagiaan hanya untuk kita berdua saja.",
      "Kita mulai menyusuri jalan yang panjang,  \nKakiku berusaha mengikuti langkah kakimu yang cepat.\nBukan hanya tidak ingin tertinggal,\nTapi bagiku, ini berarti aku ingin terus dekat denganmu.",
      "Aku ingin mengatakan sesuatu,  \nBahwa setiap hari menjadi lebih manis karenamu.  \nNamun kata-kata terhenti di ujung bibir,  \nHanya mataku yang bicara lebih jelas.",
      "Langit biru, udara hangat, dan burung bernyanyi riang.\nDan aku hanya ingin langkah ini tidak pernah usai.  \nBersamamu, segala sesuatu lebih hidup,  \nLebih indah, lebih berarti, lebih baik untuk kita."
    ],
    songTitle: "",
    songArtist: "",
    youtubeUrl: ""
  },
  {
    id: 3,
    title: "Vincent Van Gogh",
    author: "Roderikus",
    emoji: "💌",
    date: "2024-12-09",
    tags: [{ label: "Cinta", icon: "💕", type: "love" }, { label: "Mimpi", icon: "✨", type: "dream" }],
    excerpt: "Ada kata yang tak pernah terucap, tersimpan rapi di lembar hati...",
    stanzas: [
      "\"Tetapi, Kamu harus mencintai \ndengan simpati yang tinggi, serius, dan intim. \nDengan kemauan, dengan kecerdasan, \ndan kamu harus selalu berusaha mencari tahu, \nlebih baik, dan lebih banyak lagi\""
    ],
    songTitle: "Experience",
    songArtist: "Ludovico Einaudi",
    youtubeUrl: "https://www.youtube.com/watch?v=_VONMkKkdf4"
  },
  {
    id: 4,
    title: "Milik Shofia",
    author: "Roderikus",
    emoji: "🌧️",
    date: "2026-04-18",
    tags: [{ label: "Alam", icon: "🌿", type: "nature" }, { label: "Mimpi", icon: "✨", type: "dream" }],
    excerpt: "Rintik hujan mengetuk jendela, mengundang kenangan yang lama pergi...",
    isPrivate: true,
    password: "shofia",
    stanzas: [
      "Jika ada buku panduan percaya diri tetapi fiksi\nKalimat awal, bagaimana cara bertindak tanpa dipikir?",
      "Kuambil benih yang ada di hati kamu.\nKusimpan dalam lemari kosong.\nKutersirat bisa mengambil jika butuh.",
      "Namun, siapa menyangka seminggu kemudian.\nBenih itu tumbuh di lemari.\nBungannya pink memenuhi lemari.\nBuahnya biru, dengan banyak motif.",
      "Rasa buahnya tidak bisa ditebak\nBisa manis, dan pahit.\nBiji buahnya mirip dengan bentuk mahkota.",
      "Benih yang dianggap aneh itu.\nBuahnya memiliki kemampuan.\nKemampuan untuk pengisi ruang gelap.\nPenyembuh dari luka yang sengaja ditutupi.\nKunamain obat itu \"Shofia\""
    ],
    songTitle: "It Will Rain",
    songArtist: "Bruno Mars",
    youtubeUrl: "https://music.youtube.com/watch?v=FRtXs73iICo"
  },
  {
    id: 5,
    title: "Milik Sisi",
    author: "Roderikus",
    emoji: "🦋",
    date: "2026-05-10",
    tags: [{ label: "Harapan", icon: "🌟", type: "hope" }, { label: "Cinta", icon: "💕", type: "love" }],
    excerpt: "Setiap langkah pertama adalah keberanian, setiap jatuh adalah pelajaran...",
    isPrivate: true,
    password: "sisi",
    stanzas: [
      "Priscilla, aku punya sajak indah yang dibuat untukmu. \nDitulis berdasarkan hasil kontemplasiku, \nSebagai penghilang atas cerita duka.",
      "Jatuh cintalah. \nJatuh cinta tidak perlu dengan seseorang.\nJatuh cintalah dengan musik sampai kamu ingin menari.",
      "jatuh cintalah dengan seni, \ndengan warna langit, gemerlap bintang, \naroma manis bunga.",
      "Jatuh cintalah dengan teman\nyang bantu kamu ke versi terbaik dirimu sendiri. \nSampai adrenalin dan paru-parumu \npenuh dengan sesak kebahagiaan.",
      "Kuharap kamu tidak takut mencintai.\nKarena penulis ini tidak pernah lelah berharap.\nAgar kamu selalu disertai kebahagiaan."
    ],
    songTitle: "",
    songArtist: "",
    youtubeUrl: ""
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
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\\w-]{11})/,
    /^([\\w-]{11})$/
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
  return \`\${d.getDate()} \${months[d.getMonth()]} \${d.getFullYear()}\`;
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
