"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { useSimulation } from "@/context/SimulationContext";
import {
  BEACH_WASH_Z,
  BEACH_Z_MAX,
  OCEAN_TILE_SIZE,
  OCEAN_Z_DEEP,
  OCEAN_Z_SHORE,
} from "@/lib/ocean/constants";
import { buildFloorHeightTexture } from "@/lib/bathymetry/buildFloorHeightTexture";
import { createOceanGeometry } from "@/lib/ocean/createOceanGeometry";
import {
  oceanSurfaceFragmentShader,
  oceanSurfaceVertexShader,
} from "@/lib/ocean/fft/shaders";
import { useFftOcean } from "@/hooks/useFftOcean";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export function OceanSurface() {
  const simulation = useSimulation();
  const { texture, canvas, ready, mapRevision } = useBathymetry();
  const { camera } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const simRef = useFftOcean({
    periodSeconds: simulation.swellPeriodSeconds,
    heightMeters: simulation.swellHeightMeters,
    directionDeg: simulation.swellDirectionDeg,
  });

  const geometry = useMemo(() => createOceanGeometry(), []);

  const uniforms = useMemo(
    () => ({
      uDisplacementMap: { value: null as THREE.Texture | null },
      uNormalMap: { value: null as THREE.Texture | null },
      uBathymetry: { value: null as THREE.Texture | null },
      uFloorHeight: { value: null as THREE.Texture | null },
      uDisplacementScale: { value: 1 },
      uOceanExtent: { value: OCEAN_TILE_SIZE },
      uTideMeters: { value: 0 },
      uOceanZDeep: { value: OCEAN_Z_DEEP },
      uOceanZShore: { value: OCEAN_Z_SHORE },
      uBeachZMax: { value: BEACH_Z_MAX },
      uWashExtent: { value: BEACH_WASH_Z },
      uSunDirection: { value: new THREE.Vector3(0.32, 0.9, 0.32).normalize() },
      uDeepColor: { value: new THREE.Color(0.02, 0.1, 0.24) },
      uShallowColor: { value: new THREE.Color(0.16, 0.5, 0.7) },
      uCameraPosition: { value: new THREE.Vector3() },
    }),
    [],
  );

  const floorTexture = useMemo(() => {
    if (!canvas) return null;
    void mapRevision;
    return buildFloorHeightTexture(canvas);
  }, [canvas, mapRevision]);

  useEffect(() => {
    return () => {
      floorTexture?.dispose();
    };
  }, [floorTexture]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material || !texture) return;
    material.uniforms.uBathymetry.value = texture;
    material.uniforms.uFloorHeight.value = floorTexture;
  }, [texture, floorTexture, mapRevision]);

  useFrame((_, delta) => {
    const sim = simRef.current;
    const material = materialRef.current;
    if (!sim || !material || !ready || !texture || !floorTexture) return;

    sim.update(delta);

    material.uniforms.uDisplacementMap.value = sim.displacementMap.texture;
    material.uniforms.uNormalMap.value = sim.normalMap.texture;
    material.uniforms.uBathymetry.value = texture;
    material.uniforms.uTideMeters.value = simulation.tide;
    material.uniforms.uCameraPosition.value.copy(camera.position);
  });

  if (!ready || !texture || !floorTexture) {
    return null;
  }

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={oceanSurfaceVertexShader}
        fragmentShader={oceanSurfaceFragmentShader}
        side={THREE.FrontSide}
        transparent
        depthWrite={true}
        depthTest={true}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-4}
      />
    </mesh>
  );
}
