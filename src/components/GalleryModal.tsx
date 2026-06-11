import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";

interface GalleryModalProps {
  showToast: (msg: string) => void;
}

interface PhotoItem {
  src: string;
  rotation: number;
  size: "sm" | "md" | "lg";
  decor: "pin" | "tape" | "none";
  marginClass: string;
}

// Generate the 121 photo filenames (MMJ04639 to MMJ04762, minus exclusions)
const ALL_PHOTOS = (() => {
  const list: string[] = [];
  const start = 4639;
  const end = 4762;
  const excluded = [4742, 4749, 4750];
  
  for (let i = start; i <= end; i++) {
    if (!excluded.includes(i)) {
      list.push(`/Aset/MMJ0${i}.jpg`);
    }
  }
  return list;
})();

export default function GalleryModal({ showToast }: GalleryModalProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Initialize and shuffle photo styles on mount so they don't change on every re-render
  useEffect(() => {
    // Shuffle the photo list
    const shuffled = [...ALL_PHOTOS].sort(() => Math.random() - 0.5);

    const sizes: Array<"sm" | "md" | "lg"> = ["sm", "md", "lg"];
    const decors: Array<"pin" | "tape" | "none"> = ["pin", "tape", "none"];
    const margins = [
      "mt-2 mr-2", "mt-4 ml-3", "mt-1 mr-4", "mt-3 ml-2",
      "mb-2 ml-4", "mb-4 mr-3", "mb-1 ml-2", "mb-3 mr-4"
    ];

    const items: PhotoItem[] = shuffled.map((src, idx) => {
      // Use index to deterministically distribute sizes & decors but look random
      const randVal = Math.sin(idx + 1) * 10000;
      const rotation = ((randVal - Math.floor(randVal)) * 24) - 12; // -12deg to +12deg
      
      const sizeIndex = Math.abs(Math.floor(randVal * 10)) % sizes.length;
      const decorIndex = Math.abs(Math.floor(randVal * 100)) % decors.length;
      const marginIndex = Math.abs(Math.floor(randVal * 1000)) % margins.length;

      return {
        src,
        rotation,
        size: sizes[sizeIndex],
        decor: decors[decorIndex],
        marginClass: margins[marginIndex]
      };
    });

    setPhotos(items);
  }, []);

  const visiblePhotos = useMemo(() => {
    return photos.slice(0, visibleCount);
  }, [photos, visibleCount]);

  // Handle Load More
  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 8, photos.length));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, photos]);

  // Polaroid collage PNG generator
  const handleDownloadCollage = async () => {
    if (photos.length === 0) return;
    showToast("Sedang merangkai kolase foto Anda...");

    // Pick 9 random photos
    const collagePhotos = [...photos].sort(() => Math.random() - 0.5).slice(0, 9);

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "1080px";
    tempDiv.style.height = "1350px";
    tempDiv.style.minWidth = "1080px";
    tempDiv.style.maxWidth = "1080px";
    tempDiv.style.minHeight = "1350px";
    tempDiv.style.maxHeight = "1350px";
    tempDiv.style.backgroundImage = "url('/BG_kolase.webp')";
    tempDiv.style.backgroundSize = "1080px 1350px";
    tempDiv.style.backgroundPosition = "center";
    tempDiv.style.overflow = "hidden";
    tempDiv.style.boxSizing = "border-box";

    // Build the Polaroid markup
    const polaroidsHTML = collagePhotos.map((p, idx) => {
      // Define coordinates inside a 1080x1350 canvas
      const positions = [
        { left: 100, top: 120 },
        { left: 420, top: 90 },
        { left: 730, top: 150 },
        { left: 80, top: 520 },
        { left: 400, top: 480 },
        { left: 710, top: 560 },
        { left: 120, top: 910 },
        { left: 430, top: 870 },
        { left: 740, top: 930 }
      ];
      
      const pos = positions[idx];
      const left = pos.left + (Math.sin(idx * 1.7) * 40);
      const top = pos.top + (Math.cos(idx * 2.3) * 40);
      const rotate = p.rotation;

      // Tape or pin styling matching vintage theme
      let decorHTML = "";
      if (p.decor === "pin") {
        decorHTML = `
          <div style="
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            width: 14px;
            height: 14px;
            background: linear-gradient(135deg, #d2c888, #f5d061);
            border: 1px solid rgba(255,255,255,0.4);
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 10;
          "></div>
        `;
      } else if (p.decor === "tape") {
        decorHTML = `
          <div style="
            position: absolute;
            top: -18px;
            left: 50%;
            transform: translateX(-50%) rotate(${(Math.sin(idx) * 8)}deg);
            width: 70px;
            height: 20px;
            background: rgba(250, 246, 238, 0.25);
            backdrop-filter: blur(1px);
            border-left: 1px dashed rgba(210, 200, 136, 0.3);
            border-right: 1px dashed rgba(210, 200, 136, 0.3);
            z-index: 10;
          "></div>
        `;
      }

      return `
        <div style="
          position: absolute;
          left: ${left}px;
          top: ${top}px;
          transform: rotate(${rotate}deg);
          width: 250px;
          background: #FAF6EE;
          padding: 12px 12px 30px 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          border: 1px solid rgba(210, 200, 136, 0.15);
          box-sizing: border-box;
        ">
          ${decorHTML}
          <div style="
            width: 100%;
            height: 210px;
            overflow: hidden;
            background-color: #1e1e1e;
            background-image: url('${p.src}');
            background-size: cover;
            background-position: center;
          ">
          </div>
          <div style="
            margin-top: 15px;
            font-family: 'Caveat', 'Dancing Script', cursive, serif;
            font-size: 15px;
            color: #5d4037;
            font-weight: 600;
            text-align: center;
          ">
            ✦ Kenangan Indah #${idx + 1} ✦
          </div>
        </div>
      `;
    }).join("");

    tempDiv.innerHTML = `
      <!-- Overlay vignette -->
      <div style="
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.5) 100%);
        pointer-events: none;
      "></div>

      <!-- Render Polaroid Items -->
      ${polaroidsHTML}

      <!-- Watermark / Footer -->
      <div style="
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        letter-spacing: 0.25em;
        color: #d2c888;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        text-transform: uppercase;
      ">
        Roderikus Poetry · Kolase Kenangan Abadi
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        width: 1080,
        height: 1350,
        backgroundColor: null,
        scale: 1, // Fixed to 1 to prevent device-pixel-ratio warping
        useCORS: true
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Kolase_Kenangan_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Kolase foto berhasil diunduh!");
    } catch (err) {
      console.error(err);
      showToast("Gagal merangkai kolase foto.");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <div className="w-full h-full text-left font-body">
      
      {/* Intro */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-1">
          <span className="material-symbols-outlined text-secondary text-3xl font-fill animate-pulse">
            photo_library
          </span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl text-starlight tracking-wider font-bold">
          Kolase Kenangan
        </h2>
        <p className="text-stone-300/80 font-serif italic text-xs md:text-sm max-w-prose mx-auto">
          "Mengumpulkan setiap tawa, warna senja, dan cerita yang pernah merajut kebersamaan kita"
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-3 pt-3">
          <button
            onClick={handleDownloadCollage}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-secondary/25 to-primary/25 border border-secondary/35 rounded-full text-xs font-semibold text-secondary hover:text-starlight hover:from-secondary/45 hover:to-primary/45 transition-all font-label-caps cursor-pointer shadow-lg shadow-secondary/5"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome_motion</span>
            <span>Rangkai & Unduh Kolase</span>
          </button>
        </div>
      </div>

      {/* Messy Polaroid Grid */}
      <div className="relative min-h-[400px] bg-stone-950/25 border border-white/5 rounded-2xl p-6 md:p-10 shadow-inner overflow-hidden mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center items-center">
          {visiblePhotos.map((photo, index) => {
            let decorElement = null;
            if (photo.decor === "pin") {
              decorElement = (
                <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 bg-gradient-to-br from-[#d2c888] to-[#f5d061] border border-white/20 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] z-10" />
              );
            } else if (photo.decor === "tape") {
              decorElement = (
                <div 
                  className="absolute top-[-16px] left-1/2 transform -translate-x-1/2 w-16 h-5 bg-[#FAF6EE]/20 backdrop-blur-[1px] border-l border-r border-dashed border-[#d2c888]/30 z-10"
                  style={{ transform: `translateX(-50%) rotate(${Math.sin(index) * 6}deg)` }}
                />
              );
            }

            // Map sizes to tailwind width classes
            const widthClass = photo.size === "sm" ? "w-[130px] sm:w-[150px]" : photo.size === "md" ? "w-[145px] sm:w-[170px]" : "w-[160px] sm:w-[190px]";

            return (
              <motion.div
                key={photo.src}
                onClick={() => setLightboxIndex(index)}
                style={{ rotate: `${photo.rotation}deg` }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: `${photo.rotation * 0.4}deg`, 
                  zIndex: 20,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
                }}
                className={`relative bg-[#FAF6EE] p-3 pb-8 rounded-sm shadow-xl border border-[#d2c888]/20 cursor-pointer transform transition-all ${widthClass} ${photo.marginClass}`}
              >
                {decorElement}
                
                {/* Image block */}
                <div className="aspect-[4/5] bg-stone-900 overflow-hidden rounded-xs">
                  <img
                    src={photo.src}
                    alt={`Kenangan #${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover filter brightness-[0.9] hover:brightness-100 transition-all duration-300"
                  />
                </div>
                
                {/* Note details */}
                <div 
                  style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}
                  className="text-center text-[13px] sm:text-sm text-[#5d4037] font-semibold mt-3 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  ✦ Kenangan #{photos.indexOf(photo) + 1} ✦
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load more footer */}
        {visibleCount < photos.length && (
          <div className="text-center pt-10">
            <button
              onClick={handleLoadMore}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-mist hover:text-starlight transition-all cursor-pointer font-label-caps"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              <span>Muat Lebih Banyak ({photos.length - visibleCount} lagi)</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
          >
            {/* Close handler on click backdrop */}
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => setLightboxIndex(null)} />

            {/* Top Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 material-symbols-outlined text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer z-10"
            >
              close
            </button>

            {/* Left Nav */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))}
              className="absolute left-4 md:left-8 material-symbols-outlined text-white/60 hover:text-white text-4xl p-2 rounded-full hover:bg-white/5 cursor-pointer z-10"
            >
              chevron_left
            </button>

            {/* Lightbox Photo Card */}
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              className="relative max-w-full max-h-[85vh] flex flex-col items-center bg-[#FAF6EE] p-4 pb-12 rounded-sm shadow-2xl z-10 border border-[#d2c888]/20 select-text"
            >
              <img
                src={photos[lightboxIndex].src}
                alt={`Lightbox Kenangan #${lightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-xs"
              />
              <div 
                style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}
                className="text-center text-base md:text-lg text-[#5d4037] mt-4 font-semibold"
              >
                ✦ Kenangan Abadi #{photos.indexOf(photos[lightboxIndex]) + 1} dari {photos.length} ✦
              </div>
            </motion.div>

            {/* Right Nav */}
            <button
              onClick={() => setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 md:right-8 material-symbols-outlined text-white/60 hover:text-white text-4xl p-2 rounded-full hover:bg-white/5 cursor-pointer z-10"
            >
              chevron_right
            </button>

            {/* Bottom Counter */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-stone-900/60 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/80 font-label-caps uppercase select-none font-semibold">
              Foto {lightboxIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
