/** FFT ocean tile extent in world units (1 unit ≈ 1 m). */
export const OCEAN_TILE_SIZE = 64;

/** Visible water surface matches the FFT tile (world Z: −32…+32). */
export const OCEAN_GRID_SIZE = OCEAN_TILE_SIZE;

/** World Z of the offshore (deep) edge — matches bathymetry canvas top. */
export const OCEAN_Z_DEEP = -OCEAN_TILE_SIZE / 2;

/** World Z of the in-water shoreline (shallow, before dry beach). */
export const OCEAN_Z_SHORE = OCEAN_TILE_SIZE / 2;

/** Terrain continues past the water edge toward the camera (+Z). */
export const BEACH_EXTENSION_Z = 28;

/** World Z where dry beach tops out (camera side). */
export const BEACH_Z_MAX = OCEAN_Z_SHORE + BEACH_EXTENSION_Z;

/** How far past the nominal shoreline the water mesh runs up the beach (m). */
export const BEACH_WASH_Z = 20;

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

/** Seafloor mesh sits below troughs. */
export const SEAFLOOR_WORLD_Y = -2.4;

/** Tide offset from mean sea level (m). */
export const TIDE_RANGE = {
  min: -2,
  max: 2,
  step: 0.1,
  default: 1.5,
} as const;

export const DEFAULT_SIMULATION = {
  swellPeriodSeconds: 8,
  swellHeightMeters: 2,
  swellDirectionDeg: 0,
  tide: TIDE_RANGE.default,
};
