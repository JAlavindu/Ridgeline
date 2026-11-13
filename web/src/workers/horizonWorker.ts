// Web Worker for on-demand horizon tracing using Thiran's dem_polar_500m.bin
// Formulas F9 (exact elevation) & F10 (great-circle destination) from pipeline/horizon.py

const N = 1830;
const STEP_M = 500.0;
const R = 1737400.0; // Lunar radius in meters

let demBuffer: Int16Array | null = null;
let loadPromise: Promise<Int16Array> | null = null;

async function getDemBuffer(): Promise<Int16Array> {
  if (demBuffer) return demBuffer;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch('/data/dem_polar_500m.bin');
    if (!res.ok) {
      throw new Error(`Failed to load dem_polar_500m.bin: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    demBuffer = new Int16Array(arrayBuffer);
    return demBuffer;
  })();

  return loadPromise;
}

// Stereographic coordinate conversion per dem_polar_500m.json
function latLonToColRow(latDeg: number, lonDeg: number): { col: number; row: number; x_m: number; y_m: number } {
  const radLat = ((90 + latDeg) / 2) * (Math.PI / 180);
  const radLon = lonDeg * (Math.PI / 180);
  const rho = 2 * R * Math.tan(radLat);
  const x_m = rho * Math.sin(radLon);
  const y_m = rho * Math.cos(radLon);

  const col = Math.round(x_m / STEP_M + N / 2 - 0.5);
  const row = Math.round(N / 2 - 0.5 - y_m / STEP_M);
  return { col, row, x_m, y_m };
}

// Sample elevation at (col, row)
function sampleHeight(buffer: Int16Array, col: number, row: number): number {
  if (col < 0 || col >= N || row < 0 || row >= N) return -32768;
  return buffer[row * N + col];
}

// Great-circle destination point (Formula F10)
function destPoints(latDeg: number, lonDeg: number, azDeg: number, s: number): { lat2: number; lon2: number } {
  const lat = Math.max(latDeg, -89.999999);
  const th = s / R;
  const azRad = (azDeg * Math.PI) / 180;
  const p1 = (lat * Math.PI) / 180;
  const l1 = (lonDeg * Math.PI) / 180;

  const sinP1 = Math.sin(p1);
  const cosP1 = Math.cos(p1);
  const sinTh = Math.sin(th);
  const cosTh = Math.cos(th);

  const sinP2 = sinP1 * cosTh + cosP1 * sinTh * Math.cos(azRad);
  const p2 = Math.asin(Math.max(-1, Math.min(1, sinP2)));
  const l2 = l1 + Math.atan2(Math.sin(azRad) * sinTh * cosP1, cosTh - sinP1 * sinP2);

  return {
    lat2: (p2 * 180) / Math.PI,
    lon2: (l2 * 180) / Math.PI,
  };
}

// Exact horizon angle with lunar spherical curvature (Formula F9)
function angleExact(s: number, h_terr: number, h_site: number, h_obs: number = 2.0): number {
  const th = s / R;
  const r1 = R + h_site + h_obs;
  const r2 = R + h_terr;
  return Math.atan2(r2 * Math.cos(th) - r1, r2 * Math.sin(th)) * (180 / Math.PI);
}

self.onmessage = async (e: MessageEvent<{
  lat: number;
  lon: number;
  azStepDeg?: number;
  maxRadiusKm?: number;
}>) => {
  try {
    const { lat, lon, azStepDeg = 0.5, maxRadiusKm = 120 } = e.data;
    const buffer = await getDemBuffer();

    const { col: siteCol, row: siteRow } = latLonToColRow(lat, lon);
    let siteHeight = sampleHeight(buffer, siteCol, siteRow);
    if (siteHeight === -32768) siteHeight = 0;

    const numAz = Math.round(360 / azStepDeg);
    const elevDeg = new Float64Array(numAz);
    elevDeg.fill(-90.0);

    // Build ray distance samples (from 500m up to maxRadiusKm with geometric stepping)
    const sDistances: number[] = [];
    let s = 500;
    while (s <= maxRadiusKm * 1000) {
      sDistances.push(s);
      s += Math.max(500, 0.015 * s);
    }

    // Ray trace along each azimuth angle
    for (let a = 0; a < numAz; a++) {
      const az = a * azStepDeg;
      let maxAng = -90.0;

      for (let i = 0; i < sDistances.length; i++) {
        const dist = sDistances[i];
        const { lat2, lon2 } = destPoints(lat, lon, az, dist);
        const { col, row } = latLonToColRow(lat2, lon2);
        const h_terr = sampleHeight(buffer, col, row);
        if (h_terr === -32768) continue;

        const ang = angleExact(dist, h_terr, siteHeight, 2.0);
        if (ang > maxAng) maxAng = ang;
      }

      elevDeg[a] = Number(maxAng.toFixed(4));
    }

    self.postMessage({
      success: true,
      mask: {
        az_step_deg: azStepDeg,
        elev_deg: Array.from(elevDeg),
        elev_lo_deg: null,
        elev_hi_deg: null,
        radius_km: maxRadiusKm,
        dems_used: ['dem_polar_500m.bin'],
        observer_height_m: 2.0,
        site_height_m: siteHeight,
        site_id: `custom_${lat.toFixed(2)}_${lon.toFixed(2)}`,
        site_name: `Custom Point (${lat.toFixed(2)}°S, ${lon.toFixed(2)}°E)`,
        lat,
        lon,
        label: 'calculated from polar 500m DEM',
      },
    });
  } catch (err: unknown) {
    self.postMessage({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export {};
