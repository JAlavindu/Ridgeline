import { describe, expect, it } from "vitest";
import { skyState } from "../conditions";
import { earthVisibility } from "../earth";
import { makeObserver, skyAt, type BodyPosition } from "../geometry";
import { flatMask } from "../mask";
import { isoToTdb } from "../time";
import { loadEphemerisFromDisk, loadMaskFromDisk } from "./loadFromDisk";

const eph = loadEphemerisFromDisk();

/** Every 6 hours through 2027 (a full year covers every libration). */
const YEAR_2027 = Array.from({ length: 365 * 4 }, (_, i) => isoToTdb("2027-01-01T00:00:00Z") + i * 6 * 3600);

describe("F16: Earth visibility rules", () => {
  const earth: BodyPosition = { az_deg: 0, el_deg: -0.5, dist_km: 384_400, angular_radius_deg: 0.95 };
  const flat = flatMask(makeObserver(-89, 0, 0, 0));

  it("centre rule: centre below the horizon means not visible", () => {
    expect(earthVisibility(earth, flat).visible).toBe(false);
  });

  it("any-part rule: the top of the disc still shows", () => {
    expect(earthVisibility(earth, flat, { rule: "any_part", margin_deg: 0 }).visible).toBe(true);
  });

  it("a safety margin raises the bar", () => {
    const high: BodyPosition = { ...earth, el_deg: 1 };
    expect(earthVisibility(high, flat).visible).toBe(true);
    expect(earthVisibility(high, flat, { rule: "centre", margin_deg: 2 }).visible).toBe(false);
  });
});

describe("plan checks V5 and V6 (smooth Moon, whole year)", () => {
  it("V5: at (0, 0) Earth is always up, at least about 79 deg high", () => {
    const obs = makeObserver(0, 0);
    const lowest = Math.min(...YEAR_2027.map((t) => skyAt(eph, obs, t).earth.el_deg));
    expect(lowest).toBeGreaterThan(79);
  });

  it("V6: at Chang'e-4 (far side) Earth is never visible; centre about -37 to -53 deg", () => {
    const obs = makeObserver(-45.4446, 177.5991);
    const mask = flatMask(obs);
    const heights = YEAR_2027.map((t) => skyAt(eph, obs, t).earth.el_deg);
    expect(YEAR_2027.some((t) => skyState(eph, obs, mask, t).is_earth_visible)).toBe(false);
    expect(Math.max(...heights)).toBeLessThan(-36);
    expect(Math.min(...heights)).toBeGreaterThan(-54);
  });
});

describe("skyState with M3's real terrain", () => {
  it("Apollo 11 before sunrise on 2026-11-14: dark, Earth high in the west", () => {
    const obs = makeObserver(0.67408, 23.47297);
    const state = skyState(eph, obs, flatMask(obs), isoToTdb("2026-11-14T09:00:00Z"));
    expect(state.is_sun_visible).toBe(false);
    expect(state.solar_flux_w_m2).toBe(0);
    expect(state.is_earth_visible).toBe(true);
    expect(state.sun_elevation_rate_deg_per_hr).toBeGreaterThan(0.4); // rising about 0.5 deg/h
  });

  it("Connecting Ridge: results are in range and the terrain is the real mask", () => {
    const mask = loadMaskFromDisk("connecting_ridge");
    const obs = makeObserver(-89.4395, -137.1934, mask.site_height_m ?? 0);
    for (let day = 0; day < 30; day++) {
      const state = skyState(eph, obs, mask, isoToTdb("2026-11-14T00:00:00Z") + day * 86400);
      expect(state.sun_visible_fraction).toBeGreaterThanOrEqual(0);
      expect(state.sun_visible_fraction).toBeLessThanOrEqual(1);
      expect(state.terrain_elev_at_sun_az).toBeLessThan(0); // this ridge sees over everything
      expect(state.is_sun_visible).toBe(state.solar_flux_w_m2 > 0);
    }
  });
});
