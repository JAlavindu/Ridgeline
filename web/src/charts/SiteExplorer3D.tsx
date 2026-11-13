import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { TileData3D, SkyState, AppMode } from '../types';
import { Box } from 'lucide-react';

interface SiteExplorer3DProps {
  tileData: TileData3D;
  skyState: SkyState;
  siteName: string;
  mode: AppMode;
}

type ColorMode = 'elevation' | 'slope' | 'sunlight' | 'shadow';

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
  ctx.fillStyle = '#15803d'; // vegetation green
  // Africa / Europe
  ctx.beginPath();
  ctx.ellipse(500, 260, 90, 140, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(520, 120, 110, 60, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Asia
  ctx.fillStyle = '#166534';
  ctx.beginPath();
  ctx.ellipse(720, 170, 160, 90, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Americas
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

  // Cloud bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let y = 60; y < canvas.height; y += 80) {
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 40) {
      const cy = y + Math.sin(x * 0.02) * 20;
      ctx.arc(x, cy, 25, 0, Math.PI * 2);
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
 * Procedural Sun canvas texture (solar granulations, chromosphere flares)
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

  // Solar flares / hotspots
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 10 + Math.random() * 25;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export const SiteExplorer3D: React.FC<SiteExplorer3DProps> = ({
  tileData,
  skyState,
  siteName,
  mode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('elevation');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const exaggeration = 2.0;

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // 3D Celestial Body Mesh references
  const sunGroupRef = useRef<THREE.Group | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const sunBeamRef = useRef<THREE.Line | null>(null);
  const earthBeamRef = useRef<THREE.Line | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = 360;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -60, 45);
    camera.up.set(0, 0, 1); // Z is Up
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(20, -30, 40);
    scene.add(dirLight);

    // 5. Lunar Terrain Geometry from TileData3D
    const gridSize = tileData.grid_size;
    const planeGeom = new THREE.PlaneGeometry(50, 50, gridSize - 1, gridSize - 1);
    const posAttr = planeGeom.attributes.position;

    // Populate heights
    for (let i = 0; i < posAttr.count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const elev = tileData.elevations[row]?.[col] || 0;
      posAttr.setZ(i, (elev / 1000) * exaggeration);
    }
    planeGeom.computeVertexNormals();

    const planeMat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.1,
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    const terrainMesh = new THREE.Mesh(planeGeom, planeMat);
    scene.add(terrainMesh);
    meshRef.current = terrainMesh;

    // 6. Lander Marker at Center
    const lander = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 1.2, 8), bodyMat);
    body.rotation.x = Math.PI / 2;
    lander.add(body);

    const mastMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0), mastMat);
    mast.position.z = 1.0;
    mast.rotation.x = Math.PI / 2;
    lander.add(mast);

    lander.position.set(0, 0, 1);
    scene.add(lander);

    // 7. BUILD 3D PHOTOREALISTIC CELESTIAL BODIES
    const center = new THREE.Vector3(0, 0, 1.5);

    // --- 3D SUN (Glow, Sphere & Solar Light) ---
    const sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(3.2, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      map: createSunTexture(),
      color: 0xfff0aa,
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    // Solar Corona Atmosphere Shell
    const coronaGeom = new THREE.SphereGeometry(4.2, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    sunGroup.add(coronaMesh);

    scene.add(sunGroup);
    sunGroupRef.current = sunGroup;

    // --- 3D EARTH (Blue Marble Globe, Atmosphere, Clouds) ---
    const earthGroup = new THREE.Group();
    const earthGeom = new THREE.SphereGeometry(2.4, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.6,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeom, earthMat);
    earthGroup.add(earthMesh);

    // Atmospheric Blue Scattering Shell
    const atmoGeom = new THREE.SphereGeometry(2.7, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
    earthGroup.add(atmoMesh);

    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // --- Guide Beams (Laser line from lander to Sun and Earth) ---
    const sunBeamGeom = new THREE.BufferGeometry().setFromPoints([center, new THREE.Vector3(0, 0, 30)]);
    const sunBeamMat = new THREE.LineDashedMaterial({ color: 0xfbbf24, dashSize: 1.5, gapSize: 0.8 });
    const sunBeam = new THREE.Line(sunBeamGeom, sunBeamMat);
    sunBeam.computeLineDistances();
    scene.add(sunBeam);
    sunBeamRef.current = sunBeam;

    const earthBeamGeom = new THREE.BufferGeometry().setFromPoints([center, new THREE.Vector3(0, 0, 30)]);
    const earthBeamMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 1.5, gapSize: 0.8 });
    const earthBeam = new THREE.Line(earthBeamGeom, earthBeamMat);
    earthBeam.computeLineDistances();
    scene.add(earthBeam);
    earthBeamRef.current = earthBeam;

    // 8. Mouse drag orbit controls
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let theta = Math.PI / 4;
    let phi = Math.PI / 3;
    let radius = 65;

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

      theta -= deltaX * 0.01;
      phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, phi - deltaY * 0.01));
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(25, Math.min(130, radius + e.deltaY * 0.06));
      updateCameraPos();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 9. Animation Loop (Rotates Earth & Sun dynamically)
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate Sun and Earth around their axes
      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.z += 0.005; // Earth spin
      }
      if (sunGroupRef.current) {
        sunGroupRef.current.rotation.z += 0.002; // Solar rotation
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      planeGeom.dispose();
      planeMat.dispose();
      sunGeom.dispose();
      sunMat.dispose();
      earthGeom.dispose();
      earthMat.dispose();
    };
  }, [tileData]);

  // Update vertex colors dynamically when colorMode changes
  useEffect(() => {
    if (!meshRef.current) return;
    const geom = meshRef.current.geometry as THREE.PlaneGeometry;
    const gridSize = tileData.grid_size;
    const pos = geom.attributes.position;
    let colors = geom.attributes.color as THREE.BufferAttribute;
    if (!colors) {
      colors = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
      geom.setAttribute('color', colors);
    }

    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const elev = tileData.elevations[row]?.[col] || 0;
      const slope = tileData.slopes_deg[row]?.[col] || 0;
      const sun = tileData.avg_sunlight_pct[row]?.[col] || 0;

      if (colorMode === 'elevation') {
        const normElev = Math.max(0, Math.min(1, (elev + 400) / 1400));
        c.setHSL(0.58, 0.2, 0.15 + normElev * 0.55);
      } else if (colorMode === 'slope') {
        if (slope < 8) c.setRGB(0.2, 0.7, 0.3);
        else if (slope < 15) c.setRGB(0.9, 0.7, 0.2);
        else c.setRGB(0.9, 0.2, 0.2);
      } else if (colorMode === 'sunlight') {
        const normSun = sun / 100;
        if (normSun < 0.1) c.setRGB(0.05, 0.05, 0.15);
        else if (normSun < 0.6) c.setRGB(0.2, 0.4, 0.8 * normSun);
        else c.setRGB(0.95 * normSun, 0.8 * normSun, 0.2);
      } else {
        c.setRGB(0.5, 0.5, 0.5);
      }

      colors.setXYZ(i, c.r, c.g, c.b);
    }
    colors.needsUpdate = true;
  }, [colorMode, tileData]);

  // Update 3D celestial positions and guide lines
  useEffect(() => {
    const center = new THREE.Vector3(0, 0, 1.5);
    const orbitDistance = 42; // Distance of 3D Sun and Earth in sky

    // Calculate 3D position of Sun
    const sunAzRad = (skyState.sun.az_deg * Math.PI) / 180;
    const sunElRad = (skyState.sun.el_deg * Math.PI) / 180;
    const sunPos = new THREE.Vector3(
      center.x + orbitDistance * Math.sin(sunAzRad) * Math.cos(sunElRad),
      center.y + orbitDistance * Math.cos(sunAzRad) * Math.cos(sunElRad),
      center.z + orbitDistance * Math.sin(sunElRad)
    );

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
    <div style={{ background: '#040404', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0px', padding: '16px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={20} color="#ff3d18" />
              3D Site Topography & Directional Vector Explorer
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#141414', color: '#ff4d2b' }}>
              {siteName}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            {mode === 'explore' ? 'Explore local crater rims, slopes, and line-of-sight vectors' : 'Digital Elevation Model (aeqd projection) with directional vectors'} with interactive WebGL orbit controls
          </p>
        </div>

        {/* View mode toggle controls */}
        <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
          {(['elevation', 'slope', 'sunlight'] as ColorMode[]).map((modeKey) => (
            <button
              key={modeKey}
              onClick={() => setColorMode(modeKey)}
              style={{
                background: colorMode === modeKey ? '#ff3d18' : '#141414',
                color: colorMode === modeKey ? '#ffffff' : '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '0px',
                padding: '4px 10px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'Michroma, sans-serif',
                fontSize: '0.7rem',
              }}
            >
              {modeKey}
            </button>
          ))}
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '360px',
          background: '#000000',
          borderRadius: '0px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          cursor: 'grab',
        }}
      />

      {/* Footer Controls & Celestial Legends */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
            <span>Lander (Center)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px #f59e0b' }} />
            <span>3D Sun ({skyState.sun.el_deg.toFixed(1)}° El)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block', boxShadow: '0 0 6px #38bdf8' }} />
            <span>3D Earth ({skyState.earth.el_deg.toFixed(1)}° El)</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showVectors}
              onChange={(e) => setShowVectors(e.target.checked)}
              style={{ accentColor: '#ff3d18' }}
            />
            <span>Show 3D Bodies & Rays</span>
          </label>
          <span style={{ color: '#64748b' }}>• Drag to rotate / Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
