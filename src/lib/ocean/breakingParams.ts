/** Tunable breaking / barrel / dispersion parameters (GPU + export). */

export const SHOAL_DEEP_M = 12;
export const SHOAL_MIN_M = 0.35;

export function shallowNormToWaterDepthM(shallowNorm: number): number {
  return SHOAL_DEEP_M + (SHOAL_MIN_M - SHOAL_DEEP_M) * shallowNorm;
}

export type BreakingParams = {
  /** Jacobian J below this → folding (typical 0.35–0.65). */
  jacobianThreshold: number;
  /** Extra foam from fold amount (0–2). */
  jacobianFoamGain: number;

  /** shallowNorm band where plunging deform applies. */
  breakZoneShallowMin: number;
  breakZoneShallowMax: number;
  /** Master plunging / lip intensity (0–2). */
  plungeStrength: number;
  /** Forward lip throw along swell (m scale). */
  lipThrow: number;
  /** Crest drops as lip curls (m scale). */
  lipDrop: number;
  /** Flatten back of wave (0–1). */
  backFaceFlatten: number;
  /** Steepen face before break (0–1). */
  faceSteepen: number;

  /** Darken pocket under lip (0–1). */
  barrelDarken: number;
  /** Barrel pocket visibility (0–2). */
  barrelPocket: number;

  /** Blend deep ω=√(gk) → shallow ω=√(gk·tanh(kh)) (0–1). */
  shallowDispersion: number;
  /** 0 = auto mean depth from bathymetry; else fixed h (m). */
  meanDepthOverride: number;
};

export const DEFAULT_BREAKING_PARAMS: BreakingParams = {
  jacobianThreshold: 0.42,
  jacobianFoamGain: 1.1,
  breakZoneShallowMin: 0.48,
  breakZoneShallowMax: 0.86,
  plungeStrength: 1.0,
  lipThrow: 1.35,
  lipDrop: 0.55,
  backFaceFlatten: 0.45,
  faceSteepen: 0.35,
  barrelDarken: 0.55,
  barrelPocket: 0.85,
  shallowDispersion: 0.72,
  meanDepthOverride: 0,
};

export type SurfTuneExport = {
  version: 1;
  exportedAt: string;
  simulation: {
    swellPeriodSeconds: number;
    swellHeightMeters: number;
    swellDirectionDeg: number;
    tide: number;
  };
  breaking: BreakingParams;
};

export function buildTuneExport(
  simulation: SurfTuneExport["simulation"],
  breaking: BreakingParams,
): SurfTuneExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    simulation,
    breaking: { ...breaking },
  };
}

export function parseTuneExport(json: string): SurfTuneExport | null {
  try {
    const data = JSON.parse(json) as SurfTuneExport;
    if (data.version !== 1 || !data.simulation || !data.breaking) return null;
    return data;
  } catch {
    return null;
  }
}

export function mergeBreakingParams(
  partial: Partial<BreakingParams>,
): BreakingParams {
  return { ...DEFAULT_BREAKING_PARAMS, ...partial };
}
