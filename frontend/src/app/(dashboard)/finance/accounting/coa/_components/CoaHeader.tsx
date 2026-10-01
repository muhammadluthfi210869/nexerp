"use client";

import React from "react";
import {
  FileSpreadsheet,
  Layers,
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Landmark,
  Plus,
  Zap,
} from "lucide-react";
import { DnaPageHeader, DnaButton } from "@/components/dna";
import { CoaKpis } from "../_types/coa.types";

interface CoaHeaderProps {
  kpis: CoaKpis;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onNavigateAutoCoa: () => void;
  onExportExcel: () => void;
  onCopyCoa: () => void;
  isSeeding: boolean;
  onOpenCreate: () => void;
}

export function CoaHeader({
  onNavigateAutoCoa,
  onExportExcel,
  onCopyCoa,
  isSeeding,
  onOpenCreate,
}: Omit<CoaHeaderProps, "kpis" | "activeTab" | "onTabChange">) {
  return (
    <DnaPageHeader
      backLink={{ href: "/master", label: "Kembali ke Master Hub" }}
      title="CHART OF ACCOUNTS (COA)"
      description="Daftar Rekening Buku Besar, Klasifikasi Akun, dan Struktur Saldo Normal"
      actions={
        <div className="flex items-center gap-2">
          <DnaButton
            variant="outline"
            size="md"
            onClick={onNavigateAutoCoa}
            className="text-purple-700 border-purple-200 hover:bg-purple-50"
          >
            <Zap className="w-4 h-4 mr-1.5 text-purple-600" />
            CoA Jurnal Otomatis
          </DnaButton>
          <DnaButton
            variant="outline"
            size="md"
            onClick={onExportExcel}
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Export Excel
          </DnaButton>
          <DnaButton
            variant="outline"
            size="md"
            loading={isSeeding}
            onClick={onCopyCoa}
            className="text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <Layers className="w-4 h-4 mr-1.5 text-blue-600" />
            Copy CoA
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Akun
          </DnaButton>
        </div>
      }
    />
  );
}
