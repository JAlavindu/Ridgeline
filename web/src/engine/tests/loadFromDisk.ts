import { readFileSync } from "node:fs";
import { parseEphemeris, type Ephemeris } from "../ephemeris";
import { checkMask, type HorizonMask } from "../mask";

const dataDir = new URL("../../../public/data/", import.meta.url);

export function loadEphemerisFromDisk(): Ephemeris {
  const meta = JSON.parse(readFileSync(new URL("ephem_meta.json", dataDir), "utf8"));
  const bytes = readFileSync(new URL("ephem.bin", dataDir));
  return parseEphemeris(meta, new Uint8Array(bytes).buffer);
}

export function loadMaskFromDisk(siteId: string): HorizonMask {
  return checkMask(JSON.parse(readFileSync(new URL(`masks/${siteId}.json`, dataDir), "utf8")));
}
