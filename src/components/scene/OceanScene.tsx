"use client";

import { BEACH_Z_MAX } from "@/lib/ocean/constants";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { BathymetryTerrain } from "./BathymetryTerrain";
import { OceanSurface } from "./OceanSurface";
import { PostEffects } from "./PostEffects";

function SceneContent() {
  return (
    <>
      <color attach="background" args={["#0a0e14"]} />
      <fog attach="fog" args={["#0a0e14", 50, 140]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[12, 18, 8]} intensity={1.0} />
      <BathymetryTerrain />
      <OceanSurface />
      <PostEffects />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, BEACH_Z_MAX * 0.35]}
        minDistance={6}
        maxDistance={90}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

export function OceanScene() {
  return (
    <Canvas
      className="h-full w-full touch-none"
      camera={{ position: [0, 12, 38], fov: 48, near: 0.1, far: 500 }}
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
