"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { BathymetryFloor } from "./BathymetryFloor";
import { OceanGrid } from "./OceanGrid";

function SceneContent() {
  return (
    <>
      <color attach="background" args={["#0a0e14"]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[12, 18, 8]} intensity={1.1} />
      <BathymetryFloor />
      <OceanGrid />
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
      camera={{ position: [0, 14, 22], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
