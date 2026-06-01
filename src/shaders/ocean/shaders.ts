import { oceanMathGlsl } from "./oceanMath.glsl";

export const oceanVertexShader = /* glsl */ `
precision highp float;

uniform float uBaseAmplitude;
uniform vec2 uSwellDirection;
uniform float uTide;
uniform sampler2D uBathymetry;

varying float vHeight;
varying float vPeel;
varying float vSlope;
varying float vDepth;
varying float vShallow;
varying vec3 vNormal;
varying vec2 vWorldXZ;

${oceanMathGlsl}

void main() {
  vec2 x0 = position.xy;
  float depth = sampleDepth(uv, uTide, uBathymetry);
  float shallow = shallowMask(depth);

  OceanSample ocean = sampleOcean(x0, uSwellDirection, uBaseAmplitude, depth);
  float peel = computePeelMask(x0, uSwellDirection, depth, ocean.height, uBaseAmplitude);

  vec3 tangentX = vec3(1.0, 0.0, ocean.gradient.x);
  vec3 tangentY = vec3(0.0, 1.0, ocean.gradient.y);
  vec3 normal = normalize(cross(tangentY, tangentX));

  vec3 displaced = vec3(x0.x, x0.y, ocean.height);

  vHeight = ocean.height;
  vPeel = peel;
  vSlope = ocean.steepness;
  vDepth = depth;
  vShallow = shallow;
  vNormal = normal;
  vWorldXZ = x0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

export const oceanFragmentShader = /* glsl */ `
precision highp float;

uniform float uFoamThreshold;
uniform vec2 uSwellDirection;

varying float vHeight;
varying float vPeel;
varying float vSlope;
varying float vDepth;
varying float vShallow;
varying vec3 vNormal;
varying vec2 vWorldXZ;

${oceanMathGlsl}

void main() {
  vec3 deepColor = vec3(0.02, 0.1, 0.24);
  vec3 midColor = vec3(0.04, 0.24, 0.44);
  vec3 shallowColor = vec3(0.16, 0.5, 0.7);

  float heightT = clamp(vHeight * 0.9 + 0.42, 0.0, 1.0);
  vec3 waterColor = mix(deepColor, midColor, smoothstep(0.0, 0.6, heightT));
  waterColor = mix(waterColor, shallowColor, smoothstep(0.35, 1.0, heightT) * (0.25 + vShallow * 0.75));

  vec3 sunDir = normalize(vec3(0.32, 0.9, 0.32));
  vec3 N = normalize(vNormal);
  float NdotL = max(dot(N, sunDir), 0.0);
  float spec = pow(max(dot(reflect(-sunDir, N), vec3(0.0, 1.0, 0.0)), 0.0), 64.0);

  waterColor += vec3(0.03, 0.09, 0.12) * NdotL;
  waterColor += vec3(0.28, 0.36, 0.34) * spec * 0.4;

  vec2 flow = normalize(uSwellDirection + 1e-6);
  vec2 foamUv = vWorldXZ * 0.28 - flow * uFoamScroll * 50.0;
  float foamNoise = fbm2D(foamUv * 3.0) * 0.55 + fbm2D(foamUv * 6.5 + 1.8) * 0.45;

  float breakMask = vPeel * (0.5 + smoothstep(0.25, 0.7, vSlope) * 0.35);
  breakMask = max(breakMask, smoothstep(0.78, 0.97, vDepth) * 0.65);
  breakMask *= smoothstep(uFoamThreshold, uFoamThreshold + 0.4, vShallow);

  float foam = smoothstep(0.08, 0.88, breakMask * (0.35 + foamNoise * 0.65));
  vec3 foamColor = mix(vec3(0.78, 0.9, 0.98), vec3(1.0), foamNoise);
  vec3 color = mix(waterColor, foamColor, foam);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const whitewaterVertexShader = /* glsl */ `
precision highp float;

uniform float uBaseAmplitude;
uniform vec2 uSwellDirection;
uniform float uTide;
uniform sampler2D uBathymetry;

varying vec2 vUv;
varying float vPeel;

${oceanMathGlsl}

void main() {
  vec2 x0 = position.xy;
  vUv = uv;

  float depth = sampleDepth(uv, uTide, uBathymetry);
  OceanSample ocean = sampleOcean(x0, uSwellDirection, uBaseAmplitude, depth);
  vPeel = computePeelMask(x0, uSwellDirection, depth, ocean.height, uBaseAmplitude);

  vec3 displaced = vec3(x0.x, x0.y, ocean.height + 0.04);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

export const whitewaterFragmentShader = /* glsl */ `
precision highp float;

uniform vec2 uSwellDirection;

varying vec2 vUv;
varying float vPeel;

${oceanMathGlsl}

void main() {
  vec2 flow = normalize(uSwellDirection + 1e-6);
  vec2 p = vec2(vUv.x * OCEAN_EXTENT, vUv.y * OCEAN_EXTENT) * 0.45 - flow * uFoamScroll * 50.0;
  float n = fbm2D(p * 4.0) * 0.55 + fbm2D(p * 9.0) * 0.45;

  float alpha = vPeel * smoothstep(0.25, 0.9, n) * 0.55;
  if (alpha < 0.03) discard;

  gl_FragColor = vec4(vec3(0.95, 0.99, 1.0), alpha);
}
`;

export const sprayVertexShader = /* glsl */ `
precision highp float;

uniform float uBaseAmplitude;
uniform vec2 uSwellDirection;
uniform float uTide;
uniform sampler2D uBathymetry;
uniform float uPointScale;

attribute vec2 aXy;
attribute float aSeed;
attribute float aLayer;

varying float vAlpha;
varying float vShade;

${oceanMathGlsl}

void main() {
  vec2 x0 = aXy;
  float depth = sampleDepth(xyToUv(x0), uTide, uBathymetry);

  OceanSample ocean = sampleOcean(x0, uSwellDirection, uBaseAmplitude, depth);
  float peel = computePeelMask(x0, uSwellDirection, depth, ocean.height, uBaseAmplitude);

  vec2 forward = normalize(uSwellDirection + 1e-6);
  vec2 crestAxis = vec2(-forward.y, forward.x);

  float life = fract(aSeed * 17.3 + uFoamScroll * 12.0);
  float lifeInv = 1.0 - life;
  float shoreward = smoothstep(0.48, 0.68, depth);
  float spawn = max(peel, smoothstep(0.76, 0.97, depth) * 0.45) * shoreward;

  float layer = aLayer;
  float rise = life * (0.22 + layer * 0.2) * spawn;
  float a = dot(x0, crestAxis) * 0.2 + aSeed * 6.28;
  float alongPeel = (sin(a) * uPeelCos + cos(a) * uPeelSin) * 0.06 * spawn;

  vec3 pos = vec3(
    x0.x + forward.x * life * 0.15 * spawn + alongPeel * crestAxis.x,
    x0.y + forward.y * life * 0.15 * spawn + alongPeel * crestAxis.y,
    ocean.height + rise + layer * 0.06
  );

  vAlpha = spawn * lifeInv * (0.35 + layer * 0.2);
  vShade = 0.65 + layer * 0.15;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uPointScale * (0.5 + spawn * 0.9) * (300.0 / max(-mvPosition.z, 1.0));
}
`;

export const sprayFragmentShader = /* glsl */ `
precision highp float;

varying float vAlpha;
varying float vShade;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float dist = length(c);
  float core = smoothstep(0.5, 0.0, dist);
  float alpha = vAlpha * (core * 0.85 + smoothstep(0.5, 0.12, dist) * 0.3);
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(mix(vec3(0.8, 0.92, 0.98), vec3(1.0), core) * vShade, alpha);
}
`;
