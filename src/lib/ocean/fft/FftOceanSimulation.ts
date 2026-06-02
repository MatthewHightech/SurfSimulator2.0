import {
  FFT_RESOLUTION,
  OCEAN_CHOPPINESS,
  OCEAN_TILE_SIZE,
} from "@/lib/ocean/constants";
import * as THREE from "three";
import { buildInitialSpectrum } from "./jonswap";
import {
  fullscreenVertexShader,
  normalMapFragmentShader,
  phaseUpdateFragmentShader,
  spectrumFragmentShader,
  subtransformFragmentShader,
  subtransformVerticalFragmentShader,
} from "./shaders";

export type FftOceanParams = {
  periodSeconds: number;
  heightMeters: number;
  directionDeg: number;
};

function createFloatTarget(
  width: number,
  height: number,
  wrap: THREE.Wrapping = THREE.ClampToEdgeWrapping,
): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(width, height, {
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: wrap,
    wrapT: wrap,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

function createLinearFloatTarget(
  width: number,
  height: number,
): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(width, height, {
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

function log2(n: number): number {
  return Math.log(n) / Math.log(2);
}

export class FftOceanSimulation {
  readonly resolution = FFT_RESOLUTION;
  readonly tileSize = OCEAN_TILE_SIZE;

  readonly displacementMap: THREE.WebGLRenderTarget;
  readonly normalMap: THREE.WebGLRenderTarget;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera: THREE.OrthographicCamera;
  private readonly quad: THREE.Mesh;

  private readonly initialSpectrumRT: THREE.WebGLRenderTarget;
  private pingPhaseRT: THREE.WebGLRenderTarget;
  private pongPhaseRT: THREE.WebGLRenderTarget;
  private readonly spectrumRT: THREE.WebGLRenderTarget;
  private readonly pingTransformRT: THREE.WebGLRenderTarget;
  private readonly pongTransformRT: THREE.WebGLRenderTarget;

  private readonly phaseMaterial: THREE.ShaderMaterial;
  private readonly spectrumMaterial: THREE.ShaderMaterial;
  private readonly horizontalFftMaterial: THREE.ShaderMaterial;
  private readonly verticalFftMaterial: THREE.ShaderMaterial;
  private readonly normalMaterial: THREE.ShaderMaterial;

  private pingPhase = true;
  private paramsKey = "";
  private spectrumSeed = 1;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    const N = this.resolution;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial(),
    );

    this.initialSpectrumRT = createFloatTarget(N, N, THREE.RepeatWrapping);
    this.pingPhaseRT = createFloatTarget(N, N);
    this.pongPhaseRT = createFloatTarget(N, N);
    this.spectrumRT = createFloatTarget(N, N);
    this.pingTransformRT = createFloatTarget(N, N);
    this.pongTransformRT = createFloatTarget(N, N);
    this.displacementMap = createLinearFloatTarget(N, N);
    this.normalMap = createLinearFloatTarget(N, N);

    this.phaseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPhases: { value: null as THREE.Texture | null },
        uDeltaTime: { value: 0 },
        uResolution: { value: N },
        uTileSize: { value: OCEAN_TILE_SIZE },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: phaseUpdateFragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.spectrumMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPhases: { value: null as THREE.Texture | null },
        uInitialSpectrum: { value: this.initialSpectrumRT.texture },
        uResolution: { value: N },
        uTileSize: { value: OCEAN_TILE_SIZE },
        uChoppiness: { value: OCEAN_CHOPPINESS },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: spectrumFragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.horizontalFftMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uInput: { value: null as THREE.Texture | null },
        uTransformSize: { value: N },
        uSubtransformSize: { value: 2 },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: subtransformFragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.verticalFftMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uInput: { value: null as THREE.Texture | null },
        uTransformSize: { value: N },
        uSubtransformSize: { value: 2 },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: subtransformVerticalFragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.normalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDisplacementMap: { value: this.displacementMap.texture },
        uResolution: { value: N },
        uTileSize: { value: OCEAN_TILE_SIZE },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: normalMapFragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.initPhaseTexture();
  }

  private initPhaseTexture(): void {
    const N = this.resolution;
    const data = new Float32Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      data[i * 4] = Math.random() * Math.PI * 2;
    }
    const texture = new THREE.DataTexture(
      data,
      N,
      N,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    texture.needsUpdate = true;
    this.renderer.setRenderTarget(this.pingPhaseRT);
    this.renderer.clear();
    const mat = new THREE.MeshBasicMaterial({ map: texture });
    this.quad.material = mat;
    this.renderer.render(this.quad, this.camera);
    mat.dispose();
    texture.dispose();
    this.pingPhase = true;
  }

  setParams(params: FftOceanParams): void {
    const key = `${params.periodSeconds}:${params.heightMeters}:${params.directionDeg}`;
    if (key === this.paramsKey) return;
    this.paramsKey = key;
    this.spectrumSeed += 1;

    const data = buildInitialSpectrum({
      resolution: this.resolution,
      tileSize: this.tileSize,
      periodSeconds: params.periodSeconds,
      heightMeters: params.heightMeters,
      directionDeg: params.directionDeg,
      seed: this.spectrumSeed,
    });

    const texture = new THREE.DataTexture(
      data,
      this.resolution,
      this.resolution,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    this.renderer.setRenderTarget(this.initialSpectrumRT);
    this.renderer.clear();
    const mat = new THREE.MeshBasicMaterial({ map: texture });
    this.quad.material = mat;
    this.renderer.render(this.quad, this.camera);
    mat.dispose();
    texture.dispose();

    this.initPhaseTexture();
    this.spectrumMaterial.uniforms.uInitialSpectrum.value =
      this.initialSpectrumRT.texture;
  }

  update(deltaTime: number): void {
    const dt = Math.min(Math.max(deltaTime, 0), 1 / 30);
    const N = this.resolution;
    const iterations = log2(N) * 2;

    const prevTarget = this.renderer.getRenderTarget();
    const prevAutoClear = this.renderer.autoClear;
    const prevXrEnabled = this.renderer.xr.enabled;
    this.renderer.autoClear = false;
    this.renderer.xr.enabled = false;

    // Phase update
    const readPhase = this.pingPhase ? this.pingPhaseRT : this.pongPhaseRT;
    const writePhase = this.pingPhase ? this.pongPhaseRT : this.pingPhaseRT;
    this.phaseMaterial.uniforms.uPhases.value = readPhase.texture;
    this.phaseMaterial.uniforms.uDeltaTime.value = dt;
    this.quad.material = this.phaseMaterial;
    this.renderer.setRenderTarget(writePhase);
    this.renderer.render(this.quad, this.camera);
    this.pingPhase = !this.pingPhase;
    const phaseTexture = this.pingPhase ? this.pingPhaseRT : this.pongPhaseRT;

    // Spectrum
    this.spectrumMaterial.uniforms.uPhases.value = phaseTexture.texture;
    this.quad.material = this.spectrumMaterial;
    this.renderer.setRenderTarget(this.spectrumRT);
    this.renderer.render(this.quad, this.camera);

    // FFT (Stockham)
    let inputTexture = this.spectrumRT.texture;
    let usePing = true;

    for (let i = 0; i < iterations; i++) {
      const isHorizontal = i < iterations / 2;
      const material = isHorizontal
        ? this.horizontalFftMaterial
        : this.verticalFftMaterial;
      const subSize = Math.pow(2, (i % (iterations / 2)) + 1);

      let outputTarget: THREE.WebGLRenderTarget;
      if (i === iterations - 1) {
        outputTarget = this.displacementMap;
      } else if (usePing) {
        outputTarget = this.pingTransformRT;
      } else {
        outputTarget = this.pongTransformRT;
      }

      material.uniforms.uInput.value = inputTexture;
      material.uniforms.uSubtransformSize.value = subSize;
      this.quad.material = material;
      this.renderer.setRenderTarget(outputTarget);
      this.renderer.render(this.quad, this.camera);

      inputTexture = outputTarget.texture;
      if (i < iterations - 1) {
        usePing = !usePing;
      }
    }

    // Normal map
    this.normalMaterial.uniforms.uDisplacementMap.value =
      this.displacementMap.texture;
    this.quad.material = this.normalMaterial;
    this.renderer.setRenderTarget(this.normalMap);
    this.renderer.render(this.quad, this.camera);

    this.renderer.setRenderTarget(prevTarget);
    this.renderer.autoClear = prevAutoClear;
    this.renderer.xr.enabled = prevXrEnabled;
  }

  dispose(): void {
    this.initialSpectrumRT.dispose();
    this.pingPhaseRT.dispose();
    this.pongPhaseRT.dispose();
    this.spectrumRT.dispose();
    this.pingTransformRT.dispose();
    this.pongTransformRT.dispose();
    this.displacementMap.dispose();
    this.normalMap.dispose();
    this.phaseMaterial.dispose();
    this.spectrumMaterial.dispose();
    this.horizontalFftMaterial.dispose();
    this.verticalFftMaterial.dispose();
    this.normalMaterial.dispose();
    this.quad.geometry.dispose();
  }
}
