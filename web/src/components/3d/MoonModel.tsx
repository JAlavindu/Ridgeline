import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

const MOON_PATH = "/model/moon.glb";

export default function MoonModel() {
  const { scene } = useGLTF(MOON_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const rotationGroup = useRef<Group | null>(null);

  useFrame((_, delta) => {
    if (rotationGroup.current) {
      rotationGroup.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={rotationGroup}>
      <primitive
        object={model}
        scale={1.35}
        position={[0, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(MOON_PATH);