import { useMemo, useState } from "react";

import { DEFAULT_VIABILITY, slipScan, type SlipPoint, type Viability } from "../../engine";
import { useEphemeris } from "../../hooks/useEngine";
import type { ScenarioResult } from "../../hooks/useScenario";
import { formatDuration, utcInputToIso } from "../../lib/format";
import { earthOptionsOf, useSettings } from "../../lib/settings";

const SLIPS = Array.from({ length: 121 }, (_, i) => i - 60);
const W = 640;
const H = 190;
const PAD = { l: 34, r: 40, t: 10, b: 26 };

interface Props {
  result: ScenarioResult;
  startUtc: string;
  missionDays: number;
  viability: Viability;
  onViability: (v: Viability) => void;
  onUseDate: (startUtc: string) => void;
}

/** "Launch slipped N days: is the site still viable?" Mission summary for every start date within ±60 days. */
export default function SlipChart({ result, startUtc, missionDays, viability, onViability, onUseDate }: Props) {
  const { eph } = useEphemeris();
  const { settings } = useSettings();
  const [slip, setSlip] = useState(0);

  const points: SlipPoint[] = useMemo(() => {
    if (!eph) return [];
    return slipScan(eph, result.obs, result.horizon, result.startTdb, missionDays * 24, SLIPS, viability, earthOptionsOf(settings));
  }, [eph, result.obs, result.horizon, result.startTdb, missionDays, viability, settings]);

  if (points.length === 0) return <p className="mt-3 text-[13px] text-white/40">Scanning launch dates…</p>;

  const maxNight = Math.max(24, Math.ceil(Math.max(...points.map((p) => p.longest_night_hours)) / 24) * 24);
  const x = (d: number) => PAD.l + ((d + 60) / 120) * (W - PAD.l - PAD.r);
  const yPct = (v: number) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);
  const yNight = (h: number) => PAD.t + (1 - h / maxNight) * (H - PAD.t - PAD.b);
  const line = (f: (p: SlipPoint) => number) => points.map((p, i) => `${i ? "L" : "M"}${x(p.slip_days).toFixed(1)} ${f(p).toFixed(1)}`).join(" ");

  const current = points.find((p) => p.slip_days === slip);
  const useDate = () => {
    const ms = Date.parse(utcInputToIso(startUtc)) + slip * 86_400_000;
    onUseDate(new Date(ms).toISOString().slice(0, 16));
    setSlip(0);
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[16px] font-medium text-white">If the launch slips</h3>
        <p className="text-[13px] text-white/40">Same site and mission length, start moved by up to 60 days (hourly samples)</p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sunlight and longest night for each start date within 60 days" className="mt-3 block h-auto w-full">
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yPct(v)} y2={yPct(v)} stroke="#fff" strokeOpacity={v === 0 ? 0.2 : 0.06} />
            <text x={PAD.l - 6} y={yPct(v) + 3} textAnchor="end" fontSize="12" fill="#fff" fillOpacity="0.4">{v}%</text>
          </g>
        ))}
        <text x={W - PAD.r + 6} y={yNight(maxNight) + 3} fontSize="12" fill="#fff" fillOpacity="0.4">{maxNight} h</text>
        <text x={W - PAD.r + 6} y={yNight(0) + 3} fontSize="12" fill="#fff" fillOpacity="0.4">0 h</text>
        {[-60, -30, 0, 30, 60].map((d) => (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="12" fill="#fff" fillOpacity="0.4">
            {d > 0 ? `+${d}` : d} d
          </text>
        ))}

        {points.filter((p) => p.is_viable).map((p) => (
          <rect key={p.slip_days} x={x(p.slip_days) - 1.5} y={H - PAD.b + 2} width="3" height="5" fill="#fff" fillOpacity="0.55" />
        ))}

        <path d={line((p) => yPct(p.sunlight_percent))} fill="none" stroke="#f2c14e" strokeWidth="1.5" />
        <path d={line((p) => yNight(p.longest_night_hours))} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1={x(slip)} x2={x(slip)} y1={PAD.t} y2={H - PAD.b} stroke="#ff3b12" strokeWidth="1.5" />
      </svg>

      <div className="mt-1 flex flex-wrap gap-x-4 text-[13px] text-white/45">
        <span><span className="mr-1 inline-block h-[2px] w-3 bg-[#f2c14e] align-middle" />Sun up (any part)</span>
        <span><span className="mr-1 inline-block w-3 border-t border-dashed border-white/60 align-middle" />Longest night (right scale)</span>
        <span><span className="mr-1 inline-block h-2 w-[3px] bg-white/55 align-middle" />Meets your rules</span>
      </div>

      <input
        type="range"
        aria-label="Launch slip in days"
        min={-60}
        max={60}
        step={1}
        value={slip}
        onChange={(e) => setSlip(Number(e.target.value))}
        className="mt-4 w-full accent-[#ff3b12]"
      />

      {current ? (
        <dl className="mt-3 grid grid-cols-2 border-t border-white/[0.08] sm:grid-cols-3 lg:grid-cols-6">
          <Cell label="Slip" value={slip === 0 ? "None" : `${slip > 0 ? "+" : ""}${slip} days`} />
          <Cell label="Start" value={current.target_date} />
          <Cell label="Sun up" value={`${current.sunlight_percent.toFixed(0)}%`} />
          <Cell label="Longest night" value={formatDuration(current.longest_night_hours)} />
          <Cell label="Power and contact" value={`${current.combined_percent.toFixed(0)}%`} />
          <Cell label="Meets your rules" value={current.is_viable ? "Yes" : "No"} />
        </dl>
      ) : (
        <p className="mt-3 text-[13px] text-white/45">That date is outside 2023–2032.</p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <label className="text-[13px] text-white/45">
          Rule: Sun up at least
          <input
            type="number" min={0} max={100} value={viability.min_sunlight_percent}
            onChange={(e) => onViability({ ...viability, min_sunlight_percent: Number(e.target.value) })}
            className="ml-2 h-11 w-16 rounded-md border border-white/[0.12] bg-white/[0.03] px-2 text-[15px] tabular-nums text-white"
          />{" "}%
        </label>
        <label className="text-[13px] text-white/45">
          and no night longer than
          <input
            type="number" min={0} max={720} value={viability.max_night_hours}
            onChange={(e) => onViability({ ...viability, max_night_hours: Number(e.target.value) })}
            className="ml-2 h-11 w-16 rounded-md border border-white/[0.12] bg-white/[0.03] px-2 text-[15px] tabular-nums text-white"
          />{" "}h
        </label>
        <button
          type="button"
          disabled={slip === 0 || !current}
          onClick={useDate}
          className="h-11 rounded-md bg-white px-4 text-[14px] font-medium text-black transition hover:bg-white/85 disabled:bg-white/20 disabled:text-white/40"
        >
          Use this date
        </button>
        {(viability.min_sunlight_percent !== DEFAULT_VIABILITY.min_sunlight_percent ||
          viability.max_night_hours !== DEFAULT_VIABILITY.max_night_hours) && (
          <button type="button" onClick={() => onViability(DEFAULT_VIABILITY)} className="text-[13px] text-white/45 hover:text-white">
            Reset rule
          </button>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/[0.08] py-2.5 pr-3">
      <dt className="text-[13px] text-white/45">{label}</dt>
      <dd className="mt-0.5 text-[16px] tabular-nums text-white">{value}</dd>
    </div>
  );
}
