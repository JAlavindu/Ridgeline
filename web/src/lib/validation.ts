/** One test from validation.json (written by pipeline/validate.py). */
export interface ValidationTest {
  id: string;
  name: string;
  what: string;
  tolerance: string;
  result: number | null;
  unit: string;
  expected_outcome: "pass" | "fail" | "info";
  outcome: "pass" | "fail" | "info" | "pending";
  passed: boolean;
  explanation: string;
  details?: Record<string, unknown>;
}

export interface ValidationReport {
  generated_utc: string;
  generator: string;
  tests: ValidationTest[];
}

export type Status = "pass" | "failed-as-designed" | "fail" | "pending" | "info";

export const STATUS_LABEL: Record<Status, string> = {
  pass: "Pass",
  "failed-as-designed": "Failed as designed",
  fail: "Fail",
  pending: "Pending",
  info: "Info",
};

/** What to show for a test. A test that is meant to fail (V3) and does is not a failure. */
export function statusOf(test: ValidationTest): Status {
  if (test.outcome === "pending") return "pending";
  if (test.expected_outcome === "info") return "info";
  if (test.expected_outcome === "fail") return test.outcome === "fail" ? "failed-as-designed" : "fail";
  return test.outcome === "pass" ? "pass" : "fail";
}

export const GROUPS: { title: string; note?: string; ids: string[] }[] = [
  { title: "Positions", note: "Where the Sun and Earth are, against NASA JPL Horizons.", ids: ["V1", "V2", "V3"] },
  { title: "Physics checks", note: "Cases whose answer is known in advance.", ids: ["V4", "V5", "V6", "V7", "V8", "H1"] },
  { title: "Terrain and sunlight", ids: ["V9", "V10", "V14"] },
  {
    title: "Mission replays",
    note: "Plausibility checks, not proof. A lander can stop for reasons other than the Sun.",
    ids: ["V11", "V12", "V13"],
  },
  { title: "Ground network", ids: ["V15"] },
  {
    title: "Sensitivity",
    note: "How much our modelling choices matter.",
    ids: ["S1", "S2", "S3"],
  },
];

/** Result with its unit, e.g. "0.000027 deg"; "not run" when there is no number. */
export function formatResult(test: ValidationTest): string {
  if (test.result === null || test.result === undefined) return "not run";
  return `${test.result} ${test.unit}`;
}
