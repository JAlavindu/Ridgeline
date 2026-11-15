import type { BodyPosition } from "./geometry";
import { horizonAt, horizonSlopeAt, type HorizonMask, type MaskEdge } from "./mask";
import { RAD } from "./vec3";

export const SOLAR_CONSTANT_W_M2 = 1361;
export const AU_KM = 149_597_870.7;

/** Area of the part of a disc (radius r) that lies beyond a straight line at distance d from its centre. */
function segmentArea(r: number, d: number): number {
  return r * r * Math.acos(d / r) - d * Math.sqrt(r * r - d * d);
}

/**
 * F11 core: visible fraction of a disc of angular radius `radiusDeg` whose centre is
 * `aboveDeg` above a straight horizon line (negative = below).
 */
export function discFractionAbove(aboveDeg: number, radiusDeg: number): number {
  if (aboveDeg >= radiusDeg) return 1;
  if (aboveDeg <= -radiusDeg) return 0;
  const hidden = segmentArea(radiusDeg, aboveDeg);
  return 1 - hidden / (Math.PI * radiusDeg * radiusDeg);
}

/** F11: fraction of the Sun's disc above the terrain, using the horizon's height and slope. */
export function sunTerrainFraction(sun: BodyPosition, mask: HorizonMask, edge: MaskEdge = "best"): number {
  return discFractionAbove(sunAboveHorizonDeg(sun, mask, edge), sun.angular_radius_deg);
}

/**
 * Signed distance (deg) from the Sun's centre to the horizon line, measured straight across
 * the line. A sloping horizon is "closer" than the vertical gap: divide by sqrt(1 + slope^2).
 * Slope on the sky = (horizon change per degree of azimuth) / cos(Sun height).
 */
export function sunAboveHorizonDeg(sun: BodyPosition, mask: HorizonMask, edge: MaskEdge = "best"): number {
  const gap = sun.el_deg - horizonAt(mask, sun.az_deg, edge);
  const cosEl = Math.max(Math.cos(sun.el_deg * RAD), 0.01);
  const slope = horizonSlopeAt(mask, sun.az_deg, edge) / cosEl;
  return gap / Math.sqrt(1 + slope * slope);
}

/**
 * F12: fraction of the Sun NOT covered by Earth. 1 = no eclipse, 0 = Sun fully hidden.
 * Uses the standard area of overlap of two circles.
 */
export function eclipseFraction(separationDeg: number, sunRadiusDeg: number, earthRadiusDeg: number): number {
  const d = separationDeg;
  const rs = sunRadiusDeg;
  const re = earthRadiusDeg;
  if (d >= rs + re) return 1;
  if (d <= re - rs) return 0;

  const overlap =
    rs * rs * Math.acos((d * d + rs * rs - re * re) / (2 * d * rs)) +
    re * re * Math.acos((d * d + re * re - rs * rs) / (2 * d * re)) -
    0.5 * Math.sqrt((-d + rs + re) * (d + rs - re) * (d - rs + re) * (d + rs + re));
  return 1 - overlap / (Math.PI * rs * rs);
}

/** F13: sunlight strength (W/m2) on a surface facing the Sun, for a visible fraction f. */
export function irradianceWm2(sunDistKm: number, fraction: number): number {
  return SOLAR_CONSTANT_W_M2 * (AU_KM / sunDistKm) ** 2 * fraction;
}

export interface Sunlight {
  terrain_fraction: number;    // F11: 0..1 of the disc above the hills
  eclipse_fraction: number;    // F12: 0..1 not covered by Earth
  visible_fraction: number;    // min of the two (cautious choice, stated in the README)
  irradiance_w_m2: number;     // F13
  above_horizon_deg: number;   // signed distance of the Sun's centre above the horizon line
  horizon_deg: number;         // terrain height at the Sun's azimuth
}

/** Everything about sunlight at one moment, from the Sun and Earth positions and the mask. */
export function sunlight(
  sun: BodyPosition,
  earth: BodyPosition,
  sunEarthSepDeg: number,
  mask: HorizonMask,
  edge: MaskEdge = "best",
): Sunlight {
  const terrain = sunTerrainFraction(sun, mask, edge);
  const eclipse = eclipseFraction(sunEarthSepDeg, sun.angular_radius_deg, earth.angular_radius_deg);
  const visible = Math.min(terrain, eclipse);
  return {
    terrain_fraction: terrain,
    eclipse_fraction: eclipse,
    visible_fraction: visible,
    irradiance_w_m2: irradianceWm2(sun.dist_km, visible),
    above_horizon_deg: sunAboveHorizonDeg(sun, mask, edge),
    horizon_deg: horizonAt(mask, sun.az_deg, edge),
  };
}
