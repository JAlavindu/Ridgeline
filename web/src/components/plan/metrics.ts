import { formatDuration } from "../../lib/format";
import type { ScenarioResult } from "../../hooks/useScenario";

export type MetricIcon = "sun" | "night" | "earth" | "both";

/**
 * A row in the comparison. Headline rows answer the three questions a planner asks first (power, the battery,
 * contact); the rest sit under "More numbers". `help` is the one-sentence explanation behind the "?".
 */
export interface Metric {
  key: string;
  label: string;
  help: string;
  tier: "headline" | "more";
  icon?: MetricIcon;
  value: (r: ScenarioResult) => number;
  format: (v: number, r: ScenarioResult) => string;
  /** an optional second, smaller line under the value */
  sub?: (v: number, r: ScenarioResult) => string;
  /** draw a bar for values that are a share of the mission (0-100) */
  bar?: boolean;
  better: "high" | "low";
}

const pct = (v: number) => `${v.toFixed(0)}%`;

export const METRICS: Metric[] = [
  {
    key: "sun_up",
    tier: "headline",
    icon: "sun",
    label: "Sunlight",
    help: "How much of the mission has at least part of the Sun above the hills, so solar panels can work.",
    value: (r) => r.summary.percent_sunlit,
    format: (v) => `${pct(v)} of the time`,
    bar: true,
    better: "high",
  },
  {
    key: "night",
    tier: "headline",
    icon: "night",
    label: "Longest dark spell",
    help: "The longest stretch with no sunlight at all. The lander's battery and heaters must last this long.",
    value: (r) => r.summary.longest_night_hours,
    format: (v) => (v > 0 ? formatDuration(v) : "No darkness"),
    better: "low",
  },
  {
    key: "earth",
    tier: "headline",
    icon: "earth",
    label: "Talk to Earth",
    help: "How much of the mission Earth is above the hills, so the lander can radio home directly.",
    value: (r) => r.summary.percent_earth_visible,
    format: (v) => `${pct(v)} of the time`,
    sub: (_, r) =>
      r.summary.longest_comms_gap_hours > 0 ? `longest silence ${formatDuration(r.summary.longest_comms_gap_hours)}` : "never out of contact",
    bar: true,
    better: "high",
  },
  {
    key: "both",
    tier: "headline",
    icon: "both",
    label: "Power and contact",
    help: "How much of the mission has sunlight and Earth in view at the same time: the best time to work and send data.",
    value: (r) => r.summary.percent_both,
    format: (v) => `${pct(v)} of the time`,
    bar: true,
    better: "high",
  },
  {
    key: "avg_sun",
    tier: "more",
    label: "Average sunlight",
    help: "How much of the Sun's disc is visible on average. A Sun half-hidden by a ridge counts as half.",
    value: (r) => 100 * r.summary.mean_sun_fraction,
    format: pct,
    better: "high",
  },
  {
    key: "panel",
    tier: "more",
    label: "Power on the panel",
    help: "Sunlight reaching one square metre of panel (with the panel type in the mission rules), and the electric power at the example efficiency.",
    value: (r) => r.panelWm2,
    format: (v) => `${Math.round(v).toLocaleString("en-GB")} W/m²`,
    sub: (_, r) => `${Math.round(r.electricWm2).toLocaleString("en-GB")} W/m² electric`,
    better: "high",
  },
  {
    key: "eclipse",
    tier: "more",
    label: "Eclipses",
    help: "Hours when Earth passes in front of the Sun, as seen from the Moon. It darkens the site but is not a sunset.",
    value: (r) => r.summary.eclipse_hours,
    format: (v) => (v > 0 ? formatDuration(v) : "None"),
    better: "low",
  },
];

/** For each metric, the card ids holding the best value (ties all count). Needs two or more ready cards. */
export function bestCards(results: { id: string; result: ScenarioResult }[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  if (results.length < 2) return out;
  for (const m of METRICS) {
    const values = results.map(({ id, result }) => ({ id, v: m.value(result) }));
    const target = m.better === "high" ? Math.max(...values.map((x) => x.v)) : Math.min(...values.map((x) => x.v));
    out[m.key] = new Set(values.filter((x) => Math.abs(x.v - target) < 1e-9).map((x) => x.id));
  }
  return out;
}
