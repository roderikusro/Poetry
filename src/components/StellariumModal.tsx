import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { stars, constellations, raDecToCartesian, Constellation } from "../data/constellationData";
import { getPoemById } from "../data/poetryData";
import { motion, AnimatePresence } from "motion/react";

// Process texture to make near-black transparent and fade the outer edges
const processTexture = (image: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  
  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxDist = Math.min(cx, cy);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    
    // Near black threshold
    const brightness = (r + g + b) / 3;
    
    // Radial distance for soft vignette edges
    const idx = i / 4;
    const x = idx % canvas.width;
    const y = Math.floor(idx / canvas.width);
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    
    // Soft circular vignette
    const radialFade = Math.max(0, 1 - (dist / maxDist) * 1.15);

    if (brightness < 38) {
      data[i+3] = 0; // Make transparent
    } else {
      // Apply smooth radial vignette and transparency
      data[i+3] = Math.min(data[i+3], 255 * radialFade);
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

interface StellariumModalProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function StellariumModal({ onClose, showToast }: StellariumModalProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const starMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const constellationLinesRef = useRef<THREE.LineSegments | null>(null);
  const constellationArtGroupRef = useRef<THREE.Group | null>(null);
  const bgMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  
  // Moving objects & particle systems refs
  const cometsRef = useRef<{
    mesh: THREE.Mesh;
    trail: THREE.Points;
    history: THREE.Vector3[];
    type: 'blue' | 'red' | 'gold';
    orbitSpeed: number;
    orbitRadiusX: number;
    orbitRadiusY: number;
    orbitRadiusZ: number;
    color: string;
    points: number;
    size: number;
    phase: number;
    visible: boolean;
    respawnTime: number;
  }[]>([]);
  const shootingStarsRef = useRef<{ start: THREE.Vector3; end: THREE.Vector3; current: THREE.Vector3; progress: number; speed: number; line: THREE.Line; id: number }[]>([]);
  const explosionsRef = useRef<{ points: THREE.Points; velocities: THREE.Vector3[]; age: number; maxAge: number }[]>([]);

  // UI Configuration states
  const [showLines, setShowLines] = useState(true);
  const [showArt, setShowArt] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [starBrightness, setStarBrightness] = useState(1.5);
  const [lineColor, setLineColor] = useState("#d2c888"); // Gold-400 (Emas Kartika) as default
  const [artOpacity, setArtOpacity] = useState(0.25); // Dynamic art overlay opacity
  const [nebulaBrightness, setNebulaBrightness] = useState(0.85); // Skybox nebula brightness
  const [stardust, setStardust] = useState(0); // Collected stardust count
  const [blueCaptures, setBlueCaptures] = useState(0);
  const [redCaptures, setRedCaptures] = useState(0);
  const [goldCaptures, setGoldCaptures] = useState(0);
  const [starCaptures, setStarCaptures] = useState(0);
  const [selectedConstellation, setSelectedConstellation] = useState<Constellation | null>(null);
  const [projectedLabels, setProjectedLabels] = useState<{ id: string; name: string; x: number; y: number; visible: boolean }[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'info'>('config');

  // Trigger auto-rotate to target constellation center
  const rotateToConstellation = (c: Constellation) => {
    if (!controlsRef.current || !cameraRef.current) return;
    
    // Get Cartesian coords of constellation center
    const [x, y, z] = raDecToCartesian(c.centerRa, c.centerDec, 250); // look direction vector
    
    // Animate camera target / rotation smoothly
    const startDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.current.quaternion).normalize();
    const targetDir = new THREE.Vector3(x, y, z).normalize();
    
    // Simple lerp animation for rotation
    const duration = 1200; // ms
    const startTime = performance.now();
    
    const animateRotation = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing outCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const currentDir = new THREE.Vector3().lerpVectors(startDir, targetDir, ease).normalize();
      
      // Calculate lookAt rotation
      const targetRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), currentDir);
      cameraRef.current?.quaternion.copy(targetRotation);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        setSelectedConstellation(c);
        setActiveTab('info');
        showToast(`📍 Mengamati Rasi Bintang ${c.name}`);
      }
    };
    
    requestAnimationFrame(animateRotation);
  };

  // Helper to create circular star texture
  const createStarTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
    }
    return new THREE.CanvasTexture(canvas);
  };

  // Set up Three.js Scene
  useEffect(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#02050f"); // Fallback
    sceneRef.current = scene;

    // Load Background Skybox Nebula
    const bgGeometry = new THREE.SphereGeometry(600, 60, 40);
    bgGeometry.scale(-1, 1, 1); // Invert
    const skyLoader = new THREE.TextureLoader();
    const bgTexture = skyLoader.load("/HDR_background.webp");
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    bgTexture.minFilter = THREE.LinearFilter;
    bgTexture.generateMipmaps = false;

    const bgMaterial = new THREE.MeshBasicMaterial({
      map: bgTexture,
      color: new THREE.Color(nebulaBrightness, nebulaBrightness, nebulaBrightness)
    });
    bgMaterialRef.current = bgMaterial;
    const bgSphere = new THREE.Mesh(bgGeometry, bgMaterial);
    scene.add(bgSphere);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 0, 0.1); // Camera placed in center of celestial sphere
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.minDistance = 0.05;
    controls.maxDistance = 10;
    controls.enablePan = false; // Lock translation, can only rotate
    controls.rotateSpeed = -0.3; // Invert drag direction to make it feel natural
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // 5. Render Stars (THREE.Points with custom shader)
    const starGeometry = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    const starSizes: number[] = [];
    const starColors: number[] = [];
    const twinkleSpeeds: number[] = [];

    stars.forEach((star) => {
      const [x, y, z] = raDecToCartesian(star.ra, star.dec, 500);
      starPositions.push(x, y, z);
      
      // Size proportional to brightness (lower magnitude = larger star)
      const size = Math.max(0.5, 6.0 - star.mag); 
      starSizes.push(size);

      // Color spectral conversion
      const color = new THREE.Color(star.color);
      starColors.push(color.r, color.g, color.b);

      // Random twinkle speed
      twinkleSpeeds.push(1.5 + Math.random() * 3.5);
    });

    starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("aSize", new THREE.Float32BufferAttribute(starSizes, 1));
    starGeometry.setAttribute("aColor", new THREE.Float32BufferAttribute(starColors, 3));
    starGeometry.setAttribute("aTwinkleSpeed", new THREE.Float32BufferAttribute(twinkleSpeeds, 1));

    // Custom star shader
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBrightness: { value: starBrightness },
        uTexture: { value: createStarTexture() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBrightness;
        attribute float aSize;
        attribute float aTwinkleSpeed;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = aColor;
          vTwinkle = 0.65 + 0.35 * sin(uTime * aTwinkleSpeed);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uBrightness * (450.0 / -mvPosition.z) * vTwinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * vTwinkle);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    starMaterialRef.current = starMaterial;
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // 6. Constellation Lines
    const lineIndices: number[] = [];
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    constellations.forEach((c) => {
      c.lines.forEach(([fromId, toId]) => {
        const fromStar = stars.find(s => s.id === fromId);
        const toStar = stars.find(s => s.id === toId);
        
        if (fromStar && toStar) {
          const fromPos = raDecToCartesian(fromStar.ra, fromStar.dec, 498); // Slightly closer to avoid clipping
          const toPos = raDecToCartesian(toStar.ra, toStar.dec, 498);
          
          linePositions.push(...fromPos, ...toPos);
          
          const baseColor = new THREE.Color(lineColor);
          lineColors.push(baseColor.r, baseColor.g, baseColor.b, baseColor.r, baseColor.g, baseColor.b);
        }
      });
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(lineColor),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    const constellationLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    constellationLinesRef.current = constellationLines;
    scene.add(constellationLines);

    // 7. Equator Grid Lines (Optional)
    const gridGroup = new THREE.Group();
    // Equator line
    const equatorGeom = new THREE.BufferGeometry();
    const equatorPoints: number[] = [];
    for (let i = 0; i <= 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const x = 495 * Math.cos(angle);
      const z = 495 * Math.sin(angle);
      equatorPoints.push(x, 0, z);
    }
    equatorGeom.setAttribute("position", new THREE.Float32BufferAttribute(equatorPoints, 3));
    const equatorLine = new THREE.Line(equatorGeom, new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.2
    }));
    gridGroup.add(equatorLine);
    gridGroup.name = "equatorGrid";
    scene.add(gridGroup);

    // 8. Constellation Art Overlays
    const textureLoader = new THREE.TextureLoader();
    const artGroup = new THREE.Group();
    artGroup.name = "constellationArtGroup";
    artGroup.visible = showArt;

    const constellationArtGeometries: THREE.PlaneGeometry[] = [];
    const constellationArtMaterials: THREE.MeshBasicMaterial[] = [];
    const constellationArtTextures: THREE.Texture[] = [];

    constellations.forEach((c) => {
      if (c.artUrl) {
        // Load image first to pre-process it on a canvas
        const img = new Image();
        img.src = c.artUrl;
        img.onload = () => {
          const processedCanvas = processTexture(img);
          const texture = new THREE.CanvasTexture(processedCanvas);
          texture.minFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          constellationArtTextures.push(texture);

          const artGeom = new THREE.PlaneGeometry(165, 165); // Slightly larger
          constellationArtGeometries.push(artGeom);

          const artMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          });
          constellationArtMaterials.push(artMat);

          const artMesh = new THREE.Mesh(artGeom, artMat);
          const [cx, cy, cz] = raDecToCartesian(c.centerRa, c.centerDec, 450);
          artMesh.position.set(cx, cy, cz);
          artMesh.lookAt(0, 0, 0);
          artMesh.name = c.id;

          artGroup.add(artMesh);
        };
      }
    });

    constellationArtGroupRef.current = artGroup;
    scene.add(artGroup);

    // 8.5. Multi-Comet setup (5 active comets of 3 types: Sapphire, Ruby, Golden)
    const cometConfigs: {
      type: 'blue' | 'red' | 'gold';
      color: string;
      trailColor: string;
      orbitSpeed: number;
      orbitRadiusX: number;
      orbitRadiusY: number;
      orbitRadiusZ: number;
      size: number;
      points: number;
      phase: number;
    }[] = [
      { type: 'blue', color: '#3b82f6', trailColor: '#1d4ed8', orbitSpeed: 0.05, orbitRadiusX: 410, orbitRadiusY: 120, orbitRadiusZ: 320, size: 4.0, points: 1, phase: 0 },
      { type: 'blue', color: '#06b6d4', trailColor: '#0891b2', orbitSpeed: 0.07, orbitRadiusX: 380, orbitRadiusY: 210, orbitRadiusZ: 290, size: 3.6, points: 1, phase: Math.PI * 0.5 },
      { type: 'red', color: '#ef4444', trailColor: '#b91c1c', orbitSpeed: 0.12, orbitRadiusX: 430, orbitRadiusY: -150, orbitRadiusZ: 270, size: 3.0, points: 2, phase: Math.PI },
      { type: 'red', color: '#f43f5e', trailColor: '#be123c', orbitSpeed: 0.15, orbitRadiusX: 390, orbitRadiusY: 170, orbitRadiusZ: 350, size: 2.8, points: 2, phase: Math.PI * 1.5 },
      { type: 'gold', color: '#f59e0b', trailColor: '#b45309', orbitSpeed: 0.24, orbitRadiusX: 440, orbitRadiusY: 240, orbitRadiusZ: -200, size: 2.2, points: 5, phase: Math.PI * 0.25 }
    ];

    cometsRef.current = cometConfigs.map((config, index) => {
      const geom = new THREE.SphereGeometry(config.size, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.color),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `comet-${index}`;
      scene.add(mesh);

      // Trail points
      const trailGeom = new THREE.BufferGeometry();
      const trailCount = 30;
      const positions = new Float32Array(trailCount * 3);
      const colors = new Float32Array(trailCount * 3);

      const colorStart = new THREE.Color(config.color);
      const colorEnd = new THREE.Color(config.trailColor);
      for (let i = 0; i < trailCount; i++) {
        const c = colorStart.clone().lerp(colorEnd, i / trailCount);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      trailGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      trailGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const trailMat = new THREE.PointsMaterial({
        map: createStarTexture(),
        size: config.size * 2.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const trail = new THREE.Points(trailGeom, trailMat);
      scene.add(trail);

      return {
        mesh,
        trail,
        history: [],
        type: config.type,
        orbitSpeed: config.orbitSpeed,
        orbitRadiusX: config.orbitRadiusX,
        orbitRadiusY: config.orbitRadiusY,
        orbitRadiusZ: config.orbitRadiusZ,
        color: config.color,
        points: config.points,
        size: config.size,
        phase: config.phase,
        visible: true,
        respawnTime: 0
      };
    });

    // 9. Animation Loop
    const clock = new THREE.Clock();
    clockRef.current = clock;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      
      // Update shader time uniform
      if (starMaterialRef.current) {
        starMaterialRef.current.uniforms.uTime.value = time;
      }

      // Update OrbitControls
      controls.update();

      // Update projected 2D label coordinates
      if (showLabels && canvasContainerRef.current) {
        const w = canvasContainerRef.current.clientWidth;
        const h = canvasContainerRef.current.clientHeight;
        const labels2d = constellations.map((c) => {
          const [cx, cy, cz] = raDecToCartesian(c.centerRa, c.centerDec, 500);
          const tempV = new THREE.Vector3(cx, cy, cz);
          tempV.project(camera);
          
          const x = (tempV.x * 0.5 + 0.5) * w;
          const y = (-(tempV.y) * 0.5 + 0.5) * h;
          
          // Check if coordinate is in front of camera plane (z < 1)
          const visible = tempV.z < 1; 

          return {
            id: c.id,
            name: c.name,
            x,
            y,
            visible,
          };
        });
        setProjectedLabels(labels2d);
      }

      // 9.2. Update Multi-Comet Positions & Trails
      cometsRef.current.forEach((comet) => {
        if (!comet.visible) {
          if (time >= comet.respawnTime) {
            // Respawn comet as a "new" one
            comet.visible = true;
            comet.mesh.visible = true;
            comet.trail.visible = true;
            comet.phase = Math.random() * Math.PI * 2;
            comet.history = [];

            // Randomize its parameters slightly based on original config
            const baseConfig = cometConfigs.find(c => c.type === comet.type);
            if (baseConfig) {
              comet.orbitSpeed = baseConfig.orbitSpeed * (0.85 + Math.random() * 0.3);
              comet.orbitRadiusX = baseConfig.orbitRadiusX * (0.9 + Math.random() * 0.2);
              comet.orbitRadiusY = baseConfig.orbitRadiusY * (0.8 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1);
              comet.orbitRadiusZ = baseConfig.orbitRadiusZ * (0.9 + Math.random() * 0.2);
            }
          } else {
            return; // Skip rendering
          }
        }

        const angle = time * comet.orbitSpeed + comet.phase;
        const cx = comet.orbitRadiusX * Math.cos(angle);
        const cy = comet.orbitRadiusY * Math.sin(angle);
        const cz = comet.orbitRadiusZ * Math.sin(angle);
        comet.mesh.position.set(cx, cy, cz);

        comet.history.unshift(new THREE.Vector3(cx, cy, cz));
        if (comet.history.length > 30) {
          comet.history.pop();
        }

        const positions = comet.trail.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < 30; i++) {
          const pos = comet.history[i] || new THREE.Vector3(cx, cy, cz);
          positions[i * 3] = pos.x + (Math.random() - 0.5) * 1.8;
          positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 1.8;
          positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 1.8;
        }
        comet.trail.geometry.attributes.position.needsUpdate = true;
      });

      // 9.3. Spawn and Update Shooting Stars
      if (Math.random() < 0.005 && shootingStarsRef.current.length < 2) {
        // Spawn direction coordinates on sky sphere
        const startTheta = Math.random() * Math.PI * 2;
        const startPhi = Math.acos((Math.random() * 2) - 1);
        const r = 450;
        const start = new THREE.Vector3(
          r * Math.sin(startPhi) * Math.cos(startTheta),
          r * Math.cos(startPhi),
          r * Math.sin(startPhi) * Math.sin(startTheta)
        );
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 160,
          (Math.random() - 0.5) * 160,
          (Math.random() - 0.5) * 160
        );
        const end = start.clone().add(offset).normalize().multiplyScalar(r);

        const starGeom = new THREE.BufferGeometry().setFromPoints([start, start]);
        const starMat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(starGeom, starMat);
        scene.add(line);

        shootingStarsRef.current.push({
          start,
          end,
          current: start.clone(),
          progress: 0,
          speed: 0.9 + Math.random() * 0.9,
          line,
          id: Date.now() + Math.random()
        });
      }

      // Update active shooting stars (backward loop to handle splicing safely)
      const delta = 0.016; 
      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const star = shootingStarsRef.current[i];
        star.progress += star.speed * delta;
        if (star.progress >= 1.0) {
          scene.remove(star.line);
          star.line.geometry.dispose();
          (star.line.material as THREE.Material).dispose();
          shootingStarsRef.current.splice(i, 1);
        } else {
          const prevPos = star.current.clone();
          star.current.lerpVectors(star.start, star.end, star.progress);
          star.line.geometry.setFromPoints([prevPos, star.current]);
          
          if (star.progress > 0.7) {
            (star.line.material as THREE.LineBasicMaterial).opacity = (1.0 - star.progress) / 0.3;
          }
        }
      }

      // 9.4. Update Active Particle Explosions (backward loop to handle splicing safely)
      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const exp = explosionsRef.current[i];
        exp.age += 1;
        if (exp.age >= exp.maxAge) {
          scene.remove(exp.points);
          exp.points.geometry.dispose();
          (exp.points.material as THREE.Material).dispose();
          explosionsRef.current.splice(i, 1);
        } else {
          const positions = exp.points.geometry.attributes.position.array as Float32Array;
          const opacity = 1.0 - (exp.age / exp.maxAge);
          (exp.points.material as THREE.PointsMaterial).opacity = opacity;
          
          for (let j = 0; j < exp.velocities.length; j++) {
            const vel = exp.velocities[j];
            positions[j * 3] += vel.x * 0.05;
            positions[j * 3 + 1] += vel.y * 0.05;
            positions[j * 3 + 2] += vel.z * 0.05;
            vel.y -= 0.12; // Gravity effect
          }
          exp.points.geometry.attributes.position.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      const container = canvasContainerRef.current;
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      
      // Dispose WebGL resources
      bgGeometry.dispose();
      bgMaterial.dispose();
      bgTexture.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      equatorGeom.dispose();
      equatorLine.material.dispose();
      
      // Dispose Art overlays
      constellationArtGeometries.forEach(g => g.dispose());
      constellationArtMaterials.forEach(m => m.dispose());
      constellationArtTextures.forEach(t => t.dispose());

      // Dispose Comet resources
      cometsRef.current.forEach((comet) => {
        scene.remove(comet.mesh);
        comet.mesh.geometry.dispose();
        (comet.mesh.material as THREE.Material).dispose();

        scene.remove(comet.trail);
        comet.trail.geometry.dispose();
        (comet.trail.material as THREE.Material).dispose();
      });
      cometsRef.current = [];

      // Dispose active shooting stars
      shootingStarsRef.current.forEach((star) => {
        scene.remove(star.line);
        star.line.geometry.dispose();
        (star.line.material as THREE.Material).dispose();
      });
      shootingStarsRef.current = [];

      // Dispose active explosions
      explosionsRef.current.forEach((exp) => {
        scene.remove(exp.points);
        exp.points.geometry.dispose();
        (exp.points.material as THREE.Material).dispose();
      });
      explosionsRef.current = [];

      renderer.dispose();
    };
  }, []);

  // Update properties on State Change
  useEffect(() => {
    if (starMaterialRef.current) {
      starMaterialRef.current.uniforms.uBrightness.value = starBrightness;
    }
  }, [starBrightness]);

  useEffect(() => {
    if (constellationLinesRef.current) {
      constellationLinesRef.current.visible = showLines;
    }
  }, [showLines]);

  useEffect(() => {
    if (constellationLinesRef.current) {
      // @ts-ignore
      constellationLinesRef.current.material.color.set(lineColor);
    }
  }, [lineColor]);

  useEffect(() => {
    if (sceneRef.current) {
      const grid = sceneRef.current.getObjectByName("equatorGrid");
      if (grid) grid.visible = showGrid;
    }
  }, [showGrid]);

  useEffect(() => {
    if (constellationArtGroupRef.current) {
      constellationArtGroupRef.current.visible = showArt;
    }
  }, [showArt]);

  useEffect(() => {
    if (constellationArtGroupRef.current) {
      constellationArtGroupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshBasicMaterial;
          if (selectedConstellation && child.name === selectedConstellation.id) {
            material.opacity = Math.min(1.0, artOpacity * 2.5); // Highlight active constellation art
          } else if (selectedConstellation) {
            material.opacity = artOpacity * 0.25; // Dim inactive ones
          } else {
            material.opacity = artOpacity; // Normal baseline visibility
          }
        }
      });
    }
  }, [selectedConstellation, artOpacity]);

  useEffect(() => {
    if (bgMaterialRef.current) {
      bgMaterialRef.current.color.setRGB(nebulaBrightness, nebulaBrightness, nebulaBrightness);
    }
  }, [nebulaBrightness]);

  // Helper to create 3D particle gold explosion at a given coordinate with custom color
  const createExplosion = (position: THREE.Vector3, color: string | number = 0xffd700) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const count = 25;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Random spherical velocity direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 8.0 + Math.random() * 12.0;
      velocities.push(new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.cos(phi),
        speed * Math.sin(phi) * Math.sin(theta)
      ));
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      map: createStarTexture(),
      size: 9.0,
      color: new THREE.Color(color),
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    explosionsRef.current.push({
      points,
      velocities,
      age: 0,
      maxAge: 45 // Frames
    });
  };

  // Handle Raycasting / Canvas Clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    // Get normalized device coordinates (-1 to +1)
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Create raycaster from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    
    // Check moving objects proximity first
    let clickedMovingObject = false;

    // Check Multi-Comet Proximity
    for (let i = 0; i < cometsRef.current.length; i++) {
      const comet = cometsRef.current[i];
      if (!comet.visible) continue;

      const cometPos = comet.mesh.position;
      const cometDist = raycaster.ray.distanceToPoint(cometPos);
      if (cometDist < 28.0) {
        createExplosion(cometPos.clone(), comet.color);
        setStardust((prev) => prev + comet.points);
        
        let typeName = "";
        if (comet.type === 'blue') {
          setBlueCaptures((prev) => prev + 1);
          typeName = "🌌 Komet Safir";
        } else if (comet.type === 'red') {
          setRedCaptures((prev) => prev + 1);
          typeName = "🔴 Komet Rubiah";
        } else if (comet.type === 'gold') {
          setGoldCaptures((prev) => prev + 1);
          typeName = "🟡 Komet Surya";
        }
        
        showToast(`${typeName} berhasil ditangkap! (+${comet.points} Stardust)`);
        clickedMovingObject = true;

        // Disappear logic & scheduling respawn
        comet.visible = false;
        comet.mesh.visible = false;
        comet.trail.visible = false;
        const elapsedTime = clockRef.current ? clockRef.current.getElapsedTime() : 0;
        comet.respawnTime = elapsedTime + 3.0 + Math.random() * 4.0; // 3 to 7 seconds delay
        break;
      }
    }

    // Check Shooting Stars Proximity
    if (!clickedMovingObject) {
      for (let i = 0; i < shootingStarsRef.current.length; i++) {
        const star = shootingStarsRef.current[i];
        const starDist = raycaster.ray.distanceToPoint(star.current);
        if (starDist < 38.0) {
          createExplosion(star.current.clone(), 0xffffff);
          setStardust((prev) => prev + 1);
          setStarCaptures((prev) => prev + 1);
          showToast("✨ Bintang jatuh tertangkap! (+1 Stardust)");
          
          sceneRef.current.remove(star.line);
          star.line.geometry.dispose();
          (star.line.material as THREE.Material).dispose();
          shootingStarsRef.current.splice(i, 1);
          
          clickedMovingObject = true;
          break;
        }
      }
    }

    if (clickedMovingObject) {
      return;
    }

    const rayDirection = raycaster.ray.direction.normalize();

    // Check which constellation center ray matches closest
    let closestConst: Constellation | null = null;
    let maxDot = 0.985; // Cosine of ~10 degrees, must be close enough

    constellations.forEach((c) => {
      const [cx, cy, cz] = raDecToCartesian(c.centerRa, c.centerDec, 500);
      const cVector = new THREE.Vector3(cx, cy, cz).normalize();
      const dot = rayDirection.dot(cVector);
      if (dot > maxDot) {
        maxDot = dot;
        closestConst = c;
      }
    });

    if (closestConst) {
      setSelectedConstellation(closestConst);
      setActiveTab('info');
      showToast(`🎯 Rasi Bintang Terpilih: ${closestConst!.name}`);
    } else {
      // Deselect if clicked empty space
      setSelectedConstellation(null);
    }
  };

  return (
    <div ref={mountRef} className="fixed inset-0 z-50 bg-[#02050f] overflow-hidden flex flex-col md:flex-row text-mist font-sans h-screen w-screen">
      
      {/* Floating Sparkle Background Effect */}
      <div className="absolute inset-0 pointer-events-none bg-stardust opacity-20 z-0" />

      {/* Main 3D Canvas */}
      <div ref={canvasContainerRef} className="w-full md:w-auto h-[60vh] md:h-full md:flex-1 relative z-0 order-2 md:order-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
        />

        {/* 2D Projected HTML Constellation Labels */}
        {showLabels && (
          <div className="absolute inset-0 pointer-events-none select-none z-10">
            {projectedLabels.map((lbl) => {
              if (!lbl.visible) return null;
              const isSelected = selectedConstellation?.id === lbl.id;
              return (
                <div
                  key={lbl.id}
                  style={{
                    left: lbl.x,
                    top: lbl.y,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`absolute pointer-events-auto cursor-pointer px-2.5 py-1.5 rounded-lg transition-all duration-300 font-display flex flex-col items-center bg-stone-950/40 backdrop-blur-xs border border-white/5 hover:border-white/25 shadow-md ${
                    isSelected 
                      ? "text-secondary scale-110 border-secondary/40 bg-stone-950/80 drop-shadow-[0_0_10px_rgba(255,243,176,0.5)] z-20" 
                      : "text-primary/80 hover:text-white hover:scale-105 z-10"
                  }`}
                  onClick={() => {
                    const c = constellations.find(x => x.id === lbl.id);
                    if (c) {
                      setSelectedConstellation(c);
                      rotateToConstellation(c);
                    }
                  }}
                >
                  <span className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-secondary animate-ping" : "bg-primary/50"}`} />
                    {lbl.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Orbit Instructions Overlay */}
        <div className="absolute bottom-6 left-6 pointer-events-none z-10 bg-stone-950/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5 text-[10px] md:text-xs text-mist/60 flex items-center gap-2 shadow-lg">
          <span className="material-symbols-outlined text-sm text-secondary animate-pulse">gesture</span>
          <span>Seret untuk merotasi langit • Cubit untuk zoom</span>
        </div>

        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-950/70 hover:bg-stone-900 border border-white/10 backdrop-blur-md rounded-2xl text-xs font-semibold font-label-caps uppercase tracking-wider text-mist hover:text-white transition-all cursor-pointer shadow-lg hover:border-primary/45 hover:shadow-[0_0_12px_rgba(184,166,255,0.2)]"
          >
            <span className="material-symbols-outlined text-sm text-primary">arrow_back</span>
            <span>Kembali ke Taman</span>
          </button>
        </div>
      </div>

      {/* Glassmorphic Side Config & Information Panel */}
      <div 
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(7, 10, 24, 0.94), rgba(13, 17, 30, 0.97)), url('/HDR_background.webp')",
          backgroundSize: "cover",
          backgroundPosition: "right center"
        }}
        className="w-full h-[40vh] md:h-full md:w-[380px] backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col z-20 order-1 md:order-2 overflow-hidden shadow-2xl shrink-0"
      >
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-stone-950/60 shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-3 text-center text-xs font-semibold font-label-caps tracking-widest uppercase cursor-pointer border-b-2 transition-all ${
              activeTab === 'config' 
                ? "border-primary text-primary bg-white/5" 
                : "border-transparent text-mist/40 hover:text-mist hover:bg-white/2"
            }`}
          >
            ⚙️ Konfigurasi
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-center text-xs font-semibold font-label-caps tracking-widest uppercase cursor-pointer border-b-2 transition-all ${
              activeTab === 'info' 
                ? "border-secondary text-secondary bg-white/5" 
                : "border-transparent text-mist/40 hover:text-mist hover:bg-white/2"
            }`}
          >
            📖 Objek Pengamatan
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto scrollbar-styled p-6 select-text">
          <AnimatePresence mode="wait">
            {activeTab === 'config' ? (
              <motion.div
                key="config-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Section header */}
                <div>
                  <h3 className="text-sm font-semibold text-starlight tracking-wider">Navigasi Rasi Bintang</h3>
                  <p className="text-[10px] text-mist/40 mt-0.5">Pilih rasi bintang untuk diarahkan secara otomatis</p>
                </div>

                {/* Constellation Quick Jump list */}
                <div className="grid grid-cols-2 gap-2">
                  {constellations.map((c) => {
                    const isSelected = selectedConstellation?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => rotateToConstellation(c)}
                        className={`px-3 py-2 text-left rounded-xl border text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-secondary/15 border-secondary text-secondary shadow-[0_0_10px_rgba(255,243,176,0.2)]"
                            : "bg-white/2 border-white/5 hover:border-white/20 text-mist/85 hover:text-white"
                        }`}
                      >
                        ✦ {c.name}
                      </button>
                    );
                  })}
                </div>

                <hr className="border-white/5" />

                {/* Observer Layer Configurations */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-secondary tracking-widest font-label-caps uppercase">Layer Pengamatan</h4>
                  
                  {/* Constellation lines toggle */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-starlight">Garis Rasi Bintang</p>
                      <p className="text-[10px] text-mist/40">Hubungkan bintang dengan benang cahaya</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showLines}
                      onChange={(e) => setShowLines(e.target.checked)}
                      className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded focus:ring-primary/20 cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Constellation line color picker presets */}
                  {showLines && (
                    <div className="flex justify-between items-center text-xs pl-3 border-l-2 border-primary/20 py-1">
                      <div>
                        <p className="text-[11px] text-mist/75">Warna Garis</p>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { name: "Nila", color: "#d3c6ff" },
                          { name: "Emas", color: "#d2c888" },
                          { name: "Sian", color: "#22d3ee" },
                          { name: "Perak", color: "#e2e8f0" }
                        ].map((c) => (
                          <button
                            key={c.color}
                            onClick={() => setLineColor(c.color)}
                            title={c.name}
                            style={{ backgroundColor: c.color }}
                            className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                              lineColor === c.color 
                                ? "border-white scale-125 ring-2 ring-primary/40" 
                                : "border-stone-950 hover:scale-110"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Constellation Art Toggle */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-starlight">Gambar Seni Klasik</p>
                      <p className="text-[10px] text-mist/40">Tampilkan seni lukis klasik rasi bintang</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showArt}
                      onChange={(e) => setShowArt(e.target.checked)}
                      className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded focus:ring-primary/20 cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Constellation Names toggle */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-starlight">Label Nama Rasi</p>
                      <p className="text-[10px] text-mist/40">Tampilkan teks penunjuk rasi bintang</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded focus:ring-primary/20 cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Equatorial Grid toggle */}
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-starlight">Grid Ekuator Langit</p>
                      <p className="text-[10px] text-mist/40">Tampilkan garis ekuatorial langit</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="w-4 h-4 text-primary bg-stone-900 border-white/10 rounded focus:ring-primary/20 cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Twinkle & Brightness configs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-secondary tracking-widest font-label-caps uppercase">Atmosfer Visual</h4>
                  
                  {/* Slider: Star Brightness */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[10px] text-mist/50">
                      <span>Kecerahan Bintang</span>
                      <span>{Math.round(starBrightness * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={starBrightness}
                      onChange={(e) => setStarBrightness(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                  </div>

                  {/* Slider: Nebula Brightness */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[10px] text-mist/50">
                      <span>Kecerahan Latar Nebula</span>
                      <span>{Math.round(nebulaBrightness * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={nebulaBrightness}
                      onChange={(e) => setNebulaBrightness(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                  </div>

                  {/* Slider: Art Opacity */}
                  {showArt && (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-[10px] text-mist/50">
                        <span>Kepekatan Seni Klasik</span>
                        <span>{Math.round((artOpacity / 0.8) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="0.8"
                        step="0.05"
                        value={artOpacity}
                        onChange={(e) => setArtOpacity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                      />
                    </div>
                  )}

                  {/* Star count information */}
                  <div className="bg-stone-950/60 border border-white/5 rounded-xl p-3.5 flex justify-between items-center text-[10px] text-mist/50 shadow-inner">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-primary font-fill">star</span>
                      <span>Katalog Bintang Termuat</span>
                    </div>
                    <span className="font-mono text-starlight">{stars.length} Bintang</span>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="info-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {selectedConstellation ? (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Rasi Terpilih</span>
                      <h3 className="font-display text-2xl font-bold text-starlight leading-tight">{selectedConstellation.name}</h3>
                      <p className="text-xs text-mist/50 italic">{selectedConstellation.latinName}</p>
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-stone-950/60 p-3 rounded-xl border border-white/5 text-mist/60">
                      <div>
                        <span className="block text-mist/30">RA (Ascension)</span>
                        <span className="text-primary font-semibold">{selectedConstellation.centerRa}°</span>
                      </div>
                      <div>
                        <span className="block text-mist/30">DEC (Declination)</span>
                        <span className="text-primary font-semibold">{selectedConstellation.centerDec}°</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2 text-xs leading-relaxed text-mist/80">
                      <h4 className="font-semibold text-starlight border-b border-white/5 pb-1">Deskripsi Rasi Bintang</h4>
                      <p>{selectedConstellation.description}</p>
                    </div>

                    {/* Mythology */}
                    <div className="space-y-2 text-xs leading-relaxed text-mist/70 italic border-l-2 border-secondary/30 pl-3">
                      <h4 className="font-semibold text-secondary not-italic">Kisah Mitologi</h4>
                      <p className="font-poem text-sm leading-relaxed">“{selectedConstellation.mythology}”</p>
                    </div>

                    {/* Poetry link */}
                    {selectedConstellation.poemId !== undefined && (() => {
                      const poem = getPoemById(selectedConstellation.poemId);
                      if (!poem) return null;
                      return (
                        <div className="bg-gradient-to-br from-purple-950/20 to-indigo-950/20 border border-primary/25 rounded-2xl p-4 space-y-2.5 shadow-[0_0_15px_rgba(184,166,255,0.06)] hover:border-primary/45 transition-all">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <div className="flex items-center gap-1.5 text-primary">
                              <span className="material-symbols-outlined text-sm font-fill">auto_stories</span>
                              <span className="tracking-wide">Sajak Terkait: {poem.title}</span>
                            </div>
                            <span className="text-[9px] font-mono text-mist/40">{poem.emoji}</span>
                          </div>
                          <p className="text-[11px] text-mist/75 italic font-poem leading-relaxed whitespace-pre-line border-l border-primary/20 pl-2.5">
                            {poem.stanzas[0]}
                          </p>
                          <div className="flex justify-between items-center text-[9px] text-mist/40 pt-1">
                            <span>Selasar Bait</span>
                            <span>— {poem.author}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Lentera Debu Bintang Info Panel */}
                    <div className="space-y-2 bg-stone-950/40 p-4 rounded-2xl border border-white/5 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-xl text-amber-400 font-fill animate-spin" style={{ animationDuration: '8s' }}>grade</span>
                          <h3 className="text-xs font-bold tracking-widest text-starlight uppercase">Lentera Debu Bintang</h3>
                        </div>
                        {(stardust > 0 || blueCaptures > 0 || redCaptures > 0 || goldCaptures > 0 || starCaptures > 0) && (
                          <button 
                            onClick={() => {
                              setStardust(0);
                              setBlueCaptures(0);
                              setRedCaptures(0);
                              setGoldCaptures(0);
                              setStarCaptures(0);
                              
                              // Reset comet visibility and phases immediately
                              cometsRef.current.forEach((comet) => {
                                comet.visible = true;
                                comet.mesh.visible = true;
                                comet.trail.visible = true;
                                comet.phase = Math.random() * Math.PI * 2;
                                comet.history = [];
                              });

                              showToast("✨ Jurnal pengamatan dan stardust telah di-reset!");
                            }}
                            title="Reset Game"
                            className="text-mist/35 hover:text-red-400/80 transition-colors p-1 rounded-md cursor-pointer flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-sm">restart_alt</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] leading-relaxed text-mist/50 text-left">
                        Klik pada komet berpendar atau bintang jatuh di langit malam untuk menangkap debu bintang dan membuka sajak langit rahasia.
                      </p>
                    </div>

                    {/* Progress Bar towards Milestone */}
                    <div className="space-y-2 bg-stone-950/20 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-mist/45 font-mono">Progress Pengumpulan</span>
                        <span className="text-sm font-bold font-mono text-amber-400 flex items-center gap-1">
                          ✨ {stardust} <span className="text-xs text-mist/40">/ 12</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                          style={{ width: `${Math.min(100, (stardust / 12) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-mist/30 pt-0.5">
                        <span>Milestone:</span>
                        <span>3 ✨</span>
                        <span>7 ✨</span>
                        <span>12 ✨</span>
                      </div>
                    </div>

                    {/* Jurnal Pengamatan Komet */}
                    <div className="space-y-3 bg-stone-950/30 p-4 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-bold tracking-widest text-secondary uppercase flex items-center gap-1 text-left">
                        <span className="material-symbols-outlined text-xs">analytics</span>
                        Jurnal Pengamatan
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {/* Sapphire */}
                        <div className="bg-stone-950/50 p-2.5 rounded-xl border border-white/2 flex items-center justify-between">
                          <div className="space-y-0.5 text-left">
                            <span className="block text-[8px] text-blue-400 uppercase font-semibold">🌌 Safir</span>
                            <span className="text-[9px] text-mist/40">Common (+1)</span>
                          </div>
                          <span className="text-sm font-bold text-blue-400">{blueCaptures}</span>
                        </div>
                        {/* Ruby */}
                        <div className="bg-stone-950/50 p-2.5 rounded-xl border border-white/2 flex items-center justify-between">
                          <div className="space-y-0.5 text-left">
                            <span className="block text-[8px] text-rose-400 uppercase font-semibold">🔴 Rubiah</span>
                            <span className="text-[9px] text-mist/40">Uncommon (+2)</span>
                          </div>
                          <span className="text-sm font-bold text-rose-400">{redCaptures}</span>
                        </div>
                        {/* Golden */}
                        <div className="bg-stone-950/50 p-2.5 rounded-xl border border-white/2 flex items-center justify-between">
                          <div className="space-y-0.5 text-left">
                            <span className="block text-[8px] text-amber-400 uppercase font-semibold">🟡 Surya</span>
                            <span className="text-[9px] text-mist/40">Rare (+5)</span>
                          </div>
                          <span className="text-sm font-bold text-amber-400">{goldCaptures}</span>
                        </div>
                        {/* Shooting Stars */}
                        <div className="bg-stone-950/50 p-2.5 rounded-xl border border-white/2 flex items-center justify-between">
                          <div className="space-y-0.5 text-left">
                            <span className="block text-[8px] text-slate-200 uppercase font-semibold">✨ Meteor</span>
                            <span className="text-[9px] text-mist/40">Melesat (+1)</span>
                          </div>
                          <span className="text-sm font-bold text-slate-200">{starCaptures}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lencana Pencapaian */}
                    <div className="space-y-3 bg-stone-950/30 p-4 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-bold tracking-widest text-secondary uppercase flex items-center gap-1 text-left">
                        <span className="material-symbols-outlined text-xs text-amber-450">workspace_premium</span>
                        Lencana Pencapaian
                      </h4>
                      <div className="space-y-2">
                        {/* Achievement 1: Pemburu Debu Bintang */}
                        {stardust >= 10 ? (
                          <div className="flex items-center gap-3 p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)] transition-all duration-300">
                            <span className="material-symbols-outlined text-lg font-fill">workspace_premium</span>
                            <div className="flex-1 text-[10px] leading-tight text-left">
                              <p className="font-bold">Pemburu Debu Bintang</p>
                              <p className="text-[8px] text-amber-400/70">Kumpulkan total 10+ Stardust</p>
                            </div>
                            <span className="material-symbols-outlined text-sm text-amber-400 font-fill">check_circle</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-2 bg-stone-950/50 border border-white/2 rounded-xl text-mist/30 opacity-60">
                            <span className="material-symbols-outlined text-lg">workspace_premium</span>
                            <div className="flex-1 text-[10px] leading-tight text-left">
                              <p className="font-bold">Pemburu Debu Bintang</p>
                              <p className="text-[8px] text-mist/20">Kumpulkan total 10+ Stardust</p>
                            </div>
                            <span className="material-symbols-outlined text-xs">lock</span>
                          </div>
                        )}

                        {/* Achievement 2: Astronom Pemula */}
                        {blueCaptures > 0 && redCaptures > 0 && goldCaptures > 0 ? (
                          <div className="flex items-center gap-3 p-2 bg-purple-500/10 border border-purple-500/25 rounded-xl text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.15)] transition-all duration-300">
                            <span className="material-symbols-outlined text-lg font-fill">auto_awesome</span>
                            <div className="flex-1 text-[10px] leading-tight text-left">
                              <p className="font-bold">Astronom Pemula</p>
                              <p className="text-[8px] text-purple-400/70">Tangkap 1 komet setiap jenis</p>
                            </div>
                            <span className="material-symbols-outlined text-sm text-purple-400 font-fill">check_circle</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-2 bg-stone-950/50 border border-white/2 rounded-xl text-mist/30 opacity-60">
                            <span className="material-symbols-outlined text-lg">auto_awesome</span>
                            <div className="flex-1 text-[10px] leading-tight text-left">
                              <p className="font-bold">Astronom Pemula</p>
                              <p className="text-[8px] text-mist/20">Tangkap 1 komet setiap jenis</p>
                            </div>
                            <span className="material-symbols-outlined text-xs">lock</span>
                          </div>
                        )}

                        {/* Achievement 3: Legenda Langit Malam */}
                        {goldCaptures > 0 ? (
                          <div className="flex items-center gap-3 p-2 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.15)] transition-all duration-300">
                            <span className="material-symbols-outlined text-lg font-fill">military_tech</span>
                            <div className="flex-1 text-[10px] leading-tight text-left">
                              <p className="font-bold">Legenda Langit Malam</p>
                              <p className="text-[8px] text-yellow-400/70">Tangkap Komet Surya yang cepat</p>
                            </div>
                            <span className="material-symbols-outlined text-sm text-yellow-400 font-fill">check_circle</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-2 bg-stone-950/50 border border-white/2 rounded-xl text-mist/30 opacity-60">
                            <span className="material-symbols-outlined text-lg">military_tech</span>
                            <div className="flex-1 text-[10px] leading-tight text-left">
                              <p className="font-bold">Legenda Langit Malam</p>
                              <p className="text-[8px] text-mist/20">Tangkap Komet Surya yang cepat</p>
                            </div>
                            <span className="material-symbols-outlined text-xs">lock</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secret Poems List */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold tracking-widest text-secondary uppercase text-left">Sajak Langit Rahasia</h4>
                      
                      {/* Poem 1: Milestone 3 */}
                      {stardust >= 3 ? (
                        <div className="bg-gradient-to-br from-amber-950/15 to-stone-950/40 border border-amber-500/25 p-4 rounded-xl space-y-2 shadow-[0_0_10px_rgba(245,158,11,0.05)] hover:border-amber-400/40 transition-all">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-amber-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">lock_open</span> I. Debu Angkasa</span>
                            <span className="font-mono text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded-full">Unlocked at 3 ✨</span>
                          </div>
                          <p className="text-[11px] italic font-poem leading-relaxed text-mist/85 whitespace-pre-line pl-2.5 border-l border-amber-500/30 text-left">
                            "Di antara serpihan debu angkasa,{"\n"}kutitipkan baris kata tentang rasa,{"\n"}yang melayang sunyi mencari arah,{"\n"}menanti hatimu menyambut pasrah."
                          </p>
                        </div>
                      ) : (
                        <div className="bg-stone-950/50 border border-white/2 p-4 rounded-xl flex items-center justify-between opacity-60">
                          <div className="space-y-1 text-left">
                            <span className="text-[10px] font-bold text-mist/60 flex items-center gap-1"><span className="material-symbols-outlined text-xs">lock</span> I. ???</span>
                            <p className="text-[9px] text-mist/30">Terkumpul {stardust}/3 Stardust untuk membuka</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-mist/20">3 ✨</span>
                        </div>
                      )}

                      {/* Poem 2: Milestone 7 */}
                      {stardust >= 7 ? (
                        <div className="bg-gradient-to-br from-amber-950/15 to-stone-950/40 border border-amber-500/25 p-4 rounded-xl space-y-2 shadow-[0_0_10px_rgba(245,158,11,0.05)] hover:border-amber-400/40 transition-all">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-amber-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">lock_open</span> II. Cerita Komet</span>
                            <span className="font-mono text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded-full">Unlocked at 7 ✨</span>
                          </div>
                          <p className="text-[11px] italic font-poem leading-relaxed text-mist/85 whitespace-pre-line pl-2.5 border-l border-amber-500/30 text-left">
                            "Komet melintas membawa cerita lama,{"\n"}tentang kita yang pernah bernyawa,{"\n"}di bawah naungan bintang yang sama,{"\n"}merajut mimpi yang tak kunjung sirna."
                          </p>
                        </div>
                      ) : (
                        <div className="bg-stone-950/50 border border-white/2 p-4 rounded-xl flex items-center justify-between opacity-60">
                          <div className="space-y-1 text-left">
                            <span className="text-[10px] font-bold text-mist/60 flex items-center gap-1"><span className="material-symbols-outlined text-xs">lock</span> II. ???</span>
                            <p className="text-[9px] text-mist/30">Terkumpul {stardust}/7 Stardust untuk membuka</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-mist/20">7 ✨</span>
                        </div>
                      )}

                      {/* Poem 3: Milestone 12 */}
                      {stardust >= 12 ? (
                        <div className="bg-gradient-to-br from-amber-950/15 to-stone-950/40 border border-amber-500/25 p-4 rounded-xl space-y-2 shadow-[0_0_10px_rgba(245,158,11,0.05)] hover:border-amber-400/40 transition-all">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-amber-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">lock_open</span> III. Kanvas Semesta</span>
                            <span className="font-mono text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded-full">Unlocked at 12 ✨</span>
                          </div>
                          <p className="text-[11px] italic font-poem leading-relaxed text-mist/85 whitespace-pre-line pl-2.5 border-l border-amber-500/30 text-left">
                            "Semesta adalah kanvas puisi abadi,{"\n"}dan kita adalah coretan cahaya yang takkan mati.{"\n"}Di atas hamparan bintang tak terhingga,{"\n"}cinta kita terukir abadi selamanya."
                          </p>
                        </div>
                      ) : (
                        <div className="bg-stone-950/50 border border-white/2 p-4 rounded-xl flex items-center justify-between opacity-60">
                          <div className="space-y-1 text-left">
                            <span className="text-[10px] font-bold text-mist/60 flex items-center gap-1"><span className="material-symbols-outlined text-xs">lock</span> III. ???</span>
                            <p className="text-[9px] text-mist/30">Terkumpul {stardust}/12 Stardust untuk membuka</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-mist/20">12 ✨</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-stone-950/20 border border-white/5 rounded-xl p-3 flex items-start gap-2.5 text-[9px] text-mist/40">
                      <span className="material-symbols-outlined text-sm text-secondary">info</span>
                      <span className="text-left">Tip: Klik rasi bintang di langit malam untuk membaca kisah mitologi dan sajak terikat rasi bintang tersebut.</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
