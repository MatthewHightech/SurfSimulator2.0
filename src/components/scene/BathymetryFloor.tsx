"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { OCEAN_GRID_SIZE, SEAFLOOR_WORLD_Y } from "@/lib/ocean/constants";
import { useMemo } from "react";
import * as THREE from "three";

export function BathymetryFloor() {
  const { texture, ready } = useBathymetry();

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(OCEAN_GRID_SIZE, OCEAN_GRID_SIZE, 1, 1),
    [],
  );

  if (!ready || !texture) {
    return null;
  }

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, SEAFLOOR_WORLD_Y, 0]}
      renderOrder={0}
    >
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        opacity={0.55}
        transparent
        depthWrite={true}
      />
    </mesh>
  );
}
