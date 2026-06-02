"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { buildBathymetryGeometry } from "@/lib/bathymetry/buildBathymetryGeometry";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";

function PreviewMesh() {
  const { canvas, mapRevision } = useBathymetry();

  const geometry = useMemo(() => {
    if (!canvas) return null;
    void mapRevision;
    return buildBathymetryGeometry({ canvas, segments: 48 });
  }, [canvas, mapRevision]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors roughness={0.9} />
    </mesh>
  );
}

export function BathymetryTerrainPreview() {
  const { preset, ready } = useBathymetry();

  if (!ready) return null;

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Reef shape
      </span>
      <div className="h-36 w-full overflow-hidden rounded-lg border border-slate-700/80 bg-[#0a0e14] shadow-lg">
        <Canvas
          camera={{ position: [28, 18, 28], fov: 42, near: 0.1, far: 200 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[8, 12, 6]} intensity={0.9} />
          <Suspense fallback={null}>
            <PreviewMesh />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={20}
            maxDistance={55}
            target={[0, -3, 0]}
          />
        </Canvas>
      </div>
      <span className="text-[10px] text-slate-500">
        {preset} · drag to orbit · high = shallow reef
      </span>
    </div>
  );
}
