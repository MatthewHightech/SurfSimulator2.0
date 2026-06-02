/** Physical swell parameters → simulation units (1 world unit ≈ 1 m). */

const GRAVITY = 9.81;
const TAU = Math.PI * 2;

export const SWELL_PERIOD_RANGE = {
  min: 4,
  max: 18,
  step: 0.5,
  default: 8,
} as const;

export const SWELL_HEIGHT_RANGE = {
  min: 0.5,
  max: 5,
  step: 0.1,
  default: 2,
} as const;

export const SWELL_DIRECTION_RANGE = {
  min: 0,
  max: 360,
  step: 1,
  default: 285,
} as const;

/** Peak angular frequency ωp (rad/s) from swell period. */
export function swellPeriodToOmegaP(periodSeconds: number): number {
  const T = Math.max(periodSeconds, SWELL_PERIOD_RANGE.min);
  return TAU / T;
}

/** Deep-water peak wavelength λp = g·Tp²/(2π). */
export function swellPeriodToPeakWavelength(periodSeconds: number): number {
  const T = Math.max(periodSeconds, SWELL_PERIOD_RANGE.min);
  return (GRAVITY * T * T) / TAU;
}

export function swellDirectionVector(directionDeg: number): { x: number; y: number } {
  const rad = (directionDeg * Math.PI) / 180;
  return { x: Math.sin(rad), y: Math.cos(rad) };
}
