import { describe, expect, it } from "vitest";
import { findEvents, formatMinuteUtc, margin, outlook, removeFlicker, type SkyEvent } from "../events";
import { DEFAULT_EARTH_OPTIONS } from "../earth";
import { makeObserver, skyAt } from "../geometry";
import { flatMask } from "../mask";
import { isoToTdb } from "../time";
import { loadEphemerisFromDisk, loadMaskFromDisk } from "./loadFromDisk";

const eph = loadEphemerisFromDisk();
const DAY = 86400;
const START = isoToTdb("2027-01-01T00:00:00Z");

function ev(kind: SkyEvent["kind"], hours: number): SkyEvent {
  return { kind, tdb: hours * 3600, time_utc: "" };
}

describe("flicker removal", () => {
  it("drops a set/rise pair less than 1 hour apart, keeps the rest", () => {
    const events = [ev("sunset", 10), ev("sunrise", 10.5), ev("sunset", 50)];
    expect(removeFlicker(events).map((e) => e.tdb / 3600)).toEqual([50]);
  });

  it("keeps pairs that are far apart", () => {
    const events = [ev("sunset", 10), ev("sunrise", 30)];
    expect(removeFlicker(events)).toHaveLength(2);
  });
});

describe("equator (0, 0), smooth Moon (plan V5)", () => {
  const obs = makeObserver(0, 0);
  const mask = flatMask(obs);
  const events = findEvents(eph, obs, mask, "sun", START, 120 * 24);

  it("sunrises and sunsets alternate", () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i].kind).not.toBe(events[i - 1].kind);
    }
  });

  it("a lunar day is 29.53 days", () => {
    const sunsets = events.filter((e) => e.kind === "sunset").map((e) => e.tdb);
    for (let i = 1; i < sunsets.length; i++) {
      expect((sunsets[i] - sunsets[i - 1]) / DAY).toBeCloseTo(29.53, 0);
    }
  });

  it("daylight lasts about 14.8 days (14.77 d + Sun's edge + 2 m mast)", () => {
    for (let i = 0; i + 1 < events.length; i++) {
      if (events[i].kind === "sunrise") {
        const days = (events[i + 1].tdb - events[i].tdb) / DAY;
        expect(days).toBeGreaterThan(14.4);
        expect(days).toBeLessThan(15.2);
      }
    }
  });

  it("each time is right to the minute: visible on one side, hidden on the other", () => {
    for (const e of events) {
      const before = margin("sun", skyAt(eph, obs, e.tdb - 60), mask, DEFAULT_EARTH_OPTIONS);
      const after = margin("sun", skyAt(eph, obs, e.tdb + 60), mask, DEFAULT_EARTH_OPTIONS);
      expect(before > 0).toBe(e.kind === "sunset");
      expect(after > 0).toBe(e.kind === "sunrise");
    }
  });

  it("Earth never sets", () => {
    const result = outlook(eph, obs, mask, START);
    expect(result.earth.is_up).toBe(true);
    expect(result.earth.next).toBeNull();
  });
});

describe("outlook (the countdown cards)", () => {
  it("Chang'e-4 (far side): Earth never rises", () => {
    const obs = makeObserver(-45.4446, 177.5991);
    const result = outlook(eph, obs, flatMask(obs), START);
    expect(result.earth.is_up).toBe(false);
    expect(result.earth.next).toBeNull();
  });

  it("Connecting Ridge with M3's terrain: a window, earliest <= nominal <= latest", () => {
    const mask = loadMaskFromDisk("connecting_ridge");
    const obs = makeObserver(-89.4395, -137.1934, mask.site_height_m ?? 0);
    const result = outlook(eph, obs, mask, isoToTdb("2026-11-14T09:00:00Z"));
    expect(result.horizon_uncertainty).toBe("assumed"); // M3 has not filled lo/hi yet
    for (const body of [result.sun, result.earth]) {
      if (body.next) {
        expect(body.next.window_only).toBe(true); // poleward of 75 deg
        expect(body.next.earliest_hours).toBeLessThanOrEqual(body.next.nominal_hours);
        expect(body.next.nominal_hours).toBeLessThanOrEqual(body.next.latest_hours);
        expect(body.next.nominal_hours).toBeGreaterThan(0);
      }
    }
  });

  it("stops quietly at the end of the ephemeris (2033-01-01)", () => {
    const obs = makeObserver(0, 0);
    const result = outlook(eph, obs, flatMask(obs), isoToTdb("2032-12-20T00:00:00Z"));
    expect(result.searched_hours).toBeLessThan(13 * 24);
  });

  it("formats times to the minute", () => {
    expect(formatMinuteUtc(isoToTdb("2026-11-14T09:00:29Z"))).toBe("2026-11-14T09:00Z");
    expect(formatMinuteUtc(isoToTdb("2026-11-14T09:00:31Z"))).toBe("2026-11-14T09:01Z");
  });
});
