"use client";

import { useBathymetry } from "@/context/BathymetryContext";
import { useEffect, useRef } from "react";

/**
 * 2D mirror of the off-screen canvas so depth-map updates are visible outside WebGL.
 */
export function BathymetryMapPreview() {
  const { canvas, preset, ready, mapRevision } = useBathymetry();
  const previewRef = useRef<HTMLCanvasElement>(null);

  // Depends on mapRevision (not preset): child effects run before the provider
  // redraws the source canvas, so preset alone would copy stale pixels.
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || !canvas || !ready) return;

    preview.width = canvas.width;
    preview.height = canvas.height;

    const ctx = preview.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);
  }, [canvas, ready, mapRevision]);

  return (
    <div className="pointer-events-none flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Depth map
      </span>
      <canvas
        ref={previewRef}
        className="h-28 w-28 rounded border border-slate-700/80 bg-black shadow-lg"
        aria-label={`Bathymetry preview: ${preset}`}
      />
      <span className="text-[10px] text-slate-500">
        Black = deep · White = shallow
      </span>
    </div>
  );
}
