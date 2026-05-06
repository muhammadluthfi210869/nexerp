import React, { Suspense } from "react";
import AdjustmentClient from "./AdjustmentClient";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Stock Adjustment | Warehouse Hub",
  description: "Warehouse stock correction and adjustment portal.",
};

export default function AdjustmentPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-white animate-pulse" />
          <div className="text-slate-500 animate-pulse text-[10px] font-black tracking-[0.4em] uppercase italic">Initializing Adjustment Protocol...</div>
        </div>
      </div>
    }>
      <AdjustmentClient />
    </Suspense>
  );
}
