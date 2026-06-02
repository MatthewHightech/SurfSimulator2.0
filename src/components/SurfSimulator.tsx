"use client";

import { BathymetryProvider } from "@/context/BathymetryContext";
import { SimulationProvider } from "@/context/SimulationContext";
import { BathymetryTerrainPreview } from "@/components/ui/BathymetryTerrainPreview";
import { BathymetryPresetBar } from "@/components/ui/BathymetryPresetBar";
import { BreakingTunePanel } from "@/components/ui/BreakingTunePanel";
import { SimulationControls } from "@/components/ui/SimulationControls";
import { SurfCanvas } from "@/components/scene/SurfCanvas";

export function SurfSimulator() {
  return (
    <BathymetryProvider>
      <SimulationProvider>
        <main className="relative h-dvh w-full overflow-hidden bg-[#0a0e14]">
          <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 py-5">
            <h1 className="text-lg font-semibold tracking-tight text-slate-100">
              Surf Simulator
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              FFT swell · shoaling shelf · 3D beach
            </p>
          </header>

          <div className="absolute inset-0">
            <SurfCanvas />
          </div>

          <aside className="absolute left-4 top-20 z-10">
            <BreakingTunePanel />
          </aside>

          <aside className="absolute right-4 top-20 z-10 flex w-56 flex-col gap-4">
            <SimulationControls />
            <BathymetryPresetBar />
            <BathymetryTerrainPreview />
          </aside>

          <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 px-6 py-4">
            <p className="text-xs text-slate-500">
              Drag to orbit · Scroll to zoom · Switch breaks to reshape the reef
            </p>
          </footer>
        </main>
      </SimulationProvider>
    </BathymetryProvider>
  );
}
