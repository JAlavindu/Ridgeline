/** Azimuth difference the short way round the compass, scaled to a real sky distance (deg). */
export function azGapOnSky(a: number, b: number, elDeg: number): number {
  const gap = ((a - b + 540) % 360) - 180;
  return Math.abs(gap) * Math.cos((elDeg * Math.PI) / 180);
}
