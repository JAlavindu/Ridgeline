import { formatDuration } from "../../lib/format";
import type { ScenarioResult } from "../../hooks/useScenario";

/** The rows every scenario card shows, and which direction is better when comparing cards. */
export interface Metric {
  key: string;
  label: string;
  value: (r: ScenarioResult) => number;
  format: (v: number, r: ScenarioResult) => string;
  better: "high" | "low";
}

const pct = (v: number) => `${v.toFixed(0)}%`;

export const METRICS: Metric[] = [
  { key: "sun_up", label: "Sun up (any part)", value: (r) => r.summary.percent_sunlit, format: pct, better: "high" },
  { key: "avg_sun", label: "Average sunlight", value: (r) => 100 * r.summary.mean_sun_fraction, format: pct, better: "high" },
  {
    key: "panel",
    label: "Sunlight on the panel",
    value: (r) => r.panelWm2,
    format: (v, r) => `${Math.round(v)} W/m² · ${Math.round(r.electricWm2)} W/m² electric`,
    better: "high",
  },
  { key: "earth", label: "Earth in view", value: (r) => r.summary.percent_earth_visible, format: pct, better: "high" },
  { key: "both", label: "Power and contact", value: (r) => r.summary.percent_both, format: pct, better: "high" },
  { key: "night", label: "Longest night", value: (r) => r.summary.longest_night_hours, format: (v) => formatDuration(v), better: "low" },
  { key: "gap", label: "Longest comms gap", value: (r) => r.summary.longest_comms_gap_hours, format: (v) => formatDuration(v), better: "low" },
  { key: "eclipse", label: "Earth in front of the Sun", value: (r) => r.summary.eclipse_hours, format: (v) => (v > 0 ? formatDuration(v) : "None"), better: "low" },
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
