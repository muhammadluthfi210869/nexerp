import React from "react";
import { DataCard, DnaBadge } from "@/components/dna";
import { InspectionPhase, QcParameter } from "../_types/workbench.types";

interface QualityWorkbenchSummarySidebarProps {
  activePhase: InspectionPhase;
  stepLogId: string;
  parameters: QcParameter[];
  hasAllPass: boolean;
}

export function QualityWorkbenchSummarySidebar({
  activePhase,
  stepLogId,
  parameters,
  hasAllPass,
}: QualityWorkbenchSummarySidebarProps) {
  return (
    <div className="space-y-6">
      <DataCard
        title="Parameter Summary"
        dotColor="bg-slate-400"
        className="space-y-3"
        noShadow
      >
        {parameters.map((param, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
          >
            <span className="text-[11px] font-bold text-slate-600">
              {param.label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tabular-nums text-slate-900">
                {param.value}
              </span>
              <DnaBadge
                status={param.status === "PASS" ? "success" : "critical"}
                className="text-[8px] px-2 py-0.5"
              >
                {param.status}
              </DnaBadge>
            </div>
          </div>
        ))}
        <div className="pt-3 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Overall
          </span>
          <DnaBadge
            status={hasAllPass ? "success" : "critical"}
            className="px-3 py-1"
          >
            {hasAllPass ? "ALL PASS" : "FAIL DETECTED"}
          </DnaBadge>
        </div>
      </DataCard>

      <DataCard
        title="Audit Info"
        dotColor="bg-emerald-400"
        titleColor="text-white/60"
        className="bg-slate-900 text-white overflow-hidden relative"
        noShadow
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Stage</span>
            <DnaBadge status="info" className="text-[8px]">{activePhase}</DnaBadge>
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Step Log</span>
            <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
              {stepLogId || "â€”"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Endpoint</span>
            <span className="text-[9px] font-bold text-blue-300 tabular-nums">POST /qc/audits</span>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed italic">
              "All QC data is timestamped and encrypted. Audit trail is immutable once submitted."
            </p>
          </div>
        </div>
      </DataCard>
    </div>
  );
}
