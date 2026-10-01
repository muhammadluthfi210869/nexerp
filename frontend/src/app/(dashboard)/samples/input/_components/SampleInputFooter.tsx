"use client";

import React from "react";
import { Info } from "lucide-react";

export function SampleInputFooter() {
  return (
    <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="space-y-0.5">
          <p className="text-md font-bold text-slate-900 uppercase tracking-tight">
            Operation Protocol v2.4
          </p>
          <p className="text-[11px] text-slate-500 font-medium max-w-md">
            Data entries are mirrored locally. Comparison (H-1) indicators are
            pulled automatically.
          </p>
        </div>
      </div>
      <div className="mt-4 md:mt-0 flex items-center gap-3">
        <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400">
          Latency: <span className="text-emerald-600">12ms</span>
        </div>
        <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-400">
          Region: <span className="text-blue-600">ID-JKT</span>
        </div>
      </div>
    </div>
  );
}
