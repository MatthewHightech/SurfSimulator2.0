"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { useSimulation } from "@/context/SimulationContext";
import {
  OCEAN_GRID_SIZE,
  OCEAN_PLANE_SEGMENTS,
} from "@/lib/ocean/constants";
import {
  createOceanUniforms,
  syncOceanUniforms,
} from "@/lib/ocean/uniforms";
import {
  whitewaterFragmentShader,
  whitewaterVertexShader,
} from "@/shaders/ocean/shaders";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export function WhitewaterLayer() {
  const { texture, ready, mapRevision } = useBathymetry();
  const simulation = useSimulation();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(
    () =>
      new THREE.PlaneGeometry(
        OCEAN_GRID_SIZE,
        OCEAN_GRID_SIZE,
        OCEAN_PLANE_SEGMENTS,
        OCEAN_PLANE_SEGMENTS,
      ),
    [],
  );

  const uniforms = useMemo(() => createOceanUniforms(simulation), [simulation]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material || !texture) return;
    material.uniforms.uBathymetry.value = texture;
  }, [texture, mapRevision]);

  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;
    syncOceanUniforms(material.uniforms, simulation);
    if (texture) {
      material.uniforms.uBathymetry.value = texture;
    }
  });

  if (!ready || !texture) {
    return null;
  }

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={whitewaterVertexShader}
        fragmentShader={whitewaterFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}
