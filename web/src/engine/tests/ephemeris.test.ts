import { describe, expect, it } from "vitest";
import { bodyPositionsAt, parseEphemeris } from "../ephemeris";
import { isoToTdb } from "../time";
import { angleBetweenDeg, norm, type Vec3 } from "../vec3";
import { loadEphemerisFromDisk } from "./loadFromDisk";

const eph = loadEphemerisFromDisk();

// SPICE answers (spkpos, MOON_ME, CN+S, from MOON), printed by Python on 2026-11-12.
const SPICE = {
  "2026-11-14T09:00:00Z": {
    sun: { dir: [-0.530418828, 0.847299999, -0.027176787] as Vec3, km: 147_794_383.423 },
    earth: { dir: [0.997084463, -0.030439171, 0.069971643] as Vec3, km: 405_370.872 },
  },
  "2026-11-14T09:30:00Z": {
    sun: { dir: [-0.526659031, 0.849642095, -0.027176735] as Vec3, km: 147_794_992.11 },
    earth: { dir: [0.997096247, -0.030945643, 0.069580461] as Vec3, km: 405_356.186 },
  },
};

describe("ephemeris file", () => {
  it("has 87,673 hours of 8 values", () => {
    expect(eph.meta.count).toBe(87_673);
    expect(eph.data.length).toBe(87_673 * 8);
    expect(eph.meta.frame).toBe("MOON_ME");
  });

  it("rejects a file of the wrong size", () => {
    expect(() => parseEphemeris(eph.meta, new ArrayBuffer(100))).toThrow(/expected/);
  });
});

describe("bodyPositionsAt", () => {
  for (const [utc, truth] of Object.entries(SPICE)) {
    it(`matches SPICE at ${utc}`, () => {
      const p = bodyPositionsAt(eph, isoToTdb(utc));
      expect(angleBetweenDeg(p.sun, truth.sun.dir)).toBeLessThan(0.0005);
      expect(angleBetweenDeg(p.earth, truth.earth.dir)).toBeLessThan(0.0005);
      expect(Math.abs(norm(p.sun) - truth.sun.km)).toBeLessThan(50);
      expect(Math.abs(norm(p.earth) - truth.earth.km)).toBeLessThan(1);
    });
  }

  it("works on the very first and very last hour", () => {
    expect(() => bodyPositionsAt(eph, isoToTdb("2023-01-01T00:00:00Z"))).not.toThrow();
    expect(() => bodyPositionsAt(eph, isoToTdb("2033-01-01T00:00:00Z"))).not.toThrow();
  });

  it("gives a clear error outside 2023-2032", () => {
    expect(() => bodyPositionsAt(eph, isoToTdb("2022-12-31T23:00:00Z"))).toThrow(RangeError);
    expect(() => bodyPositionsAt(eph, isoToTdb("2033-01-01T01:00:00Z"))).toThrow(/between/);
    expect(() => bodyPositionsAt(eph, isoToTdb("1969-07-20T20:17:40Z"))).toThrow(RangeError);
    expect(() => bodyPositionsAt(eph, Number.NaN)).toThrow(RangeError);
  });

  it("changes smoothly (no jump at the hour)", () => {
    const t = isoToTdb("2027-03-01T12:00:00Z");
    const before = bodyPositionsAt(eph, t - 1);
    const after = bodyPositionsAt(eph, t + 1);
    expect(angleBetweenDeg(before.sun, after.sun)).toBeLessThan(0.001);
    expect(angleBetweenDeg(before.earth, after.earth)).toBeLessThan(0.001);
  });
});
