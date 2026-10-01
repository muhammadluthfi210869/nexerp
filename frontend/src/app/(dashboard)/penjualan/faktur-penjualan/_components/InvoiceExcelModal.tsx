"use client";

import React from "react";
import { Upload, Download } from "lucide-react";
import { DnaModal, DnaButton, useDnaToast } from "@/components/dna";

interface InvoiceExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceExcelModal({ isOpen, onClose }: InvoiceExcelModalProps) {
  const toast = useDnaToast();

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Import / Export Excel Faktur Penjualan"
      size="md"
    >
      <div className="space-y-4 text-sm">
        <p className="text-xs text-slate-500">
          Unggah file spreadsheet (.xlsx/.csv) untuk sinkronisasi massal faktur penjualan atau unduh laporan buku piutang.
        </p>

        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="font-semibold text-xs text-slate-700">Tarik & Lepas file Excel di sini</p>
          <p className="text-[10px] text-slate-400 mt-1">Mendukung format .xlsx, .xls, .csv hingga 10MB</p>
        </div>

        <div className="flex justify-between items-center pt-2">
          <DnaButton
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={() => {
              toast.success("Download Template", "Template Faktur_Penjualan.xlsx berhasil diunduh.");
            }}
          >
            Unduh Template
          </DnaButton>
          <div className="flex gap-2">
            <DnaButton variant="secondary" onClick={onClose}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => {
                toast.success("Import Berhasil", "3 data tagihan berhasil diimpor.");
                onClose();
              }}
            >
              Mulai Import
            </DnaButton>
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
