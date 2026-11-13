import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MoonModel from "../../components/3d/MoonModel";

interface MoonCanvasProps {
  className?: string;
  interactive?: boolean;
}

export default function MoonCanvas({
  className = "",
  interactive = true,
}: MoonCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 38, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      className={className}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[-4, 3, 5]} intensity={2.5} />
      <directionalLight position={[4, -2, 3]} intensity={0.35} />
      <MoonModel />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={interactive}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.45}
      />
    </Canvas>
  );
}
