"use client";

import React from "react";
import {
  ArrowLeft,
  Truck,
  Building2,
  CreditCard,
  Percent,
  CheckCircle2,
  Phone,
  Mail,
  User,
  MapPin,
  Save,
} from "lucide-react";
import { DnaButton, DnaBadge } from "@/components/dna";
import type {
  MasterSupplierItem,
  SupplierFormData,
} from "../_types/supplier.types";

interface SupplierCreateCanvasProps {
  onBack: () => void;
  editingSupplier: MasterSupplierItem | null;
  supplierForm: SupplierFormData;
  setSupplierForm: React.Dispatch<React.SetStateAction<SupplierFormData>>;
  isPending: boolean;
  onSave: () => void;
}

export function SupplierCreateCanvas({
  onBack,
  editingSupplier,
  supplierForm,
  setSupplierForm,
  isPending,
  onSave,
}: SupplierCreateCanvasProps) {
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
                {editingSupplier ? `Sunting Vendor: ${editingSupplier.nama}` : "Pendaftaran Supplier / Vendor Baru"}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                🏷️ {supplierForm.vendorCode || "VND-AUTO"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola master vendor bahan baku, kemasan kosmetik, perbankan, dan kesepakatan TOP (Term of Payment).
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
            {isPending ? "Menyimpan..." : editingSupplier ? "Perbarui Vendor" : "Simpan Vendor"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN IN-PLACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: IDENTITAS PERUSAHAAN & PIC */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-900" />
              <span>1. Identitas Badan Usaha &amp; PIC Penjualan</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Kode Vendor (Auto)
                </label>
                <input
                  type="text"
                  value={supplierForm.vendorCode}
                  readOnly
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-100 font-mono font-bold text-zinc-600 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nama Perusahaan Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierForm.nama}
                  onChange={(e) => setSupplierForm({ ...supplierForm, nama: e.target.value })}
                  placeholder="Contoh: PT Chemika Prima Nusa"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nama PIC Penjualan / Sales <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierForm.pic}
                  onChange={(e) => setSupplierForm({ ...supplierForm, pic: e.target.value })}
                  placeholder="Nama Account Executive / Sales"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-medium text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nomor HP / WhatsApp PIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email Resmi Vendor
                </label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  placeholder="sales@vendor.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Kategori Pengadaan Vendor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierForm.kategoriBahan}
                  onChange={(e) => setSupplierForm({ ...supplierForm, kategoriBahan: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Bahan Baku">Bahan Baku (Raw Materials)</option>
                  <option value="Kemasan Primer">Kemasan Primer (Bottles/Jars/Tubes)</option>
                  <option value="Kemasan Sekunder">Kemasan Sekunder (Box/Karton)</option>
                  <option value="Jasa Maklon">Jasa &amp; Maklon Eksternal</option>
                  <option value="Peralatan & Sanitasi">Peralatan &amp; Sanitasi CPKB</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Syarat Pembayaran (TOP) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierForm.paymentTerm}
                  onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerm: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Net 14">Tempo 14 Hari (Net 14)</option>
                  <option value="Net 30">Tempo 30 Hari (Net 30)</option>
                  <option value="Net 45">Tempo 45 Hari (Net 45)</option>
                  <option value="Net 60">Tempo 60 Hari (Net 60)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Keaktifan</label>
                <select
                  value={supplierForm.status}
                  onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ACTIVE">✓ Aktif (Active)</option>
                  <option value="INACTIVE">Non-Aktif (Inactive)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: REKENING BANK, PAJAK & ALAMAT */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-900" />
              <span>2. Rekening Bank, Perpajakan &amp; Alamat</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Rekening Bank */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Informasi Rekening Pembayaran Supplier
              </label>
              <input
                type="text"
                value={supplierForm.bankAccount}
                onChange={(e) => setSupplierForm({ ...supplierForm, bankAccount: e.target.value })}
                placeholder="Contoh: BCA 123-456-7890 a/n PT Sumber Kimia"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-mono text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nomor Pokok Wajib Pajak (NPWP)
                </label>
                <input
                  type="text"
                  value={supplierForm.npwp}
                  onChange={(e) => setSupplierForm({ ...supplierForm, npwp: e.target.value })}
                  placeholder="01.234.567.8-901.000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-mono text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Kota / Kabupaten <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supplierForm.kota}
                  onChange={(e) => setSupplierForm({ ...supplierForm, kota: e.target.value })}
                  placeholder="Surabaya"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Alamat Lengkap Kantor / Gudang Vendor
              </label>
              <textarea
                rows={2}
                value={supplierForm.alamatLengkap}
                onChange={(e) => setSupplierForm({ ...supplierForm, alamatLengkap: e.target.value })}
                placeholder="Jl. Industri Rungkut No. 88, Surabaya..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            {/* Live Summary Footer */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Kategori Vendor:</span>
                <span className="font-bold text-zinc-900">{supplierForm.kategoriBahan}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-200 pt-2">
                <span className="font-bold text-zinc-800">Term of Payment (TOP):</span>
                <span className="font-bold text-emerald-700">
                  {supplierForm.paymentTerm}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
