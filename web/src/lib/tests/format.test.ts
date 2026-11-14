import { describe, expect, it } from "vitest";
import type { Countdown } from "../../engine";
import { formatCountdown, formatDuration, utcInputToIso } from "../format";

function countdown(window_only: boolean): Countdown {
  return {
    event: "sunset",
    nominal_hours: 51.62,
    earliest_hours: 50.06,
    latest_hours: 53.23,
    uncertainty_hours: 1.59,
    formatted_target_utc: "2026-11-16T12:37Z",
    window_only,
  };
}

describe("formatting for the screen", () => {
  it("durations", () => {
    expect(formatDuration(0.2)).toBe("12 min");
    expect(formatDuration(51.62)).toBe("51 h 37 min");
    expect(formatDuration(77.5)).toBe("3 d 5 h");
    expect(formatDuration(-1)).toBe("0 min");
  });

  it("a single time near the equator, only a window near the pole", () => {
    expect(formatCountdown(countdown(false))).toBe("51 h 37 min");
    expect(formatCountdown(countdown(true))).toBe("50 h 4 min – 53 h 14 min");
  });

  it("datetime-local input is read as UTC", () => {
    expect(utcInputToIso("2026-11-14T09:00")).toBe("2026-11-14T09:00:00Z");
  });
});
