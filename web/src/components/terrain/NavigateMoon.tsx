import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import MoonModel from "../3d/MoonModel";
import type { LunarSite } from "../../data/lunarSites";

interface NavigateMoonProps {
  sites: LunarSite[];
  selectionMode: boolean;
  historyMode: boolean;
  selectedSite: LunarSite | null;
  focusedSite: LunarSite | null;
  onSelectSite: (site: LunarSite) => void;
}

export default function NavigateMoon({
  sites,
  selectionMode,
  historyMode,
  selectedSite,
  focusedSite,
  onSelectSite,
}: NavigateMoonProps) {
  const [
    isInteracting,
    setIsInteracting,
  ] = useState(false);

  return (
    <div
      className={`
        absolute
        left-1/2
        top-[25%]
        h-[min(78vw,360px)]
        w-[min(78vw,360px)]
        -translate-x-1/2
        -translate-y-1/2
        transition-all
        duration-500

        sm:h-[min(55vw,480px)]
        sm:w-[min(55vw,480px)]

        lg:top-1/2
        lg:h-[480px]
        lg:w-[480px]

        ${selectionMode ? "scale-[1.05]" : ""}
      `}
    >

      {/* FOCUS RING */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          -inset-5
          rounded-full
          transition-all
          duration-700
          ${
            focusedSite
              ? `
                border
                border-[#ff3b12]/50
                shadow-[0_0_70px_rgba(255,59,18,0.14)]
              `
              : `
                border
                border-white/[0.05]
              `
          }
        `}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -inset-10
          rounded-full
          border
          border-white/[0.025]
        "
      />

      <Canvas
        aria-label="
          Interactive 3D Moon.
          Drag to rotate and pinch or scroll to zoom.
        "
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
        className="!h-full !w-full touch-none"
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

        <MoonModel
          sites={sites}
          selectionMode={selectionMode}
          selectedSite={selectedSite}
          focusedSite={focusedSite}
          historyMode={historyMode}
          isInteracting={isInteracting}
          autoRotationSpeed={
            historyMode ? 0 : 0.12
          }
          onSelectSite={onSelectSite}
        />

        <OrbitControls
          enableZoom
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.55}
          minDistance={4.2}
          maxDistance={7}
          onStart={() =>
            setIsInteracting(true)
          }
          onEnd={() =>
            setIsInteracting(false)
          }
        />
      </Canvas>

      {/* INSTRUCTION */}

      <div
        className="
          pointer-events-none
          absolute
          -bottom-8
          left-1/2
          -translate-x-1/2
          whitespace-nowrap
          text-[7px]
          uppercase
          tracking-[2px]
          text-white/30
        "
      >
        {historyMode
          ? focusedSite
            ? `FOCUS · ${focusedSite.name}`
            : "MOVE THROUGH MISSION HISTORY"
          : selectionMode
            ? "DRAG TO ROTATE · SELECT A SITE"
            : "DRAG TO ROTATE · PINCH TO ZOOM"}
      </div>
    </div>
  );
}