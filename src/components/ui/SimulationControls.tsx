"use client";

import { useSimulation } from "@/context/SimulationContext";
import {
  SWELL_HEIGHT_RANGE,
  SWELL_PERIOD_RANGE,
  swellPeriodToWavelength,
} from "@/lib/ocean/swellPhysics";

export function SimulationControls() {
  const simulation = useSimulation();
  const wavelength = swellPeriodToWavelength(simulation.swellPeriodSeconds);

  return (
    <div className="pointer-events-auto flex flex-col gap-4 rounded-lg border border-slate-700/80 bg-slate-900/85 px-3 py-3 shadow-lg backdrop-blur-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Swell
      </span>

      <SliderField
        id="swell-period"
        label="Period"
        value={simulation.swellPeriodSeconds}
        min={SWELL_PERIOD_RANGE.min}
        max={SWELL_PERIOD_RANGE.max}
        step={SWELL_PERIOD_RANGE.step}
        unit="s"
        hint="Longer period → slower, longer waves"
        onChange={simulation.setSwellPeriodSeconds}
      />

      <SliderField
        id="swell-height"
        label="Height"
        value={simulation.swellHeightMeters}
        min={SWELL_HEIGHT_RANGE.min}
        max={SWELL_HEIGHT_RANGE.max}
        step={SWELL_HEIGHT_RANGE.step}
        unit="m"
        hint="Significant swell height (trough to crest)"
        onChange={simulation.setSwellHeightMeters}
      />

      <p className="text-[10px] leading-snug text-slate-500">
        λ ≈ {wavelength.toFixed(0)} m on this patch · ω ={" "}
        {simulation.baseFrequency.toFixed(2)} rad/s
      </p>
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
  unit,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm text-slate-200">
          {label}
        </label>
        <span className="tabular-nums text-sm font-medium text-sky-300">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
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
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-sky-500"
      />
      <span className="text-[10px] text-slate-500">{hint}</span>
    </div>
  );
}
