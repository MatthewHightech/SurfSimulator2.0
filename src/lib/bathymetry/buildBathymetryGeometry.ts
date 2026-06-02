import {
  BEACH_Z_MAX,
  OCEAN_TILE_SIZE,
  OCEAN_Z_DEEP,
  OCEAN_Z_SHORE,
} from "@/lib/ocean/constants";
import { worldXZToBathyUv } from "./bathyCoords";
import {
  REEF_FLOOR_DEEP_Y,
  REEF_FLOOR_SHALLOW_Y,
  sampleTerrainFloorY,
} from "./terrainFloor";
import * as THREE from "three";

export const BATHYMETRY_MESH_SEGMENTS = 160;
export {
  BEACH_LAND_Y,
  REEF_FLOOR_DEEP_Y,
  REEF_FLOOR_SHALLOW_Y,
} from "./terrainFloor";

export type BuildBathymetryGeometryOptions = {
  canvas: HTMLCanvasElement;
  sizeX?: number;
  segments?: number;
};

export function buildBathymetryGeometry(
  options: BuildBathymetryGeometryOptions,
): THREE.BufferGeometry {
  const { canvas, sizeX = OCEAN_TILE_SIZE, segments = BATHYMETRY_MESH_SEGMENTS } =
    options;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Bathymetry canvas 2D context unavailable");
  }

  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const sampleCtx = { data: image.data, width, height };

  const zMin = OCEAN_Z_DEEP;
  const zMax = BEACH_Z_MAX;
  const zSpan = zMax - zMin;

  const vertsZ = Math.round(segments * (zSpan / sizeX));
  const vertsX = segments;
  const vertsXCount = vertsX + 1;
  const vertsZCount = vertsZ + 1;

  const positions = new Float32Array(vertsXCount * vertsZCount * 3);
  const uvs = new Float32Array(vertsXCount * vertsZCount * 2);
  const colors = new Float32Array(vertsXCount * vertsZCount * 3);
  const indices: number[] = [];

  const deepColor = new THREE.Color(0.04, 0.08, 0.14);
  const shallowColor = new THREE.Color(0.28, 0.42, 0.38);
  const wetSand = new THREE.Color(0.42, 0.38, 0.32);
  const drySand = new THREE.Color(0.52, 0.48, 0.4);
  const tmpColor = new THREE.Color();

  let ptr = 0;
  for (let j = 0; j < vertsZCount; j++) {
    const v = j / vertsZ;
    const worldZ = zMin + v * zSpan;

    for (let i = 0; i < vertsXCount; i++) {
      const u = i / vertsX;
      const worldX = (u - 0.5) * sizeX;
      const worldY = sampleTerrainFloorY(worldX, worldZ, sampleCtx);
      const shallowNorm =
        worldZ > OCEAN_Z_SHORE
          ? 1
          : (worldY - REEF_FLOOR_DEEP_Y) /
            (REEF_FLOOR_SHALLOW_Y - REEF_FLOOR_DEEP_Y);

      positions[ptr] = worldX;
      positions[ptr + 1] = worldY;
      positions[ptr + 2] = worldZ;

      const { u: bathU, v: bathV } = worldXZToBathyUv(
        worldX,
        Math.min(worldZ, OCEAN_Z_SHORE),
        OCEAN_TILE_SIZE,
      );
      uvs[(ptr / 3) * 2] = bathU;
      uvs[(ptr / 3) * 2 + 1] = bathV;

      if (worldZ > OCEAN_Z_SHORE + 2) {
        tmpColor.copy(drySand);
      } else if (worldZ > OCEAN_Z_SHORE) {
        tmpColor.copy(wetSand).lerp(drySand, (worldZ - OCEAN_Z_SHORE) / 8);
      } else {
        tmpColor.copy(deepColor).lerp(shallowColor, shallowNorm);
      }
      colors[ptr] = tmpColor.r;
      colors[ptr + 1] = tmpColor.g;
      colors[ptr + 2] = tmpColor.b;

      ptr += 3;
    }
  }

  for (let j = 0; j < vertsZ; j++) {
    for (let i = 0; i < vertsX; i++) {
      const a = j * vertsXCount + i;
      const b = a + 1;
      const c = a + vertsXCount;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
