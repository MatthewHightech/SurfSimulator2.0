import {
  BEACH_Z_MAX,
  OCEAN_TILE_SIZE,
  OCEAN_Z_DEEP,
  OCEAN_Z_SHORE,
} from "@/lib/ocean/constants";
import { readShallowNorm, worldXZToBathyUv } from "./bathyCoords";

export const REEF_FLOOR_DEEP_Y = -7;
export const REEF_FLOOR_SHALLOW_Y = -1.1;
export const BEACH_LAND_Y = 2.2;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Beach ramp — seafloor does not move with tide (only the water surface does). */
export function beachLandFloorY(worldZ: number): number {
  const t = (worldZ - OCEAN_Z_SHORE) / (BEACH_Z_MAX - OCEAN_Z_SHORE);
  const ramp = smoothstep(0, 1, t);
  return REEF_FLOOR_SHALLOW_Y + (BEACH_LAND_Y - REEF_FLOOR_SHALLOW_Y) * ramp;
}

export type TerrainFloorSampleContext = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

/** World-space seafloor height (m) — shared by terrain mesh and water clamp. */
export function sampleTerrainFloorY(
  worldX: number,
  worldZ: number,
  ctx: TerrainFloorSampleContext,
): number {
  if (worldZ > OCEAN_Z_SHORE) {
    return beachLandFloorY(worldZ);
  }

  const { u: bathU, v: bathV } = worldXZToBathyUv(
    worldX,
    worldZ,
    OCEAN_TILE_SIZE,
  );
  const shallowNorm = readShallowNorm(
    ctx.data,
    ctx.width,
    ctx.height,
    bathU,
    bathV,
    0,
  );
  return (
    REEF_FLOOR_DEEP_Y +
    (REEF_FLOOR_SHALLOW_Y - REEF_FLOOR_DEEP_Y) * shallowNorm
  );
}

export function worldXZToFloorUv(worldX: number, worldZ: number) {
  const zSpan = BEACH_Z_MAX - OCEAN_Z_DEEP;
  return {
    u: Math.min(0.998, Math.max(0.002, worldX / OCEAN_TILE_SIZE + 0.5)),
    v: Math.min(0.998, Math.max(0.002, 1 - (worldZ - OCEAN_Z_DEEP) / zSpan)),
  };
}
