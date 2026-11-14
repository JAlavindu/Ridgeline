import { useMemo, useState, type ReactNode } from "react";

import {
  DSN_LIMITS,
  dsnContact,
  dsnContactPercent,
  flatMask,
  isoToTdb,
  makeObserver,
  outlook,
  sampleSeries,
  skyState,
  summarize,
  type BodyOutlook,
  type Dsn,
  type DsnLimit,
  type Outlook,
  type Series,
  type SkyState,
  type Summary,
} from "../../engine";
import type { LunarSite } from "../../data/lunarSites";
import { useDsn, useEphemeris, useMask } from "../../hooks/useEngine";
import { eventLabel, formatCountdown, formatDuration, nowUtcInput, utcInputToIso } from "../../lib/format";

const DEFAULT_TIME = "2026-11-14T09:00"; // hackathon start, UTC
const MISSION_HOURS = 14 * 24;

type Result =
  | { ok: true; state: SkyState; look: Outlook; summary: Summary | null; series: Series | null; tdb: number }
  | { ok: false; message: string };

/** Runs the real engine (JPL ephemeris + horizon mask) for one site and time. */
function useSky(site: LunarSite, timeInput: string, withSummary: boolean) {
  const { eph, error } = useEphemeris();
  const { mask, loading } = useMask(site.id);

  const result = useMemo((): Result | null => {
    if (!eph || loading || site.latitude === null || site.longitude === null) return null;
    try {
      const obs = makeObserver(site.latitude, site.longitude, mask?.site_height_m ?? 0);
      const horizon = mask ?? flatMask(obs);
      const tdb = isoToTdb(utcInputToIso(timeInput));
      const series = withSummary ? sampleSeries(eph, obs, horizon, tdb, MISSION_HOURS) : null;
      return {
        ok: true,
        state: skyState(eph, obs, horizon, tdb),
        look: outlook(eph, obs, horizon, tdb),
        summary: series ? summarize(series) : null,
        series,
        tdb,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }, [eph, mask, loading, site, timeInput, withSummary]);

  return { result, error, terrain: mask !== null };
}

function nextChangeText(body: BodyOutlook): string {
  if (!body.next) return "No change in the next 60 days";
  const when = body.next.window_only ? "" : ` · ${body.next.formatted_target_utc}`;
  return `${eventLabel(body.next.event)} in ${formatCountdown(body.next)}${when}`;
}

/* =========================================================
   FULL TAB: pick a time, see everything
   ========================================================= */

export default function SunEarthLive({ site }: { site: LunarSite }) {
  const [timeInput, setTimeInput] = useState(DEFAULT_TIME);
  const { result, error, terrain } = useSky(site, timeInput, true);
  const [network, setNetwork] = useState<"any" | "dsn">("any");
  const [limit, setLimit] = useState<DsnLimit>("receive");
  const { dsn, error: dsnError } = useDsn(network === "dsn");

  return (
    <section aria-labelledby="sun-earth-heading">
      <h3 id="sun-earth-heading" className="text-[15px] font-medium text-white">
        Sun and Earth from this site
      </h3>
      <p className="mt-1 text-[12px] text-white/45">
        Computed from the JPL ephemeris for the time you pick.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1.5 text-[11px] text-white/45">
          Date and time (UTC)
          <input
            type="datetime-local"
            value={timeInput}
            min="2023-01-01T00:00"
            max="2032-12-31T23:59"
            onChange={(event) => setTimeInput(event.target.value)}
            className="h-9 rounded-md border border-white/[0.12] bg-white/[0.03] px-3 text-[13px] tabular-nums text-white outline-none transition [color-scheme:dark] focus:border-white/35"
          />
        </label>
        <button
          type="button"
          onClick={() => setTimeInput(nowUtcInput())}
          className="h-9 rounded-md border border-white/[0.12] px-3.5 text-[12px] text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Now
        </button>
      </div>

      <GroundNetwork network={network} onNetwork={setNetwork} limit={limit} onLimit={setLimit} />

      {site.latitude === null || site.longitude === null ? (
        <Note>No coordinates are listed for this site, so its sky cannot be computed.</Note>
      ) : error ? (
        <Note>Could not load the ephemeris: {error}</Note>
      ) : !result ? (
        <p className="mt-6 text-[12px] text-white/40">Loading ephemeris…</p>
      ) : !result.ok ? (
        <Note>{result.message}</Note>
      ) : (
        <LiveResult
          result={result}
          terrain={terrain}
          ground={network === "dsn" ? { dsn, error: dsnError, limit } : null}
        />
      )}
    </section>
  );
}

/** Any network (Earth in view) is the default; DSN adds the Earth end of the radio link. */
function GroundNetwork({
  network,
  onNetwork,
  limit,
  onLimit,
}: {
  network: "any" | "dsn";
  onNetwork: (value: "any" | "dsn") => void;
  limit: DsnLimit;
  onLimit: (value: DsnLimit) => void;
}) {
  const options: ["any" | "dsn", string][] = [
    ["any", "Any network (Earth in view)"],
    ["dsn", "NASA DSN"],
  ];
  return (
    <div className="mt-5">
      <p className="text-[11px] text-white/45">Ground network</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex gap-4" role="group" aria-label="Ground network">
          {options.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={network === value}
              onClick={() => onNetwork(value)}
              className={`border-b-2 pb-1 text-[12px] transition ${
                network === value
                  ? "border-[#ff3b12] text-white"
                  : "border-transparent text-white/45 hover:text-white/75"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {network === "dsn" && (
          <label className="flex items-center gap-2 text-[11px] text-white/45">
            Moon at least
            <select
              value={limit}
              onChange={(event) => onLimit(event.target.value as DsnLimit)}
              className="h-8 rounded-md border border-white/[0.12] bg-[#0a0a0a] px-2 text-[12px] tabular-nums text-white outline-none [color-scheme:dark] focus:border-white/35"
            >
              <option value="receive">{DSN_LIMITS.receive}° (receive)</option>
              <option value="command_low">{DSN_LIMITS.command_low}° (low-power commands)</option>
              <option value="command_high">{DSN_LIMITS.command_high}° (high-power commands)</option>
            </select>
          </label>
        )}
      </div>
      <p className="mt-2 max-w-[60ch] text-[11px] leading-[1.6] text-white/35">
        Many commercial landers use other ground networks, so the default only needs Earth in view. DSN also needs
        the Moon above the limit at Goldstone, Madrid or Canberra (DSN 810-005, Rev. O).
        {network === "dsn" &&
          " Earthrise and Earthset times below stay based on Earth in view, not on station visibility."}
      </p>
    </div>
  );
}

function dsnNow(dsn: Dsn, result: Extract<Result, { ok: true }>, limitDeg: number) {
  try {
    return dsnContact(dsn, result.tdb, result.state.is_earth_visible, limitDeg);
  } catch {
    return null; // time outside 2023-2032
  }
}

type Ground = { dsn: Dsn | null; error: string | null; limit: DsnLimit } | null;

function LiveResult({
  result,
  terrain,
  ground,
}: {
  result: Extract<Result, { ok: true }>;
  terrain: boolean;
  ground: Ground;
}) {
  const { state, look, summary } = result;
  const limitDeg = ground ? DSN_LIMITS[ground.limit] : 0;
  const nowDsn = ground?.dsn ? dsnNow(ground.dsn, result, limitDeg) : null;
  const dsnPercent = ground?.dsn && result.series ? dsnContactPercent(ground.dsn, result.series, limitDeg) : null;
  return (
    <>
      <SectionLabel>At this moment</SectionLabel>
      <StatGrid>
        <Stat label="Sun height" value={`${state.sun.el_deg.toFixed(1)}°`} />
        <Stat label="Sunlight" value={`${Math.round(state.solar_flux_w_m2)} W/m²`} />
        <Stat label="Sun disc visible" value={`${Math.round(100 * state.sun_visible_fraction)}%`} />
        <Stat label="Earth height" value={`${state.earth.el_deg.toFixed(1)}°`} />
        <Stat label="Earth contact" value={state.is_earth_visible ? "Yes" : "No"} />
        <Stat label="Sun rising at" value={`${state.sun_elevation_rate_deg_per_hr.toFixed(2)}°/h`} />
      </StatGrid>
      {ground && (
        <>
          {ground.error ? (
            <Note>Could not load the DSN data: {ground.error}</Note>
          ) : !ground.dsn ? (
            <p className="mt-3 text-[12px] text-white/40">Loading DSN station data…</p>
          ) : nowDsn ? (
            <StatGrid>
              <Stat label="DSN contact now" value={nowDsn.contact ? "Yes" : "No"} />
              <Stat
                label="Stations with the Moon up"
                value={nowDsn.stations.length > 0 ? nowDsn.stations.map((s) => s.id).join(", ") : "None"}
              />
              <Stat label="Best Moon height" value={`${nowDsn.max_elevation_deg.toFixed(1)}°`} />
            </StatGrid>
          ) : (
            <Note>DSN data covers 2023 to 2032.</Note>
          )}
        </>
      )}
      {state.is_eclipse && <Note>Earth is passing in front of the Sun (an eclipse seen from the Moon).</Note>}

      <SectionLabel>What changes next</SectionLabel>
      <div className="mt-2 border-t border-white/[0.08]">
        <CountdownLine name="Sun" body={look.sun} />
        <CountdownLine name="Earth" body={look.earth} />
      </div>
      {(look.sun.next?.window_only || look.earth.next?.window_only) && (
        <p className="mt-2 text-[11px] leading-[1.6] text-white/40">
          Near the pole, small errors in terrain height move these times by hours, so only a window is shown.
          {look.horizon_uncertainty === "assumed" && " The window assumes ±0.1° terrain uncertainty."}
        </p>
      )}

      {summary && (
        <>
          <SectionLabel>Next 14 days</SectionLabel>
          <StatGrid>
            <Stat label="Sun up (any part)" value={`${summary.percent_sunlit.toFixed(0)}%`} />
            <Stat label="Average sunlight" value={`${(100 * summary.mean_sun_fraction).toFixed(0)}%`} />
            <Stat label="Earth visible" value={`${summary.percent_earth_visible.toFixed(0)}%`} />
            <Stat label="Power and contact" value={`${summary.percent_both.toFixed(0)}%`} />
            {dsnPercent !== null && <Stat label="DSN contact" value={`${dsnPercent.toFixed(0)}%`} />}
            <Stat label="Longest night" value={formatDuration(summary.longest_night_hours)} />
            <Stat label="Longest comms gap" value={formatDuration(summary.longest_comms_gap_hours)} />
          </StatGrid>
        </>
      )}

      <p className="mt-6 text-[11px] leading-[1.6] text-white/35">
        {terrain
          ? "Horizon: NASA LOLA terrain around the site (2 m mast)."
          : "Horizon: smooth Moon (no terrain data for this site yet), so hills are not included."}{" "}
        Sun and Earth positions: NASA JPL DE440 via SPICE, checked against JPL Horizons.
      </p>
    </>
  );
}

function CountdownLine({ name, body }: { name: string; body: BodyOutlook }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.08] py-3">
      <span className="shrink-0 text-[12px] text-white/50">
        {name} is {body.is_up ? "up" : "down"}
      </span>
      <span className="text-right text-[13px] tabular-nums text-white">{nextChangeText(body)}</span>
    </div>
  );
}

/* =========================================================
   COMPACT: "right now" answer for the Overview tab
   ========================================================= */

export function SkyNow({ site, onOpenDetails }: { site: LunarSite; onOpenDetails: () => void }) {
  const [timeInput] = useState(nowUtcInput);
  const { result, error } = useSky(site, timeInput, false);

  return (
    <section aria-labelledby="sky-now-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="sky-now-heading" className="text-[12px] font-medium text-white/50">
          Right now
        </h3>
        <span className="text-[11px] tabular-nums text-white/35">{timeInput.replace("T", " ")} UTC</span>
      </div>

      {site.latitude === null || site.longitude === null ? (
        <Note>No coordinates are listed for this site, so its sky cannot be computed.</Note>
      ) : error ? (
        <Note>Could not load the ephemeris: {error}</Note>
      ) : !result ? (
        <p className="mt-3 text-[12px] text-white/40">Working out the sky…</p>
      ) : !result.ok ? (
        <Note>{result.message}</Note>
      ) : (
        <>
          <dl className="mt-3 border-t border-white/[0.08]">
            <NowRow
              on={result.state.is_sun_visible}
              onColor="bg-[#f2c14e]"
              label="Sunlight"
              status={
                result.state.is_sun_visible
                  ? `Sunlit · ${Math.round(100 * result.state.sun_visible_fraction)}% of the disc`
                  : "In shadow"
              }
              next={nextChangeText(result.look.sun)}
            />
            <NowRow
              on={result.state.is_earth_visible}
              onColor="bg-sky-400"
              label="Earth contact"
              status={
                result.state.is_earth_visible
                  ? `In view · ${result.state.earth.el_deg.toFixed(1)}° up`
                  : "Out of view"
              }
              next={nextChangeText(result.look.earth)}
            />
          </dl>
          <button
            type="button"
            onClick={onOpenDetails}
            className="mt-3 text-[12px] text-white/55 underline-offset-4 transition hover:text-white hover:underline"
          >
            Pick another time →
          </button>
        </>
      )}
    </section>
  );
}

function NowRow({
  on,
  onColor,
  label,
  status,
  next,
}: {
  on: boolean;
  onColor: string;
  label: string;
  status: string;
  next: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 border-b border-white/[0.08] py-4">
      <span aria-hidden="true" className={`mt-[7px] h-2 w-2 rounded-full ${on ? onColor : "bg-white/20"}`} />
      <div className="min-w-0">
        <dt className="text-[11px] text-white/45">{label}</dt>
        <dd className="mt-0.5 text-[17px] text-white">{status}</dd>
        <dd className="mt-1 text-[12px] tabular-nums text-white/50">{next}</dd>
      </div>
    </div>
  );
}

/* =========================================================
   SHARED BITS
   ========================================================= */

function SectionLabel({ children }: { children: ReactNode }) {
  return <h4 className="mt-8 text-[12px] font-medium text-white/50">{children}</h4>;
}

function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="mt-2 grid grid-cols-2 border-t border-white/[0.08] sm:grid-cols-3">{children}</dl>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-white/[0.08] py-3 pr-3">
      <dt className="text-[11px] text-white/45">{label}</dt>
      <dd className="mt-1 truncate text-[15px] tabular-nums text-white">{value}</dd>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 border-l-2 border-[#ff3b12]/70 pl-3 text-[12px] leading-[1.6] text-white/55">{children}</p>
  );
}
