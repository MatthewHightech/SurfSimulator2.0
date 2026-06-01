/**
 * Ocean surface math — spatial waves in the shader, temporal motion via CPU phase uniforms.
 * No uTime, no ω·t, no atan reconstruction (those caused jumps and long-run drift).
 */
export const oceanMathGlsl = /* glsl */ `
#define PI 3.14159265359
#define TAU 6.28318530718
#define SHALLOW_START 0.42
#define SHALLOW_FULL 0.9
#define OCEAN_EXTENT 32.0

uniform float uSwellSin;
uniform float uSwellCos;
uniform float uChopSin;
uniform float uChopCos;
uniform float uPeelSin;
uniform float uPeelCos;
uniform float uFoamScroll;
uniform float uSwellWavelength;
uniform float uChopWavelength;

float shallowMask(float depth) {
  return smoothstep(SHALLOW_START, SHALLOW_FULL, depth);
}

float sampleDepth(vec2 uv, float tide, sampler2D bathymetry) {
  return clamp(texture2D(bathymetry, uv).r + tide, 0.0, 1.0);
}

struct OceanSample {
  float height;
  vec2 gradient;
  float steepness;
};

float chopAttenuation(float depth) {
  return 1.0 - smoothstep(0.36, 0.62, depth);
}

float swellAmplitudeScale(float depth) {
  float innerSurf = smoothstep(0.78, 0.96, depth);
  float jackBand = smoothstep(0.58, 0.74, depth) * (1.0 - smoothstep(0.8, 0.94, depth));
  float mildShoal = smoothstep(0.44, 0.62, depth) * (1.0 - smoothstep(0.72, 0.88, depth));
  float scale = mix(1.0, 0.12, innerSurf);
  scale *= mix(1.0, 1.38, jackBand);
  scale *= mix(1.0, 1.15, mildShoal);
  return scale;
}

float innerSurfFlatten(float depth) {
  return smoothstep(0.76, 0.97, depth);
}

// height = A * sin(spatialPhase + temporalPhase)  →  sin(s)*cos(p) - cos(s)*sin(p)
float directedWave(
  vec2 x0,
  vec2 waveDir,
  float wavelength,
  float amplitude,
  float sinP,
  float cosP,
  out vec2 gradOut
) {
  float k = TAU / max(wavelength, 0.001);
  vec2 kVec = normalize(waveDir + 1e-6) * k;
  float spatial = dot(kVec, x0);
  float sinS = sin(spatial);
  float cosS = cos(spatial);

  float h = amplitude * (sinS * cosP - cosS * sinP);
  float dH = amplitude * (cosS * cosP + sinS * sinP);
  gradOut = dH * kVec;
  return h;
}

OceanSample sampleOcean(vec2 x0, vec2 swellDir, float baseAmp, float depth) {
  OceanSample s;
  s.height = 0.0;
  s.gradient = vec2(0.0);
  s.steepness = 0.0;

  vec2 primary = normalize(swellDir + 1e-6);
  float ampScale = swellAmplitudeScale(depth);
  float chop = chopAttenuation(depth);

  vec2 grad;

  s.height += directedWave(
    x0, primary, uSwellWavelength, baseAmp * ampScale, uSwellSin, uSwellCos, grad
  );
  s.gradient += grad;
  s.steepness = max(s.steepness, length(grad));

  s.height += directedWave(
    x0, primary, uChopWavelength, baseAmp * 0.28 * chop * ampScale, uChopSin, uChopCos, grad
  );
  s.gradient += grad * chop * 0.28;

  float surfFlatten = innerSurfFlatten(depth);
  s.height = mix(s.height, surfFlatten * 0.05, surfFlatten * 0.9);
  s.gradient *= 1.0 - surfFlatten * 0.85;
  s.steepness *= 1.0 - surfFlatten * 0.8;

  return s;
}

float computePeelMask(vec2 x0, vec2 swellDir, float depth, float height, float baseAmp) {
  vec2 primary = normalize(swellDir + 1e-6);
  vec2 crestAxis = vec2(-primary.y, primary.x);

  float jackBand = smoothstep(0.6, 0.76, depth) * (1.0 - smoothstep(0.82, 0.96, depth));
  float alongCrest = dot(x0, crestAxis);
  float a = alongCrest * 0.18;
  float peelWave = sin(a) * uPeelCos + cos(a) * uPeelSin;
  float peelFront = smoothstep(-0.1, 0.72, peelWave);

  float crestLift = smoothstep(0.1, 0.45, height / max(baseAmp * 1.5, 0.06));
  float innerFoam = smoothstep(0.8, 0.98, depth) * 0.5;

  return max(jackBand * crestLift * peelFront, innerFoam);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.45);
  return fract(p.x * p.y);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm2D(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amp * noise2D(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return value;
}

vec2 xyToUv(vec2 x0) {
  return clamp(
    vec2(x0.x / OCEAN_EXTENT + 0.5, 0.5 - x0.y / OCEAN_EXTENT),
    0.02,
    0.98
  );
}
`;
