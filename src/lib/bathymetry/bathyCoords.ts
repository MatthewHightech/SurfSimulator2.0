/**
 * Maps world XZ (ocean patch) ↔ bathymetry texture UV.
 * Canvas layout: top row = deep (black), bottom row = shallow shore (white).
 * World: −Z = deep (far), +Z = shallow (toward default camera).
 */
export function worldXZToBathyUv(
  x: number,
  z: number,
  extent: number,
): { u: number; v: number } {
  const u = x / extent + 0.5;
  const v = 0.5 - z / extent;
  return {
    u: Math.min(0.98, Math.max(0.02, u)),
    v: Math.min(0.98, Math.max(0.02, v)),
  };
}

export function bathyUvToWorldXZ(
  u: number,
  v: number,
  extent: number,
): { x: number; z: number } {
  return {
    x: (u - 0.5) * extent,
    z: (0.5 - v) * extent,
  };
}

/** 0 = deep, 1 = shallow (matches canvas luminance). Tide in meters floods the shelf. */
export function readShallowNorm(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  u: number,
  v: number,
  tideMeters = 0,
): number {
  const col = Math.min(width - 1, Math.max(0, Math.round(u * (width - 1))));
  const row = Math.min(height - 1, Math.max(0, Math.round((1 - v) * (height - 1))));
  const idx = (row * width + col) * 4;
  const base = data[idx] / 255;
  return Math.min(1, Math.max(0, base + tideMeters / 10));
}
