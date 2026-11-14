import { describe, expect, it } from "vitest";
import { fromMap, toMap } from "../polarMap";

describe("polar map projection", () => {
  it("matches M3's check value for Connecting Ridge (dem_polar_500m.json: row 939.439, col 891.401)", () => {
    const p = toMap(-89.4395, 222.8066)!;
    // pixel centre i sits at fraction (i + 0.5) / 1830
    expect(p.fx * 1830 - 0.5).toBeCloseTo(891.401, 2);
    expect(p.fy * 1830 - 0.5).toBeCloseTo(939.439, 2);
  });

  it("round-trips a point", () => {
    const p = toMap(-84.7906, 29.1957)!;
    const back = fromMap(p.fx, p.fy);
    expect(back.lat).toBeCloseTo(-84.7906, 6);
    expect(back.lon).toBeCloseTo(29.1957, 6);
  });

  it("the image centre is the pole and 0 E is straight up", () => {
    expect(fromMap(0.5, 0.5).lat).toBeCloseTo(-90, 6);
    expect(fromMap(0.5, 0.4).lon).toBeCloseTo(0, 6);
    expect(fromMap(0.6, 0.5).lon).toBeCloseTo(90, 6);
  });

  it("points north of the map return null", () => {
    expect(toMap(-60, 0)).toBeNull();
  });
});
