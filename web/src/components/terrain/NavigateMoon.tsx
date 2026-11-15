import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import MoonModel from "../3d/MoonModel";
import type { LunarSite } from "../../data/lunarSites";

interface NavigateMoonProps {
  sites: LunarSite[];
  selectionMode: boolean;
  historyMode: boolean;
  selectedSite: LunarSite | null;
  focusedSite: LunarSite | null;
  onSelectSite: (site: LunarSite) => void;
  framed?: boolean;
}

export default function NavigateMoon({
  sites,
  selectionMode,
  historyMode,
  selectedSite,
  focusedSite,
  onSelectSite,
  framed = false,
}: NavigateMoonProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [spinning, setSpinning] = useState(true);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    if (!focusedSite) return;

    controlsRef.current?.reset();
  }, [focusedSite?.id]);

  const stopSpin = () => {
    setSpinning(false);
  };

  const resumeSpin = () => {
    setSpinning(true);
  };

  const hintText = historyMode
    ? focusedSite
      ? `FOCUS · ${focusedSite.name}`
      : "MOVE THROUGH MISSION HISTORY"
    : spinning
      ? "Click to stop, drag to turn, scroll to zoom"
      : "Drag to turn, scroll to zoom";

  return (
    <div
      className={
        framed
          ? `
            absolute
            left-1/2
            top-1/2
            h-[min(76cqmin,600px)]
            w-[min(76cqmin,600px)]
            -translate-x-1/2
            -translate-y-1/2
          `
          : `
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
          `
      }
    >
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
              ? framed
                ? "border border-white/[0.08]"
                : `
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
        onPointerDownCapture={() => {
          if (!historyMode && spinning) {
            stopSpin();
          }
        }}
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
            historyMode || !spinning
              ? 0
              : 0.12
          }
          onSelectSite={onSelectSite}
        />

        <OrbitControls
          ref={controlsRef}
          enableZoom
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.55}
          minDistance={4.2}
          maxDistance={7}
          onStart={() => {
            setIsInteracting(true);
          }}
          onEnd={() => {
            setIsInteracting(false);
          }}
        />
      </Canvas>

      {!framed && (
        <div
          className="
            pointer-events-none
            absolute
            -bottom-
            left-1/2
            -translate-x-1/2
            whitespace-nowrap
            text-[9px]
            uppercase
            tracking-[1.5px]
            text-white/40
          "
        >
          {hintText}
        </div>
      )}

      {!framed && !historyMode && !spinning && (
        <button
          type="button"
          onClick={resumeSpin}
          className="
            absolute
            -bottom-[70px]
            left-1/2
            z-20
            -translate-x-1/2
            rounded-full
            border
            border-white/10
            bg-white/[0.06]
            px-4
            py-2
            text-[11px]
            text-white/65
            backdrop-blur-md
            transition
            hover:border-white/20
            hover:bg-white/[0.1]
            hover:text-white
            active:scale-95
          "
        >
          Resume spin
        </button>
      )}

      {framed && !historyMode && !spinning && (
        <button
          type="button"
          onClick={resumeSpin}
          className="
            absolute
            bottom-4
            left-1/2
            z-20
            -translate-x-1/2
            rounded-full
            border
            border-white/10
            bg-black/50
            px-4
            py-2
            text-[11px]
            text-white/70
            backdrop-blur-md
            transition
            hover:border-white/20
            hover:bg-white/[0.08]
            hover:text-white
            active:scale-95
          "
        >
          Resume spin
        </button>
      )}

      
    </div>
    
  );
}