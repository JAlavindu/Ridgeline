import type { Series } from "./series";

/*
 * DSN mode: can one of NASA's Deep Space Network sites see the Moon high enough to talk to it?
 * dsn.bin (made by pipeline/dsn.py) holds the Moon's height above the horizon at Goldstone,
 * Madrid and Canberra every 10 minutes. DSN contact with a lander needs BOTH:
 *   1. Earth is above the lander's horizon (the engine's Earth visibility), and
 *   2. at least one station sees the Moon above the chosen limit.
 * Many commercial landers use other ground networks, so this is an option, not the default.
 */

/** Minimum Moon height (degrees) at the station. Source: DSN 810-005, Rev. O. */
export const DSN_LIMITS = { receive: 6, command_low: 10.1, command_high: 13.6 } as const;
export type DsnLimit = keyof typeof DSN_LIMITS;

export interface DsnStation {
  id: string;
  name: string;
  naif_id: number;
}

export interface DsnMeta {
  start_tdb_s: number;
  step_s: number;
  count: number;
  values_per_record: number;
  stations: DsnStation[];
  scale: number;
  dtype: string;
}

export interface Dsn {
  meta: DsnMeta;
  data: Int16Array;
}

export function parseDsn(meta: DsnMeta, buffer: ArrayBuffer): Dsn {
  if (meta.dtype !== "int16") throw new Error(`dsn_meta.json says ${meta.dtype}; expected int16`);
  if (meta.values_per_record !== meta.stations.length) {
    throw new Error("dsn_meta.json: values per record does not match the number of stations");
  }
  const expected = meta.count * meta.values_per_record * 2;
  if (buffer.byteLength !== expected) {
    throw new Error(`dsn.bin has ${buffer.byteLength} bytes; expected ${expected}`);
  }
  return { meta, data: new Int16Array(buffer) };
}

export async function loadDsn(baseUrl: string): Promise<Dsn> {
  const [metaResponse, binResponse] = await Promise.all([
    fetch(baseUrl + "dsn_meta.json"),
    fetch(baseUrl + "dsn.bin"),
  ]);
  if (!metaResponse.ok || !binResponse.ok) throw new Error("Could not load the DSN data files");
  return parseDsn((await metaResponse.json()) as DsnMeta, await binResponse.arrayBuffer());
}

/** Height of the Moon (degrees) at each station, blended linearly between 10-minute samples. */
export function dsnElevationsAt(dsn: Dsn, tdbS: number): number[] {
  const { start_tdb_s, step_s, count, values_per_record, scale } = dsn.meta;
  const position = (tdbS - start_tdb_s) / step_s;
  if (position < 0 || position > count - 1) {
    throw new RangeError("Time is outside the DSN data (2023-2032)");
  }
  const i = Math.min(Math.floor(position), count - 2);
  const frac = position - i;
  const out: number[] = [];
  for (let s = 0; s < values_per_record; s++) {
    const a = dsn.data[i * values_per_record + s];
    const b = dsn.data[(i + 1) * values_per_record + s];
    out.push((a + (b - a) * frac) / scale);
  }
  return out;
}

export interface DsnContact {
  contact: boolean;
  stations: DsnStation[];   // stations that see the Moon above the limit
  max_elevation_deg: number;
}

export function dsnContact(dsn: Dsn, tdbS: number, earthVisible: boolean, limitDeg: number): DsnContact {
  const elevations = dsnElevationsAt(dsn, tdbS);
  const stations = dsn.meta.stations.filter((_, i) => elevations[i] >= limitDeg);
  return {
    contact: earthVisible && stations.length > 0,
    stations,
    max_elevation_deg: Math.max(...elevations),
  };
}

/** Percent of a series' samples with DSN contact (Earth visible from the site AND a station in view). */
export function dsnContactPercent(dsn: Dsn, series: Series, limitDeg: number): number {
  if (series.tdb.length === 0) return 0;
  let hits = 0;
  for (let i = 0; i < series.tdb.length; i++) {
    if (series.earth_visible[i] && dsnContact(dsn, series.tdb[i], true, limitDeg).contact) hits++;
  }
  return (100 * hits) / series.tdb.length;
}
