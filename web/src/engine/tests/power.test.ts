import { describe, expect, it } from "vitest";
import { makeObserver } from "../geometry";
import { meanPanelIrradiance, panelFactor } from "../power";
import { sampleSeries } from "../series";
import { isoToTdb } from "../time";
import { loadEphemerisFromDisk, loadMaskFromDisk } from "./loadFromDisk";

describe("panelFactor (F14)", () => {
  it("Sun 30 deg high in the east", () => {
    expect(panelFactor(90, 30, "tracking")).toBe(1);
    expect(panelFactor(90, 30, "vertical-rotating")).toBeCloseTo(Math.cos(Math.PI / 6), 12);
    expect(panelFactor(90, 30, "vertical-fixed", 90)).toBeCloseTo(Math.cos(Math.PI / 6), 12);
    expect(panelFactor(90, 30, "vertical-fixed", 0)).toBeCloseTo(0, 12);
    expect(panelFactor(90, 30, "vertical-fixed", 270)).toBe(0);
    expect(panelFactor(90, 30, "flat")).toBeCloseTo(0.5, 12);
  });

  it("no light on any panel when the Sun is down", () => {
    for (const p of ["tracking", "vertical-rotating", "vertical-fixed", "flat"] as const) {
      expect(panelFactor(0, -5, p)).toBe(0);
    }
  });

  it("near the pole a flat panel gets far less than a tracking one", () => {
    const eph = loadEphemerisFromDisk();
    const mask = loadMaskFromDisk("connecting_ridge");
    const s = sampleSeries(eph, makeObserver(-89.4395, 222.8066, mask.site_height_m ?? 0), mask,
      isoToTdb("2026-12-01T00:00:00Z"), 14 * 24, 60);
    const mean = s.irradiance_w_m2.reduce((a, b) => a + b, 0) / s.tdb.length;
    expect(meanPanelIrradiance(s, "tracking")).toBeCloseTo(mean, 9);
    expect(meanPanelIrradiance(s, "flat")).toBeLessThan(0.05 * mean);
  });
});
