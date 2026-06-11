import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import { Poem, Tag } from "../types";
import { formatDate } from "../data/poetryData";

interface PoemBrowserModalProps {
  poems: Poem[];
  poemIndex: number;
  isChangingPoem: boolean;
  changePoem: (direction: "next" | "prev") => void;
  setPoemIndex: (idx: number) => void;
  poetryView: "list" | "detail";
  setPoetryView: (view: "list" | "detail") => void;
  showToast: (msg: string) => void;
  isPlaying: boolean;
  currentTime: number;
  seekTo: (seconds: number) => void;
  currentTrackIndex: number;
  playlistData: any[];
  onPlaySongFromPoem: (poem: Poem) => void;
}

export default function PoemBrowserModal({
  poems,
  poemIndex,
  isChangingPoem,
  changePoem,
  setPoemIndex,
  poetryView,
  setPoetryView,
  showToast,
  isPlaying,
  currentTime,
  seekTo,
  currentTrackIndex,
  playlistData,
  onPlaySongFromPoem
}: PoemBrowserModalProps) {
  // Local state
  const [viewType, setViewType] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [unlockedPoemIds, setUnlockedPoemIds] = useState<number[]>([]);
  const [passwordInput, setPasswordInput] = useState("");
  const [shakeLock, setShakeLock] = useState(false);

  // Sorting and filtering poems
  const sortedAndFilteredPoems = useMemo(() => {
    let result = [...poems];

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.label.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [poems, searchQuery, sortBy]);

  // Current poem theme visual info
  const getPoemThemeInfo = (index: number) => {
    const themeIndex = index % 3;
    switch (themeIndex) {
      case 0:
        return {
          icon: "schedule",
          glowClass: "shadow-[0_0_20px_rgba(184,166,255,0.2)] border-primary/20",
          hoverGlow: "group-hover:border-primary group-hover:shadow-[0_0_25px_rgba(184,166,255,0.45)]",
          tag: "BAIT WAKTU & KANVAS ABADI",
          accentColor: "text-primary",
          bgGradient: "from-purple-950/10 to-indigo-950/20",
          symbolTag: "✦ Kronos ✦"
        };
      case 1:
        return {
          icon: "nightlight",
          glowClass: "shadow-[0_0_20px_rgba(255,243,176,0.15)] border-secondary/20",
          hoverGlow: "group-hover:border-secondary group-hover:shadow-[0_0_25px_rgba(255,243,176,0.45)]",
          tag: "LENTERA HARAPAN & CAHAYA SUNYI",
          accentColor: "text-secondary",
          bgGradient: "from-amber-950/10 to-stone-900/10",
          symbolTag: "✦ Kartika ✦"
        };
      case 2:
      default:
        return {
          icon: "spa",
          glowClass: "shadow-[0_0_20px_rgba(136,210,154,0.15)] border-emerald-500/20",
          hoverGlow: "group-hover:border-emerald-400 group-hover:shadow-[0_0_25px_rgba(136,210,154,0.45)]",
          tag: "PERTUMBUHAN & MEKAR ABADI",
          accentColor: "text-emerald-300",
          bgGradient: "from-emerald-950/15 to-teal-950/10",
          symbolTag: "✦ Amerta ✦"
        };
    }
  };

  const currentPoem = poems[poemIndex];
  const currentPoemTheme = currentPoem ? getPoemThemeInfo(poemIndex) : null;
  const isCurrentUnlocked = currentPoem
    ? !currentPoem.isPrivate || unlockedPoemIds.includes(currentPoem.id)
    : false;

  // Stanza Copy Handler
  const handleCopyStanza = (text: string, idx: number) => {
    const cleanText = text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
    const credit = `"${cleanText}"\n\n— Dari puisi "${currentPoem.title}" bait ke-${idx + 1} karya ${currentPoem.author}\nroderikusro.github.io/Poem`;
    navigator.clipboard.writeText(credit).then(() => {
      showToast("Bait berhasil disalin!");
    });
  };

  // Stanza Download Handler
  const handleDownloadStanza = async (text: string, idx: number) => {
    const cleanText = text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
    
    // Create temporary offscreen container
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.innerHTML = `
      <div style="
        width: 600px;
        padding: 60px 50px;
        background: #0f1321;
        border: 2px solid #d2c888;
        border-radius: 20px;
        color: #dfe1f6;
        font-family: 'Cormorant Garamond', 'Times New Roman', serif;
        text-align: center;
        position: relative;
        box-sizing: border-box;
      ">
        <div style="font-size: 80px; color: rgba(210, 200, 136, 0.15); font-family: Georgia, serif; position: absolute; top: 10px; left: 30px; line-height: 1;">“</div>
        <div style="font-size: 22px; font-style: italic; line-height: 2; margin-bottom: 40px; white-space: pre-wrap; color: #ffffff;">${cleanText}</div>
        <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #d2c888; letter-spacing: 0.15em; text-transform: uppercase;">— PUISI: ${currentPoem.title} —</div>
        <div style="font-family: 'Inter', sans-serif; font-size: 11px; color: #d8d8d8; margin-top: 15px; opacity: 0.6; letter-spacing: 0.05em;">Karya ${currentPoem.author} · roderikusro.github.io/Poem</div>
      </div>
    `;
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${currentPoem.title.replace(/\s+/g, "_")}_bait_${idx + 1}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Bait berhasil diunduh sebagai gambar!");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengunduh gambar.");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // Download Full Poem Handler
  const handleDownloadFullPoem = async () => {
    // Create temporary offscreen container for full poem
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";

    const stanzasHTML = currentPoem.stanzas
      .map(
        (stanza, idx) => `
        <div style="margin-bottom: 35px;">
          <div style="font-size: 20px; font-style: italic; line-height: 1.8; color: #ffffff;">
            ${stanza.replace(/<br\s*\/?>/gi, "<br/>")}
          </div>
          ${
            idx < currentPoem.stanzas.length - 1
              ? '<div style="color: rgba(210, 200, 136, 0.25); margin: 20px 0; font-size: 14px;">✦ ✦ ✦</div>'
              : ""
          }
        </div>
      `
      )
      .join("");

    tempDiv.innerHTML = `
      <div style="
        width: 650px;
        padding: 80px 60px;
        background: #0f1321;
        border: 2px solid #d2c888;
        border-radius: 24px;
        color: #dfe1f6;
        font-family: 'Cormorant Garamond', 'Times New Roman', serif;
        text-align: center;
        box-sizing: border-box;
      ">
        <div style="font-size: 38px; font-family: 'Playfair Display', Georgia, serif; font-weight: bold; color: #d3c6ff; margin-bottom: 5px;">
          ${currentPoem.emoji} ${currentPoem.title}
        </div>
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #d8d8d8; opacity: 0.6; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 50px;">
          Karya ${currentPoem.author} · ${formatDate(currentPoem.date)}
        </div>
        <div style="margin-bottom: 50px;">
          ${stanzasHTML}
        </div>
        <div style="border-t: 1px solid rgba(216,216,216,0.1); padding-top: 25px; font-family: 'Inter', sans-serif; font-size: 11px; color: #d2c888; opacity: 0.8; letter-spacing: 0.05em;">
          Dibuat dengan cinta untuk pecinta sastra · roderikusro.github.io/Poem
        </div>
      </div>
    `;
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${currentPoem.title.replace(/\s+/g, "_")}_full.png`;
      link.href = dataUrl;
      link.click();
      showToast("Puisi lengkap berhasil diunduh!");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengunduh gambar.");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // Lock Password Unloker
  const handleUnlockPrivate = () => {
    if (passwordInput.toLowerCase() === currentPoem.password?.toLowerCase()) {
      setUnlockedPoemIds([...unlockedPoemIds, currentPoem.id]);
      showToast("Kunci berhasil dibuka! Selamat meresapi bait.");
      setPasswordInput("");
      onPlaySongFromPoem(currentPoem);
    } else {
      setShakeLock(true);
      showToast("Kata sandi salah. Silakan coba lagi!");
      setTimeout(() => setShakeLock(false), 500);
    }
  };

  // Sync lyrics highlighting checks
  const currentSongPlaying = useMemo(() => {
    if (currentTrackIndex === -1 || !playlistData || playlistData.length === 0) return null;
    return playlistData[currentTrackIndex];
  }, [currentTrackIndex, playlistData]);

  const showLyricsSync = useMemo(() => {
    if (!currentPoem || !currentPoem.youtubeUrl) return false;
    if (!currentSongPlaying) return false;
    
    // Check if currently playing song matches this poem's song
    const playingId = currentSongPlaying.youtubeId;
    const poemSongId = currentPoem.youtubeUrl.match(/(?:v=|\/)([\w-]{11})/)?.[1];
    return playingId && poemSongId && playingId === poemSongId;
  }, [currentPoem, currentSongPlaying]);

  return (
    <div className="w-full h-full text-left font-body">
      <AnimatePresence mode="wait">
        {poetryView === "list" ? (
          <motion.div
            key="poem-list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-5xl mx-auto"
          >
            {/* Header / Intro */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-1">
                <span className="material-symbols-outlined text-primary text-3xl font-fill animate-pulse">
                  local_florist
                </span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-starlight tracking-wider font-bold">
                Taman Antologi Puisi
              </h2>
              <p className="text-stone-300/80 font-serif italic text-xs md:text-sm max-w-prose mx-auto">
                "Pilihlah bait mekar anggun untuk meresapi pesan rasa di kesunyian malam"
              </p>
            </div>

            {/* Toolbar Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="material-symbols-outlined text-mist/60 text-sm pl-1">search</span>
                <input
                  type="text"
                  placeholder="Cari judul, tag, isi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-starlight outline-none w-full border-none focus:ring-0 placeholder:text-mist/30"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-mist/40 hover:text-mist text-xs">
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
                {/* View Toggles */}
                <div className="flex border border-white/10 rounded-lg overflow-hidden mr-2">
                  <button
                    onClick={() => setViewType("list")}
                    className={`p-1.5 flex items-center justify-center ${
                      viewType === "list" ? "bg-primary text-deep-navy font-bold" : "text-mist hover:bg-white/5"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">view_list</span>
                  </button>
                  <button
                    onClick={() => setViewType("grid")}
                    className={`p-1.5 flex items-center justify-center ${
                      viewType === "grid" ? "bg-primary text-deep-navy font-bold" : "text-mist hover:bg-white/5"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">grid_view</span>
                  </button>
                </div>

                {/* Sort Toggle */}
                <button
                  onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-lg text-mist hover:text-starlight hover:border-white/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    {sortBy === "newest" ? "calendar_today" : "history"}
                  </span>
                  <span>{sortBy === "newest" ? "Terbaru" : "Terlama"}</span>
                </button>
              </div>
            </div>

            {/* List & Grid Container */}
            {sortedAndFilteredPoems.length === 0 ? (
              <div className="text-center py-16 text-mist/50 text-sm font-serif italic border border-white/5 rounded-2xl bg-white/2">
                "Tidak ada puisi mekar yang cocok dengan pencarian Anda..."
              </div>
            ) : viewType === "list" ? (
              <div className="space-y-4">
                {sortedAndFilteredPoems.map((poem) => {
                  const globalIdx = poems.findIndex((p) => p.id === poem.id);
                  const theme = getPoemThemeInfo(globalIdx);
                  const isPrivate = poem.isPrivate && !unlockedPoemIds.includes(poem.id);

                  return (
                    <motion.div
                      key={poem.id}
                      onClick={() => {
                        setPoemIndex(globalIdx);
                        setPoetryView("detail");
                      }}
                      whileHover={{ scale: 1.008, y: -2 }}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-white/5 hover:border-primary/20 bg-surface-container-low hover:bg-surface-container-high transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.bgGradient.includes("purple") ? "from-primary to-indigo-500" : theme.bgGradient.includes("amber") ? "from-secondary to-yellow-600" : "from-emerald-400 to-teal-500"}`} />
                      
                      <div className="flex items-center gap-4 pl-3">
                        <div className="text-2xl w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                          {isPrivate ? "🔒" : poem.emoji}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-lg font-bold text-starlight group-hover:text-secondary transition-colors">
                              {poem.title}
                            </h3>
                            {poem.isPrivate && (
                              <span className="bg-rose-950/40 border border-rose-500/30 text-[9px] text-rose-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {isPrivate ? "Terkunci" : "Terbuka"}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-mist/60">
                            {poem.author} · {formatDate(poem.date)}
                          </p>
                        </div>
                      </div>

                      {/* Excerpt */}
                      <div className="text-xs text-mist/75 font-serif italic max-w-sm sm:max-w-md w-full sm:w-auto my-2 sm:my-0 pl-16 sm:pl-0 pr-4">
                        {isPrivate ? (
                          <span className="blur-xs select-none">Ini adalah baris puisi rahasia terkunci gembok.</span>
                        ) : (
                          `"${poem.excerpt}"`
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex gap-1.5 pl-16 sm:pl-0 pr-3">
                        {poem.tags.map((t) => (
                          <span
                            key={t.label}
                            className="inline-flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-[10px] text-mist"
                          >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedAndFilteredPoems.map((poem) => {
                  const globalIdx = poems.findIndex((p) => p.id === poem.id);
                  const theme = getPoemThemeInfo(globalIdx);
                  const isPrivate = poem.isPrivate && !unlockedPoemIds.includes(poem.id);

                  return (
                    <motion.div
                      key={poem.id}
                      onClick={() => {
                        setPoemIndex(globalIdx);
                        setPoetryView("detail");
                      }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-surface-container-low border hover:bg-surface-container-high cursor-pointer transition-colors duration-300 ${theme.glowClass} ${theme.hoverGlow}`}
                    >
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${theme.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-mist/40 font-semibold tracking-wider uppercase font-sans">
                            {theme.tag}
                          </span>
                          <span className="text-xl w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                            {isPrivate ? "🔒" : poem.emoji}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-xl text-starlight font-bold group-hover:text-secondary transition-colors">
                              {poem.title}
                            </h3>
                            {poem.isPrivate && (
                              <span className="bg-rose-950/40 border border-rose-500/30 text-[8px] text-rose-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {isPrivate ? "Locked" : "Unlocked"}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-mist/50">{poem.author} · {formatDate(poem.date)}</p>
                        </div>

                        <div className="pt-2 border-t border-white/5">
                          <p className="font-poem text-sm text-stone-300 group-hover:text-stone-100 italic leading-relaxed line-clamp-3">
                            {isPrivate ? (
                              <span className="blur-sm select-none">Ini adalah tulisan puisi pribadi yang sedang dikunci. Silakan buka kunci di halaman baca puisi.</span>
                            ) : (
                              `"${poem.excerpt}"`
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10 pt-4 flex gap-1 items-center justify-end text-[10px] tracking-widest text-secondary font-label-caps uppercase group-hover:translate-x-1 duration-300">
                        <span>Buka Puisi</span>
                        <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Hint */}
            <div className="text-center text-[10px] text-mist/30 pt-4 select-none pointer-events-none uppercase tracking-widest">
              ✦ Klik salah satu kartu puisi di atas untuk membaca selengkapnya ✦
            </div>
          </motion.div>
        ) : (
          /* Detail View */
          <motion.div
            key="poem-reader-detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-5 max-w-4xl mx-auto"
          >
            {/* Nav Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <button
                onClick={() => setPoetryView("list")}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold tracking-wider text-mist hover:text-secondary transition-all cursor-pointer font-label-caps"
              >
                <span className="material-symbols-outlined text-xs transition-transform group-hover:-translate-x-1">
                  arrow_back
                </span>
                <span>KEMBALI KE DAFTAR</span>
              </button>

              <span className="text-[10px] text-stone-400 font-semibold tracking-widest bg-stone-900/50 px-3 py-1 rounded-full border border-white/5 uppercase">
                Puisi {poemIndex + 1} dari {poems.length}
              </span>
            </div>

            {/* Poem Meta Header */}
            <div className="text-center pt-2 space-y-1">
              <div className="text-3xl inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/5 mb-1 animate-bounce">
                {isCurrentUnlocked ? currentPoem.emoji : "🔒"}
              </div>
              <h2 className="font-display text-2xl md:text-3.5xl text-primary font-bold tracking-wide">
                {currentPoem.title}
              </h2>
              <p className="text-xs text-mist/60 font-sans">
                Karya {currentPoem.author} · {formatDate(currentPoem.date)}
              </p>
              
              {/* Tags */}
              <div className="flex justify-center gap-1.5 pt-2">
                {currentPoem.tags.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-[9px] text-mist"
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Parchment Reading Container */}
            <div className="relative border border-secondary/15 rounded-2xl bg-stone-950/45 p-6 md:p-12 shadow-[0_0_20px_rgba(184,166,255,0.03)] overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
              
              {/* Star decorators */}
              <div className="absolute top-3 left-3 text-white/5 text-xs select-none">✦</div>
              <div className="absolute top-3 right-3 text-white/5 text-xs select-none">✦</div>
              <div className="absolute bottom-3 left-3 text-white/5 text-xs select-none">✦</div>
              <div className="absolute bottom-3 right-3 text-white/5 text-xs select-none">✦</div>

              {!isCurrentUnlocked ? (
                /* Locked Password Shield */
                <motion.div
                  animate={shakeLock ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-sm text-center py-8 space-y-5"
                >
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-rose-400 text-5xl font-fill animate-pulse">
                      lock_open
                    </span>
                    <h4 className="font-display text-xl text-starlight font-bold">Buka Sajak Rahasia</h4>
                    <p className="text-xs text-mist/60">
                      Puisi ini dikunci oleh penulis secara pribadi. Silakan masukkan kata sandi Anda untuk mulai meresapi bait-bait indah.
                    </p>
                  </div>

                  <div className="flex border border-white/10 rounded-lg overflow-hidden focus-within:border-rose-400/50 bg-white/5">
                    <input
                      type="password"
                      placeholder="Masukkan Kata Sandi..."
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUnlockPrivate()}
                      className="bg-transparent text-xs text-starlight outline-none flex-1 px-3 py-2 w-full border-none focus:ring-0 placeholder:text-mist/30"
                    />
                    <button
                      onClick={handleUnlockPrivate}
                      className="bg-rose-600/30 text-rose-200 border-l border-white/10 hover:bg-rose-600 hover:text-white px-4 text-xs font-semibold font-label-caps uppercase transition-colors"
                    >
                      Buka
                    </button>
                  </div>

                  {/* Locked placeholder mockup (underneath) */}
                  <div className="space-y-3 opacity-15 select-none pointer-events-none mt-6">
                    <div className="h-4 bg-white/30 w-3/4 mx-auto rounded-full shimmer-line" />
                    <div className="h-4 bg-white/30 w-5/6 mx-auto rounded-full shimmer-line" />
                    <div className="h-4 bg-white/30 w-2/3 mx-auto rounded-full shimmer-line" />
                  </div>
                </motion.div>
              ) : (
                /* Unlocked Poem Content */
                <div className={`w-full space-y-8 py-2 transition-all duration-300 ${isChangingPoem ? "opacity-0 scale-98" : "opacity-100 scale-100"}`}>
                  
                  {/* Stanzas Loop */}
                  {currentPoem.stanzas.map((stanza, idx) => {
                    // Check if lyric sync active for this stanza
                    const hasLyric = currentPoem.lyrics && currentPoem.lyrics[idx];
                    const timestamp = currentPoem.timestamps && currentPoem.timestamps[idx];
                    
                    // Highlight logic
                    let isLyricActive = false;
                    if (showLyricsSync && timestamp !== undefined) {
                      // Find if this is the active stanza by comparing current time with timestamps
                      // Highlight the active snippet if current time is around this timestamp
                      const nextTimestamp = currentPoem.timestamps && currentPoem.timestamps[idx + 1] 
                        ? currentPoem.timestamps[idx + 1] 
                        : Infinity;
                      isLyricActive = currentTime >= timestamp && currentTime < nextTimestamp;
                    }

                    return (
                      <div
                        key={idx}
                        className="group/stanza relative flex flex-col md:flex-row md:items-center justify-between w-full border border-transparent hover:border-white/5 hover:bg-white/1 rounded-xl p-4 transition-all"
                      >
                        {/* Poem Stanza Body */}
                        <div className="flex-1 md:pr-6">
                          <p
                            className="font-poem text-lg md:text-xl text-stone-100 leading-loose text-center md:text-left italic select-text"
                            dangerouslySetInnerHTML={{ __html: stanza }}
                          />
                        </div>

                        {/* Lyrics Sync Column */}
                        {hasLyric && (
                          <div 
                            onClick={() => timestamp !== undefined && seekTo(timestamp)}
                            className={`my-3 md:my-0 md:w-64 border-l border-white/5 pl-4 flex items-center gap-1.5 cursor-pointer text-xs transition-colors py-1.5 ${
                              isLyricActive
                                ? "text-secondary font-bold scale-[1.02] drop-shadow-[0_0_10px_rgba(210,200,136,0.4)]"
                                : "text-mist/55 hover:text-mist"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm font-fill">music_note</span>
                            <span className="font-sans italic line-clamp-2">
                              "{currentPoem.lyrics?.[idx]}"
                            </span>
                            {timestamp !== undefined && (
                              <span className="text-[9px] bg-white/5 border border-white/5 rounded px-1 ml-auto text-mist/40">
                                {Math.floor(timestamp / 60)}:{(timestamp % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stanza Action Panel Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover/stanza:opacity-100 transition-opacity flex gap-1.5 bg-stone-900/95 border border-white/10 px-2 py-1 rounded-full shadow-lg z-10">
                          <button
                            onClick={() => handleCopyStanza(stanza, idx)}
                            className="flex items-center justify-center p-1 rounded-full hover:bg-white/10 text-mist hover:text-primary transition-colors cursor-pointer"
                            title="Salin Bait"
                          >
                            <span className="material-symbols-outlined text-xs">content_copy</span>
                          </button>
                          <button
                            onClick={() => handleDownloadStanza(stanza, idx)}
                            className="flex items-center justify-center p-1 rounded-full hover:bg-white/10 text-mist hover:text-secondary transition-colors cursor-pointer"
                            title="Unduh PNG Bait"
                          >
                            <span className="material-symbols-outlined text-xs">download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail Actions & Pagination */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-white/5">
              <button
                onClick={() => changePoem("prev")}
                className="flex items-center gap-1.5 text-xs text-mist hover:text-primary font-semibold tracking-wider font-label-caps transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                PUISI SEBELUMNYA
              </button>

              {isCurrentUnlocked && (
                <button
                  onClick={handleDownloadFullPoem}
                  className="flex items-center gap-1.5 px-4 py-2 border border-secondary/20 hover:border-secondary hover:bg-secondary/5 rounded-full text-xs font-semibold text-secondary hover:text-starlight transition-all font-label-caps cursor-pointer shadow-lg shadow-secondary/5"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>UNDUH LENGKAP PNG</span>
                </button>
              )}

              <button
                onClick={() => changePoem("next")}
                className="flex items-center gap-1.5 text-xs text-mist hover:text-primary font-semibold tracking-wider font-label-caps transition-colors cursor-pointer"
              >
                PUISI BERIKUTNYA
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
