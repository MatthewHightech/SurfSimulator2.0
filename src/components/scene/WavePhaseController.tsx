"use client";

import { useSimulation } from "@/context/SimulationContext";
import { advanceWavePhase, resetWavePhase } from "@/lib/ocean/wavePhase";
import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";

/** Single clock for the entire ocean — advances phase once per frame before any mesh sync. */
export function WavePhaseController() {
  const { baseFrequency } = useSimulation();

  useEffect(() => () => resetWavePhase(), []);

  useFrame((_, delta) => {
    advanceWavePhase(delta, baseFrequency);
  }, -100);

  return null;
}
