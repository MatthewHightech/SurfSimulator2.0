import { OCEAN_TILE_SIZE } from "@/lib/ocean/constants";
import {
  SHOAL_DEEP_M,
  shallowNormToWaterDepthM,
} from "@/lib/ocean/breakingParams";
import { readShallowNorm, worldXZToBathyUv } from "./bathyCoords";

const SAMPLE_GRID = 24;

/**
 * Mean water depth (m) over the shoaling band — drives shallow-water dispersion.
 */
export function estimateMeanShoalingDepthM(
  canvas: HTMLCanvasElement,
  tideMeters: number,
  shallowMin = 0.35,
): number {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return SHOAL_DEEP_M;

  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;

  let sum = 0;
  let count = 0;

  for (let j = 0; j < SAMPLE_GRID; j++) {
    for (let i = 0; i < SAMPLE_GRID; i++) {
      const worldX = ((i + 0.5) / SAMPLE_GRID - 0.5) * OCEAN_TILE_SIZE;
      const worldZ = ((j + 0.5) / SAMPLE_GRID - 0.5) * OCEAN_TILE_SIZE;
      const { u, v } = worldXZToBathyUv(worldX, worldZ, OCEAN_TILE_SIZE);
      const shallowNorm = readShallowNorm(data, width, height, u, v, 0);
      if (shallowNorm < shallowMin) continue;
      const depth = shallowNormToWaterDepthM(shallowNorm) - tideMeters;
      sum += Math.max(0.35, depth);
      count++;
    }
  }

  return count > 0 ? sum / count : SHOAL_DEEP_M;
}
