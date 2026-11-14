import { tdbToIso } from "./time";
import type { Vec3 } from "./vec3";

export interface EphemMeta {
  frame: string;
  aberration_correction: string;
  start_utc: string;
  start_tdb_s: number;
  step_s: number;
  count: number;
  fields: string[];
  values_per_record: number;
}

export interface Ephemeris {
  meta: EphemMeta;
  data: Float32Array;
}

/** Positions in km from the Moon's centre, MOON_ME frame. */
export interface BodyPositions {
  sun: Vec3;
  earth: Vec3;
}

const VALUES_PER_RECORD = 8;
const SUN_OFFSET = 0;
const EARTH_OFFSET = 4;
/** The browser's UTC->TDB formula can differ from SPICE by up to 0.002 s at the file's ends. */
const EDGE_TOLERANCE_S = 0.01;

/** Check the downloaded bytes match the description, and wrap them as Float32 numbers. */
export function parseEphemeris(meta: EphemMeta, buffer: ArrayBuffer): Ephemeris {
  if (meta.values_per_record !== VALUES_PER_RECORD) {
    throw new Error(`ephem_meta.json says ${meta.values_per_record} values per hour; expected 8`);
  }
  const expectedBytes = meta.count * VALUES_PER_RECORD * 4;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(`ephem.bin is ${buffer.byteLength} bytes; expected ${expectedBytes}`);
  }
  // Float32Array reads in the computer's byte order. Every browser platform is little-endian.
  return { meta, data: new Float32Array(buffer) };
}

/**
 * Download ephem_meta.json and ephem.bin. In the app, call it once:
 *   const eph = await loadEphemeris(import.meta.env.BASE_URL + "data/");
 */
export async function loadEphemeris(baseUrl: string): Promise<Ephemeris> {
  const [metaResponse, binResponse] = await Promise.all([
    fetch(baseUrl + "ephem_meta.json"),
    fetch(baseUrl + "ephem.bin"),
  ]);
  if (!metaResponse.ok || !binResponse.ok) {
    throw new Error(`Could not download the ephemeris files from ${baseUrl}`);
  }
  const meta: EphemMeta = await metaResponse.json();
  return parseEphemeris(meta, await binResponse.arrayBuffer());
}

/** First and last moment the file covers, in TDB seconds. */
export function coverage(eph: Ephemeris): { firstTdb: number; lastTdb: number } {
  const { start_tdb_s, step_s, count } = eph.meta;
  return { firstTdb: start_tdb_s, lastTdb: start_tdb_s + (count - 1) * step_s };
}

/** Sun and Earth positions (km, MOON_ME, from the Moon's centre) at a TDB time. */
export function bodyPositionsAt(eph: Ephemeris, tdbS: number): BodyPositions {
  const { firstTdb, lastTdb } = coverage(eph);
  if (!(tdbS >= firstTdb - EDGE_TOLERANCE_S && tdbS <= lastTdb + EDGE_TOLERANCE_S)) {
    const asked = Number.isFinite(tdbS) ? tdbToIso(tdbS) : String(tdbS);
    throw new RangeError(
      `Dates must be between ${tdbToIso(firstTdb)} and ${tdbToIso(lastTdb)} UTC (asked for ${asked})`,
    );
  }

  const { count, step_s } = eph.meta;
  const hours = Math.min(Math.max((tdbS - firstTdb) / step_s, 0), count - 1);
  const i = Math.min(Math.floor(hours), count - 2);
  const f = hours - i;

  return {
    sun: blend(eph.data, i, f, SUN_OFFSET),
    earth: blend(eph.data, i, f, EARTH_OFFSET),
  };
}

/** Blend record i and i+1 (fraction f of the way) for the body starting at `offset`. */
function blend(data: Float32Array, i: number, f: number, offset: number): Vec3 {
  const a = i * VALUES_PER_RECORD + offset;
  const b = a + VALUES_PER_RECORD;

  const x = (1 - f) * data[a] + f * data[b];
  const y = (1 - f) * data[a + 1] + f * data[b + 1];
  const z = (1 - f) * data[a + 2] + f * data[b + 2];
  const length = Math.hypot(x, y, z);
  const dist = (1 - f) * data[a + 3] + f * data[b + 3];

  const k = dist / length;
  return [x * k, y * k, z * k];
}
