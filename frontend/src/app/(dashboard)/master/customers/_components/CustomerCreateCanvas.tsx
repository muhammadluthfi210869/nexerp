"use client";

import React from "react";
import {
  ArrowLeft,
  Users,
  Building2,
  ShieldCheck,
  Save,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { DnaButton, DnaBadge } from "@/components/dna";
import type {
  MasterCustomerItem,
  CustomerCategoryItem,
  CustomerFormData,
} from "../_types/customer.types";

interface CustomerCreateCanvasProps {
  onBack: () => void;
  editingCustomer: MasterCustomerItem | null;
  customerForm: CustomerFormData;
  setCustomerForm: React.Dispatch<React.SetStateAction<CustomerFormData>>;
  categoriesList: CustomerCategoryItem[];
  salesStaffList?: any[];
  currentSalesPic: string;
  onSaveCustomer: () => void;
  isPending: boolean;
}

export function CustomerCreateCanvas({
  onBack,
  editingCustomer,
  customerForm,
  setCustomerForm,
  categoriesList,
  salesStaffList = [],
  currentSalesPic,
  onSaveCustomer,
  isPending,
}: CustomerCreateCanvasProps) {
  return (
    <div className="space-y-6">
      {/* TOP HEADER WITH AUTO-NUMBER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
                {editingCustomer ? `Sunting Pelanggan: ${editingCustomer.brandName}` : "Pendaftaran Pelanggan Baru"}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                {customerForm.customerCode || "CUST-AUTO"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola data entitas klien maklon kosmetik, segmentasi komersial, sales PIC, dan status legalitas brand.
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
            onClick={onSaveCustomer}
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : editingCustomer ? "Perbarui Pelanggan" : "Simpan Pelanggan"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN IN-PLACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: IDENTITAS BRAND & KONTAK */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-semibold text-zinc-900 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-900" />
              <span>1. Identitas Brand & Kontak Klien</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Kode Pelanggan (Auto)
                </label>
                <input
                  type="text"
                  value={customerForm.customerCode}
                  readOnly
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-100 font-mono font-semibold text-zinc-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Nama Brand Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.brandName}
                  onChange={(e) => setCustomerForm({ ...customerForm, brandName: e.target.value })}
                  placeholder="Contoh: GLOW RADIANCE"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Nama Pemilik / PIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.nama}
                  onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
                  placeholder="Nama Lengkap Klien"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Email Klien
                </label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="client@brand.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Sales PIC Penanggung Jawab
                </label>
                <select
                  value={customerForm.penginput || currentSalesPic}
                  onChange={(e) => setCustomerForm({ ...customerForm, penginput: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  <option value={currentSalesPic}>{currentSalesPic} (Saya)</option>
                  {salesStaffList.map((s: any) => (
                    <option key={s.id || s.name} value={s.name || s.fullName}>
                      {s.name || s.fullName} ({s.role || "Sales"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Kategori Segmentasi Pelanggan <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerForm.kategori}
                onChange={(e) => setCustomerForm({ ...customerForm, kategori: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                <option value="Calon Pelanggan">Calon Pelanggan (Baru Tanya / Intake)</option>
                <option value="Pelanggan Sample">Pelanggan Sample (Sedang Uji Formulasi R&D)</option>
                <option value="Pelanggan Produk">Pelanggan Produk (Sudah Produksi Massal)</option>
                <option value="Pelanggan RO">Pelanggan RO (Repeat Order Aktif)</option>
              </select>
            </div>
          </div>
        </div>

        {/* CARD 2: ALAMAT, LEGALITAS & KONTRAK */}
        <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-semibold text-zinc-900 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-900" />
              <span>2. Alamat, Legalitas & Ketentuan Kontrak</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Kota / Kabupaten <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.kota}
                  onChange={(e) => setCustomerForm({ ...customerForm, kota: e.target.value })}
                  placeholder="Jakarta Selatan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={customerForm.provinsi}
                  onChange={(e) => setCustomerForm({ ...customerForm, provinsi: e.target.value })}
                  placeholder="DKI Jakarta"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Alamat Lengkap Kantor / Gudang Klien
              </label>
              <textarea
                rows={2}
                value={customerForm.alamatLengkap}
                onChange={(e) => setCustomerForm({ ...customerForm, alamatLengkap: e.target.value })}
                placeholder="Jl. Gatot Subroto Kav. 12, Kel. Kuningan Barat..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            {/* Legalitas Status */}
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
              <span className="font-semibold text-zinc-900 block">Status Registrasi Legalitas</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-600 text-[11px] font-medium mb-1">Notifikasi BPOM</label>
                  <select
                    value={customerForm.legalitasBpom}
                    onChange={(e) => setCustomerForm({ ...customerForm, legalitasBpom: e.target.value as any })}
                    className="w-full px-2 py-1 text-[11px] rounded-lg border border-zinc-300 bg-white font-medium text-zinc-800"
                  >
                    <option value="Belum Diajukan">Belum Diajukan</option>
                    <option value="Proses Verifikasi">Proses Verifikasi</option>
                    <option value="Terbit">✓ Terbit Resmi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 text-[11px] font-medium mb-1">Sertifikasi Halal</label>
                  <select
                    value={customerForm.legalitasHalal}
                    onChange={(e) => setCustomerForm({ ...customerForm, legalitasHalal: e.target.value as any })}
                    className="w-full px-2 py-1 text-[11px] rounded-lg border border-zinc-300 bg-white font-medium text-zinc-800"
                  >
                    <option value="Belum">Belum</option>
                    <option value="Audit LPPOM">Audit LPPOM</option>
                    <option value="Sertifikasi Aktif">✓ Sertifikasi Aktif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 text-[11px] font-medium mb-1">Merek HKI</label>
                  <select
                    value={customerForm.legalitasHki}
                    onChange={(e) => setCustomerForm({ ...customerForm, legalitasHki: e.target.value as any })}
                    className="w-full px-2 py-1 text-[11px] rounded-lg border border-zinc-300 bg-white font-medium text-zinc-800"
                  >
                    <option value="Belum">Belum</option>
                    <option value="Pemeriksaan Substantif">Pemeriksaan</option>
                    <option value="Terdaftar Resmi">✓ Terdaftar Resmi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Skema Kontrak Maklon */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Skema Kontrak Maklon</label>
                <select
                  value={customerForm.contractType}
                  onChange={(e) => setCustomerForm({ ...customerForm, contractType: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white font-medium text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="Jasa Maklon">Jasa Maklon (Toll Manufacturing)</option>
                  <option value="Jual Putus">Jual Putus (Bulk Formula Ready)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Status Keaktifan</label>
                <select
                  value={customerForm.status}
                  onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-white font-medium text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="ACTIVE">✓ Aktif (Active)</option>
                  <option value="INACTIVE">Non-Aktif (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Live Summary Footer */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Kategori Klien:</span>
                <span className="font-semibold text-zinc-900">{customerForm.kategori}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-200 pt-2">
                <span className="font-semibold text-zinc-700">Brand Terdaftar:</span>
                <span className="font-bold text-zinc-900">{customerForm.brandName || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
