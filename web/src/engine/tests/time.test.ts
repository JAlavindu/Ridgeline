import { describe, expect, it } from "vitest";
import { isoToTdb, tdbToIso, tdbToUnixMs, unixMsToTdb } from "../time";

describe("time", () => {
  it("matches the plan's anchor: 2026-11-14T09:00Z = 847918869.184 s TDB", () => {
    expect(isoToTdb("2026-11-14T09:00:00Z")).toBeCloseTo(847_918_869.184, 3);
  });

  it("is within 0.002 s of SPICE (847918869.1827 s)", () => {
    expect(Math.abs(isoToTdb("2026-11-14T09:00:00Z") - 847_918_869.1827)).toBeLessThan(0.002);
  });

  it("gives the ephemeris start time (2023-01-01, SPICE 725803269.1839 s)", () => {
    expect(Math.abs(isoToTdb("2023-01-01T00:00:00Z") - 725_803_269.1839)).toBeLessThan(0.002);
  });

  it("understands other time zones (Sri Lanka is +05:30)", () => {
    expect(isoToTdb("2026-11-14T14:30:00+05:30")).toBeCloseTo(isoToTdb("2026-11-14T09:00:00Z"), 6);
  });

  it("round-trips", () => {
    expect(tdbToIso(isoToTdb("2031-06-30T18:30:00Z"))).toBe("2031-06-30T18:30:00.000Z");
    const ms = Date.UTC(2028, 1, 29, 12, 0, 0);
    expect(tdbToUnixMs(unixMsToTdb(ms))).toBeCloseTo(ms, 3);
  });

  it("refuses a time without a time zone", () => {
    expect(() => isoToTdb("2026-11-14T09:00:00")).toThrow(/time zone/);
  });

  it("refuses nonsense", () => {
    expect(() => isoToTdb("yesterday Z")).toThrow(/valid date/);
  });
});
