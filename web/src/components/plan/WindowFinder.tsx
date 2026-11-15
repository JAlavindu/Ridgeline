import { useEffect, useState } from "react";

import { slipScan, type SlipPoint, type Viability } from "../../engine";
import { useEphemeris } from "../../hooks/useEngine";
import type { ScenarioResult } from "../../hooks/useScenario";
import { formatDuration, utcInputToIso } from "../../lib/format";
import { earthOptionsOf, useSettings } from "../../lib/settings";

const DAYS = 365;
const CHUNK = 30; // a year takes about 0.25 s on a laptop; chunks keep slow phones responsive

interface Props {
  result: ScenarioResult;
  startUtc: string;
  missionDays: number;
  viability: Viability;
  onUseDate: (startUtc: string) => void;
}

/** Every start date in the next year, marked when the mission meets the user's rule. */
export default function WindowFinder({ result, startUtc, missionDays, viability, onUseDate }: Props) {
  const { eph } = useEphemeris();
  const { settings } = useSettings();
  const key = [result.startTdb, result.obs.lat_deg, result.obs.lon_deg, result.horizon.elev_deg.length, missionDays,
    viability.min_sunlight_percent, viability.max_night_hours, settings.earthRule, settings.earthMarginDeg, settings.mastM].join("|");
  const [scan, setScan] = useState<{ key: string; points: SlipPoint[]; done: number } | null>(null);

  useEffect(() => {
    if (!eph) return;
    let cancelled = false;
    let points: SlipPoint[] = [];
    const run = (from: number) => {
      if (cancelled) return;
      const slips = Array.from({ length: Math.min(CHUNK, DAYS - from) }, (_, i) => from + i);
      points = points.concat(
        slipScan(eph, result.obs, result.horizon, result.startTdb, missionDays * 24, slips, viability, earthOptionsOf(settings)),
      );
      const done = from + slips.length;
      setScan({ key, points, done });
      if (done < DAYS) setTimeout(() => run(done), 0);
    };
    const first = setTimeout(() => run(0), 0);
    return () => {
      cancelled = true;
      clearTimeout(first);
    };
  }, [eph, key, result.obs, result.horizon, result.startTdb, missionDays, viability, settings]);

  const current = scan?.key === key ? scan : null;
  const points = current?.points ?? [];
  const byDate = new Map(points.map((p) => [p.target_date, p]));
  const viable = points.filter((p) => p.is_viable);
  const timeOfDay = startUtc.slice(11, 16);

  // months covered by the scan, each listed day by day
  const startMs = Date.parse(utcInputToIso(startUtc));
  const months: { label: string; days: string[] }[] = [];
  for (let d = 0; d < DAYS; d++) {
    const date = new Date(startMs + d * 86_400_000).toISOString().slice(0, 10);
    const label = new Date(date + "T00:00:00Z").toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    if (months.length === 0 || months[months.length - 1].label !== label) months.push({ label, days: [] });
    months[months.length - 1].days.push(date);
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[16px] font-medium text-white">When could you land?</h3>
        <p className="text-[13px] text-white/40">
          {current && current.done < DAYS
            ? `Checking ${current.done} of ${DAYS} start dates…`
            : current
              ? `${viable.length} of ${points.length} start dates in the next year meet your rule`
              : "Checking start dates…"}
        </p>
      </div>
      <p className="mt-1 text-[13px] text-white/40">
        Rule: Sun up at least {viability.min_sunlight_percent}% and no night longer than {viability.max_night_hours} h, for a{" "}
        {missionDays}-day mission starting at {timeOfDay} UTC. Click a day to use it.
      </p>

      <div className="mt-4 space-y-1.5">
        {months.map((m) => (
          <div key={m.label} className="grid grid-cols-[64px_1fr] items-center gap-2">
            <span className="text-[13px] tabular-nums text-white/45">{m.label}</span>
            <div className="flex flex-wrap gap-[3px]">
              {m.days.map((date) => {
                const p = byDate.get(date);
                const title = p
                  ? `${date}: Sun up ${p.sunlight_percent.toFixed(0)}%, longest night ${formatDuration(p.longest_night_hours)}, power and contact ${p.combined_percent.toFixed(0)}%`
                  : `${date}: ${current && current.done >= DAYS ? "outside 2023–2032" : "checking…"}`;
                return (
                  <button
                    key={date}
                    type="button"
                    title={title}
                    aria-label={title}
                    disabled={!p}
                    onClick={() => p && onUseDate(`${date}T${timeOfDay}`)}
                    className={`h-3.5 w-3.5 rounded-[2px] transition hover:outline hover:outline-1 hover:outline-white ${
                      !p ? "bg-white/[0.04]" : p.is_viable ? "bg-white/85" : "bg-white/[0.12]"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-white/40">
        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-white/85 align-middle" />meets your rule
        <span className="ml-4 mr-1 inline-block h-2.5 w-2.5 rounded-[2px] bg-white/[0.12] align-middle" />does not
        {viable[0] && <span className="ml-4 text-white/60">First: {viable[0].target_date}</span>}
      </p>
    </div>
  );
}
