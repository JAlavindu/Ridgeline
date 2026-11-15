import type { Series } from "./series";
import { DEG } from "./vec3";

/*
 * F14: how much of the sunlight reaching the site lands on a panel, by panel type.
 * The headline number stays S x f in W/m2 (decision D9); this only adds the panel geometry.
 *   tracking            1                                    always faces the Sun
 *   vertical-rotating   cos e                                upright, turns to face the Sun
 *   vertical-fixed      cos e * max(0, cos(Az_sun - facing)) upright, fixed compass direction
 *   flat                max(0, sin e)                        lying on the ground
 */
export type PanelType = "tracking" | "vertical-rotating" | "vertical-fixed" | "flat";

export const PANEL_LABEL: Record<PanelType, string> = {
  tracking: "Tracks the Sun",
  "vertical-rotating": "Upright, turns to the Sun",
  "vertical-fixed": "Upright, fixed direction",
  flat: "Flat on the ground",
};

/** Below this the Sun is down whatever the disc fraction says, so no panel gets light. */
const SUN_DOWN_DEG = -1;

export function panelFactor(sunAzDeg: number, sunElDeg: number, panel: PanelType, facingAzDeg = 0): number {
  if (sunElDeg < SUN_DOWN_DEG) return 0;
  const e = sunElDeg / DEG; // DEG = 180/pi, so this is radians
  switch (panel) {
    case "tracking":
      return 1;
    case "vertical-rotating":
      return Math.cos(e);
    case "vertical-fixed":
      return Math.cos(e) * Math.max(0, Math.cos((sunAzDeg - facingAzDeg) / DEG));
    case "flat":
      return Math.max(0, Math.sin(e));
  }
}

/** Sunlight on the panel (W/m2) at sample i: S x f (F13) x panel factor (F14). */
export function panelIrradianceWm2(series: Series, i: number, panel: PanelType, facingAzDeg = 0): number {
  return series.irradiance_w_m2[i] * panelFactor(series.sun_az_deg[i], series.sun_el_deg[i], panel, facingAzDeg);
}

/** Average sunlight on the panel over the whole series (W/m2), night included. */
export function meanPanelIrradiance(series: Series, panel: PanelType, facingAzDeg = 0): number {
  const n = series.tdb.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += panelIrradianceWm2(series, i, panel, facingAzDeg);
  return sum / n;
}
