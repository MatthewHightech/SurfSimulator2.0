"use client";

import dynamic from "next/dynamic";

const OceanScene = dynamic(
  () => import("./OceanScene").then((mod) => mod.OceanScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        Loading simulation…
      </div>
    ),
  },
);

export function SurfCanvas() {
  return <OceanScene />;
}
