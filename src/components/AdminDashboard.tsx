import React, { useState, useEffect, useRef } from "react";
import { Poem, Tag, Song } from "../types";
import {
  getPoems,
  savePoems,
  getNextId,
  availableTags,
  availableEmojis,
  defaultSongs,
  getYouTubeId,
  ADMIN_PASSWORD
} from "../data/poetryData";

interface AdminDashboardProps {
  poemsList: Poem[];
  onPoemsUpdated: (updatedList: Poem[]) => void;
  showToast: (msg: string) => void;
}

interface StanzaField {
  id: number;
  value: string;
  lyric: string;
  timeStr: string; // MM:SS format
}

export default function AdminDashboard({
  poemsList,
  onPoemsUpdated,
  showToast
}: AdminDashboardProps) {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("admin_auth") === "true";
  });
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"manage" | "create" | "settings">("manage");

  // Form Fields
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("Roderikus");
  const [emoji, setEmoji] = useState("🌸");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [excerpt, setExcerpt] = useState("");
  const [songSelect, setSongSelect] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [privatePassword, setPrivatePassword] = useState("");
  const [selectedTagTypes, setSelectedTagTypes] = useState<string[]>([]);
  const [stanzas, setStanzas] = useState<StanzaField[]>([
    { id: 1, value: "", lyric: "", timeStr: "00:00" }
  ]);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [formStatusColor, setFormStatusColor] = useState("text-rose-400");

  // AI Copilot for Admin Form Auto-fill
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState("openrouter/auto");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // YouTube Preview Player State
  const [previewActive, setPreviewActive] = useState(false);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewArtist, setPreviewArtist] = useState("");

  const nextStanzaId = useRef(2);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      setIsAuthenticated(true);
      setLoginError("");
      setPassword("");
      showToast("🔓 Selamat datang, Admin!");
    } else {
      setLoginError("❌ Kata sandi salah!");
      setPassword("");
      setTimeout(() => setLoginError(""), 3000);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    showToast("🔒 Sesi admin diakhiri.");
  };

  // Stats
  const stats = React.useMemo(() => {
    const total = poemsList.length;
    const pub = poemsList.filter((p) => !p.isPrivate).length;
    const priv = poemsList.filter((p) => p.isPrivate).length;
    return { total, pub, priv };
  }, [poemsList]);

  // Tag selection helper
  const handleToggleTag = (type: string) => {
    if (selectedTagTypes.includes(type)) {
      setSelectedTagTypes(selectedTagTypes.filter((t) => t !== type));
    } else {
      setSelectedTagTypes([...selectedTagTypes, type]);
    }
  };

  // Default Song Dropdown selection
  const handleSongDropdownChange = (val: string) => {
    setSongSelect(val);
    if (val === "custom") {
      setYoutubeUrl("");
      setSongTitle("");
      setSongArtist("");
    } else if (val.startsWith("default_")) {
      const idx = parseInt(val.split("_")[1]);
      const song = defaultSongs[idx];
      setYoutubeUrl(song.youtubeUrl);
      setSongTitle(song.title);
      setSongArtist(song.artist);
    } else {
      setYoutubeUrl("");
      setSongTitle("");
      setSongArtist("");
    }
  };

  // Stanza modifiers
  const handleAddStanzaField = () => {
    setStanzas([
      ...stanzas,
      { id: nextStanzaId.current++, value: "", lyric: "", timeStr: "00:00" }
    ]);
  };

  const handleRemoveStanzaField = (id: number) => {
    if (stanzas.length <= 1) return;
    setStanzas(stanzas.filter((s) => s.id !== id));
  };

  const handleUpdateStanzaField = (id: number, fieldName: keyof StanzaField, val: string) => {
    setStanzas(
      stanzas.map((s) => (s.id === id ? { ...s, [fieldName]: val } : s))
    );
  };

  // Form Reset
  const handleResetForm = () => {
    setEditId(null);
    setTitle("");
    setAuthor("Roderikus");
    setDate(new Date().toISOString().split("T")[0]);
    setExcerpt("");
    setIsPrivate(false);
    setPrivatePassword("");
    setSongSelect("");
    setYoutubeUrl("");
    setSongTitle("");
    setSongArtist("");
    setEmoji("🌸");
    setSelectedTagTypes([]);
    setStanzas([{ id: nextStanzaId.current++, value: "", lyric: "", timeStr: "00:00" }]);
    setFormStatus(null);
  };

  // CRUD Actions
  const handleEditPoem = (p: Poem) => {
    setEditId(p.id);
    setTitle(p.title);
    setAuthor(p.author);
    setDate(p.date);
    setExcerpt(p.excerpt);
    setEmoji(p.emoji);
    setSelectedTagTypes(p.tags.map((t) => t.type));
    setIsPrivate(!!p.isPrivate);
    setPrivatePassword(p.password || "");
    
    // Set song fields
    setYoutubeUrl(p.youtubeUrl || "");
    setSongTitle(p.songTitle || "");
    setSongArtist(p.songArtist || "");

    const matchIdx = defaultSongs.findIndex((s) => s.youtubeUrl === p.youtubeUrl);
    if (!p.youtubeUrl) {
      setSongSelect("");
    } else if (matchIdx >= 0) {
      setSongSelect(`default_${matchIdx}`);
    } else {
      setSongSelect("custom");
    }

    // Set stanzas
    if (p.stanzas && p.stanzas.length > 0) {
      const fields: StanzaField[] = p.stanzas.map((s, idx) => {
        const timestamp = p.timestamps && p.timestamps[idx] ? p.timestamps[idx] : 0;
        const mins = Math.floor(timestamp / 60);
        const secs = String(timestamp % 60).padStart(2, "0");
        const lyric = p.lyrics && p.lyrics[idx] ? p.lyrics[idx] : "";
        return {
          id: nextStanzaId.current++,
          value: s,
          lyric,
          timeStr: `${mins}:${secs}`
        };
      });
      setStanzas(fields);
    } else {
      setStanzas([{ id: nextStanzaId.current++, value: "", lyric: "", timeStr: "00:00" }]);
    }

    setActiveTab("create");
  };

  const handleDeletePoem = (id: number) => {
    const p = poemsList.find((x) => x.id === id);
    if (!p) return;
    if (!window.confirm(`Hapus puisi "${p.title}"? Tindakan ini permanen.`)) return;

    const updated = poemsList.filter((x) => x.id !== id);
    savePoems(updated);
    onPoemsUpdated(updated);
    showToast("🗑️ Puisi berhasil dihapus!");
  };

  // Time format helper
  const parseTimeStr = (str: string): number => {
    if (!str) return 0;
    if (str.includes(":")) {
      const parts = str.split(":");
      return parseInt(parts[0] || "0") * 60 + parseInt(parts[1] || "0");
    }
    return parseInt(str) || 0;
  };

  // Save/Publish
  const handleSavePoem = () => {
    if (!title.trim()) {
      setFormStatus("❌ Judul puisi wajib diisi!");
      setFormStatusColor("text-rose-400");
      return;
    }
    if (selectedTagTypes.length === 0) {
      setFormStatus("❌ Pilih minimal satu tag!");
      setFormStatusColor("text-rose-400");
      return;
    }

    const collectedStanzas: string[] = [];
    const collectedLyrics: string[] = [];
    const collectedTimestamps: number[] = [];

    stanzas.forEach((s) => {
      const val = s.value.trim();
      if (val && val !== "<br>" && val !== "<div><br></div>") {
        collectedStanzas.push(val);
        collectedLyrics.push(s.lyric.trim());
        collectedTimestamps.push(parseTimeStr(s.timeStr));
      }
    });

    if (collectedStanzas.length === 0) {
      setFormStatus("❌ Puisi minimal harus memiliki satu bait!");
      setFormStatusColor("text-rose-400");
      return;
    }

    if (isPrivate && !privatePassword.trim()) {
      setFormStatus("❌ Password wajib diisi untuk puisi pribadi!");
      setFormStatusColor("text-rose-400");
      return;
    }

    // Auto excerpt
    const plainTextStanza = collectedStanzas[0]
      ? collectedStanzas[0].replace(/<[^>]*>?/gm, " ").trim()
      : "";
    const autoExcerpt = excerpt.trim() || plainTextStanza.substring(0, 80) + "...";

    const tags = selectedTagTypes.map((type) =>
      availableTags.find((t) => t.type === type)!
    );

    const poemData: Poem = {
      id: editId || getNextId(),
      title: title.trim(),
      author: author.trim() || "Anonim",
      emoji,
      date,
      tags,
      excerpt: autoExcerpt,
      stanzas: collectedStanzas,
      lyrics: collectedLyrics,
      timestamps: collectedTimestamps,
      youtubeUrl: youtubeUrl.trim(),
      songTitle: songTitle.trim(),
      songArtist: songArtist.trim()
    };

    if (isPrivate) {
      poemData.isPrivate = true;
      poemData.password = privatePassword.trim();
    }

    let updatedList = [...poemsList];
    if (editId !== null) {
      const idx = updatedList.findIndex((p) => p.id === editId);
      if (idx > -1) {
        updatedList[idx] = poemData;
      }
    } else {
      updatedList.push(poemData);
    }

    savePoems(updatedList);
    onPoemsUpdated(updatedList);
    setFormStatus("✅ Puisi berhasil disimpan!");
    setFormStatusColor("text-emerald-400");

    setTimeout(() => {
      handleResetForm();
      setActiveTab("manage");
    }, 1500);
  };

  // Preview YouTube Song Handler
  const handleTogglePreview = () => {
    if (previewActive) {
      setPreviewActive(false);
      setPreviewVideoId(null);
      return;
    }

    const vidId = getYouTubeId(youtubeUrl);
    if (!vidId) {
      alert("⚠️ Masukkan link YouTube yang valid terlebih dahulu.");
      return;
    }

    setPreviewVideoId(vidId);
    setPreviewTitle(songTitle || "Musik Pengiring");
    setPreviewArtist(songArtist || "Preview YouTube");
    setPreviewActive(true);
  };

  // Copilot Integration inside Admin Form
  const handleAdminGenerateAI = async () => {
    const promptInput = aiPrompt.trim();
    if (!promptInput) {
      setAiStatus("⚠️ Tuliskan ide puisi untuk AI.");
      return;
    }

    setAiLoading(true);
    setAiStatus("⏳ AI sedang merangkai puisi...");

    try {
      const isAgentRouter = aiModel.startsWith("claude");
      const apiKey = isAgentRouter
        ? (import.meta as any).env.VITE_API_KEY_AGENTROUTER
        : (import.meta as any).env.VITE_API_KEY_OPENROUTER;

      if (!apiKey) {
        throw new Error("API Key tidak ditemukan di .env.local.");
      }

      const apiUrl = isAgentRouter
        ? "https://agentrouter.org/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";

      const systemInstruction = `Kamu adalah Roderikus, seorang penyair ahli yang romantis, puitis, dan sedikit melankolis. Tulisanmu adalah "sebuah novel tentang sunyi, dari manusia yang menyimpan percakapan dalam kepala". 

Tugasmu adalah membuat puisi berdasarkan topik yang diberikan.

PENTING - Aturan Output:
Berikan hasil dalam format JSON persis seperti ini, tanpa markdown block, hanya JSON murni:
{
  "judul": "Judul Puisi",
  "bait": [
    "Baris 1 bait pertama<br>Baris 2 bait pertama<br>Baris 3 bait pertama",
    "Baris 1 bait kedua<br>Baris 2 bait kedua"
  ]
}`;

      let userPrompt = `Topik: ${promptInput}`;
      const lowerPrompt = promptInput.toLowerCase();
      if (!lowerPrompt.includes("sisi") && !lowerPrompt.includes("shofia")) {
        const randomName = Math.random() > 0.5 ? "Sisi" : "Shofia";
        userPrompt += `\n(Catatan: Puisi ini ditujukan untuk ${randomName})`;
      }

      const payload = isAgentRouter
        ? {
            model: aiModel,
            messages: [
              {
                role: "user",
                content: `${systemInstruction}\n\nTopik:\n${userPrompt}`
              }
            ]
          }
        : {
            model: aiModel,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: [{ type: "text", text: userPrompt }] }
            ]
          };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();
      let reply = data.choices[0].message.content.trim();
      reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();

      const poemData = JSON.parse(reply);

      // Auto fill form fields
      setTitle(poemData.judul || "Sajak Baru");
      
      if (poemData.bait && Array.isArray(poemData.bait)) {
        const fields: StanzaField[] = poemData.bait.map((b: string, idx: number) => ({
          id: nextStanzaId.current++,
          value: b,
          lyric: "",
          timeStr: "00:00"
        }));
        setStanzas(fields);
      }

      setAiStatus("✨ Rangkaian puisi AI berhasil dimasukkan ke form!");
      setAiPrompt("");
    } catch (err: any) {
      console.error(err);
      setAiStatus(`❌ Gagal: ${err.message || err}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Settings features
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(poemsList, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.download = "roderikus_poems_backup.json";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("💾 Ekspor data berhasil!");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (Array.isArray(data)) {
          savePoems(data);
          onPoemsUpdated(data);
          showToast("✅ Data berhasil diimpor!");
        } else {
          showToast("❌ File JSON tidak valid.");
        }
      } catch (err) {
        showToast("❌ Gagal membaca file JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm("⚠️ Reset data? Puisi buatan Anda akan terhapus.")) {
      localStorage.removeItem("roderikus_poems");
      const defaults = getPoems();
      onPoemsUpdated(defaults);
      showToast("🔄 Data direset ke default.");
    }
  };

  // Publish to file data.js download
  const handlePublishFile = () => {
    const all = poemsList;
    const defaultSongsExport = defaultSongs;

    let fileStr = `// ===== Shared Poem & Song Data =====\n`;
    fileStr += `// Generated via React Admin Panel: ${new Date().toLocaleString("id-ID")}\n\n`;
    
    // Poems
    fileStr += `const defaultPoems = [\n`;
    all.forEach((p) => {
      fileStr += `  {\n`;
      fileStr += `    id: ${p.id},\n`;
      fileStr += `    title: ${JSON.stringify(p.title)},\n`;
      fileStr += `    author: ${JSON.stringify(p.author)},\n`;
      fileStr += `    emoji: ${JSON.stringify(p.emoji)},\n`;
      fileStr += `    date: ${JSON.stringify(p.date)},\n`;
      fileStr += `    tags: [\n`;
      p.tags.forEach((t) => {
        fileStr += `      { label: ${JSON.stringify(t.label)}, icon: ${JSON.stringify(t.icon)}, type: ${JSON.stringify(t.type)} },\n`;
      });
      fileStr += `    ],\n`;
      fileStr += `    excerpt: ${JSON.stringify(p.excerpt)},\n`;
      if (p.isPrivate) {
        fileStr += `    isPrivate: true,\n`;
        fileStr += `    password: ${JSON.stringify(p.password)},\n`;
      }
      fileStr += `    stanzas: [\n`;
      p.stanzas.forEach((s) => {
        fileStr += `      ${JSON.stringify(s)},\n`;
      });
      fileStr += `    ],\n`;
      fileStr += `    lyrics: [\n`;
      (p.lyrics || []).forEach((l) => {
        fileStr += `      ${JSON.stringify(l)},\n`;
      });
      fileStr += `    ],\n`;
      fileStr += `    timestamps: [\n`;
      (p.timestamps || []).forEach((t) => {
        fileStr += `      ${t},\n`;
      });
      fileStr += `    ],\n`;
      fileStr += `    songTitle: ${JSON.stringify(p.songTitle)},\n`;
      fileStr += `    songArtist: ${JSON.stringify(p.songArtist)},\n`;
      fileStr += `    youtubeUrl: ${JSON.stringify(p.youtubeUrl)}\n`;
      fileStr += `  },\n`;
    });
    fileStr += `];\n\n`;

    // Songs
    fileStr += `const defaultSongs = [\n`;
    defaultSongsExport.forEach((s) => {
      fileStr += `  {\n`;
      fileStr += `    title: ${JSON.stringify(s.title)},\n`;
      fileStr += `    artist: ${JSON.stringify(s.artist)},\n`;
      fileStr += `    icon: ${JSON.stringify(s.icon)},\n`;
      fileStr += `    youtubeUrl: ${JSON.stringify(s.youtubeUrl)}\n`;
      fileStr += `  },\n`;
    });
    fileStr += `];\n\n`;

    fileStr += `// Export variables and logic for compatibility\n`;
    fileStr += `const ADMIN_PASSWORD = "admin2026";\n`;
    fileStr += `const STORAGE_KEY = "roderikus_poems";\n`;

    const blob = new Blob([fileStr], { type: "application/javascript" });
    const link = document.createElement("a");
    link.download = "data.js";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("📝 File data.js berhasil digenerate!");
  };

  // Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-left font-body">
        <form onSubmit={handleLogin} className="border border-white/10 rounded-2xl bg-stone-950/40 p-6 md:p-8 space-y-5 shadow-2xl backdrop-blur-md">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-rose-500 text-5xl font-fill animate-pulse">
              lock
            </span>
            <h3 className="font-display text-2xl text-starlight font-bold">Admin Panel Login</h3>
            <p className="text-xs text-mist/60">
              Silakan masukkan kata sandi Anda untuk mengakses dashboard pengelolaan antologi puisi.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              placeholder="Kata Sandi Admin..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-starlight outline-none focus:border-rose-400/50 placeholder:text-mist/20"
            />
          </div>

          {loginError && (
            <div className="text-center text-xs text-rose-400 font-semibold animate-shake">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-rose-600/30 text-rose-200 border border-rose-500/30 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-label-caps uppercase tracking-wider transition-all cursor-pointer font-semibold shadow-lg shadow-rose-950/10"
          >
            Masuk Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full h-full text-left font-body text-mist select-text">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 mb-6 gap-4">
        <div>
          <h2 className="font-display text-2.5xl md:text-3.5xl text-starlight font-bold tracking-wide">
            🛠️ Admin Dashboard
          </h2>
          <p className="text-xs text-mist/50">Kelola bait antologi puisi, lirik, dan musik pengiring</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold text-rose-400 hover:text-rose-300 font-label-caps uppercase transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">logout</span>
          <span>Logout</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/3 border border-white/5 p-4 rounded-xl text-center space-y-1">
          <div className="text-lg">📚</div>
          <div className="font-display text-2.5xl font-bold text-starlight">{stats.total}</div>
          <div className="text-[10px] text-mist/40 uppercase font-semibold">Total Puisi</div>
        </div>
        <div className="bg-white/3 border border-white/5 p-4 rounded-xl text-center space-y-1">
          <div className="text-lg">📖</div>
          <div className="font-display text-2.5xl font-bold text-emerald-400">{stats.pub}</div>
          <div className="text-[10px] text-mist/40 uppercase font-semibold">Publik</div>
        </div>
        <div className="bg-white/3 border border-white/5 p-4 rounded-xl text-center space-y-1">
          <div className="text-lg">🔒</div>
          <div className="font-display text-2.5xl font-bold text-rose-400">{stats.priv}</div>
          <div className="text-[10px] text-mist/40 uppercase font-semibold">Pribadi</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 text-xs font-semibold tracking-wider font-label-caps border-b-2 transition-all ${
            activeTab === "manage" ? "border-primary text-primary" : "border-transparent text-mist/60 hover:text-mist"
          }`}
        >
          Kelola Puisi
        </button>
        <button
          onClick={() => {
            handleResetForm();
            setActiveTab("create");
          }}
          className={`px-4 py-2 text-xs font-semibold tracking-wider font-label-caps border-b-2 transition-all ${
            activeTab === "create" ? "border-primary text-primary" : "border-transparent text-mist/60 hover:text-mist"
          }`}
        >
          {editId !== null ? "Edit Puisi" : "Puisi Baru"}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-xs font-semibold tracking-wider font-label-caps border-b-2 transition-all ${
            activeTab === "settings" ? "border-primary text-primary" : "border-transparent text-mist/60 hover:text-mist"
          }`}
        >
          Pengaturan
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "manage" && (
        <div className="space-y-3">
          {poemsList.length === 0 ? (
            <div className="text-center py-16 text-mist/50 font-serif italic border border-white/5 rounded-xl">
              Belum ada puisi. Mulai buat puisi pertama Anda!
            </div>
          ) : (
            [...poemsList]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((poem) => (
                <div
                  key={poem.id}
                  className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                      {poem.isPrivate ? "🔒" : poem.emoji}
                    </div>
                    <div>
                      <div className="font-medium text-starlight text-sm">
                        {poem.title}{" "}
                        {poem.isPrivate && (
                          <span className="text-[8px] bg-rose-950/40 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded-full uppercase ml-1.5">
                            Private
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-mist/40 mt-0.5">
                        ✍️ {poem.author} · 📅 {poem.date} · 📜 {poem.stanzas.length} bait
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPoem(poem)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-primary transition-all cursor-pointer"
                      title="Edit Puisi"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeletePoem(poem.id)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-rose-400 transition-all cursor-pointer"
                      title="Hapus Puisi"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {activeTab === "create" && (
        <div className="space-y-6">
          
          {/* AI Copilot card inside editor */}
          <div className="border border-primary/20 rounded-2xl bg-primary/2 p-4 md:p-6 space-y-4 shadow-md">
            <h4 className="text-xs font-semibold font-label-caps text-primary tracking-widest flex items-center gap-1.5 uppercase">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>AI Copilot Asisten</span>
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                placeholder="Tulis topik puisi di sini... (contoh: Sisi tentang menari di bawah rasi bintang, atau Shofia memetik melati saat gerimis)"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiLoading}
                className="flex-1 bg-stone-900 border border-white/10 p-3 rounded-xl text-xs text-starlight outline-none placeholder:text-mist/20 h-16 resize-none font-sans"
              />
              <div className="flex flex-col gap-2 justify-between">
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  disabled={aiLoading}
                  className="bg-stone-900 border border-white/10 rounded-xl p-2 text-[10px] text-starlight outline-none font-sans cursor-pointer"
                >
                  <option value="openrouter/auto">Owl Alpha</option>
                  <option value="claude-3.5-sonnet">Claude 3.5</option>
                </select>
                <button
                  type="button"
                  onClick={handleAdminGenerateAI}
                  disabled={aiLoading}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-fixed text-deep-navy font-bold text-[10px] font-label-caps uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {aiLoading ? "Memproses..." : "Generate AI"}
                </button>
              </div>
            </div>
            {aiStatus && (
              <p className="text-[10px] text-primary/80 font-serif italic">{aiStatus}</p>
            )}
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase">
                Judul Puisi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul Puisi..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-starlight outline-none focus:border-primary/50"
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase">
                Penulis (Author)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nama Penulis..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-starlight outline-none focus:border-primary/50"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-starlight outline-none focus:border-primary/50"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase">
                Kutipan (Excerpt - opsional)
              </label>
              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Kutipan singkat puisi..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-starlight outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Emoji Picker */}
          <div className="space-y-2">
            <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase block">
              Emoji Ikon ({emoji})
            </label>
            <div className="flex flex-wrap gap-2">
              {availableEmojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-lg p-2 rounded-lg border transition-all cursor-pointer ${
                    emoji === e ? "bg-primary border-primary text-deep-navy" : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Picker */}
          <div className="space-y-2">
            <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase block">
              Pilih Kategori Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((t) => {
                const selected = selectedTagTypes.includes(t.type);
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleToggleTag(t.type)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer font-sans ${
                      selected
                        ? "bg-secondary border-secondary text-deep-navy font-semibold"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Music Selector */}
          <div className="border border-white/5 rounded-2xl bg-white/2 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase block">
                  Pilih Lagu Latar
                </label>
                <select
                  value={songSelect}
                  onChange={(e) => handleSongDropdownChange(e.target.value)}
                  className="w-full bg-stone-900 border border-white/10 rounded-xl p-3 text-xs text-starlight outline-none cursor-pointer font-sans"
                >
                  <option value="">Tanpa musik pengiring</option>
                  {defaultSongs.map((s, idx) => (
                    <option key={idx} value={`default_${idx}`}>
                      {s.icon} {s.title} — {s.artist}
                    </option>
                  ))}
                  <option value="custom">✦ Link Lagu YouTube Kustom ✦</option>
                </select>
              </div>

              {songSelect && (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleTogglePreview}
                    className="px-5 py-3 border border-secondary/20 hover:border-secondary hover:bg-secondary/5 text-secondary hover:text-white rounded-xl text-xs font-semibold font-label-caps uppercase transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {previewActive ? "pause" : "play_arrow"}
                    </span>
                    <span>{previewActive ? "Stop Preview" : "Preview Lagu"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Custom Song Input Fields */}
            {songSelect === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/5 animate-fade-in-up">
                <div className="space-y-2">
                  <label className="text-[10px] text-mist/50 font-sans uppercase">YouTube URL / Video ID</label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-starlight outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-mist/50 font-sans uppercase">Judul Lagu</label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Judul Lagu..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-starlight outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-mist/50 font-sans uppercase">Artis</label>
                  <input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder="Artis..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-starlight outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            )}

            {/* Invisible Preview Player */}
            {previewActive && previewVideoId && (
              <div className="p-3 bg-stone-900 border border-white/5 rounded-xl flex items-center justify-between gap-3 animate-fade-in-up font-sans">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary animate-pulse">music_note</span>
                  <div>
                    <div className="text-xs text-starlight font-semibold">{previewTitle}</div>
                    <div className="text-[10px] text-mist/40">{previewArtist}</div>
                  </div>
                </div>
                {/* Embed player */}
                <iframe
                  width="1"
                  height="1"
                  src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
                  title="YouTube Preview"
                  allow="autoplay"
                  className="opacity-0 pointer-events-none absolute"
                />
              </div>
            )}
          </div>

          {/* Private lock field */}
          <div className="border border-white/5 rounded-2xl bg-white/2 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="poemPrivateCheck"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="poemPrivateCheck" className="text-xs font-semibold text-starlight cursor-pointer select-none">
                🔒 Jadikan Puisi Pribadi (Kunci dengan Kata Sandi)
              </label>
            </div>

            {isPrivate && (
              <div className="space-y-2 max-w-sm animate-fade-in-up">
                <label className="text-[10px] text-mist/50 font-sans uppercase block">Kata Sandi Pembuka Kunci</label>
                <input
                  type="password"
                  value={privatePassword}
                  onChange={(e) => setPrivatePassword(e.target.value)}
                  placeholder="Kata Sandi..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-starlight outline-none focus:border-primary/50"
                />
              </div>
            )}
          </div>

          {/* Stanzas Editor */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs text-mist/60 font-semibold tracking-wider font-sans uppercase">
                Bait-Bait Puisi & Lirik
              </label>
              <button
                type="button"
                onClick={handleAddStanzaField}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs font-semibold text-primary rounded-lg transition-all cursor-pointer font-sans"
              >
                <span>➕</span>
                <span>Tambah Bait</span>
              </button>
            </div>

            <div className="space-y-4">
              {stanzas.map((stanza, idx) => (
                <div
                  key={stanza.id}
                  className="border border-white/5 rounded-2xl bg-stone-900/40 p-4 md:p-5 space-y-3 relative"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-2.5">
                    <span className="text-xs font-semibold font-label-caps text-secondary tracking-widest uppercase">
                      Bait {idx + 1}
                    </span>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <div className="flex items-center gap-1.5 text-[10px] text-mist/50">
                        <span>Lirik:</span>
                        <input
                          type="text"
                          value={stanza.lyric}
                          onChange={(e) => handleUpdateStanzaField(stanza.id, "lyric", e.target.value)}
                          placeholder="Lirik lagunya..."
                          className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-starlight outline-none w-36 focus:border-primary/50"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-mist/50">
                        <span>Sync:</span>
                        <input
                          type="text"
                          value={stanza.timeStr}
                          onChange={(e) => handleUpdateStanzaField(stanza.id, "timeStr", e.target.value)}
                          placeholder="MM:SS"
                          className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-starlight outline-none w-14 text-center focus:border-primary/50"
                        />
                      </div>

                      {stanzas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStanzaField(stanza.id)}
                          className="text-mist/40 hover:text-rose-400 text-xs p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* HTML Edit Input */}
                  <textarea
                    rows={4}
                    placeholder="Tulis bait di sini... (gunakan <br/> untuk baris baru)"
                    value={stanza.value}
                    onChange={(e) => handleUpdateStanzaField(stanza.id, "value", e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm md:text-base text-stone-100 font-poem leading-relaxed outline-none focus:ring-0 resize-none italic"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleSavePoem}
              className="px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-fixed hover:to-indigo-500 text-deep-navy font-bold rounded-xl text-xs font-label-caps uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-primary/10"
            >
              Simpan Puisi
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-mist hover:text-starlight rounded-xl text-xs font-semibold font-label-caps uppercase transition-all cursor-pointer"
            >
              Reset Form
            </button>
          </div>

          {/* Form Status */}
          {formStatus && (
            <div className={`text-xs font-semibold p-3 bg-white/2 border border-white/5 rounded-xl text-center ${formStatusColor} animate-fade-in-up`}>
              {formStatus}
            </div>
          )}

        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6 max-w-xl">
          
          {/* GitHub Publish Action */}
          <div className="border border-white/5 p-5 rounded-2xl bg-white/2 space-y-2">
            <h4 className="text-sm font-semibold text-starlight">Publish ke GitHub</h4>
            <p className="text-xs text-mist/50 leading-relaxed">
              Unduh berkas `data.js` yang baru berdasarkan perubahan puisi yang telah Anda buat. Anda perlu mengganti file `data.js` asli Anda di dalam proyek dengan berkas yang baru diunduh, lalu lakukan git push ke GitHub.
            </p>
            <div className="pt-2">
              <button
                onClick={handlePublishFile}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-fixed hover:to-indigo-500 text-deep-navy font-bold rounded-xl text-xs font-label-caps uppercase tracking-wider cursor-pointer transition-all shadow-md shadow-primary/10"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Unduh data.js Terbaru</span>
              </button>
            </div>
          </div>

          {/* Backup Import/Export */}
          <div className="border border-white/5 p-5 rounded-2xl bg-white/2 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-starlight">Cadangkan & Impor Data (JSON)</h4>
              <p className="text-xs text-mist/50 leading-relaxed">
                Anda dapat mengekspor seluruh basis data puisi Anda dalam berkas cadangan JSON, atau mengimpor data lama dari berkas JSON cadangan yang sudah ada.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-mist hover:text-starlight cursor-pointer transition-all"
              >
                📥 Ekspor Data
              </button>
              
              <label className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-mist hover:text-starlight cursor-pointer transition-all select-none">
                📤 Impor Data
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset data */}
          <div className="border border-red-500/10 p-5 rounded-2xl bg-red-950/2 space-y-3">
            <h4 className="text-sm font-semibold text-red-400">Pusat Bahaya (Danger Zone)</h4>
            <p className="text-xs text-mist/50 leading-relaxed">
              Reset basis data lokal Anda ke kondisi awal (puisi bawaan default dari Roderikus Poetry). Semua puisi yang ditambahkan melalui admin akan terhapus.
            </p>
            <div>
              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/35 rounded-xl text-xs font-semibold font-label-caps uppercase cursor-pointer transition-all"
              >
                🚨 Reset ke Default
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
