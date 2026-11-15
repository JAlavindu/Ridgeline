import { useEffect, useState } from "react";

import type { HorizonMask } from "../engine";
import type { ScenarioCard } from "../lib/plan";
import { useSettings } from "../lib/settings";
import { inTerrainZone } from "../lib/terrainZone";

const DATA_URL = import.meta.env.BASE_URL + "data/";
const OUTSIDE: CustomHorizonResult = { mask: null, missing: 0 };

export interface CustomHorizonResult {
  mask: HorizonMask | null;   // null: the point is outside the polar terrain, so a smooth Moon is used
  missing: number;            // directions where the ray left the map (smooth-Moon horizon used there)
  error?: string;
}

interface Reply { id: number; ok: boolean; mask?: HorizonMask | null; missing?: number; message?: string }

let worker: Worker | null = null;
let nextId = 0;
const waiting = new Map<number, (reply: Reply) => void>();
const cache = new Map<string, Promise<CustomHorizonResult>>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../worker/horizonWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<Reply>) => {
      waiting.get(event.data.id)?.(event.data);
      waiting.delete(event.data.id);
    };
  }
  return worker;
}

function request(lat: number, lon: number, hObs: number): Promise<CustomHorizonResult> {
  const key = `${lat.toFixed(5)},${lon.toFixed(5)},${hObs}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = new Promise<CustomHorizonResult>((resolve) => {
      const id = ++nextId;
      waiting.set(id, (reply) => {
        if (!reply.ok) {
          cache.delete(key);
          resolve({ mask: null, missing: 0, error: reply.message ?? "Could not build the horizon" });
        } else {
          resolve({ mask: reply.mask ?? null, missing: reply.missing ?? 0 });
        }
      });
      getWorker().postMessage({ id, baseUrl: DATA_URL, lat, lon, hObs });
    });
    cache.set(key, promise);
  }
  return promise;
}

/**
 * The approximate horizon for a custom card: undefined while it is being built (or for preset cards),
 * then the result. The mast height comes from the mission rules.
 */
export function useCustomHorizon(card: ScenarioCard | null): CustomHorizonResult | undefined {
  const { settings } = useSettings();
  const custom = card?.site.kind === "custom" ? card.site : null;
  // Outside the terrain zone (75 deg S to the pole) there is no terrain to build: a smooth Moon is used,
  // exactly as the picker tells the user. No worker, no 6.7 MB download.
  const outside = custom !== null && !inTerrainZone(custom.lat);
  const site = outside ? null : custom;
  const key = site ? `${site.lat},${site.lon},${settings.mastM}` : null;
  const [loaded, setLoaded] = useState<{ key: string; result: CustomHorizonResult } | null>(null);

  useEffect(() => {
    if (!site || !key) return;
    let active = true;
    request(site.lat, site.lon, settings.mastM).then((result) => {
      if (active) setLoaded({ key, result });
    });
    return () => {
      active = false;
    };
  }, [key, site, settings.mastM]);

  if (outside) return OUTSIDE;
  if (!key || loaded?.key !== key) return undefined;
  return loaded.result;
}
