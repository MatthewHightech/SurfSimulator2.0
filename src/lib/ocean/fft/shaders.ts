import { shoalingGlsl } from "@/lib/ocean/shoaling.glsl";

export const fullscreenVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const subtransformFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uInput;
uniform float uTransformSize;
uniform float uSubtransformSize;

varying vec2 vUv;

vec2 multiplyComplex(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

void main() {
  float index = vUv.x * uTransformSize - 0.5;
  float evenIndex =
    floor(index / uSubtransformSize) * (uSubtransformSize * 0.5) +
    mod(index, uSubtransformSize * 0.5);

  vec4 even = texture2D(
    uInput,
    vec2(evenIndex + 0.5, gl_FragCoord.y) / uTransformSize
  );
  vec4 odd = texture2D(
    uInput,
    vec2(evenIndex + uTransformSize * 0.5 + 0.5, gl_FragCoord.y) / uTransformSize
  );

  float twiddleArgument = -6.28318530718 * (index / uSubtransformSize);
  vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));

  gl_FragColor = vec4(
    even.xy + multiplyComplex(twiddle, odd.xy),
    even.zw + multiplyComplex(twiddle, odd.zw)
  );
}
`;

export const subtransformVerticalFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uInput;
uniform float uTransformSize;
uniform float uSubtransformSize;

varying vec2 vUv;

vec2 multiplyComplex(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

void main() {
  float index = vUv.y * uTransformSize - 0.5;
  float evenIndex =
    floor(index / uSubtransformSize) * (uSubtransformSize * 0.5) +
    mod(index, uSubtransformSize * 0.5);

  vec4 even = texture2D(
    uInput,
    vec2(gl_FragCoord.x, evenIndex + 0.5) / uTransformSize
  );
  vec4 odd = texture2D(
    uInput,
    vec2(gl_FragCoord.x, evenIndex + uTransformSize * 0.5 + 0.5) / uTransformSize
  );

  float twiddleArgument = -6.28318530718 * (index / uSubtransformSize);
  vec2 twiddle = vec2(cos(twiddleArgument), sin(twiddleArgument));

  gl_FragColor = vec4(
    even.xy + multiplyComplex(twiddle, odd.xy),
    even.zw + multiplyComplex(twiddle, odd.zw)
  );
}
`;

export const phaseUpdateFragmentShader = /* glsl */ `
precision highp float;

const float PI = 3.14159265359;
const float G = 9.81;

uniform sampler2D uPhases;
uniform float uDeltaTime;
uniform float uResolution;
uniform float uTileSize;

varying vec2 vUv;

float omega(float k) {
  return sqrt(G * k);
}

void main() {
  vec2 coordinates = gl_FragCoord.xy - 0.5;
  float n =
    coordinates.x < uResolution * 0.5
      ? coordinates.x
      : coordinates.x - uResolution;
  float m =
    coordinates.y < uResolution * 0.5
      ? coordinates.y
      : coordinates.y - uResolution;
  vec2 waveVector = (2.0 * PI * vec2(n, m)) / uTileSize;
  float k = length(waveVector);

  float phase = texture2D(uPhases, vUv).r;
  float deltaPhase = omega(k) * uDeltaTime;
  phase = mod(phase + deltaPhase, 2.0 * PI);

  gl_FragColor = vec4(phase, 0.0, 0.0, 0.0);
}
`;

export const spectrumFragmentShader = /* glsl */ `
precision highp float;

const float PI = 3.14159265359;

uniform sampler2D uPhases;
uniform sampler2D uInitialSpectrum;
uniform float uResolution;
uniform float uTileSize;
uniform float uChoppiness;

varying vec2 vUv;

vec2 multiplyComplex(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 multiplyByI(vec2 z) {
  return vec2(-z.y, z.x);
}

void main() {
  vec2 coordinates = gl_FragCoord.xy - 0.5;
  float n =
    coordinates.x < uResolution * 0.5
      ? coordinates.x
      : coordinates.x - uResolution;
  float m =
    coordinates.y < uResolution * 0.5
      ? coordinates.y
      : coordinates.y - uResolution;
  vec2 waveVector = (2.0 * PI * vec2(n, m)) / uTileSize;
  float kLen = length(waveVector);

  float phase = texture2D(uPhases, vUv).r;
  vec2 phaseVector = vec2(cos(phase), sin(phase));

  vec2 h0 = texture2D(uInitialSpectrum, vUv).rg;
  vec2 h0Star = texture2D(
    uInitialSpectrum,
    vec2(1.0 - vUv.x + 1.0 / uResolution, 1.0 - vUv.y + 1.0 / uResolution)
  ).rg;
  h0Star.y *= -1.0;

  vec2 h =
    multiplyComplex(h0, phaseVector) +
    multiplyComplex(h0Star, vec2(phaseVector.x, -phaseVector.y));

  vec2 hX = vec2(0.0);
  vec2 hZ = vec2(0.0);

  if (kLen > 1e-6) {
    vec2 kNorm = waveVector / kLen;
    hX = -multiplyByI(h * kNorm.x) * uChoppiness;
    hZ = -multiplyByI(h * kNorm.y) * uChoppiness;
  }

  if (waveVector.x == 0.0 && waveVector.y == 0.0) {
    h = vec2(0.0);
    hX = vec2(0.0);
    hZ = vec2(0.0);
  }

  gl_FragColor = vec4(hX + multiplyByI(h), hZ);
}
`;

export const normalMapFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uDisplacementMap;
uniform float uResolution;
uniform float uTileSize;

varying vec2 vUv;

void main() {
  float texel = 1.0 / uResolution;
  float texelSize = uTileSize / uResolution;

  vec3 center = texture2D(uDisplacementMap, vUv).rgb;
  vec3 right =
    vec3(texelSize, 0.0, 0.0) +
    texture2D(uDisplacementMap, vUv + vec2(texel, 0.0)).rgb -
    center;
  vec3 left =
    vec3(-texelSize, 0.0, 0.0) +
    texture2D(uDisplacementMap, vUv + vec2(-texel, 0.0)).rgb -
    center;
  vec3 top =
    vec3(0.0, 0.0, -texelSize) +
    texture2D(uDisplacementMap, vUv + vec2(0.0, -texel)).rgb -
    center;
  vec3 bottom =
    vec3(0.0, 0.0, texelSize) +
    texture2D(uDisplacementMap, vUv + vec2(0.0, texel)).rgb -
    center;

  vec3 n = normalize(
    cross(right, top) + cross(top, left) + cross(left, bottom) + cross(bottom, right)
  );
  gl_FragColor = vec4(n, 1.0);
}
`;

export const oceanSurfaceVertexShader = /* glsl */ `
precision highp float;

uniform sampler2D uDisplacementMap;
uniform sampler2D uBathymetry;
uniform sampler2D uFloorHeight;
uniform float uDisplacementScale;
uniform float uOceanExtent;
uniform float uTideMeters;
uniform float uOceanZDeep;
uniform float uOceanZShore;
uniform float uBeachZMax;
uniform float uWashExtent;

varying vec3 vWorldPos;
varying vec2 vUv;
varying float vShallowNorm;
varying float vWashT;
varying float vWashAlpha;
varying float vFloorY;

${shoalingGlsl}

void main() {
  vUv = uv;
  float worldZ = position.z;
  vec2 worldXZ = vec2(position.x, worldZ);
  float washT = beachWashT(worldZ, uOceanZShore, uWashExtent);
  vWashT = washT;

  vec2 sampleXZ = mix(worldXZ, vec2(worldXZ.x, uOceanZShore), step(0.001, washT));
  vec2 bathyUv = worldToBathyUv(sampleXZ, uOceanExtent);
  float shallowNorm = sampleShallowNorm(bathyUv, uBathymetry);
  float waterDepth = max(0.12, shallowNormToWaterDepth(shallowNorm) - uTideMeters);

  float ampScale =
    shoalingAmplitudeScale(waterDepth) *
    reefJackBoost(shallowNorm) *
    deepWaterAttenuation(shallowNorm);
  float horizScale = shoalingHorizontalScale(waterDepth);

  float washFade = 1.0 - smoothstep(0.08, 0.95, washT);
  ampScale *= washFade;
  horizScale *= mix(1.0, 0.25, washT);

  vec3 disp = texture2D(uDisplacementMap, uv).rgb * uDisplacementScale;
  disp.x *= horizScale;
  disp.z *= horizScale;
  disp.y *= ampScale;

  float floorYRest = sampleFloorY(worldXZ, uFloorHeight, uOceanExtent, uOceanZDeep, uBeachZMax);
  float seaLevel = uTideMeters;

  float clearance = seaLevel - floorYRest;
  float depthScale = smoothstep(0.08, 2.2, clearance);
  disp.y *= depthScale;

  vec2 displacedXZ = vec2(
    position.x + disp.x * washFade,
    position.z + disp.z * washFade
  );
  float floorY = max(
    floorYRest,
    sampleFloorY(displacedXZ, uFloorHeight, uOceanExtent, uOceanZDeep, uBeachZMax)
  );

  float oceanY = disp.y + seaLevel;
  float washBlend = smoothstep(0.0, 0.22, washT);
  float washRipple = disp.y * 0.4;
  float sheetY = floorY + 0.12 + washRipple + seaLevel;
  float waveSurface = mix(oceanY, sheetY, washBlend);
  float surfY = clampSurfaceAboveFloor(waveSurface, floorY);

  vec3 pos = vec3(displacedXZ.x, surfY, displacedXZ.y);

  vFloorY = floorY;
  vShallowNorm = mix(shallowNorm, 1.0, smoothstep(0.0, 0.35, washT));
  vWashAlpha = (1.0 - smoothstep(0.72, 1.0, washT)) * isSubmerged(floorY, seaLevel);
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const oceanSurfaceFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uNormalMap;
uniform float uTideMeters;
uniform vec3 uSunDirection;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uCameraPosition;

varying vec3 vWorldPos;
varying vec2 vUv;
varying float vShallowNorm;
varying float vWashT;
varying float vWashAlpha;
varying float vFloorY;

void main() {
  vec3 N = normalize(texture2D(uNormalMap, vUv).rgb);
  float slope = length(vec2(N.x, N.z)) / max(abs(N.y), 0.12);
  vec3 V = normalize(uCameraPosition - vWorldPos);
  vec3 L = normalize(uSunDirection);
  vec3 H = normalize(L + V);

  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  float diffuse = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 256.0) * (1.0 - vWashT * 0.85);

  float heightTint = clamp(vWorldPos.y * 0.35 + 0.5, 0.0, 1.0);
  float shoreTint = smoothstep(0.35, 0.82, vShallowNorm);
  vec3 water = mix(uDeepColor, uShallowColor, max(heightTint, shoreTint * 0.85));

  float breakMask = smoothstep(0.48, 0.78, vShallowNorm) * smoothstep(0.22, 0.62, slope);
  float washFoam = smoothstep(0.05, 0.55, vWashT) * (1.0 - smoothstep(0.7, 1.0, vWashT));
  float foam = max(
    smoothstep(0.35, 0.92, breakMask),
    washFoam * 0.92
  );
  vec3 foamColor = vec3(0.88, 0.95, 0.98);

  vec3 sky = vec3(0.45, 0.62, 0.78);
  vec3 color = mix(water * (0.35 + 0.65 * diffuse), sky, fresnel * 0.55);
  color += vec3(0.35, 0.42, 0.38) * spec * 0.45;
  color = mix(color, foamColor, foam * 0.8);

  if (vFloorY > uTideMeters + 0.2) {
    discard;
  }

  float alpha = vWashAlpha;
  if (alpha < 0.02) {
    discard;
  }

  gl_FragColor = vec4(color, alpha);
}
`;
