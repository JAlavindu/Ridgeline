import { bodyPositionsAt, type Ephemeris } from "./ephemeris";
import { DEG, RAD, angleBetweenDeg, dot, norm, scale, sub, type Vec3 } from "./vec3";

export const MOON_RADIUS_KM = 1737.4;
export const SUN_RADIUS_KM = 695_700.0;
export const EARTH_RADIUS_KM = 6378.137;
export const DEFAULT_MAST_M = 2.0;

/** Where the observer stands. Same fields as Python's Site. */
export interface Observer {
  lat_deg: number;
  lon_deg: number;
  ground_height_m: number;
  mast_height_m: number;
}

/** Same shape as M4's BodyPosition type and Python's BodyView. */
export interface BodyPosition {
  az_deg: number;
  el_deg: number;
  dist_km: number;
  angular_radius_deg: number;
}

export interface SkyView {
  sun: BodyPosition;
  earth: BodyPosition;
  sun_earth_sep_deg: number;
}

/** Build an Observer; heights default to ground 0 m and a 2 m mast. */
export function makeObserver(
  lat_deg: number,
  lon_deg: number,
  ground_height_m = 0,
  mast_height_m = DEFAULT_MAST_M,
): Observer {
  return { lat_deg, lon_deg, ground_height_m, mast_height_m };
}

/** F1: the site's position from the Moon's centre, in km (MOON_ME). */
export function sitePositionKm(obs: Observer): Vec3 {
  const lat = obs.lat_deg * RAD;
  const lon = obs.lon_deg * RAD;
  const radius = MOON_RADIUS_KM + (obs.ground_height_m + obs.mast_height_m) / 1000;
  return scale([Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)], radius);
}

/** F2: unit vectors pointing east, north and up at the site. */
export function localAxes(obs: Observer): { east: Vec3; north: Vec3; up: Vec3 } {
  const lat = obs.lat_deg * RAD;
  const lon = obs.lon_deg * RAD;
  return {
    east: [-Math.sin(lon), Math.cos(lon), 0],
    north: [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)],
    up: [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)],
  };
}

/** F4: azimuth and elevation in degrees of direction v (km, MOON_ME) seen from the site. */
export function azimuthElevation(v: Vec3, obs: Observer): { az_deg: number; el_deg: number } {
  const { east, north, up } = localAxes(obs);
  const az = Math.atan2(dot(east, v), dot(north, v)) * DEG;
  const sinEl = Math.min(1, Math.max(-1, dot(up, v) / norm(v)));
  return { az_deg: ((az % 360) + 360) % 360, el_deg: Math.asin(sinEl) * DEG };
}

/** F15: half the apparent width of a body's disc, in degrees. */
export function angularRadiusDeg(bodyRadiusKm: number, distKm: number): number {
  return Math.asin(bodyRadiusKm / distKm) * DEG;
}

/** F3 + F4 + F15 for one body whose position is given from the Moon's centre. */
export function bodyPosition(bodyPosKm: Vec3, bodyRadiusKm: number, obs: Observer): BodyPosition {
  const v = sub(bodyPosKm, sitePositionKm(obs));
  const { az_deg, el_deg } = azimuthElevation(v, obs);
  const dist_km = norm(v);
  return { az_deg, el_deg, dist_km, angular_radius_deg: angularRadiusDeg(bodyRadiusKm, dist_km) };
}

/** Sun and Earth as seen from the site, from Moon-centred positions (km, MOON_ME). */
export function skyView(obs: Observer, sunPosKm: Vec3, earthPosKm: Vec3): SkyView {
  const origin = sitePositionKm(obs);
  return {
    sun: bodyPosition(sunPosKm, SUN_RADIUS_KM, obs),
    earth: bodyPosition(earthPosKm, EARTH_RADIUS_KM, obs),
    sun_earth_sep_deg: angleBetweenDeg(sub(sunPosKm, origin), sub(earthPosKm, origin)),
  };
}

/** The everyday entry point: the sky at a site at a TDB time, using ephem.bin. */
export function skyAt(eph: Ephemeris, obs: Observer, tdbS: number): SkyView {
  const { sun, earth } = bodyPositionsAt(eph, tdbS);
  return skyView(obs, sun, earth);
}
