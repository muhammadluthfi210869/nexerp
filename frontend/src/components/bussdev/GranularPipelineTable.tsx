"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Box, Palette, Zap, Plus, Check, Clock, UploadCloud } from "lucide-react";
import { useGranularData } from "@/hooks/use-granular-data";
import { toast } from "sonner";

interface GranularPipelineTableProps {
  data: any[];
  onAction: (lead: any) => void;
}

export function GranularPipelineTable({ data, onAction }: GranularPipelineTableProps) {
  const { updateLead } = useGranularData();

  const handleQuickUpdate = (item: any, field: string, currentVal: any) => {
    const updates: any = {};
    
    if (field === 'rev') {
      const nextStatus = currentVal === "PENDING" ? "APPRO..." : "PENDING";
      // Find the next available revision slot or update the current one
      if (currentVal) {
        // Toggle existing
        if (item.rev3 && item.rev3.status === currentVal) updates.rev3 = { ...item.rev3, status: nextStatus };
        else if (item.rev2 && item.rev2.status === currentVal) updates.rev2 = { ...item.rev2, status: nextStatus };
        else if (item.rev1 && item.rev1.status === currentVal) updates.rev1 = { ...item.rev1, status: nextStatus };
      } else {
        // Add new
        if (!item.rev1) updates.rev1 = { date: new Date().toISOString().split('T')[0], status: "PENDING" };
        else if (!item.rev2) updates.rev2 = { date: new Date().toISOString().split('T')[0], status: "PENDING" };
        else if (!item.rev3) updates.rev3 = { date: new Date().toISOString().split('T')[0], status: "PENDING" };
        toast.info("R&D Protocol: New revision request registered in Lab Track.");
      }
      if (nextStatus === "APPRO...") toast.success("Sample Revision APPROVED by Client.");
    }

    if (field === 'kms' || field === 'dsn' || field === 'val') {
      const statuses = ["not started", "progress", "done"];
      const nextIdx = (statuses.indexOf(currentVal) + 1) % statuses.length;
      updates[field] = statuses[nextIdx];
      
      if (updates[field] === "done") {
        toast.success(`${field.toUpperCase()} marked as COMPLETE`);
        if (field === 'dsn') toast.info("Creative Team: Design Locked and sent to SCM.");
      }
    }

    if (field === 'hki') {
      const next = currentVal === "NOT STARTED" ? "PROGRESS" : currentVal === "PROGRESS" ? "DONE" : "NOT STARTED";
      updates[field] = next;
      if (next === "PROGRESS") toast.info("Legal: HKI Registration initiated at DJKI.");
    }

    updateLead(item.id, updates);
  };

  return (
    <Card className="border border-slate-100 shadow-sm rounded-none overflow-hidden bg-white">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[1600px]">
          <thead>
            {/* GROUP HEADERS */}
            <tr className="bg-slate-50/50">
              <th className="py-2 px-4 border-r border-slate-100 text-[10px] font-bold text-slate-400 uppercase text-center" colSpan={4}></th>
              <th className="py-2 px-4 border-r border-slate-100 text-[9px] font-bold text-slate-400 uppercase text-center bg-slate-100/30" colSpan={2}>RENCANA DEAL</th>
              <th className="py-2 px-4 border-r border-slate-100 text-[9px] font-black text-amber-700 uppercase text-center bg-amber-50/30" colSpan={4}>PELACAKAN SAMPEL (STATUS & REVISI)</th>
              <th className="py-2 px-4 border-r border-slate-100 text-[9px] font-black text-blue-700 uppercase text-center bg-blue-50/30" colSpan={2}>PELACAKAN HKI</th>
              <th className="py-2 px-4 border-r border-slate-100 text-[9px] font-black text-indigo-700 uppercase text-center bg-indigo-50/30" colSpan={3}>SUGGEST</th>
              <th className="py-2 px-4 border-r border-slate-100 text-[9px] font-bold text-slate-400 uppercase text-center" colSpan={3}></th>
            </tr>
            {/* MAIN HEADERS */}
            <tr className="bg-white border-y border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              <th className="py-3 px-4 w-[40px] text-center border-r border-slate-50">NO</th>
              <th className="py-3 px-4 min-w-[180px] border-r border-slate-50">PELANGGAN / NPF</th>
              <th className="py-3 px-4 min-w-[120px] border-r border-slate-50">INFO LEADS</th>
              <th className="py-3 px-4 min-w-[250px] border-r border-slate-50">CATATAN PROGRESS</th>
              <th className="py-3 px-4 w-[100px] text-center bg-slate-50/30">MOQ</th>
              <th className="py-3 px-4 w-[120px] text-center border-r border-slate-50 bg-slate-50/30">RENCANA OMSET</th>
              <th className="py-3 px-4 w-[100px] text-center bg-amber-50/20">REV 1</th>
              <th className="py-3 px-4 w-[100px] text-center bg-amber-50/20">REV 2</th>
              <th className="py-3 px-4 w-[100px] text-center bg-amber-50/20">REV 3</th>
              <th className="py-3 px-4 w-[80px] text-center border-r border-slate-100 bg-amber-50/20">EXTRA</th>
              <th className="py-3 px-4 w-[100px] text-center bg-blue-50/20">PROGRESS HKI</th>
              <th className="py-3 px-4 w-[100px] text-center border-r border-slate-100 bg-blue-50/20">REVISI LOGO</th>
              <th className="py-3 px-4 w-[80px] text-center bg-indigo-50/20">KEMASAN</th>
              <th className="py-3 px-4 w-[80px] text-center bg-indigo-50/20">DESAIN</th>
              <th className="py-3 px-4 w-[80px] text-center border-r border-slate-100 bg-indigo-50/20">NILAI</th>
              <th className="py-3 px-4 min-w-[150px] border-r border-slate-50">NEGOSIASI DEAL</th>
              <th className="py-3 px-4 w-[120px] text-center border-r border-slate-50">STATUS AKHIR</th>
              <th className="py-3 px-4 w-[140px] text-right">TOTAL OMSET (REALISASI)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/30 transition-all group/row cursor-default">
                <td className="py-5 px-4 text-center text-[11px] font-medium text-slate-300 border-r border-slate-50">{idx + 1}</td>
                <td className="py-5 px-4 border-r border-slate-50">
                  <div className="text-[11px] font-black text-brand-black uppercase">{item.customer}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">{item.npf}</div>
                </td>
                <td className="py-5 px-4 border-r border-slate-50">
                   <div className="text-[11px] font-black text-slate-700">{item.leadDate}</div>
                   <div className="text-[10px] font-black text-rose-600 uppercase mt-0.5">{item.daysRun} DAYS RUNN.</div>
                </td>
                <td className="py-5 px-4 border-r border-slate-50 relative group/notes">
                   <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed max-w-[280px]">
                     "{item.notes}"
                   </p>
                   <button 
                     onClick={() => onAction(item)}
                     className="absolute top-1/2 -right-2 -translate-y-1/2 opacity-0 group-hover/notes:opacity-100 p-1.5 bg-blue-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                   >
                     <UploadCloud size={14} />
                   </button>
                </td>
                <td className="py-5 px-4 text-center border-r border-slate-50 bg-slate-50/10">
                   <span className="text-[11px] font-black text-brand-black tabular">{item.moq}</span>
                </td>
                <td className="py-5 px-4 text-center border-r border-slate-100 bg-slate-50/10">
                   <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400">Rp</span>
                      <span className="text-[11px] font-black text-slate-500 tabular">{item.omset.replace('Rp ', '')}</span>
                   </div>
                </td>
                
                {/* REVISION COLUMNS - INTERACTIVE */}
                {[item.rev1, item.rev2, item.rev3].map((rev, i) => (
                  <td key={i} className="py-5 px-2 text-center bg-amber-50/5">
                    {rev ? (
                      <div 
                        onClick={() => handleQuickUpdate(item, 'rev', rev.status)}
                        className={cn(
                        "inline-flex flex-col items-center py-1.5 px-3 rounded-lg border cursor-pointer hover:shadow-md transition-all",
                        rev.status === "APPRO..." ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"
                      )}>
                         <span className="text-[8px] font-black text-slate-400 mb-0.5">{rev.date}</span>
                         <span className={cn(
                           "text-[9px] font-black uppercase tracking-tighter",
                           rev.status === "APPRO..." ? "text-blue-600" : "text-amber-600"
                         )}>{rev.status}</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleQuickUpdate(item, 'rev', null)}
                        className="w-8 h-8 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-500 transition-all mx-auto"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </td>
                ))}
                <td className="py-5 px-4 text-center border-r border-slate-100 bg-amber-50/5">
                   <span className="text-slate-200 text-[11px] font-bold">-</span>
                </td>

                {/* HKI COLUMNS - INTERACTIVE */}
                <td className="py-5 px-4 text-center">
                   <div 
                     onClick={() => handleQuickUpdate(item, 'hki', item.hki)}
                     className="flex flex-col items-center gap-2 cursor-pointer group/hki"
                   >
                      <Badge className={cn(
                        "border-none px-2.5 py-0.5 text-[8px] font-black uppercase tracking-tighter shadow-none transition-all group-hover/hki:scale-105",
                        item.hki === "NOT STARTED" && "bg-slate-100 text-slate-400",
                        item.hki === "PROGRESS" && "bg-blue-600 text-white shadow-md shadow-blue-500/20",
                        item.hki === "DONE" && "bg-emerald-600 text-white"
                      )}>
                        {item.hki}
                      </Badge>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(dot => (
                          <div key={dot} className={cn("w-1.5 h-1.5 rounded-full transition-all", 
                            (dot === 1 && item.hki === "PROGRESS") || item.hki === "DONE" ? "bg-blue-600" : "bg-slate-100"
                          )} />
                        ))}
                      </div>
                   </div>
                </td>
                <td className="py-5 px-4 text-center border-r border-slate-100">
                   <div className="flex flex-col items-center gap-2">
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-tighter shadow-none">
                        {item.logo}
                      </Badge>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(dot => (
                          <div key={dot} className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                        ))}
                      </div>
                   </div>
                </td>

                {/* SUGGEST COLUMNS - INTERACTIVE */}
                {['kms', 'dsn', 'val'].map((field) => (
                  <td key={field} className={cn("py-5 px-2 text-center", field === 'val' && "border-r border-slate-100")}>
                    <div 
                      onClick={() => handleQuickUpdate(item, field, item[field])}
                      className="flex flex-col items-center gap-1.5 group/icon cursor-pointer"
                    >
                        <div className={cn(
                          "p-2 rounded-full border transition-all", 
                          item[field] === "done" ? "bg-emerald-600 text-white border-emerald-400" : 
                          item[field] === "progress" ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-200" :
                          "bg-slate-50 text-slate-300 border-slate-100"
                        )}>
                          {field === 'kms' && <Box size={14} />}
                          {field === 'dsn' && <Palette size={14} />}
                          {field === 'val' && <Zap size={14} />}
                        </div>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-tighter", 
                          item[field] === "done" ? "text-emerald-600" : 
                          item[field] === "progress" ? "text-blue-600" :
                          "text-slate-300"
                        )}>{item[field]}</span>
                    </div>
                  </td>
                ))}

                {/* NEGOSIASI DEAL */}
                <td className="py-5 px-4 border-r border-slate-50">
                   <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map(bar => (
                           <div key={bar} className={cn("h-1 w-4 rounded-full", bar <= item.negoProgress ? "bg-amber-500 shadow-sm shadow-amber-500/20" : "bg-slate-100")} />
                         ))}
                      </div>
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{item.nego}</span>
                   </div>
                </td>

                {/* STATUS AKHIR */}
                <td className="py-5 px-4 text-center border-r border-slate-50">
                   <Badge 
                     onClick={() => onAction(item)}
                     className={cn(
                     "px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm cursor-pointer hover:scale-105 transition-all",
                     item.status === "DEAL" ? "bg-emerald-600 text-white shadow-emerald-500/20" : "bg-white text-brand-black border-slate-200 border shadow-none"
                   )}>
                     {item.status}
                   </Badge>
                </td>

                {/* REALISASI */}
                <td className="py-5 px-4 text-right pr-6">
                   <span className={cn(
                     "text-[12px] font-black tabular tracking-tight",
                     item.realisasi !== "-" ? "text-emerald-500" : "text-slate-200"
                   )}>{item.realisasi}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

