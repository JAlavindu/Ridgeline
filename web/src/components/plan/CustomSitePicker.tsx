import { lazy, Suspense, useEffect, useState, type MouseEvent } from "react";

import { lunarSites } from "../../data/lunarSites";
import { fromMap, toMap } from "../../lib/polarMap";
import { formatPoint, inTerrainZone } from "../../lib/terrainZone";

// three.js loads only when someone opens the 3D view, so the Plan page stays light
const MoonPointGlobe = lazy(() => import("./MoonPointGlobe"));

const IMG = import.meta.env.BASE_URL + "data/hillshade_polar.png";
const POLAR_SITES = lunarSites.filter((s) => s.latitude !== null && s.longitude !== null && s.latitude < -75);
const CAP = "#ff8a3d";

type View = "globe" | "map";

interface Props {
  initial: { lat: number; lon: number } | null;
  onUse: (lat: number, lon: number) => void;
  onCancel: () => void;
}

/** A modal to choose any point on the Moon, with the terrain limit shown before and explained after a click. */
export default function CustomSitePicker({ initial, onUse, onCancel }: Props) {
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(initial);
  const [view, setView] = useState<View>("globe");
  const lat = point?.lat ?? NaN;
  const lon = point?.lon ?? NaN;
  const valid = point !== null && lat >= -90 && lat <= 90 && Number.isFinite(lon);
  const inside = valid && inTerrainZone(lat);

  // Escape closes; the page behind does not scroll while the modal is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onCancel]);

  const setNumber = (key: "lat" | "lon", text: string) => {
    const v = Number(text);
    setPoint((p) => ({ lat: p?.lat ?? -86, lon: p?.lon ?? 0, [key]: v }));
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-[980px] flex-col overflow-y-auto rounded-[16px] border border-white/[0.1] bg-[#0a0a0a] text-white shadow-2xl"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div>
            <h2 id="picker-title" className="text-[18px] font-medium">Choose a landing point</h2>
            <p className="mt-1 text-[13.5px] leading-[1.6] text-white/55">
              Click anywhere on the Moon. Real terrain exists only near the south pole, shaded orange.
            </p>
          </div>
          <button type="button" autoFocus onClick={onCancel} aria-label="Close" className="text-[22px] leading-none text-white/50 hover:text-white">
            ×
          </button>
        </div>

        {/* view switch */}
        <div className="flex gap-5 px-5 pt-3 sm:px-6" role="tablist">
          {(["globe", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`border-b-2 pb-1.5 text-[14px] transition ${view === v ? "border-[#ff3b12] text-white" : "border-transparent text-white/50 hover:text-white"}`}
            >
              {v === "globe" ? "3D Moon" : "South pole map (precise)"}
            </button>
          ))}
        </div>

        {/* the picker */}
        <div className="px-5 pt-3 sm:px-6">
          {view === "globe" ? (
            <div className="h-[min(56vh,500px)] w-full overflow-hidden rounded-[12px] border border-white/[0.08] bg-black">
              <Suspense fallback={<p className="p-4 text-[13px] text-white/45">Loading the Moon…</p>}>
                <MoonPointGlobe point={valid ? point : null} onPick={(la, lo) => setPoint({ lat: la, lon: lo })} />
              </Suspense>
            </div>
          ) : (
            <>
              <PolarMap point={valid ? point : null} onPick={(la, lo) => setPoint({ lat: la, lon: lo })} />
              <PolarMapCaption />
            </>
          )}

          {/* legend: always visible, so the limit is clear before anyone clicks */}
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-white/60">
            <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm align-[-1px]" style={{ background: CAP, opacity: 0.8 }} />Real terrain (75° S to the pole)</span>
            <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-white/25 align-[-1px]" />Smooth Moon (no hills)</span>
          </p>
        </div>

        {/* the chosen point and what it means */}
        <div className="mt-4 border-t border-white/[0.08] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block text-[12.5px] text-white/50">
              Latitude (° N, south is negative)
              <input
                type="number" step="0.0001" min={-90} max={90}
                value={Number.isFinite(lat) ? lat : ""}
                onChange={(e) => setNumber("lat", e.target.value)}
                className="mt-1 block h-11 w-[170px] rounded-md border border-white/[0.12] bg-white/[0.03] px-3 text-[15px] tabular-nums text-white outline-none focus:border-white/35"
              />
            </label>
            <label className="block text-[12.5px] text-white/50">
              Longitude (° E)
              <input
                type="number" step="0.0001" min={-180} max={360}
                value={Number.isFinite(lon) ? lon : ""}
                onChange={(e) => setNumber("lon", e.target.value)}
                className="mt-1 block h-11 w-[170px] rounded-md border border-white/[0.12] bg-white/[0.03] px-3 text-[15px] tabular-nums text-white outline-none focus:border-white/35"
              />
            </label>
            {valid && <p className="pb-3 text-[14px] tabular-nums text-white/75">{formatPoint(lat, lon)}</p>}
          </div>

          <div aria-live="polite" className="mt-3">
            {!valid ? (
              <p className="text-[14px] text-white/50">No point chosen yet. Click the Moon or type a latitude and longitude.</p>
            ) : inside ? (
              <p className="border-l-2 border-emerald-400/70 pl-3 text-[14px] leading-[1.65] text-white/80">
                <b className="font-medium text-white">Good choice.</b> We have NASA terrain here, so hills and shadows are
                included. It is approximate (500 m terrain), so near the pole times are shown as windows.
              </p>
            ) : (
              <div className="border-l-2 border-amber-400/80 pl-3 text-[14px] leading-[1.65] text-white/80">
                <p>
                  <b className="font-medium text-white">No terrain data here.</b> This spot is treated as a perfectly smooth
                  Moon, with no hills. The Sun and Earth positions are still exact, but sunlight and contact times ignore
                  hills and may be wrong.
                </p>
                <button type="button" onClick={() => setView("map")} className="mt-1.5 text-[14px] text-[#ffb27d] underline-offset-4 hover:underline">
                  Pick a spot in the terrain zone instead
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="h-11 rounded-md px-4 text-[14px] text-white/60 hover:text-white">
              Cancel
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => valid && onUse(lat, lon)}
              className="h-11 rounded-md bg-white px-5 text-[14px] font-medium text-black transition hover:bg-white/85 disabled:bg-white/20"
            >
              Use this point
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The flat south pole map: precise picking inside the terrain zone. Outside the 75 deg S ring is dimmed. */
function PolarMap({ point, onPick }: { point: { lat: number; lon: number } | null; onPick: (lat: number, lon: number) => void }) {
  const marker = point ? toMap(point.lat, point.lon) : null;
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const p = fromMap((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
    onPick(Number(p.lat.toFixed(4)), Number(p.lon.toFixed(4)));
  };

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="South polar map: click to choose a point"
      onClick={onClick}
      className="relative mx-auto aspect-square w-full max-w-[min(56vh,500px)] cursor-crosshair overflow-hidden rounded-[12px] border border-white/[0.08] bg-black"
    >
      <img src={IMG} alt="" className="absolute inset-0 h-full w-full select-none opacity-90" draggable={false} />
      {/* the map's edge is 75 deg S, so the terrain zone is the inscribed circle; the corners are dimmed */}
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
        <path d="M0 0H100V100H0Z M50 0A50 50 0 1 0 50 100A50 50 0 1 0 50 0Z" fill="#000" fillOpacity="0.55" fillRule="evenodd" />
        <circle cx="50" cy="50" r="49.7" fill="none" stroke={CAP} strokeWidth="0.5" />
      </svg>
      {POLAR_SITES.map((s) => {
        const p = toMap(s.latitude!, s.longitude!);
        return p ? (
          <span
            key={s.id}
            title={s.name}
            className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
            style={{ left: `${p.fx * 100}%`, top: `${p.fy * 100}%` }}
          />
        ) : null;
      })}
      {marker && (
        <span
          className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff3b12]"
          style={{ left: `${marker.fx * 100}%`, top: `${marker.fy * 100}%` }}
        />
      )}
    </div>
  );
}

function PolarMapCaption() {
  return (
    <p className="mx-auto mt-2 max-w-[min(56vh,500px)] text-center text-[12.5px] text-white/50">
      South pole in the centre · 0° E at the top · white dots: our sites · dimmed corners: smooth Moon
    </p>
  );
}
