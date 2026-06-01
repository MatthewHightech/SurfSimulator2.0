import {
  BATHYMETRY_CANVAS_SIZE,
  DEPTH_DEEP,
  DEPTH_SHALLOW,
} from "./constants";
import type { BathymetryPreset } from "./types";

function clearToDeep(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = DEPTH_DEEP;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Beach break: linear slope from deep (bottom) to shallow (top).
 */
export function drawBeachBreak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  clearToDeep(ctx, width, height);

  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, DEPTH_DEEP);
  gradient.addColorStop(0.55, "#1a1a1a");
  gradient.addColorStop(0.85, "#9a9a9a");
  gradient.addColorStop(1, DEPTH_SHALLOW);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Reef break: deep basin with a concentrated shallow mound at center.
 */
export function drawReefBreak(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  clearToDeep(ctx, width, height);

  const cx = width * 0.5;
  const cy = height * 0.5;
  const radiusX = width * 0.2;
  const radiusY = height * 0.16;

  const mound = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radiusX, radiusY));
  mound.addColorStop(0, DEPTH_SHALLOW);
  mound.addColorStop(0.45, "#e0e0e0");
  mound.addColorStop(0.72, "#4a4a4a");
  mound.addColorStop(1, DEPTH_DEEP);

  ctx.fillStyle = mound;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sharpen the reef crown
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, radiusX * 0.42, radiusY * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Point break: headland wedge from the bottom-left corner tapering diagonally.
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

  // Secondary shelf line for a more natural point shape
  ctx.strokeStyle = "rgba(220, 220, 220, 0.25)";
  ctx.lineWidth = Math.max(2, width * 0.006);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.62);
  ctx.quadraticCurveTo(width * 0.32, height * 0.38, width * 0.58, height * 0.22);
  ctx.stroke();
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
