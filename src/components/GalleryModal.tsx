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

    // Promise preloader to ensure html2canvas renders background and photos properly
    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve anyway to avoid blocking
      });
    };

    // Preload background and all photos
    try {
      await Promise.all([
        preloadImage("/HDR_background.webp"),
        ...collagePhotos.map(p => preloadImage(p.src))
      ]);
    } catch (e) {
      console.warn("Preloading images encountered an issue:", e);
    }

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
    tempDiv.style.overflow = "hidden";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.backgroundColor = "#030712";

    // Build the Polaroid markup
    const polaroidsHTML = collagePhotos.map((p, idx) => {
      // Define coordinates inside a 1080x1350 canvas for a tightly packed, overlapping look without empty bottom space
      const positions = [
        { left: 70, top: 60 },
        { left: 380, top: 40 },
        { left: 690, top: 70 },
        { left: 45, top: 460 },
        { left: 375, top: 440 },
        { left: 695, top: 450 },
        { left: 80, top: 865 },
        { left: 385, top: 850 },
        { left: 690, top: 860 }
      ];
      
      const pos = positions[idx];
      const left = pos.left + (Math.sin(idx * 1.7) * 20);
      const top = pos.top + (Math.cos(idx * 2.3) * 20);
      const rotate = p.rotation;

      // Every image uses vertical ratio (350px image height)
      const imageHeight = 350;

      // Tape or pin styling matching celestial/midnight theme (no glow shadows)
      let decorHTML = "";
      if (p.decor === "pin") {
        decorHTML = `
          <div style="
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 12px;
            background: linear-gradient(135deg, #ffffff, #efe4a2, #d2c888);
            border: 1px solid rgba(255,255,255,0.6);
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
            z-index: 10;
          "></div>
        `;
      } else if (p.decor === "tape") {
        decorHTML = `
          <div style="
            position: absolute;
            top: -14px;
            left: 50%;
            transform: translateX(-50%) rotate(${(Math.sin(idx) * 8)}deg);
            width: 70px;
            height: 18px;
            background: rgba(255, 255, 255, 0.15);
            border-left: 1px dashed rgba(255,255,255,0.4);
            border-right: 1px dashed rgba(255,255,255,0.4);
            z-index: 10;
          "></div>
        `;
      }

      // Note: z-index: 10 on the container makes sure the photo cards sit on top of the background gradient overlay (z-index: 1)
      return `
        <div style="
          position: absolute;
          left: ${left}px;
          top: ${top}px;
          transform: rotate(${rotate}deg);
          width: 310px;
          background: linear-gradient(180deg, #171b2a 0%, #0a0d1c 100%);
          padding: 15px 15px 35px 15px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.6);
          border: 1.5px solid rgba(210, 200, 136, 0.25);
          border-radius: 8px;
          box-sizing: border-box;
          z-index: 10;
        ">
          ${decorHTML}
          <div style="
            width: 100%;
            height: ${imageHeight}px;
            overflow: hidden;
            background-color: #0d1b3d;
            background-image: url('${p.src}');
            background-size: cover;
            background-position: center;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          ">
          </div>
          <div style="
            margin-top: 18px;
            font-family: 'Caveat', 'Dancing Script', cursive, serif;
            font-size: 18px;
            color: #d2c888;
            font-weight: 600;
            text-align: center;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          ">
            ✦ Kenangan Indah #${idx + 1} ✦
          </div>
        </div>
      `;
    }).join("");

    // Generate 60 random sparkling stars (no glow effects, just clean opacity)
    let starsHTML = "";
    for (let i = 0; i < 60; i++) {
      const starLeft = Math.random() * 100;
      const starTop = Math.random() * 100;
      const starSize = Math.random() * 2.5 + 1; // 1px to 3.5px
      const starOpacity = Math.random() * 0.8 + 0.2;
      const isGold = Math.random() > 0.7;
      const color = isGold ? "#efe4a2" : "#ffffff";
      
      starsHTML += `
        <div style="
          position: absolute;
          left: ${starLeft}%;
          top: ${starTop}%;
          width: ${starSize}px;
          height: ${starSize}px;
          border-radius: 50%;
          background-color: ${color};
          opacity: ${starOpacity};
          pointer-events: none;
          z-index: 2;
        "></div>
      `;
    }

    // Crisp 4-point SVG stars for galaxy constellations (no drop-shadow glows)
    const svgStarsHTML = `
      <svg style="position: absolute; left: 160px; top: 120px; width: 18px; height: 18px; fill: #efe4a2; opacity: 0.8; z-index: 2;" viewBox="0 0 24 24">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
      </svg>
      <svg style="position: absolute; right: 140px; top: 350px; width: 22px; height: 22px; fill: #ffffff; opacity: 0.9; z-index: 2;" viewBox="0 0 24 24">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
      </svg>
      <svg style="position: absolute; left: 110px; top: 780px; width: 16px; height: 16px; fill: #efe4a2; opacity: 0.75; z-index: 2;" viewBox="0 0 24 24">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
      </svg>
      <svg style="position: absolute; left: 540px; top: 580px; width: 20px; height: 20px; fill: #ffffff; opacity: 0.8; z-index: 2;" viewBox="0 0 24 24">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
      </svg>
      <svg style="position: absolute; right: 180px; top: 890px; width: 18px; height: 18px; fill: #efe4a2; opacity: 0.7; z-index: 2;" viewBox="0 0 24 24">
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
      </svg>
    `;

    tempDiv.innerHTML = `
      <!-- Galaxy Background Image (Rendered as <img> to ensure html2canvas compatibility) -->
      <img src="/HDR_background.webp" style="
        position: absolute;
        inset: 0;
        width: 1080px;
        height: 1350px;
        object-fit: cover;
        z-index: 0;
      " />

      <!-- Ambient dark-blue/violet gradient overlay representing outer space -->
      <div style="
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 50%, rgba(13, 27, 61, 0.45) 0%, rgba(3, 7, 18, 0.98) 100%);
        pointer-events: none;
        z-index: 1;
      "></div>

      <!-- Render background stars -->
      ${starsHTML}
      ${svgStarsHTML}

      <!-- Render Polaroid Items -->
      ${polaroidsHTML}

      <!-- Watermark / Footer (Positioned cleanly at the bottom on top of overlapping cards) -->
      <div style="
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.35em;
        color: #efe4a2;
        text-shadow: 0 2px 5px rgba(0,0,0,0.95);
        text-transform: uppercase;
        z-index: 20;
      ">
        Roderikus Poetry · Kolase Kenangan Abadi
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        width: 1080,
        height: 1350,
        backgroundColor: "#030712",
        scale: 2, // Scale to 2x for ultra-sharp high-definition output (2160x2700)
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
      <div className="relative min-h-[400px] bg-stone-950/45 border border-white/5 rounded-2xl p-6 md:p-10 shadow-inner overflow-hidden mb-6">
        
        {/* Background galaxy-like sparkles & stars in preview container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60 z-0">
          {/* Sparkles */}
          <div className="absolute top-10 left-[12%] w-1.5 h-1.5 bg-white rounded-full" />
          <div className="absolute top-[35%] right-[18%] w-1 h-1 bg-[#efe4a2] rounded-full" />
          <div className="absolute bottom-24 left-[22%] w-1 h-1 bg-white rounded-full" />
          <div className="absolute top-[65%] left-[8%] w-1.5 h-1.5 bg-[#d3c6ff] rounded-full" />
          <div className="absolute bottom-12 right-[30%] w-1 h-1 bg-white rounded-full" />
          
          {/* Four-point stars */}
          <svg className="absolute left-[30%] top-8 w-4 h-4 fill-secondary/40" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
          <svg className="absolute right-[25%] bottom-20 w-5 h-5 fill-white/30" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
          <svg className="absolute left-[50%] top-[45%] w-3 h-3 fill-secondary/30" viewBox="0 0 24 24">
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
          </svg>
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center items-center z-10">
          {visiblePhotos.map((photo, index) => {
            let decorElement = null;
            if (photo.decor === "pin") {
              decorElement = (
                <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-white via-secondary to-[#f5d061] border border-white/40 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.4)] z-10" />
              );
            } else if (photo.decor === "tape") {
              decorElement = (
                <div 
                  className="absolute top-[-14px] left-1/2 transform -translate-x-1/2 w-14 h-4 bg-white/15 border-l border-r border-dashed border-white/30 z-10"
                  style={{ transform: `translateX(-50%) rotate(${Math.sin(index) * 6}deg)` }}
                />
              );
            }

            // Map sizes to tailwind width classes (increased sizes to fill the grid space more)
            const widthClass = photo.size === "sm" ? "w-[155px] sm:w-[180px]" : photo.size === "md" ? "w-[175px] sm:w-[215px]" : "w-[195px] sm:w-[245px]";

            // Every image uses vertical ratio (aspect-[3/4.2])
            const aspectClass = "aspect-[3/4.2]";

            return (
              <motion.div
                key={photo.src}
                onClick={() => setLightboxIndex(index)}
                style={{ rotate: `${photo.rotation}deg` }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: `${photo.rotation * 0.4}deg`, 
                  zIndex: 20,
                  boxShadow: "0 12px 24px rgba(0,0,0,0.5)"
                }}
                className={`relative bg-gradient-to-b from-surface-container-low/95 to-surface-container-lowest/98 p-3 pb-8 rounded-md shadow-2xl border border-secondary/20 cursor-pointer transform transition-all hover:border-secondary/50 ${widthClass} ${photo.marginClass}`}
              >
                {decorElement}
                
                {/* Image block */}
                <div className={`w-full ${aspectClass} bg-stone-950 overflow-hidden rounded-xs border border-white/5`}>
                  <img
                    src={photo.src}
                    alt={`Kenangan #${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover filter brightness-[0.85] hover:brightness-100 hover:scale-105 transition-all duration-500"
                  />
                </div>
                
                {/* Note details */}
                <div 
                  style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}
                  className="text-center text-[14px] sm:text-base text-secondary font-semibold mt-3 overflow-hidden text-ellipsis whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
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
              className="relative max-w-full max-h-[85vh] flex flex-col items-center bg-gradient-to-b from-surface-container-low to-surface-container-lowest p-4 pb-12 rounded-lg shadow-2xl z-10 border border-secondary/35 select-text"
            >
              <img
                src={photos[lightboxIndex].src}
                alt={`Lightbox Kenangan #${lightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-md border border-white/5"
              />
              <div 
                style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}
                className="text-center text-lg md:text-xl text-secondary mt-4 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
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
