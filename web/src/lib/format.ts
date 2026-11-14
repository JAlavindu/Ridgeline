import type { Countdown, EventKind } from "../engine";

const EVENT_LABELS: Record<EventKind, string> = {
  sunrise: "Sunrise",
  sunset: "Sunset",
  earthrise: "Earthrise",
  earthset: "Earthset",
};

export function eventLabel(kind: EventKind): string {
  return EVENT_LABELS[kind];
}

/** 0.2 -> "12 min", 51.62 -> "51 h 37 min", 77.5 -> "3 d 5 h" (days only from 72 h up). */
export function formatDuration(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  if (h >= 72) return `${Math.floor(h / 24)} d ${h % 24} h`;
  if (h > 0) return `${h} h ${min} min`;
  return `${min} min`;
}

/** "51 h 37 min", or "50 h 4 min – 53 h 14 min" where only a window may be shown (poleward of 75 deg). */
export function formatCountdown(c: Countdown): string {
  if (c.window_only) return `${formatDuration(c.earliest_hours)} – ${formatDuration(c.latest_hours)}`;
  return formatDuration(c.nominal_hours);
}

/** The <input type="datetime-local"> value "2026-11-14T09:00" read as UTC: "2026-11-14T09:00:00Z". */
export function utcInputToIso(value: string): string {
  return `${value}:00Z`;
}

/** The current time as a datetime-local value, in UTC, e.g. "2026-11-14T09:00". */
export function nowUtcInput(): string {
  return new Date().toISOString().slice(0, 16);
}
