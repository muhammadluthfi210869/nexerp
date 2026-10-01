"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import type { GuestBookFormData } from "../_types/guest-book.types";

interface GuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: GuestBookFormData;
  setFormData: React.Dispatch<React.SetStateAction<GuestBookFormData>>;
  onSave: () => void;
  saving: boolean;
}

export function GuestFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  saving,
}: GuestFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Tamu / Klien Kunjungan Baru"
      subtitle="Pencatatan data profil calon mitra maklon, minat formulasi produk, dan PIC host BusDev"
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Buku Tamu"}
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap Tamu *</label>
          <DnaInput
            placeholder="e.g. Ibu Amanda Putri"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nomor WhatsApp *</label>
            <DnaInput
              placeholder="0812-xxxx-xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Asal Kota *</label>
            <DnaInput
              placeholder="Jakarta Selatan"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Perusahaan / Brand *</label>
            <DnaInput
              placeholder="Glow & Shine Skincare"
              value={formData.instansi}
              onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kategori Klien</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="BRANDED">BRANDED</option>
              <option value="KLINIK">KLINIK</option>
              <option value="PEMULA">PEMULA</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Minat Produk</label>
            <DnaInput
              placeholder="Serum Retinol 30ml"
              value={formData.productInterest}
              onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Estimasi MOQ (Pcs)</label>
            <DnaInput
              type="number"
              value={formData.moqPlan}
              onChange={(e) => setFormData({ ...formData, moqPlan: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Market</label>
            <DnaInput
              placeholder="Wanita Dewasa Karir"
              value={formData.targetMarket}
              onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">PIC Host (BusDev)</label>
            <select
              value={formData.busDev}
              onChange={(e) => setFormData({ ...formData, busDev: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Irma Safarina">Irma Safarina</option>
              <option value="Fadilah Syahab">Fadilah Syahab</option>
              <option value="Keviana">Keviana</option>
              <option value="Vira">Vira</option>
              <option value="Desy">Desy</option>
            </select>
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
