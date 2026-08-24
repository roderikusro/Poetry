import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { Song } from "../types";
import { parseLrc, getActiveLyricIndex, formatTime, TimedLyric } from "../data/musicUtils";

interface MusicSidebarProps {
  onClose: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
  currentTrack: Song;
  currentTrackIndex: number;
  activePlaylist: Song[];
  playTrack: (index: number) => void;
  handlePrevTrack: () => void;
  handleNextTrack: () => void;
  favorites: Song[];
  toggleFavorite: (song: Song) => void;
  customQueue: Song[];
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  setCustomQueue: React.Dispatch<React.SetStateAction<Song[]>>;
  showToast: (msg: string) => void;
  shuffle: boolean;
  setShuffle: (shuffle: boolean) => void;
  volume: number;
  isMuted: boolean;
  toggleMute: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProgressBarSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  seekTo: (seconds: number) => void;
  duration: number;
}

export default function MusicSidebar({
  onClose,
  isPlaying,
  togglePlay,
  currentTrack,
  currentTrackIndex,
  activePlaylist,
  playTrack,
  handlePrevTrack,
  handleNextTrack,
  favorites,
  toggleFavorite,
  customQueue,
  addToQueue,
  removeFromQueue,
  setCustomQueue,
  showToast,
  shuffle,
  setShuffle,
  volume,
  isMuted,
  toggleMute,
  handleVolumeChange,
  handleProgressBarSeek,
  seekTo,
  duration
}: MusicSidebarProps) {
  // Tab State
  const [activeMusicTab, setActiveMusicTab] = useState<'player' | 'search' | 'lyrics'>('player');

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Lyrics States
  const [lyricsLines, setLyricsLines] = useState<TimedLyric[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [lyricsQueryTrack, setLyricsQueryTrack] = useState("");
  const [lyricsQueryArtist, setLyricsQueryArtist] = useState("");

  // Isolated Time State (updates local state only, preventing App.tsx re-renders)
  const [currentTime, setCurrentTime] = useState(0);

  // Lyric container ref for auto-scrolling
  const lyricContainerRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to time updates
  useEffect(() => {
    const handleTimeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentTime(customEvent.detail.currentTime);
    };
    window.addEventListener('music-time-update', handleTimeUpdate);
    return () => {
      window.removeEventListener('music-time-update', handleTimeUpdate);
    };
  }, []);

  // Sync lyrics matching index
  const activeLyricIndex = useMemo(() => {
    return getActiveLyricIndex(lyricsLines, currentTime);
  }, [lyricsLines, currentTime]);

  // Scroll active lyric to center automatically
  useEffect(() => {
    if (activeMusicTab === 'lyrics' && lyricContainerRef.current) {
      const activeEl = lyricContainerRef.current.querySelector('.lyric-line-active');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeLyricIndex, activeMusicTab]);

  // Auto-fetch lyrics when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      const cleanTitle = currentTrack.title
        .replace(/\(Official[^\)]*\)/gi, '')
        .replace(/\[Official[^\)]*\]/gi, '')
        .replace(/\(Video[^\)]*\)/gi, '')
        .replace(/\[Video[^\)]*\]/gi, '')
        .replace(/\(Lyrics[^\)]*\)/gi, '')
        .replace(/\[Lyrics[^\)]*\]/gi, '')
        .replace(/\(Audio[^\)]*\)/gi, '')
        .replace(/\[Audio[^\)]*\]/gi, '')
        .replace(/\(Official Music Video\)/gi, '')
        .replace(/&/g, 'and')
        .trim();
      fetchLyrics(cleanTitle, currentTrack.artist);
    } else {
      setLyricsLines([]);
    }
  }, [currentTrack]);

  const fetchLyrics = async (title: string, artist: string) => {
    if (!title) return;
    setLyricsLoading(true);
    setLyricsError(null);
    setLyricsQueryTrack(title);
    setLyricsQueryArtist(artist);
    try {
      const response = await fetch(`/api/lyrics?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.syncedLyrics) {
          setLyricsLines(parseLrc(data.syncedLyrics));
        } else if (data.plainLyrics) {
          const lines = data.plainLyrics.split('\n').map((line: string, i: number) => ({
            time: i * 99999,
            text: line.trim()
          })).filter((l: any) => l.text);
          setLyricsLines(lines);
        } else {
          setLyricsLines([]);
          setLyricsError("Lirik tidak ditemukan");
        }
      } else {
        setLyricsLines([]);
        setLyricsError("Lirik tidak ditemukan");
      }
    } catch (err) {
      setLyricsLines([]);
      setLyricsError("Gagal memuat lirik");
    } finally {
      setLyricsLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchError("Gagal mencari lagu");
      }
    } catch (err) {
      setSearchError("Terjadi kesalahan jaringan");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 cursor-pointer"
      />

      {/* Sidebar panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="fixed inset-y-0 left-0 w-80 sm:w-96 bg-stone-950/90 backdrop-blur-2xl border-r border-white/10 z-[60] shadow-2xl flex flex-col p-6 text-left overflow-hidden"
      >
        {/* Dynamic Cover Glow */}
        <div className="absolute inset-0 -z-10 opacity-20 blur-3xl pointer-events-none transition-all duration-1000">
          {currentTrack.thumbnail ? (
            <div 
              className="w-full h-full bg-cover bg-center scale-150 transition-all duration-1000 animate-pulse"
              style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-secondary/35 via-primary/20 to-purple-500/20" />
          )}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl font-fill animate-pulse">
              music_note
            </span>
            <div>
              <h3 className="font-display text-lg text-starlight font-bold tracking-wide">
                Simfoni Angkasa
              </h3>
              <p className="text-[9px] text-mist/40 uppercase tracking-widest font-mono">Metrolist Web System</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="material-symbols-outlined p-1 text-mist hover:text-starlight hover:rotate-90 transition-all rounded-full hover:bg-white/15 cursor-pointer"
            title="Tutup Sidebar"
          >
            close
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4 text-[10px] font-semibold border border-white/5 tracking-wider uppercase font-mono">
          <button
            onClick={() => setActiveMusicTab('player')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              activeMusicTab === 'player' ? 'bg-secondary text-stone-950 font-bold shadow-md' : 'text-mist hover:text-starlight'
            }`}
          >
            Player
          </button>
          <button
            onClick={() => setActiveMusicTab('search')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              activeMusicTab === 'search' ? 'bg-secondary text-stone-950 font-bold shadow-md' : 'text-mist hover:text-starlight'
            }`}
          >
            Cari Lagu
          </button>
          <button
            onClick={() => setActiveMusicTab('lyrics')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              activeMusicTab === 'lyrics' ? 'bg-secondary text-stone-950 font-bold shadow-md' : 'text-mist hover:text-starlight'
            }`}
          >
            Lirik
          </button>
        </div>

        {/* Dynamic Tab Contents */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeMusicTab === 'player' && (
            <div className="flex-1 flex flex-col min-h-0 justify-between">
              {/* Vinyl Spinner Container */}
              <div className="flex flex-col items-center justify-center my-2 select-none">
                <div className="relative w-36 h-36 rounded-full bg-stone-900 border-4 border-stone-800 shadow-2xl flex items-center justify-center overflow-hidden">
                  {/* Concentric rings of vinyl */}
                  <div className="absolute inset-1 border border-stone-700/20 rounded-full" />
                  <div className="absolute inset-2 border border-stone-700/25 rounded-full" />
                  <div className="absolute inset-3 border border-stone-700/20 rounded-full" />
                  <div className="absolute inset-5 border border-stone-750/30 rounded-full" />
                  <div className="absolute inset-8 border border-stone-800/40 rounded-full" />
                  <div className="absolute inset-12 border border-stone-850/50 rounded-full" />
                  
                  {/* Center album art/emoji */}
                  <motion.div
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={isPlaying ? { repeat: Infinity, duration: 12, ease: "linear" } : {}}
                    className="w-14 h-14 rounded-full bg-stone-950 flex items-center justify-center p-0.5 shadow-inner z-10 overflow-hidden border border-white/10"
                  >
                    {currentTrack.thumbnail ? (
                      <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#d2c888] to-[#f5d061] flex items-center justify-center">
                        <span className="text-xl select-none">{currentTrack.icon || "🎵"}</span>
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Vinyl center pinhole */}
                  <div className="absolute w-2 h-2 rounded-full bg-stone-950 border border-white/20 z-20" />
                </div>

                {/* Song Meta info */}
                <div className="text-center mt-3 w-full px-2">
                  <h4 className="text-sm font-semibold text-starlight tracking-wide truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-[11px] text-mist/60 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Seeker Slider */}
              <div className="space-y-1 my-2 font-sans px-2">
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressBarSeek}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                />
                <div className="flex justify-between text-[9px] text-mist/40">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-5 my-1">
                {/* Shuffle Button */}
                <button
                  onClick={() => setShuffle(!shuffle)}
                  className={`material-symbols-outlined text-lg cursor-pointer transition-all ${
                    shuffle ? "text-secondary drop-shadow-[0_0_8px_#d2c888]" : "text-mist/50 hover:text-mist"
                  }`}
                  title="Acak Lagu"
                >
                  shuffle
                </button>

                {/* Prev Button */}
                <button 
                  onClick={handlePrevTrack}
                  className="material-symbols-outlined text-mist hover:text-starlight text-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Lagu Sebelumnya"
                >
                  skip_previous
                </button>

                {/* Play/Pause Button */}
                <button 
                  onClick={togglePlay}
                  className="material-symbols-outlined text-stone-950 bg-secondary hover:bg-yellow-400 p-3 rounded-full text-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-secondary/25"
                  title={isPlaying ? "Jeda" : "Putar"}
                >
                  {isPlaying ? "pause" : "play_arrow"}
                </button>

                {/* Next Button */}
                <button 
                  onClick={handleNextTrack}
                  className="material-symbols-outlined text-mist hover:text-starlight text-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Lagu Berikutnya"
                >
                  skip_next
                </button>

                {/* Volume Mute Button */}
                <button 
                  onClick={toggleMute}
                  className={`material-symbols-outlined text-lg cursor-pointer transition-all ${
                    isMuted || volume === 0 ? "text-red-400" : "text-mist/50 hover:text-mist"
                  }`}
                  title="Bisukan"
                >
                  {isMuted || volume === 0 ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 px-6 my-1">
                <span className="material-symbols-outlined text-xs text-mist/40">volume_down</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                />
                <span className="material-symbols-outlined text-xs text-mist/40">volume_up</span>
              </div>

              {/* Sub-tab view: Active Playlist & Queue */}
              <div className="flex-1 flex flex-col min-h-0 mt-3 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[9px] font-semibold tracking-widest text-mist/40 font-label-caps uppercase">
                    Daftar Lagu ({activePlaylist.length})
                  </span>
                  {customQueue.length > 0 && (
                    <button 
                      onClick={() => { setCustomQueue([]); showToast("Antrean dibersihkan"); }}
                      className="text-[8px] uppercase tracking-wider text-red-400/70 hover:text-red-400 font-mono"
                    >
                      Hapus Antrean
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-styled pr-1 space-y-1">
                  {activePlaylist.map((track, i) => {
                    const isFav = favorites.some(f => f.youtubeUrl === track.youtubeUrl);
                    return (
                      <div
                        key={i}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                          currentTrackIndex === i 
                            ? 'bg-secondary/10 text-secondary border-l-2 border-secondary font-semibold' 
                            : 'hover:bg-white/5 text-mist'
                        }`}
                      >
                        <button
                          onClick={() => playTrack(i)}
                          className="truncate flex-1 text-left cursor-pointer"
                        >
                          <p className="truncate font-medium">{track.title}</p>
                          <p className="truncate font-light text-[9px] opacity-60 mt-0.5">
                            {track.artist} {customQueue.some(q => q.youtubeUrl === track.youtubeUrl) && <span className="text-[8px] bg-secondary/20 text-secondary px-1 py-0.2 rounded font-mono ml-1">Antrean</span>}
                          </p>
                        </button>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleFavorite(track)}
                            className={`material-symbols-outlined text-[14px] cursor-pointer hover:scale-115 transition-transform ${
                              isFav ? 'text-red-400 font-fill' : 'text-mist/30 hover:text-mist'
                            }`}
                          >
                            favorite
                          </button>
                          {currentTrackIndex === i && isPlaying && (
                            <span className="material-symbols-outlined text-xs animate-pulse text-secondary">
                              graphic_eq
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeMusicTab === 'search' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Cari judul lagu atau artis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-starlight placeholder-mist/40 focus:outline-none focus:border-secondary/50 font-sans"
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="bg-secondary text-stone-950 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-lg shadow-secondary/15"
                >
                  {searchLoading ? (
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">search</span>
                  )}
                </button>
              </form>

              {/* Search Results */}
              {searchError && (
                <div className="text-center py-4 text-xs text-red-400/80 font-medium">
                  {searchError}
                </div>
              )}

              {searchResults.length === 0 && !searchLoading && !searchError && (
                <div className="text-center py-10 text-xs text-mist/30 font-medium font-sans">
                  Ketik dan cari lagu kesukaanmu dari YouTube Music.
                </div>
              )}

              <div className="flex-1 overflow-y-auto scrollbar-styled pr-1 space-y-1">
                {searchResults.map((song, i) => {
                  const isFav = favorites.some(f => f.youtubeUrl === song.youtubeUrl);
                  return (
                    <div 
                      key={i}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all text-xs border border-transparent hover:border-white/5 gap-2"
                    >
                      {/* Song thumbnail/info */}
                      <div className="flex items-center gap-2 truncate flex-1">
                        {song.thumbnail ? (
                          <img src={song.thumbnail} alt={song.title} className="w-9 h-9 object-cover rounded-lg shadow-md shrink-0 border border-white/5" />
                        ) : (
                          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-sm">🎵</span>
                          </div>
                        )}
                        <div className="truncate">
                          <h5 className="font-semibold text-starlight truncate">{song.title}</h5>
                          <p className="text-[10px] text-mist/60 truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Play directly */}
                        <button
                          onClick={() => {
                            // Add to queue and play immediately
                            setCustomQueue(prev => {
                              const filtered = prev.filter(q => q.youtubeUrl !== song.youtubeUrl);
                              return [song, ...filtered];
                            });
                            setTimeout(() => {
                              playTrack(0);
                              setActiveMusicTab('player');
                            }, 100);
                          }}
                          className="material-symbols-outlined text-[18px] text-secondary hover:scale-115 transition-transform cursor-pointer p-1 rounded-full hover:bg-white/10"
                          title="Putar Sekarang"
                        >
                          play_circle
                        </button>
                        
                        {/* Add to queue */}
                        <button
                          onClick={() => addToQueue(song)}
                          className="material-symbols-outlined text-[18px] text-mist/60 hover:text-starlight hover:scale-115 transition-transform cursor-pointer p-1 rounded-full hover:bg-white/10"
                          title="Tambah ke Antrean"
                        >
                          queue_music
                        </button>

                        {/* Toggle favorite */}
                        <button
                          onClick={() => toggleFavorite(song)}
                          className={`material-symbols-outlined text-[18px] cursor-pointer hover:scale-115 transition-transform p-1 rounded-full hover:bg-white/10 ${
                            isFav ? 'text-red-400 font-fill' : 'text-mist/30 hover:text-mist'
                          }`}
                          title={isFav ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                        >
                          favorite
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeMusicTab === 'lyrics' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Manual Lyrics Search Helper if mismatched */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 mb-3 text-xs">
                <details className="cursor-pointer group">
                  <summary className="text-[10px] font-semibold text-mist/50 hover:text-starlight select-none font-mono uppercase flex justify-between items-center">
                    <span>Cocokkan Lirik Manual</span>
                    <span className="material-symbols-outlined text-xs group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div className="mt-2 space-y-2 pt-2 border-t border-white/5 cursor-default">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Judul lagu..."
                        value={lyricsQueryTrack}
                        onChange={(e) => setLyricsQueryTrack(e.target.value)}
                        className="w-1/2 bg-stone-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-starlight focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Artis..."
                        value={lyricsQueryArtist}
                        onChange={(e) => setLyricsQueryArtist(e.target.value)}
                        className="w-1/2 bg-stone-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-starlight focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => fetchLyrics(lyricsQueryTrack, lyricsQueryArtist)}
                      className="w-full bg-secondary text-stone-950 font-semibold text-[10px] py-1.5 rounded-lg hover:bg-yellow-400 cursor-pointer text-center"
                    >
                      Cari Lirik
                    </button>
                  </div>
                </details>
              </div>

              {/* Lyrics Display */}
              {lyricsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] text-mist/40 font-mono">Mencari lirik...</span>
                </div>
              ) : lyricsError ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <span className="material-symbols-outlined text-3xl text-mist/20 mb-2">lyrics</span>
                  <p className="text-xs text-mist/50">{lyricsError}</p>
                </div>
              ) : lyricsLines.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <span className="material-symbols-outlined text-3xl text-mist/20 mb-2">music_note</span>
                  <p className="text-xs text-mist/50">Lirik tidak tersedia</p>
                </div>
              ) : (
                <div 
                  ref={lyricContainerRef}
                  className="flex-1 overflow-y-auto scrollbar-styled pr-1 py-10 space-y-4 font-sans mask-lyrics"
                >
                  {lyricsLines.map((line, i) => {
                    const isActive = activeLyricIndex === i;
                    const isPlain = line.time >= 99999;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (!isPlain) {
                            seekTo(line.time);
                          }
                        }}
                        className={`w-full text-left py-1.5 px-3 rounded-xl transition-all text-xs sm:text-sm leading-relaxed cursor-pointer block ${
                          isActive 
                            ? 'lyric-line-active text-secondary font-bold scale-102 bg-white/5 border border-white/5 shadow-inner' 
                            : 'text-mist/70 hover:text-starlight hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {line.text}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer YouTube Link */}
        {currentTrack.youtubeUrl && (
          <div className="pt-3 border-t border-white/5 mt-3">
            <a 
              href={currentTrack.youtubeUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-stone-900 border border-white/10 hover:border-secondary/35 rounded-xl text-[10px] font-label-caps uppercase tracking-wider text-mist hover:text-secondary font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-xs">open_in_new</span>
              <span>Buka di YouTube</span>
            </a>
          </div>
        )}
      </motion.div>
    </>
  );
}
