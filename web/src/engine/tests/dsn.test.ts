import { describe, expect, it } from "vitest";
import { DSN_LIMITS, dsnContact, dsnContactPercent, dsnElevationsAt } from "../dsn";
import { makeObserver } from "../geometry";
import { sampleSeries } from "../series";
import { isoToTdb } from "../time";
import { loadDsnFromDisk, loadEphemerisFromDisk, loadMaskFromDisk } from "./loadFromDisk";

const dsn = loadDsnFromDisk();

describe("DSN data", () => {
  it("has 3 stations and 10-minute steps from 2023 to 2033", () => {
    expect(dsn.meta.stations.map((s) => s.id)).toEqual(["DSS-14", "DSS-63", "DSS-43"]);
    expect(dsn.meta.step_s).toBe(600);
    expect(dsn.data.length).toBe(dsn.meta.count * 3);
  });

  it("every elevation is a real angle", () => {
    let lowest = Infinity;
    let highest = -Infinity;
    for (const value of dsn.data) {
      if (value < lowest) lowest = value;
      if (value > highest) highest = value;
    }
    expect(lowest / dsn.meta.scale).toBeGreaterThanOrEqual(-90);
    expect(highest / dsn.meta.scale).toBeLessThanOrEqual(90);
  });

  it("matches the Python/SPICE values for 2026-11-14 09:00 UTC", () => {
    const [goldstone, madrid, canberra] = dsnElevationsAt(dsn, isoToTdb("2026-11-14T09:00:00Z"));
    expect(Math.abs(goldstone - -56.112)).toBeLessThan(0.02);
    expect(Math.abs(madrid - -28.375)).toBeLessThan(0.02);
    expect(Math.abs(canberra - 47.55)).toBeLessThan(0.02);
  });

  it("blends linearly between samples", () => {
    const t = dsn.meta.start_tdb_s + 100 * dsn.meta.step_s;
    const a = dsnElevationsAt(dsn, t)[0];
    const b = dsnElevationsAt(dsn, t + dsn.meta.step_s)[0];
    expect(dsnElevationsAt(dsn, t + dsn.meta.step_s / 2)[0]).toBeCloseTo((a + b) / 2, 2);
  });

  it("refuses times outside 2023-2032", () => {
    expect(() => dsnElevationsAt(dsn, isoToTdb("2020-01-01T00:00:00Z"))).toThrow(RangeError);
    expect(() => dsnElevationsAt(dsn, isoToTdb("2040-01-01T00:00:00Z"))).toThrow(RangeError);
  });
});

describe("DSN contact", () => {
  it("needs Earth visible from the lander as well as a station", () => {
    const t = isoToTdb("2026-11-14T09:00:00Z"); // Canberra sees the Moon at 47 deg
    expect(dsnContact(dsn, t, true, DSN_LIMITS.receive).contact).toBe(true);
    expect(dsnContact(dsn, t, false, DSN_LIMITS.receive).contact).toBe(false);
    expect(dsnContact(dsn, t, true, DSN_LIMITS.receive).stations.map((s) => s.id)).toEqual(["DSS-43"]);
  });

  it("a stricter limit never gives more contact", () => {
    const eph = loadEphemerisFromDisk();
    const mask = loadMaskFromDisk("apollo11");
    const series = sampleSeries(
      eph,
      makeObserver(0.67408, 23.47297),
      mask,
      isoToTdb("2026-11-14T09:00:00Z"),
      14 * 24,
    );
    const low = dsnContactPercent(dsn, series, DSN_LIMITS.receive);
    const high = dsnContactPercent(dsn, series, DSN_LIMITS.command_high);
    expect(low).toBeGreaterThan(90);
    expect(high).toBeLessThanOrEqual(low);
  });
});
