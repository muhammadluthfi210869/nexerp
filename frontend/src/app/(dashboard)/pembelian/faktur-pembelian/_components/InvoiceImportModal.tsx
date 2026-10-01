"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { IMPORT_HEADERS } from "../_types/faktur-pembelian.types";

interface InvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: string[]) => void;
  isPending: boolean;
}

export function InvoiceImportModal({
  isOpen,
  onClose,
  onImport,
  isPending,
}: InvoiceImportModalProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleDownloadTemplate = () => {
    const blob = new Blob([
      "vendor,invoice number,due date,item,qty,unit,price,notes\nPT Supplier,INV/2026/01,2026-10-31,BBK00001,10,Kg,150000,Contoh",
    ], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template-faktur-pembelian.csv";
    link.click();
  };

  const handleSubmit = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);
      onImport(rows);
    };
    reader.readAsText(file);
  };

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Faktur Pembelian dari CSV"
      description="Unggah file CSV untuk memproses faktur massal."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            loading={isPending}
            disabled={!file || isPending}
            onClick={handleSubmit}
          >
            Proses File
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-3 text-xs">
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
          <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <DnaInput
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-[11px] text-slate-400 mt-2">
            Format didukung: <span className="font-semibold">.csv</span>.
          </p>
        </div>
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <span className="text-slate-600">
            Kolom: <span className="font-mono text-[11px]">{IMPORT_HEADERS}</span>
          </span>
          <DnaButton variant="ghost" size="sm" onClick={handleDownloadTemplate}>
            Unduh Template
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
