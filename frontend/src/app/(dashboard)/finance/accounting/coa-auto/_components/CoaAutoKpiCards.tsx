import React from "react";
import { Zap, CheckCircle2, BookOpen, Settings2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { CoaAutoKpis } from "../_types/coa-auto.types";

interface CoaAutoKpiCardsProps {
  kpis: CoaAutoKpis;
}

export function CoaAutoKpiCards({ kpis }: CoaAutoKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>TOTAL ATURAN AKTIF</span>
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2">{kpis.totalActiveRules}</p>
        <span className="text-[10px] text-slate-400">Aturan posting otomatis siap kerja</span>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>DOKUMEN TERINTEGRASI</span>
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2">
          {kpis.integratedDocumentsCount}
        </p>
        <span className="text-[10px] text-slate-400">Faktur AR/AP, DP, Produksi</span>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>AKUN COA TERPETAKAN</span>
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2">{kpis.mappedAccountsCount}</p>
        <span className="text-[10px] text-slate-400">Bagan akun aktif dalam GL</span>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <Settings2 className="w-4 h-4 text-purple-600" />
          <span>DOUBLE-ENTRY ENGINE</span>
        </div>
        <p className="text-2xl font-black text-emerald-600 mt-2">{kpis.doubleEntryEngineRate}</p>
        <span className="text-[10px] text-slate-400">Prinsip balance ketat</span>
      </div>
    </DnaKpiGrid>
  );
}
