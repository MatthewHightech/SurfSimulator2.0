export type BathymetryPreset = "beach" | "reef" | "point";

export const BATHYMETRY_PRESETS: readonly BathymetryPreset[] = [
  "beach",
  "reef",
  "point",
] as const;

export const BATHYMETRY_PRESET_LABELS: Record<BathymetryPreset, string> = {
  beach: "Beach Break",
  reef: "Reef Break",
  point: "Point Break",
};
