"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

export function ARInsightBanner() {
  return (
    <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-8 flex gap-8 items-center shadow-sm mt-6">
      <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-slate-100">
        <TrendingUp className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Owner Insight: Revenue Integrity</p>
        <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">
          Sample revenue collection is critical for R&D overhead coverage. Ensure all{" "}
          <span className="text-blue-600 font-black">R&D Samples</span> with outstanding balances are flagged in the next executive pipeline review.
        </p>
      </div>
    </div>
  );
}
