import { JONSWAP_GAMMA, SWELL_DIRECTIONAL_SPREAD } from "@/lib/ocean/constants";
import { deepWaterOmega } from "./dispersion";

const GRAVITY = 9.81;

/** JONSWAP one-sided frequency spectrum S(ω) [m²·s]. */
export function jonswapSpectrumOmega(
  omega: number,
  omegaP: number,
  alpha: number,
  gamma: number = JONSWAP_GAMMA,
): number {
  if (omega <= 0 || omegaP <= 0) return 0;

  const sigma = omega <= omegaP ? 0.07 : 0.09;
  const peakEnhancement = Math.pow(
    gamma,
    Math.exp(
      -((omega - omegaP) ** 2) /
        (2 * sigma * sigma * omegaP * omegaP),
    ),
  );

  return (
    alpha *
    (GRAVITY * GRAVITY / Math.pow(omega, 5)) *
    Math.exp(-1.25 * Math.pow(omegaP / omega, 4)) *
    peakEnhancement
  );
}

/** Hasselmann-style directional spread D(θ) normalized over [-π, π]. */
export function directionalSpread(
  theta: number,
  spreadPower: number = SWELL_DIRECTIONAL_SPREAD,
): number {
  const halfAngle = theta * 0.5;
  const c = Math.abs(Math.cos(halfAngle));
  if (c < 1e-6) return 0;
  // Normalization constant for |cos(θ/2)|^(2s) on [-π, π]
  const norm = spreadPower / Math.PI;
  return norm * Math.pow(c, 2 * spreadPower);
}

/** Calibrate JONSWAP α so significant wave height ≈ Hs. */
export function calibrateJonswapAlpha(
  omegaP: number,
  hs: number,
  gamma: number = JONSWAP_GAMMA,
): number {
  const omegaMin = omegaP * 0.25;
  const omegaMax = omegaP * 4;
  const steps = 512;
  const dOmega = (omegaMax - omegaMin) / steps;

  let m0 = 0;
  for (let i = 0; i <= steps; i++) {
    const omega = omegaMin + i * dOmega;
    m0 += jonswapSpectrumOmega(omega, omegaP, 1, gamma) * dOmega;
  }

  // Hs ≈ 4√m₀ for a Rayleigh sea
  const targetM0 = (hs * hs) / 16;
  if (m0 <= 0) return 0.0081;
  return targetM0 / m0;
}

export type InitialSpectrumParams = {
  resolution: number;
  tileSize: number;
  periodSeconds: number;
  heightMeters: number;
  directionDeg: number;
  spreadPower?: number;
  gamma?: number;
  seed?: number;
};

/** Build complex h₀(k) texture data (RGBA float) for GPU upload. */
export function buildInitialSpectrum(
  params: InitialSpectrumParams,
): Float32Array {
  const {
    resolution: N,
    tileSize: L,
    periodSeconds,
    heightMeters,
    directionDeg,
    spreadPower = SWELL_DIRECTIONAL_SPREAD,
    gamma = JONSWAP_GAMMA,
    seed = 12345,
  } = params;

  const omegaP = (Math.PI * 2) / Math.max(periodSeconds, 4);
  const alpha = calibrateJonswapAlpha(omegaP, heightMeters, gamma);
  const swellRad = (directionDeg * Math.PI) / 180;
  const swellDirX = Math.sin(swellRad);
  const swellDirZ = Math.cos(swellRad);
  const dk = (Math.PI * 2) / L;
  const data = new Float32Array(N * N * 4);

  const rng = mulberry32(seed);

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const n = x < N / 2 ? x : x - N;
      const m = y < N / 2 ? y : y - N;
      const kx = (Math.PI * 2 * n) / L;
      const kz = (Math.PI * 2 * m) / L;
      const kLen = Math.sqrt(kx * kx + kz * kz);
      const idx = (y * N + x) * 4;

      if (kLen < 1e-6) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        continue;
      }

      const omega = deepWaterOmega(kLen);
      const waveAngle = Math.atan2(kz, kx);
      const relAngle = waveAngle - Math.atan2(swellDirZ, swellDirX);
      const sOmega = jonswapSpectrumOmega(omega, omegaP, alpha, gamma);
      const dTheta = directionalSpread(relAngle, spreadPower);
      const sK = (sOmega / kLen) * dTheta;

      const amplitude = Math.sqrt(Math.max(sK, 0) / 2) * dk;
      const xiR = gaussianRandom(rng);
      const xiI = gaussianRandom(rng);

      data[idx] = xiR * amplitude;
      data[idx + 1] = xiI * amplitude;
      data[idx + 2] = 0;
      data[idx + 3] = 0;
    }
  }

  return data;
}

function gaussianRandom(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
