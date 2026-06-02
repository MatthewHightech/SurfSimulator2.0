/** FFT ocean tile extent in world units (1 unit ≈ 1 m). */
export const OCEAN_TILE_SIZE = 64;

/** Visible mesh matches the FFT tile. */
export const OCEAN_GRID_SIZE = OCEAN_TILE_SIZE;

/** FFT texture resolution — power of two. */
export const FFT_RESOLUTION = 256;

/** Mesh segments for displacement sampling. */
export const OCEAN_PLANE_SEGMENTS = 256;

/** Tessendorf horizontal displacement intensity. */
export const OCEAN_CHOPPINESS = 1.5;

/** JONSWAP peak enhancement (3.3 = developing sea; higher = sharper swell peak). */
export const JONSWAP_GAMMA = 3.3;

/** Directional spread exponent — higher = narrower swell. */
export const SWELL_DIRECTIONAL_SPREAD = 12;

export const DEFAULT_SIMULATION = {
  swellPeriodSeconds: 8,
  swellHeightMeters: 2,
  swellDirectionDeg: 285,
};
