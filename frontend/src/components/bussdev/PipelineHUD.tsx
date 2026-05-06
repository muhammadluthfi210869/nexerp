"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Lock, 
  Unlock, 
  FileText, 
  FlaskConical, 
  DollarSign,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineHUDProps {
  lead: any;
}

export function PipelineHUD({ lead }: PipelineHUDProps) {
  const { data: balance } = useQuery({
    queryKey: ["lead-balance", lead.id],
    queryFn: async () => (await api.get(`/bussdev/lead/${lead.id}/balance`)).data,
    enabled: !!lead.id,
  });

  const percentagePaid = balance?.percentagePaid || 0;
  const isFinanceVerified = percentagePaid >= 50;

  const gates = [
    { id: "spk", icon: FileText, label: "SPK", isDone: !!lead.spkFileUrl },
    { id: "formula", icon: FlaskConical, label: "R&D", isDone: lead.isFormulaLocked },
    { id: "payment", icon: DollarSign, label: "DP", isDone: isFinanceVerified },
    { id: "legality", icon: ShieldCheck, label: "LEGAL", isDone: lead.stage !== "NEW_LEAD" && !!lead.spkFileUrl },
  ];

  const isReadyForProd = gates.every(g => g.isDone);
  const integrity = Math.round((gates.filter(g => g.isDone).length / gates.length) * 100);

  // Determine the primary blocker
  let blockerMessage = "";
  if (!lead.isFormulaLocked) blockerMessage = "R&D: Formula belum dikunci.";
  if (!lead.spkFileUrl) blockerMessage = "LEGAL: SPK belum diunggah.";
  if (!isFinanceVerified) blockerMessage = `FINANCE: DP ${Math.round(percentagePaid)}% (Butuh 50%).`;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-0.5">
            {gates.map((gate) => (
              <div 
                key={gate.id}
                title={gate.label}
                className={cn(
                  "h-6 w-6 rounded-full border border-white flex items-center justify-center transition-all",
                  gate.isDone ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                )}
              >
                <gate.icon className="h-3 w-3" />
              </div>
            ))}
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded-full flex items-center gap-1.5 border text-[8px] font-bold uppercase tracking-wider",
            isReadyForProd ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-slate-200 border-slate-300 text-slate-600"
          )}>
            {isReadyForProd ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
            {isReadyForProd ? "Operational Ready" : "Gate Blocked"}
          </div>
        </div>
        <div className="text-right">
           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mr-1">Integrity:</span>
           <span className="text-[12px] font-bold tabular-nums text-slate-900">{integrity}%</span>
        </div>
      </div>

      {!isReadyForProd && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
           <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
           <p className="text-[10px] font-bold text-amber-800 leading-tight">
             {blockerMessage}
           </p>
        </div>
      )}
    </div>
  );
}

