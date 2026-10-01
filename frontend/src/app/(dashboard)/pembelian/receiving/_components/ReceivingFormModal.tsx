import React from "react";
import { ShieldCheck } from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaSelect,
  DnaInput,
  DnaBadge,
} from "@/components/dna";

interface ReceivingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPO: string;
  onSelectedPOChange: (value: string) => void;
  poOptions: Array<{ label: string; value: string }>;
  doRef: string;
  onDoRefChange: (value: string) => void;
  invoiceNo: string;
  onInvoiceNoChange: (value: string) => void;
  arrivalDate: string;
  onArrivalDateChange: (value: string) => void;
  taxTreatment: string;
  onTaxTreatmentChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReceivingFormModal({
  isOpen,
  onClose,
  selectedPO,
  onSelectedPOChange,
  poOptions,
  doRef,
  onDoRefChange,
  invoiceNo,
  onInvoiceNoChange,
  arrivalDate,
  onArrivalDateChange,
  taxTreatment,
  onTaxTreatmentChange,
  onSubmit,
  isSubmitting,
}: ReceivingFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Penerimaan Barang Baru (GRN)"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Kedatangan"}
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-zinc-700 font-semibold mb-1">Hubungkan ke PO Aktif *</label>
          <DnaSelect
            placeholder="Cari PO Aktif..."
            value={selectedPO}
            onChange={onSelectedPOChange}
            options={poOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">No. DO / Surat Jalan Pengiriman</label>
            <DnaInput placeholder="Contoh: SJ-2026-0041" value={doRef} onChange={(e) => onDoRefChange(e.target.value)} />
          </div>
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">No. Faktur Vendor (Jika Ada)</label>
            <DnaInput placeholder="Contoh: INV-9901" value={invoiceNo} onChange={(e) => onInvoiceNoChange(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Tanggal & Waktu Kedatangan</label>
            <DnaInput type="datetime-local" value={arrivalDate} onChange={(e) => onArrivalDateChange(e.target.value)} />
          </div>
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Perlakuan Pajak</label>
            <DnaSelect
              value={taxTreatment}
              onChange={onTaxTreatmentChange}
              options={[
                { label: "NON TAXABLE", value: "NON_TAX" },
                { label: "PPN 11%", value: "PPN_11" },
              ]}
            />
          </div>
        </div>

        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-900">Verifikasi QC Terintegrasi</p>
              <p className="text-[10px] text-zinc-500">Setelah disimpan, kedatangan otomatis masuk ke antrean uji lab QC.</p>
            </div>
          </div>
          <DnaBadge variant="default">Gate 1: Inbound</DnaBadge>
        </div>
      </div>
    </DnaModal>
  );
}
