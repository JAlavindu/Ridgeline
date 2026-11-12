import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MoonModel from "../3d/MoonModel";

export default function MoonHero() {
  return (
    <div className="moon-scene">
      <Canvas
        camera={{
          position: [0, 0, 4.8],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        {/* Soft overall light */}
        <ambientLight intensity={1.1} />

        {/* Main moon light */}
        <directionalLight
          position={[-4, 3, 5]}
          intensity={2.4}
        />

        {/* Soft fill light */}
        <directionalLight
          position={[4, -2, 3]}
          intensity={0.35}
        />

        {/* Moon */}
        <MoonModel />

        {/* User-controlled rotation */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.06}
          rotateSpeed={0.45}
        />
      </Canvas>

      {/* Interaction hint */}
      <div className="moon-drag-hint">
        <span className="drag-icon">↻</span>
        <span>Drag to rotate</span>
      </div>
    </div>
  );
}