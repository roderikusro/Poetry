export interface Star {
  id: number;
  name?: string;
  ra: number; // Right Ascension in degrees (0 - 360)
  dec: number; // Declination in degrees (-90 to +90)
  mag: number; // Magnitude (lower is brighter)
  color: string; // Spectral color (e.g., blue-white, yellow, red)
}

export interface Constellation {
  id: string;
  name: string;
  latinName: string;
  stars: number[]; // Indices of stars belonging to this constellation
  lines: [number, number][]; // Pairs of star indices to draw lines
  description: string;
  mythology: string;
  centerRa: number;
  centerDec: number;
  artUrl?: string;
  poemId?: number; // Optional reference to a poem
}

// Generate stars for main constellations
export const stars: Star[] = [
  // --- ORION (0 - 7) ---
  { id: 0, name: "Betelgeuse", ra: 88.79, dec: 7.41, mag: 0.5, color: "#ff8b60" }, // Red Supergiant
  { id: 1, name: "Rigel", ra: 78.63, dec: -8.2, mag: 0.12, color: "#85c5ff" }, // Blue Supergiant
  { id: 2, name: "Bellatrix", ra: 81.28, dec: 6.35, mag: 1.64, color: "#b0d8ff" },
  { id: 3, name: "Saiph", ra: 86.93, dec: -9.67, mag: 2.06, color: "#a5d0ff" },
  { id: 4, name: "Alnilam", ra: 84.05, dec: -1.2, mag: 1.69, color: "#a5d0ff" }, // Belt Center
  { id: 5, name: "Alnitak", ra: 85.19, dec: -1.94, mag: 1.74, color: "#a5d0ff" }, // Belt Left
  { id: 6, name: "Mintaka", ra: 83.0, dec: -0.3, mag: 2.2, color: "#a5d0ff" }, // Belt Right
  { id: 7, name: "Meissa", ra: 83.78, dec: 9.93, mag: 3.39, color: "#c5e2ff" }, // Head

  // --- URSA MAJOR (8 - 14) ---
  { id: 8, name: "Dubhe", ra: 165.93, dec: 61.75, mag: 1.81, color: "#ffe4a0" },
  { id: 9, name: "Merak", ra: 165.46, dec: 56.38, mag: 2.34, color: "#e1efff" },
  { id: 10, name: "Phecda", ra: 178.46, dec: 53.69, mag: 2.41, color: "#e1efff" },
  { id: 11, name: "Megrez", ra: 180.48, dec: 57.03, mag: 3.32, color: "#e1efff" },
  { id: 12, name: "Alioth", ra: 193.55, dec: 55.96, mag: 1.76, color: "#e1efff" },
  { id: 13, name: "Mizar", ra: 200.98, dec: 54.92, mag: 2.23, color: "#e1efff" },
  { id: 14, name: "Alkaid", ra: 206.88, dec: 49.31, mag: 1.85, color: "#ccdfff" },

  // --- SCORPIUS (15 - 26) ---
  { id: 15, name: "Antares", ra: 247.35, dec: -26.43, mag: 1.06, color: "#ff7d45" }, // Red Supergiant
  { id: 16, name: "Shaula", ra: 262.24, dec: -37.1, mag: 1.62, color: "#a5d0ff" },
  { id: 17, name: "Graffias", ra: 241.35, dec: -19.8, mag: 2.56, color: "#a5d0ff" },
  { id: 18, name: "Dschubba", ra: 240.08, dec: -22.62, mag: 2.29, color: "#a5d0ff" },
  { id: 19, name: "Fang", ra: 241.13, dec: -22.45, mag: 2.9, color: "#b5dbff" },
  { id: 20, name: "Wei", ra: 252.17, dec: -34.29, mag: 2.29, color: "#ffe2a0" },
  { id: 21, name: "Larawag", ra: 254.73, dec: -37.3, mag: 2.39, color: "#ffecbe" },
  { id: 22, name: "Sargas", ra: 258.66, dec: -43.0, mag: 1.86, color: "#ffe090" },
  { id: 23, name: "Acrab", ra: 248.5, dec: -25.2, mag: 2.6, color: "#a5d0ff" },
  { id: 24, name: "Girtab", ra: 265.1, dec: -42.2, mag: 2.4, color: "#b5dbff" },
  { id: 25, name: "Lesath", ra: 262.3, dec: -37.3, mag: 2.7, color: "#a5d0ff" },
  { id: 26, name: "Jabhat al Akrab", ra: 242.7, dec: -20.1, mag: 3.1, color: "#a5d0ff" },

  // --- CRUX (27 - 31) ---
  { id: 27, name: "Acrux", ra: 186.65, dec: -63.1, mag: 0.77, color: "#8fbaff" },
  { id: 28, name: "Mimosa", ra: 191.93, dec: -59.68, mag: 1.25, color: "#8fbaff" },
  { id: 29, name: "Gacrux", ra: 187.79, dec: -57.11, mag: 1.59, color: "#ffa675" }, // Red Giant
  { id: 30, name: "Imai", ra: 183.1, dec: -58.75, mag: 2.79, color: "#ccdfff" },
  { id: 31, name: "Ginan", ra: 185.97, dec: -60.16, mag: 3.59, color: "#ffa065" },

  // --- GEMINI (32 - 40) ---
  { id: 32, name: "Castor", ra: 113.65, dec: 31.88, mag: 1.58, color: "#e3efff" },
  { id: 33, name: "Pollux", ra: 116.33, dec: 28.03, mag: 1.14, color: "#ffd085" }, // Orange Giant
  { id: 34, name: "Alhena", ra: 99.43, dec: 16.39, mag: 1.9, color: "#e3efff" },
  { id: 35, name: "Tejat", ra: 94.7, dec: 22.5, mag: 2.87, color: "#ff8b60" },
  { id: 36, name: "Mebsuta", ra: 104.06, dec: 25.13, mag: 3.06, color: "#ffe7ac" },
  { id: 37, name: "Propus", ra: 92.93, dec: 22.51, mag: 3.3, color: "#ffa070" },
  { id: 38, name: "Alzirr", ra: 102.5, dec: 20.2, mag: 3.35, color: "#ffecbe" },
  { id: 39, name: "Wasat", ra: 107.5, dec: 21.9, mag: 3.5, color: "#e3efff" },
  { id: 40, name: "Mekbuda", ra: 105.4, dec: 20.6, mag: 3.8, color: "#ffe090" },

  // --- LEO (41 - 49) ---
  { id: 41, name: "Regulus", ra: 152.09, dec: 11.96, mag: 1.35, color: "#b5d8ff" },
  { id: 42, name: "Denebola", ra: 177.26, dec: 14.57, mag: 2.14, color: "#e3efff" },
  { id: 43, name: "Algieba", ra: 154.99, dec: 19.84, mag: 2.01, color: "#ffe085" },
  { id: 44, name: "Zosma", ra: 168.38, dec: 20.52, mag: 2.56, color: "#e3efff" },
  { id: 45, name: "Chertan", ra: 170.38, dec: 15.43, mag: 3.33, color: "#e3efff" },
  { id: 46, name: "Algenubi", ra: 147.2, dec: 23.75, mag: 2.97, color: "#ffe085" },
  { id: 47, name: "Adhafera", ra: 152.9, dec: 23.4, mag: 3.43, color: "#ffe7ac" },
  { id: 48, name: "Subra", ra: 142.3, dec: 9.3, mag: 3.52, color: "#e3efff" },
  { id: 49, name: "Alterf", ra: 143.7, dec: 26.0, mag: 4.3, color: "#ffa070" },

  // --- TAURUS (50 - 58) ---
  { id: 50, name: "Aldebaran", ra: 68.98, dec: 16.51, mag: 0.85, color: "#ff8b50" }, // Orange Giant
  { id: 51, name: "Elnath", ra: 81.57, dec: 28.6, mag: 1.65, color: "#c2dfff" },
  { id: 52, name: "Alcyone", ra: 56.62, dec: 24.1, mag: 2.85, color: "#9fc7ff" }, // Pleiades brightest
  { id: 53, name: "Hyadum I", ra: 65.5, dec: 15.6, mag: 3.53, color: "#ffe085" },
  { id: 54, name: "Hyadum II", ra: 66.8, dec: 15.9, mag: 3.84, color: "#ffe085" },
  { id: 55, name: "Ain", ra: 67.2, dec: 19.1, mag: 3.53, color: "#ffe085" },
  { id: 56, name: "Tien Kuan", ra: 84.4, dec: 21.1, mag: 3.0, color: "#c2dfff" },
  { id: 57, name: "Taygeta", ra: 56.2, dec: 24.5, mag: 4.3, color: "#9fc7ff" },
  { id: 58, name: "Atlas", ra: 57.2, dec: 24.0, mag: 3.6, color: "#9fc7ff" },

  // --- DUMMY SCATTERED STARS (Background sky filler) ---
  { id: 59, ra: 20, dec: 40, mag: 4.5, color: "#e8efff" },
  { id: 60, ra: 45, dec: -30, mag: 3.1, color: "#fff0c0" },
  { id: 61, ra: 110, dec: -15, mag: 5.2, color: "#e0ebff" },
  { id: 62, ra: 135, dec: 80, mag: 2.1, color: "#ffffff" },
  { id: 63, ra: 215, dec: 12, mag: 4.8, color: "#fff3d0" },
  { id: 64, ra: 290, dec: -50, mag: 1.25, color: "#90c5ff" }, // Canopus-like
  { id: 65, ra: 335, dec: 5, mag: 3.9, color: "#e8efff" },
  { id: 66, ra: 10, dec: -60, mag: 4.2, color: "#ffd5a0" },
  { id: 67, ra: 140, dec: -25, mag: 2.8, color: "#e2eeff" },
  { id: 68, ra: 220, dec: -70, mag: 3.5, color: "#ffffff" },
  { id: 69, ra: 310, dec: 45, mag: 1.15, color: "#aaccff" }, // Vega-like
  { id: 70, ra: 280, dec: 38, mag: 0.03, color: "#ffffff" },
  { id: 71, ra: 15, dec: -10, mag: 5.5, color: "#e5efff" },
  { id: 72, ra: 95, dec: -52, mag: 3.2, color: "#ffd8b0" },
  { id: 73, ra: 125, dec: -44, mag: 4.1, color: "#e5efff" },
  { id: 74, ra: 250, dec: 60, mag: 4.3, color: "#ffe0a0" },
  { id: 75, ra: 300, dec: 28, mag: 3.8, color: "#ffffff" },
  { id: 76, ra: 320, dec: -20, mag: 5.1, color: "#e0ebff" },
  { id: 77, ra: 5, dec: 15, mag: 2.4, color: "#ffd290" },
  { id: 78, ra: 70, dec: -45, mag: 4.6, color: "#e8efff" },
  { id: 79, ra: 185, dec: 18, mag: 3.5, color: "#ffffff" },
  { id: 80, ra: 260, dec: -10, mag: 2.7, color: "#ccdfff" },
  { id: 81, ra: 350, dec: -35, mag: 4.2, color: "#ffeac0" },
  { id: 82, ra: 100, dec: 75, mag: 3.9, color: "#ffffff" },
  { id: 83, ra: 160, dec: -5, mag: 4.7, color: "#e0ebff" },
  { id: 84, ra: 230, dec: 35, mag: 3.1, color: "#ffe090" },
  { id: 85, ra: 305, dec: -15, mag: 2.9, color: "#dbefff" },
  { id: 86, ra: 40, dec: 55, mag: 4.4, color: "#ffffff" },
  { id: 87, ra: 150, dec: -60, mag: 3.8, color: "#e8efff" },
  { id: 88, ra: 275, dec: -5, mag: 1.9, color: "#bfe0ff" }
];

// Helper to generate coordinates from RA/Dec to XYZ on sphere of radius R
export function raDecToCartesian(ra: number, dec: number, radius: number = 500): [number, number, number] {
  // Convert RA (degrees) and Dec (degrees) to Radians
  const phi = (ra * Math.PI) / 180;
  const theta = ((90 - dec) * Math.PI) / 180;

  // Spherical to Cartesian coordinates (Radius is projection sphere)
  const x = radius * Math.sin(theta) * Math.cos(phi);
  const y = radius * Math.cos(theta);
  const z = radius * Math.sin(theta) * Math.sin(phi);

  return [x, y, z];
}

// Main 7 Constellations defined for the viewer
export const constellations: Constellation[] = [
  {
    id: "orion",
    name: "Orion",
    latinName: "Orion (Sang Pemburu)",
    stars: [0, 1, 2, 3, 4, 5, 6, 7],
    lines: [
      [2, 0], [0, 5], [5, 4], [4, 6], [6, 2],
      [6, 1], [4, 1], [4, 3], [5, 3],
      [1, 3],
      [2, 7], [0, 7]
    ],
    description: "Rasi bintang paling terkenal di langit malam. Terkenal dengan 'Sabuk Orion' yang terdiri dari tiga bintang sejajar (Alnitak, Alnilam, Mintaka) di tengah pinggang sang pemburu.",
    mythology: "Dalam mitologi Yunani, Orion adalah seorang pemburu raksasa yang tampan dan perkasa. Ia ditempatkan di angkasa oleh Zeus setelah disengat oleh kalajengking (Scorpius) kiriman Gaia.",
    centerRa: 82.5,
    centerDec: -1.0,
    artUrl: "/constellation_art/orion.png",
    poemId: 1
  },
  {
    id: "ursamayor",
    name: "Biduk",
    latinName: "Ursa Major (Beruang Besar)",
    stars: [8, 9, 10, 11, 12, 13, 14],
    lines: [
      [8, 9], [9, 10], [10, 11], [11, 8],
      [11, 12], [12, 13], [13, 14]
    ],
    description: "Rasi bintang utara yang menyerupai sendok besar atau gayung air. Bintang Dubhe dan Merak berfungsi sebagai penunjuk arah utara menuju Polaris.",
    mythology: "Dalam mitologi, ia merepresentasikan Callisto, nimfa cantik yang dikutuk oleh Hera menjadi seekor beruang. Zeus memindahkannya ke langit untuk melindunginya.",
    centerRa: 185.0,
    centerDec: 55.0,
    artUrl: "/constellation_art/ursa_major.png",
    poemId: 3
  },
  {
    id: "scorpius",
    name: "Kalajengking",
    latinName: "Scorpius (Sang Kalajengking)",
    stars: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    lines: [
      [17, 18], [18, 19], [19, 26], [26, 17],
      [18, 15], [15, 20], [20, 21], [21, 22],
      [22, 16], [16, 25], [25, 24]
    ],
    description: "Rasi bintang zodiak di belahan langit selatan. Memiliki bintang super raksasa merah Antares sebagai jantungnya yang menyala terang kemerahan.",
    mythology: "Kalajengking yang dikirim oleh dewi bumi Gaia untuk membunuh pemburu sombong Orion. Karena itu, Scorpius dan Orion tidak pernah muncul bersamaan di langit.",
    centerRa: 252.0,
    centerDec: -32.0,
    artUrl: "/constellation_art/scorpius.png",
    poemId: 4
  },
  {
    id: "crux",
    name: "Layang-layang",
    latinName: "Crux (Salib Selatan / Gubuk Penceng)",
    stars: [27, 28, 29, 30, 31],
    lines: [
      [29, 27],
      [30, 28],
      [27, 31], [31, 29]
    ],
    description: "Rasi bintang terkecil namun sangat terang dan ikonik di langit selatan. Sering digunakan sebagai penunjuk arah selatan sejati bagi navigasi maritim kuno.",
    mythology: "Bagi masyarakat Jawa, Crux dikenal sebagai rasi 'Gubuk Penceng' (pondok miring) yang menandai waktu bercocok tanam padi di sawah.",
    centerRa: 187.0,
    centerDec: -60.0,
    artUrl: "/constellation_art/crux.png",
    poemId: 5
  },
  {
    id: "gemini",
    name: "Kembar",
    latinName: "Gemini (Si Kembar)",
    stars: [32, 33, 34, 35, 36, 37, 38, 39, 40],
    lines: [
      [32, 36], [36, 35], [35, 37],
      [33, 39], [39, 40], [40, 34],
      [36, 39], [34, 38], [32, 33]
    ],
    description: "Rasi bintang zodiak dengan dua bintang terang sejajar, Castor dan Pollux, yang melambangkan kepala sepasang saudara kembar.",
    mythology: "Dalam mitologi Yunani, Castor dan Pollux adalah saudara kembar beda bapak. Pollux yang abadi membagikan keabadiannya kepada Castor setelah saudaranya gugur dalam pertempuran.",
    centerRa: 104.0,
    centerDec: 24.0,
    artUrl: "/constellation_art/gemini.png",
    poemId: 2
  },
  {
    id: "leo",
    name: "Singa",
    latinName: "Leo (Sang Singa)",
    stars: [41, 42, 43, 44, 45, 46, 47, 48, 49],
    lines: [
      [41, 48], [48, 41], [41, 45], [45, 44], [44, 42],
      [45, 43], [43, 47], [47, 46], [46, 49], [49, 43]
    ],
    description: "Rasi bintang zodiak musim semi belahan utara yang mudah dikenali lewat 'Sabit Leo' yang membentuk kepala singa dengan bintang Regulus di bagian bawahnya.",
    mythology: "Mewakili Singa Nemea, monster berbulu kebal senjata yang dikalahkan oleh Heracles sebagai tugas pertamanya dari dua belas tugas legendaris.",
    centerRa: 160.0,
    centerDec: 18.0,
    artUrl: "/constellation_art/leo.png"
  },
  {
    id: "taurus",
    name: "Banteng",
    latinName: "Taurus (Sang Banteng)",
    stars: [50, 51, 52, 53, 54, 55, 56, 57, 58],
    lines: [
      [50, 53], [53, 54], [54, 55], [55, 50],
      [50, 56], [51, 56],
      [53, 52], [52, 58], [58, 57]
    ],
    description: "Rasi bintang zodiak musim dingin di belahan langit utara. Memuat gugus bintang Pleiades (Tujuh Bersaudara) dan Hyades yang membentuk segitiga wajah banteng bermata merah Aldebaran.",
    mythology: "Banteng suci jelmaan Zeus yang menculik putri cantik Europa untuk menyeberangi lautan menuju pulau Kreta.",
    centerRa: 70.0,
    centerDec: 19.0,
    artUrl: "/constellation_art/taurus.png"
  }
];
