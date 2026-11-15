import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { angularRadiusDeg, EARTH_RADIUS_KM, makeObserver, skyAt, SUN_RADIUS_KM } from "../geometry";
import { isoToTdb } from "../time";
import { loadEphemerisFromDisk } from "./loadFromDisk";
import { azGapOnSky } from "./skyGap";

/*
 * V2: the browser engine vs the Python/SPICE reference.
 * pipeline/golden.py writes 1,000 cases (random sites, heights and times, many between
 * hours, plus edge cases). Every answer must agree within 0.001 deg.
 */

interface Case {
  id: number;
  group: string;
  lat: number;
  lon: number;
  ground_m: number;
  mast_m: number;
  utc: string;
  tdb_s: number;
  sun_az: number;
  sun_el: number;
  earth_az: number;
  earth_el: number;
  sep: number;
  sun_r: number;
  earth_r: number;
}

const goldenUrl = new URL("./golden_v2.json", import.meta.url);
const goldenBytes = readFileSync(goldenUrl);
const golden = JSON.parse(goldenBytes.toString("utf8")) as { tolerance_deg: number; count: number; cases: Case[] };
const eph = loadEphemerisFromDisk();
const TOL = golden.tolerance_deg;
// The browser uses a fixed TDB-UTC offset (69.184 s). SPICE's TDB also has a periodic
// term of up to 1.657 ms (TDB vs TT). 2 ms of clock error moves the Sun by about 2e-7 deg.
const TIME_TOL_S = 0.002;

describe("V2: browser engine vs Python golden file", () => {
  it("has 1,000 cases", () => {
    expect(golden.cases.length).toBe(1000);
    expect(golden.count).toBe(1000);
  });

  it("every case agrees within 0.001 deg", () => {
    const worst = { sun_el: 0, sun_az: 0, earth_el: 0, earth_az: 0, sep: 0, radius: 0, time_s: 0 };
    const worstId = { sun_el: -1, sun_az: -1, earth_el: -1, earth_az: -1, sep: -1, radius: -1, time_s: -1 };
    const failures: string[] = [];

    const note = (key: keyof typeof worst, value: number, c: Case) => {
      if (value > worst[key]) {
        worst[key] = value;
        worstId[key] = c.id;
      }
    };

    for (const c of golden.cases) {
      const obs = makeObserver(c.lat, c.lon, c.ground_m, c.mast_m);
      const tdb = isoToTdb(c.utc);
      const v = skyAt(eph, obs, tdb);
      const atPole = Math.abs(c.lat) > 89.9999;

      const gaps = {
        sun_el: Math.abs(v.sun.el_deg - c.sun_el),
        earth_el: Math.abs(v.earth.el_deg - c.earth_el),
        sun_az: atPole ? 0 : azGapOnSky(v.sun.az_deg, c.sun_az, v.sun.el_deg),
        earth_az: atPole ? 0 : azGapOnSky(v.earth.az_deg, c.earth_az, v.earth.el_deg),
        sep: Math.abs(v.sun_earth_sep_deg - c.sep),
        radius: Math.max(
          Math.abs(angularRadiusDeg(SUN_RADIUS_KM, v.sun.dist_km) - c.sun_r),
          Math.abs(angularRadiusDeg(EARTH_RADIUS_KM, v.earth.dist_km) - c.earth_r),
        ),
      };
      const timeGap = Math.abs(tdb - c.tdb_s);

      for (const key of Object.keys(gaps) as (keyof typeof gaps)[]) note(key, gaps[key], c);
      note("time_s", timeGap, c);

      const bad = (Object.entries(gaps) as [string, number][]).filter(([, g]) => !(g < TOL));
      if (bad.length > 0 || !(timeGap < TIME_TOL_S)) {
        failures.push(`#${c.id} ${c.group} (${c.lat}, ${c.lon}) ${c.utc}: ` +
          bad.map(([k, g]) => `${k} ${g.toFixed(5)}`).join(", ") + ` time ${timeGap.toFixed(4)} s`);
      }
    }

    // Summary for pipeline/validate.py (run_v2)
    const worstAngle = Math.max(worst.sun_el, worst.sun_az, worst.earth_el, worst.earth_az, worst.sep, worst.radius);
    const outDir = new URL("../../../../docs/validation/", import.meta.url);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      new URL("v2_result.json", outDir),
      JSON.stringify({
        cases: golden.cases.length,
        tolerance_deg: TOL,
        time_tolerance_s: TIME_TOL_S,
        worst_gap_deg: worstAngle,
        worst_by_quantity_deg: worst,
        worst_case_id_by_quantity: worstId,
        failures: failures.length,
        golden_sha256: createHash("sha256").update(goldenBytes).digest("hex"),
      }, null, 2) + "\n",
    );

    expect(failures.slice(0, 10)).toEqual([]);
    expect(worstAngle).toBeLessThan(TOL);
    expect(worst.time_s).toBeLessThan(TIME_TOL_S);
  });
});
