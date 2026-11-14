import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { LunarSite } from "../../data/lunarSites";

interface LunarMarkersProps {
  sites: LunarSite[];
  selectedSite: LunarSite;
  onSelectSite: (id: string) => void;
  radius?: number;
}

/**
 * Convert lunar latitude / longitude into a point on the surface of the
 * current Moon model. The GLTF sphere is viewed from +Z, so longitude 0 sits
 * on the front face and positive longitude swings to the right.
 */
export function latLonToVector3(
  latitude: number,
  longitude: number,
  radius: number
) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);

  const x = radius * Math.cos(lat) * Math.sin(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.cos(lon);

  return new THREE.Vector3(x, y, z);
}

export default function LunarMarkers({
  sites,
  selectedSite,
  onSelectSite,
  radius = 1.03,
}: LunarMarkersProps) {
  return (
    <>
      {sites.map((site) => {
        if (site.latitude === null || site.longitude === null) {
          return null;
        }

        const position = latLonToVector3(
          site.latitude,
          site.longitude,
          radius
        );

        const active = site.id === selectedSite.id;

        return (
          <group key={site.id} position={position}>
            {/* Marker */}
            <mesh
              onClick={(event) => {
                event.stopPropagation();
                onSelectSite(site.id);
              }}
            >
              <sphereGeometry args={[active ? 0.035 : 0.025, 16, 16]} />

              <meshBasicMaterial
                color={active ? "#ff3b12" : "#ffffff"}
                transparent
                opacity={active ? 1 : 0.85}
              />
            </mesh>

            {/* Outer ring */}
            {active && (
              <mesh>
                <ringGeometry args={[0.045, 0.065, 32]} />
                <meshBasicMaterial
                  color="#ff3b12"
                  transparent
                  opacity={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Mission label */}
            <Html
              distanceFactor={4}
              position={[0, 0.08, 0]}
              center
              occlude
              style={{
                pointerEvents: "none",
              }}
            >
              <div
                className={`
                  whitespace-nowrap
                  border
                  px-2
                  py-1
                  text-[8px]
                  uppercase
                  tracking-[1.5px]
                  backdrop-blur-md
                  transition-all
                  ${
                    active
                      ? "border-[#ff3b12] bg-black/90 text-[#ff3b12]"
                      : "border-white/15 bg-black/70 text-white/60"
                  }
                `}
              >
                {site.name}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}