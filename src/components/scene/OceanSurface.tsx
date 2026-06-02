"use client";

import {
  OCEAN_GRID_SIZE,
  OCEAN_PLANE_SEGMENTS,
} from "@/lib/ocean/constants";
import {
  oceanSurfaceFragmentShader,
  oceanSurfaceVertexShader,
} from "@/lib/ocean/fft/shaders";
import { useSimulation } from "@/context/SimulationContext";
import { useFftOcean } from "@/hooks/useFftOcean";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function OceanSurface() {
  const simulation = useSimulation();
  const { camera } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const simRef = useFftOcean({
    periodSeconds: simulation.swellPeriodSeconds,
    heightMeters: simulation.swellHeightMeters,
    directionDeg: simulation.swellDirectionDeg,
  });

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      OCEAN_GRID_SIZE,
      OCEAN_GRID_SIZE,
      OCEAN_PLANE_SEGMENTS,
      OCEAN_PLANE_SEGMENTS,
    );
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uDisplacementMap: { value: null as THREE.Texture | null },
      uNormalMap: { value: null as THREE.Texture | null },
      uDisplacementScale: { value: 1 },
      uSunDirection: { value: new THREE.Vector3(0.32, 0.9, 0.32).normalize() },
      uDeepColor: { value: new THREE.Color(0.02, 0.1, 0.24) },
      uShallowColor: { value: new THREE.Color(0.16, 0.5, 0.7) },
      uCameraPosition: { value: new THREE.Vector3() },
    }),
    [],
  );

  useFrame((_, delta) => {
    const sim = simRef.current;
    const material = materialRef.current;
    if (!sim || !material) return;

    sim.update(delta);

    material.uniforms.uDisplacementMap.value = sim.displacementMap.texture;
    material.uniforms.uNormalMap.value = sim.normalMap.texture;
    material.uniforms.uCameraPosition.value.copy(camera.position);
  });

  return (
    <mesh geometry={geometry} renderOrder={1}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={oceanSurfaceVertexShader}
        fragmentShader={oceanSurfaceFragmentShader}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
