"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { useSimulation } from "@/context/SimulationContext";
import { estimateMeanShoalingDepthM } from "@/lib/bathymetry/estimateShoalingDepth";
import { buildFloorHeightTexture } from "@/lib/bathymetry/buildFloorHeightTexture";
import {
  BEACH_WASH_Z,
  BEACH_Z_MAX,
  FFT_RESOLUTION,
  OCEAN_TILE_SIZE,
  OCEAN_Z_DEEP,
  OCEAN_Z_SHORE,
} from "@/lib/ocean/constants";
import { createOceanGeometry } from "@/lib/ocean/createOceanGeometry";
import {
  oceanSurfaceFragmentShader,
  oceanSurfaceVertexShader,
} from "@/lib/ocean/fft/shaders";
import { swellDirectionVector } from "@/lib/ocean/swellPhysics";
import { useFftOcean } from "@/hooks/useFftOcean";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export function OceanSurface() {
  const simulation = useSimulation();
  const { texture, canvas, ready, mapRevision } = useBathymetry();
  const { camera } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const swellDirRef = useRef(new THREE.Vector2(0, 1));

  const simRef = useFftOcean({
    periodSeconds: simulation.swellPeriodSeconds,
    heightMeters: simulation.swellHeightMeters,
    directionDeg: simulation.swellDirectionDeg,
  });

  const geometry = useMemo(() => createOceanGeometry(), []);

  const meanDepthM = useMemo(() => {
    if (!canvas) return 6;
    void mapRevision;
    return estimateMeanShoalingDepthM(canvas, simulation.tide);
  }, [canvas, mapRevision, simulation.tide]);

  const effectiveMeanDepth =
    simulation.breaking.meanDepthOverride > 0
      ? simulation.breaking.meanDepthOverride
      : meanDepthM;

  const uniforms = useMemo(
    () => ({
      uDisplacementMap: { value: null as THREE.Texture | null },
      uJacobianMap: { value: null as THREE.Texture | null },
      uNormalMap: { value: null as THREE.Texture | null },
      uBathymetry: { value: null as THREE.Texture | null },
      uFloorHeight: { value: null as THREE.Texture | null },
      uDisplacementScale: { value: 1 },
      uDispMapSize: { value: FFT_RESOLUTION },
      uOceanExtent: { value: OCEAN_TILE_SIZE },
      uTideMeters: { value: 0 },
      uOceanZDeep: { value: OCEAN_Z_DEEP },
      uOceanZShore: { value: OCEAN_Z_SHORE },
      uBeachZMax: { value: BEACH_Z_MAX },
      uWashExtent: { value: BEACH_WASH_Z },
      uSwellDirection: { value: swellDirRef.current },
      uJacobianThreshold: { value: 0.42 },
      uBreakZoneShallowMin: { value: 0.48 },
      uBreakZoneShallowMax: { value: 0.86 },
      uPlungeStrength: { value: 1 },
      uLipThrow: { value: 1.35 },
      uLipDrop: { value: 0.55 },
      uBackFaceFlatten: { value: 0.45 },
      uFaceSteepen: { value: 0.35 },
      uBarrelPocket: { value: 0.85 },
      uJacobianFoamGain: { value: 1.1 },
      uBarrelDarken: { value: 0.55 },
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

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.setDispersionParams({
      meanWaterDepthM: effectiveMeanDepth,
      shallowDispersion: simulation.breaking.shallowDispersion,
      jacobianThreshold: simulation.breaking.jacobianThreshold,
    });
  }, [simRef, effectiveMeanDepth, simulation.breaking]);

  useFrame((_, delta) => {
    const sim = simRef.current;
    const material = materialRef.current;
    if (!sim || !material || !ready || !texture || !floorTexture) return;

    sim.update(delta);

    const { x, y } = swellDirectionVector(simulation.swellDirectionDeg);
    swellDirRef.current.set(x, y);

    const b = simulation.breaking;
    material.uniforms.uDisplacementMap.value = sim.displacementMap.texture;
    material.uniforms.uJacobianMap.value = sim.jacobianMap.texture;
    material.uniforms.uNormalMap.value = sim.normalMap.texture;
    material.uniforms.uBathymetry.value = texture;
    material.uniforms.uTideMeters.value = simulation.tide;
    material.uniforms.uCameraPosition.value.copy(camera.position);
    material.uniforms.uSwellDirection.value.copy(swellDirRef.current);
    material.uniforms.uJacobianThreshold.value = b.jacobianThreshold;
    material.uniforms.uBreakZoneShallowMin.value = b.breakZoneShallowMin;
    material.uniforms.uBreakZoneShallowMax.value = b.breakZoneShallowMax;
    material.uniforms.uPlungeStrength.value = b.plungeStrength;
    material.uniforms.uLipThrow.value = b.lipThrow;
    material.uniforms.uLipDrop.value = b.lipDrop;
    material.uniforms.uBackFaceFlatten.value = b.backFaceFlatten;
    material.uniforms.uFaceSteepen.value = b.faceSteepen;
    material.uniforms.uBarrelPocket.value = b.barrelPocket;
    material.uniforms.uJacobianFoamGain.value = b.jacobianFoamGain;
    material.uniforms.uBarrelDarken.value = b.barrelDarken;
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
