import { earthVisibility, DEFAULT_EARTH_OPTIONS, type EarthOptions } from "./earth";
import { coverage, type Ephemeris } from "./ephemeris";
import { skyAt, type Observer } from "./geometry";
import type { HorizonMask } from "./mask";
import { sunlight } from "./sunlight";
import { tdbToIso } from "./time";

/** One array per quantity; index i is the same moment in every array. */
export interface Series {
  step_s: number;
  tdb: number[];
  sun_el_deg: number[];
  earth_el_deg: number[];
  sun_horizon_deg: number[];
  earth_horizon_deg: number[];
  sun_fraction: number[];       // 0..1, terrain and eclipse combined
  irradiance_w_m2: number[];
  earth_visible: boolean[];
  eclipse: boolean[];           // Sun above the terrain but partly or fully covered by Earth
}

export interface Summary {
  hours: number;
  percent_sunlit: number;
  percent_full_sun: number;     // whole disc visible
  mean_sun_fraction: number;    // average visible part of the disc, 0..1 (NASA PGDA / Glaser measure)
  percent_earth_visible: number;
  percent_both: number;         // sunlight AND Earth: power and direct contact together
  longest_night_hours: number;  // within the period (a night cut off by the period's ends counts as shown)
  longest_comms_gap_hours: number;
  nights_over_24h: number;
  mean_irradiance_w_m2: number;
  eclipse_hours: number;
}

export const DEFAULT_STEP_MIN = 10;
const FULL_SUN = 0.999;

/** Sample conditions from startTdb for `hours`, every `stepMinutes` (stops at the ephemeris end). */
export function sampleSeries(
  eph: Ephemeris,
  obs: Observer,
  mask: HorizonMask,
  startTdb: number,
  hours: number,
  stepMinutes: number = DEFAULT_STEP_MIN,
  earthOptions: EarthOptions = DEFAULT_EARTH_OPTIONS,
): Series {
  const step = stepMinutes * 60;
  const end = Math.min(startTdb + hours * 3600, coverage(eph).lastTdb);
  const s: Series = {
    step_s: step,
    tdb: [],
    sun_el_deg: [],
    earth_el_deg: [],
    sun_horizon_deg: [],
    earth_horizon_deg: [],
    sun_fraction: [],
    irradiance_w_m2: [],
    earth_visible: [],
    eclipse: [],
  };

  for (let t = startTdb; t < end; t += step) {
    const view = skyAt(eph, obs, t);
    const light = sunlight(view.sun, view.earth, view.sun_earth_sep_deg, mask);
    const dte = earthVisibility(view.earth, mask, earthOptions);
    s.tdb.push(t);
    s.sun_el_deg.push(view.sun.el_deg);
    s.earth_el_deg.push(view.earth.el_deg);
    s.sun_horizon_deg.push(light.horizon_deg);
    s.earth_horizon_deg.push(dte.horizon_deg);
    s.sun_fraction.push(light.visible_fraction);
    s.irradiance_w_m2.push(light.irradiance_w_m2);
    s.earth_visible.push(dte.visible);
    s.eclipse.push(light.terrain_fraction > 0 && light.eclipse_fraction < 1);
  }
  return s;
}

/** Longest run of `true` values, counted in samples. */
function longestRun(flags: boolean[]): number {
  let best = 0;
  let current = 0;
  for (const flag of flags) {
    current = flag ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

/** Number of runs of `true` that are at least `minSamples` long. */
function countRuns(flags: boolean[], minSamples: number): number {
  let count = 0;
  let current = 0;
  for (const flag of [...flags, false]) {
    if (flag) {
      current += 1;
    } else {
      if (current >= minSamples) count += 1;
      current = 0;
    }
  }
  return count;
}

/** All the headline numbers for a period, in one pass over the samples. */
export function summarize(s: Series): Summary {
  const n = s.tdb.length;
  const hoursPerSample = s.step_s / 3600;
  if (n === 0) {
    return {
      hours: 0, percent_sunlit: 0, percent_full_sun: 0, mean_sun_fraction: 0,
      percent_earth_visible: 0, percent_both: 0,
      longest_night_hours: 0, longest_comms_gap_hours: 0, nights_over_24h: 0,
      mean_irradiance_w_m2: 0, eclipse_hours: 0,
    };
  }

  const sunlit = s.sun_fraction.map((f) => f > 0);
  const percent = (flags: boolean[]) => (100 * flags.filter(Boolean).length) / n;
  const dark = sunlit.map((lit) => !lit);
  const noEarth = s.earth_visible.map((v) => !v);
  const average = (xs: number[]) => xs.reduce((sum, x) => sum + x, 0) / n;

  return {
    hours: n * hoursPerSample,
    percent_sunlit: percent(sunlit),
    percent_full_sun: percent(s.sun_fraction.map((f) => f >= FULL_SUN)),
    mean_sun_fraction: average(s.sun_fraction),
    percent_earth_visible: percent(s.earth_visible),
    percent_both: percent(sunlit.map((lit, i) => lit && s.earth_visible[i])),
    longest_night_hours: longestRun(dark) * hoursPerSample,
    longest_comms_gap_hours: longestRun(noEarth) * hoursPerSample,
    nights_over_24h: countRuns(dark, Math.ceil(24 / hoursPerSample)),
    mean_irradiance_w_m2: average(s.irradiance_w_m2),
    eclipse_hours: s.eclipse.filter(Boolean).length * hoursPerSample,
  };
}

/** Same fields as M4's TimelineHour. `every` = keep one row in every N samples. */
export interface TimelineRow {
  time_utc: string;
  sun_el: number;
  earth_el: number;
  sun_terrain_el: number;
  earth_terrain_el: number;
  sun_fraction: number;
  is_sunlit: boolean;
  is_partial: boolean;
  is_dark: boolean;
  is_earth_visible: boolean;
  is_eclipse: boolean;
  is_both: boolean;
}

export function timelineRows(s: Series, every = 1): TimelineRow[] {
  const rows: TimelineRow[] = [];
  for (let i = 0; i < s.tdb.length; i += every) {
    const f = s.sun_fraction[i];
    rows.push({
      time_utc: tdbToIso(s.tdb[i]),
      sun_el: s.sun_el_deg[i],
      earth_el: s.earth_el_deg[i],
      sun_terrain_el: s.sun_horizon_deg[i],
      earth_terrain_el: s.earth_horizon_deg[i],
      sun_fraction: f,
      is_sunlit: f >= FULL_SUN,
      is_partial: f > 0 && f < FULL_SUN,
      is_dark: f === 0,
      is_earth_visible: s.earth_visible[i],
      is_eclipse: s.eclipse[i],
      is_both: f > 0 && s.earth_visible[i],
    });
  }
  return rows;
}

/** Same fields as M4's SlipDataPoint. */
export interface SlipPoint {
  slip_days: number;
  target_date: string;
  sunlight_percent: number;
  earth_visible_percent: number;
  combined_percent: number;
  longest_night_hours: number;
  is_viable: boolean;
}

/** What counts as "viable" on the slip chart. These are user settings, not physics. */
export interface Viability {
  min_sunlight_percent: number;
  max_night_hours: number;
}

export const DEFAULT_VIABILITY: Viability = { min_sunlight_percent: 65, max_night_hours: 72 };

/**
 * The mission summary for each launch slip (in days) from a planned start, using hourly samples
 * so the whole chart takes well under a second. Slips outside 2023-2032 are skipped.
 */
export function slipScan(
  eph: Ephemeris,
  obs: Observer,
  mask: HorizonMask,
  plannedStartTdb: number,
  missionHours: number,
  slipDays: number[],
  viability: Viability = DEFAULT_VIABILITY,
  earthOptions: EarthOptions = DEFAULT_EARTH_OPTIONS,
): SlipPoint[] {
  const { firstTdb, lastTdb } = coverage(eph);
  const points: SlipPoint[] = [];
  for (const slip of slipDays) {
    const start = plannedStartTdb + slip * 86400;
    if (start < firstTdb || start + missionHours * 3600 > lastTdb) continue;
    const summary = summarize(sampleSeries(eph, obs, mask, start, missionHours, 60, earthOptions));
    points.push({
      slip_days: slip,
      target_date: tdbToIso(start).slice(0, 10),
      sunlight_percent: summary.percent_sunlit,
      earth_visible_percent: summary.percent_earth_visible,
      combined_percent: summary.percent_both,
      longest_night_hours: summary.longest_night_hours,
      is_viable:
        summary.percent_sunlit >= viability.min_sunlight_percent &&
        summary.longest_night_hours <= viability.max_night_hours,
    });
  }
  return points;
}
