import React from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { DataCard } from "@/components/dna";

export function CogsRequestIntegritySidebar() {
  return (
    <div className="space-y-6">
      <DataCard
        dotColor="bg-blue-600"
        title="COST INTEGRITY"
        titleColor="text-slate-400"
        className="relative overflow-hidden !p-5 rounded-2xl"
      >
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest">Valuation Ledger</p>
            <h2 className="text-xl font-black italic tracking-tighter uppercase mt-1 leading-tight text-slate-900">COST INTEGRITY INDEX</h2>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[8.5px] font-black uppercase text-slate-800 leading-tight">Material Cost</p>
                <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">Auto-fetched from Formula BOM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[8.5px] font-black uppercase text-slate-800 leading-tight">Overhead Allocation</p>
                <p className="text-[9px] font-medium text-slate-400 uppercase leading-none">Based on Production Complexity</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-1 mt-4">
            <p className="text-[8px] font-black uppercase tracking-wider text-blue-600">Protocol 06-HPP</p>
            <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase">
              HPP analysis includes direct labor, variable overhead, and packaging loss buffers (3-5%).
            </p>
          </div>
        </div>
      </DataCard>

      <div className="p-5 border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-wider">Valuation Policy</span>
        </div>
        <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase italic">
          "Every valuation must reflect current raw material market prices. Adjustments are valid for 14 working days."
        </p>
      </div>
    </div>
  );
}
