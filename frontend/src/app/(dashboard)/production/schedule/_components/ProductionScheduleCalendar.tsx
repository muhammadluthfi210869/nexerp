"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Eye, ArrowRight } from "lucide-react";
import { DnaBadge, DnaButton } from "@/components/dna";
import { ProductionScheduleItem, STAGE_CONFIG } from "../_types/schedule.types";

interface ProductionScheduleCalendarProps {
  filteredSchedules: ProductionScheduleItem[];
  onViewDetail: (item: ProductionScheduleItem) => void;
}

export function ProductionScheduleCalendar({
  filteredSchedules,
  onViewDetail,
}: ProductionScheduleCalendarProps) {
  return (
    <div className="space-y-3 p-1">
      {filteredSchedules.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Tidak ada jadwal produksi yang cocok dengan filter.
        </div>
      ) : (
        filteredSchedules.map((item) => {
          const config = STAGE_CONFIG[item.stage] || STAGE_CONFIG.MIXING;
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="min-w-[260px] space-y-1">
                <div className="flex items-center gap-2">
                  <DnaBadge variant={config.badge}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </DnaBadge>
                  <span className="font-bold text-xs text-slate-900">{item.code}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">({item.spkCode})</span>
                </div>
                <div className="font-semibold text-xs text-slate-900">{item.productName}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {item.brandName} â€¢ <span className="text-indigo-600 tabular-nums">{item.machineName}</span>
                </div>
              </div>

              {/* Middle Timeline & Progress */}
              <div className="flex-1 max-w-md space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {item.startDate} s/d {item.endDate}
                  </span>
                  <span className="tabular-nums">
                    {item.progressPct}% â€¢ {item.targetQty.toLocaleString()} {item.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.stage === "MIXING"
                        ? "bg-blue-600"
                        : item.stage === "FILLING"
                        ? "bg-purple-600"
                        : "bg-amber-600"
                    }`}
                    style={{ width: `${Math.max(item.progressPct, 5)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Operator: {item.operator}</span>
                  <span className="italic truncate max-w-xs">{item.notes}</span>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-2 shrink-0">
                <DnaButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetail(item)}
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                </DnaButton>

                <Link
                  href={
                    item.stage === "MIXING"
                      ? "/production/mixing"
                      : item.stage === "FILLING"
                      ? "/production/filling"
                      : "/production/packaging"
                  }
                >
                  <DnaButton variant="primary" size="sm">
                    Eksekusi
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </DnaButton>
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
