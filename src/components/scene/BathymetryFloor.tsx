"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { useMemo } from "react";
import * as THREE from "three";

const GRID_SIZE = 32;

export function BathymetryFloor() {
  const { texture, ready } = useBathymetry();

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 1, 1),
    [],
  );

  if (!ready || !texture) {
    return null;
  }

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.08, 0]}
      renderOrder={0}
    >
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
