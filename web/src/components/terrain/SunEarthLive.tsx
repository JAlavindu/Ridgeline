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
  | { ok: true; state: SkyState; look: Outlook; summary: Summary }
  | { ok: false; message: string };

export default function SunEarthLive({ site }: { site: LunarSite }) {
  const [timeInput, setTimeInput] = useState(DEFAULT_TIME);
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
        summary: summarize(sampleSeries(eph, obs, horizon, tdb, MISSION_HOURS)),
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }, [eph, mask, loading, site, timeInput]);

  return (
    <section aria-labelledby="sun-earth-heading">
      <p className="text-[8px] uppercase tracking-[2px] text-white/35">LIVE FROM THE EPHEMERIS</p>
      <h3 id="sun-earth-heading" className="mt-2 font-['Michroma'] text-sm">
        Sun &amp; Earth
      </h3>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[7px] uppercase tracking-[1.5px] text-white/35">
          Date and time (UTC)
          <input
            type="datetime-local"
            value={timeInput}
            min="2023-01-01T00:00"
            max="2032-12-31T23:59"
            onChange={(event) => setTimeInput(event.target.value)}
            className="border border-white/15 bg-black px-2 py-1 text-[10px] text-white [color-scheme:dark]"
          />
        </label>
        <button
          type="button"
          onClick={() => setTimeInput(nowUtcInput())}
          className="border border-white/15 px-3 py-1.5 text-[8px] uppercase tracking-[1.5px] text-white/60 transition hover:border-[#ff3b12] hover:text-white"
        >
          Now
        </button>
      </div>

      {site.latitude === null || site.longitude === null ? (
        <Note>No coordinates are listed for this site, so its sky cannot be computed.</Note>
      ) : error ? (
        <Note>Could not load the ephemeris: {error}</Note>
      ) : !result ? (
        <p className="mt-5 text-[9px] text-white/40">Loading ephemeris…</p>
      ) : !result.ok ? (
        <Note>{result.message}</Note>
      ) : (
        <LiveResult result={result} terrain={mask !== null} />
      )}
    </section>
  );
}

function LiveResult({ result, terrain }: { result: Extract<Result, { ok: true }>; terrain: boolean }) {
  const { state, look, summary } = result;
  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="SUN HEIGHT" value={`${state.sun.el_deg.toFixed(1)}°`} />
        <Stat label="SUNLIGHT" value={`${Math.round(state.solar_flux_w_m2)} W/m²`} />
        <Stat label="SUN VISIBLE" value={`${Math.round(100 * state.sun_visible_fraction)}%`} />
        <Stat label="EARTH HEIGHT" value={`${state.earth.el_deg.toFixed(1)}°`} />
        <Stat label="EARTH CONTACT" value={state.is_earth_visible ? "Yes" : "No"} />
        <Stat label="SUN RISING AT" value={`${state.sun_elevation_rate_deg_per_hr.toFixed(2)}°/h`} />
      </div>
      {state.is_eclipse && <Note>Earth is passing in front of the Sun (an eclipse seen from the Moon).</Note>}

      <p className="mt-6 text-[8px] uppercase tracking-[2px] text-white/35">COUNTDOWNS</p>
      <CountdownLine name="Sun" body={look.sun} />
      <CountdownLine name="Earth" body={look.earth} />
      {(look.sun.next?.window_only || look.earth.next?.window_only) && (
        <p className="mt-2 text-[8px] leading-[1.6] text-white/35">
          Near the pole, small errors in terrain height move these times by hours, so only a window is shown.
          {look.horizon_uncertainty === "assumed" && " The window assumes ±0.1° terrain uncertainty."}
        </p>
      )}

      <p className="mt-6 text-[8px] uppercase tracking-[2px] text-white/35">NEXT 14 DAYS</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="SUN UP (ANY PART)" value={`${summary.percent_sunlit.toFixed(0)}%`} />
        <Stat label="AVERAGE SUNLIGHT" value={`${(100 * summary.mean_sun_fraction).toFixed(0)}%`} />
        <Stat label="EARTH VISIBLE" value={`${summary.percent_earth_visible.toFixed(0)}%`} />
        <Stat label="POWER + CONTACT" value={`${summary.percent_both.toFixed(0)}%`} />
        <Stat label="LONGEST NIGHT" value={formatDuration(summary.longest_night_hours)} />
        <Stat label="LONGEST COMMS GAP" value={formatDuration(summary.longest_comms_gap_hours)} />
      </div>

      <p className="mt-5 text-[8px] leading-[1.6] text-white/30">
        {terrain
          ? "Horizon: NASA LOLA terrain within the surrounding area (2 m mast)."
          : "Horizon: smooth Moon (no terrain data for this site yet), so hills are not included."}{" "}
        Sun and Earth positions: NASA JPL DE440 via SPICE, checked against JPL Horizons.
      </p>
    </>
  );
}

function CountdownLine({ name, body }: { name: string; body: BodyOutlook }) {
  let text: string;
  if (!body.next) {
    text = `${name} stays ${body.is_up ? "up" : "below the horizon"} for the next 60 days`;
  } else {
    const when = body.next.window_only ? "" : ` (${body.next.formatted_target_utc})`;
    text = `${eventLabel(body.next.event)} in ${formatCountdown(body.next)}${when}`;
  }
  return (
    <p className="mt-2 border-l border-[#ff3b12] pl-3 text-[10px] text-white/75">
      <span className="text-white/40">{name} is {body.is_up ? "up" : "down"} · </span>
      {text}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-white/10 p-3">
      <p className="text-[7px] uppercase tracking-[1.5px] text-white/35">{label}</p>
      <p className="mt-3 truncate font-['Michroma'] text-[10px]">{value}</p>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 border-l border-[#ff3b12] pl-3 text-[9px] leading-[1.7] text-white/45">{children}</p>
  );
}
