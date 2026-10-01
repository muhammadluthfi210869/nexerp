"use client";

import React from "react";
import {
  DnaModal,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
} from "@/components/dna";

interface SpkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  formProduct: string;
  setFormProduct: (val: string) => void;
  formCategory: string;
  setFormCategory: (val: string) => void;
  formOrderQty: number;
  setFormOrderQty: (val: number) => void;
  formMachineLine: string;
  setFormMachineLine: (val: string) => void;
  formSupervisor: string;
  setFormSupervisor: (val: string) => void;
  formTargetDate: string;
  setFormTargetDate: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
}

export function SpkFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  formProduct,
  setFormProduct,
  formCategory,
  setFormCategory,
  formOrderQty,
  setFormOrderQty,
  formMachineLine,
  setFormMachineLine,
  formSupervisor,
  setFormSupervisor,
  formTargetDate,
  setFormTargetDate,
  formNotes,
  setFormNotes,
}: SpkFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Terbitkan Surat Perintah Kerja (SPK) Baru"
      size="lg"
    >
      <div className="space-y-4 text-xs">
        <DnaInput
          label="Nama Produk Jadi"
          placeholder="cth: Brightening Facial Serum 30ml"
          value={formProduct}
          onChange={(e) => setFormProduct(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <DnaSelect
            label="Kategori Produk"
            value={formCategory}
            onChange={(val) => setFormCategory(val)}
            options={[
              { label: "Skincare / Serum", value: "Skincare" },
              { label: "Facial Cleanser", value: "Cleanser" },
              { label: "Barrier Moisturizer", value: "Moisturizer" },
              { label: "Sunscreen Gel", value: "Sunscreen" },
              { label: "Body Care / Lotion", value: "Bodycare" },
            ]}
          />
          <DnaInput
            label="Jumlah Target Pesanan (Pcs)"
            type="number"
            value={formOrderQty}
            onChange={(e) => setFormOrderQty(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DnaSelect
            label="Alokasi Line / Mesin"
            value={formMachineLine}
            onChange={(val) => setFormMachineLine(val)}
            options={[
              { label: "Line Filling 01 / Mixer 500L", value: "Line Filling 01 / Mixer 500L" },
              { label: "Line Tube 02 / Mixer 1000L", value: "Line Tube 02 / Mixer 1000L" },
              { label: "Line Jar 01 / Mixer 300L", value: "Line Jar 01 / Mixer 300L" },
              { label: "Line Sachet 01 / Mixer 200L", value: "Line Sachet 01 / Mixer 200L" },
            ]}
          />
          <DnaInput
            label="PIC Supervisor"
            value={formSupervisor}
            onChange={(e) => setFormSupervisor(e.target.value)}
            required
          />
        </div>

        <DnaInput
          label="Target Tanggal Selesai"
          type="date"
          value={formTargetDate}
          onChange={(e) => setFormTargetDate(e.target.value)}
          required
        />

        <DnaTextarea
          label="Catatan & Instruksi Khusus"
          placeholder="Tambahkan catatan teknis atau penanganan khusus bila ada..."
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <DnaButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Terbitkan SPK"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
