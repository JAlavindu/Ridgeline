import { useEffect, useState } from "react";
import { loadEphemeris, loadMask, type Ephemeris, type HorizonMask } from "../engine";

const DATA_URL = import.meta.env.BASE_URL + "data/";

/** M3's horizon mask files, keyed by the app's site ids. Other sites use the smooth-Moon horizon. */
export const MASK_FILES: Record<string, string> = {
  "apollo-11": "apollo11",
  "apollo-12": "apollo12",
  "apollo-14": "apollo14",
  "apollo-15": "apollo15",
  "apollo-16": "apollo16",
  "apollo-17": "apollo17",
  "change-4": "change4",
  "chandrayaan-3": "chandrayaan3_isro",
  "chandrayaan3-lroc": "chandrayaan3_lroc",
  "slim": "slim",
  "im-1": "im1",
  "im-2": "im2",
  "blue-ghost-1": "blueghost1",
  "connecting-ridge": "connecting_ridge",
  "shackleton-site004": "shackleton_site004",
  "malapert-massif": "malapert_massif",
};


// Downloads are started once and shared: every component gets the same promise.
let ephemerisPromise: Promise<Ephemeris> | null = null;
const maskPromises = new Map<string, Promise<HorizonMask>>();

/** The ephemeris (2.8 MB), downloaded the first time any component asks for it. */
export function useEphemeris(): { eph: Ephemeris | null; error: string | null } {
  const [eph, setEph] = useState<Ephemeris | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ephemerisPromise ??= loadEphemeris(DATA_URL);
    ephemerisPromise.then(
      (loaded) => {
        if (active) setEph(loaded);
      },
      (err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return { eph, error };
}

/** M3's terrain horizon for a site, or null if there is no mask file for it. */
export function useMask(siteId: string): { mask: HorizonMask | null; loading: boolean } {
  const file = MASK_FILES[siteId];
  const [loaded, setLoaded] = useState<{ siteId: string; mask: HorizonMask | null } | null>(null);

  useEffect(() => {
    if (!file) return;
    let active = true;
    let promise = maskPromises.get(file);
    if (!promise) {
      promise = loadMask(DATA_URL, file);
      maskPromises.set(file, promise);
    }
    promise.then(
      (mask) => {
        if (active) setLoaded({ siteId, mask });
      },
      () => {
        if (active) setLoaded({ siteId, mask: null }); // missing file: fall back to smooth Moon
      },
    );
    return () => {
      active = false;
    };
  }, [file, siteId]);

  if (!file) return { mask: null, loading: false };
  if (loaded?.siteId !== siteId) return { mask: null, loading: true };
  return { mask: loaded.mask, loading: false };
}
