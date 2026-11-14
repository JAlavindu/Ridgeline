import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  isoToTdb,
  loadMask,
  makeObserver,
  outlook,
  sampleSeries,
  summarize,
  type HorizonMask,
  type Series,
} from "../../engine";
import { useEphemeris } from "../../hooks/useEngine";
import { formatDuration } from "../../lib/format";

/*
 * Mission replay: re-runs a real landing through the same engine as the rest of the app,
 * and prints the known facts beside it. It is a plausibility check, not proof: a lander
 * can stop for reasons that have nothing to do with the Sun.
 * Data comes from pipeline/replays.py (web/public/data/replays.json).
 */

const DATA_URL = import.meta.env.BASE_URL + "data/";
const STEP_MIN = 10;

interface Fact { text: string; source: string }
interface ReplaySite { app_id: string; lat: number; lon: number; height_m: number; mask: string }
interface Mission {
  id: string;
  name: string;
  landing_utc: string;
  ops_end_utc?: string;
  ops_end_label?: string;
  window?: { start: string; end: string };
  sites: Record<string, ReplaySite>;
  facts: Fact[];
  offline?: { sun_az_deg: number; sun_el_deg: number; earth_az_deg: number; earth_el_deg: number };
  planned_sun_el_deg?: number;
  planned_earth_el_deg?: number;
}
interface Replays { note: string; missions: Mission[] }

let replaysPromise: Promise<Replays> | null = null;
function loadReplays(): Promise<Replays> {
  replaysPromise ??= fetch(DATA_URL + "replays.json").then((res) => {
    if (!res.ok) throw new Error(`replays.json: ${res.status}`);
    return res.json() as Promise<Replays>;
  });
  return replaysPromise;
}

const maskPromises = new Map<string, Promise<HorizonMask>>();
function loadReplayMask(file: string): Promise<HorizonMask> {
  let promise = maskPromises.get(file);
  if (!promise) {
    promise = loadMask(DATA_URL, file);
    maskPromises.set(file, promise);
  }
  return promise;
}

const stamp = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace("T", " ") + " UTC";

/* =========================================================
   Entry point: shows nothing unless this site has a replay
   ========================================================= */

export default function MissionReplay({ siteId }: { siteId: string }) {
  const [data, setData] = useState<Replays | null>(null);

  useEffect(() => {
    let active = true;
    loadReplays().then(
      (loaded) => active && setData(loaded),
      () => active && setData(null),
    );
    return () => {
      active = false;
    };
  }, []);

  const mission = data?.missions.find((m) => Object.values(m.sites).some((s) => s.app_id === siteId));
  if (!data || !mission) return null;
  return <Replay key={`${mission.id}-${siteId}`} mission={mission} note={data.note} siteId={siteId} />;
}

function Replay({ mission, note, siteId }: { mission: Mission; note: string; siteId: string }) {
  const keys = Object.keys(mission.sites);
  const firstKey = keys.find((k) => mission.sites[k].app_id === siteId) ?? keys[0];
  const [key, setKey] = useState(firstKey);
  const replaySite = mission.sites[key];

  return (
    <section aria-labelledby="replay-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="replay-heading" className="text-[12px] font-medium text-white/50">
          Mission replay
        </h3>
        <span className="text-[11px] text-white/35">Plausibility check, not proof</span>
      </div>
      <p className="mt-2 text-[15px] text-white">{mission.name}</p>

      {keys.length > 1 && (
        <div className="mt-2 flex gap-4" role="group" aria-label="Coordinate set">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === key}
              onClick={() => setKey(k)}
              className={`border-b-2 pb-1 text-[12px] transition ${
                k === key ? "border-[#ff3b12] text-white" : "border-transparent text-white/45 hover:text-white/75"
              }`}
            >
              {k.endsWith("isro") ? "ISRO coordinates" : k.endsWith("lroc") ? "LROC coordinates" : k}
            </button>
          ))}
        </div>
      )}

      {mission.window && mission.offline === undefined ? (
        <LiveReplay mission={mission} site={replaySite} />
      ) : (
        <OfflineReplay mission={mission} />
      )}

      <ul className="mt-4 space-y-2">
        {mission.facts.map((fact) => (
          <li key={fact.text} className="text-[12px] leading-[1.65] text-white/60">
            {fact.text}
            <span className="block text-[11px] text-white/30">
              Source:{" "}
              {fact.source.startsWith("http") ? (
                <a className="underline hover:text-white/60" href={fact.source} target="_blank" rel="noreferrer">
                  {fact.source}
                </a>
              ) : (
                fact.source
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-[1.6] text-white/35">{note}</p>
    </section>
  );
}

/* =========================================================
   Apollo 11: 1969 is outside the ephemeris, so these were computed in Python
   ========================================================= */

function OfflineReplay({ mission }: { mission: Mission }) {
  const o = mission.offline;
  if (!o) return null;
  return (
    <dl className="mt-3 grid grid-cols-2 border-t border-white/[0.08] sm:grid-cols-3">
      <Row label="Sun height" value={`${o.sun_el_deg.toFixed(1)}°`} sub={`planned ${mission.planned_sun_el_deg}°`} />
      <Row label="Sun direction" value={`${o.sun_az_deg.toFixed(1)}°`} sub="east" />
      <Row label="Earth height" value={`${o.earth_el_deg.toFixed(1)}°`} sub={`planned about ${mission.planned_earth_el_deg}°`} />
    </dl>
  );
}

/* =========================================================
   2023-2025 landings: computed live in the browser
   ========================================================= */

function LiveReplay({ mission, site }: { mission: Mission; site: ReplaySite }) {
  const { eph, error } = useEphemeris();
  const [mask, setMask] = useState<{ file: string; mask: HorizonMask | null } | null>(null);

  useEffect(() => {
    let active = true;
    loadReplayMask(site.mask).then(
      (m) => active && setMask({ file: site.mask, mask: m }),
      () => active && setMask({ file: site.mask, mask: null }),
    );
    return () => {
      active = false;
    };
  }, [site.mask]);

  const landingMs = Date.parse(mission.landing_utc);
  const endMs = Date.parse(mission.window!.end);
  const hours = (endMs - landingMs) / 3_600_000;

  const computed = useMemo(() => {
    if (!eph || !mask || mask.file !== site.mask || !mask.mask) return null;
    const obs = makeObserver(site.lat, site.lon, mask.mask.site_height_m ?? 0);
    const tdb0 = isoToTdb(mission.landing_utc);
    const series = sampleSeries(eph, obs, mask.mask, tdb0, hours, STEP_MIN);
    return { tdb0, series, summary: summarize(series), look: outlook(eph, obs, mask.mask, tdb0, hours) };
  }, [eph, mask, site, mission.landing_utc, hours]);

  if (error) return <p className="mt-3 text-[12px] text-white/45">Could not load the ephemeris: {error}</p>;
  if (!computed) return <p className="mt-3 text-[12px] text-white/40">Replaying the landing…</p>;

  const { look, series, summary, tdb0 } = computed;
  const next = look.sun.next && look.sun.next.event === "sunset" ? look.sun.next : null;
  const sunsetEvent = look.sun.events.find((e) => e.kind === "sunset");
  const sunriseEvent = sunsetEvent ? look.sun.events.find((e) => e.kind === "sunrise" && e.tdb > sunsetEvent.tdb) : undefined;

  // Poleward of 75 deg only a window may be shown; elsewhere use the best estimate
  const lossFrom = next
    ? landingMs + (next.window_only ? next.earliest_hours : next.nominal_hours) * 3_600_000
    : sunsetEvent
      ? Date.parse(sunsetEvent.time_utc)
      : null;
  const lossTo = next?.window_only ? landingMs + next.latest_hours * 3_600_000 : lossFrom;
  const opsMs = mission.ops_end_utc ? Date.parse(mission.ops_end_utc) : null;

  const lossText =
    lossFrom === null || lossTo === null
      ? "None in this window"
      : next?.window_only
        ? `${stamp(lossFrom)} – ${stamp(lossTo)}`
        : stamp(lossFrom);

  let gapText: string | null = null;
  if (opsMs !== null && lossFrom !== null) {
    const hoursBetween = (lossFrom - opsMs) / 3_600_000;
    gapText =
      hoursBetween >= 0
        ? `Operations ended about ${formatDuration(hoursBetween)} before the computed Sun loss.`
        : `Operations ended about ${formatDuration(-hoursBetween)} after the computed Sun loss.`;
  }

  return (
    <>
      <Sparkline
        series={series}
        tdb0={tdb0}
        spanS={hours * 3600}
        loss={lossFrom !== null && lossTo !== null ? { from: (lossFrom - landingMs) / 1000, to: (lossTo - landingMs) / 1000 } : null}
        opsEndS={opsMs !== null ? (opsMs - landingMs) / 1000 : null}
        opsLabel={mission.ops_end_label ?? "Operations ended"}
        startLabel={stamp(landingMs).slice(0, 10)}
        endLabel={stamp(endMs).slice(0, 10)}
      />

      <dl className="mt-3 border-t border-white/[0.08]">
        <Line label="Landed" value={stamp(landingMs)} />
        <Line label="Computed Sun loss (terrain)" value={lossText} />
        {sunriseEvent && !next?.window_only && <Line label="Computed sunrise" value={stamp(Date.parse(sunriseEvent.time_utc))} />}
        {mission.ops_end_label && opsMs !== null && <Line label={mission.ops_end_label} value={stamp(opsMs).slice(0, 10)} />}
        <Line label="Average sunlight in this window" value={`${Math.round(100 * summary.mean_sun_fraction)}%`} />
        <Line label="Earth in view" value={`${Math.round(summary.percent_earth_visible)}% of the time`} />
        {summary.eclipse_hours > 0 && (
          <Line label="Earth in front of the Sun" value={formatDuration(summary.eclipse_hours)} />
        )}
      </dl>
      {gapText && <p className="mt-3 text-[12px] leading-[1.65] text-white/60">{gapText} A shutdown is not a sunset.</p>}
    </>
  );
}

/* =========================================================
   Small pieces
   ========================================================= */

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 border-b border-white/[0.08] py-3 pr-4">
      <dt className="text-[11px] text-white/45">{label}</dt>
      <dd className="mt-1 truncate text-[15px] tabular-nums text-white">{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-[11px] text-white/40">{sub}</dd>}
    </div>
  );
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.08] py-2.5">
      <dt className="text-[12px] text-white/50">{label}</dt>
      <dd className="text-right text-[13px] tabular-nums text-white">{value}</dd>
    </div>
  );
}

/** Sunlight (fraction of the Sun's disc) over the replay window, with the key moments marked. */
function Sparkline({
  series,
  tdb0,
  spanS,
  loss,
  opsEndS,
  opsLabel,
  startLabel,
  endLabel,
}: {
  series: Series;
  tdb0: number;
  spanS: number;
  loss: { from: number; to: number } | null;
  opsEndS: number | null;
  opsLabel: string;
  startLabel: string;
  endLabel: string;
}) {
  const W = 600;
  const H = 84;
  const top = 8;
  const bottom = H - 10;
  const x = (seconds: number) => Math.max(0, Math.min(W, (seconds / spanS) * W));
  const y = (fraction: number) => bottom - fraction * (bottom - top);

  const path = series.tdb
    .map((t, i) => `${i === 0 ? "M" : "L"}${x(t - tdb0).toFixed(1)} ${y(series.sun_fraction[i]).toFixed(1)}`)
    .join(" ");

  const eclipseRuns: [number, number][] = [];
  let start = -1;
  series.eclipse.forEach((on, i) => {
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      eclipseRuns.push([start, i]);
      start = -1;
    }
  });
  if (start >= 0) eclipseRuns.push([start, series.eclipse.length - 1]);

  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H + 14}`}
        role="img"
        aria-label="Sunlight over the replay window, with the end of operations and the computed Sun loss marked"
        className="block h-auto w-full overflow-visible"
      >
        <line x1="0" y1={bottom} x2={W} y2={bottom} stroke="#fff" strokeOpacity="0.15" />

        {eclipseRuns.map(([a, b]) => (
          <rect
            key={a}
            x={x(series.tdb[a] - tdb0)}
            y={top}
            width={Math.max(2, x(series.tdb[b] - tdb0) - x(series.tdb[a] - tdb0))}
            height={bottom - top}
            fill="#38bdf8"
            fillOpacity="0.22"
          >
            <title>Earth in front of the Sun (eclipse, geometry only)</title>
          </rect>
        ))}

        {loss && (
          <rect
            x={x(loss.from)}
            y={top}
            width={Math.max(1.5, x(loss.to) - x(loss.from))}
            height={bottom - top}
            fill="#ff3b12"
            fillOpacity={loss.to - loss.from > 60 ? 0.18 : 0.6}
          >
            <title>Computed Sun loss behind the terrain</title>
          </rect>
        )}

        <path d={path} fill="none" stroke="#f2c14e" strokeWidth="1.5" />

        {opsEndS !== null && opsEndS >= 0 && opsEndS <= spanS && (
          <g>
            <line x1={x(opsEndS)} y1={top - 4} x2={x(opsEndS)} y2={bottom} stroke="#fff" strokeDasharray="3 3" strokeOpacity="0.7" />
            <text
              x={x(opsEndS)}
              y={top - 6}
              fill="#fff"
              fillOpacity="0.65"
              fontSize="10"
              textAnchor={x(opsEndS) > W * 0.6 ? "end" : "start"}
            >
              {opsLabel}
            </text>
          </g>
        )}

        <text x="0" y={H + 8} fill="#fff" fillOpacity="0.35" fontSize="10">
          {startLabel}
        </text>
        <text x={W} y={H + 8} fill="#fff" fillOpacity="0.35" fontSize="10" textAnchor="end">
          {endLabel}
        </text>
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/40">
        <span><span className="mr-1 inline-block h-[2px] w-3 bg-[#f2c14e] align-middle" />Sunlight</span>
        <span><span className="mr-1 inline-block h-2 w-3 bg-[#ff3b12]/40 align-middle" />Computed Sun loss</span>
        <span><span className="mr-1 inline-block h-2 w-3 bg-sky-400/30 align-middle" />Earth in front of the Sun</span>
      </figcaption>
    </figure>
  );
}
