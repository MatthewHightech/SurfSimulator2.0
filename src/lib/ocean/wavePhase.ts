/**
 * Wave motion is driven by phase angles integrated on the CPU (always kept in [0, 2π)).
 * Shaders never see raw time or ω·t — only sin/cos pairs — so motion stays continuous
 * for hours without float-precision drift or periodic teleports.
 */

const TAU = Math.PI * 2;
const MAX_DELTA = 1 / 20;

export type WaveOscillator = {
  sin: number;
  cos: number;
};

export type WavePhaseState = {
  swell: WaveOscillator;
  chop: WaveOscillator;
  peel: WaveOscillator;
  foamScroll: number;
};

let swellPhase = 0;
let chopPhase = 0;
let peelPhase = 0;
let foamScroll = 0;

const state: WavePhaseState = {
  swell: { sin: 0, cos: 1 },
  chop: { sin: 0, cos: 1 },
  peel: { sin: 0, cos: 1 },
  foamScroll: 0,
};

function wrapPhase(phase: number): number {
  let p = phase % TAU;
  if (p < 0) p += TAU;
  return p;
}

function setOscillator(target: WaveOscillator, phase: number) {
  target.sin = Math.sin(phase);
  target.cos = Math.cos(phase);
}

export function getWavePhaseState(): Readonly<WavePhaseState> {
  return state;
}

export function resetWavePhase(): void {
  swellPhase = 0;
  chopPhase = 0;
  peelPhase = 0;
  foamScroll = 0;
  setOscillator(state.swell, 0);
  setOscillator(state.chop, 0);
  setOscillator(state.peel, 0);
  state.foamScroll = 0;
}

export function advanceWavePhase(delta: number, baseFrequency: number): void {
  const dt = Math.min(Math.max(delta, 0), MAX_DELTA);
  const omega = Math.max(baseFrequency, 0.001);

  swellPhase = wrapPhase(swellPhase + omega * dt);
  chopPhase = wrapPhase(chopPhase + omega * 1.12 * dt);
  peelPhase = wrapPhase(peelPhase + 1.05 * dt);

  setOscillator(state.swell, swellPhase);
  setOscillator(state.chop, chopPhase);
  setOscillator(state.peel, peelPhase);

  foamScroll = (foamScroll + dt * 0.045) % 1;
  state.foamScroll = foamScroll;
}
