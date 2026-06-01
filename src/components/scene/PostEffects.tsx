"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";

export function PostEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.82}
        luminanceSmoothing={0.4}
        intensity={0.38}
        mipmapBlur
      />
    </EffectComposer>
  );
}
