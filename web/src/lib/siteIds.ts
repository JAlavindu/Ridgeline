/** App site id ("im-1", "chandrayaan-3") -> sites.json / data-file id ("im1", "chandrayaan3_isro"). */
export function normalizeSiteId(id: string): string {
  const clean = id.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean === "chandrayaan3") return "chandrayaan3_isro";
  return clean;
}
