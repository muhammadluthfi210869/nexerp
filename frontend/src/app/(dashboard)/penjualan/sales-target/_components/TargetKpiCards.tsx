"use client";

import React from "react";
import { Target, Coins, TrendingUp, Award } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import type { SalesTargetItem } from "../_types/sales-target.types";
import { MONTHS_ID } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface TargetKpiCardsProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  selectedMonth?: number;
  selectedYear?: number;
  totalNominalPeriod?: number;
  totalRealizedPeriod?: number;
  countAll?: number;
  countReached?: number;
  countOnTrack?: number;
  countUnder?: number;
  avgAchievement?: number;
  topPerformer?: SalesTargetItem;
}

export function TargetKpiCards(props: TargetKpiCardsProps) {
  const selectedMonth = props.selectedMonth ?? props.ops?.selectedMonth ?? (new Date().getMonth() + 1);
  const selectedYear = props.selectedYear ?? props.ops?.selectedYear ?? new Date().getFullYear();
  const totalNominalPeriod = props.totalNominalPeriod ?? props.ops?.totalNominalPeriod ?? 0;
  const totalRealizedPeriod = props.totalRealizedPeriod ?? props.ops?.totalRealizedPeriod ?? 0;
  const countAll = props.countAll ?? props.ops?.countAll ?? 0;
  const countReached = props.countReached ?? props.ops?.countReached ?? 0;
  const countOnTrack = props.countOnTrack ?? props.ops?.countOnTrack ?? 0;
  const countUnder = props.countUnder ?? props.ops?.countUnder ?? 0;
  const avgAchievement = props.avgAchievement ?? props.ops?.avgAchievement ?? 0;
  const topPerformer = props.topPerformer ?? props.ops?.topPerformer;

  return (
    <DnaKpiGrid cols={4}>
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <Target className="w-4 h-4 text-blue-600" />
          <span>TARGET OMZET {MONTHS_ID[selectedMonth - 1]?.toUpperCase()} {selectedYear}</span>
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2">
          Rp {(totalNominalPeriod / 1000000).toLocaleString("id-ID")} Jt
        </p>
        <span className="text-[10px] text-slate-400">Total kuota {countAll} PIC Marketing</span>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <Coins className="w-4 h-4 text-emerald-600" />
          <span>REALISASI REVENUE AKTUAL</span>
        </div>
        <p className="text-2xl font-black text-emerald-600 mt-2">
          Rp {(totalRealizedPeriod / 1000000).toLocaleString("id-ID")} Jt
        </p>
        <span className="text-[10px] text-slate-400">Realisasi pelunasan invoice maklon</span>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span>RATA-RATA PENCAPAIAN</span>
        </div>
        <p className={`text-2xl font-black mt-2 ${avgAchievement >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
          {avgAchievement}%
        </p>
        <span className="text-[10px] text-slate-400">
          {countReached} Tercapai â€¢ {countOnTrack} On Track â€¢ {countUnder} Di Bawah
        </span>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <Award className="w-4 h-4 text-amber-500" />
          <span>TOP PERFORMER BULAN INI</span>
        </div>
        <p className="text-xl font-black text-slate-900 mt-2 truncate">
          {topPerformer ? topPerformer.marketingName : "Belum ada data"}
        </p>
        <span className="text-[10px] text-slate-400">
          {topPerformer ? `${topPerformer.achievementPercent}% kuota tercapai` : "Belum ada target di-set"}
        </span>
      </div>
    </DnaKpiGrid>
  );
}
