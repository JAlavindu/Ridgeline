import { useGLTF } from "@react-three/drei";

const MOON_PATH = "/model/moon.glb";

export default function MoonModel() {
  const { scene } = useGLTF(MOON_PATH);

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload(MOON_PATH);