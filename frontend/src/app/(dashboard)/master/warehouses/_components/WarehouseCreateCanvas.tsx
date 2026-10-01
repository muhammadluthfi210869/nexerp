"use client";

import React from "react";
import {
  ArrowLeft,
  Warehouse,
  Thermometer,
  ShieldCheck,
  Save,
  Phone,
  User,
  MapPin,
} from "lucide-react";
import { DnaButton, DnaBadge } from "@/components/dna";
import type {
  MasterWarehouseItem,
  WarehouseFormData,
} from "../_types/warehouse.types";

interface WarehouseCreateCanvasProps {
  onBack: () => void;
  editingWarehouse: MasterWarehouseItem | null;
  warehouseForm: WarehouseFormData;
  setWarehouseForm: React.Dispatch<React.SetStateAction<WarehouseFormData>>;
  isPending: boolean;
  onSave: () => void;
}

export function WarehouseCreateCanvas({
  onBack,
  editingWarehouse,
  warehouseForm,
  setWarehouseForm,
  isPending,
  onSave,
}: WarehouseCreateCanvasProps) {
  return (
    <div className="space-y-6">
      {/* TOP HEADER WITH AUTO-NUMBER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {editingWarehouse ? `Sunting Gudang: ${editingWarehouse.namaGudang}` : "Pendaftaran Titik Simpan / Gudang Baru"}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                🏷️ {warehouseForm.kodeGudang || "GDG-AUTO"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola data master gudang fisik, ruang karantina, kontrol suhu CPKB, dan penanggung jawab (PIC).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <DnaButton variant="secondary" size="md" onClick={onBack}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
            onClick={onSave}
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : editingWarehouse ? "Perbarui Gudang" : "Simpan Gudang"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN IN-PLACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: IDENTITAS GUDANG & PIC */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-zinc-900" />
              <span>1. Identitas Titik Simpan & Penanggung Jawab</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Kode Gudang (Auto)
                </label>
                <input
                  type="text"
                  value={warehouseForm.kodeGudang}
                  readOnly
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-100 font-mono font-bold text-zinc-600 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nama Gudang / Titik Simpan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseForm.namaGudang}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, namaGudang: e.target.value })}
                  placeholder="Contoh: Gudang Bahan Baku Sidoarjo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nama PIC Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseForm.picName}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, picName: e.target.value })}
                  placeholder="Nama Kepala Gudang / Supervisor"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-medium text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nomor Telepon Gudang / HT
                </label>
                <input
                  type="text"
                  value={warehouseForm.telepon}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, telepon: e.target.value })}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Kapasitas Bin / Pallet Slot
                </label>
                <input
                  type="number"
                  value={warehouseForm.totalBinLocations}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, totalBinLocations: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Keaktifan</label>
                <select
                  value={warehouseForm.status}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ACTIVE">✓ Aktif Digunakan (Active)</option>
                  <option value="INACTIVE">Non-Aktif / Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: KONDISI SUHU CPKB & ALAMAT */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-zinc-900" />
              <span>2. Kontrol Suhu CPKB & Alamat Lokasi</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Kondisi Suhu */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Tipe Penyimpanan & Karakteristik Suhu Standar CPKB <span className="text-rose-500">*</span>
              </label>
              <select
                value={warehouseForm.tipePenyimpanan}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, tipePenyimpanan: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-semibold text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="Suhu Ruang (Ambient)">Suhu Ruang (Ambient 25°C - 30°C)</option>
                <option value="Cool Storage (15-25°C)">Cool Storage (15-25°C) — Bahan Aktif</option>
                <option value="Chiller (2-8°C)">Chiller (2-8°C) — Ekstrak & Probiotik</option>
                <option value="Flammable / Precursor">Flammable / Precursor — Bahan Berbahaya</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Wilayah / Kota <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={warehouseForm.lokasi}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, lokasi: e.target.value })}
                  placeholder="Kab. Sidoarjo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-medium text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={warehouseForm.provinsi}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, provinsi: e.target.value })}
                  placeholder="Jawa Timur"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-medium text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Alamat Lengkap Fasilitas Gudang
              </label>
              <textarea
                rows={2}
                value={warehouseForm.alamatLengkap}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, alamatLengkap: e.target.value })}
                placeholder="Contoh: Jl. Rungkut Industri Raya No. 12, Sidoarjo..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            {/* Live Summary Footer */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Kapasitas Slot Bin:</span>
                <span className="font-bold text-zinc-900">{warehouseForm.totalBinLocations} Bins</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-200 pt-2">
                <span className="font-bold text-zinc-800">Spesifikasi Suhu:</span>
                <span className="font-bold text-zinc-900">{warehouseForm.tipePenyimpanan}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
