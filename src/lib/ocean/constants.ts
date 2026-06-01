import {
  SWELL_HEIGHT_RANGE,
  SWELL_PERIOD_RANGE,
  swellToEngineParams,
} from "./swellPhysics";

/** World extent of the ocean plane (matches `PlaneGeometry` width/height). */
export const OCEAN_GRID_SIZE = 32;

/** Seafloor mesh sits below the lowest wave troughs so it never clips the surface. */
export const SEAFLOOR_WORLD_Y = -2.4;

export const OCEAN_PLANE_SEGMENTS = 256;

const defaultSwell = swellToEngineParams(
  SWELL_PERIOD_RANGE.default,
  SWELL_HEIGHT_RANGE.default,
);

export const DEFAULT_SIMULATION = {
  swellPeriodSeconds: SWELL_PERIOD_RANGE.default,
  swellHeightMeters: SWELL_HEIGHT_RANGE.default,
  swellDirectionDeg: 285,
  tide: 0,
  ...defaultSwell,
};

/** Peel / shore foam onset (lower = more foam). */
export const FOAM_STEEPNESS_THRESHOLD = 0.32;

/** 96 × 72 × 4 layers */
export const CREST_SPRAY_COUNT = 27648;
