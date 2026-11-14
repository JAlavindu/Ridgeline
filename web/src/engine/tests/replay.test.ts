import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { makeObserver } from "../geometry";
import { outlook } from "../events";
import { isoToTdb } from "../time";
import { loadEphemerisFromDisk, loadMaskFromDisk } from "./loadFromDisk";

/*
 * The replay panel recomputes IM-1, Chandrayaan-3 and IM-2 live in the browser.
 * pipeline/replays.py computes the same windows in Python (10-minute steps).
 * The browser's sunset/sunrise must agree with Python within 1 hour.
 */

interface PyDark { from: string; to: string }
interface Mission {
  id: string;
  landing_utc: string;
  window: { start: string; end: string };
  python: Record<string, { dark_periods: PyDark[] }>;
  sites: Record<string, { lat: number; lon: number; height_m: number; mask: string }>;
}

const replays = JSON.parse(
  readFileSync(new URL("../../../public/data/replays.json", import.meta.url), "utf8"),
) as { missions: Mission[] };
const eph = loadEphemerisFromDisk();
const hoursApart = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 3_600_000;

function browserEvents(m: Mission, siteId: string) {
  const s = m.sites[siteId];
  const mask = loadMaskFromDisk(s.mask);
  const obs = makeObserver(s.lat, s.lon, mask.site_height_m ?? 0);
  const hours = (Date.parse(m.window.end) - Date.parse(m.landing_utc)) / 3_600_000;
  return outlook(eph, obs, mask, isoToTdb(m.landing_utc), hours).sun.events;
}

describe("replays: browser vs Python", () => {
  for (const id of ["im1", "chandrayaan3"]) {
    const m = replays.missions.find((x) => x.id === id)!;
    for (const siteId of Object.keys(m.python)) {
      it(`${siteId}: first sunset after landing matches within 1 hour`, () => {
        const python = m.python[siteId].dark_periods.find((p) => p.from > m.landing_utc)!;
        const sunset = browserEvents(m, siteId).find((e) => e.kind === "sunset")!;
        expect(sunset).toBeDefined();
        expect(hoursApart(sunset.time_utc, python.from)).toBeLessThan(1);
      });
    }
  }

  it("chandrayaan3_isro: next sunrise matches within 1 hour", () => {
    const m = replays.missions.find((x) => x.id === "chandrayaan3")!;
    const python = m.python.chandrayaan3_isro.dark_periods.find((p) => p.from > m.landing_utc)!;
    const sunrise = browserEvents(m, "chandrayaan3_isro").find((e) => e.kind === "sunrise")!;
    expect(hoursApart(sunrise.time_utc, python.to)).toBeLessThan(1);
  });
});
