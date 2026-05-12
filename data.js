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
      "Di atas altar, di bawah basilika santo petrus, <br>di belakang tubuh kristus, di sampingku perempuan ini. <br>Mengenakan mantilla putih, gaun putih.<br>Kurasakan mantilla tidak bisa menutupi cantikmu, <br>dan gaun panjang kalah elegan dengan kamu.",
      "Ia lebih berharga daripada permata,<br>tidak bohong didalam matanya bisa menangkap cahaya di sekitarnya. <br>Satu tangannya saja tidak ingin kulepas, dan dua tangannya membuatku nyaman.",
      "Berada di antara kita, menjadi saksi doa kita. <br>Kita bersama membuat pengakuan, satu hati, satu jiwa, satu raga.<br>Kita berjanji bersama dalam suka dan duka, sehat maupun sakit. <br>Dengan cincin melekat, kuminta dia menjadi milikku."
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
      "Aku berjalan di taman bunga,  <br>Udara segar membelai rambutku.  <br>Di kejauhan, kulihat kamu datang, <br>Dengan senyum yang menghilangkan kesunyian.",
      "\"Kamu terlambat,\" kataku sambil menutupi senyum,  <br>Tapi sebenarnya, aku tidak menunggu lama.<br>Langkahmu yang mendekat, Membuat aku tenang,<br>Seolah kebahagiaan hanya untuk kita berdua saja.",
      "Kita mulai menyusuri jalan yang panjang,  <br>Kakiku berusaha mengikuti langkah kakimu yang cepat.<br>Bukan hanya tidak ingin tertinggal,<br>Tapi bagiku, ini berarti aku ingin terus dekat denganmu.",
      "Aku ingin mengatakan sesuatu,  <br>Bahwa setiap hari menjadi lebih manis karenamu.  <br>Namun kata-kata terhenti di ujung bibir,  <br>Hanya mataku yang bicara lebih jelas.",
      "Langit biru, udara hangat, dan burung bernyanyi riang.<br>Dan aku hanya ingin langkah ini tidak pernah usai.  <br>Bersamamu, segala sesuatu lebih hidup,  <br>Lebih indah, lebih berarti, lebih baik untuk kita."
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
      "<div style=\"text-align: left;\"><span style=\"font-size: 0.95rem;\">\"Tetapi, Kamu harus mencintai </span></div><div style=\"text-align: left;\"><span style=\"font-size: 0.95rem;\">dengan simpati yang tinggi, serius, dan intim. </span></div><div style=\"text-align: left;\"><span style=\"font-size: 0.95rem;\">Dengan kemauan, dengan kecerdasan, </span></div><div style=\"text-align: left;\"><span style=\"font-size: 0.95rem;\">dan kamu harus selalu berusaha mencari tahu, </span></div><div style=\"text-align: left;\"><span style=\"font-size: 0.95rem;\">lebih baik, dan lebih banyak lagi\"</span></div>"
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
      "Jika ada buku panduan percaya diri tetapi fiksi<br>Kalimat awal, bagaimana cara bertindak tanpa dipikir?",
      "Kuambil benih yang ada di hati kamu.<br>Kusimpan dalam lemari kosong.<br>Kutersirat bisa mengambil jika butuh.",
      "Namun, siapa menyangka seminggu kemudian.<br>Benih itu tumbuh di lemari.<br>Bungannya pink memenuhi lemari.<br>Buahnya biru, dengan banyak motif.",
      "Rasa buahnya tidak bisa ditebak<br>Bisa manis, dan pahit.<br>Biji buahnya mirip dengan bentuk mahkota.",
      "Benih yang dianggap aneh itu.<br>Buahnya memiliki kemampuan.<br>Kemampuan untuk pengisi ruang gelap.<br>Penyembuh dari luka yang sengaja ditutupi.<br>Kunamain obat itu \"Shofia\""
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
      "Priscilla, aku punya sajak indah yang dibuat untukmu. <br>Ditulis berdasarkan hasil kontemplasiku, <br>Sebagai penghilang atas cerita duka.",
      "Jatuh cintalah. <br>Jatuh cinta tidak perlu dengan seseorang.<br>Jatuh cintalah dengan musik sampai kamu ingin menari.",
      "jatuh cintalah dengan seni, <br>dengan warna langit, gemerlap bintang, <br>aroma manis bunga.",
      "<div style=\"text-align: left;\"><span style=\"font-size: 0.95rem;\">Jatuh cintalah dengan teman</span></div>yang bantu kamu ke versi terbaik dirimu sendiri. <br>Sampai adrenalin dan paru-parumu <br>penuh dengan sesak kebahagiaan.",
      "Kuharap kamu tidak takut mencintai.<br>Karena penulis ini tidak pernah lelah berharap.<br>Agar kamu selalu disertai kebahagiaan."
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
