"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { useSimulation } from "@/context/SimulationContext";
import { OCEAN_GRID_SIZE } from "@/lib/ocean/constants";
import {
  createOceanUniforms,
  syncOceanUniforms,
} from "@/lib/ocean/uniforms";
import {
  sprayFragmentShader,
  sprayVertexShader,
} from "@/shaders/ocean/shaders";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const SPRAY_COLS = 96;
const SPRAY_ROWS = 72;
const SPRAY_LAYERS = 4;
const SPRAY_COUNT = SPRAY_COLS * SPRAY_ROWS * SPRAY_LAYERS;

function buildSprayGeometry() {
  const xy = new Float32Array(SPRAY_COUNT * 2);
  const seeds = new Float32Array(SPRAY_COUNT);
  const layers = new Float32Array(SPRAY_COUNT);

  let i = 0;
  for (let layer = 0; layer < SPRAY_LAYERS; layer++) {
    for (let row = 0; row < SPRAY_ROWS; row++) {
      for (let col = 0; col < SPRAY_COLS; col++) {
        const u = col / (SPRAY_COLS - 1);
        const v = row / (SPRAY_ROWS - 1);
        xy[i * 2] = (u - 0.5) * OCEAN_GRID_SIZE;
        xy[i * 2 + 1] = (v - 0.5) * OCEAN_GRID_SIZE;
        seeds[i] = Math.random();
        layers[i] = layer / (SPRAY_LAYERS - 1);
        i++;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("aXy", new THREE.BufferAttribute(xy, 2));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aLayer", new THREE.BufferAttribute(layers, 1));
  return geometry;
}

export function CrestSpray() {
  const { texture, ready, mapRevision } = useBathymetry();
  const simulation = useSimulation();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => buildSprayGeometry(), []);

  const uniforms = useMemo(
    () => ({
      ...createOceanUniforms(simulation),
      uPointScale: { value: 5.2 },
    }),
    [simulation],
  );

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
    <points geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={sprayVertexShader}
        fragmentShader={sprayFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
