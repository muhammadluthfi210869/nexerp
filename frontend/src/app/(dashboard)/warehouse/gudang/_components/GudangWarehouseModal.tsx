"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput, DnaSelect, DnaTextarea } from "@/components/dna";
import type { WarehouseFormData } from "../_types/gudang.types";

interface GudangWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: WarehouseFormData;
  setForm: React.Dispatch<React.SetStateAction<WarehouseFormData>>;
  onSave: () => void;
}

export function GudangWarehouseModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
}: GudangWarehouseModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Fasilitas Gudang Baru (SCR-036)"
      description="Pendaftaran master data gudang atau zona penyimpanan baru."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSave}>
            Simpan Gudang
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Kode Gudang *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: WH-06"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 tabular-nums text-zinc-800"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Tipe Fasilitas *</label>
            <DnaSelect
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-medium text-zinc-800"
              value={form.type}
              onChange={(v: string) => setForm((prev) => ({ ...prev, type: v as any }))}
            >
              <option value="RAW_MATERIAL">Bahan Baku (Raw Material)</option>
              <option value="PACKAGING">Bahan Kemas (Packaging)</option>
              <option value="FINISHED_GOODS">Produk Jadi (Finished Goods)</option>
              <option value="STAGING_WIP">Staging Produksi / WIP</option>
            </DnaSelect>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-zinc-700 uppercase">Nama Gudang *</label>
          <DnaInput
            type="text"
            placeholder="Contoh: Gudang Buffer Kemas Blok C"
            className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Provinsi *</label>
            <DnaInput
              type="text"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
              value={form.province}
              onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Kota / Kabupaten *</label>
            <DnaInput
              type="text"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-zinc-700 uppercase">Alamat Lengkap *</label>
          <DnaTextarea
            rows={2}
            placeholder="Jalan, Kawasan Industri, Nomor Kavling..."
            className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Penanggung Jawab (PIC)</label>
            <DnaInput
              type="text"
              placeholder="Nama Staff / Kepala"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
              value={form.picName}
              onChange={(e) => setForm((prev) => ({ ...prev, picName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Nomor Telepon</label>
            <DnaInput
              type="text"
              placeholder="021-..."
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
