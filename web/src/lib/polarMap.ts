/*
 * South polar stereographic map used by hillshade_polar.png and dem_polar_500m.bin (M3):
 * rho = 2R tan((90 + lat)/2), x = rho sin(lon), y = rho cos(lon); 0 deg E points up.
 * Positions are fractions of the image (0..1 from the top-left corner).
 */
const R = 1737400;
const N = 1830;
const STEP = 500;
const HALF = (N * STEP) / 2;
const RAD = Math.PI / 180;

export function toMap(lat: number, lon: number): { fx: number; fy: number } | null {
  const rho = 2 * R * Math.tan(((90 + lat) * RAD) / 2);
  const x = rho * Math.sin(lon * RAD);
  const y = rho * Math.cos(lon * RAD);
  if (Math.abs(x) > HALF || Math.abs(y) > HALF) return null;
  return { fx: (x + HALF) / (2 * HALF), fy: (HALF - y) / (2 * HALF) };
}

export function fromMap(fx: number, fy: number): { lat: number; lon: number } {
  const x = fx * 2 * HALF - HALF;
  const y = HALF - fy * 2 * HALF;
  const rho = Math.hypot(x, y);
  const lon = (((Math.atan2(x, y) / RAD) % 360) + 360) % 360;
  const lat = -90 + (2 * Math.atan(rho / (2 * R))) / RAD;
  return { lat, lon };
}
