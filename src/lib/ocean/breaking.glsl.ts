/**
 * Jacobian fold detection, plunging lip deform, barrel pocket shading.
 */
export const breakingGlsl = /* glsl */ `
float sampleJacobianFold(
  vec2 uv,
  sampler2D jacobianMap
) {
  return texture2D(jacobianMap, uv).g;
}

float sampleJacobianJ(vec2 uv, sampler2D jacobianMap) {
  return texture2D(jacobianMap, uv).r;
}

float computeJacobianFoldLocal(
  vec2 uv,
  sampler2D displacementMap,
  float texelUv,
  float horizScale
) {
  vec3 cx =
    texture2D(displacementMap, uv + vec2(texelUv, 0.0)).rgb -
    texture2D(displacementMap, uv - vec2(texelUv, 0.0)).rgb;
  vec3 cz =
    texture2D(displacementMap, uv + vec2(0.0, texelUv)).rgb -
    texture2D(displacementMap, uv - vec2(0.0, texelUv)).rgb;

  float dDxdx = cx.x * horizScale;
  float dDxdz = cx.z * horizScale;
  float dDzdx = cz.x * horizScale;
  float dDzdz = cz.z * horizScale;

  float J = (1.0 + dDxdx) * (1.0 + dDzdz) - dDxdz * dDzdx;
  return clamp(1.0 - J, 0.0, 1.5);
}

float breakZoneMask(
  float shallowNorm,
  float shallowMin,
  float shallowMax
) {
  return smoothstep(shallowMin, shallowMin + 0.06, shallowNorm) *
    (1.0 - smoothstep(shallowMax, shallowMax + 0.04, shallowNorm));
}

float applyPlungingDeform(
  inout vec3 disp,
  vec2 swellDir,
  float breakAmt,
  float lipThrow,
  float lipDrop,
  float backFaceFlatten,
  float faceSteepen
) {
  float crest = smoothstep(-0.05, 0.42, disp.y);
  vec2 horiz = vec2(disp.x, disp.z);
  float horizLen = length(horiz);
  vec2 horizDir = horizLen > 1e-5 ? horiz / horizLen : swellDir;
  float along = dot(horizDir, swellDir);
  float faceMask = smoothstep(-0.15, 0.55, along);

  float throwAmt = breakAmt * crest * faceMask * lipThrow;
  disp.x += swellDir.x * throwAmt;
  disp.z += swellDir.y * throwAmt;

  float lipMask = breakAmt * crest * smoothstep(0.05, 0.65, along);
  disp.y -= lipDrop * lipMask;
  disp.y *= 1.0 - backFaceFlatten * breakAmt * smoothstep(0.35, -0.25, along);
  disp.y *= 1.0 + faceSteepen * breakAmt * faceMask;

  return lipMask;
}

float barrelPocketShade(
  float lipMask,
  float along,
  float barrelPocket,
  float washT
) {
  float pocket = lipMask * smoothstep(0.1, 0.75, along) * barrelPocket;
  return pocket * (1.0 - washT * 0.85);
}
`;
