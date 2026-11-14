import { readFileSync } from "node:fs";
import { parseEphemeris, type Ephemeris } from "../ephemeris";

export function loadEphemerisFromDisk(): Ephemeris {
  const dataDir = new URL("../../../public/data/", import.meta.url);
  const meta = JSON.parse(readFileSync(new URL("ephem_meta.json", dataDir), "utf8"));
  const bytes = readFileSync(new URL("ephem.bin", dataDir));
  return parseEphemeris(meta, new Uint8Array(bytes).buffer);
}
