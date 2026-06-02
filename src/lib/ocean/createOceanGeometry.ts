import {
  BEACH_Z_MAX,
  OCEAN_PLANE_SEGMENTS,
  OCEAN_TILE_SIZE,
  OCEAN_Z_DEEP,
} from "@/lib/ocean/constants";
import * as THREE from "three";

/** XZ ocean plane (Y up), extended up the beach for wash. */
export function createOceanGeometry(): THREE.BufferGeometry {
  const halfX = OCEAN_TILE_SIZE / 2;
  const zMin = OCEAN_Z_DEEP;
  const zMax = BEACH_Z_MAX;
  const zSpan = zMax - zMin;
  const segments = OCEAN_PLANE_SEGMENTS;
  const segmentsZ = Math.round(segments * (zSpan / OCEAN_TILE_SIZE));
  const vertsX = segments + 1;
  const vertsZ = segmentsZ + 1;

  const positions = new Float32Array(vertsX * vertsZ * 3);
  const uvs = new Float32Array(vertsX * vertsZ * 2);
  const indices: number[] = [];

  let ptr = 0;
  for (let j = 0; j < vertsZ; j++) {
    const v = j / segmentsZ;
    const z = zMin + v * zSpan;
    const oceanV = (z - zMin) / OCEAN_TILE_SIZE;

    for (let i = 0; i < vertsX; i++) {
      const u = i / segments;
      const x = -halfX + u * OCEAN_TILE_SIZE;

      positions[ptr] = x;
      positions[ptr + 1] = 0;
      positions[ptr + 2] = z;

      uvs[(ptr / 3) * 2] = u;
      uvs[(ptr / 3) * 2 + 1] = Math.min(1, Math.max(0, oceanV));
      ptr += 3;
    }
  }

  for (let j = 0; j < segmentsZ; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * vertsX + i;
      const b = a + 1;
      const c = a + vertsX;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
