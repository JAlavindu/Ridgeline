import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MoonModel from "../3d/MoonModel";

export default function MoonHero() {
  return (
    <div className="moon-hero">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 35,
        }}
      >
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={3}
        />

        <MoonModel />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}