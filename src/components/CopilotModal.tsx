import React, { useState } from "react";
import { Poem } from "../types";
import { getNextId } from "../data/poetryData";

interface CopilotModalProps {
  onPoemGenerated: (newPoem: Poem) => void;
  showToast: (msg: string) => void;
}

export default function CopilotModal({ onPoemGenerated, showToast }: CopilotModalProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("openrouter/auto");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState("text-mist");

  const handleGenerate = async () => {
    const promptInput = prompt.trim();
    if (!promptInput) {
      setStatus("⚠️ Masukkan topik atau inspirasi puisi untuk AI.");
      setStatusColor("text-rose-400");
      return;
    }

    setLoading(true);
    setStatus("⏳ AI sedang merangkai bait-bait puisi untuk Anda...");
    setStatusColor("text-secondary");

    try {
      const isAgentRouter = model.startsWith("claude");
      
      // Get API Keys from Vite Env
      const apiKey = isAgentRouter
        ? (import.meta as any).env.VITE_API_KEY_AGENTROUTER
        : (import.meta as any).env.VITE_API_KEY_OPENROUTER;

      if (!apiKey) {
        throw new Error(
          `API Key untuk ${isAgentRouter ? "AgentRouter" : "OpenRouter"} tidak ditemukan di berkas lingkungan (.env.local).`
        );
      }

      const apiUrl = isAgentRouter
        ? "https://agentrouter.org/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";

      const systemInstruction = `Kamu adalah Roderikus, seorang penyair ahli yang romantis, puitis, dan sedikit melankolis. Tulisanmu adalah "sebuah novel tentang sunyi, dari manusia yang menyimpan percakapan dalam kepala". 

Tugasmu adalah membuat puisi berdasarkan topik yang diberikan.

PENTING - KONTEKS KHUSUS:
Jika topik berkaitan dengan atau menyebut nama "Sisi":
Gunakan metafora seni, musik, dan kupu-kupu. Pesan utamanya adalah kebahagiaan, harapan, dan membebaskannya dari cerita duka.
JUDUL PUISI: Judul puisi WAJIB memuat nama "Sisi" (contoh: "Untuk Sisi", "Sisi", dll).

Jika topik berkaitan dengan atau menyebut nama "Shofia":
Gunakan metafora hujan, ruang gelap, dan penyembuhan. Pesan utamanya adalah bagaimana kehadirannya adalah obat tak terduga untuk luka yang disembunyikan.
JUDUL PUISI: Judul puisi WAJIB memuat nama "Shofia" (contoh: "Untuk Shofia", "Shofia", dll).

Aturan Output:
Berikan hasil dalam format JSON persis seperti ini, tanpa markdown block, hanya JSON murni:
{
  "judul": "Judul Puisi",
  "bait": [
    "Baris 1 bait pertama<br>Baris 2 bait pertama<br>Baris 3 bait pertama",
    "Baris 1 bait kedua<br>Baris 2 bait kedua<br>Baris 3 bait kedua"
  ]
}
Setiap bait harus berupa string tunggal, dan gunakan <br> untuk pindah baris dalam bait tersebut. Jangan tambahkan penjelasan lain.`;

      let userPrompt = `Topik: ${promptInput}`;
      
      // Assign Sisi/Shofia if not mentioned
      const lowerPrompt = promptInput.toLowerCase();
      if (!lowerPrompt.includes("sisi") && !lowerPrompt.includes("shofia")) {
        const randomName = Math.random() > 0.5 ? "Sisi" : "Shofia";
        userPrompt += `\n(Catatan: Puisi ini harus secara khusus ditujukan untuk ${randomName})`;
      }

      const contentArr = [{ type: "text", text: userPrompt }];

      const payload = isAgentRouter
        ? {
            model: model,
            messages: [
              {
                role: "user",
                content: `${systemInstruction}\n\nTopik:\n${userPrompt}`
              }
            ]
          }
        : {
            model: model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: contentArr }
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

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      let reply = data.choices[0].message.content.trim();
      
      // Cleanup markdown block wrappers
      reply = reply.replace(/```json/gi, "").replace(/```/g, "").trim();

      const poemData = JSON.parse(reply);

      if (!poemData.judul || !poemData.bait) {
        throw new Error("Format respon JSON AI tidak valid (judul/bait kosong).");
      }

      const newPoem: Poem = {
        id: getNextId(),
        title: poemData.judul || "Sajak Rahasia",
        author: "AI Copilot",
        emoji: "✨",
        date: new Date().toISOString().split("T")[0],
        tags: [{ label: "Mimpi", icon: "✨", type: "dream" }],
        excerpt:
          poemData.bait[0]?.replace(/<[^>]*>?/gm, " ").substring(0, 80) + "...",
        stanzas: poemData.bait,
        songTitle: "",
        songArtist: "",
        youtubeUrl: ""
      };

      onPoemGenerated(newPoem);
      setPrompt("");
      setStatus("✨ Puisi indah berhasil dirangkai dan disimpan!");
      setStatusColor("text-emerald-400");
      showToast("Puisi AI berhasil ditambahkan!");
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Gagal merangkai puisi: ${err.message || err}`);
      setStatusColor("text-rose-400");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full text-left font-body">
      {/* Intro */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-violet-500/20 via-cyan-400/20 to-amber-300/20 border border-white/20 mb-1 shadow-[0_0_20px_rgba(167,139,250,0.3)]">
          <span className="material-symbols-outlined text-primary text-3xl font-fill animate-pulse">
            psychology
          </span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-wider text-shimmer-cosmic">
          AI Copilot Sajak
        </h2>
        <p className="text-stone-300/80 font-poem italic text-sm md:text-base max-w-prose mx-auto kinetic-tracking">
          "Bicaralah pada angin malam, biarkan kecerdasan buatan merangkai kata sunyi yang menyembuhkan"
        </p>
      </div>

      <div className="max-w-xl mx-auto glass-award p-6 md:p-8 space-y-5 shadow-2xl rounded-3xl border border-white/10">
        
        {/* Preset Prompt Chips */}
        <div className="space-y-2">
          <label className="text-[10px] text-mist/60 font-semibold tracking-widest font-mono uppercase block">
            ✦ Inspiration Chips (Ketuk untuk Menggunakan):
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "Rindu Sisi dalam Metafora Kupu-Kupu 🦋",
              "Penyembuhan Luka Bersama Shofia di Hujan Sore 🌧️",
              "Bintang Jatuh di Langit Midnight Garden ✨",
              "Sepiring Roti & Cangkir Kopi Malam Sunyi ☕"
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(chip)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-secondary/20 border border-white/10 hover:border-secondary/40 text-[10px] text-stone-300 hover:text-secondary transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-2">
          <label className="text-xs text-mist/70 font-semibold tracking-wider uppercase font-mono">
            Inspirasi Puisi / Topik
          </label>
          <textarea
            rows={3}
            placeholder="Tulis topik atau suasana... (contoh: Hujan sore hari yang tenang bersama kenangan masa kecil, atau sebut nama Sisi/Shofia)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            className="w-full bg-stone-950/60 border border-white/15 rounded-xl p-3.5 text-xs text-starlight outline-none focus:border-secondary/60 placeholder:text-mist/30 resize-none font-sans transition-all"
          />
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs text-mist/70 font-semibold tracking-wider uppercase font-mono">
            Model Kecerdasan AI
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading}
            className="w-full bg-stone-950/80 border border-white/15 rounded-xl p-3 text-xs text-starlight outline-none focus:border-secondary/60 cursor-pointer font-sans"
          >
            <option value="openrouter/auto">Owl Alpha (Rekomendasi Default)</option>
            <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (AgentRouter)</option>
            <option value="google/gemma-2-9b-it:free">Gemma 2 9B (Free)</option>
            <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B (Free)</option>
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 text-stone-950 font-bold rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_25px_rgba(243,229,171,0.4)] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              <span>Sedang Merangkai Bait...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Rangkai Puisi Baru</span>
            </>
          )}
        </button>

        {/* Status */}
        {status && (
          <div className={`text-center text-xs p-3 rounded-xl bg-stone-950/80 border border-white/10 ${statusColor} animate-fade-in-up font-poem italic tracking-wide`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
