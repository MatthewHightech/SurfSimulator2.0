"use client";

import {
  DEFAULT_SIMULATION,
  FOAM_STEEPNESS_THRESHOLD,
} from "@/lib/ocean/constants";
import {
  SWELL_HEIGHT_RANGE,
  SWELL_PERIOD_RANGE,
  swellToEngineParams,
} from "@/lib/ocean/swellPhysics";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SimulationState = {
  swellPeriodSeconds: number;
  swellHeightMeters: number;
  swellDirectionDeg: number;
  tide: number;
  baseFrequency: number;
  baseAmplitude: number;
  swellWavelength: number;
  chopWavelength: number;
};

type SimulationContextValue = SimulationState & {
  setSwellPeriodSeconds: (value: number) => void;
  setSwellHeightMeters: (value: number) => void;
  setSwellDirectionDeg: (value: number) => void;
  setTide: (value: number) => void;
  foamThreshold: number;
};

const SimulationContext = createContext<SimulationContextValue | null>(null);

function clampPeriod(value: number) {
  return Math.min(
    SWELL_PERIOD_RANGE.max,
    Math.max(SWELL_PERIOD_RANGE.min, value),
  );
}

function clampHeight(value: number) {
  return Math.min(
    SWELL_HEIGHT_RANGE.max,
    Math.max(SWELL_HEIGHT_RANGE.min, value),
  );
}

function buildState(
  periodSeconds: number,
  heightMeters: number,
  swellDirectionDeg: number,
  tide: number,
): SimulationState {
  const engine = swellToEngineParams(periodSeconds, heightMeters);
  return {
    swellPeriodSeconds: periodSeconds,
    swellHeightMeters: heightMeters,
    swellDirectionDeg,
    tide,
    ...engine,
  };
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [swellPeriodSeconds, setSwellPeriodState] = useState<number>(
    DEFAULT_SIMULATION.swellPeriodSeconds,
  );
  const [swellHeightMeters, setSwellHeightState] = useState<number>(
    DEFAULT_SIMULATION.swellHeightMeters,
  );
  const [swellDirectionDeg, setSwellDirectionDeg] = useState(
    DEFAULT_SIMULATION.swellDirectionDeg,
  );
  const [tide, setTide] = useState(DEFAULT_SIMULATION.tide);

  const setSwellPeriodSeconds = useCallback((value: number) => {
    setSwellPeriodState(clampPeriod(value));
  }, []);

  const setSwellHeightMeters = useCallback((value: number) => {
    setSwellHeightState(clampHeight(value));
  }, []);

  const value = useMemo<SimulationContextValue>(
    () => ({
      ...buildState(
        swellPeriodSeconds,
        swellHeightMeters,
        swellDirectionDeg,
        tide,
      ),
      foamThreshold: FOAM_STEEPNESS_THRESHOLD,
      setSwellPeriodSeconds,
      setSwellHeightMeters,
      setSwellDirectionDeg,
      setTide,
    }),
    [
      swellPeriodSeconds,
      swellHeightMeters,
      swellDirectionDeg,
      tide,
      setSwellPeriodSeconds,
      setSwellHeightMeters,
    ],
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error("useSimulation must be used within SimulationProvider");
  }
  return ctx;
}
