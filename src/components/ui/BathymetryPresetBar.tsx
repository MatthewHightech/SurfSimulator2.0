"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import {
  BATHYMETRY_PRESET_LABELS,
  BATHYMETRY_PRESETS,
  type BathymetryPreset,
} from "@/lib/bathymetry/types";

export function BathymetryPresetBar() {
  const { preset, setPreset, ready } = useBathymetry();

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-lg border border-slate-700/80 bg-slate-900/85 px-3 py-3 shadow-lg backdrop-blur-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Bathymetry
      </span>
      <div className="flex flex-wrap gap-2">
        {BATHYMETRY_PRESETS.map((id) => (
          <PresetButton
            key={id}
            id={id}
            label={BATHYMETRY_PRESET_LABELS[id]}
            active={preset === id}
            disabled={!ready}
            onSelect={setPreset}
          />
        ))}
      </div>
    </div>
  );
}

function PresetButton({
  id,
  label,
  active,
  disabled,
  onSelect,
}: {
  id: BathymetryPreset;
  label: string;
  active: boolean;
  disabled: boolean;
  onSelect: (preset: BathymetryPreset) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(id)}
      className={[
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-sky-600 text-white"
          : "bg-slate-800 text-slate-200 hover:bg-slate-700",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
