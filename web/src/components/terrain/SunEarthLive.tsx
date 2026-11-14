import { useMemo, useState, type ReactNode } from "react";

import {
  flatMask,
  isoToTdb,
  makeObserver,
  outlook,
  sampleSeries,
  skyState,
  summarize,
  type BodyOutlook,
  type Outlook,
  type SkyState,
  type Summary,
} from "../../engine";
import type { LunarSite } from "../../data/lunarSites";
import { useEphemeris, useMask } from "../../hooks/useEngine";
import { eventLabel, formatCountdown, formatDuration, nowUtcInput, utcInputToIso } from "../../lib/format";

const DEFAULT_TIME = "2026-11-14T09:00"; // hackathon start, UTC
const MISSION_HOURS = 14 * 24;

type Result =
  | { ok: true; state: SkyState; look: Outlook; summary: Summary | null }
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
      return {
        ok: true,
        state: skyState(eph, obs, horizon, tdb),
        look: outlook(eph, obs, horizon, tdb),
        summary: withSummary ? summarize(sampleSeries(eph, obs, horizon, tdb, MISSION_HOURS)) : null,
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

      {site.latitude === null || site.longitude === null ? (
        <Note>No coordinates are listed for this site, so its sky cannot be computed.</Note>
      ) : error ? (
        <Note>Could not load the ephemeris: {error}</Note>
      ) : !result ? (
        <p className="mt-6 text-[12px] text-white/40">Loading ephemeris…</p>
      ) : !result.ok ? (
        <Note>{result.message}</Note>
      ) : (
        <LiveResult result={result} terrain={terrain} />
      )}
    </section>
  );
}

function LiveResult({ result, terrain }: { result: Extract<Result, { ok: true }>; terrain: boolean }) {
  const { state, look, summary } = result;
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
