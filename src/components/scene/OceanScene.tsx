"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OceanSurface } from "./OceanSurface";
import { PostEffects } from "./PostEffects";

function SceneContent() {
  return (
    <>
      <color attach="background" args={["#0a0e14"]} />
      <fog attach="fog" args={["#0a0e14", 40, 120]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[12, 18, 8]} intensity={1.0} />
      <OceanSurface />
      <PostEffects />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

export function OceanScene() {
  return (
    <Canvas
      className="h-full w-full touch-none"
      camera={{ position: [0, 10, 24], fov: 50, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
