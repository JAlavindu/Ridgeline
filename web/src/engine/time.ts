export const UNIX_TO_TDB_OFFSET_S = 946_727_930.816;

/** Milliseconds since 1970 (what JavaScript's Date uses) -> TDB seconds past J2000. */
export function unixMsToTdb(unixMs: number): number {
  return unixMs / 1000 - UNIX_TO_TDB_OFFSET_S;
}

/** TDB seconds past J2000 -> milliseconds since 1970. */
export function tdbToUnixMs(tdbS: number): number {
  return (tdbS + UNIX_TO_TDB_OFFSET_S) * 1000;
}

/** "2026-11-14T09:00:00Z" -> TDB seconds. The time zone (Z or +05:30) is required. */
export function isoToTdb(iso: string): number {
  if (!/(Z|[+-]\d\d:\d\d)$/.test(iso)) {
    throw new Error(`Time "${iso}" has no time zone; add Z for UTC`);
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    throw new Error(`Not a valid date: "${iso}"`);
  }
  return unixMsToTdb(ms);
}

/** TDB seconds -> "2026-11-14T09:00:00.000Z" (UTC, for display). */
export function tdbToIso(tdbS: number): string {
  return new Date(tdbToUnixMs(tdbS)).toISOString();
}
