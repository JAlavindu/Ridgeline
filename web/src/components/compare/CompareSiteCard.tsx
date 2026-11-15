import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import MoonModel from "../3d/MoonModel";
import type { LunarSite } from "../../data/lunarSites";
import type { ScenarioState } from "../../hooks/useScenario";
import { METRICS } from "../plan/metrics";

interface CompareSiteCardProps {
  site: LunarSite;
  index: number;
  sites: LunarSite[];
  availableSites: LunarSite[];
  state: ScenarioState;
  best: Record<string, Set<string>>;
  cardId: string;
  onRemove: () => void;
  onChange: (siteId: string) => void;
}

function formatCoordinate(
  value: number | null,
  positive: string,
  negative: string,
) {
  if (value === null) return null;

  return `${Math.abs(value).toFixed(1)}° ${
    value >= 0 ? positive : negative
  }`;
}

function Metric({
  icon,
  label,
  value,
  best,
}: {
  icon: string;
  label: string;
  value: string;
  best?: boolean;
}) {
  return (
    <div className="relative min-h-[92px] border-b border-white/[0.08] p-4">
      {best && (
        <span className="absolute right-3 top-3 text-[9px] uppercase tracking-[0.8px] text-[#E2791D]">
          Best
        </span>
      )}

      <div className="flex items-center gap-2 text-[11px] text-white/35">
        <span className="text-sm text-white/45">{icon}</span>
        <span>{label}</span>
      </div>

      <div
        className={`mt-3 text-[17px] font-medium ${
          best ? "text-[#E2791D]" : "text-white/80"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function CompareSiteCard({
  site,
  index,
  sites,
  availableSites,
  state,
  best,
  cardId,
  onRemove,
  onChange,
}: CompareSiteCardProps) {
  const latitude = formatCoordinate(site.latitude, "N", "S");
  const longitude = formatCoordinate(site.longitude, "E", "W");

  const coordinate =
    latitude && longitude
      ? `${latitude} · ${longitude}`
      : "Coordinates unavailable";

  const result =
    state.status === "ready" ? state.result : null;

  const getMetric = (key: string) => {
    if (!result) return "—";

    const metric = METRICS.find((item) => item.key === key);

    if (!metric) return "—";

    return metric.format(metric.value(result), result);
  };

  const isBest = (key: string) => {
    return best[key]?.has(cardId) ?? false;
  };

  return (
    <article className="group relative flex min-h-[680px] flex-col overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#080808] p-6 transition-all duration-300 hover:border-white/[0.2]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[2px] text-white/35">
          Site {String.fromCharCode(65 + index)}
        </span>

        {index === 0 && (
          <span className="rounded-full border border-[#E2791D]/40 bg-[#E2791D]/[0.08] px-4 py-1.5 text-[9px] uppercase tracking-[1.5px] text-[#E2791D]">
            Selected
          </span>
        )}
      </div>

      {/* 3D Moon */}
      <div className="relative mx-auto mt-6 h-[300px] w-full">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.018]" />

        <Canvas
          camera={{
            position: [0, 0, 5],
            fov: 38,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
          }}
          className="!h-full !w-full"
        >
          <ambientLight intensity={1.1} />

          <directionalLight
            position={[-4, 3, 5]}
            intensity={2.5}
          />

          <directionalLight
            position={[4, -2, 3]}
            intensity={0.35}
          />

          <MoonModel
            sites={sites}
            selectionMode={false}
            selectedSite={site}
            focusedSite={site}
            historyMode={false}
            isInteracting={false}
            autoRotationSpeed={0.08}
            onSelectSite={() => undefined}
          />

          <OrbitControls
            enableZoom
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.55}
            minDistance={4.2}
            maxDistance={7}
          />
        </Canvas>
      </div>

      {/* Site information */}
      <div className="mt-1">
        <h2 className="text-[24px] font-semibold tracking-[-0.5px] text-white">
          {site.name}
        </h2>

        <p className="mt-2 text-sm text-white/40">
          {coordinate}
        </p>
      </div>

      {/* Metrics */}
      <div className="mt-8 overflow-hidden rounded-[18px] border border-white/[0.12]">
        <div className="grid grid-cols-2">
          <Metric
            icon="☼"
            label="Sunlight"
            value={getMetric("sun_up")}
            best={isBest("sun_up")}
          />

          <Metric
            icon="◉"
            label="Earth view"
            value={getMetric("earth")}
            best={isBest("earth")}
          />

          <Metric
            icon="ϟ"
            label="Power"
            value={getMetric("panel")}
            best={isBest("panel")}
          />

          <Metric
            icon="⌁"
            label="Comms"
            value={getMetric("gap")}
            best={isBest("gap")}
          />
        </div>
      </div>

      {/* Mission fit */}
      <div className="mt-auto flex items-center justify-between pt-7">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-white/35">
            Mission fit
          </span>

          <span className="text-[15px] font-medium text-white/80">
            {result ? "Calculated" : "Calculating"}
          </span>
        </div>

        {/* Menu */}
        <div className="relative">
          <details>
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/[0.12] text-white/40 transition hover:border-white/25 hover:text-white/80">
              <span className="text-lg leading-none">···</span>
            </summary>

            <div className="absolute bottom-12 right-0 z-50 w-48 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#111] p-1 shadow-2xl">
              <div className="px-3 py-2 text-[10px] uppercase tracking-[1.5px] text-white/25">
                Change site
              </div>

              {availableSites
                .filter(
                  (availableSite) =>
                    !sites.some(
                      (selectedSite) =>
                        selectedSite.id === availableSite.id,
                    ),
                )
                .map((availableSite) => (
                  <button
                    key={availableSite.id}
                    type="button"
                    onClick={() =>
                      onChange(availableSite.id)
                    }
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {availableSite.name}
                  </button>
                ))}

              {sites.length > 1 && (
                <>
                  <div className="my-1 border-t border-white/[0.08]" />

                  <button
                    type="button"
                    onClick={onRemove}
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-400/70 transition hover:bg-red-500/[0.08] hover:text-red-400"
                  >
                    Remove site
                  </button>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}