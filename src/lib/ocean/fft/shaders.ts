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
uniform float uDisplacementScale;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 disp = texture2D(uDisplacementMap, uv).rgb * uDisplacementScale;
  // Geometry is pre-rotated to the XZ plane (Y up): position ≈ (x, 0, z).
  vec3 pos = vec3(
    position.x + disp.r,
    disp.g,
    position.z + disp.b
  );

  vNormal = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const oceanSurfaceFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uNormalMap;
uniform vec3 uSunDirection;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uCameraPosition;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vec3 N = normalize(texture2D(uNormalMap, vUv).rgb);
  vec3 V = normalize(uCameraPosition - vWorldPos);
  vec3 L = normalize(uSunDirection);
  vec3 H = normalize(L + V);

  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  float diffuse = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 256.0);

  float heightTint = clamp(vWorldPos.y * 0.35 + 0.5, 0.0, 1.0);
  vec3 water = mix(uDeepColor, uShallowColor, heightTint);
  vec3 sky = vec3(0.45, 0.62, 0.78);

  vec3 color = mix(water * (0.35 + 0.65 * diffuse), sky, fresnel * 0.55);
  color += vec3(0.35, 0.42, 0.38) * spec * 0.45;

  gl_FragColor = vec4(color, 1.0);
}
`;
