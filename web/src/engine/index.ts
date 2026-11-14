/** The engine's public face: the app imports everything from "../engine". */

export { isoToTdb, tdbToIso, unixMsToTdb, tdbToUnixMs } from "./time";
export { loadEphemeris, parseEphemeris, bodyPositionsAt, coverage } from "./ephemeris";
export type { Ephemeris, EphemMeta, BodyPositions } from "./ephemeris";
export {
  makeObserver,
  skyAt,
  skyView,
  bodyPosition,
  sitePositionKm,
  azimuthElevation,
  angularRadiusDeg,
  MOON_RADIUS_KM,
  SUN_RADIUS_KM,
  EARTH_RADIUS_KM,
  DEFAULT_MAST_M,
} from "./geometry";
export type { Observer, BodyPosition, SkyView } from "./geometry";
export type { Vec3 } from "./vec3";

// Modules 6 and 7
export { loadMask, checkMask, flatMask, horizonAt } from "./mask";
export type { HorizonMask, MaskEdge } from "./mask";
export { sunlight, eclipseFraction, irradianceWm2, discFractionAbove, SOLAR_CONSTANT_W_M2 } from "./sunlight";
export type { Sunlight } from "./sunlight";
export { earthVisibility, DEFAULT_EARTH_OPTIONS } from "./earth";
export type { EarthOptions, EarthRule, EarthVisibility } from "./earth";
export { skyState } from "./conditions";
export type { SkyState } from "./conditions";
