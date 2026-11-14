import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeCustomHorizon, customMask, parsePolarDem, sampleHeight } from "../customHorizon";

const dataDir = new URL("../../../public/data/", import.meta.url);
const dem = parsePolarDem(
  JSON.parse(readFileSync(new URL("dem_polar_500m.json", dataDir), "utf8")),
  new Uint8Array(readFileSync(new URL("dem_polar_500m.bin", dataDir))).buffer,
);
const golden = JSON.parse(readFileSync(new URL("./custom_horizon_golden.json", import.meta.url), "utf8")) as {
  cases: { name: string; lat: number; lon: number; h_obs: number; site_height_m: number; elev_deg: number[] }[];
};

describe("custom-coordinate horizon matches Python (pipeline/custom_golden.py)", () => {
  for (const c of golden.cases) {
    it(`${c.name}: every direction within 0.001 deg`, () => {
      const h = computeCustomHorizon(dem, c.lat, c.lon, c.h_obs)!;
      expect(h).not.toBeNull();
      expect(Math.abs(h.siteHeightM - c.site_height_m)).toBeLessThan(0.01);
      let worst = 0;
      c.elev_deg.forEach((v, i) => {
        worst = Math.max(worst, Math.abs(h.raw[i] - v));
      });
      expect(worst).toBeLessThan(0.001);
    });
  }
});

describe("polar terrain sampling", () => {
  it("matches M3's check values in dem_polar_500m.json", () => {
    // M3's check: Connecting Ridge, nearest pixel 1934 m (bilinear lands close to it)
    expect(Math.abs(sampleHeight(dem, 222.8066, -89.4395) - 1934)).toBeLessThan(40);
  });

  it("returns null outside the map (north of about 75 S)", () => {
    expect(computeCustomHorizon(dem, -60, 0)).toBeNull();
  });

  it("the engine mask never uses -90 and labels itself approximate", () => {
    const r = customMask(dem, -86, 90)!;
    expect(r.mask.label).toBe("approximate");
    expect(Math.min(...r.mask.elev_deg)).toBeGreaterThan(-1);
    expect(r.mask.elev_deg).toHaveLength(1440);
  });
});
