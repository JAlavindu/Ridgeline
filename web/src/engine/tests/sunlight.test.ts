import { describe, expect, it } from "vitest";
import { makeObserver, skyAt, type BodyPosition } from "../geometry";
import { flatMask, horizonAt, type HorizonMask } from "../mask";
import { discFractionAbove, eclipseFraction, irradianceWm2, sunTerrainFraction, sunlight } from "../sunlight";
import { isoToTdb } from "../time";
import { loadEphemerisFromDisk, loadMaskFromDisk } from "./loadFromDisk";

const eph = loadEphemerisFromDisk();
const SUN_R = 0.267;

/** A Sun at a chosen azimuth and height (for hand-made cases). */
function sunAt(az_deg: number, el_deg: number): BodyPosition {
  return { az_deg, el_deg, dist_km: 149_597_870.7, angular_radius_deg: SUN_R };
}

/** A made-up mask whose horizon height is given by a function of azimuth. */
function maskFrom(height: (az: number) => number): HorizonMask {
  const elev_deg = Array.from({ length: 1440 }, (_, i) => height(i * 0.25));
  return { az_step_deg: 0.25, elev_deg, elev_lo_deg: null, elev_hi_deg: null, observer_height_m: 2 };
}

describe("horizon masks", () => {
  it("M3's Connecting Ridge mask has 1440 values at 0.25 deg", () => {
    const mask = loadMaskFromDisk("connecting_ridge");
    expect(mask.elev_deg.length).toBe(1440);
  });

  it("blends between samples and wraps past 360 deg", () => {
    const mask = maskFrom((az) => az / 100); // 0 at north, rising to 3.5975 at 359.75
    expect(horizonAt(mask, 10.125)).toBeCloseTo(0.10125, 9);
    expect(horizonAt(mask, 359.875)).toBeCloseTo((3.5975 + 0) / 2, 9);
    expect(horizonAt(mask, -0.125)).toBeCloseTo(horizonAt(mask, 359.875), 9);
  });

  it("smooth Moon: a 2 m mast sees the horizon 0.087 deg below level (plan section 6.3)", () => {
    expect(horizonAt(flatMask(makeObserver(0, 0)), 123)).toBeCloseTo(-0.087, 3);
  });
});

describe("F11: visible part of the Sun's disc", () => {
  it("is 1/2 when the centre is on the horizon, 1 above, 0 below", () => {
    expect(discFractionAbove(0, SUN_R)).toBeCloseTo(0.5, 12);
    expect(discFractionAbove(SUN_R, SUN_R)).toBe(1);
    expect(discFractionAbove(-SUN_R, SUN_R)).toBe(0);
  });

  it("grows smoothly as the Sun rises", () => {
    let previous = -1;
    for (let el = -0.3; el <= 0.3; el += 0.01) {
      const f = discFractionAbove(el, SUN_R);
      expect(f).toBeGreaterThanOrEqual(previous);
      previous = f;
    }
  });

  it("is still 1/2 when the centre sits on a sloping ridge line", () => {
    const ridge = maskFrom((az) => 0.5 * (az - 180)); // rises 0.5 deg per deg of azimuth
    expect(sunTerrainFraction(sunAt(180, 0), ridge)).toBeCloseTo(0.5, 6);
  });

  it("a sloping horizon cuts the disc less deeply than a flat one at the same height gap", () => {
    const flat = maskFrom(() => 0);
    const ridge = maskFrom((az) => 2 * (az - 180));
    const sun = sunAt(180, 0.15);
    expect(sunTerrainFraction(sun, ridge)).toBeLessThan(sunTerrainFraction(sun, flat));
    expect(sunTerrainFraction(sun, ridge)).toBeGreaterThan(0.5);
  });
});

describe("F12: Earth covering the Sun", () => {
  it("no effect when far apart; Sun fully hidden when centred", () => {
    expect(eclipseFraction(5, 0.267, 0.95)).toBe(1);
    expect(eclipseFraction(0, 0.267, 0.95)).toBe(0);
    expect(eclipseFraction(0.95 - 0.267, 0.267, 0.95)).toBe(0);
  });

  it("is continuous at both edges of the partial phase", () => {
    expect(eclipseFraction(0.267 + 0.95 - 1e-9, 0.267, 0.95)).toBeCloseTo(1, 6);
    expect(eclipseFraction(0.95 - 0.267 + 1e-9, 0.267, 0.95)).toBeCloseTo(0, 6);
  });

  it("V7: total lunar eclipse of 2025-03-14, Sun fully hidden 06:30-07:25 UT at (0, 0)", () => {
    const obs = makeObserver(0, 0);
    for (const utc of ["2025-03-14T06:30:00Z", "2025-03-14T07:00:00Z", "2025-03-14T07:25:00Z"]) {
      const view = skyAt(eph, obs, isoToTdb(utc));
      const light = sunlight(view.sun, view.earth, view.sun_earth_sep_deg, flatMask(obs));
      expect(light.eclipse_fraction).toBe(0);
      expect(light.irradiance_w_m2).toBe(0);
    }
  });

  it("no eclipse a day earlier", () => {
    const obs = makeObserver(0, 0);
    const view = skyAt(eph, obs, isoToTdb("2025-03-13T07:00:00Z"));
    expect(eclipseFraction(view.sun_earth_sep_deg, view.sun.angular_radius_deg, view.earth.angular_radius_deg)).toBe(1);
  });
});

describe("F13: sunlight strength", () => {
  it("is 1361 W/m2 at 1 AU and scales with distance squared", () => {
    expect(irradianceWm2(149_597_870.7, 1)).toBeCloseTo(1361, 9);
    expect(irradianceWm2(2 * 149_597_870.7, 1)).toBeCloseTo(1361 / 4, 9);
    expect(irradianceWm2(149_597_870.7, 0.5)).toBeCloseTo(680.5, 9);
  });

  it("stays within about 1316-1408 W/m2 over the year (plan F13)", () => {
    // The plan's range is for Earth's distance. The Moon is up to 384,400 km nearer or
    // farther from the Sun than Earth (about 0.3%), so allow 4 W/m2 either side.
    for (let month = 1; month <= 12; month++) {
      const utc = `2027-${String(month).padStart(2, "0")}-15T00:00:00Z`;
      const view = skyAt(eph, makeObserver(0, 0), isoToTdb(utc));
      const s = irradianceWm2(view.sun.dist_km, 1);
      expect(s).toBeGreaterThan(1316 - 4);
      expect(s).toBeLessThan(1408 + 4);
    }
  });
});
