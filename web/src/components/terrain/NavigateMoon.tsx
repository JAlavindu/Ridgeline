import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import MoonModel from "../3d/MoonModel";
import type { NavigateSite } from "../../pages/TerrainPage";

interface NavigateMoonProps {
  sites: NavigateSite[];
  selectionMode: boolean;
  selectedSite: NavigateSite | null;
  onSelectSite: (
    site: NavigateSite
  ) => void;
}

export default function NavigateMoon({
  sites,
  selectionMode,
  selectedSite,
  onSelectSite,
}: NavigateMoonProps) {
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
        ${
          selectionMode
            ? "scale-[1.08]"
            : ""
        }
      `}
    >

      {/* =====================================================
          GLOW / SELECTION RING
      ===================================================== */}

      <div
        className={`
          pointer-events-none
          absolute
          -inset-5
          rounded-full
          transition-all
          duration-500
          ${
            selectionMode
              ? `
                border
                border-[#ff3b12]/70
                shadow-[0_0_80px_rgba(255,59,18,0.20)]
              `
              : `
                border
                border-white/[0.05]
              `
          }
        `}
      />

      {/* =====================================================
          SECOND RING
      ===================================================== */}

      <div
        className={`
          pointer-events-none
          absolute
          -inset-10
          rounded-full
          border
          transition-opacity
          duration-500
          ${
            selectionMode
              ? "border-[#ff3b12]/20"
              : "border-white/[0.025]"
          }
        `}
      />

      {/* =====================================================
          THREE.JS MOON
      ===================================================== */}

      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
        className="!h-full !w-full touch-none"
      >

        {/* LIGHTING */}

        <ambientLight
          intensity={1.1}
        />

        <directionalLight
          position={[-4, 3, 5]}
          intensity={2.5}
        />

        <directionalLight
          position={[4, -2, 3]}
          intensity={0.35}
        />

        {/* MOON */}

        <MoonModel />

        {/* ROTATION */}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.55}
        />

      </Canvas>

      {/* =====================================================
          SITE PINS
      ===================================================== */}

      <div
        className="pointer-events-none absolute inset-0"
      >

        {sites
          .slice(0, 24)
          .map((site, index) => {
            const lat = Number(
              site.latitude
            );

            const lon = Number(
              site.longitude
            );

            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lon)
            ) {
              return null;
            }

            /*
             * This is intentionally a lightweight
             * front-face UI projection.
             *
             * For true geographic pinning to the
             * rotating 3D Moon, move these markers
             * into the Three.js scene and convert
             * latitude/longitude to 3D vectors.
             */

            const x =
              50 +
              Math.sin(
                (lon * Math.PI) / 180
              ) *
                37;

            const y =
              50 -
              (lat / 90) * 37;

            const active =
              selectedSite &&
              String(
                selectedSite.id
              ) === String(site.id);

            return (
              <button
                key={String(site.id)}
                type="button"
                aria-label={`Select ${
                  site.name ??
                  `site ${index + 1}`
                }`}
                onClick={() =>
                  onSelectSite(site)
                }
                className={`
                  ${
                    selectionMode
                      ? "pointer-events-auto"
                      : "pointer-events-none"
                  }
                  absolute
                  h-3
                  w-3
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  border
                  border-white
                  transition-all
                  duration-200
                  ${
                    active
                      ? `
                        scale-150
                        bg-[#ff3b12]
                        shadow-[0_0_18px_rgba(255,59,18,0.9)]
                      `
                      : `
                        bg-white/70
                        hover:scale-125
                        hover:bg-[#ff3b12]
                      `
                  }
                `}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
              />
            );
          })}

      </div>

      {/* =====================================================
          SELECTION INSTRUCTION
      ===================================================== */}

      {selectionMode && (
        <div
          className="
            absolute
            -bottom-8
            left-1/2
            -translate-x-1/2
            whitespace-nowrap
            text-[8px]
            uppercase
            tracking-[3px]
            text-[#ff3b12]
          "
        >
          ROTATE THE MOON · SELECT A SITE
        </div>
      )}

      {/* =====================================================
          DEFAULT MOON LABEL
      ===================================================== */}

      {!selectionMode && (
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
            tracking-[3px]
            text-white/20
          "
        >
          DRAG TO ROTATE
        </div>
      )}
    </div>
  );
}