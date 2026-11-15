import { earthVisibility, DEFAULT_EARTH_OPTIONS, type EarthOptions } from "./earth";
import { coverage, type Ephemeris } from "./ephemeris";
import { skyAt, type Observer, type SkyView } from "./geometry";
import type { HorizonMask } from "./mask";
import { sunAboveHorizonDeg } from "./sunlight";
import { tdbToIso, tdbToUnixMs } from "./time";

export type Body = "sun" | "earth";
export type EventKind = "sunrise" | "sunset" | "earthrise" | "earthset";

export interface SkyEvent {
  kind: EventKind;
  tdb: number;
  time_utc: string;
}

/** Same fields as M4's CountdownWindow, plus `window_only`. Hours are counted from the start time. */
export interface Countdown {
  event: EventKind;
  nominal_hours: number;
  earliest_hours: number;
  latest_hours: number;
  uncertainty_hours: number;
  formatted_target_utc: string;
  window_only: boolean;
}

export interface BodyOutlook {
  is_up: boolean;
  next: Countdown | null;   // null = no change during the whole search period
  events: SkyEvent[];       // every rise and set found (best-estimate horizon)
}

export interface Outlook {
  sun: BodyOutlook;
  earth: BodyOutlook;
  searched_hours: number;           // can be shorter than asked if the ephemeris ends
  horizon_uncertainty: "from mask" | "assumed";
}

export const STEP_S = 3600;
export const PRECISION_S = 30;              // bisection stops when the gap is under 1 minute
export const FLICKER_S = 3600;              // set/rise pairs closer than this are dropped
export const MATCH_S = 3 * 86400;           // low/high events must be within 3 days to pair up
export const WINDOW_ONLY_LAT_DEG = 75;
export const ASSUMED_HORIZON_ERROR_DEG = 0.1;  // used only when M3's mask has no lo/hi values
export const DEFAULT_SEARCH_HOURS = 60 * 24;

/** The smooth number whose sign says "visible" (+) or "hidden" (-). */
export function margin(body: Body, view: SkyView, mask: HorizonMask, earthOptions: EarthOptions): number {
  if (body === "sun") {
    // Any part of the disc above the terrain counts as "up" (matches is_sun_visible).
    return sunAboveHorizonDeg(view.sun, mask) + view.sun.angular_radius_deg;
  }
  return earthVisibility(view.earth, mask, earthOptions).margin_deg;
}

function eventKind(body: Body, rising: boolean): EventKind {
  if (body === "sun") return rising ? "sunrise" : "sunset";
  return rising ? "earthrise" : "earthset";
}

/** Remove set/rise (or rise/set) pairs that happen less than FLICKER_S apart. */
export function removeFlicker(events: SkyEvent[]): SkyEvent[] {
  const kept: SkyEvent[] = [];
  let i = 0;
  while (i < events.length) {
    const next = events[i + 1];
    if (next && next.tdb - events[i].tdb < FLICKER_S) {
      i += 2; // skip both
    } else {
      kept.push(events[i]);
      i += 1;
    }
  }
  return kept;
}

/** All rises and sets of one body between startTdb and startTdb + hours (within the ephemeris). */
export function findEvents(
  eph: Ephemeris,
  obs: Observer,
  mask: HorizonMask,
  body: Body,
  startTdb: number,
  hours: number,
  earthOptions: EarthOptions = DEFAULT_EARTH_OPTIONS,
): SkyEvent[] {
  const marginAt = (t: number) => margin(body, skyAt(eph, obs, t), mask, earthOptions);
  const end = Math.min(startTdb + hours * 3600, coverage(eph).lastTdb);
  const events: SkyEvent[] = [];

  let t0 = startTdb;
  let m0 = marginAt(t0);
  while (t0 < end) {
    const t1 = Math.min(t0 + STEP_S, end);
    const m1 = marginAt(t1);
    if (m0 > 0 !== m1 > 0) {
      // Bisection: keep the half where the sign change is.
      let a = t0;
      let b = t1;
      while (b - a > PRECISION_S) {
        const mid = (a + b) / 2;
        if (marginAt(mid) > 0 === m0 > 0) a = mid;
        else b = mid;
      }
      const tdb = (a + b) / 2;
      events.push({ kind: eventKind(body, m1 > 0), tdb, time_utc: tdbToIso(tdb) });
    }
    t0 = t1;
    m0 = m1;
  }
  return removeFlicker(events);
}

/** Low and high versions of a mask; if M3 has not supplied them, shift by +/-0.1 deg. */
export function maskEdges(mask: HorizonMask): { lo: HorizonMask; hi: HorizonMask; assumed: boolean } {
  const assumed = !mask.elev_lo_deg || !mask.elev_hi_deg;
  const lo = mask.elev_lo_deg ?? mask.elev_deg.map((e) => e - ASSUMED_HORIZON_ERROR_DEG);
  const hi = mask.elev_hi_deg ?? mask.elev_deg.map((e) => e + ASSUMED_HORIZON_ERROR_DEG);
  return {
    lo: { ...mask, elev_deg: lo },
    hi: { ...mask, elev_deg: hi },
    assumed,
  };
}

/** The event of the same kind closest in time to `target`, if within MATCH_S. */
function matching(events: SkyEvent[], target: SkyEvent): SkyEvent | undefined {
  let best: SkyEvent | undefined;
  for (const e of events) {
    if (e.kind !== target.kind || Math.abs(e.tdb - target.tdb) > MATCH_S) continue;
    if (!best || Math.abs(e.tdb - target.tdb) < Math.abs(best.tdb - target.tdb)) best = e;
  }
  return best;
}

/** "2026-11-15T03:12Z": rounded to the minute, which is the precision we have. */
export function formatMinuteUtc(tdb: number): string {
  const ms = Math.round(tdbToUnixMs(tdb) / 60_000) * 60_000; // round in UTC, not TDB
  return new Date(ms).toISOString().slice(0, 16) + "Z";
}

function bodyOutlook(
  eph: Ephemeris,
  obs: Observer,
  masks: { best: HorizonMask; lo: HorizonMask; hi: HorizonMask },
  body: Body,
  startTdb: number,
  hours: number,
  earthOptions: EarthOptions,
): BodyOutlook {
  const isUp = margin(body, skyAt(eph, obs, startTdb), masks.best, earthOptions) > 0;
  const events = findEvents(eph, obs, masks.best, body, startTdb, hours, earthOptions);
  const first = events[0];
  if (!first) return { is_up: isUp, next: null, events };

  const others = [masks.lo, masks.hi]
    .map((m) => matching(findEvents(eph, obs, m, body, startTdb, hours, earthOptions), first))
    .filter((e): e is SkyEvent => e !== undefined);
  const times = [first.tdb, ...others.map((e) => e.tdb)];
  const toHours = (t: number) => (t - startTdb) / 3600;
  const earliest = toHours(Math.min(...times));
  const latest = toHours(Math.max(...times));

  return {
    is_up: isUp,
    events,
    next: {
      event: first.kind,
      nominal_hours: toHours(first.tdb),
      earliest_hours: earliest,
      latest_hours: latest,
      uncertainty_hours: (latest - earliest) / 2,
      formatted_target_utc: formatMinuteUtc(first.tdb),
      window_only: Math.abs(obs.lat_deg) > WINDOW_ONLY_LAT_DEG,
    },
  };
}

/** Countdowns for the Sun and Earth from a start time, searching `hours` ahead (default 60 days). */
export function outlook(
  eph: Ephemeris,
  obs: Observer,
  mask: HorizonMask,
  startTdb: number,
  hours: number = DEFAULT_SEARCH_HOURS,
  earthOptions: EarthOptions = DEFAULT_EARTH_OPTIONS,
): Outlook {
  const { lo, hi, assumed } = maskEdges(mask);
  const masks = { best: mask, lo, hi };
  const searched = (Math.min(startTdb + hours * 3600, coverage(eph).lastTdb) - startTdb) / 3600;
  return {
    sun: bodyOutlook(eph, obs, masks, "sun", startTdb, hours, earthOptions),
    earth: bodyOutlook(eph, obs, masks, "earth", startTdb, hours, earthOptions),
    searched_hours: searched,
    horizon_uncertainty: assumed ? "assumed" : "from mask",
  };
}
