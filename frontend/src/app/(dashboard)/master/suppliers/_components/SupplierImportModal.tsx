"use client";

import React from "react";
import { Upload } from "lucide-react";
import { DnaModal, DnaInput, DnaButton } from "@/components/dna";

interface SupplierImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  onDownloadTemplate: () => void;
  onStartImport: () => void;
  isPending: boolean;
}

export function SupplierImportModal({
  isOpen,
  onClose,
  importFile,
  setImportFile,
  onDownloadTemplate,
  onStartImport,
  isPending,
}: SupplierImportModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Master Supplier via Excel / CSV"
      description="Unggah file spreadsheet template supplier untuk validasi dan penambahan massal data rekanan"
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <DnaInput
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-[11px] text-slate-500 text-center">
            {importFile ? importFile.name : "Belum ada file dipilih"} â€” format .csv, maksimal 10MB
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <strong className="text-slate-800">Catatan Validasi Sistem:</strong>
          <p>
            1. Kolom wajib: <code>name</code>. Kolom opsional: <code>contact</code>, <code>phone</code>,{" "}
            <code>email</code>, <code>address</code>, <code>city</code>.
          </p>
          <p>2. Baris tanpa <code>name</code> ditolak; baris lain tetap diimpor dan dilaporkan.</p>
          <p>3. Email harus format email valid, atau dikosongkan.</p>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            onClick={onDownloadTemplate}
            className="text-blue-600 hover:underline font-bold text-[11px]"
          >
            Unduh Format Template CSV
          </button>
          <div className="flex gap-2">
            <DnaButton
              variant="ghost"
              onClick={() => {
                onClose();
                setImportFile(null);
              }}
            >
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              loading={isPending}
              onClick={onStartImport}
            >
              Mulai Import
            </DnaButton>
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
