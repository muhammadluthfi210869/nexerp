"use client";

import React from "react";
import { PackageCheck } from "lucide-react";
import { Button, DnaBadge } from "@/components/dna";
import type { LogisticsItem } from "../_types/workstation.types";

interface WorkstationLogisticsTabProps {
  activeTab: string;
  logisticsItems: LogisticsItem[];
  onSelectIssueItem: (item: LogisticsItem) => void;
}

export function WorkstationLogisticsTab({
  activeTab,
  logisticsItems,
  onSelectIssueItem,
}: WorkstationLogisticsTabProps) {
  return (
    <div hidden={activeTab !== "logistics"} className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-emerald-600 rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">
          PENDING PRODUCTION REQUISITIONS
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {logisticsItems.map((item: any) => (
          <div
            key={item.materialId}
            className="bento-card bg-white p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 group hover:translate-y-[-5px] transition-all"
          >
            <div className="flex items-center gap-8">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <PackageCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-brand-black uppercase italic tracking-tighter">
                  {item.name}
                </h4>
                <div className="flex flex-wrap gap-6 mt-2">
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      REQUESTED
                    </p>
                    <p className="text-xs font-black text-brand-black uppercase tabular tracking-tighter">
                      {item.totalRequested} {item.unit}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      STOCK AVAIL
                    </p>
                    <p className="text-xs font-black text-brand-black uppercase tabular tracking-tighter">
                      {item.currentStock} {item.unit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DnaBadge
                status="success"
                className="font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm italic"
              >
                READY_FOR_HANDOVER
              </DnaBadge>
              <Button
                onClick={() => onSelectIssueItem(item)}
                className="h-12 px-8 bg-brand-black hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-slate-100 italic border-none transition-all"
              >
                ISSUE MATERIAL
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
