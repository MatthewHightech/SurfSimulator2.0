import { BATHYMETRY_CANVAS_SIZE } from "./constants";
import { drawBathymetryPreset } from "./drawPresets";
import type { BathymetryPreset } from "./types";

export function createBathymetryCanvas(
  preset: BathymetryPreset,
  size = BATHYMETRY_CANVAS_SIZE,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Failed to acquire 2D context for bathymetry canvas");
  }

  drawBathymetryPreset(ctx, preset, size, size);
  return canvas;
}
