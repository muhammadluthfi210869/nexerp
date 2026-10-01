import React from "react";
import { RotateCcw, Plus } from "lucide-react";
import { DnaPageHeader, DnaButton } from "@/components/dna";

interface CoaAutoHeaderProps {
  onSeed: () => void;
  isSeeding: boolean;
  onOpenCreate: () => void;
}

export function CoaAutoHeader({
  onSeed,
  isSeeding,
  onOpenCreate,
}: CoaAutoHeaderProps) {
  return (
    <DnaPageHeader
      backLink={{ href: "/finance/accounting/coa", label: "Kembali ke Chart of Accounts" }}
      title="COA JURNAL OTOMATIS (KELOLA COA)"
      description="Konfigurasi Aturan Auto-Posting Debit dan Kredit per Jenis Dokumen Transaksi Operasional"
      actions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="secondary"
            size="md"
            onClick={onSeed}
            disabled={isSeeding}
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            {isSeeding ? "Menginisialisasi..." : "Inisialisasi 12 Standar G-SERP"}
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Aturan Posting
          </DnaButton>
        </div>
      }
    />
  );
}
