// Implementation of verified physics formulas F1 - F18 from lunar-navigator-README.md
// MOON_ME reference frame, 1737.4 km reference sphere.

export const MOON_RADIUS_KM = 1737.4;
export const SUN_RADIUS_KM = 695700.0;
export const EARTH_RADIUS_KM = 6378.137;
export const AU_KM = 149597870.7;
export const SOLAR_CONSTANT_W_M2 = 1361.0;
export const SYNODIC_RATE_DEG_PER_HR = 360.0 / (29.530589 * 24.0); // 0.5079 deg/hr

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function norm(v: Vec3): number {
  return Math.sqrt(dot(v, v));
}

export function normalize(v: Vec3): Vec3 {
  const n = norm(v);
  if (n === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

export function rad2deg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

export function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

/**
 * F1 — Site position vector in MOON_ME frame (km)
 */
export function sitePositionKm(latDeg: number, lonDeg: number, heightM: number = 0, obsHeightM: number = 2.0): Vec3 {
  const phi = deg2rad(latDeg);
  const lambda = deg2rad(lonDeg);
  const r = MOON_RADIUS_KM + (heightM + obsHeightM) / 1000.0;
  return {
    x: r * Math.cos(phi) * Math.cos(lambda),
    y: r * Math.cos(phi) * Math.sin(lambda),
    z: r * Math.sin(phi),
  };
}

/**
 * F2 — Local directions (East, North, Up) in MOON_ME frame
 */
export function localAxes(latDeg: number, lonDeg: number): { east: Vec3; north: Vec3; up: Vec3 } {
  const phi = deg2rad(latDeg);
  const lambda = deg2rad(lonDeg);

  const east: Vec3 = {
    x: -Math.sin(lambda),
    y: Math.cos(lambda),
    z: 0.0,
  };
  const north: Vec3 = {
    x: -Math.sin(phi) * Math.cos(lambda),
    y: -Math.sin(phi) * Math.sin(lambda),
    z: Math.cos(phi),
  };
  const up: Vec3 = {
    x: Math.cos(phi) * Math.cos(lambda),
    y: Math.cos(phi) * Math.sin(lambda),
    z: Math.sin(phi),
  };
  return { east, north, up };
}

/**
 * F4 — Azimuth (0..360° clockwise from North) and Elevation (-90..+90°)
 */
export function azimuthElevation(vRel: Vec3, latDeg: number, lonDeg: number): { azDeg: number; elDeg: number } {
  const { east, north, up } = localAxes(latDeg, lonDeg);
  const azRad = Math.atan2(dot(east, vRel), dot(north, vRel));
  let azDeg = rad2deg(azRad);
  if (azDeg < 0) azDeg += 360.0;

  const dist = norm(vRel);
  const elRad = Math.asin(Math.max(-1.0, Math.min(1.0, dot(up, vRel) / dist)));
  const elDeg = rad2deg(elRad);

  return { azDeg, elDeg };
}

/**
 * F11 — Visible fraction of Sun's disc (0.0 to 1.0)
 * Sun angular radius rho ≈ 0.267°
 * d = signed distance from Sun's centre to horizon line
 */
export function sunVisibleFraction(sunElDeg: number, horizonElDeg: number, sunRadiusDeg: number = 0.267): number {
  const d = sunElDeg - horizonElDeg;
  if (d <= -sunRadiusDeg) return 0.0;
  if (d >= sunRadiusDeg) return 1.0;

  // Circle segment formula for uniform disc
  // h is height of segment from edge: h = d + sunRadiusDeg
  const x = -d / sunRadiusDeg; // -1 to +1
  const theta = 2.0 * Math.acos(Math.max(-1.0, Math.min(1.0, x)));
  const areaFraction = (theta - Math.sin(theta)) / (2.0 * Math.PI);
  return Math.max(0.0, Math.min(1.0, areaFraction));
}

/**
 * F12 — Earth covering Sun (eclipse fraction, 0.0 = total eclipse, 1.0 = no eclipse)
 */
export function eclipseFraction(
  sunEarthSeparationDeg: number,
  sunRadiusDeg: number = 0.267,
  earthRadiusDeg: number = 0.95
): number {
  const d = sunEarthSeparationDeg;
  if (d >= sunRadiusDeg + earthRadiusDeg) return 1.0; // No eclipse
  if (d <= earthRadiusDeg - sunRadiusDeg) return 0.0; // Total eclipse (Earth covers Sun)

  // Partial overlap of two circles
  const r1 = sunRadiusDeg;
  const r2 = earthRadiusDeg;
  const d1 = (d * d - r2 * r2 + r1 * r1) / (2 * d);
  const d2 = d - d1;

  const a1 = r1 * r1 * Math.acos(Math.max(-1, Math.min(1, d1 / r1))) - d1 * Math.sqrt(Math.max(0, r1 * r1 - d1 * d1));
  const a2 = r2 * r2 * Math.acos(Math.max(-1, Math.min(1, d2 / r2))) - d2 * Math.sqrt(Math.max(0, r2 * r2 - d2 * d2));
  const overlapArea = a1 + a2;
  const sunArea = Math.PI * r1 * r1;
  const coveredFrac = overlapArea / sunArea;
  return Math.max(0.0, Math.min(1.0, 1.0 - coveredFrac));
}

/**
 * F13 — Sunlight strength in W/m²
 */
export function solarFluxWm2(sunDistKm: number, visibleFraction: number): number {
  const distAU = sunDistKm / AU_KM;
  return SOLAR_CONSTANT_W_M2 * Math.pow(1.0 / distAU, 2) * visibleFraction;
}

/**
 * F7 — Sun elevation rate near horizon (deg/hour)
 */
export function sunElevationRateDegPerHr(latDeg: number): number {
  return SYNODIC_RATE_DEG_PER_HR * Math.cos(deg2rad(latDeg));
}

/**
 * F8 — Countdown uncertainty window (hours)
 * time error ≈ horizon error ÷ |Sun height rate|
 */
export function countdownUncertaintyHours(horizonErrorDeg: number, latDeg: number): number {
  const rate = Math.max(0.005, Math.abs(sunElevationRateDegPerHr(latDeg)));
  return horizonErrorDeg / rate;
}
