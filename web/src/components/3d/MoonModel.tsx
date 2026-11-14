import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Group, Mesh, Vector3 } from "three";

import type { LunarSite } from "../../data/lunarSites";

const MOON_PATH = "/model/moon.glb";
const MODEL_SCALE = 1.35;

interface MoonModelProps {
  sites?: LunarSite[];
  selectionMode?: boolean;
  selectedSite?: LunarSite | null;
  isInteracting?: boolean;
  autoRotationSpeed?: number;
  onSelectSite?: (site: LunarSite) => void;
}

export default function MoonModel({
  sites = [],
  selectionMode = false,
  selectedSite = null,
  isInteracting = false,
  autoRotationSpeed = 0.25,
  onSelectSite,
}: MoonModelProps) {
  const { scene } = useGLTF(MOON_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const rotationGroup = useRef<Group | null>(null);
  const markerRadius = useMemo(() => {
    let radius = 0;
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.geometry.computeBoundingSphere();
      const bounds = object.geometry.boundingSphere;
      if (!bounds) return;

      const scale = object.getWorldScale(new Vector3());
      const largestScale = Math.max(scale.x, scale.y, scale.z);
      radius = Math.max(radius, (bounds.center.length() + bounds.radius) * largestScale);
    });
    return radius * MODEL_SCALE * 1.005;
  }, [model]);

  useFrame((_, delta) => {
    if (rotationGroup.current && !isInteracting) {
      rotationGroup.current.rotation.y += delta * autoRotationSpeed;
    }
  });

  return (
    <group ref={rotationGroup}>
      <primitive object={model} scale={MODEL_SCALE} position={[0, 0, 0]} />
      {sites.map((site) => {
        if (site.latitude === null || site.longitude === null) return null;

        const latitude = (site.latitude * Math.PI) / 180;
        const longitude = (site.longitude * Math.PI) / 180;
        const position: [number, number, number] = [
          markerRadius * Math.cos(latitude) * Math.sin(longitude),
          markerRadius * Math.sin(latitude),
          markerRadius * Math.cos(latitude) * Math.cos(longitude),
        ];
        const active = selectedSite?.id === site.id;

        const select = (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          if (selectionMode) onSelectSite?.(site);
        };

        return (
          <mesh
            key={site.id}
            position={position}
            onClick={selectionMode && onSelectSite ? select : undefined}
            scale={active ? 1.8 : 1}
          >
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshBasicMaterial
              color={active ? "#ff3b12" : "#f4f1eb"}
              depthTest
              opacity={selectionMode ? 1 : 0.75}
              transparent={!selectionMode}
            />
          </mesh>
        );
      })}
    </group>
  );
}

useGLTF.preload(MOON_PATH);
