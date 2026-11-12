import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

const MOON_PATH = "/model/moon.glb";

export default function MoonModel() {
  const { scene } = useGLTF(MOON_PATH);

  useFrame((_, delta) => {
    scene.rotation.y += delta * 0.25;
  });

  return (
    <primitive
      object={scene}
      scale={1.35}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload(MOON_PATH);