import {
  BEACH_Z_MAX,
  OCEAN_TILE_SIZE,
  OCEAN_Z_DEEP,
} from "@/lib/ocean/constants";
import {
  sampleTerrainFloorY,
  worldXZToFloorUv,
  type TerrainFloorSampleContext,
} from "./terrainFloor";
import * as THREE from "three";

export { worldXZToFloorUv };

const FLOOR_TEX_WIDTH = 256;

export function buildFloorHeightTexture(
  canvas: HTMLCanvasElement,
): THREE.DataTexture {
  const ctx2d = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx2d) {
    throw new Error("Bathymetry canvas 2D context unavailable");
  }

  const { width, height } = canvas;
  const image = ctx2d.getImageData(0, 0, width, height);
  const sampleCtx: TerrainFloorSampleContext = {
    data: image.data,
    width,
    height,
  };

  const zSpan = BEACH_Z_MAX - OCEAN_Z_DEEP;
  const texHeight = Math.max(
    64,
    Math.round(FLOOR_TEX_WIDTH * (zSpan / OCEAN_TILE_SIZE)),
  );

  const data = new Float32Array(FLOOR_TEX_WIDTH * texHeight * 4);
  const halfX = OCEAN_TILE_SIZE / 2;

  for (let j = 0; j < texHeight; j++) {
    const worldZ = OCEAN_Z_DEEP + (j / (texHeight - 1)) * zSpan;

    for (let i = 0; i < FLOOR_TEX_WIDTH; i++) {
      const worldX = -halfX + (i / (FLOOR_TEX_WIDTH - 1)) * OCEAN_TILE_SIZE;
      const floorY = sampleTerrainFloorY(worldX, worldZ, sampleCtx);
      const idx = (j * FLOOR_TEX_WIDTH + i) * 4;
      data[idx] = floorY;
      data[idx + 1] = floorY;
      data[idx + 2] = floorY;
      data[idx + 3] = 1;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    FLOOR_TEX_WIDTH,
    texHeight,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}
