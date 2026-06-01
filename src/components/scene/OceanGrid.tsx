"use client";

import { useMemo } from "react";
import * as THREE from "three";

const GRID_SIZE = 32;
const PLANE_SEGMENTS = 256;

export function OceanGrid() {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, PLANE_SEGMENTS, PLANE_SEGMENTS),
    [],
  );

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <meshBasicMaterial color="#3d8bfd" wireframe />
    </mesh>
  );
}
