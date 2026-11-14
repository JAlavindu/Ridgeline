import { MOON_RADIUS_KM, type Observer } from "./geometry";
import { DEG } from "./vec3";

/** Same fields as M3's mask files (and M4's HorizonMask type). */
export interface HorizonMask {
  az_step_deg: number;
  elev_deg: number[];
  elev_lo_deg: number[] | null;
  elev_hi_deg: number[] | null;
  observer_height_m: number;
  site_height_m?: number | null;
  radius_km?: number;
  dems_used?: string[];
}

/** Check a mask's numbers make sense; throw a clear error if not. */
export function checkMask(mask: HorizonMask): HorizonMask {
  const expected = Math.round(360 / mask.az_step_deg);
  if (mask.elev_deg.length !== expected) {
    throw new Error(`Mask has ${mask.elev_deg.length} values; expected ${expected} for a ${mask.az_step_deg} deg step`);
  }
  return mask;
}

/** Download masks/<siteId>.json, e.g. loadMask(import.meta.env.BASE_URL + "data/", "im1"). */
export async function loadMask(baseUrl: string, siteId: string): Promise<HorizonMask> {
  const response = await fetch(`${baseUrl}masks/${siteId}.json`);
  if (!response.ok) {
    throw new Error(`No horizon mask for site "${siteId}"`);
  }
  return checkMask(await response.json());
}

/** Horizon of a perfectly smooth Moon seen from mast height: acos(R / (R + h)) below level. */
export function flatMask(obs: Observer, azStepDeg = 0.25): HorizonMask {
  const heightKm = obs.mast_height_m / 1000;
  const dip = Math.acos(MOON_RADIUS_KM / (MOON_RADIUS_KM + heightKm)) * DEG;
  const count = Math.round(360 / azStepDeg);
  return {
    az_step_deg: azStepDeg,
    elev_deg: new Array<number>(count).fill(-dip),
    elev_lo_deg: null,
    elev_hi_deg: null,
    observer_height_m: obs.mast_height_m,
  };
}

/** Which version of the horizon to read: best estimate, or the low/high uncertainty edges. */
export type MaskEdge = "best" | "lo" | "hi";

function values(mask: HorizonMask, edge: MaskEdge): number[] {
  if (edge === "lo" && mask.elev_lo_deg) return mask.elev_lo_deg;
  if (edge === "hi" && mask.elev_hi_deg) return mask.elev_hi_deg;
  return mask.elev_deg;
}

/** Horizon height (deg) at any azimuth, blending the two nearest samples; wraps past 360. */
export function horizonAt(mask: HorizonMask, azDeg: number, edge: MaskEdge = "best"): number {
  const elev = values(mask, edge);
  const n = elev.length;
  const position = ((((azDeg % 360) + 360) % 360) / mask.az_step_deg) % n;
  const i = Math.floor(position);
  const f = position - i;
  return (1 - f) * elev[i] + f * elev[(i + 1) % n];
}

/** How fast the horizon rises per degree of azimuth (deg/deg) at an azimuth. */
export function horizonSlopeAt(mask: HorizonMask, azDeg: number, edge: MaskEdge = "best"): number {
  const step = mask.az_step_deg;
  return (horizonAt(mask, azDeg + step, edge) - horizonAt(mask, azDeg - step, edge)) / (2 * step);
}
