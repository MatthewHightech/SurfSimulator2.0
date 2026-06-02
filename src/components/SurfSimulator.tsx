"use client";

import { SimulationProvider } from "@/context/SimulationContext";
import { SimulationControls } from "@/components/ui/SimulationControls";
import { SurfCanvas } from "@/components/scene/SurfCanvas";

export function SurfSimulator() {
  return (
    <SimulationProvider>
      <main className="relative h-dvh w-full overflow-hidden bg-[#0a0e14]">
        <header className="pointer-events-none absolute left-0 right-0 top-0 z-10 px-6 py-5">
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            Surf Simulator
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            FFT ocean · JONSWAP swell spectrum · Phase 0
          </p>
        </header>

        <div className="absolute inset-0">
          <SurfCanvas />
        </div>

        <aside className="absolute right-4 top-20 z-10 flex w-56 flex-col gap-4">
          <SimulationControls />
        </aside>

        <footer className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 px-6 py-4">
          <p className="text-xs text-slate-500">
            Drag to orbit · Scroll to zoom · Flat-bottom FFT prototype
          </p>
        </footer>
      </main>
    </SimulationProvider>
  );
}
