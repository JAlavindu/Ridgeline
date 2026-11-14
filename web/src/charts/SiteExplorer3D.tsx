import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { TileData3D, SkyState, AppMode } from '../types';
import { Box, Layers, Eye, Mountain, Maximize2, Minimize2, Globe } from 'lucide-react';

interface SiteExplorer3DProps {
  tileData: TileData3D;
  skyState: SkyState;
  siteName: string;
  mode: AppMode;
}

type ColorMode = 'photorealistic' | 'elevation' | 'slope' | 'sunlight';
type ViewPerspective = 'curved_cap' | 'global_globe';

/**
 * Procedural default lunar regolith surface canvas texture
 */
function createFallbackRegolithTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7a7e85';
  ctx.fillRect(0, 0, 512, 512);

  // Regolith grain noise
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const val = 100 + Math.random() * 55;
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Craters & micro-pits
  for (let i = 0; i < 80; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    const r = 3 + Math.random() * 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40, 42, 48, 0.45)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(215, 220, 230, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

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

  // Stylized continents
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

/** Build a LoadedTerrainTile from a TileData3D prop (synchronous fallback) */
function tileDataToLoadedTile(tileData: TileData3D): LoadedTerrainTile {
  const n = tileData.grid_size || 64;
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
  return {
    elevations: elevFloats,
    n,
    minElev: isFinite(minElev) ? minElev : -500,
    maxElev: isFinite(maxElev) ? maxElev : 1500,
    centerElev: elevFloats[Math.floor(n / 2) * n + Math.floor(n / 2)] || 0,
    isRealLola: false,
  };
}

export const SiteExplorer3D: React.FC<SiteExplorer3DProps> = ({
  tileData,
  skyState,
  siteName,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewPerspective, setViewPerspective] = useState<ViewPerspective>('curved_cap');
  const [colorMode, setColorMode] = useState<ColorMode>('photorealistic');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [verticalExag, setVerticalExag] = useState<number>(1.8);
  const [realDemLoaded, setRealDemLoaded] = useState<boolean>(false);
  const [loadingDem, setLoadingDem] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Loaded real DEM data cache — initialise from the first tileData prop
  const [loadedTile, setLoadedTile] = useState<LoadedTerrainTile>(() => tileDataToLoadedTile(tileData));

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

  // Keep latest skyState & showVectors in refs so the animation loop can read them
  // WITHOUT being in the scene-build effect's dependency array.
  const skyStateRef = useRef(skyState);
  skyStateRef.current = skyState;
  const showVectorsRef = useRef(showVectors);
  showVectorsRef.current = showVectors;

  // 1. Fetch real LOLA 501x501 tile binary data when site changes.
  //    On failure, immediately fall back to the procedural tileData prop.
  useEffect(() => {
    let isMounted = true;
    const siteId = tileData.site_id;

    // Immediately set fallback so the scene can render right away with the new site's data
    const fallback = tileDataToLoadedTile(tileData);
    setLoadedTile(fallback);
    setRealDemLoaded(false);
    setLoadingDem(true);

    async function fetchLolaDem() {
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
        const realFloats = new Float32Array(targetN * targetN);

        let realMin = Infinity;
        let realMax = -Infinity;
        const centerOrig = 250;
        const realCenterElev = int16View[centerOrig * originalN + centerOrig] || 0;

        for (let r = 0; r < targetN; r++) {
          const origRow = r * stride;
          for (let c = 0; c < targetN; c++) {
            const origCol = c * stride;
            const h = int16View[origRow * originalN + origCol];
            const targetIdx = r * targetN + c;
            realFloats[targetIdx] = h;
            if (h < realMin) realMin = h;
            if (h > realMax) realMax = h;
          }
        }

        if (isMounted) {
          setLoadedTile({
            elevations: realFloats,
            n: targetN,
            minElev: realMin,
            maxElev: realMax,
            centerElev: realCenterElev,
            isRealLola: true,
          });
          setRealDemLoaded(true);
        }
      } catch {
        // fallback was already set above
        if (isMounted) {
          setRealDemLoaded(false);
        }
      } finally {
        if (isMounted) setLoadingDem(false);
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

    // Reset texture cache with reliable fallback immediately
    texturesRef.current = {
      albedo: createFallbackRegolithTexture(),
      normal: undefined,
      microBump: undefined,
    };

    textureLoader.load(
      `/data/tiles/${siteId}_albedo.png`,
      (tex) => {
        texturesRef.current.albedo = tex;
        if (terrainMeshRef.current && colorMode === 'photorealistic') {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.map = tex;
          mat.needsUpdate = true;
        }
      },
      undefined,
      () => {
        // Fallback to nbhd
        textureLoader.load(
          `/data/nbhd/${siteId}.png`,
          (tex) => {
            texturesRef.current.albedo = tex;
            if (terrainMeshRef.current && colorMode === 'photorealistic') {
              const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
              mat.map = tex;
              mat.needsUpdate = true;
            }
          },
          undefined,
          () => {
            texturesRef.current.albedo = createFallbackRegolithTexture();
          }
        );
      }
    );

    textureLoader.load(
      `/data/tiles/${siteId}_normal.png`,
      (tex) => {
        texturesRef.current.normal = tex;
        if (terrainMeshRef.current && colorMode === 'photorealistic') {
          const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.normalMap = tex;
          mat.needsUpdate = true;
        }
      }
    );

    textureLoader.load(
      `/data/tiles/lunar_micro_bump.png`,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(16, 16);
        texturesRef.current.microBump = tex;
      }
    );
  }, [tileData.site_id, colorMode]);

  // Helper to update celestial body positions + sunlight direction.
  // Reads from refs so this function identity never changes.
  const updateCelestialVectors = useCallback(() => {
    const sky = skyStateRef.current;
    const vectors = showVectorsRef.current;
    const center = new THREE.Vector3(0, 0, 1.2);
    const orbitDistance = 46;

    // 1. Sun
    const sunAzRad = (sky.sun.az_deg * Math.PI) / 180;
    const sunElRad = (sky.sun.el_deg * Math.PI) / 180;
    const sunPos = new THREE.Vector3(
      center.x + orbitDistance * Math.sin(sunAzRad) * Math.cos(sunElRad),
      center.y + orbitDistance * Math.cos(sunAzRad) * Math.cos(sunElRad),
      center.z + orbitDistance * Math.sin(sunElRad)
    );

    // Directional Sunlight aligned with the true solar vector so hills cast realistic shadows
    if (directionalSunLightRef.current) {
      // Allow realistic grazing incidence (down to 0.035 rad ~ 2.0°)
      const lightElevationRad = Math.max(0.035, Math.abs(sunElRad));
      const lightDistance = 65;
      const lightPos = new THREE.Vector3(
        center.x + lightDistance * Math.sin(sunAzRad) * Math.cos(lightElevationRad),
        center.y + lightDistance * Math.cos(sunAzRad) * Math.cos(lightElevationRad),
        center.z + lightDistance * Math.sin(lightElevationRad)
      );
      directionalSunLightRef.current.position.copy(lightPos);
      directionalSunLightRef.current.target.position.set(0, 0, 0);
      directionalSunLightRef.current.target.updateMatrixWorld();
      directionalSunLightRef.current.intensity = sky.is_sun_visible ? 2.6 : 0.8;
    }

    if (sunGroupRef.current) {
      sunGroupRef.current.position.copy(sunPos);
      sunGroupRef.current.visible = vectors;
    }

    if (sunBeamRef.current) {
      sunBeamRef.current.visible = vectors;
      sunBeamRef.current.geometry.setFromPoints([center, sunPos]);
      sunBeamRef.current.computeLineDistances();
    }

    // 2. Earth
    const earthAzRad = (sky.earth.az_deg * Math.PI) / 180;
    const earthElRad = (sky.earth.el_deg * Math.PI) / 180;
    const earthPos = new THREE.Vector3(
      center.x + (orbitDistance - 6) * Math.sin(earthAzRad) * Math.cos(earthElRad),
      center.y + (orbitDistance - 6) * Math.cos(earthAzRad) * Math.cos(earthElRad),
      center.z + (orbitDistance - 6) * Math.sin(earthElRad)
    );

    if (earthGroupRef.current) {
      earthGroupRef.current.position.copy(earthPos);
      earthGroupRef.current.visible = vectors;
    }

    if (earthBeamRef.current) {
      earthBeamRef.current.visible = vectors;
      earthBeamRef.current.geometry.setFromPoints([center, earthPos]);
      earthBeamRef.current.computeLineDistances();
    }
  }, []); // stable — reads from refs

  // 2. Build Three.js scene with High-Res NASA DEM Geometry or Full Global Planet
  //    Depends ONLY on terrain data, view perspective, visual settings, and fullscreen.
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = isFullscreen ? window.innerHeight - 140 : 400;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 2. Camera setup adapted for perspective mode
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.up.set(0, 0, 1);

    // Initial camera spherical angles
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.2;
    let radius = viewPerspective === 'global_globe' ? 68 : 65;

    // For Global Globe mode: pre-align camera towards the landing site so it is immediately visible
    if (viewPerspective === 'global_globe') {
      const lat = tileData.center_lat;
      const lon = tileData.center_lon;
      const latR = (lat * Math.PI) / 180;
      const lonR = (lon * Math.PI) / 180;
      // Normal vector of site on globe
      const nx = Math.cos(latR) * Math.sin(lonR);
      const ny = Math.cos(latR) * Math.cos(lonR);
      const nz = Math.sin(latR);

      // Camera positioned looking down along normal
      theta = Math.atan2(nx, -ny);
      phi = Math.max(0.12, Math.min(Math.PI - 0.12, Math.acos(Math.max(-1, Math.min(1, nz)))));
      radius = 64;
    }

    const updateCameraPos = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = -radius * Math.sin(phi) * Math.cos(theta);
      camera.position.z = radius * Math.cos(phi);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    // 3. Renderer with PBR tone mapping & Shadow Map support
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Soft fill + ambient so shadow zones stay readable (not pitch black)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.45);
    hemiLight.position.set(0, 0, 50);
    scene.add(hemiLight);

    // Camera overhead subtle fill light
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.25);
    fillLight.position.set(0, -40, 60);
    scene.add(fillLight);

    // Ambient light floor — guarantees deep crater interiors retain visible details
    const ambientLight = new THREE.AmbientLight(0x334155, 0.35);
    scene.add(ambientLight);

    // Directional Solar Key Light casting dynamic real-time shadows
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1.0;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -38;
    sunLight.shadow.camera.right = 38;
    sunLight.shadow.camera.top = 38;
    sunLight.shadow.camera.bottom = -38;
    sunLight.shadow.bias = -0.0006;
    sunLight.shadow.normalBias = 0.05;
    scene.add(sunLight);
    directionalSunLightRef.current = sunLight;

    // Starfield background
    const starCount = 350;
    const starGeom = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount; s++) {
      const u = Math.random();
      const v = Math.random();
      const th = u * 2 * Math.PI;
      const ph = Math.acos(2 * v - 1);
      const rad = 250 + Math.random() * 50;
      starPos[s * 3] = rad * Math.sin(ph) * Math.cos(th);
      starPos[s * 3 + 1] = rad * Math.sin(ph) * Math.sin(th);
      starPos[s * 3 + 2] = rad * Math.cos(ph);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.65 });
    const stars = new THREE.Points(starGeom, starMat);
    scene.add(stars);

    // 5. Construct Geometry: Global Planet Sphere OR Spherical Curved Lunar Cap
    let activeMesh: THREE.Mesh | THREE.Group;
    let cleanupGeom: THREE.BufferGeometry | null = null;
    let cleanupMat: THREE.Material | null = null;

    if (viewPerspective === 'global_globe') {
      // FULL MOON 3D MODEL GLOBE
      const globeRadius = 25.0;
      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // 1. High-detail fallback sphere
      const sphereGeom = new THREE.SphereGeometry(globeRadius, 96, 64);
      cleanupGeom = sphereGeom;
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x9fa6b2,
        roughness: 0.85,
        metalness: 0.05,
        map: texturesRef.current.albedo || createFallbackRegolithTexture(),
        normalMap: texturesRef.current.normal || texturesRef.current.microBump,
        normalScale: new THREE.Vector2(1.5, 1.5),
      });
      cleanupMat = sphereMat;
      const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
      globeGroup.add(sphereMesh);

      // 2. Load high-poly 3D Moon model (/model/moon.glb)
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        '/model/moon.glb',
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              m.castShadow = true;
              m.receiveShadow = true;
              if (m.material) {
                (m.material as THREE.MeshStandardMaterial).roughness = 0.88;
              }
            }
          });
          // moon.glb has radius approx 1.0 unit -> scale to globeRadius
          model.scale.set(globeRadius, globeRadius, globeRadius);
          sphereMesh.visible = false; // Hide fallback once high-res model is ready
          globeGroup.add(model);
        },
        undefined,
        (err) => {
          console.warn('Using high-definition procedural Moon globe fallback:', err);
        }
      );

      activeMesh = globeGroup;
      terrainMeshRef.current = sphereMesh;

      // Calculate exact 3D coordinates of the landing site on the globe
      // lat: -90 (South Pole) to +90 (North Pole), lon: 0 to 360
      const latDeg = tileData.center_lat;
      const lonDeg = tileData.center_lon;
      const latR = (latDeg * Math.PI) / 180;
      const lonR = (lonDeg * Math.PI) / 180;

      // Normal unit vector from center
      const normalDir = new THREE.Vector3(
        Math.cos(latR) * Math.sin(lonR),
        Math.cos(latR) * Math.cos(lonR),
        Math.sin(latR)
      ).normalize();

      // Surface position
      const surfacePos = normalDir.clone().multiplyScalar(globeRadius);

      // Landing Marker Beacon Group
      const markerGroup = new THREE.Group();
      markerGroup.position.copy(surfacePos);
      markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalDir);

      // 1. High-contrast Glowing Landing Target Rings
      const ringOuter = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.3, 36),
        new THREE.MeshBasicMaterial({ color: 0xff3d18, side: THREE.DoubleSide })
      );
      ringOuter.position.z = 0.08;
      markerGroup.add(ringOuter);

      const ringInner = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.9, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      );
      ringInner.position.z = 0.12;
      markerGroup.add(ringInner);

      // 2. Floating High-Visibility Vertical Marker Pin (pointing directly into landing spot)
      const pinSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.85, 4.5, 16),
        new THREE.MeshBasicMaterial({ color: 0xff3d18 })
      );
      pinSpike.position.z = 2.4;
      pinSpike.rotation.x = -Math.PI / 2; // Point cone tip down towards surface
      markerGroup.add(pinSpike);

      // Glowing sphere head on pin
      const pinHead = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      pinHead.position.z = 4.8;
      markerGroup.add(pinHead);

      // 3. Rover / Lander Model placed directly at the marked landing site
      const miniLander = new THREE.Group();
      const miniBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.3, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 })
      );
      miniBody.position.z = 0.65;
      miniBody.rotation.x = Math.PI / 2;
      miniLander.add(miniBody);

      const miniDish = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2.5),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 })
      );
      miniDish.position.set(0.4, 0.4, 1.4);
      miniDish.rotation.x = Math.PI / 4;
      miniLander.add(miniDish);

      markerGroup.add(miniLander);
      scene.add(markerGroup);
    } else {
      // CURVED PLANETARY CAP (Spherical Sector matching planetary horizon drop-off)
      const n = loadedTile.n;
      const capGeom = new THREE.PlaneGeometry(54, 54, n - 1, n - 1);
      cleanupGeom = capGeom;
      const posAttr = capGeom.attributes.position;
      const colorAttr = new THREE.BufferAttribute(new Float32Array(posAttr.count * 3), 3);
      capGeom.setAttribute('color', colorAttr);

      // Curvature radius representing the planetary spherical horizon
      const sphereCurvR = 120.0;
      const centerElev = loadedTile.centerElev;

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const rDistSq = x * x + y * y;
        // Spherical horizon drop z_curve = - (x^2 + y^2) / (2 * R)
        const zCurv = -rDistSq / (2 * sphereCurvR);

        const elev = loadedTile.elevations[i] ?? 0;
        const relElev = elev - centerElev;
        const zTerrain = (relElev / 500) * verticalExag;

        posAttr.setZ(i, zCurv + zTerrain);
      }
      capGeom.computeVertexNormals();

      const capMat = new THREE.MeshStandardMaterial({
        color: 0xaab0b8,
        roughness: 0.78,
        metalness: 0.04,
        map: colorMode === 'photorealistic' ? (texturesRef.current.albedo || createFallbackRegolithTexture()) : undefined,
        normalMap: colorMode === 'photorealistic' ? (texturesRef.current.normal || texturesRef.current.microBump) : undefined,
        normalScale: new THREE.Vector2(1.2, 1.2),
        vertexColors: colorMode !== 'photorealistic',
        side: THREE.DoubleSide,
      });
      cleanupMat = capMat;

      activeMesh = new THREE.Mesh(capGeom, capMat);
      activeMesh.castShadow = true;
      activeMesh.receiveShadow = true;
      scene.add(activeMesh);
      terrainMeshRef.current = activeMesh;

      // False-color shading on curved surface
      if (colorMode !== 'photorealistic') {
        const c = new THREE.Color();
        const minElev = loadedTile.minElev;
        const maxElev = loadedTile.maxElev;
        const range = Math.max(1, maxElev - minElev);
        for (let i = 0; i < loadedTile.elevations.length; i++) {
          const elev = loadedTile.elevations[i];
          if (colorMode === 'elevation') {
            const normElev = Math.max(0, Math.min(1, (elev - minElev) / range));
            c.setHSL(0.7 - normElev * 0.7, 0.85, 0.2 + normElev * 0.55);
          } else if (colorMode === 'slope') {
            const row = Math.floor(i / n);
            const col = i % n;
            const rPrev = Math.max(0, row - 1);
            const rNext = Math.min(n - 1, row + 1);
            const cPrev = Math.max(0, col - 1);
            const cNext = Math.min(n - 1, col + 1);
            const dz_dx = (loadedTile.elevations[row * n + cNext] - loadedTile.elevations[row * n + cPrev]) / 120;
            const dz_dy = (loadedTile.elevations[rNext * n + col] - loadedTile.elevations[rPrev * n + col]) / 120;
            const slopeDeg = (Math.atan(Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy)) * 180) / Math.PI;
            if (slopeDeg < 8) c.setRGB(0.15, 0.75, 0.35);
            else if (slopeDeg < 15) c.setRGB(0.95, 0.75, 0.15);
            else c.setRGB(0.9, 0.2, 0.2);
          } else {
            const normElev = Math.max(0, Math.min(1, (elev - minElev) / range));
            if (normElev < 0.2) c.setRGB(0.04, 0.05, 0.18);
            else if (normElev < 0.7) c.setRGB(0.2, 0.45, 0.85);
            else c.setRGB(0.95, 0.85, 0.25);
          }
          colorAttr.setXYZ(i, c.r, c.g, c.b);
        }
        colorAttr.needsUpdate = true;
      }

      // 6. Lander Marker (Center crest) - only rendered in local curved cap view
      const lander = new THREE.Group();
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        metalness: 0.85,
        roughness: 0.25,
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.1, 1.0, 8), baseMat);
      body.rotation.x = Math.PI / 2;
      body.castShadow = true;
      lander.add(body);

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
        footpad.castShadow = true;
        lander.add(footpad);
      }

      const dishMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.7, roughness: 0.3 });
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.5), dishMat);
      dish.position.set(0.3, 0.3, 1.35);
      dish.rotation.x = Math.PI / 4;
      dish.castShadow = true;
      lander.add(dish);

      lander.position.set(0, 0, 0.9);
      scene.add(lander);
    }

    // 7. Celestial Bodies
    const center = new THREE.Vector3(0, 0, 1.2);

    // Sun
    const sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(3.6, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      map: createSunTexture(),
      color: 0xfff0aa,
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

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

    // Earth
    const earthGroup = new THREE.Group();
    const earthGeom = new THREE.SphereGeometry(2.6, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.55,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeom, earthMat);
    earthGroup.add(earthMesh);

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

    // Laser Beams
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

    // Apply immediate position for Sun & Earth
    updateCelestialVectors();

    // 8. Orbit Controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

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

    // 9. Animation Loop — reads skyState/showVectors from refs each frame
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Update celestial positions every frame from latest refs
      updateCelestialVectors();

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
      cleanupGeom.dispose();
      cleanupMat.dispose();
      starGeom.dispose();
      starMat.dispose();
      sunGeom.dispose();
      sunMat.dispose();
      earthGeom.dispose();
      earthMat.dispose();
    };
    // NOTE: updateCelestialVectors is stable (empty deps useCallback) so it never
    // triggers this effect. skyState changes are picked up via the ref in the anim loop.
  }, [loadedTile, viewPerspective, verticalExag, colorMode, isFullscreen, updateCelestialVectors]);

  const content = (
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
        zIndex: isFullscreen ? 99999 : 1,
        width: isFullscreen ? '100vw' : '100%',
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
              3D Moon Surface & Space Sightlines
            </h3>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: '#141414', color: '#ff4d2b', border: '1px solid rgba(255, 61, 24, 0.3)' }}>
              {siteName}
            </span>
            {realDemLoaded ? (
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#064e3b', color: '#34d399', border: '1px solid #059669' }}>
                Real Moon Height Data Active
              </span>
            ) : loadingDem ? (
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#1e293b', color: '#94a3b8' }}>
                Loading 3D Map...
              </span>
            ) : (
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#141414', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                3D Terrain Ready
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
            Interactive 3D view of the landing ground (30×30 km), crater hills, and direct laser sightlines to the Sun and Earth.
          </p>
        </div>

        {/* View Perspective & Shading Controls */}
        <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Curved Cap vs Global Globe Toggle */}
          <div style={{ display: 'flex', background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.25)', padding: '2px', marginRight: '6px' }}>
            <button
              type="button"
              onClick={() => setViewPerspective('curved_cap')}
              style={{
                background: viewPerspective === 'curved_cap' ? '#ff3d18' : 'transparent',
                color: viewPerspective === 'curved_cap' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: 'Michroma, sans-serif',
                fontSize: '0.68rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Mountain size={11} />
              <span>Curved Surface</span>
            </button>
            <button
              type="button"
              onClick={() => setViewPerspective('global_globe')}
              style={{
                background: viewPerspective === 'global_globe' ? '#ff3d18' : 'transparent',
                color: viewPerspective === 'global_globe' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: 'Michroma, sans-serif',
                fontSize: '0.68rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <Globe size={11} />
              <span>Whole Moon Globe</span>
            </button>
          </div>

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
              {modeKey === 'photorealistic' ? 'Real Look' : modeKey === 'elevation' ? 'Heights' : modeKey === 'slope' ? 'Steepness' : 'Sunlight'}
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
          <div>Map Size: 30 km × 30 km Area</div>
          <div>Ground Heights: {`${loadedTile.minElev.toFixed(0)}m to +${loadedTile.maxElev.toFixed(0)}m`}</div>
          <div>Sun in Sky: {skyState.sun.el_deg.toFixed(1)}° ({skyState.is_sun_visible ? 'Direct Sunlight' : 'Shadow / Night'})</div>
          <div>Earth Signal: {skyState.earth.el_deg.toFixed(1)}° ({skyState.is_earth_visible ? 'Clear Connection' : 'Blocked by Hills'})</div>
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
          <span title="Increases hill and crater heights so they are easier to see on a flat screen">
            Hill Height Stretch: {verticalExag.toFixed(1)}x
          </span>
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

  return isFullscreen ? createPortal(content, document.body) : content;
};
