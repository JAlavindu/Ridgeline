/// <reference lib="webworker" />
import { customMask, loadPolarDem, type PolarDem } from "../engine/customHorizon";

/*
 * Builds custom-coordinate horizons off the main thread. The 6.7 MB polar terrain is downloaded the
 * first time a custom point is asked for, then kept for later requests.
 */
interface Request { id: number; baseUrl: string; lat: number; lon: number; hObs: number }

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let dem: Promise<PolarDem> | null = null;

ctx.onmessage = async (event: MessageEvent<Request>) => {
  const { id, baseUrl, lat, lon, hObs } = event.data;
  try {
    dem ??= loadPolarDem(baseUrl);
    const result = customMask(await dem, lat, lon, hObs);
    ctx.postMessage({ id, ok: true, mask: result?.mask ?? null, missing: result?.missing ?? 0 });
  } catch (err) {
    dem = null; // allow a retry after a failed download
    ctx.postMessage({ id, ok: false, message: err instanceof Error ? err.message : String(err) });
  }
};
