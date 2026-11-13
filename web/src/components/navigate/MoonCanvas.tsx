import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MoonModel from "../../components/3d/MoonModel";
import LunarMarkers from "./LunarMarkers";

import type { LunarSite } from "../../data/lunarSites";

interface MoonCanvasProps {
  className?: string;
  interactive?: boolean;
  selectedSite?: LunarSite;
  sites?: LunarSite[];
  onSelectSite?: (id: string) => void;
}

export default function MoonCanvas({
  className = "",
  interactive = true,
  selectedSite,
  sites = [],
  onSelectSite = () => undefined,
}: MoonCanvasProps) {
  const moonRadius = 1.35;
  const markerRadius = moonRadius * 1.01;

  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 38,
        near: 0.1,
        far: 100,
      }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
      }}
      className={className}
    >
      <ambientLight intensity={1.1} />

      <directionalLight
        position={[-4, 3, 5]}
        intensity={2.5}
      />

      <directionalLight
        position={[4, -2, 3]}
        intensity={0.35}
      />

      {/*
        IMPORTANT:

        Moon + markers are inside the same group.

        Therefore when the Moon rotates,
        the coordinates rotate with it.
      */}
      <group>
        <MoonModel />

        {selectedSite && sites.length > 0 && (
          <LunarMarkers
            sites={sites}
            selectedSite={selectedSite}
            onSelectSite={onSelectSite}
            radius={markerRadius}
          />
        )}
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={interactive}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.45}
      />
    </Canvas>
  );
}