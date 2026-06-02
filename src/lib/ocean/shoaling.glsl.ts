/**
 * Tier A shoaling + beach wash. Bathymetry: 0 = deep, 1 = shallow shore.
 */
export const shoalingGlsl = /* glsl */ `
const float SHOAL_DEEP_M = 12.0;
const float SHOAL_MIN_M = 0.35;
const float SHOAL_AMP_CAP = 4.5;
const float MIN_WATER_COLUMN = 0.16;
const float SURFACE_BIAS = 0.04;

vec2 worldToBathyUv(vec2 worldXZ, float oceanExtent) {
  return clamp(
    vec2(worldXZ.x / oceanExtent + 0.5, 0.5 - worldXZ.y / oceanExtent),
    0.02,
    0.98
  );
}

float sampleShallowNorm(vec2 bathyUv, sampler2D bathymetry) {
  return texture2D(bathymetry, bathyUv).r;
}

float shallowNormToWaterDepth(float shallowNorm) {
  return mix(SHOAL_DEEP_M, SHOAL_MIN_M, shallowNorm);
}

float shoalingAmplitudeScale(float waterDepthM) {
  float ratio = SHOAL_DEEP_M / max(waterDepthM, SHOAL_MIN_M);
  return clamp(sqrt(ratio), 1.0, SHOAL_AMP_CAP);
}

float shoalingHorizontalScale(float waterDepthM) {
  float t = clamp(waterDepthM / SHOAL_DEEP_M, 0.0, 1.0);
  return mix(0.42, 1.0, pow(t, 0.38));
}

float reefJackBoost(float shallowNorm) {
  float jackBand = smoothstep(0.5, 0.7, shallowNorm) * (1.0 - smoothstep(0.82, 0.96, shallowNorm));
  return 1.0 + jackBand * 0.85;
}

float deepWaterAttenuation(float shallowNorm) {
  return mix(0.55, 1.0, smoothstep(0.0, 0.35, shallowNorm));
}

float beachWashT(float worldZ, float shoreZ, float washExtent) {
  return clamp((worldZ - shoreZ) / max(washExtent, 0.001), 0.0, 1.0);
}

float sampleFloorY(vec2 worldXZ, sampler2D floorHeight, float oceanExtent, float oceanZDeep, float beachZMax) {
  float zSpan = beachZMax - oceanZDeep;
  vec2 fuv = vec2(
    clamp(worldXZ.x / oceanExtent + 0.5, 0.002, 0.998),
    clamp(1.0 - (worldXZ.y - oceanZDeep) / max(zSpan, 0.001), 0.002, 0.998)
  );
  return texture2D(floorHeight, fuv).r;
}

float clampSurfaceAboveFloor(float waveY, float floorY) {
  return max(floorY + MIN_WATER_COLUMN, waveY) + SURFACE_BIAS;
}

float isSubmerged(float floorY, float seaLevel) {
  return 1.0 - step(seaLevel + 0.22, floorY);
}
`;
