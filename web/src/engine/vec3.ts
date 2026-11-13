export type Vec3 = [number, number, number];

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(v: Vec3, k: number): Vec3 {
  return [v[0] * k, v[1] * k, v[2] * k];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function norm(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

export const DEG = 180 / Math.PI;
export const RAD = Math.PI / 180;

/** Angle between two vectors in degrees (accurate even for tiny angles). */
export function angleBetweenDeg(a: Vec3, b: Vec3): number {
  return Math.atan2(norm(cross(a, b)), dot(a, b)) * DEG;
}
