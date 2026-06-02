import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  FftOceanSimulation,
  type FftOceanParams,
} from "@/lib/ocean/fft/FftOceanSimulation";

export function useFftOcean(params: FftOceanParams) {
  const { gl } = useThree();
  const simRef = useRef<FftOceanSimulation | null>(null);
  const { periodSeconds, heightMeters, directionDeg } = params;

  useEffect(() => {
    const sim = new FftOceanSimulation(gl);
    simRef.current = sim;
    return () => {
      sim.dispose();
      simRef.current = null;
    };
  }, [gl]);

  useEffect(() => {
    simRef.current?.setParams({ periodSeconds, heightMeters, directionDeg });
  }, [periodSeconds, heightMeters, directionDeg]);

  return simRef;
}
