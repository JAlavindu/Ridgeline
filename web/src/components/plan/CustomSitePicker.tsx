import { useState, type MouseEvent } from "react";

import { lunarSites } from "../../data/lunarSites";
import { fromMap, toMap } from "../../lib/polarMap";

const IMG = import.meta.env.BASE_URL + "data/hillshade_polar.png";

const POLAR_SITES = lunarSites.filter((s) => s.latitude !== null && s.longitude !== null && s.latitude < -75);

interface Props {
  initial: { lat: number; lon: number } | null;
  onUse: (lat: number, lon: number) => void;
  onCancel: () => void;
}

export default function CustomSitePicker({ initial, onUse, onCancel }: Props) {
  const [lat, setLat] = useState(initial?.lat ?? -86);
  const [lon, setLon] = useState(initial?.lon ?? 90);
  const valid = lat >= -90 && lat <= 90 && Number.isFinite(lon);
  const marker = valid ? toMap(lat, lon) : null;

  const onMapClick = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const p = fromMap((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
    setLat(Number(p.lat.toFixed(4)));
    setLon(Number(p.lon.toFixed(4)));
  };

  return (
    <section aria-label="Custom coordinates" className="rounded-[14px] border border-white/[0.08] bg-[#0a0a0a] p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[13px] font-medium text-white">Custom coordinates</h3>
        <button type="button" onClick={onCancel} className="text-[14px] text-white/50 hover:text-white">Cancel</button>
      </div>
      <p className="mt-1 max-w-[70ch] text-[13px] leading-[1.7] text-white/50">
        Type a point or click the south polar map. Between about 75° S and the pole the horizon is built from NASA
        LOLA terrain at 500 m. It is approximate: compared with our precise sites it can be off by several degrees
        (test V14), so near the pole treat times as rough. Anywhere else a smooth Moon is used.
      </p>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,420px)_1fr]">
        <div
          role="button"
          tabIndex={-1}
          aria-label="South polar map: click to choose a point"
          onClick={onMapClick}
          className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-md border border-white/[0.08] bg-black"
        >
          <img src={IMG} alt="" className="absolute inset-0 h-full w-full select-none opacity-90" draggable={false} />
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
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff3b12]"
              style={{ left: `${marker.fx * 100}%`, top: `${marker.fy * 100}%` }}
            />
          )}
          <span className="pointer-events-none absolute bottom-1.5 left-2 text-[13px] text-white/60">0° E at the top · white dots: library sites</span>
        </div>

        <div className="space-y-3">
          <label className="block text-[13px] text-white/45">
            Latitude (° N, south is negative)
            <input
              type="number" step="0.0001" min={-90} max={90} value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="mt-1 h-11 w-full rounded-md border border-white/[0.12] bg-white/[0.03] px-2 text-[15px] tabular-nums text-white"
            />
          </label>
          <label className="block text-[13px] text-white/45">
            Longitude (° E)
            <input
              type="number" step="0.0001" min={-180} max={360} value={lon}
              onChange={(e) => setLon(Number(e.target.value))}
              className="mt-1 h-11 w-full rounded-md border border-white/[0.12] bg-white/[0.03] px-2 text-[15px] tabular-nums text-white"
            />
          </label>
          <p className="text-[13px] text-white/40">
            {marker ? "Inside the polar terrain map: approximate horizon." : "Outside the polar map: smooth Moon (no hills)."}
          </p>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onUse(lat, lon)}
            className="h-11 rounded-md bg-white px-4 text-[14px] font-medium text-black transition hover:bg-white/85 disabled:bg-white/20"
          >
            Use this point
          </button>
        </div>
      </div>
    </section>
  );
}
