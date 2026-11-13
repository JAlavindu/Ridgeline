import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { TileData3D, SkyState, AppMode } from '../types';
import { Box, Layers, Eye, Mountain, Maximize2, Minimize2 } from 'lucide-react';

interface SiteExplorer3DProps {
  tileData: TileData3D;
  skyState: SkyState;
  siteName: string;
  mode: AppMode;
}

type ColorMode = 'photorealistic' | 'elevation' | 'slope' | 'sunlight';

/**
 * Procedural Earth canvas texture (continents, ocean depths, atmosphere)
 */
function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#041e42');
  oceanGrad.addColorStop(0.5, '#0284c7');
  oceanGrad.addColorStop(1, '#041e42');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stylized continents (Africa, Europe, Americas, Asia)
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.ellipse(500, 260, 90, 140, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(520, 120, 110, 60, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.ellipse(720, 170, 160, 90, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e3a1e';
  ctx.beginPath();
  ctx.ellipse(260, 160, 80, 100, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(320, 340, 70, 110, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Desert dry regions
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(500, 200, 70, 35, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Cloud swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let y = 60; y < canvas.height; y += 70) {
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 35) {
      const cy = y + Math.sin(x * 0.02) * 22;
      ctx.arc(x, cy, 24, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Polar ice caps
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, 35);
  ctx.fillRect(0, canvas.height - 35, canvas.width, 35);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Sun canvas texture (solar granulations, flares)
 */
function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#ea580c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 10 + Math.random() * 25;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

interface LoadedTerrainTile {
  elevations: Float32Array; // N x N grid
  n: number;
  minElev: number;
  maxElev: number;
  centerElev: number;
  isRealLola: boolean;
}

export const SiteExplorer3D: React.FC<SiteExplorer3DProps> = ({
  tileData,
  skyState,
  siteName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('photorealistic');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [verticalExag, setVerticalExag] = useState<number>(1.8);
  const [realDemLoaded, setRealDemLoaded] = useState<boolean>(false);
  const [loadingDem, setLoadingDem] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Loaded real DEM data cache
  const [loadedTile, setLoadedTile] = useState<LoadedTerrainTile | null>(null);

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const directionalSunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // 3D Celestial Body Mesh references
  const sunGroupRef = useRef<THREE.Group | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const sunBeamRef = useRef<THREE.Line | null>(null);
  const earthBeamRef = useRef<THREE.Line | null>(null);

  // Textures cache
  const texturesRef = useRef<{
    albedo?: THREE.Texture;
    normal?: THREE.Texture;
    microBump?: THREE.Texture;
  }>({});

  // 1. Fetch real LOLA 501x501 tile binary data
  useEffect(() => {
    let isMounted = true;
    const siteId = tileData.site_id;

    async function fetchLolaDem() {
      setLoadingDem(true);
      try {
        const binUrl = `/data/tiles/${siteId}.bin`;
        const res = await fetch(binUrl);
        if (!res.ok) throw new Error('Binary tile not found');

        const buffer = await res.arrayBuffer();
        if (!isMounted) return;

        // 501 x 501 int16 values
        const int16View = new Int16Array(buffer);
        const originalN = 501;

        // Downsample by stride 2 for smooth high-resolution WebGL terrain (251x251 = 63,001 vertices)
        const stride = 2;
        const targetN = Math.floor(originalN / stride) + 1; // 251
        const elevFloats = new Float32Array(targetN * targetN);

        let minElev = Infinity;
        let maxElev = -Infinity;
        const centerOrig = 250;
        const centerElev = int16View[centerOrig * originalN + centerOrig] || 0;

        for (let r = 0; r < targetN; r++) {
          const origRow = r * stride;
          for (let c = 0; c < targetN; c++) {
            const origCol = c * stride;
            const h = int16View[origRow * originalN + origCol];
            const targetIdx = r * targetN + c;
            elevFloats[targetIdx] = h;
            if (h < minElev) minElev = h;
            if (h > maxElev) maxElev = h;
          }
        }

        if (isMounted) {
          setLoadedTile({
            elevations: elevFloats,
            n: targetN,
            minElev,
            maxElev,
            centerElev,
            isRealLola: true,
          });
          setRealDemLoaded(true);
          setLoadingDem(false);
        }
      } catch {
        // Fallback to tileData
        if (!isMounted) return;
        const n = tileData.grid_size;
        const elevFloats = new Float32Array(n * n);
        let minElev = Infinity;
        let maxElev = -Infinity;
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const h = tileData.elevations[r]?.[c] || 0;
            elevFloats[r * n + c] = h;
            if (h < minElev) minElev = h;
            if (h > maxElev) maxElev = h;
          }
        }
        setLoadedTile({
          elevations: elevFloats,
          n,
          minElev,
          maxElev,
          centerElev: 0,
          isRealLola: false,
        });
        setRealDemLoaded(false);
        setLoadingDem(false);
      }
    }

    fetchLolaDem();

    return () => {
      isMounted = false;
    };
  }, [tileData.site_id, tileData.grid_size, tileData.elevations]);

  // Load high-resolution textures (albedo, normal, micro-bump)
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const siteId = tileData.site_id;

    const albedoTex = textureLoader.load(
      `/data/tiles/${siteId}_albedo.png`,
      () => {
        if (terrainMeshRef.current && colorMode === 'photorealistic') {
          (terrainMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      },
      undefined,
      () => {
        // fallback to nbhd png
        texturesRef.current.albedo = textureLoader.load(`/data/nbhd/${siteId}.png`);
      }
    );

    const normalTex = textureLoader.load(
      `/data/tiles/${siteId}_normal.png`,
      () => {
        if (terrainMeshRef.current && colorMode === 'photorealistic') {
          (terrainMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
    );

    const microBumpTex = textureLoader.load(
      `/data/tiles/lunar_micro_bump.png`,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(16, 16);
      }
    );

    texturesRef.current = {
      albedo: albedoTex,
      normal: normalTex,
      microBump: microBumpTex,
    };
  }, [tileData.site_id, colorMode]);

  // 2. Build Three.js scene with High-Res NASA DEM Geometry
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = isFullscreen ? window.innerHeight - 140 : 400;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -68, 48);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    // 3. Renderer with shadows and PBR tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Photorealistic Lighting
    // Subtle earthshine / cosmic background ambient light
    const ambientLight = new THREE.AmbientLight(0x0a1020, 0.45);
    scene.add(ambientLight);

    // Directional Lunar Sun Light (casts long polar shadows across crater ridges)
    const sunLight = new THREE.DirectionalLight(0xfff6dd, 2.2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -35;
    sunLight.shadow.camera.right = 35;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -35;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    directionalSunLightRef.current = sunLight;

    // 5. Construct High-Resolution Lunar Terrain Geometry
    const activeTile = loadedTile || {
      elevations: new Float32Array(0),
      n: 80,
      minElev: -1000,
      maxElev: 2000,
      centerElev: 0,
      isRealLola: false,
    };

    const n = activeTile.n;
    const planeGeom = new THREE.PlaneGeometry(54, 54, n - 1, n - 1);
    const posAttr = planeGeom.attributes.position;
    const colorAttr = new THREE.BufferAttribute(new Float32Array(posAttr.count * 3), 3);
    planeGeom.setAttribute('color', colorAttr);

    // Compute relative heights
    const centerElev = activeTile.centerElev;
    for (let i = 0; i < posAttr.count; i++) {
      const elev = activeTile.elevations[i] ?? 0;
      const relElev = elev - centerElev;
      // Convert to WebGL units with vertical exaggeration
      posAttr.setZ(i, (relElev / 500) * verticalExag);
    }
    planeGeom.computeVertexNormals();

    // Standard PBR Material
    const planeMat = new THREE.MeshStandardMaterial({
      roughness: 0.88,
      metalness: 0.05,
      map: colorMode === 'photorealistic' ? texturesRef.current.albedo : undefined,
      normalMap: colorMode === 'photorealistic' ? (texturesRef.current.normal || texturesRef.current.microBump) : undefined,
      normalScale: new THREE.Vector2(1.2, 1.2),
      vertexColors: colorMode !== 'photorealistic',
      side: THREE.DoubleSide,
    });

    const terrainMesh = new THREE.Mesh(planeGeom, planeMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 6. High-detail Lunar Lander Marker
    const lander = new THREE.Group();
    // Octagonal gold thermal MLI base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.85,
      roughness: 0.25,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.1, 1.0, 8), baseMat);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    lander.add(body);

    // Landing gear struts
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    for (let j = 0; j < 4; j++) {
      const angle = (j * Math.PI) / 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6), strutMat);
      leg.position.set(Math.cos(angle) * 1.0, Math.sin(angle) * 1.0, -0.4);
      leg.rotation.z = angle;
      leg.rotation.x = Math.PI / 3;
      leg.castShadow = true;
      lander.add(leg);

      const footpad = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), strutMat);
      footpad.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, -0.9);
      footpad.rotation.x = Math.PI / 2;
      lander.add(footpad);
    }

    // High Gain Antenna Dish pointing to Earth
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.7, roughness: 0.3 });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.5), dishMat);
    dish.position.set(0.3, 0.3, 1.35);
    dish.rotation.x = Math.PI / 4;
    lander.add(dish);

    lander.position.set(0, 0, 0.9);
    scene.add(lander);

    // 7. BUILD 3D PHOTOREALISTIC CELESTIAL BODIES
    const center = new THREE.Vector3(0, 0, 1.2);

    // --- 3D SUN (Glow, Sphere & Solar Light) ---
    const sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(3.6, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      map: createSunTexture(),
      color: 0xfff0aa,
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    // Solar Corona Atmosphere Shell
    const coronaGeom = new THREE.SphereGeometry(4.8, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    sunGroup.add(coronaMesh);

    scene.add(sunGroup);
    sunGroupRef.current = sunGroup;

    // --- 3D EARTH (Blue Marble Globe, Atmosphere, Clouds) ---
    const earthGroup = new THREE.Group();
    const earthGeom = new THREE.SphereGeometry(2.6, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.55,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeom, earthMat);
    earthGroup.add(earthMesh);

    // Atmospheric Blue Scattering Shell
    const atmoGeom = new THREE.SphereGeometry(2.95, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.24,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
    earthGroup.add(atmoMesh);

    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // --- Guide Beams (Laser line from lander to Sun and Earth) ---
    const sunBeamGeom = new THREE.BufferGeometry().setFromPoints([center, new THREE.Vector3(0, 0, 35)]);
    const sunBeamMat = new THREE.LineDashedMaterial({ color: 0xfbbf24, dashSize: 1.5, gapSize: 0.8 });
    const sunBeam = new THREE.Line(sunBeamGeom, sunBeamMat);
    sunBeam.computeLineDistances();
    scene.add(sunBeam);
    sunBeamRef.current = sunBeam;

    const earthBeamGeom = new THREE.BufferGeometry().setFromPoints([center, new THREE.Vector3(0, 0, 35)]);
    const earthBeamMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 1.5, gapSize: 0.8 });
    const earthBeam = new THREE.Line(earthBeamGeom, earthBeamMat);
    earthBeam.computeLineDistances();
    scene.add(earthBeam);
    earthBeamRef.current = earthBeam;

    // 8. Orbit Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.2;
    let radius = 70;

    const updateCameraPos = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = -radius * Math.sin(phi) * Math.cos(theta);
      camera.position.z = radius * Math.cos(phi);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      theta -= deltaX * 0.009;
      phi = Math.max(0.18, Math.min(Math.PI / 2 - 0.04, phi - deltaY * 0.009));
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(20, Math.min(140, radius + e.deltaY * 0.06));
      updateCameraPos();
    };

    const onResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = isFullscreen ? window.innerHeight - 140 : 400;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);

    // 9. Render & Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.z += 0.004;
      }
      if (sunGroupRef.current) {
        sunGroupRef.current.rotation.z += 0.0015;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      planeGeom.dispose();
      planeMat.dispose();
      sunGeom.dispose();
      sunMat.dispose();
      earthGeom.dispose();
      earthMat.dispose();
    };
  }, [loadedTile, verticalExag, colorMode, isFullscreen]);

  // 3. Update Material and Shaders when ColorMode changes
  useEffect(() => {
    if (!terrainMeshRef.current || !loadedTile) return;
    const mesh = terrainMeshRef.current;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const geom = mesh.geometry as THREE.PlaneGeometry;
    const colors = geom.attributes.color as THREE.BufferAttribute;
    if (!colors) return;

    if (colorMode === 'photorealistic') {
      mat.map = texturesRef.current.albedo || null;
      mat.normalMap = texturesRef.current.normal || texturesRef.current.microBump || null;
      mat.roughness = 0.88;
      mat.metalness = 0.04;
      mat.vertexColors = false;
      mat.needsUpdate = true;
      return;
    }

    // False color heatmaps (Elevation, Slope, Sunlight)
    mat.map = null;
    mat.normalMap = texturesRef.current.microBump || null;
    mat.roughness = 0.75;
    mat.metalness = 0.1;
    mat.vertexColors = true;

    const n = loadedTile.n;
    const c = new THREE.Color();
    const minElev = loadedTile.minElev;
    const maxElev = loadedTile.maxElev;
    const elevRange = Math.max(1, maxElev - minElev);

    for (let i = 0; i < loadedTile.elevations.length; i++) {
      const elev = loadedTile.elevations[i];
      const row = Math.floor(i / n);
      const col = i % n;

      if (colorMode === 'elevation') {
        // Scientific Turbo / Hypsometric tint
        const normElev = Math.max(0, Math.min(1, (elev - minElev) / elevRange));
        // Deep purple (-1000m) -> blue -> teal -> yellow -> bright white (+5000m)
        c.setHSL(0.7 - normElev * 0.7, 0.85, 0.2 + normElev * 0.55);
      } else if (colorMode === 'slope') {
        // Approximate slope with neighbors
        const rPrev = Math.max(0, row - 1);
        const rNext = Math.min(n - 1, row + 1);
        const cPrev = Math.max(0, col - 1);
        const cNext = Math.min(n - 1, col + 1);
        const dz_dx = (loadedTile.elevations[row * n + cNext] - loadedTile.elevations[row * n + cPrev]) / 120;
        const dz_dy = (loadedTile.elevations[rNext * n + col] - loadedTile.elevations[rPrev * n + col]) / 120;
        const slopeDeg = (Math.atan(Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy)) * 180) / Math.PI;

        // Artemis trafficability: < 8° (safe green), 8-15° (moderate amber), > 15° (hazardous red)
        if (slopeDeg < 8) c.setRGB(0.15, 0.75, 0.35);
        else if (slopeDeg < 15) c.setRGB(0.95, 0.75, 0.15);
        else c.setRGB(0.9, 0.2, 0.2);
      } else if (colorMode === 'sunlight') {
        // Elevation correlation to sunlight at South Pole
        const normElev = Math.max(0, Math.min(1, (elev - minElev) / elevRange));
        if (normElev < 0.2) c.setRGB(0.04, 0.05, 0.18); // Deep shadow cold trap
        else if (normElev < 0.7) c.setRGB(0.2, 0.45, 0.85);
        else c.setRGB(0.95, 0.85, 0.25); // Illuminated crest
      }

      colors.setXYZ(i, c.r, c.g, c.b);
    }
    colors.needsUpdate = true;
    mat.needsUpdate = true;
  }, [colorMode, loadedTile]);

  // 4. Update Celestial Bodies & Real Dynamic Sunlight Vector
  useEffect(() => {
    const center = new THREE.Vector3(0, 0, 1.2);
    const orbitDistance = 46;

    // Calculate 3D position of Sun
    const sunAzRad = (skyState.sun.az_deg * Math.PI) / 180;
    const sunElRad = (skyState.sun.el_deg * Math.PI) / 180;
    const sunPos = new THREE.Vector3(
      center.x + orbitDistance * Math.sin(sunAzRad) * Math.cos(sunElRad),
      center.y + orbitDistance * Math.cos(sunAzRad) * Math.cos(sunElRad),
      center.z + orbitDistance * Math.sin(sunElRad)
    );

    // Align directional sun light to cast true long polar shadows
    if (directionalSunLightRef.current) {
      directionalSunLightRef.current.position.copy(sunPos);
      directionalSunLightRef.current.target.position.set(0, 0, 0);
      directionalSunLightRef.current.intensity = Math.max(0.2, Math.sin(Math.max(0.01, sunElRad)) * 2.8 + 0.3);
    }

    if (sunGroupRef.current) {
      sunGroupRef.current.position.copy(sunPos);
      sunGroupRef.current.visible = showVectors;
    }

    if (sunBeamRef.current) {
      sunBeamRef.current.visible = showVectors;
      sunBeamRef.current.geometry.setFromPoints([center, sunPos]);
      sunBeamRef.current.computeLineDistances();
    }

    // Calculate 3D position of Earth
    const earthAzRad = (skyState.earth.az_deg * Math.PI) / 180;
    const earthElRad = (skyState.earth.el_deg * Math.PI) / 180;
    const earthPos = new THREE.Vector3(
      center.x + (orbitDistance - 6) * Math.sin(earthAzRad) * Math.cos(earthElRad),
      center.y + (orbitDistance - 6) * Math.cos(earthAzRad) * Math.cos(earthElRad),
      center.z + (orbitDistance - 6) * Math.sin(earthElRad)
    );

    if (earthGroupRef.current) {
      earthGroupRef.current.position.copy(earthPos);
      earthGroupRef.current.visible = showVectors;
    }

    if (earthBeamRef.current) {
      earthBeamRef.current.visible = showVectors;
      earthBeamRef.current.geometry.setFromPoints([center, earthPos]);
      earthBeamRef.current.computeLineDistances();
    }
  }, [skyState, showVectors]);

  return (
    <div
      style={{
        background: '#040404',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '0px',
        padding: '18px',
        color: '#f8fafc',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 1,
        height: isFullscreen ? '100vh' : 'auto',
        display: isFullscreen ? 'flex' : 'block',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: isFullscreen ? 'hidden' : 'visible',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={20} color="#ff3d18" />
              3D High-Res Site Topography & Directional Vector Explorer
            </h3>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#141414', color: '#ff4d2b', border: '1px solid rgba(255, 61, 24, 0.3)' }}>
              {siteName}
            </span>
            {realDemLoaded ? (
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#064e3b', color: '#34d399', border: '1px solid #059669' }}>
                NASA LOLA 60m DEM Active
              </span>
            ) : loadingDem ? (
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#1e293b', color: '#94a3b8' }}>
                Loading DEM...
              </span>
            ) : null}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
            Photorealistic 30×30 km lunar regolith mesh with true LOLA elevation relief, dynamic grazing polar shadows, and orbital sightlines.
          </p>
        </div>

        {/* View Mode & Shading Controls */}
        <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['photorealistic', 'elevation', 'slope', 'sunlight'] as ColorMode[]).map((modeKey) => (
            <button
              key={modeKey}
              onClick={() => setColorMode(modeKey)}
              style={{
                background: colorMode === modeKey ? '#ff3d18' : '#121212',
                color: colorMode === modeKey ? '#ffffff' : '#cbd5e1',
                border: colorMode === modeKey ? '1px solid #ff3d18' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '0px',
                padding: '5px 12px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'Michroma, sans-serif',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {modeKey === 'photorealistic' && <Eye size={12} />}
              {modeKey === 'elevation' && <Mountain size={12} />}
              {modeKey === 'slope' && <Layers size={12} />}
              {modeKey === 'sunlight' && <Box size={12} />}
              {modeKey}
            </button>
          ))}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              padding: '5px 12px',
              fontSize: '0.7rem',
              fontFamily: 'Michroma, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              marginLeft: '6px',
            }}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div style={{ position: 'relative', flex: isFullscreen ? 1 : 'none' }}>
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: isFullscreen ? 'calc(100vh - 150px)' : '400px',
            background: '#000000',
            borderRadius: '0px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            cursor: 'grab',
          }}
        />

        {/* Floating Quick Legend / Specs in Canvas */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '6px 10px',
          fontSize: '0.72rem',
          fontFamily: 'monospace',
          color: '#e2e8f0',
          pointerEvents: 'none',
        }}>
          <div>Topography: {realDemLoaded ? 'LOLA 60m Resolution (501×501)' : 'High-density DEM Grid'}</div>
          <div>Elevation Span: {loadedTile ? `${loadedTile.minElev.toFixed(0)}m to +${loadedTile.maxElev.toFixed(0)}m` : 'Measuring...'}</div>
          <div>Grazing Sun: {skyState.sun.el_deg.toFixed(1)}° El ({skyState.is_sun_visible ? 'Direct Light' : 'Shadow'})</div>
          <div>Direct-to-Earth: {skyState.earth.el_deg.toFixed(1)}° El ({skyState.is_earth_visible ? 'Clear LOS' : 'Obscured'})</div>
        </div>

        {/* Vertical Exaggeration Slider Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '6px 12px',
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#cbd5e1',
        }}>
          <span>Z-Exaggeration: {verticalExag.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={verticalExag}
            onChange={(e) => setVerticalExag(parseFloat(e.target.value))}
            style={{ width: '80px', accentColor: '#ff3d18', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Footer Controls & Celestial Legends */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
            <span>Lander (Center Crest)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px #f59e0b' }} />
            <span>3D Glowing Sun ({skyState.sun.el_deg.toFixed(1)}° El)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block', boxShadow: '0 0 6px #38bdf8' }} />
            <span>3D Earth Marble ({skyState.earth.el_deg.toFixed(1)}° El)</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showVectors}
              onChange={(e) => setShowVectors(e.target.checked)}
              style={{ accentColor: '#ff3d18' }}
            />
            <span>Show Sightline Beams</span>
          </label>
          <span style={{ color: '#64748b' }}>• Drag to orbit • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
