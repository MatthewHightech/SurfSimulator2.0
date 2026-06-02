"use client";

import { useSimulation } from "@/context/SimulationContext";
import type { BreakingParams } from "@/lib/ocean/breakingParams";
import { useCallback, useRef, useState } from "react";

type SliderSpec = {
  key: keyof BreakingParams;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
};

const BREAKING_SLIDERS: SliderSpec[] = [
  {
    key: "jacobianThreshold",
    label: "Jacobian threshold",
    min: 0.15,
    max: 0.85,
    step: 0.01,
    hint: "Lower → folding starts earlier (sharper crests)",
  },
  {
    key: "jacobianFoamGain",
    label: "Fold foam",
    min: 0,
    max: 2,
    step: 0.05,
    hint: "Foam driven by mesh fold (J < threshold)",
  },
  {
    key: "breakZoneShallowMin",
    label: "Break zone start",
    min: 0.2,
    max: 0.7,
    step: 0.01,
    hint: "shallowNorm where plunging begins",
  },
  {
    key: "breakZoneShallowMax",
    label: "Break zone end",
    min: 0.6,
    max: 0.98,
    step: 0.01,
    hint: "shallowNorm where plunging fades",
  },
  {
    key: "plungeStrength",
    label: "Plunge strength",
    min: 0,
    max: 2,
    step: 0.05,
    hint: "Master lip / face deform intensity",
  },
  {
    key: "lipThrow",
    label: "Lip throw",
    min: 0,
    max: 3,
    step: 0.05,
    hint: "Forward throw along swell direction",
  },
  {
    key: "lipDrop",
    label: "Lip drop",
    min: 0,
    max: 1.5,
    step: 0.05,
    hint: "Crest drops as lip curls",
  },
  {
    key: "backFaceFlatten",
    label: "Back-face flatten",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "Softens trailing face of wave",
  },
  {
    key: "faceSteepen",
    label: "Face steepen",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "Extra height on wave face",
  },
  {
    key: "barrelDarken",
    label: "Barrel darken",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "Shadow in pocket under lip",
  },
  {
    key: "barrelPocket",
    label: "Barrel pocket",
    min: 0,
    max: 2,
    step: 0.05,
    hint: "Visibility of tube shadow",
  },
  {
    key: "shallowDispersion",
    label: "Shallow dispersion",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "ω = √(gk·tanh(kh)) blend vs deep √(gk)",
  },
  {
    key: "meanDepthOverride",
    label: "Mean depth override",
    min: 0,
    max: 12,
    step: 0.25,
    hint: "0 = auto from bathymetry; else fixed h (m)",
  },
];

export function BreakingTunePanel() {
  const simulation = useSimulation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    const payload = simulation.exportTune();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `surf-tune-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus("Exported");
    setTimeout(() => setImportStatus(null), 2000);
  }, [simulation]);

  const handleImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text !== "string") return;
        const ok = simulation.importTune(text);
        setImportStatus(ok ? "Imported" : "Invalid JSON");
        setTimeout(() => setImportStatus(null), 2500);
      };
      reader.readAsText(file);
    },
    [simulation],
  );

  return (
    <div className="pointer-events-auto flex max-h-[calc(100dvh-7rem)] w-64 flex-col gap-3 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Breaking / barrel
          </span>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
            Jacobian fold · plunging lip · shallow ω
          </p>
        </div>
        <button
          type="button"
          onClick={simulation.resetBreakingParams}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          Reset
        </button>
      </div>

      {BREAKING_SLIDERS.map((spec) => (
        <SliderField
          key={spec.key}
          id={`breaking-${spec.key}`}
          label={spec.label}
          value={simulation.breaking[spec.key]}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          hint={spec.hint}
          onChange={(v) => simulation.setBreakingParam(spec.key, v)}
        />
      ))}

      <div className="mt-1 flex flex-col gap-2 border-t border-slate-700/60 pt-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md bg-sky-600/90 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
        >
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = "";
          }}
        />
        {importStatus ? (
          <p className="text-center text-[10px] text-sky-400">{importStatus}</p>
        ) : null}
      </div>
    </div>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hint: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[11px] text-slate-200">
          {label}
        </label>
        <span className="tabular-nums text-[11px] font-medium text-amber-300/90">
          {value.toFixed(step < 0.05 ? 2 : step < 1 ? 1 : 0)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-amber-500"
      />
      <span className="text-[9px] leading-snug text-slate-500">{hint}</span>
    </div>
  );
}
