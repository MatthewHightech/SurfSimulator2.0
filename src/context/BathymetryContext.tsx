"use client";

import { useBathymetryTexture } from "@/hooks/useBathymetryTexture";
import type { BathymetryPreset } from "@/lib/bathymetry/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type * as THREE from "three";

type BathymetryContextValue = {
  preset: BathymetryPreset;
  setPreset: (preset: BathymetryPreset) => void;
  texture: THREE.CanvasTexture | null;
  canvas: HTMLCanvasElement | null;
  ready: boolean;
  /** Bumped after the source canvas is redrawn (keeps 2D preview in sync). */
  mapRevision: number;
};

const BathymetryContext = createContext<BathymetryContextValue | null>(null);

export function BathymetryProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<BathymetryPreset>("beach");
  const bathymetry = useBathymetryTexture(preset);

  const setPreset = useCallback((next: BathymetryPreset) => {
    setPresetState(next);
  }, []);

  const value = useMemo<BathymetryContextValue>(
    () => ({
      preset,
      setPreset,
      texture: bathymetry?.texture ?? null,
      canvas: bathymetry?.canvas ?? null,
      ready: bathymetry !== null,
      mapRevision: bathymetry?.mapRevision ?? 0,
    }),
    [preset, setPreset, bathymetry],
  );

  return (
    <BathymetryContext.Provider value={value}>{children}</BathymetryContext.Provider>
  );
}

export function useBathymetry(): BathymetryContextValue {
  const ctx = useContext(BathymetryContext);
  if (!ctx) {
    throw new Error("useBathymetry must be used within BathymetryProvider");
  }
  return ctx;
}
