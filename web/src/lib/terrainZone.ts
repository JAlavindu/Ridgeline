/**
 * Where a custom point gets real terrain: from 75 deg S to the south pole.
 *
 * The 500 m polar terrain map (dem_polar_500m.bin) is a square whose edges sit at 75 deg S and whose
 * corners reach a little further. We use the simple circle, 75 deg S to the pole, everywhere a user
 * sees or relies on it (the globe cap, the polar map ring, the messages and the horizon builder), so
 * what the screen promises and what the app computes always match.
 */
export const TERRAIN_ZONE_LAT_DEG = -75;

export function inTerrainZone(latDeg: number): boolean {
  return Number.isFinite(latDeg) && latDeg <= TERRAIN_ZONE_LAT_DEG && latDeg >= -90;
}

/** "85.20° S, 30.10° E" with longitude shown 0-360 east. */
export function formatPoint(latDeg: number, lonDeg: number): string {
  const lon = ((lonDeg % 360) + 360) % 360;
  return `${Math.abs(latDeg).toFixed(2)}° ${latDeg < 0 ? "S" : "N"}, ${lon.toFixed(2)}° E`;
}
