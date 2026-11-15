import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import MoonModel from "../3d/MoonModel";
import type { LunarSite } from "../../data/lunarSites";
import type { ScenarioState } from "../../hooks/useScenario";
import { METRICS } from "../plan/metrics";

interface CompareSiteCardProps {
  site: LunarSite | null;
  index: number;
  sites: LunarSite[];
  availableSites: LunarSite[];
  state?: ScenarioState;
  best: Record<string, Set<string>>;
  cardId: string;
  customLabel?: string;
  customLat?: number;
  customLon?: number;
  onRemove: () => void;
  onChange: (siteId: string) => void;
  onCustom: () => void;
  onSelect: () => void;
}

function formatCoordinate(
  value: number | null | undefined,
  positive: string,
  negative: string,
) {
  if (value === null || value === undefined) {
    return null;
  }

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
    <div className="relative min-h-[92px] border-b border-white/[0.08] p-4 last:border-b-0">
      {best && (
        <span className="absolute right-3 top-3 text-[9px] uppercase tracking-[0.8px] text-[#E2791D]">
          Best
        </span>
      )}

      <div className="flex items-center gap-2 text-[11px] text-white/35">
        <span className="text-sm text-white/45">
          {icon}
        </span>

        <span>{label}</span>
      </div>

      <div
        className={`mt-3 text-[17px] font-medium ${
          best
            ? "text-[#E2791D]"
            : "text-white/80"
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
  customLabel,
  customLat,
  customLon,
  onRemove,
  onChange,
  onCustom,
  onSelect,
}: CompareSiteCardProps) {
  const ready =
    state?.status === "ready";

  const result =
    ready ? state.result : null;

  const latitude = formatCoordinate(
    site?.latitude ?? customLat,
    "N",
    "S",
  );

  const longitude = formatCoordinate(
    site?.longitude ?? customLon,
    "E",
    "W",
  );

  const coordinate =
    latitude && longitude
      ? `${latitude} · ${longitude}`
      : "Coordinates unavailable";

  const displayName =
    customLabel ??
    site?.name ??
    "Custom location";

  const metric = (key: string) => {
    if (!result) return "—";

    const item = METRICS.find(
      (m) => m.key === key,
    );

    if (!item) return "—";

    return item.format(
      item.value(result),
      result,
    );
  };

  const isBest = (key: string) =>
    best[key]?.has(cardId) ?? false;

  return (
    <article
      onClick={onSelect}
      className="group relative flex min-h-[680px] cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#080808] p-6 transition-all duration-300 hover:border-white/[0.2]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[2px] text-white/35">
          Site{" "}
          {String.fromCharCode(
            65 + index,
          )}
        </span>

        {index === 0 && (
          <span className="rounded-full border border-[#E2791D]/40 bg-[#E2791D]/[0.08] px-4 py-1.5 text-[9px] uppercase tracking-[1.5px] text-[#E2791D]">
            Selected
          </span>
        )}
      </div>

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
            selectedSite={
              site ?? null
            }
            focusedSite={
              site ?? null
            }
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

      <div className="mt-1">
        <h2 className="text-[24px] font-semibold tracking-[-0.5px] text-white">
          {displayName}
        </h2>

        <p className="mt-2 text-sm text-white/40">
          {coordinate}
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[18px] border border-white/[0.12]">
        <div className="grid grid-cols-2">
          <Metric
            icon="☼"
            label="Sunlight"
            value={metric("sun_up")}
            best={isBest("sun_up")}
          />

          <Metric
            icon="◉"
            label="Earth view"
            value={metric("earth")}
            best={isBest("earth")}
          />

          <Metric
            icon="ϟ"
            label="Power"
            value={metric("both")}
            best={isBest("both")}
          />

          <Metric
            icon="⌁"
            label="Comms"
            value={metric("gap")}
            best={isBest("gap")}
          />
        </div>
      </div>

      {ready && (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[1px] text-white/25">
              Average sunlight
            </p>

            <p className="mt-1 text-sm text-white/70">
              {metric("avg_sun")}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[1px] text-white/25">
              Longest night
            </p>

            <p className="mt-1 text-sm text-white/70">
              {metric("night")}
            </p>
          </div>
        </div>
      )}

      {!ready && (
        <p className="mt-6 text-xs text-white/30">
          {state?.status === "error"
            ? state.message
            : "Working out the sky…"}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-7">
        <div>
          <p className="text-[11px] text-white/30">
            Mission fit
          </p>

          <p className="mt-1 text-[15px] font-medium text-white/80">
            {ready
              ? "Calculated"
              : "Calculating…"}
          </p>
        </div>

        <details
          onClick={(event) =>
            event.stopPropagation()
          }
          className="relative"
        >
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/[0.12] text-white/40 transition hover:border-white/25 hover:text-white/80">
            <span className="text-lg leading-none">
              ···
            </span>
          </summary>

          <div className="absolute bottom-12 right-0 z-50 w-52 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#111] p-1 shadow-2xl">
            <div className="px-3 py-2 text-[10px] uppercase tracking-[1.5px] text-white/25">
              Change site
            </div>

            {availableSites
              .filter(
                (availableSite) =>
                  !sites.some(
                    (selectedSite) =>
                      selectedSite.id ===
                      availableSite.id,
                  ),
              )
              .map(
                (availableSite) => (
                  <button
                    key={
                      availableSite.id
                    }
                    type="button"
                    onClick={() =>
                      onChange(
                        availableSite.id,
                      )
                    }
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {availableSite.name}
                  </button>
                ),
              )}

            <button
              type="button"
              onClick={onCustom}
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
            >
              Custom coordinates…
            </button>

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
    </article>
  );
}