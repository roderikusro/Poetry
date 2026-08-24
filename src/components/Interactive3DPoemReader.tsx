import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { motion, AnimatePresence } from "motion/react";
import { Poem } from "../types";
import { getStanzaImage } from "../data/poetryData";
import { stars, constellations, raDecToCartesian } from "../data/constellationData";

interface Interactive3DPoemReaderProps {
  poem: Poem;
  allPoems?: Poem[];
  onSelectPoem?: (poem: Poem) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  seekTo?: (seconds: number) => void;
  onPlaySongFromPoem?: (poem: Poem) => void;
  onNextPoem?: () => void;
  onPrevPoem?: () => void;
  poemIndex?: number;
  totalPoems?: number;
}

export default function Interactive3DPoemReader({
  poem,
  allPoems = [],
  onSelectPoem,
  onClose,
  showToast,
  isPlaying = false,
  seekTo,
  onPlaySongFromPoem,
  onNextPoem,
  onPrevPoem
}: Interactive3DPoemReaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Active Stanza Index
  const [currentStanzaIndex, setCurrentStanzaIndex] = useState(0);
  const totalStanzas = poem.stanzas.length;

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"poems" | "config">("poems");
  const [searchQuery, setSearchQuery] = useState("");

  // 3D Atmosphere Config
  const [showLines, setShowLines] = useState(true);
  const [lineColor, setLineColor] = useState("#d2c888");
  const [starBrightness, setStarBrightness] = useState(1.2);
  const [skyRotationSpeed, setSkyRotationSpeed] = useState(0.012);

  // Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const skySphereRef = useRef<THREE.Mesh | null>(null);
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const constellationLinesRef = useRef<THREE.LineSegments | null>(null);
  const photoCardMeshRef = useRef<THREE.Mesh | null>(null);
  const starMaterialRef = useRef<THREE.PointsMaterial | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const targetRotationYRef = useRef(0);
  const isScrollingRef = useRef(false);
  const touchStartYRef = useRef(0);

  // Reset stanza index when poem changes
  useEffect(() => {
    setCurrentStanzaIndex(0);
    targetRotationYRef.current = 0;
  }, [poem.id]);

  // Typewriter animation per stanza
  useEffect(() => {
    const fullText = poem.stanzas[currentStanzaIndex] || "";
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const speed = 25;

    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [currentStanzaIndex, poem]);

  // Handle Stanza Navigation with Smooth 3D Sphere Rotation
  const goToStanza = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalStanzas) return;
      setCurrentStanzaIndex(index);

      if (poem.timestamps && poem.timestamps[index] !== undefined && seekTo) {
        seekTo(poem.timestamps[index]);
      }

      // Smoothly rotate the 3D Sky Sphere target Y rotation per stanza
      targetRotationYRef.current = index * (Math.PI / 3);
    },
    [totalStanzas, poem, seekTo]
  );

  const handleNextStanza = useCallback(() => {
    if (currentStanzaIndex < totalStanzas - 1) {
      goToStanza(currentStanzaIndex + 1);
    } else if (onNextPoem) {
      onNextPoem();
    }
  }, [currentStanzaIndex, totalStanzas, goToStanza, onNextPoem]);

  const handlePrevStanza = useCallback(() => {
    if (currentStanzaIndex > 0) {
      goToStanza(currentStanzaIndex - 1);
    } else if (onPrevPoem) {
      onPrevPoem();
    }
  }, [currentStanzaIndex, goToStanza, onPrevPoem]);

  // Filtered poems for sidebar search
  const filteredPoems = useMemo(() => {
    if (!searchQuery.trim()) return allPoems;
    const q = searchQuery.toLowerCase();
    return allPoems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q)
    );
  }, [allPoems, searchQuery]);

  // Helper: Create Small Circular Star Texture
  const createStarTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.4, "rgba(184, 166, 255, 0.8)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(canvas);
  };

  // Helper: Create Ring Texture
  const createRingTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 65, 128, 128, 128);
      grad.addColorStop(0, "rgba(0, 0, 0, 0)");
      grad.addColorStop(0.5, "rgba(184, 166, 255, 0.65)");
      grad.addColorStop(0.8, "rgba(210, 200, 136, 0.45)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(canvas);
  };

  // Initialize Authentic 3D Skybox Sphere Engine with HDR_background.webp Texture
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.minDistance = 4.0;
    controls.maxDistance = 12.0;
    controls.enablePan = false;
    controls.rotateSpeed = 0.4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const purplePointLight = new THREE.PointLight(0xb8a6ff, 3.0, 30);
    purplePointLight.position.set(5, 5, 8);
    scene.add(purplePointLight);

    const textureLoader = new THREE.TextureLoader();

    // 6. Authentic 3D Skybox Sphere Geometry (using /HDR_background.webp)
    const skyGeo = new THREE.SphereGeometry(450, 60, 40);
    skyGeo.scale(-1, 1, 1); // Invert geometry so texture faces inside sphere

    const hdrTexture = textureLoader.load("/HDR_background.webp");
    hdrTexture.colorSpace = THREE.SRGBColorSpace;
    hdrTexture.minFilter = THREE.LinearFilter;
    hdrTexture.generateMipmaps = false;

    const skyMat = new THREE.MeshBasicMaterial({
      map: hdrTexture
    });

    const skySphere = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skySphere);
    skySphereRef.current = skySphere;

    // 7. Celestial 3D Planet Sphere (using /BG_kolase.webp texture)
    const planetGeo = new THREE.SphereGeometry(1.65, 64, 64);
    const planetTex = textureLoader.load("/BG_kolase.webp");
    planetTex.colorSpace = THREE.SRGBColorSpace;

    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.35,
      metalness: 0.15,
      emissive: new THREE.Color(0x22113b),
      emissiveIntensity: 0.45
    });

    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.position.set(1.6, 0.95, -4.5);
    scene.add(planetMesh);
    planetMeshRef.current = planetMesh;

    // Atmosphere Rim for Planet
    const atmosGeo = new THREE.SphereGeometry(1.76, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0xb8a6ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    planetMesh.add(atmosphereMesh);

    // Orbit Ring for Planet
    const ringGeo = new THREE.RingGeometry(2.1, 3.2, 64);
    const ringTex = createRingTexture();
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    ringMesh.rotation.y = Math.PI / 7;
    planetMesh.add(ringMesh);

    // 8. Constellation Lines Engine
    const linePositions: number[] = [];
    constellations.forEach((c) => {
      c.lines.forEach(([idxA, idxB]) => {
        const starA = stars[idxA];
        const starB = stars[idxB];
        if (starA && starB) {
          const [xa, ya, za] = raDecToCartesian(starA.ra, starA.dec, 140);
          const [xb, yb, zb] = raDecToCartesian(starB.ra, starB.dec, 140);
          linePositions.push(xa, ya, za, xb, yb, zb);
        }
      });
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(lineColor),
      transparent: true,
      opacity: 0.25
    });

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);
    constellationLinesRef.current = lineSegments;

    // 10. Clean Floating 3D Stanza Photo Mesh (Positioned left-center: x = -0.95, y = 0.55, z = 0.5)
    const cardGeo = new THREE.PlaneGeometry(3.3, 2.2);
    const initialImgUrl = getStanzaImage(poem, currentStanzaIndex);

    const cardTexture = textureLoader.load(initialImgUrl);
    const cardMat = new THREE.MeshStandardMaterial({
      map: cardTexture,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.05,
      transparent: true,
      opacity: 0.98
    });

    const photoCardMesh = new THREE.Mesh(cardGeo, cardMat);
    photoCardMesh.position.set(-0.95, 0.55, 0.5);
    scene.add(photoCardMesh);
    photoCardMeshRef.current = photoCardMesh;

    // Mouse movement listener for 3D parallax tilt
    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePosRef.current.targetX = mouseX * 0.15;
      mousePosRef.current.targetY = mouseY * 0.15;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smoothly rotate the 3D Skybox Sphere (HDR_background.webp)
      if (skySphereRef.current) {
        const currentRotY = skySphereRef.current.rotation.y;
        const targetRotY = targetRotationYRef.current + elapsedTime * skyRotationSpeed;
        skySphereRef.current.rotation.y += (targetRotY - currentRotY) * 0.05;
      }

      // Rotate planet sphere
      if (planetMeshRef.current) {
        planetMeshRef.current.rotation.y = elapsedTime * 0.008;
      }

      // Mouse parallax lerp
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;

      // Gentle floating bobbing & mouse tilt for photo mesh
      if (photoCardMeshRef.current) {
        photoCardMeshRef.current.position.y = 0.55 + Math.sin(elapsedTime * 1.5) * 0.05;
        photoCardMeshRef.current.rotation.y = mousePosRef.current.x;
        photoCardMeshRef.current.rotation.x = -mousePosRef.current.y;
        photoCardMeshRef.current.rotation.z = Math.sin(elapsedTime * 0.8) * 0.012;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);

      if (photoCardMeshRef.current) {
        if (w < 768) {
          photoCardMeshRef.current.position.set(0, 0.7, 0.5);
          if (planetMeshRef.current) planetMeshRef.current.position.set(0, 1.2, -5.5);
        } else {
          photoCardMeshRef.current.position.set(-0.95, 0.55, 0.5);
          if (planetMeshRef.current) planetMeshRef.current.position.set(1.6, 0.95, -4.5);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  // Update photo texture when currentStanzaIndex or poem changes
  useEffect(() => {
    if (!photoCardMeshRef.current) return;
    const imgUrl = getStanzaImage(poem, currentStanzaIndex);
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(imgUrl, (tx) => {
      if (photoCardMeshRef.current) {
        const mat = photoCardMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.map = tx;
        mat.needsUpdate = true;
      }
    });
  }, [currentStanzaIndex, poem]);

  // Update line visibility & color dynamically
  useEffect(() => {
    if (constellationLinesRef.current) {
      constellationLinesRef.current.visible = showLines;
      const mat = constellationLinesRef.current.material as THREE.LineBasicMaterial;
      mat.color.set(lineColor);
    }
  }, [showLines, lineColor]);

  // Update star brightness dynamically
  useEffect(() => {
    if (starMaterialRef.current) {
      starMaterialRef.current.size = starBrightness * 1.3;
    }
  }, [starBrightness]);

  // Scroll Wheel Handler for Stanza Page Flip & 3D Sphere Rotation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrollingRef.current) return;

      if (e.deltaY > 20) {
        isScrollingRef.current = true;
        handleNextStanza();
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 450);
      } else if (e.deltaY < -20) {
        isScrollingRef.current = true;
        handlePrevStanza();
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 450);
      }
    };

    const container = mountRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleNextStanza, handlePrevStanza]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 35) {
      if (deltaY > 0) {
        handleNextStanza();
      } else {
        handlePrevStanza();
      }
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNextStanza();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevStanza();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextStanza, handlePrevStanza, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[99999] w-screen h-screen bg-[#020208] overflow-hidden flex flex-col justify-between select-none font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Fullscreen Stellarium 3D Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* 2. Top Left: Clean Single Back Button */}
      <div className="relative z-20 p-4 md:p-6 pointer-events-auto flex items-center justify-between">
        <button
          onClick={onClose}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-stone-950/70 hover:bg-stone-900 border border-white/15 text-starlight text-xs font-semibold tracking-wider font-label-caps transition-all cursor-pointer backdrop-blur-md shadow-lg"
        >
          <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span>KEMBALI KE TAMAN</span>
        </button>

        {/* Top Right: Toggle Sidebar Button */}
        <button
          onClick={() => setShowSidebar((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold tracking-wider font-label-caps transition-all cursor-pointer backdrop-blur-md shadow-lg ${
            showSidebar
              ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(184,166,255,0.3)]"
              : "bg-stone-950/70 border-white/15 text-mist hover:text-starlight hover:bg-stone-900"
          }`}
          title={showSidebar ? "Sembunyikan Sidebar" : "Buka Navigasi Puisi & Konfigurasi"}
        >
          <span className="material-symbols-outlined text-sm font-fill">
            {showSidebar ? "menu_open" : "tune"}
          </span>
          <span className="hidden sm:inline">
            {showSidebar ? "TUTUP SIDEBAR" : "PILIH PUISI / SETTINGS"}
          </span>
        </button>
      </div>

      {/* 3. Center Bottom: Pure Stanza Text with Stanza Counter Badge */}
      <div className="relative z-10 flex-1 flex flex-col justify-end items-center px-6 pb-10 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStanzaIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-3 bg-stone-950/40 p-4 md:p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl"
            >
              {/* Stanza Counter Indicator */}
              <div className="flex items-center justify-center gap-2 text-[10px] tracking-widest text-primary/80 font-mono uppercase">
                <span>✦ BAIT {currentStanzaIndex + 1} DARI {totalStanzas} ✦</span>
              </div>

              {/* Pure Glowing Italic Typography with Drop-Cap */}
              <p className="font-poem text-xl md:text-2.5xl text-starlight leading-relaxed italic tracking-wide select-text drop-cap-gold kinetic-tracking drop-shadow-[0_0_25px_rgba(243,229,171,0.6)]">
                "{displayedText}"
                {isTyping && <span className="animate-pulse text-secondary">|</span>}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Bottom Left: Minimalist Ambient Hint */}
      <div className="relative z-20 p-4 md:p-6 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-950/70 border border-white/10 text-mist/70 text-[11px] font-sans backdrop-blur-md shadow-lg">
          <span className="material-symbols-outlined text-xs text-primary font-fill">swap_calls</span>
          <span>Seret untuk merotasi langit 3D • Scroll / Usap untuk stanza berikutnya</span>
        </div>
      </div>

      {/* 5. Collapsible Right Sidebar Panel */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 z-30 w-80 md:w-96 bg-stone-950/90 border-l border-white/15 backdrop-blur-2xl p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Sidebar Header & Tabs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-starlight tracking-widest font-label-caps uppercase">
                    LANGIT 3D PUISI
                  </span>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="text-mist/50 hover:text-starlight text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs Switcher */}
                <div className="flex border-b border-white/10 text-xs">
                  <button
                    onClick={() => setSidebarTab("poems")}
                    className={`flex-1 py-2 text-center font-bold tracking-wider font-label-caps border-b-2 transition-all cursor-pointer ${
                      sidebarTab === "poems"
                        ? "border-primary text-primary"
                        : "border-transparent text-mist/50 hover:text-mist"
                    }`}
                  >
                    DAFTAR PUISI
                  </button>
                  <button
                    onClick={() => setSidebarTab("config")}
                    className={`flex-1 py-2 text-center font-bold tracking-wider font-label-caps border-b-2 transition-all cursor-pointer ${
                      sidebarTab === "config"
                        ? "border-primary text-primary"
                        : "border-transparent text-mist/50 hover:text-mist"
                    }`}
                  >
                    KONFIGURASI 3D
                  </button>
                </div>
              </div>

              {/* TAB 1: DAFTAR PUISI */}
              {sidebarTab === "poems" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Search Bar */}
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs">
                    <span className="material-symbols-outlined text-mist/50 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="Cari puisi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-starlight outline-none w-full placeholder:text-mist/30"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-mist/40 hover:text-mist">
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Active Poem Header Badge */}
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                    <div className="text-[10px] text-primary/80 uppercase font-mono tracking-widest">
                      MEMBACA SEKARANG:
                    </div>
                    <div className="font-bold text-starlight text-sm flex items-center gap-2">
                      <span>{poem.emoji}</span>
                      <span>{poem.title}</span>
                    </div>
                    <div className="text-[11px] text-mist/60">
                      Bait {currentStanzaIndex + 1} dari {totalStanzas} · Karya {poem.author}
                    </div>
                  </div>

                  {/* Poem List Items */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredPoems.map((p) => {
                      const isActive = p.id === poem.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (onSelectPoem) onSelectPoem(p);
                            showToast(`✦ Membuka puisi "${p.title}"`);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isActive
                              ? "bg-primary/20 border-primary text-starlight shadow-[0_0_12px_rgba(184,166,255,0.2)]"
                              : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-mist"
                          }`}
                        >
                          <div className="space-y-0.5 max-w-[210px]">
                            <div className="font-bold text-xs text-starlight truncate flex items-center gap-1.5">
                              <span>{p.emoji}</span>
                              <span>{p.title}</span>
                            </div>
                            <div className="text-[10px] text-mist/50 italic line-clamp-1 font-serif">
                              "{p.excerpt}"
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-xs text-primary/70">
                            {isActive ? "auto_awesome" : "chevron_right"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: KONFIGURASI 3D */}
              {sidebarTab === "config" && (
                <div className="space-y-5 text-xs animate-fade-in">
                  {/* Layer Observation Toggles */}
                  <div className="space-y-3">
                    <label className="text-[10px] text-mist/50 font-bold uppercase tracking-widest font-mono block">
                      LAYER PENGAMATAN 3D
                    </label>

                    <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                      <span>Garis Rasi Bintang</span>
                      <input
                        type="checkbox"
                        checked={showLines}
                        onChange={(e) => setShowLines(e.target.checked)}
                        className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded cursor-pointer"
                      />
                    </div>

                    {/* Color picker for constellation lines */}
                    <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                      <span className="text-[10px] text-mist/60 uppercase">Warna Garis Rasi</span>
                      <div className="flex gap-2 pt-1">
                        {["#d2c888", "#b8a6ff", "#00e5ff", "#ffffff"].map((col) => (
                          <button
                            key={col}
                            onClick={() => setLineColor(col)}
                            style={{ backgroundColor: col }}
                            className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                              lineColor === col ? "scale-110 border-white" : "border-transparent opacity-60"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Atmosphere Visual Controls */}
                  <div className="space-y-4">
                    <label className="text-[10px] text-mist/50 font-bold uppercase tracking-widest font-mono block">
                      ATMOSFER VISUAL 3D
                    </label>

                    <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                      <div className="flex justify-between text-[11px]">
                        <span>Kecepatan Rotasi Langit</span>
                        <span className="font-mono text-primary">
                          {Math.round(skyRotationSpeed * 1000)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.002"
                        max="0.03"
                        step="0.002"
                        value={skyRotationSpeed}
                        onChange={(e) => setSkyRotationSpeed(parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer h-1.5 bg-white/10 rounded"
                      />
                    </div>

                    <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                      <div className="flex justify-between text-[11px]">
                        <span>Kecerahan Bintang</span>
                        <span className="font-mono text-primary">{Math.round(starBrightness * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={starBrightness}
                        onChange={(e) => setStarBrightness(parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer h-1.5 bg-white/10 rounded"
                      />
                    </div>

                    {/* Audio BGM Toggle */}
                    {poem.songTitle && onPlaySongFromPoem && (
                      <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span>Musik Pengiring</span>
                          <button
                            onClick={() => onPlaySongFromPoem(poem)}
                            className={`px-3 py-1 rounded-full text-[10px] border transition-all cursor-pointer font-label-caps ${
                              isPlaying
                                ? "bg-secondary/20 border-secondary text-secondary font-bold"
                                : "bg-white/5 border-white/10 text-mist hover:text-starlight"
                            }`}
                          >
                            {isPlaying ? "JEDA" : "PUTAR BGM"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Footer Hint */}
            <div className="pt-4 border-t border-white/10 text-[10px] text-center text-mist/40 font-serif italic">
              ✦ Stellarium 3D Skybox Poetry Reader ✦
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
