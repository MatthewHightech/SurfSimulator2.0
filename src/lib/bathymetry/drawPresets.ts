import {
  BATHYMETRY_CANVAS_SIZE,
  DEPTH_DEEP,
  DEPTH_SHALLOW,
} from "./constants";
import type { BathymetryPreset } from "./types";

/**
 * All presets share the same orientation on the 2D canvas:
 * - Top edge (y = 0): deep open ocean, farthest from the default camera (+Z)
 * - Bottom edge (y = height): shallow shore, nearest the camera
 */

function clearToDeep(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = DEPTH_DEEP;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Beach break: linear shelf — deep open ocean at top, shallow shore at bottom.
 */
export function drawBeachBreak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  clearToDeep(ctx, width, height);

  // Steep shelf: long deep plateau, rapid shoaling near shore to jack waves.
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, DEPTH_DEEP);
  gradient.addColorStop(0.52, DEPTH_DEEP);
  gradient.addColorStop(0.64, "#121212");
  gradient.addColorStop(0.74, "#3d3d3d");
  gradient.addColorStop(0.82, "#707070");
  gradient.addColorStop(0.9, "#a8a8a8");
  gradient.addColorStop(0.96, "#d8d8d8");
  gradient.addColorStop(1, DEPTH_SHALLOW);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Reef break: same horizontal layout as beach, but a sharp shelf near shore
 * so swell hits a steep reef and jacks / barrels.
 */
export function drawReefBreak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  clearToDeep(ctx, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, DEPTH_DEEP);
  gradient.addColorStop(0.58, DEPTH_DEEP);
  gradient.addColorStop(0.72, "#141414");
  gradient.addColorStop(0.82, "#3a3a3a");
  gradient.addColorStop(0.9, "#8f8f8f");
  gradient.addColorStop(0.96, "#d4d4d4");
  gradient.addColorStop(1, DEPTH_SHALLOW);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Point break: headland wedge from the bottom shore toward open ocean at top.
 */
export function drawPointBreak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  clearToDeep(ctx, width, height);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height * 0.28);
  ctx.quadraticCurveTo(width * 0.08, height * 0.12, width * 0.38, height * 0.06);
  ctx.lineTo(width * 0.78, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.clip();

  const gradient = ctx.createLinearGradient(0, height, width * 0.82, 0);
  gradient.addColorStop(0, DEPTH_SHALLOW);
  gradient.addColorStop(0.35, "#c8c8c8");
  gradient.addColorStop(0.62, "#3d3d3d");
  gradient.addColorStop(1, DEPTH_DEEP);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

const DRAWERS: Record<
  BathymetryPreset,
  (ctx: CanvasRenderingContext2D, width: number, height: number) => void
> = {
  beach: drawBeachBreak,
  reef: drawReefBreak,
  point: drawPointBreak,
};

export function drawBathymetryPreset(
  ctx: CanvasRenderingContext2D,
  preset: BathymetryPreset,
  width = BATHYMETRY_CANVAS_SIZE,
  height = BATHYMETRY_CANVAS_SIZE,
) {
  const drawer = DRAWERS[preset];
  drawer(ctx, width, height);
}
