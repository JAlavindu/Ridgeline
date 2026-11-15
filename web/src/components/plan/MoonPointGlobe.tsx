import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, CanvasTexture, Group, PerspectiveCamera, SRGBColorSpace, Vector3 } from "three";

import MoonModel from "../3d/MoonModel";
import { formatPoint, inTerrainZone, TERRAIN_ZONE_LAT_DEG } from "../../lib/terrainZone";

const MOON_PATH = "/model/moon.glb";
const MODEL_SCALE = 1.35;          // the scale MoonModel draws the GLB at
const TILT_RAD = -1.05;            // tip the south pole toward the viewer (about 60 deg), so the cap is not squashed at the edge
const SPIN_SPEED = 0.18;           // radians per second, around the Moon's own axis
const CAP_COLOR = "#ff8a3d";
const RAD = Math.PI / 180;
const BASE_DISTANCE = 5;           // camera distance on a wide frame
const APPROX_RADIUS = 1.4;         // the drawn Moon's radius in scene units (measured), used only to frame it

/** Same mapping MoonModel uses for its site markers: +Y is north, longitude 0 faces +Z. */
function toLocal(latDeg: number, lonDeg: number, r: number): [number, number, number] {
  const lat = latDeg * RAD;
  const lon = lonDeg * RAD;
  return [r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon)];
}

/** The inverse: a point in the Moon's own frame -> latitude and longitude (0-360 E). */
function fromLocal(p: Vector3): { lat: number; lon: number } {
  const u = p.clone().normalize();
  const lat = Math.asin(Math.max(-1, Math.min(1, u.y))) / RAD;
  const lon = ((Math.atan2(u.x, u.z) / RAD) % 360 + 360) % 360;
  return { lat, lon };
}

interface Hover {
  lat: number;
  lon: number;
  x: number;
  y: number;
}

interface SceneProps {
  point: { lat: number; lon: number } | null;
  spinning: boolean;
  onStopSpin: () => void;
  onHover: (h: Hover | null) => void;
  onPick: (lat: number, lon: number) => void;
}

function Scene({ point, spinning, onStopSpin, onHover, onPick }: SceneProps) {
  const { scene } = useGLTF(MOON_PATH);
  const spin = useRef<Group>(null);

  // radius of the drawn Moon, so the cap and the pin sit just on its surface
  const radius = useMemo(() => {
    const size = new Box3().setFromObject(scene).getSize(new Vector3());
    return (Math.max(size.x, size.y, size.z) / 2) * MODEL_SCALE;
  }, [scene]);

  const ring = useMemo(
    () => Array.from({ length: 121 }, (_, i) => toLocal(TERRAIN_ZONE_LAT_DEG, i * 3, radius * 1.006)),
    [radius],
  );

  // "Real terrain here", drawn once into a texture. A sprite (not an HTML overlay) is hidden by the Moon
  // when the pole turns away, and unmounts cleanly with the modal.
  const label = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.beginPath();
      ctx.roundRect(8, 24, 496, 80, 40);
      ctx.fill();
      ctx.fillStyle = "#ffb27d";
      ctx.font = "500 44px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Real terrain here", 256, 66);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => label.dispose(), [label]);

  useFrame((_, delta) => {
    if (spinning && spin.current) spin.current.rotation.y += delta * SPIN_SPEED;
  });

  const pointOf = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
    spin.current ? fromLocal(spin.current.worldToLocal(e.point.clone())) : null;

  return (
    <group rotation={[TILT_RAD, 0, 0]}>
      <group ref={spin}>
        <group
          onPointerMove={(e) => {
            e.stopPropagation();
            const p = pointOf(e);
            if (p) onHover({ ...p, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
          }}
          onPointerOver={() => onStopSpin()}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            if (e.delta > 4) return; // the end of a drag, not a click
            const p = pointOf(e);
            if (p) onPick(Number(p.lat.toFixed(4)), Number(p.lon.toFixed(4)));
          }}
        >
          <MoonModel autoRotationSpeed={0} />

          {/* the real-terrain zone: a soft cap from 75 deg S to the pole */}
          <mesh>
            {/* three.js measures theta from the north pole: 75 deg S is theta 165 deg, and the cap is 15 deg tall */}
            <sphereGeometry args={[radius * 1.004, 96, 12, 0, Math.PI * 2, (90 - TERRAIN_ZONE_LAT_DEG) * RAD, (90 + TERRAIN_ZONE_LAT_DEG) * RAD]} />
            <meshBasicMaterial color={CAP_COLOR} transparent opacity={0.3} depthWrite={false} />
          </mesh>
        </group>

        <Line points={ring} color={CAP_COLOR} lineWidth={1.6} transparent opacity={0.9} />

        <sprite position={toLocal(-90, 0, radius * 1.03)} scale={[0.88, 0.22, 1]} renderOrder={2}>
          <spriteMaterial map={label} transparent depthTest depthWrite={false} />
        </sprite>

        {point && (
          <mesh position={toLocal(point.lat, point.lon, radius * 1.012)}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color="#ff3b12" />
          </mesh>
        )}
      </group>
    </group>
  );
}

/**
 * Keep the whole Moon in view in a tall, narrow frame (phones). The field of view is vertical, so a narrow
 * frame crops the sides; move the camera back until the Moon's width fits, with a little margin.
 */
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const halfTan = Math.tan(((camera as PerspectiveCamera).fov * RAD) / 2);
    const needed = (1.3 * APPROX_RADIUS) / (halfTan * aspect);
    camera.position.setLength(Math.max(BASE_DISTANCE, needed));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

interface Props {
  point: { lat: number; lon: number } | null;
  onPick: (lat: number, lon: number) => void;
}

/** A 3D Moon to pick a landing point on. It spins until the user reaches for it. */
export default function MoonPointGlobe({ point, onPick }: Props) {
  const [spinning, setSpinning] = useState(true);
  const [hover, setHover] = useState<Hover | null>(null);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} className="!h-full !w-full touch-none">
        <ambientLight intensity={1.1} />
        <directionalLight position={[-4, 3, 5]} intensity={2.5} />
        <directionalLight position={[4, -2, 3]} intensity={0.35} />
        <FitCamera />
        <Suspense fallback={null}>
          <Scene
            point={point}
            spinning={spinning}
            onStopSpin={() => setSpinning(false)}
            onHover={setHover}
            onPick={(lat, lon) => {
              setSpinning(false);
              onPick(lat, lon);
            }}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.55}
          minDistance={3.4}
          maxDistance={10}
          onStart={() => setSpinning(false)}
        />
      </Canvas>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-black/85 px-2.5 py-1.5 text-[12.5px] tabular-nums text-white shadow-lg"
          style={{ left: hover.x, top: hover.y + 18 }}
        >
          {formatPoint(hover.lat, hover.lon)}
          <span className={inTerrainZone(hover.lat) ? "text-[#ffb27d]" : "text-white/55"}>
            {inTerrainZone(hover.lat) ? " · Real terrain (approximate)" : " · No terrain data · smooth Moon"}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
        {spinning ? (
          <span className="rounded-full bg-black/60 px-3 py-1 text-[12px] text-white/60">
            Point at the Moon to stop it · drag to turn · scroll to zoom
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setSpinning(true)}
            className="pointer-events-auto rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[12px] text-white/70 hover:text-white"
          >
            Resume spin
          </button>
        )}
      </div>
    </div>
  );
}
