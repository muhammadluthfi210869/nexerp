import React from "react";
import { FlaskConical, Scale, Sparkles, Building, Layers } from "lucide-react";
import { DnaBadge, DnaInput, formatRupiah } from "@/components/dna";
import { FormulaLabHeader } from "../_types/formula.types";

interface FormulaHeaderCardProps {
  header: FormulaLabHeader;
  onBatchSizeChange: (val: number) => void;
}

export function FormulaHeaderCard({ header, onBatchSizeChange }: FormulaHeaderCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60 font-bold">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900">{header.formulaCode}</span>
              <DnaBadge variant="purple">{header.version}</DnaBadge>
              <DnaBadge variant="success">Lab Trial Active</DnaBadge>
            </div>
            <h2 className="text-sm font-bold text-slate-800 mt-0.5">{header.productName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
            <Scale className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 font-medium">Batch Trial Size:</span>
            <input
              type="number"
              min={1}
              value={header.batchSizeGram}
              onChange={(e) => onBatchSizeChange(Number(e.target.value) || 1000)}
              className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <span className="text-slate-500 font-bold">Gram</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Klien &amp; Brand</span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5">{header.customerName}</span>
        </div>
        <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategori Sediaan</span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5">{header.category}</span>
        </div>
        <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Target pH Acuan</span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5 tabular-nums">{header.targetPh}</span>
        </div>
        <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Viskositas</span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5 tabular-nums">{header.targetViscosity}</span>
        </div>
      </div>
    </div>
  );
}
