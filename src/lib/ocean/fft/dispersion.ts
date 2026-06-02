const GRAVITY = 9.81;

/** Deep-water dispersion relation ω = √(g|k|). */
export function deepWaterOmega(k: number): number {
  return Math.sqrt(GRAVITY * Math.max(k, 0));
}

export function deepWaterPhaseSpeed(k: number): number {
  if (k < 1e-8) return 0;
  return deepWaterOmega(k) / k;
}
