/** Resolution of the off-screen depth map (power-of-two for GPU sampling). */
export const BATHYMETRY_CANVAS_SIZE = 512;

/**
 * Canvas layout (matches default camera at +Z looking toward origin):
 * - Top (y = 0): open ocean, far from camera — always deepest
 * - Bottom (y = height): shore side, toward camera — shallowest
 */
export const BATHYMETRY_FAR_EDGE = "top" as const;

/** Maximum ocean depth — black in the grayscale map. */
export const DEPTH_DEEP = "#000000";

/** Shallow reef / shoreline — white in the grayscale map. */
export const DEPTH_SHALLOW = "#ffffff";
