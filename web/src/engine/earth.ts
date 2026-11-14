import type { BodyPosition } from "./geometry";
import { horizonAt, type HorizonMask, type MaskEdge } from "./mask";

export type EarthRule = "centre" | "any_part";

export interface EarthOptions {
  rule: EarthRule;
  margin_deg: number;
}

export const DEFAULT_EARTH_OPTIONS: EarthOptions = { rule: "centre", margin_deg: 0 };

export interface EarthVisibility {
  visible: boolean;
  margin_deg: number;   // how far above (+) or below (-) the visibility line, in degrees
  horizon_deg: number;  // terrain height at Earth's azimuth
}

export function earthVisibility(
  earth: BodyPosition,
  mask: HorizonMask,
  options: EarthOptions = DEFAULT_EARTH_OPTIONS,
  edge: MaskEdge = "best",
): EarthVisibility {
  const horizon = horizonAt(mask, earth.az_deg, edge);
  const lift = options.rule === "any_part" ? earth.angular_radius_deg : 0;
  const margin = earth.el_deg + lift - horizon - options.margin_deg;
  return { visible: margin > 0, margin_deg: margin, horizon_deg: horizon };
}
