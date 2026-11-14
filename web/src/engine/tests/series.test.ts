import { describe, expect, it } from "vitest";
import { makeObserver } from "../geometry";
import { flatMask } from "../mask";
import { sampleSeries, slipScan, summarize, timelineRows, type Series } from "../series";
import { isoToTdb } from "../time";
import { loadEphemerisFromDisk, loadMaskFromDisk } from "./loadFromDisk";

const eph = loadEphemerisFromDisk();
const LUNAR_DAY_H = 29.530589 * 24;

/** A hand-made series: 1 sample per hour, sunlit pattern given as a string of "#" (lit) and "." (dark). */
function fakeSeries(pattern: string, earth = true): Series {
  const fractions = [...pattern].map((c) => (c === "#" ? 1 : 0));
  const n = fractions.length;
  return {
    step_s: 3600,
    tdb: fractions.map((_, i) => i * 3600),
    sun_el_deg: new Array(n).fill(0),
    earth_el_deg: new Array(n).fill(0),
    sun_horizon_deg: new Array(n).fill(0),
    earth_horizon_deg: new Array(n).fill(0),
    sun_fraction: fractions,
    irradiance_w_m2: fractions.map((f) => 1361 * f),
    earth_visible: new Array(n).fill(earth),
    eclipse: new Array(n).fill(false),
  };
}

describe("summarize (hand-made cases)", () => {
  it("counts percentages, the longest night and long nights", () => {
    const summary = summarize(fakeSeries("##" + ".".repeat(30) + "##" + ".".repeat(5) + "#"));
    expect(summary.hours).toBe(40);
    expect(summary.percent_sunlit).toBeCloseTo((5 / 40) * 100, 9);
    expect(summary.longest_night_hours).toBe(30);
    expect(summary.nights_over_24h).toBe(1);
    expect(summary.mean_irradiance_w_m2).toBeCloseTo((1361 * 5) / 40, 9);
  });

  it("no Earth at all: comms gap is the whole period", () => {
    const summary = summarize(fakeSeries("#####", false));
    expect(summary.percent_earth_visible).toBe(0);
    expect(summary.percent_both).toBe(0);
    expect(summary.longest_comms_gap_hours).toBe(5);
  });

  it("an empty period gives zeros, not NaN", () => {
    expect(summarize(fakeSeries("")).percent_sunlit).toBe(0);
  });
});

describe("equator (0, 0), smooth Moon, 12 lunar days (plan V5)", () => {
  const obs = makeObserver(0, 0);
  const summary = summarize(sampleSeries(eph, obs, flatMask(obs), isoToTdb("2027-01-01T00:00:00Z"), 12 * LUNAR_DAY_H));

  it("Sun up about 50% of the time (+/- 0.5 points)", () => {
    expect(Math.abs(summary.percent_sunlit - 50)).toBeLessThan(0.5);
  });

  it("longest night about 14.7 days, 12 nights", () => {
    expect(summary.longest_night_hours / 24).toBeGreaterThan(14.4);
    expect(summary.longest_night_hours / 24).toBeLessThan(15.0);
    expect(summary.nights_over_24h).toBe(12);
  });

  it("Earth always visible", () => {
    expect(summary.percent_earth_visible).toBe(100);
    expect(summary.longest_comms_gap_hours).toBe(0);
  });
});

describe("eclipse day 2025-03-14 at (0, 0), 1-minute samples (plan V7)", () => {
  const obs = makeObserver(0, 0);
  const s = sampleSeries(eph, obs, flatMask(obs), isoToTdb("2025-03-14T00:00:00Z"), 24, 1);
  const summary = summarize(s);

  it("about 5 hours of Earth crossing the Sun, and a short 'night' in the middle", () => {
    expect(summary.eclipse_hours).toBeGreaterThan(4);
    expect(summary.eclipse_hours).toBeLessThan(6);
    expect(summary.longest_night_hours).toBeGreaterThan(1);
    expect(summary.longest_night_hours).toBeLessThan(3);
  });

  it("the timeline marks those rows as eclipse and dark", () => {
    const rows = timelineRows(s, 5);
    const at = (utc: string) => rows.find((r) => r.time_utc.startsWith(utc));
    expect(at("2025-03-14T07:00")?.is_eclipse).toBe(true);
    expect(at("2025-03-14T07:00")?.is_dark).toBe(true);
    expect(at("2025-03-14T00:00")?.is_eclipse).toBe(false);
  });
});

describe("Connecting Ridge with M3's terrain, 2023-2032 hourly (plan V10)", () => {
  const mask = loadMaskFromDisk("connecting_ridge");
  const obs = makeObserver(-89.4395, -137.1934, mask.site_height_m ?? 0);
  const summary = summarize(sampleSeries(eph, obs, mask, isoToTdb("2023-01-01T00:00:00Z"), 10 * 8766, 60));

  it("average sunlight within 5 points of Glaser 2018's ~88%", () => {
    expect(Math.abs(100 * summary.mean_sun_fraction - 88)).toBeLessThan(5);
  });

  it("longest darkness of a few days (Glaser 2014: 4.58 d)", () => {
    expect(summary.longest_night_hours / 24).toBeGreaterThan(3);
    expect(summary.longest_night_hours / 24).toBeLessThan(7);
  });
});

describe("slip chart", () => {
  const mask = loadMaskFromDisk("connecting_ridge");
  const obs = makeObserver(-89.4395, -137.1934, mask.site_height_m ?? 0);
  const slips = Array.from({ length: 61 }, (_, i) => -60 + 2 * i);
  const points = slipScan(eph, obs, mask, isoToTdb("2026-11-14T09:00:00Z"), 14 * 24, slips);

  it("one point per slip, dates move with the slip", () => {
    expect(points).toHaveLength(61);
    expect(points[30].slip_days).toBe(0);
    expect(points[30].target_date).toBe("2026-11-14");
    expect(points[31].target_date).toBe("2026-11-16");
  });

  it("all percentages are between 0 and 100, and 'viable' follows the rule", () => {
    for (const p of points) {
      for (const pct of [p.sunlight_percent, p.earth_visible_percent, p.combined_percent]) {
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }
      expect(p.is_viable).toBe(p.sunlight_percent >= 65 && p.longest_night_hours <= 72);
    }
  });

  it("skips slips that fall outside 2023-2032", () => {
    const late = slipScan(eph, obs, mask, isoToTdb("2032-12-01T00:00:00Z"), 14 * 24, [0, 30]);
    expect(late.map((p) => p.slip_days)).toEqual([0]);
  });
});
