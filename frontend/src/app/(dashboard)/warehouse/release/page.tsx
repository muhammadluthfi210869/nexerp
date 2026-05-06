import React, { Suspense } from "react";
import ReleaseClient from "./ReleaseClient";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Material Release | Warehouse Hub",
  description: "Production material dispatch and release monitoring.",
};

export default function ReleasePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-white animate-pulse" />
          <div className="text-slate-500 animate-pulse text-[10px] font-black tracking-[0.4em] uppercase italic">Initializing Dispatch Protocol...</div>
        </div>
      </div>
    }>
      <ReleaseClient />
    </Suspense>
  );
}
