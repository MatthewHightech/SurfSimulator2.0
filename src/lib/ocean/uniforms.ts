import { getWavePhaseState } from "@/lib/ocean/wavePhase";
import * as THREE from "three";

export function swellDirectionVector(degrees: number): THREE.Vector2 {
  const radians = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector2(Math.cos(radians), Math.sin(radians));
}

export type OceanShaderUniforms = {
  uBaseAmplitude: { value: number };
  uSwellDirection: { value: THREE.Vector2 };
  uTide: { value: number };
  uBathymetry: { value: THREE.Texture | null };
  uFoamThreshold: { value: number };
  uSwellWavelength: { value: number };
  uChopWavelength: { value: number };
  uSwellSin: { value: number };
  uSwellCos: { value: number };
  uChopSin: { value: number };
  uChopCos: { value: number };
  uPeelSin: { value: number };
  uPeelCos: { value: number };
  uFoamScroll: { value: number };
};

export type SimulationUniformInput = {
  baseAmplitude: number;
  swellDirectionDeg: number;
  tide: number;
  foamThreshold: number;
  swellWavelength: number;
  chopWavelength: number;
};

export function createOceanUniforms(
  simulation: SimulationUniformInput,
): OceanShaderUniforms {
  const phase = getWavePhaseState();
  return {
    uBaseAmplitude: { value: simulation.baseAmplitude },
    uSwellDirection: {
      value: swellDirectionVector(simulation.swellDirectionDeg),
    },
    uTide: { value: simulation.tide },
    uBathymetry: { value: null },
    uFoamThreshold: { value: simulation.foamThreshold },
    uSwellWavelength: { value: simulation.swellWavelength },
    uChopWavelength: { value: simulation.chopWavelength },
    uSwellSin: { value: phase.swell.sin },
    uSwellCos: { value: phase.swell.cos },
    uChopSin: { value: phase.chop.sin },
    uChopCos: { value: phase.chop.cos },
    uPeelSin: { value: phase.peel.sin },
    uPeelCos: { value: phase.peel.cos },
    uFoamScroll: { value: phase.foamScroll },
  };
}

export function syncOceanUniforms(
  uniforms: OceanShaderUniforms | Record<string, THREE.IUniform>,
  simulation: SimulationUniformInput,
) {
  const phase = getWavePhaseState();

  uniforms.uSwellSin.value = phase.swell.sin;
  uniforms.uSwellCos.value = phase.swell.cos;
  uniforms.uChopSin.value = phase.chop.sin;
  uniforms.uChopCos.value = phase.chop.cos;
  uniforms.uPeelSin.value = phase.peel.sin;
  uniforms.uPeelCos.value = phase.peel.cos;
  uniforms.uFoamScroll.value = phase.foamScroll;

  uniforms.uBaseAmplitude.value = simulation.baseAmplitude;
  uniforms.uSwellWavelength.value = simulation.swellWavelength;
  uniforms.uChopWavelength.value = simulation.chopWavelength;
  uniforms.uSwellDirection.value.copy(
    swellDirectionVector(simulation.swellDirectionDeg),
  );
  uniforms.uTide.value = simulation.tide;
}
