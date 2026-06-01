"use client";

import { createBathymetryCanvas } from "@/lib/bathymetry/createBathymetryCanvas";
import { drawBathymetryPreset } from "@/lib/bathymetry/drawPresets";
import type { BathymetryPreset } from "@/lib/bathymetry/types";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type BathymetryTextureState = {
  /** Grayscale depth map bound for shader `uBathymetry`. */
  texture: THREE.CanvasTexture;
  /** Source canvas — useful for future drawing tools. */
  canvas: HTMLCanvasElement;
  preset: BathymetryPreset;
  /** Increments after each canvas redraw (for UI preview sync). */
  mapRevision: number;
};

function configureTexture(texture: THREE.CanvasTexture) {
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // Depth data — not sRGB color.
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
}

/**
 * Maintains a single off-screen canvas + `CanvasTexture`, redrawn when `preset` changes.
 */
export function useBathymetryTexture(
  preset: BathymetryPreset,
): BathymetryTextureState | null {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [ready, setReady] = useState(false);
  const [mapRevision, setMapRevision] = useState(0);

  useEffect(() => {
    const canvas = createBathymetryCanvas(preset);
    const texture = new THREE.CanvasTexture(canvas);
    configureTexture(texture);

    canvasRef.current = canvas;
    textureRef.current = texture;
    setReady(true);

    return () => {
      texture.dispose();
      canvasRef.current = null;
      textureRef.current = null;
      setReady(false);
    };
    // Allocate GPU resources once; preset switches redraw the same canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const texture = textureRef.current;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawBathymetryPreset(ctx, preset);
    texture.needsUpdate = true;
    setMapRevision((revision) => revision + 1);
  }, [preset]);

  if (!ready || !textureRef.current || !canvasRef.current) {
    return null;
  }

  return {
    texture: textureRef.current,
    canvas: canvasRef.current,
    preset,
    mapRevision,
  };
}
