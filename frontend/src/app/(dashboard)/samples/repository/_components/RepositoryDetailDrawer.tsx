import React from "react";
import { Printer, Lock } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaButton,
  DnaBadge,
  formatRupiah,
} from "@/components/dna";
import { ArchivedFormula } from "../_types/repository.types";

interface RepositoryDetailDrawerProps {
  selectedFormula: ArchivedFormula | null;
  onClose: () => void;
  onPrintVault: () => void;
}

export function RepositoryDetailDrawer({
  selectedFormula,
  onClose,
  onPrintVault,
}: RepositoryDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedFormula}
      onClose={onClose}
      title={selectedFormula?.name || "Detail Vault Formula"}
      subtitle={`Kode: ${selectedFormula?.formulaCode} • Versi: ${selectedFormula?.activeVersion}`}
      badge={
        selectedFormula && (
          <DnaBadge
            variant={
              selectedFormula.status === "RELEASED"
                ? "success"
                : selectedFormula.status === "ARCHIVED"
                ? "warning"
                : "neutral"
            }
          >
            {selectedFormula.status}
          </DnaBadge>
        )
      }
      footerActions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            size="sm"
            onClick={onPrintVault}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Dokumen
          </DnaButton>
        </div>
      }
    >
      {selectedFormula && (
        <div className="space-y-6 text-xs">
          {/* Vault Security Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              Integritas Enkripsi Formula Vault
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Formula ini telah dikunci dan disimpan dalam database terenkripsi AES-256. Setiap modifikasi wajib melalui proses permohonan penyesuaian formula (Revision Branch).
            </p>
          </div>

          {/* Specifications Details */}
          <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Informasi Rilis & Uji Mutu
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Kategori Produk:</span>
                <span className="font-semibold text-slate-800">{selectedFormula.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hasil Uji Stabilitas:</span>
                <span className="font-semibold text-emerald-700">{selectedFormula.stability}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Formulator:</span>
                <span className="font-semibold text-slate-800">{selectedFormula.createdBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tanggal Rilis:</span>
                <span className="tabular-nums text-slate-800">{selectedFormula.releasedAt}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Jumlah Bahan Baku:</span>
                <span className="tabular-nums font-semibold text-slate-800">{selectedFormula.ingredientCount} Bahan</span>
              </div>
              <div>
                <span className="text-slate-400 block">Estimasi HPP Bulk / Kg:</span>
                <span className="tabular-nums font-bold text-purple-700">{formatRupiah(selectedFormula.costPerKg)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DnaDetailDrawer>
  );
}
