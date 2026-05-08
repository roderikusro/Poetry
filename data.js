// ===== Shared Poem & Song Data =====
const poems = [
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
    songIndex: 2 // Starry Night Waltz
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
    songIndex: 0 // Morning Light
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
    songIndex: 3 // Cherry Blossom
  },
  {
    id: 4,
    title: "Hujan di Sore Hari",
    author: "Anonim",
    emoji: "🌧️",
    date: "2026-04-18",
    tags: [{ label: "Alam", icon: "🌿", type: "nature" }, { label: "Mimpi", icon: "✨", type: "dream" }],
    excerpt: "Rintik hujan mengetuk jendela, mengundang kenangan yang lama pergi...",
    stanzas: [
      "Rintik hujan mengetuk jendela,\nMengundang kenangan yang lama pergi,\nAroma tanah basah tercium mesra,\nSeperti pelukan hangat di hati.",
      "Secangkir teh menemani senja,\nUap mengepul bersama angan,\nDi balik tirai hujan yang manja,\nTersimpan cerita penuh keindahan.",
      "Biarkan hujan membasuh luka,\nMenyuburkan harapan yang tertidur,\nKarena setelah badai berlalu,\nPelangi akan datang dengan syahdu."
    ],
    songIndex: 1 // Raindrops Lullaby
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
    songIndex: 0 // Morning Light
  }
];

const songs = [
  { title: "Morning Light", artist: "Ambient Dreams", icon: "🌅", melody: "morning" },
  { title: "Raindrops Lullaby", artist: "Nature Sounds", icon: "🌧️", melody: "rain" },
  { title: "Starry Night Waltz", artist: "Moonlit Piano", icon: "🌙", melody: "starry" },
  { title: "Cherry Blossom Breeze", artist: "Sakura Melodies", icon: "🌸", melody: "cherry" }
];

// ===== Utility =====
function formatDate(dateStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getPoemById(id) {
  return poems.find(p => p.id === parseInt(id));
}
