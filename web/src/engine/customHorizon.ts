import type { HorizonMask } from "./mask";

/*
 * Horizons for custom coordinates, from the 500 m polar terrain (dem_polar_500m.bin, made by M3).
 * A direct port of pipeline/horizon.py as M3's V14 test runs it (pipeline/v14_custom_vs_precise.py):
 * one ring to 150 km (250 km poleward of 88 S), steps of max(500 m, 0.5% of the distance), true great
 * circles (F10) and the exact angle on a round Moon (F9). Checked against Python by
 * tests/customHorizon.test.ts. V14 shows these horizons can differ from our precise ones by several
 * degrees, so they are always labelled approximate.
 */

const R = 1737400; // m, same sphere as the terrain files
const RAD = Math.PI / 180;
const STEP_FRAC = 0.005;
const POLE_LAT = -89.999999;

export interface PolarDemMeta {
  n: number;
  step_m: number;
  nodata: number;
}

export interface PolarDem {
  n: number;
  step: number;
  nodata: number;
  z: Int16Array;
}

export function parsePolarDem(meta: PolarDemMeta, buffer: ArrayBuffer): PolarDem {
  const expected = meta.n * meta.n * 2;
  if (buffer.byteLength !== expected) throw new Error(`dem_polar_500m.bin has ${buffer.byteLength} bytes; expected ${expected}`);
  return { n: meta.n, step: meta.step_m, nodata: meta.nodata, z: new Int16Array(buffer) };
}

export async function loadPolarDem(baseUrl: string): Promise<PolarDem> {
  const [m, b] = await Promise.all([fetch(baseUrl + "dem_polar_500m.json"), fetch(baseUrl + "dem_polar_500m.bin")]);
  if (!m.ok || !b.ok) throw new Error("Could not download the polar terrain");
  return parsePolarDem((await m.json()) as PolarDemMeta, await b.arrayBuffer());
}

/** Terrain height (m) at a point, bilinear between pixel centres; NaN outside the map or on missing data. */
export function sampleHeight(dem: PolarDem, lonDeg: number, latDeg: number): number {
  const rho = 2 * R * Math.tan(((90 + latDeg) * RAD) / 2);
  const x = rho * Math.sin(lonDeg * RAD);
  const y = rho * Math.cos(lonDeg * RAD);
  const col = x / dem.step + dem.n / 2 - 0.5;
  const row = dem.n / 2 - 0.5 - y / dem.step;
  if (!(row >= 0 && col >= 0 && row <= dem.n - 1 && col <= dem.n - 1)) return NaN;
  const r0 = Math.min(Math.floor(row), dem.n - 2);
  const c0 = Math.min(Math.floor(col), dem.n - 2);
  const fr = row - r0;
  const fc = col - c0;
  const at = (r: number, c: number) => {
    const v = dem.z[r * dem.n + c];
    return v === dem.nodata ? NaN : v;
  };
  return (
    (1 - fr) * ((1 - fc) * at(r0, c0) + fc * at(r0, c0 + 1)) +
    fr * ((1 - fc) * at(r0 + 1, c0) + fc * at(r0 + 1, c0 + 1))
  );
}

function rayDistances(s0: number, s1: number, pix: number): number[] {
  const out: number[] = [];
  for (let s = s0; s <= s1; s += Math.max(pix, STEP_FRAC * s)) out.push(s);
  return out;
}

export interface CustomHorizon {
  /** Highest terrain angle per azimuth; -90 where the ray never finds terrain data (raw, as in Python). */
  raw: number[];
  siteHeightM: number;
  radiusKm: number;
}

/** The horizon at (lat, lon) from the polar terrain, or null if the site itself is outside the map. */
export function computeCustomHorizon(dem: PolarDem, latDeg: number, lonDeg: number, hObsM = 2, azStepDeg = 0.25): CustomHorizon | null {
  const lat = Math.max(latDeg, POLE_LAT);
  const lon = ((lonDeg % 360) + 360) % 360;
  const hSite = sampleHeight(dem, lon, lat);
  if (Number.isNaN(hSite)) return null;

  const radiusKm = latDeg <= -88 ? 250 : 150;
  const distances = rayDistances(dem.step, radiusKm * 1000, dem.step);
  const th = distances.map((s) => s / R);
  const sinTh = th.map(Math.sin);
  const cosTh = th.map(Math.cos);
  const p1 = lat * RAD;
  const l1 = lon * RAD;
  const r1 = R + hSite + hObsM;
  const count = Math.round(360 / azStepDeg);
  const raw = new Array<number>(count);

  for (let k = 0; k < count; k++) {
    const az = k * azStepDeg * RAD;
    let best = -90;
    for (let j = 0; j < distances.length; j++) {
      // F10: point at distance s along the great circle
      const p2 = Math.asin(Math.sin(p1) * cosTh[j] + Math.cos(p1) * sinTh[j] * Math.cos(az));
      const l2 = l1 + Math.atan2(Math.sin(az) * sinTh[j] * Math.cos(p1), cosTh[j] - Math.sin(p1) * Math.sin(p2));
      const h = sampleHeight(dem, l2 / RAD, p2 / RAD);
      if (Number.isNaN(h)) continue;
      // F9: exact angle above level from the mast to that point
      const r2 = R + h;
      const angle = Math.atan2(r2 * cosTh[j] - r1, r2 * sinTh[j]) / RAD;
      if (angle > best) best = angle;
    }
    raw[k] = best;
  }
  return { raw, siteHeightM: hSite, radiusKm };
}

/**
 * A HorizonMask for the engine. Directions where the ray leaves the map get the smooth-Moon horizon
 * from the mast (not -90), and `missing` says how many there were.
 */
export function customMask(dem: PolarDem, latDeg: number, lonDeg: number, hObsM = 2): { mask: HorizonMask; missing: number } | null {
  const h = computeCustomHorizon(dem, latDeg, lonDeg, hObsM);
  if (!h) return null;
  const dip = -Math.acos(R / (R + hObsM)) / RAD;
  let missing = 0;
  const elev = h.raw.map((v) => {
    if (v > -90) return Math.max(v, dip);
    missing += 1;
    return dip;
  });
  return {
    mask: {
      az_step_deg: 0.25,
      elev_deg: elev,
      elev_lo_deg: null,
      elev_hi_deg: null,
      observer_height_m: hObsM,
      site_height_m: h.siteHeightM,
      radius_km: h.radiusKm,
      dems_used: ["dem_polar_500m"],
      label: "approximate",
    },
    missing,
  };
}
