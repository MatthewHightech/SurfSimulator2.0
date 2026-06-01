/** Physical swell parameters → simulation units (1 world unit ≈ 1 m). */

const GRAVITY = 9.81;
const TAU = Math.PI * 2;

/** Reference period that maps to the legacy default look (~8 s). */
const REFERENCE_PERIOD_S = 8;

export const SWELL_PERIOD_RANGE = {
  min: 4,
  max: 18,
  step: 0.5,
  default: REFERENCE_PERIOD_S,
} as const;

export const SWELL_HEIGHT_RANGE = {
  min: 0.5,
  max: 5,
  step: 0.1,
  default: 2,
} as const;

/** Angular frequency ω (rad/s) used by the phase integrator — T = 2π/ω. */
export function swellPeriodToOmega(periodSeconds: number): number {
  const T = Math.max(periodSeconds, SWELL_PERIOD_RANGE.min);
  return TAU / T;
}

export function omegaToSwellPeriod(omega: number): number {
  return TAU / Math.max(omega, 0.001);
}

/**
 * Significant swell height (m) → sinusoidal peak amplitude in world units.
 * For sin waves, crest-to-trough ≈ 2A; Hs ≈ 2A in deep water.
 */
export function swellHeightToAmplitude(heightMeters: number): number {
  const H = Math.max(heightMeters, 0.1);
  return H * 0.5;
}

export function amplitudeToSwellHeight(amplitude: number): number {
  return amplitude * 2;
}

/**
 * Deep-water wavelength λ = gT²/(2π), scaled to fit the visible patch
 * while keeping period-driven lengthening physically correct.
 */
export function swellPeriodToWavelength(periodSeconds: number): number {
  const T = Math.max(periodSeconds, SWELL_PERIOD_RANGE.min);
  const deepWaterM = (GRAVITY * T * T) / TAU;
  const referenceLambda = 15;
  const referenceDeep = (GRAVITY * REFERENCE_PERIOD_S * REFERENCE_PERIOD_S) / TAU;
  const scale = referenceLambda / referenceDeep;
  return Math.min(28, Math.max(6, deepWaterM * scale));
}

export function chopWavelength(swellWavelength: number): number {
  return swellWavelength * 0.6;
}

export type SwellEngineParams = {
  baseFrequency: number;
  baseAmplitude: number;
  swellWavelength: number;
  chopWavelength: number;
};

export function swellToEngineParams(
  periodSeconds: number,
  heightMeters: number,
): SwellEngineParams {
  const swellWavelength = swellPeriodToWavelength(periodSeconds);
  return {
    baseFrequency: swellPeriodToOmega(periodSeconds),
    baseAmplitude: swellHeightToAmplitude(heightMeters),
    swellWavelength,
    chopWavelength: chopWavelength(swellWavelength),
  };
}
