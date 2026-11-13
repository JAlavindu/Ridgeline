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

  // References to three.js objects for live updates without re-instantiating scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const sunArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const earthArrowRef = useRef<THREE.ArrowHelper | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = 340;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -60, 45);
    camera.up.set(0, 0, 1); // Z is Up
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(20, -30, 40);
    scene.add(dirLight);

    // 5. Geometry from TileData3D
    const gridSize = tileData.grid_size;
    const planeGeom = new THREE.PlaneGeometry(50, 50, gridSize - 1, gridSize - 1);
    const posAttr = planeGeom.attributes.position;

    // Populate heights
    for (let i = 0; i < posAttr.count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const elev = tileData.elevations[row]?.[col] || 0;
      posAttr.setZ(i, (elev / 1000) * exaggeration * 12);
    }
    posAttr.needsUpdate = true;
    planeGeom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1,
      vertexColors: true,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(planeGeom, mat);
    scene.add(terrainMesh);
    meshRef.current = terrainMesh;

    // 6. Lander Marker at Center
    const landerGeom = new THREE.CylinderGeometry(0.5, 0.8, 1.2, 8);
    landerGeom.rotateX(Math.PI / 2);
    const landerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lander = new THREE.Mesh(landerGeom, landerMat);
    lander.position.set(0, 0, 1);
    scene.add(lander);

    // 7. Vectors (Sun & Earth)
    const center = new THREE.Vector3(0, 0, 1.5);

    // Sun vector: az clockwise from North (+Y), el above XY plane (+Z)
    const sunAzRad = (skyState.sun.az_deg * Math.PI) / 180;
    const sunElRad = (skyState.sun.el_deg * Math.PI) / 180;
    const sunDir = new THREE.Vector3(
      Math.sin(sunAzRad) * Math.cos(sunElRad),
      Math.cos(sunAzRad) * Math.cos(sunElRad),
      Math.sin(sunElRad)
    ).normalize();

    const sunArrow = new THREE.ArrowHelper(sunDir, center, 14, 0xfbbf24, 3, 1.5);
    scene.add(sunArrow);
    sunArrowRef.current = sunArrow;

    // Earth vector
    const earthAzRad = (skyState.earth.az_deg * Math.PI) / 180;
    const earthElRad = (skyState.earth.el_deg * Math.PI) / 180;
    const earthDir = new THREE.Vector3(
      Math.sin(earthAzRad) * Math.cos(earthElRad),
      Math.cos(earthAzRad) * Math.cos(earthElRad),
      Math.sin(earthElRad)
    ).normalize();

    const earthArrow = new THREE.ArrowHelper(earthDir, center, 16, 0x38bdf8, 3, 1.5);
    scene.add(earthArrow);
    earthArrowRef.current = earthArrow;

    // Simple mouse drag orbit control
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
      radius = Math.max(20, Math.min(120, radius + e.deltaY * 0.05));
      updateCameraPos();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      planeGeom.dispose();
      mat.dispose();
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
        // Lunar hypsometric grayscale tint
        const normElev = Math.max(0, Math.min(1, (elev + 400) / 1400));
        c.setHSL(0.58, 0.2, 0.15 + normElev * 0.55);
      } else if (colorMode === 'slope') {
        // Safe (green < 8°), Caution (amber 8-15°), Hazard (red > 15°)
        if (slope < 8) c.setRGB(0.2, 0.7, 0.3);
        else if (slope < 15) c.setRGB(0.9, 0.7, 0.2);
        else c.setRGB(0.9, 0.2, 0.2);
      } else if (colorMode === 'sunlight') {
        // Average illumination %: 0% dark purple/black, 80%+ gold/white
        const normSun = sun / 100;
        if (normSun < 0.1) c.setRGB(0.05, 0.05, 0.15);
        else if (normSun < 0.6) c.setRGB(0.2, 0.4, 0.8 * normSun);
        else c.setRGB(0.95 * normSun, 0.8 * normSun, 0.2);
      } else {
        // Live shadow / grayscale
        c.setRGB(0.5, 0.5, 0.5);
      }

      colors.setXYZ(i, c.r, c.g, c.b);
    }
    colors.needsUpdate = true;
  }, [colorMode, tileData]);

  // Update vectors visibility and orientation
  useEffect(() => {
    if (sunArrowRef.current) {
      sunArrowRef.current.visible = showVectors;
      const sunAzRad = (skyState.sun.az_deg * Math.PI) / 180;
      const sunElRad = (skyState.sun.el_deg * Math.PI) / 180;
      const sunDir = new THREE.Vector3(
        Math.sin(sunAzRad) * Math.cos(sunElRad),
        Math.cos(sunAzRad) * Math.cos(sunElRad),
        Math.sin(sunElRad)
      ).normalize();
      sunArrowRef.current.setDirection(sunDir);
    }

    if (earthArrowRef.current) {
      earthArrowRef.current.visible = showVectors;
      const earthAzRad = (skyState.earth.az_deg * Math.PI) / 180;
      const earthElRad = (skyState.earth.el_deg * Math.PI) / 180;
      const earthDir = new THREE.Vector3(
        Math.sin(earthAzRad) * Math.cos(earthElRad),
        Math.cos(earthAzRad) * Math.cos(earthElRad),
        Math.sin(earthElRad)
      ).normalize();
      earthArrowRef.current.setDirection(earthDir);
    }
  }, [skyState, showVectors]);

  return (
    <div style={{ background: '#040404', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0px', padding: '16px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={20} color="#38bdf8" />
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
                background: colorMode === modeKey ? '#2563eb' : '#1e293b',
                color: colorMode === modeKey ? '#ffffff' : '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '0px',
                padding: '5px 10px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: colorMode === modeKey ? 600 : 400,
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
          position: 'relative',
          width: '100%',
          height: '340px',
          borderRadius: '0px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          cursor: 'grab',
        }}
      />

      {/* Overlay controls & Legend bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span>Lander Location (Center)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '3px', background: '#fbbf24', display: 'inline-block' }} />
            <span>Sun Vector ({skyState.sun.el_deg.toFixed(1)}°)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '3px', background: '#38bdf8', display: 'inline-block' }} />
            <span>Earth Vector ({skyState.earth.el_deg.toFixed(1)}°)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showVectors}
              onChange={(e) => setShowVectors(e.target.checked)}
              style={{ accentColor: '#38bdf8' }}
            />
            <span>Show Rays</span>
          </label>
          <span>• Drag to rotate / Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
