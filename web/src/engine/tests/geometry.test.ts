import { describe, expect, it } from "vitest";
import {
  MOON_RADIUS_KM,
  angularRadiusDeg,
  azimuthElevation,
  bodyPosition,
  makeObserver,
  sitePositionKm,
  skyAt,
} from "../geometry";
import { isoToTdb } from "../time";
import { norm, type Vec3 } from "../vec3";
import { loadEphemerisFromDisk } from "./loadFromDisk";

const FAR_KM = 1e12;
const eph = loadEphemerisFromDisk();

/** Azimuth difference the short way round the compass, scaled to a real sky distance. */
function azGapOnSky(a: number, b: number, elDeg: number): number {
  const gap = ((a - b + 540) % 360) - 180;
  return Math.abs(gap) * Math.cos((elDeg * Math.PI) / 180);
}

describe("simple cases (same as pipeline/tests/test_geometry.py)", () => {
  it("site radius includes ground and mast heights, in km", () => {
    const obs = makeObserver(0, 0, 1000, 2);
    expect(norm(sitePositionKm(obs))).toBeCloseTo(MOON_RADIUS_KM + 1.002, 9);
  });

  it("a body straight overhead at the equator is at elevation 90", () => {
    const { el_deg } = azimuthElevation([FAR_KM, 0, 0], makeObserver(0, 0));
    expect(el_deg).toBeCloseTo(90, 9);
  });

  const compass: [Vec3, number][] = [
    [[0, 0, 1], 0],
    [[0, 1, 0], 90],
    [[0, 0, -1], 180],
    [[0, -1, 0], 270],
  ];
  for (const [direction, expectedAz] of compass) {
    it(`direction ${direction} is azimuth ${expectedAz} on the horizon`, () => {
      const { az_deg, el_deg } = azimuthElevation(direction, makeObserver(0, 0));
      expect(az_deg).toBeCloseTo(expectedAz, 9);
      expect(el_deg).toBeCloseTo(0, 9);
    });
  }

  it("at 90 S, azimuth is measured from the 0 deg meridian", () => {
    const { az_deg } = azimuthElevation([1, 0, 0], makeObserver(-90, 0));
    expect(az_deg).toBeCloseTo(0, 9);
  });
});

describe("Earth parallax (F3)", () => {
  const cases: [number, number][] = [
    [356_400, 0.279],
    [406_700, 0.245],
  ];
  for (const [distKm, drop] of cases) {
    it(`Earth on the centre's horizon at ${distKm} km appears ${drop} deg lower`, () => {
      const view = bodyPosition([0, distKm, 0], 6378.137, makeObserver(0, 0, 0, 0));
      expect(Math.abs(-view.el_deg - drop)).toBeLessThan(0.001);
    });
  }
});

describe("disc sizes (F15)", () => {
  it("Sun 0.533 deg at 1 AU, Earth 1.80-2.05 deg", () => {
    expect(2 * angularRadiusDeg(695_700, 149_597_870.7)).toBeCloseTo(0.533, 3);
    expect(2 * angularRadiusDeg(6378.137, 406_700)).toBeCloseTo(1.8, 2);
    expect(2 * angularRadiusDeg(6378.137, 356_400)).toBeCloseTo(2.05, 2);
  });
});

// Python answers (pipeline/geometry.py with SPICE), printed on 2026-11-13.
// The full 1,000-case golden file (V2) replaces this list next.
const PYTHON = [
  { utc: "2026-11-14T09:00:00Z", obs: makeObserver(0.67408, 23.47297),
    sun: [91.473232, -8.589439], earth: [277.948359, 64.47748], sep: 123.924095 },
  { utc: "2026-11-14T09:20:00Z", obs: makeObserver(-89.4395, -137.1934, 1958.6),
    sun: [259.056692, 1.450296], earth: [135.396563, -4.6416], sep: 123.663804 },
  { utc: "2027-08-03T17:45:00Z", obs: makeObserver(-80.13, 1.44, 2592.0),
    sun: [162.606472, -9.433215], earth: [1.550591, 7.431184], sep: 161.156882 },
  { utc: "2031-01-15T03:10:00Z", obs: makeObserver(-45.4446, 177.5991),
    sun: [98.508343, -9.922041], earth: [173.2991, -50.237037], sep: 72.67796 },
];

describe("skyAt matches the Python reference within 0.001 deg", () => {
  for (const c of PYTHON) {
    it(`${c.utc} at (${c.obs.lat_deg}, ${c.obs.lon_deg})`, () => {
      const view = skyAt(eph, c.obs, isoToTdb(c.utc));
      expect(Math.abs(view.sun.el_deg - c.sun[1])).toBeLessThan(0.001);
      expect(Math.abs(view.earth.el_deg - c.earth[1])).toBeLessThan(0.001);
      expect(azGapOnSky(view.sun.az_deg, c.sun[0], view.sun.el_deg)).toBeLessThan(0.001);
      expect(azGapOnSky(view.earth.az_deg, c.earth[0], view.earth.el_deg)).toBeLessThan(0.001);
      expect(Math.abs(view.sun_earth_sep_deg - c.sep)).toBeLessThan(0.001);
    });
  }
});
