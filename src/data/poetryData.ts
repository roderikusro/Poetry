import { Poem, Song, Tag } from '../types';

export const defaultPoems: Poem[] = [
  {
    id: 1,
    title: "Amsal 31-10",
    author: "Roderikus",
    emoji: "🌙",
    date: "2024-11-05",
    tags: [
      { label: "Mimpi", icon: "✨", type: "dream" },
      { label: "Alam", icon: "🌿", type: "nature" }
    ],
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
    tags: [
      { label: "Alam", icon: "🌿", type: "nature" },
      { label: "Harapan", icon: "🌟", type: "hope" }
    ],
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
    tags: [
      { label: "Cinta", icon: "💕", type: "love" },
      { label: "Mimpi", icon: "✨", type: "dream" }
    ],
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
    tags: [
      { label: "Alam", icon: "🌿", type: "nature" },
      { label: "Mimpi", icon: "✨", type: "dream" }
    ],
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
    tags: [
      { label: "Harapan", icon: "🌟", type: "hope" },
      { label: "Cinta", icon: "💕", type: "love" }
    ],
    excerpt: "Setiap langkah pertama adalah keberanian, setiap jatuh adalah pelajaran...",
    isPrivate: true,
    password: "sisi",
    stanzas: [
      "Priscilla, aku punya sajak indah yang dibuat untukmu. <br>Ditulis berdasarkan hasil kontemplasiku, <br>Sebagai penghilang atas cerita duka.",
      "<b>Jatuh cintalah. </b><br>Jatuh cinta tidak perlu dengan seseorang.<br>Jatuh cintalah dengan musik sampai kamu ingin menari.",
      "<b>jatuh cintalah</b> dengan seni, <br>dengan warna langit, gemerlap bintang, <br>aroma manis bunga.",
      "<b>Jatuh cintalah</b> dengan teman<br>yang bantu kamu ke versi terbaik dirimu sendiri. <br>Sampai adrenalin dan paru-parumu <br>penuh dengan sesak kebahagiaan.",
      "Kuharap kamu tidak takut mencintai.<br>Karena penulis ini tidak pernah lelah berharap.<br>Agar kamu selalu disertai kebahagiaan."
    ],
    timestamps: [185, 185, 185, 185, 185],
    songTitle: "",
    songArtist: "",
    youtubeUrl: "https://music.youtube.com/watch?v=TIrqlXANqZw"
  }
];

export const defaultSongs: Song[] = [
  {
    title: "Clair de Lune",
    artist: "Debussy",
    icon: "🌙",
    youtubeUrl: "https://www.youtube.com/watch?v=CvFH_6DNRCY"
  },
  {
    title: "River Flows in You",
    artist: "Yiruma",
    icon: "🌊",
    youtubeUrl: "https://www.youtube.com/watch?v=7maJOI3QMu0"
  },
  {
    title: "Gymnopédie No.1",
    artist: "Erik Satie",
    icon: "☁️",
    youtubeUrl: "https://www.youtube.com/watch?v=S-Xm7s9eGxU"
  },
  {
    title: "Nocturne Op.9 No.2",
    artist: "Chopin",
    icon: "🌌",
    youtubeUrl: "https://www.youtube.com/watch?v=9E6b3swbnWg"
  },
  {
    title: "Experience",
    artist: "Ludovico Einaudi",
    icon: "✨",
    youtubeUrl: "https://www.youtube.com/watch?v=_VONMkKkdf4"
  }
];

export const STORAGE_KEY = "roderikus_poems";
export const ADMIN_PASSWORD = "admin2026";

export const availableTags: Tag[] = [
  { label: "Cinta", icon: "💕", type: "love" },
  { label: "Alam", icon: "🌿", type: "nature" },
  { label: "Mimpi", icon: "✨", type: "dream" },
  { label: "Harapan", icon: "🌟", type: "hope" }
];

export const availableEmojis: string[] = [
  "🌙", "🌻", "💌", "🌧️", "🦋", "🌸", "🔥", "🌹",
  "☀️", "🍂", "🌈", "💫", "🌊", "🎭", "📝", "🕊️"
];

// Helper functions
export function getYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([\w-]{11})/,
    /^([\w-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function normalizePoem(p: any): Poem {
  const poem = { ...p };
  if (!poem.tags) poem.tags = [];
  if (!poem.stanzas) poem.stanzas = [];
  if (!poem.stanzaImages) poem.stanzaImages = [];
  if (!poem.lyrics) poem.lyrics = [];
  if (!poem.timestamps) poem.timestamps = [];
  poem.stanzas = poem.stanzas.map((s: any) => typeof s === 'string' ? s : JSON.stringify(s));
  poem.stanzaImages = poem.stanzaImages.map((s: any) => typeof s === 'string' ? s : '');
  return poem;
}

export function normalizePoemArray(arr: any[]): Poem[] {
  return arr.map(p => normalizePoem(p));
}

// Fallback high quality aesthetic memory & cosmic images
const FALLBACK_STANZA_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDjxmn8IG5UfJ2pee18A7AXH1Q1cnvDG0-4Fw6I1kDlq55clrYjxQKkwIFpAJ2Gu4RyHnDF9EcUpQ0LJoSD8EubfVsYzJnfbugLjHfQv-MlXOwt19TklgTBEr6yEQjAmZW2qsRY2RUFFhxjBlo-rE9N-4EoSexR8-uc6fLzFEW0_CfOmY2KXEsFeiUXgO9FPJLcTrc0st6uTfWUwoIn5A3WIcbLGmtdAlHDogdwjK293LBudFCy3iuc2L0RU2daGL2hyiiiBz8c4r3n",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBvc_LikTs5P7jRcKOnEeHheRsKxLmEhqmuZwqCb-sPk-M8wVeAy2SKLu0VyZDhfax-oOuRSH4_3NZS-zOjr4inDpEY7pA_nbfQ07sOupti0bwxkviPq18Vre0RevdOfmhwT2fkdSF8hP-vuWMmvKUiYtiPpo1l7pvLl75le7T7oyLtxqoIpCDNgEnOVqGfgrKfllGzAbDEqgKg2Y4Ji5d5nP4CWo7Kmx7d8otE17NsRc__r4oPHjkHyJIsZg_jTXWgsnOSU6JpEmHt",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCvYFkw2wz3W-KGbHAq0diYOD0UsWbxIdjqsNHhkTEs-clU4Jk-3J9qF901uXMcVY7VLiIbOiRLwjAS-NQ5hFAyBTd1Q4W7ZPzER0iSaAh4m_9RUmnTLComZyUHYGnfQbMbgP8JuVL_TUSpaiqYfOQTpqSUZCETTJ9RM4lByrurzi7eXUTflGmrK5pHGp4bob3uB8e7dQ3cnGkfH5mACLJ3gYQeKafQuioYpQlm3i0QzkDk_Cx1mjVOSLjJLhjrtRYf_MODH_6PAHwO",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop"
];

export function getStanzaImage(poem: Poem, index: number): string {
  if (poem.stanzaImages && poem.stanzaImages[index] && poem.stanzaImages[index].trim() !== '') {
    return poem.stanzaImages[index];
  }
  const seed = (poem.id * 10 + index) % FALLBACK_STANZA_IMAGES.length;
  return FALLBACK_STANZA_IMAGES[seed];
}

export function getPoems(): Poem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? normalizePoemArray(data) : [...defaultPoems];
    } catch (e) {
      return [...defaultPoems];
    }
  }
  return [...defaultPoems];
}

export function savePoems(poemArr: Poem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(poemArr));
}

export function getNextId(): number {
  const all = getPoems();
  return all.length > 0 ? Math.max(...all.map(p => p.id)) + 1 : 1;
}

export function formatDate(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

export function getPoemById(id: number | string): Poem | undefined {
  const all = getPoems();
  return all.find(p => p.id === Number(id));
}
