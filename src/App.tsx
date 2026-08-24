import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import { getPoems, defaultSongs, getYouTubeId, savePoems } from "./data/poetryData";
import { memories, compliments } from "./data/gardenData";
import { Poem, Song } from "./types";
import * as THREE from "three";
import { formatTime } from "./data/musicUtils";

// Import Custom Redesigned Components
import PoemBrowserModal from "./components/PoemBrowserModal";
import GalleryModal from "./components/GalleryModal";
import CopilotModal from "./components/CopilotModal";
import AdminDashboard from "./components/AdminDashboard";
import StellariumModal from "./components/StellariumModal";
import Interactive3DPoemReader from "./components/Interactive3DPoemReader";
import MusicSidebar from "./components/MusicSidebar";

interface PlaylistProgressBarProps {
  duration: number;
  handleProgressBarSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function PlaylistProgressBar({ duration, handleProgressBarSeek }: PlaylistProgressBarProps) {
  const [currentTime, setCurrentTime] = useState(0);

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

  return (
    <div className="space-y-1.5 font-sans">
      <input 
        type="range"
        min="0"
        max={duration || 100}
        value={currentTime}
        onChange={handleProgressBarSeek}
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
      />
      <div className="flex justify-between text-[9px] text-mist/50">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export default function App() {
  // Navigation & Modal State
  const [activeModal, setActiveModal] = useState<null | 'puisi' | 'surat' | 'kenangan' | 'settings' | 'secret' | 'copilot' | 'admin' | 'stellarium'>(null);
  
  // Ref to sync activeModal state to background Three.js loop without re-triggering useEffect
  const activeModalRef = useRef(activeModal);
  useEffect(() => {
    activeModalRef.current = activeModal;
  }, [activeModal]);

  // Poetry list state (synced with localStorage)
  const [poemsState, setPoemsState] = useState<Poem[]>(() => getPoems());

  // Trigger poetry list update
  const handlePoemsUpdated = (updatedList: Poem[]) => {
    setPoemsState(updatedList);
  };

  // Responsive check for layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toast notifications state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Poetry browser states
  const [poetryView, setPoetryView] = useState<'list' | 'detail'>('list');
  const [poemIndex, setPoemIndex] = useState(0);
  const [isChangingPoem, setIsChangingPoem] = useState(false);
  const [poemDirection, setPoemDirection] = useState<'next' | 'prev'>('next');

  // Compliments Cycle
  const [complimentIndex, setComplimentIndex] = useState(0);
  const [isChangingCompliment, setIsChangingCompliment] = useState(false);

  // Core Preferences (Settings)
  const [showFireflies, setShowFireflies] = useState(true);
  const [firefliesCount, setFirefliesCount] = useState(25);
  const [performanceMode, setPerformanceMode] = useState(false);

  // --- YouTube Player Engine State ---
  const ytPlayerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(40); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [showMusicSidebar, setShowMusicSidebar] = useState(false);

  // Queue & Favorites States
  const [customQueue, setCustomQueue] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Song[]>(() => {
    try {
      const stored = localStorage.getItem("roderikus_music_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Helper functions
  const toggleFavorite = (song: Song) => {
    const isFav = favorites.some(s => s.youtubeUrl === song.youtubeUrl);
    let updated;
    if (isFav) {
      updated = favorites.filter(s => s.youtubeUrl !== song.youtubeUrl);
      showToast("Dihapus dari Favorit");
    } else {
      updated = [...favorites, song];
      showToast("Ditambahkan ke Favorit");
    }
    setFavorites(updated);
    localStorage.setItem("roderikus_music_favorites", JSON.stringify(updated));
  };

  const addToQueue = (song: Song) => {
    const exists = customQueue.some(s => s.youtubeUrl === song.youtubeUrl);
    if (!exists) {
      setCustomQueue(prev => [...prev, song]);
      showToast("Ditambahkan ke Antrean");
    } else {
      showToast("Sudah ada di Antrean");
    }
  };

  const removeFromQueue = (index: number) => {
    setCustomQueue(prev => prev.filter((_, i) => i !== index));
    showToast("Dihapus dari Antrean");
  };


  // Dynamic Spotify-like Active Playlist
  const activePlaylist = useMemo(() => {
    let list: Song[] = [];
    
    // Add custom queue first
    customQueue.forEach(song => {
      list.push(song);
    });

    // Add poem track if detailed view
    if (activeModal === 'puisi' && poetryView === 'detail') {
      const poem = poemsState[poemIndex];
      if (poem && poem.youtubeUrl && poem.songTitle) {
        const exists = list.some(s => s.youtubeUrl === poem.youtubeUrl);
        if (!exists) {
          list.push({
            title: poem.songTitle,
            artist: poem.songArtist || "YouTube",
            icon: poem.emoji || "🎵",
            youtubeUrl: poem.youtubeUrl
          });
        }
      }
    }

    // Append favorites
    favorites.forEach(fav => {
      if (!list.some(s => s.youtubeUrl === fav.youtubeUrl)) {
        list.push(fav);
      }
    });

    // Append default songs
    defaultSongs.forEach(song => {
      if (!list.some(s => s.youtubeUrl === song.youtubeUrl)) {
        list.push(song);
      }
    });

    return list;
  }, [customQueue, favorites, activeModal, poetryView, poemIndex, poemsState]);

  // Set current song track object
  const currentTrack = useMemo(() => {
    if (currentTrackIndex >= activePlaylist.length) {
      return activePlaylist[0] || defaultSongs[0];
    }
    return activePlaylist[currentTrackIndex] || defaultSongs[0];
  }, [currentTrackIndex, activePlaylist]);


  // Music active lyric/quote
  const trackQuote = useMemo(() => {
    switch (currentTrackIndex) {
      case 0:
        return "“Di antara kelap-kelip angkasa raya, rasa kagum menyala benderang menuntun dekap ramahmu...”";
      case 1:
        return "“Biarkan lantunan waltz sunyi menyembuhkan lelah, menidurkan ragu di bawah tatapan teduh rembulan...”";
      case 2:
        return "“Semesta kian karib kala lampu meredup, menyisakan tulusnya mimpi di bernaung rasi persahabatan...”";
      default:
        return "“Melodi malam yang syahdu menumbuhkan kedamaian...”";
    }
  }, [currentTrackIndex]);


  // YouTube background player instantiation
  useEffect(() => {
    let timer: any;

    const initYTPlayer = () => {
      // @ts-ignore
      if (window.YT && window.YT.Player) {
        const vidId = getYouTubeId(currentTrack.youtubeUrl) || "CvFH_6DNRCY";
        
        // Destroy old player if exists
        if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
          try { ytPlayerRef.current.destroy(); } catch(e){}
        }

        // @ts-ignore
        ytPlayerRef.current = new window.YT.Player("yt-background-player", {
          height: "1",
          width: "1",
          videoId: vidId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (e: any) => {
              e.target.setVolume(volume);
              if (isMuted) {
                if (e.target.mute) e.target.mute();
              } else {
                if (e.target.unMute) e.target.unMute();
              }
            },
            onStateChange: (e: any) => {
              // @ts-ignore
              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setDuration(e.target.getDuration());
                setAudioError(null);
              } 
              // @ts-ignore
              else if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } 
              // @ts-ignore
              else if (e.data === window.YT.PlayerState.ENDED) {
                handleNextTrack();
              }
            },
            onError: () => {
              setAudioError("Gagal memuat video YouTube ini.");
              setIsPlaying(false);
            }
          }
        });
      }
    };

    // @ts-ignore
    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      timer = setInterval(() => {
        // @ts-ignore
        if (window.YT && window.YT.Player) {
          initYTPlayer();
          clearInterval(timer);
        }
      }, 400);
    }

    return () => {
      clearInterval(timer);
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try { ytPlayerRef.current.destroy(); } catch(e){}
      }
    };
  }, []);

  // Update track progress
  useEffect(() => {
    let interval: any;
    if (isPlaying && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
      interval = setInterval(() => {
        try {
          const time = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration();
          if (dur) setDuration(dur);
          window.dispatchEvent(new CustomEvent('music-time-update', { detail: { currentTime: time, duration: dur || duration } }));
        } catch (e) {}
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);


  // Load video when track index changes
  const playTrack = (index: number, autoplay = true) => {
    setCurrentTrackIndex(index);
    window.dispatchEvent(new CustomEvent('music-time-update', { detail: { currentTime: 0, duration: 0 } }));
    const track = activePlaylist[index];
    if (track) {
      const vidId = getYouTubeId(track.youtubeUrl);
      if (vidId && ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
        try {
          if (autoplay) {
            ytPlayerRef.current.loadVideoById(vidId);
            setIsPlaying(true);
          } else {
            ytPlayerRef.current.cueVideoById(vidId);
            setIsPlaying(false);
          }
          setAudioError(null);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const togglePlay = () => {
    if (!ytPlayerRef.current) return;
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (shuffle) {
      const randIndex = Math.floor(Math.random() * activePlaylist.length);
      playTrack(randIndex);
    } else {
      playTrack((currentTrackIndex + 1) % activePlaylist.length);
    }
  };

  const handlePrevTrack = () => {
    playTrack((currentTrackIndex - 1 + activePlaylist.length) % activePlaylist.length);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(newVol);
    }
    if (newVol > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const targetMuted = !isMuted;
    setIsMuted(targetMuted);
    if (ytPlayerRef.current) {
      if (targetMuted) {
        if (ytPlayerRef.current.mute) ytPlayerRef.current.mute();
      } else {
        if (ytPlayerRef.current.unMute) ytPlayerRef.current.unMute();
      }
    }
  };

  const handleProgressBarSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const dur = ytPlayerRef.current ? ytPlayerRef.current.getDuration() : duration;
    window.dispatchEvent(new CustomEvent('music-time-update', { detail: { currentTime: time, duration: dur || duration } }));
    if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(time, true);
    }
  };

  // Seek function for sync lyrics
  const seekTo = (seconds: number) => {
    if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(seconds, true);
      const dur = ytPlayerRef.current ? ytPlayerRef.current.getDuration() : duration;
      window.dispatchEvent(new CustomEvent('music-time-update', { detail: { currentTime: seconds, duration: dur || duration } }));
      if (!isPlaying) {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  // Play BGM when opening a poem detail
  const handlePlaySongFromPoem = (poem: Poem) => {
    if (poem.youtubeUrl) {
      // The song gets prepended to activePlaylist (index 0)
      setTimeout(() => {
        playTrack(0);
      }, 100);
    }
  };

  // Secret Unlocked easter egg
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [clicksToSecret, setClicksToSecret] = useState(3);

  // Moon Parallax coordinate state
  const [moonOffset, setMoonOffset] = useState({ x: 0, y: 0 });

  // Star trails canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Three.js 3D Background canvas ref
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Star Trails Canvas Animation
  useEffect(() => {
    if (performanceMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      decay: number;
      shape: "diamond" | "cross" | "bubble";
    }> = [];

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const starColors = ["#FFE270", "#B49CFF", "#34D399", "#FFFFFF", "#FFEDD5"];
    const shapes: Array<"diamond" | "cross" | "bubble"> = ["diamond", "cross", "bubble"];

    const handleMouseMove = (e: MouseEvent) => {
      const count = Math.random() > 0.45 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const offsetRange = 6;
        const offsetX = (Math.random() - 0.5) * offsetRange;
        const offsetY = (Math.random() - 0.5) * offsetRange;
        
        particles.push({
          x: e.clientX + offsetX,
          y: e.clientY + offsetY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.2,
          size: 2.0 + Math.random() * 2.5,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          life: 1.0,
          decay: 0.016 + Math.random() * 0.012,
          shape: shapes[Math.floor(Math.random() * shapes.length)]
        });
      }

      if (particles.length > 150) {
        particles.shift();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    let canvasCleared = false;
    const animate = () => {
      if (particles.length === 0) {
        if (!canvasCleared) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCleared = true;
        }
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      canvasCleared = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.005; // gravity lift
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const size = p.size * p.life;

        if (p.shape === "diamond") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const r = size * 2.8;
          ctx.moveTo(p.x, p.y - r);
          ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
          ctx.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "cross") {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = size * 0.35;
          ctx.beginPath();
          const len = size * 2.4;
          ctx.moveTo(p.x - len, p.y);
          ctx.lineTo(p.x + len, p.y);
          ctx.moveTo(p.x, p.y - len);
          ctx.lineTo(p.x, p.y + len);
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [performanceMode]);

  // --- High-Performance Scroll-Driven Animation State ---
  const scrollProgressValue = useMotionValue(0);
  
  // Smooth spring physics mapping to avoid choppy transitions
  const smoothScrollProgress = useSpring(scrollProgressValue, {
    damping: 30,
    stiffness: 150,
    mass: 0.4
  });

  // Track scroll state in React ONLY for threshold-based UI displays to minimize re-renders
  const [activeStep, setActiveStep] = useState(0); // 0 = Phase 1, 1 = Phase 2, 2 = Phase 3
  const [bannerStep, setBannerStep] = useState(0); // -1 = hide, 0 = start, 1 = mid, 2 = end
  const [showFlowers, setShowFlowers] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [complimentsDisplay, setComplimentsDisplay] = useState("block");

  useEffect(() => {
    const unsubscribe = smoothScrollProgress.on("change", (val) => {
      // 1. Active Step navigator
      let step = 0;
      if (val > 0.45 && val <= 1.05) {
        step = 1;
      } else if (val > 1.05) {
        step = 2;
      }
      setActiveStep(step);

      // 2. Banner Step
      let bStep = -1;
      if (val < 0.15) {
        bStep = 0;
      } else if (val >= 0.85 && val <= 1.25) {
        bStep = 1;
      } else if (val > 1.25) {
        bStep = 2;
      }
      setBannerStep(bStep);

      // 3. Flower and Hero display toggles
      setShowFlowers(val <= 0.65);
      setShowHero(val <= 0.45);

      // 4. Compliments block display logic
      let disp = "block";
      if (val > 0.45 && val <= 1.05) {
        disp = "none";
      } else if (val > 1.05 && isMobile) {
        disp = "none";
      }
      setComplimentsDisplay(disp);
    });
    return () => unsubscribe();
  }, [smoothScrollProgress, isMobile]);

  // Three.js 3D Background Canvas Animation
  useEffect(() => {
    if (performanceMode) return;

    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#030712");

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create Sphere Geometry
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    // Invert the geometry on the x-axis so that the image is not mirrored from the inside
    geometry.scale(-1, 1, 1);

    // Load Texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/HDR_background.webp");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    // Track mouse coordinates for smooth tilt parallax
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Pause background rendering if the heavy Stellarium explorer is active
      if (activeModalRef.current === 'stellarium') {
        return;
      }

      const time = clock.getElapsedTime();
      const scrollVal = smoothScrollProgress.get();

      // Rotation based on scroll progress + auto-rotation
      sphere.rotation.y = scrollVal * 0.75 + time * 0.015;
      sphere.rotation.x = scrollVal * 0.15 + Math.sin(time * 0.05) * 0.04;

      // Mouse parallax camera tilt (lerp for smoothing)
      const targetRotY = mouseX * 0.08;
      const targetRotX = mouseY * 0.08;

      camera.rotation.y += (targetRotY - camera.rotation.y) * 0.05;
      camera.rotation.x += (targetRotX - camera.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose resources
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [performanceMode, smoothScrollProgress]);

  // Touch and Wheel listeners for scroll progress
  useEffect(() => {
    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      if (activeModal) return;
      e.preventDefault();
      const delta = e.deltaY * 0.0012;
      const next = Math.min(Math.max(scrollProgressValue.get() + delta, 0), 2);
      scrollProgressValue.set(next);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (activeModal) return;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeModal) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const touchCurrentY = e.touches[0].clientY;
      const diffY = touchStartY - touchCurrentY;
      touchStartY = touchCurrentY;

      const delta = diffY * 0.0035;
      const next = Math.min(Math.max(scrollProgressValue.get() + delta, 0), 2);
      scrollProgressValue.set(next);
    };

    const container = document.getElementById("main-canvas-container");
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [activeModal]);

  // High performance MotionValue transforms mapping scroll directly to styles
  const centerMoonX = useTransform(smoothScrollProgress, [1.05, 1.45], [0, isMobile ? 0 : -240]);
  const centerMoonY = useTransform(smoothScrollProgress, 
    isMobile ? [0.35, 0.75, 1.05, 1.45] : [0.35, 0.75],
    isMobile ? [-120, 0, 0, -210] : [-180, 0]
  );
  const centerMoonScale = useTransform(smoothScrollProgress,
    isMobile ? [0.35, 0.75, 1.05, 1.45] : [0.35, 0.75],
    isMobile ? [1.0, 1.4, 1.4, 0.75] : [1.0, 1.65]
  );

  const puisiX = useTransform(smoothScrollProgress, [1.02, 1.25], [isMobile ? -90 : -150, isMobile ? -90 - 120 : -150 - 120]);
  const puisiY = isMobile ? 30 : 50;

  const kenanganX = useTransform(smoothScrollProgress, [1.02, 1.25], [isMobile ? 90 : 150, isMobile ? 90 + 120 : 150 + 120]);
  const kenanganY = isMobile ? 30 : 50;

  const copilotX = 0;
  const copilotY = useTransform(smoothScrollProgress, [1.02, 1.25], [isMobile ? -95 : -158, isMobile ? -95 - 100 : -158 - 100]);

  const stellariumX = 0;
  const stellariumY = useTransform(smoothScrollProgress, [1.02, 1.25], [isMobile ? 95 : 158, isMobile ? 95 + 100 : 158 + 100]);

  // Constellation SVG connection line opacity
  const lineOpacity = useTransform(smoothScrollProgress, (val) => {
    return val > 0.35 && val <= 1.25
      ? Math.min((val - 0.35) * 4, 1.0) * Math.max(1 - (val - 1.02) * 6, 0.0)
      : 0;
  });

  // Dynamic atmospheric overlay gradient opacity layers
  const bgOpacity1 = useTransform(smoothScrollProgress, [0.35, 0.75], [1, 0]);
  const bgOpacity2 = useTransform(smoothScrollProgress, [0.35, 0.75, 1.05, 1.45], [0, 1, 1, 0]);
  const bgOpacity3 = useTransform(smoothScrollProgress, [1.05, 1.45], [0, 1]);

  // Nebula blur animations
  const nebula1Opacity = useTransform(smoothScrollProgress, [0.35, 0.75, 1.15, 1.5], [0.15, 0.4, 0.4, 0.15]);
  const nebula1X = useTransform(smoothScrollProgress, [0, 2], [-100, -250]);
  const nebula1Y = useTransform(smoothScrollProgress, [0, 2], [-100, -50]);
  const nebula1Scale = useTransform(smoothScrollProgress, [0, 2], [1, 1.4]);

  const nebula2Opacity = useTransform(smoothScrollProgress, [1.05, 1.45], [0.12, 0.34]);
  const nebula2X = useTransform(smoothScrollProgress, [0, 2], [100, 280]);
  const nebula2Y = useTransform(smoothScrollProgress, [0, 2], [100, 20]);
  const nebula2Scale = useTransform(smoothScrollProgress, [0, 2], [1.1, 0.9]);

  const bgImgScale = useTransform(smoothScrollProgress, [0, 2], [1, 1.18]);
  const bgImgY = useTransform(smoothScrollProgress, [0, 2], [0, 15]);

  const stardustScale = useTransform(smoothScrollProgress, [0, 2], [1, 1.35]);
  const stardustOpacity = useTransform(smoothScrollProgress, [0, 2], [0.25, 0.85]);
  const stardustRotate = useTransform(smoothScrollProgress, [0, 2], [0, 2.5]);

  const firefliesScale = useTransform(smoothScrollProgress, [0, 2], [1, 0.8]);
  const firefliesOpacity = useTransform(smoothScrollProgress, [0, 2], [1, 0.1]);

  const headerY = useTransform(smoothScrollProgress, [0, 1.2], [0, -80]);
  const headerOpacity = useTransform(smoothScrollProgress, [0, 0.6], [1, 0]);

  const heroOpacity = useTransform(smoothScrollProgress, [0, 0.45], [1, 0]);
  const heroY = useTransform(smoothScrollProgress, [0, 0.45], [0, -40]);

  const complimentsOpacity = useTransform(smoothScrollProgress,
    [0, 0.45, 1.05, 1.45],
    [1, 0, 0, 1]
  );
  const complimentsY = useTransform(smoothScrollProgress,
    [0, 0.45, 1.05, 1.45],
    [0, -40, 30, 0]
  );
  const complimentsX = useTransform(smoothScrollProgress,
    [1.05, 1.45],
    [0, isMobile ? 0 : -220]
  );

  const flowersOpacity = useTransform(smoothScrollProgress, [0, 0.65], [1, 0]);
  const flowersY = useTransform(smoothScrollProgress, [0, 0.65], [0, 65]);

  const playlistX = useTransform(smoothScrollProgress,
    isMobile ? [1.05, 1.45] : [1.05, 1.45],
    isMobile ? ["0%", "0%"] : ["120%", "0%"]
  );
  const playlistY = useTransform(smoothScrollProgress,
    isMobile ? [1.05, 1.45] : [1.05, 1.45],
    isMobile ? ["120%", "0%"] : ["0%", "0%"]
  );
  const playlistOpacity = useTransform(smoothScrollProgress, [1.05, 1.45], [0, 1]);

  const musicFloatOpacity = useTransform(smoothScrollProgress, [1.05, 1.25], [1, 0]);
  const indicatorHeight = useTransform(smoothScrollProgress, [0, 2], ["0%", "100%"]);

  const earthShadow = useTransform(smoothScrollProgress, (val) => {
    return `0 0 ${40 + val * 40}px rgba(56, 189, 248, ${0.35 + val * 0.35})`;
  });
  const moonRotate = useTransform(smoothScrollProgress, [0, 2], [0, -30]);

  const starOpacity = useTransform(smoothScrollProgress, (val) => {
    return val > 1.02
      ? Math.max(1 - (val - 1.02) * 5, 0)
      : (val > 0.35 ? Math.min((val - 0.35) * 2, 1) : 0);
  });

  const starScale = useTransform(smoothScrollProgress, (val) => {
    return val > 1.02
      ? Math.max(1.15 - (val - 1.02) * 3, 0.4)
      : (val > 0.35 ? 0.75 + (val - 0.35) * 0.4 : 0.4);
  });
  const star3Scale = useTransform(smoothScrollProgress, (val) => {
    return val > 1.02
      ? Math.max(1.2 - (val - 1.02) * 3, 0.4)
      : (val > 0.35 ? 0.8 + (val - 0.35) * 0.4 : 0.4);
  });
  const starPointerEvents = useTransform(smoothScrollProgress, (val) => {
    return val > 0.45 && val <= 1.02 ? "auto" : "none";
  });

  const heroPointerEvents = useTransform(smoothScrollProgress, (val) => {
    return val < 0.35 ? "auto" : "none";
  });
  const heroDisplay = useTransform(smoothScrollProgress, (val) => {
    return val > 0.45 ? "none" : "block";
  });

  const complimentsDisplayValue = useTransform(smoothScrollProgress, (val) => {
    return (val > 0.45 && val <= 1.05) ? "none" : (val > 1.05 && isMobile ? "none" : "block");
  });
  const flowersDisplayValue = useTransform(smoothScrollProgress, (val) => {
    return val > 0.65 ? "none" : "flex";
  });

  const musicFloatPointerEvents = useTransform(smoothScrollProgress, (val) => {
    return val > 1.05 ? "none" : "auto";
  });
  const playlistPointerEvents = useTransform(smoothScrollProgress, (val) => {
    return val > 1.05 ? "auto" : "none";
  });

  const handleMoonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const maxOffset = 16;
    const pctX = x / (rect.width / 2);
    const pctY = y / (rect.height / 2);

    setMoonOffset({ x: pctX * maxOffset, y: pctY * maxOffset });
  };

  const handleMoonMouseLeave = () => {
    setMoonOffset({ x: 0, y: 0 });
  };

  // Fireflies memoization
  const fireflies = useMemo(() => {
    return Array.from({ length: firefliesCount }).map((_, i) => {
      const signX = Math.random() > 0.5 ? 1 : -1;
      const signY = Math.random() > 0.5 ? 1 : -1;
      const twX = `${signX * (50 + Math.random() * 200)}px`;
      const twY = `${signY * (50 + Math.random() * 200)}px`;
      
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 90}%`,
        twX,
        twY,
        duration: `${12 + Math.random() * 18}s`,
        delay: `${Math.random() * -15}s`,
      };
    });
  }, [firefliesCount]);

  // Compliment Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setIsChangingCompliment(true);
      setTimeout(() => {
        setComplimentIndex((prev) => (prev + 1) % compliments.length);
        setIsChangingCompliment(false);
      }, 800);
    }, 11000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard listener to close music sidebar on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMusicSidebar(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Poem pagination handlers
  const changePoem = (direction: 'next' | 'prev') => {
    if (isChangingPoem) return;
    setPoemDirection(direction);
    setIsChangingPoem(true);
    
    setTimeout(() => {
      if (direction === 'next') {
        setPoemIndex((prev) => (prev + 1) % poemsState.length);
      } else {
        setPoemIndex((prev) => (prev - 1 + poemsState.length) % poemsState.length);
      }
      setIsChangingPoem(false);
    }, 300);
  };

  // Secret trigger
  const handleSecretAreaClick = () => {
    if (secretUnlocked) {
      setActiveModal('secret');
      return;
    }
    
    if (clicksToSecret > 1) {
      setClicksToSecret((prev) => prev - 1);
    } else {
      setSecretUnlocked(true);
      setActiveModal('secret');
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // AI Generated poem callback
  const handlePoemGenerated = (newPoem: Poem) => {
    const updated = [newPoem, ...poemsState];
    savePoems(updated);
    setPoemsState(updated);
    setPoemIndex(0);
    setPoetryView('detail');
    setActiveModal('puisi');
  };

  return (
    <div id="main-canvas-container" className="relative h-screen w-full bg-surface-dim text-on-surface select-none overflow-hidden font-body flex flex-col justify-between">
      
      {/* Hidden YouTube Player Iframe Target */}
      <div id="yt-background-player-wrap" style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
        <div id="yt-background-player"></div>
      </div>

      {/* Floating Animations Backdrop */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        {performanceMode ? (
          <>
            {/* Layered High-Performance Gradients */}
            <motion.div style={{ opacity: bgOpacity1, background: `radial-gradient(circle at 50% 50%, rgba(13, 27, 61, 1) 0%, rgba(3, 7, 18, 1) 100%)` }} className="absolute inset-0" />
            <motion.div style={{ opacity: bgOpacity2, background: `radial-gradient(circle at 50% 50%, rgba(40, 30, 85, 1) 0%, rgba(2, 4, 12, 1) 100%)` }} className="absolute inset-0" />
            <motion.div style={{ opacity: bgOpacity3, background: `radial-gradient(circle at ${isMobile ? "50% 30%" : "30% 50%"}, rgba(15, 12, 30, 1) 0%, rgba(1, 3, 8, 1) 100%)` }} className="absolute inset-0" />
            
            <motion.div 
              style={{ scale: bgImgScale, y: bgImgY }}
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-overlay transform-gpu will-change-transform"
            />

            <motion.div 
              style={{ scale: stardustScale, opacity: stardustOpacity, rotate: stardustRotate }}
              className="absolute inset-0 stardust transform-gpu will-change-transform" 
            />
          </>
        ) : (
          <canvas ref={threeCanvasRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full object-cover" />
        )}
        
        {!performanceMode && (
          <>
            <motion.div
              style={{
                x: nebula1X,
                y: nebula1Y,
                scale: nebula1Scale,
                opacity: nebula1Opacity
              }}
              className="hidden md:block absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[130px] pointer-events-none nebula-wave transform-gpu will-change-transform"
            />
            <motion.div
              style={{
                x: nebula2X,
                y: nebula2Y,
                scale: nebula2Scale,
                opacity: nebula2Opacity
              }}
              className="hidden md:block absolute bottom-1/4 -right-32 w-[650px] h-[550px] rounded-full bg-secondary/15 blur-[110px] pointer-events-none nebula-wave [animation-delay:4s] transform-gpu will-change-transform"
            />
          </>
        )}

        {showFireflies && !performanceMode && (
          <motion.div 
            style={{ scale: firefliesScale, opacity: firefliesOpacity }}
            className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
          >
            {fireflies.map((ff) => (
              <div
                key={ff.id}
                className="firefly"
                style={{
                  left: ff.left,
                  top: ff.top,
                  '--tw-x': ff.twX,
                  '--tw-y': ff.twY,
                  animationDuration: ff.duration,
                  animationDelay: ff.delay,
                } as React.CSSProperties}
              />
            ))}
          </motion.div>
        )}

        {!performanceMode && (
          <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none w-full h-full mix-blend-screen" />
        )}
      </div>

      {/* Floating Emojis from Roderikus Poetry */}
      <div className="floating-decorations select-none pointer-events-none">
        <span className="floating-item">🌙</span>
        <span className="floating-item">⭐</span>
        <span className="floating-item">🧭</span>
        <span className="floating-item">✦</span>
        <span className="floating-item">🪶</span>
        <span className="floating-item">🍂</span>
        <span className="floating-item">🏔️</span>
        <span className="floating-item">✧</span>
      </div>

      {/* Header Bar HUD */}
      <motion.header 
        style={{
          y: headerY,
          opacity: headerOpacity
        }}
        className="relative z-20 w-full px-6 md:px-12 py-5 flex justify-center items-center" 
      >
        <div className="w-full max-w-5xl flex justify-between items-center glass-award px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => scrollProgressValue.set(0)}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200/20 via-violet-400/20 to-cyan-400/20 border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-secondary text-lg select-none">
                auto_stories
              </span>
            </div>
            <span className="font-display text-base md:text-lg font-bold tracking-wider text-sharlight font-serif">
              RODERIKUS POETRY
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={handleSecretAreaClick}
              className="p-2 rounded-full text-mist hover:text-secondary hover:bg-white/5 transition-all cursor-pointer"
              title="Cari Bintang Rahasia"
            >
              <span className={`material-symbols-outlined text-base ${secretUnlocked ? 'text-secondary font-fill' : 'text-mist'}`} style={{ fontVariationSettings: secretUnlocked ? "'FILL' 1" : undefined }}>
                auto_awesome
              </span>
            </button>

            <button
              onClick={() => setShowMusicSidebar(true)}
              className="p-2 rounded-full text-mist hover:text-secondary hover:bg-white/5 transition-all cursor-pointer"
              title="Pemutar Musik"
            >
              <span className="material-symbols-outlined text-base">music_note</span>
            </button>

            <button
              onClick={() => setActiveModal('settings')}
              className="p-2 text-mist hover:text-starlight hover:bg-white/5 transition-all rounded-full cursor-pointer flex items-center justify-center"
              title="Pengaturan"
            >
              <span className="material-symbols-outlined text-base">settings</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Experience Layout */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-center text-center pb-12">
        
        {/* Glowing Interactive Moon Column */}
        <div className="flex flex-col items-center gap-6 mb-4 md:mb-6 select-none relative z-10 w-full">
          <div className="relative flex items-center justify-center">
            
            {/* SVG Constellation Connection Lines (Phase 1) */}
            <svg className="absolute left-1/2 top-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 overflow-visible constellation-pulse" viewBox="-300 -300 600 600" style={{ opacity: lineOpacity }}>
              <defs>
                <filter id="blue-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <motion.circle cx={centerMoonX} cy={centerMoonY} r={isMobile ? 95 : 158} stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1.5" strokeDasharray="6 8" fill="none" className="animate-spin-slow" />
              <motion.line x1={centerMoonX} y1={centerMoonY} x2={puisiX} y2={puisiY} stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.75" filter="url(#blue-glow)" />
              <motion.line x1={centerMoonX} y1={centerMoonY} x2={kenanganX} y2={kenanganY} stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.75" filter="url(#blue-glow)" />
              <motion.line x1={centerMoonX} y1={centerMoonY} x2={copilotX} y2={copilotY} stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.75" filter="url(#blue-glow)" />
              <motion.line x1={centerMoonX} y1={centerMoonY} x2={stellariumX} y2={stellariumY} stroke="#d2c888" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.75" filter="url(#blue-glow)" />

              <motion.circle cx={puisiX} cy={puisiY} r="3.5" fill="#38BDF8" className="animate-ping" />
              <motion.circle cx={kenanganX} cy={kenanganY} r="3.5" fill="#38BDF8" className="animate-ping" />
              <motion.circle cx={copilotX} cy={copilotY} r="3.5" fill="#22D3EE" className="animate-ping" />
              <motion.circle cx={stellariumX} cy={stellariumY} r="3.5" fill="#d2c888" className="animate-ping" />
            </svg>

            {/* Star Node 1: Bintang Puisi */}
            <motion.button
              onClick={() => {
                setPoetryView('list');
                setActiveModal('puisi');
              }}
              style={{
                opacity: starOpacity,
                scale: starScale,
                x: puisiX,
                y: puisiY,
                pointerEvents: starPointerEvents
              }}
              className="absolute z-20 group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              aria-label="Kunjungi Bintang Puisi"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-stone-950/75 border border-primary/40 text-primary hover:border-primary-fixed hover:text-white shadow-[0_0_15px_rgba(184,166,255,0.4)] hover:shadow-[0_0_25px_rgba(184,166,255,0.7)] transition-all duration-300">
                <span className="material-symbols-outlined text-lg md:text-2xl font-fill animate-pulse">menu_book</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] md:text-xs font-semibold tracking-wider text-starlight group-hover:text-primary transition-colors font-label-caps uppercase">Bintang Puisi</span>
                <span className="text-[7px] md:text-[9px] text-mist/60 italic">Bait Nurani</span>
              </div>
            </motion.button>

            {/* Star Node 2: Rasi Kenangan */}
            <motion.button
              onClick={() => setActiveModal('kenangan')}
              style={{
                opacity: starOpacity,
                scale: starScale,
                x: kenanganX,
                y: kenanganY,
                pointerEvents: starPointerEvents
              }}
              className="absolute z-20 group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              aria-label="Kunjungi Rasi Kenangan"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-stone-950/75 border border-secondary/40 text-secondary hover:border-starlight hover:text-white shadow-[0_0_15px_rgba(255,243,176,0.3)] hover:shadow-[0_0_25px_rgba(255,243,176,0.6)] transition-all duration-300">
                <span className="material-symbols-outlined text-lg md:text-2xl font-fill animate-pulse">collections</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] md:text-xs font-semibold tracking-wider text-starlight group-hover:text-secondary transition-colors font-label-caps uppercase">Rasi Kenangan</span>
                <span className="text-[7px] md:text-[9px] text-mist/60 italic">Keping Memori</span>
              </div>
            </motion.button>

            {/* Star Node 3: Bintang AI Copilot */}
            <motion.button
              onClick={() => setActiveModal('copilot')}
              style={{
                opacity: starOpacity,
                scale: star3Scale,
                x: copilotX,
                y: copilotY,
                pointerEvents: starPointerEvents
              }}
              className="absolute z-20 group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              aria-label="Kunjungi Bintang AI"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md group-hover:blur-lg animate-pulse" />
                <div className="relative w-11 h-11 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-stone-950/85 border border-emerald-400/50 text-emerald-300 hover:border-emerald-300 hover:text-white shadow-[0_0_20px_rgba(136,210,154,0.4)] hover:shadow-[0_0_30px_rgba(136,210,154,0.8)] transition-all duration-300">
                  <span className="material-symbols-outlined text-xl md:text-3xl font-fill animate-[spin_10s_linear_infinite]">psychology</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] md:text-xs font-semibold tracking-widest text-emerald-200 group-hover:text-emerald-300 transition-colors font-label-caps uppercase">Bintang AI</span>
                <span className="text-[7px] md:text-[9px] text-mist/60 italic">Copilot Sajak</span>
              </div>
            </motion.button>

            {/* Star Node 4: Penjelajah Langit 3D */}
            <motion.button
              onClick={() => setActiveModal('stellarium')}
              style={{
                opacity: starOpacity,
                scale: starScale,
                x: stellariumX,
                y: stellariumY,
                pointerEvents: starPointerEvents
              }}
              className="absolute z-20 group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
              aria-label="Kunjungi Penjelajah Langit"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-stone-950/75 border border-secondary/40 text-secondary hover:border-secondary hover:text-white shadow-[0_0_15px_rgba(210,200,136,0.3)] hover:shadow-[0_0_25px_rgba(210,200,136,0.6)] transition-all duration-300">
                <span className="material-symbols-outlined text-lg md:text-2xl font-fill animate-pulse">explore</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] md:text-xs font-semibold tracking-wider text-starlight group-hover:text-secondary transition-colors font-label-caps uppercase">Langit 3D</span>
                <span className="text-[7px] md:text-[9px] text-mist/60 italic">Ekplorasi Rasi</span>
              </div>
            </motion.button>

            {/* Central Parallax Earth */}
            <motion.button
              id="moon-trigger-btn"
              onClick={() => setActiveModal('surat')}
              onMouseMove={handleMoonMouseMove}
              onMouseLeave={handleMoonMouseLeave}
              style={{
                scale: centerMoonScale,
                x: centerMoonX,
                y: centerMoonY,
                boxShadow: earthShadow,
              }}
              className="group relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-sky-500/30 hover:border-sky-400 cursor-pointer focus:outline-none z-10 flex items-center justify-center overflow-hidden earth-glow bg-stone-950/40"
              aria-label="Buka Surat Rahasia"
            >
              <motion.img
                animate={{
                  x: moonOffset.x,
                  y: moonOffset.y,
                }}
                style={{
                  rotate: moonRotate
                }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80&w=600"
                alt="Bumi Biru"
                className="w-full h-full object-cover opacity-95 scale-[1.4] pointer-events-none"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/35 via-transparent to-transparent pointer-events-none" />
              
              {/* Floating badges on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-stone-950/45">
                <span className="text-[9px] md:text-[10px] text-sky-300 font-bold tracking-widest uppercase font-label-caps bg-deep-navy/80 px-2.5 py-1 rounded-full border border-sky-500/20 shadow-md">
                  Surat Rahasia
                </span>
              </div>
            </motion.button>

          </div>
        </div>

        {/* Hero typography column */}
        <div className="relative z-10 max-w-3xl space-y-5 flex flex-col items-center">
          <motion.div
            style={{ 
              opacity: heroOpacity,
              y: heroY,
              pointerEvents: heroPointerEvents,
              display: heroDisplay
            }}
            className="space-y-3 text-center"
          >
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-starlight leading-tight font-extrabold tracking-tight">
              Menyimpan Percakapan <br/>
              <span className="text-shimmer-gold text-glow-aurora italic font-serif inline-block hover:scale-105 transition-transform duration-500 cursor-default">
                Dalam Kepala.
              </span>
            </h2>
            
            <p className="font-poem italic text-mist/80 text-sm md:text-lg leading-relaxed max-w-prose mx-auto font-light tracking-wide">
              "Sebuah novel tentang sunyi, dari jiwa yang merangkai getar asa di hamparan rasi bintang..."
            </p>
          </motion.div>

          {/* Compliments panel (streamlined rotating quote line) */}
          <motion.div
            style={{
              opacity: complimentsOpacity,
              y: complimentsY,
              x: complimentsX,
              display: complimentsDisplayValue
            }}
            className={`w-full max-w-md mx-auto py-1 px-4 text-center hidden sm:block ${
              activeStep === 2 ? "hidden md:block" : ""
            }`}
          >
            <p className={`font-poem italic text-xs leading-relaxed text-secondary/90 transition-all duration-500 ${
              isChangingCompliment ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
            }`}>
              {activeStep === 2 ? trackQuote : `"${compliments[complimentIndex].text}"`}
            </p>
          </motion.div>

          {/* Phase 0 Flowers (Now in Normal Flex Flow to prevent overlap) */}
          <motion.div 
            style={{
              opacity: flowersOpacity,
              y: flowersY,
              display: flowersDisplayValue
            }}
            className="w-full max-w-xl px-4 flex flex-col items-center gap-3 mt-4"
          >
            <div className="flex justify-around items-end w-full max-w-2xl mt-1">
              
              {/* Left: Antologi Puisi */}
              <button
                onClick={() => {
                  setPoetryView('list');
                  setActiveModal('puisi');
                }}
                className="group flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 focus:outline-none"
                aria-label="Buka Puisi"
              >
                <div className="bloom-effect text-glow-lavender group-hover:scale-110 drop-shadow-[0_0_12px_rgba(184,166,255,0.2)]">
                  <span className="material-symbols-outlined text-4xl md:text-5xl transition-colors duration-500 group-hover:text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                    menu_book
                  </span>
                </div>
                <span className="text-[9px] md:text-xs font-semibold tracking-wider text-mist group-hover:text-primary transition-all uppercase">
                  Puisi
                </span>
              </button>

              {/* Center Left: AI Copilot */}
              <button
                onClick={() => setActiveModal('copilot')}
                className="group flex flex-col items-center gap-2 cursor-pointer transition-all duration-500 transform hover:-translate-y-3 focus:outline-none"
                aria-label="Buka AI Copilot"
              >
                <div className="bloom-effect text-secondary scale-110 md:scale-115 group-hover:scale-125 drop-shadow-[0_0_15px_rgba(255,243,176,0.3)]">
                  <span className="material-symbols-outlined text-5.5xl md:text-6.5xl transition-colors duration-700 group-hover:text-starlight" style={{ fontVariationSettings: "'FILL' 1" }}>
                    psychology
                  </span>
                </div>
                <span className="text-[9px] md:text-xs font-semibold tracking-wider text-mist group-hover:text-secondary transition-all uppercase">
                  AI Copilot
                </span>
              </button>

              {/* Center Right: Langit 3D */}
              <button
                onClick={() => setActiveModal('stellarium')}
                className="group flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 focus:outline-none"
                aria-label="Buka Penjelajah Langit"
              >
                <div className="bloom-effect text-secondary group-hover:scale-110 drop-shadow-[0_0_12px_rgba(255,243,176,0.2)]">
                  <span className="material-symbols-outlined text-4.5xl md:text-5.5xl transition-colors duration-500 group-hover:text-starlight" style={{ fontVariationSettings: "'FILL' 1" }}>
                    explore
                  </span>
                </div>
                <span className="text-[9px] md:text-xs font-semibold tracking-wider text-mist group-hover:text-secondary transition-all uppercase">
                  Langit 3D
                </span>
              </button>

              {/* Right: Galeri Foto */}
              <button
                onClick={() => setActiveModal('kenangan')}
                className="group flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 focus:outline-none"
                aria-label="Buka Kenangan"
              >
                <div className="bloom-effect text-glow-lavender group-hover:scale-110 drop-shadow-[0_0_12px_rgba(184,166,255,0.2)]">
                  <span className="material-symbols-outlined text-4xl md:text-5xl transition-colors duration-500 group-hover:text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                    collections
                  </span>
                </div>
                <span className="text-[9px] md:text-xs font-semibold tracking-wider text-mist group-hover:text-primary transition-all uppercase">
                  Galeri
                </span>
              </button>

            </div>
          </motion.div>
        </div>

        {/* Phase navigator rail */}
        <div className="absolute left-6 md:left-12 top-1/2 transform -translate-y-1/2 z-30 hidden sm:block select-none" id="sidebar-navigator">
          <div className="relative w-4 h-36 flex flex-col items-center justify-between py-1">
            <div className="absolute top-1 bottom-1 w-[1.5px] bg-white/10" />
            <motion.div
              style={{
                height: indicatorHeight
              }}
              className="absolute top-1 w-[2px] bg-gradient-to-b from-primary via-secondary to-emerald-400 origin-top"
            />

            <button
              onClick={() => { scrollProgressValue.set(0); }}
              className="relative group focus:outline-none"
              aria-label="Navigasi ke Gerbang Utama"
            >
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-135 cursor-pointer ${
                activeStep === 0 
                  ? "bg-primary border-primary shadow-[0_0_12px_rgba(184,166,255,1)]" 
                  : "bg-stone-900 border-white/20"
              }`}>
                {activeStep === 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                )}
              </div>
              <span className="absolute left-8 ml-1 px-2.5 py-1 rounded bg-stone-950/80 border border-white/5 text-[9px] font-mono font-semibold tracking-wider text-primary uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg">
                Phase I: Gerbang Utama
              </span>
            </button>

            <button
              onClick={() => { scrollProgressValue.set(0.85); }}
              className="relative group focus:outline-none"
              aria-label="Navigasi ke Rasi Bintang"
            >
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-135 cursor-pointer ${
                activeStep === 1 
                  ? "bg-secondary border-secondary shadow-[0_0_12px_rgba(255,243,176,1)]" 
                  : "bg-stone-900 border-white/20"
              }`}>
                {activeStep === 1 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                )}
              </div>
              <span className="absolute left-8 ml-1 px-2.5 py-1 rounded bg-stone-950/80 border border-white/5 text-[9px] font-mono font-semibold tracking-wider text-secondary uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg">
                Phase II: Rasi Bintang
              </span>
            </button>

            <button
              onClick={() => { scrollProgressValue.set(1.65); }}
              className="relative group focus:outline-none"
              aria-label="Navigasi ke Playlist Simfoni"
            >
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-135 cursor-pointer ${
                activeStep === 2 
                  ? "bg-emerald-400 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]" 
                  : "bg-stone-900 border-white/20"
              }`}>
                {activeStep === 2 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                )}
              </div>
              <span className="absolute left-8 ml-1 px-2.5 py-1 rounded bg-stone-950/80 border border-white/5 text-[9px] font-mono font-semibold tracking-wider text-emerald-300 uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg">
                Phase III: Alunan Simfoni
              </span>
            </button>
          </div>
        </div>

      </main>

      {/* Music Floating Toggle Button */}
      <motion.div 
        style={{
          opacity: musicFloatOpacity,
          pointerEvents: musicFloatPointerEvents
        }}
        className="fixed bottom-6 left-6 z-40" 
        id="music-player-container"
      >
        <button
          onClick={() => setShowMusicSidebar(true)}
          className="group glass-panel h-11 px-4 rounded-full flex items-center gap-2.5 border border-white/10 shadow-2xl text-starlight hover:border-secondary/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Buka Pemutar Musik"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <span className={`material-symbols-outlined text-lg transition-all ${isPlaying ? 'animate-spin-slow text-secondary' : 'text-mist group-hover:text-secondary'}`}>
              {isPlaying ? 'album' : 'play_arrow'}
            </span>
            {isPlaying && (
              <div className="absolute inset-0 border border-secondary border-dashed rounded-full animate-ping opacity-25" />
            )}
          </div>
          
          <div className="flex flex-col text-left text-[9px] tracking-wide pr-1 leading-tight">
            <span className="font-semibold text-starlight line-clamp-1 max-w-[80px]">
              {isPlaying ? "Memutar" : "Putar Musik"}
            </span>
            <span className="text-mist/50 line-clamp-1 max-w-[80px]">
              {isPlaying ? currentTrack.title : "BGM"}
            </span>
          </div>

          {isPlaying && (
            <div className="flex items-end gap-0.5 h-2.5 pl-0.5 justify-center pointer-events-none select-none">
              <div className="w-[1.5px] h-1.5 bg-secondary animate-frequency-1" />
              <div className="w-[1.5px] h-2.5 bg-secondary animate-frequency-2 [animation-delay:0.2s]" />
              <div className="w-[1.5px] h-1 bg-secondary animate-frequency-3 [animation-delay:0.4s]" />
            </div>
          )}
        </button>
      </motion.div>

      {/* Playlist Side Panel in Phase 3 */}
      <motion.div
        style={{
          x: playlistX,
          y: playlistY,
          opacity: playlistOpacity,
          pointerEvents: playlistPointerEvents
        }}
        className={
          isMobile
            ? "fixed bottom-4 left-0 right-0 mx-auto w-[90%] max-w-[340px] z-30 h-fit"
            : "fixed right-16 top-0 bottom-0 my-auto h-fit w-full max-w-sm z-30"
        }
      >
        <div className="glass-panel p-4 md:p-6 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden select-text text-left">
          <div className="absolute top-2 right-2 text-white/5 text-xs">✦</div>
          <div className="absolute bottom-2 left-2 text-white/5 text-xs">✦</div>

          <div className="space-y-4 md:space-y-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-4xl font-fill animate-pulse">
                playlist_play
              </span>
              <div>
                <h3 className="font-display text-xl md:text-2xl text-starlight font-bold tracking-wide">
                  Simfoni Angkasa
                </h3>
                <p className="text-[10px] text-mist/50">Melodi indah pengiring pembacaan bait puisi</p>
              </div>
            </div>

            {/* Equalizer Visual Display */}
            <div className="flex items-center justify-between p-4 bg-stone-950/45 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden relative">
                  <span className={`material-symbols-outlined text-lg text-primary ${isPlaying ? 'animate-spin-slow' : 'opacity-50'}`}>
                    album
                  </span>
                </div>
                <div>
                  <div className="text-xs text-starlight font-semibold line-clamp-1">{currentTrack.title}</div>
                  <div className="text-[9px] text-mist/40 line-clamp-1">{currentTrack.artist}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 pr-1">
                <button onClick={handlePrevTrack} className="material-symbols-outlined text-mist hover:text-starlight text-base cursor-pointer">skip_previous</button>
                <button onClick={togglePlay} className="material-symbols-outlined text-starlight bg-white/10 hover:bg-white/20 p-1.5 rounded-full text-sm cursor-pointer">
                  {isPlaying ? "pause" : "play_arrow"}
                </button>
                <button onClick={handleNextTrack} className="material-symbols-outlined text-mist hover:text-starlight text-base cursor-pointer">skip_next</button>
              </div>
            </div>

            {/* Custom Seeker Progress slider */}
            <PlaylistProgressBar duration={duration} handleProgressBarSeek={handleProgressBarSeek} />

            {/* Tracks List Panel */}
            <div className="space-y-2">
              <span className="text-[9px] font-semibold tracking-widest text-mist/40 font-label-caps uppercase block">Daftar Putar</span>
              <ul className="space-y-1.5 scrollbar-styled pr-1 max-h-[120px] md:max-h-[190px] overflow-y-auto">
                {activePlaylist.map((track, i) => (
                  <li key={i}>
                    <button
                      onClick={() => playTrack(i)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                        currentTrackIndex === i 
                          ? 'bg-glow-gold/15 text-secondary border-l-2 border-secondary font-semibold' 
                          : 'hover:bg-white/5 text-mist'
                      }`}
                    >
                      <div className="truncate flex-1">
                        <p className="truncate font-medium">{track.title}</p>
                        <p className="truncate font-light text-[9px] opacity-60">{track.artist}</p>
                      </div>
                      {currentTrackIndex === i && isPlaying && (
                        <span className="material-symbols-outlined text-xs animate-pulse text-secondary">
                          graphic_eq
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Open in YouTube Link */}
            {currentTrack.youtubeUrl && (
              <a 
                href={currentTrack.youtubeUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-stone-900 border border-white/10 hover:border-secondary/35 rounded-xl text-[10px] font-label-caps uppercase tracking-wider text-mist hover:text-secondary font-semibold transition-all"
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                <span>Buka di YouTube</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating Sparkle star trigger (Easter egg ✦ in sky) */}
      <div 
        className="absolute top-[18%] left-[22%] md:top-[15%] md:left-[25%] z-20 cursor-pointer transition-all duration-1000 group hover:scale-135"
        onClick={handleSecretAreaClick}
        aria-hidden="true"
      >
        <div className="relative">
          <span 
            className={`material-symbols-outlined text-xl transition-all duration-700 animate-pulse ${
              secretUnlocked 
                ? 'text-secondary font-fill drop-shadow-[0_0_15px_rgba(255,243,176,0.9)] scale-110' 
                : 'text-mist/45 hover:text-secondary group-hover:drop-shadow-[0_0_8px_white]'
            }`}
            style={{ fontVariationSettings: secretUnlocked ? "'FILL' 1" : undefined }}
          >
            sparkles
          </span>
          {!secretUnlocked && (
            <span className="absolute left-6 top-0 hidden group-hover:block transition-all bg-deep-navy px-2 py-1 rounded text-[8px] whitespace-nowrap text-mist border border-white/5 tracking-widest font-label-caps uppercase">
              {clicksToSecret} klik lagi
            </span>
          )}
        </div>
      </div>

      {/* Global Modals container overlay */}
      <AnimatePresence>
        {activeModal && activeModal !== 'stellarium' && activeModal !== 'puisi' && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-deep-navy/80 backdrop-blur-md cursor-pointer" 
              onClick={() => setActiveModal(null)} 
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="relative glass-panel w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-10 shadow-2xl border border-white/10"
            >
              
              {/* Close button */}
              <button
                className="absolute top-4 right-4 md:top-6 md:right-6 material-symbols-outlined text-mist hover:text-starlight hover:rotate-90 transition-all cursor-pointer z-10 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
              >
                close
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModal}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  {activeModal === 'puisi' && (
                    <PoemBrowserModal
                      poems={poemsState}
                      poemIndex={poemIndex}
                      isChangingPoem={isChangingPoem}
                      changePoem={changePoem}
                      setPoemIndex={setPoemIndex}
                      poetryView={poetryView}
                      setPoetryView={setPoetryView}
                      showToast={showToast}
                      isPlaying={isPlaying}
                      seekTo={seekTo}
                      currentTrackIndex={currentTrackIndex}
                      playlistData={activePlaylist}
                      onPlaySongFromPoem={handlePlaySongFromPoem}
                    />
                  )}

                  {activeModal === 'surat' && (
                    <div className="max-w-3xl mx-auto space-y-6 select-text text-left">
                      <div className="text-center relative py-4">
                        <span className="material-symbols-outlined text-secondary text-5xl block mb-2 drop-shadow-[0_0_15px_rgba(255,243,176,0.6)] animate-pulse">
                          auto_stories
                        </span>
                        <h2 className="font-display text-3xl md:text-4xl text-starlight tracking-wider font-bold">
                          Warkah Senja dari Taman Malam
                        </h2>
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-secondary/50" />
                          <span className="text-secondary text-xs tracking-widest font-serif uppercase">Surat Untuk Sahabat</span>
                          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-secondary/50" />
                        </div>
                      </div>

                      <div className="relative border border-secondary/20 rounded-2xl bg-stone-950/45 p-6 md:p-12 shadow-[0_0_30px_rgba(210,200,136,0.05)] overflow-hidden">
                        <div className="absolute inset-0 stardust opacity-10 pointer-events-none" />
                        <div className="absolute top-3 left-3 text-secondary/35 text-xs select-none">✦</div>
                        <div className="absolute top-3 right-3 text-secondary/35 text-xs select-none">✦</div>
                        <div className="absolute bottom-3 left-3 text-secondary/35 text-xs select-none">✦</div>
                        <div className="absolute bottom-3 right-3 text-secondary/35 text-xs select-none">✦</div>

                        <div className="font-poem text-lg md:text-xl leading-relaxed text-stone-100 space-y-6 italic relative z-10">
                          <p className="text-xl md:text-2xl font-bold not-italic text-secondary tracking-wide border-b border-white/5 pb-3 font-display">
                            Sahabatku yang Baik,
                          </p>
                          <p>
                            Menulis warkah ini rasanya seperti memetik kuntum melati malam—sunyi, wangi, dan penuh rahasia. Di bawah bernaung kubah langit Midnight Garden ini, aku sering termenung memikirkan setiap langkah perjalanan yang telah kita tempuh.
                          </p>
                          <p>
                            Dunia luar terkadang bising dan cepat berlalu, namun dalam sunyi bait-bait puisi yang kutulis di sini, selalu ada ruang hening untuk mengenang ketulusan dekap ramahmu. Setiap tawa di kedai kopi pagi, cerita yang melebur di jingga senja, serta mimpi-mimpi gila yang kita bisikkan adalah warna abadi di kanvas kelam hidupku.
                          </p>
                          <p>
                            Terima kasih telah menjadi jangkar saat ombak ragu menerpa, dan menjadi lentera di sela rasi jalan yang gelap. Kuharap, di mana pun raga kita berpijak, bait-bait sederhana ini dapat memeluk hatimu dengan rasa aman—seperti hujan yang meneduhkan ruang-ruang lelah.
                          </p>
                          <div className="pt-6 border-t border-white/5 mt-8 flex flex-col items-end">
                            <span className="text-rose-400 font-fill text-2xl animate-pulse">♥</span>
                            <span className="text-secondary text-xs uppercase tracking-widest font-label-caps mt-1">Sahabat Sejatimu,</span>
                            <span className="text-starlight font-serif text-lg font-bold mt-1">Roderikus</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'kenangan' && (
                    <GalleryModal showToast={showToast} />
                  )}

                  {activeModal === 'copilot' && (
                    <CopilotModal onPoemGenerated={handlePoemGenerated} showToast={showToast} />
                  )}

                  {activeModal === 'admin' && (
                    <AdminDashboard poemsList={poemsState} onPoemsUpdated={handlePoemsUpdated} showToast={showToast} />
                  )}

                  {activeModal === 'settings' && (
                    <div className="max-w-md mx-auto space-y-6 select-text text-left">
                      <div className="text-center relative py-4">
                        <span className="material-symbols-outlined text-primary text-5xl block mb-2 animate-spin-slow">
                          settings
                        </span>
                        <h2 className="font-display text-3xl md:text-4xl text-starlight tracking-wider font-bold">
                          Pengaturan
                        </h2>
                        <p className="text-xs text-mist/50">Sesuaikan suasana visual & audio Midnight Garden</p>
                      </div>

                      <div className="space-y-5 border border-white/5 rounded-2xl bg-stone-950/45 p-6 shadow-xl font-sans">
                        <h3 className="text-xs font-semibold text-secondary tracking-widest font-label-caps uppercase border-b border-white/5 pb-2">🌟 Efek Atmosfer</h3>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-starlight">Kunang-Kunang</p>
                            <p className="text-[10px] text-mist/40">Tampilkan partikel cahaya melayang</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={showFireflies}
                            onChange={(e) => setShowFireflies(e.target.checked)}
                            className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded focus:ring-primary/20 cursor-pointer"
                          />
                        </div>

                        {showFireflies && (
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-[10px] text-mist/50">
                              <span>Jumlah Partikel</span>
                              <span>{firefliesCount} kunang-kunang</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="60"
                              value={firefliesCount}
                              onChange={(e) => setFirefliesCount(parseInt(e.target.value))}
                              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                            />
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-starlight">Performance Mode</p>
                            <p className="text-[10px] text-mist/40">Nonaktifkan kanvas interaktif jika lag</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={performanceMode}
                            onChange={(e) => setPerformanceMode(e.target.checked)}
                            className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded focus:ring-primary/20 cursor-pointer"
                          />
                        </div>

                        <h3 className="text-xs font-semibold text-secondary tracking-widest font-label-caps uppercase border-b border-white/5 pb-2 pt-2">🎵 Volume Musik</h3>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-[10px] text-mist/50">
                            <span>Volume BGM</span>
                            <span>{volume}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                        </div>

                        <div className="pt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setShowFireflies(true);
                              setFirefliesCount(25);
                              setPerformanceMode(false);
                              setVolume(40);
                              if (ytPlayerRef.current && ytPlayerRef.current.setVolume) ytPlayerRef.current.setVolume(40);
                              showToast("🔄 Pengaturan direset ke default.");
                            }}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-semibold font-label-caps uppercase tracking-wider text-mist hover:text-starlight text-center transition-all cursor-pointer"
                          >
                            Reset ke Default
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'secret' && (
                    <div className="max-w-md mx-auto py-10 space-y-6 text-center select-text font-body">
                      <span className="material-symbols-outlined text-secondary text-6xl font-fill animate-[spin_5s_linear_infinite]">
                        star
                      </span>
                      <div className="space-y-2">
                        <h2 className="font-display text-2.5xl md:text-3.5xl text-starlight tracking-wider font-bold">
                          Bintang Tersembunyi
                        </h2>
                        <p className="text-secondary text-xs font-mono font-semibold tracking-widest uppercase">Kamu Menemukannya!</p>
                      </div>

                      <div className="border border-secondary/20 rounded-2xl bg-stone-950/45 p-6 shadow-xl leading-relaxed text-stone-200 text-sm italic font-poem">
                        “Di antara semua binar rasi bintang yang menyelimuti Midnight Garden ini, kaulah bintang yang paling terang—yang kehadirannya selalu menghangatkan dinginnya sunyi dalam kepalaku. Terima kasih telah bersinar.”
                      </div>

                      <button
                        onClick={() => setActiveModal(null)}
                        className="px-5 py-2.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 rounded-full text-xs font-semibold text-secondary hover:text-starlight transition-all cursor-pointer font-label-caps uppercase"
                      >
                        Kembali Ke Taman
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full screen Stellarium Modal */}
      <AnimatePresence>
        {activeModal === 'stellarium' && (
          <motion.div
            key="stellarium-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
          >
            <StellariumModal
              onClose={() => setActiveModal(null)}
              showToast={showToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full screen 3D Sphere Poetry Reader */}
      <AnimatePresence>
        {activeModal === 'puisi' && (
          <motion.div
            key="puisi-3d-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
          >
            <Interactive3DPoemReader
              poem={poemsState[poemIndex] || poemsState[0]}
              allPoems={poemsState}
              onSelectPoem={(p) => {
                const idx = poemsState.findIndex((x) => x.id === p.id);
                if (idx > -1) setPoemIndex(idx);
              }}
              onClose={() => setActiveModal(null)}
              showToast={showToast}
              isPlaying={isPlaying}
              seekTo={seekTo}
              onPlaySongFromPoem={handlePlaySongFromPoem}
              onNextPoem={() => changePoem("next")}
              onPrevPoem={() => changePoem("prev")}
              poemIndex={poemIndex}
              totalPoems={poemsState.length}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Music Sidebar (Left Drawer) */}
      <AnimatePresence>
        {showMusicSidebar && (
          <MusicSidebar
            onClose={() => setShowMusicSidebar(false)}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            currentTrack={currentTrack}
            currentTrackIndex={currentTrackIndex}
            activePlaylist={activePlaylist}
            playTrack={playTrack}
            handlePrevTrack={handlePrevTrack}
            handleNextTrack={handleNextTrack}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            customQueue={customQueue}
            addToQueue={addToQueue}
            removeFromQueue={removeFromQueue}
            setCustomQueue={setCustomQueue}
            showToast={showToast}
            shuffle={shuffle}
            setShuffle={setShuffle}
            volume={volume}
            isMuted={isMuted}
            toggleMute={toggleMute}
            handleVolumeChange={handleVolumeChange}
            handleProgressBarSeek={handleProgressBarSeek}
            seekTo={seekTo}
            duration={duration}
          />
        )}
      </AnimatePresence>

      {/* Global Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[200] glass-panel px-4 py-2.5 rounded-full border border-primary/20 text-xs text-starlight shadow-lg flex items-center gap-2 font-semibold tracking-wide"
          >
            <span className="material-symbols-outlined text-sm text-secondary font-fill animate-pulse">info</span>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
