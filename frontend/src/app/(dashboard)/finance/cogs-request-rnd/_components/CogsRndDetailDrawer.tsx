"use client";

import React from "react";
import { X } from "lucide-react";
import { DnaButton } from "@/components/dna";
import type { CogsRequest } from "../_types/cogs-request-rnd.types";

interface CogsRndDetailDrawerProps {
  selectedCogs: CogsRequest | null;
  onClose: () => void;
}

export function CogsRndDetailDrawer({
  selectedCogs,
  onClose,
}: CogsRndDetailDrawerProps) {
  if (!selectedCogs) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Rincian Komposisi HPP per Unit</h3>
            <p className="text-xs text-blue-600 font-semibold tabular-nums">
              {selectedCogs.requestCode} â€¢ {selectedCogs.productName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">1. Formula Bulk / Netto:</span>
            <span className="tabular-nums font-semibold text-slate-800">
              Rp {selectedCogs.formulaCost.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">2. Kemasan Primer (Botol/Jar/Tube):</span>
            <span className="tabular-nums font-semibold text-slate-800">
              Rp {selectedCogs.primaryPackCost.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">3. Kemasan Sekunder (Box Printing/Seal):</span>
            <span className="tabular-nums font-semibold text-slate-800">
              Rp {selectedCogs.secondaryPackCost.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">4. Upah Tenaga Kerja Langsung:</span>
            <span className="tabular-nums font-semibold text-slate-800">
              Rp {selectedCogs.laborCost.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">5. Alokasi Overhead Pabrik (Listrik & QC):</span>
            <span className="tabular-nums font-semibold text-slate-800">
              Rp {selectedCogs.overheadCost.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900">Total HPP per Pcs (BOM):</span>
            <span className="tabular-nums font-bold text-rose-600 text-sm">
              Rp {selectedCogs.totalHppPerPcs.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-lg border border-emerald-200">
            <span className="font-bold text-emerald-900">Rekomendasi Harga Jual (Quotation):</span>
            <span className="tabular-nums font-bold text-emerald-700 text-sm">
              Rp {selectedCogs.recommendedPrice.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <DnaButton variant="outline" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </div>
  );
}
