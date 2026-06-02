"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { buildBathymetryGeometry } from "@/lib/bathymetry/buildBathymetryGeometry";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export function BathymetryTerrain() {
  const { canvas, ready, mapRevision } = useBathymetry();
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    if (!canvas) return null;
    void mapRevision;
    return buildBathymetryGeometry({ canvas });
  }, [canvas, mapRevision]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!ready || !geometry) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={0} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.92}
        metalness={0.02}
        flatShading={false}
      />
    </mesh>
  );
}
