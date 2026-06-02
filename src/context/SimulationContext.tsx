"use client";

import { DEFAULT_SIMULATION, TIDE_RANGE } from "@/lib/ocean/constants";
import {
  SWELL_HEIGHT_RANGE,
  SWELL_PERIOD_RANGE,
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
};

type SimulationContextValue = SimulationState & {
  setSwellPeriodSeconds: (value: number) => void;
  setSwellHeightMeters: (value: number) => void;
  setSwellDirectionDeg: (value: number) => void;
  setTide: (value: number) => void;
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

function clampDirection(value: number) {
  return ((value % 360) + 360) % 360;
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [swellPeriodSeconds, setSwellPeriodState] = useState(
    DEFAULT_SIMULATION.swellPeriodSeconds,
  );
  const [swellHeightMeters, setSwellHeightState] = useState(
    DEFAULT_SIMULATION.swellHeightMeters,
  );
  const [swellDirectionDeg, setSwellDirectionState] = useState(
    DEFAULT_SIMULATION.swellDirectionDeg,
  );
  const [tide, setTideState] = useState<number>(DEFAULT_SIMULATION.tide);

  const setSwellPeriodSeconds = useCallback((value: number) => {
    setSwellPeriodState(clampPeriod(value));
  }, []);

  const setSwellHeightMeters = useCallback((value: number) => {
    setSwellHeightState(clampHeight(value));
  }, []);

  const setSwellDirectionDeg = useCallback((value: number) => {
    setSwellDirectionState(clampDirection(value));
  }, []);

  const setTide = useCallback((value: number) => {
    setTideState(
      Math.min(TIDE_RANGE.max, Math.max(TIDE_RANGE.min, value)),
    );
  }, []);

  const value = useMemo<SimulationContextValue>(
    () => ({
      swellPeriodSeconds,
      swellHeightMeters,
      swellDirectionDeg,
      tide,
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
      setSwellDirectionDeg,
      setTide,
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
