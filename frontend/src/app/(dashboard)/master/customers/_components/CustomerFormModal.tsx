"use client";

import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaCurrencyInput,
  DnaButton,
} from "@/components/dna";
import type {
  MasterCustomerItem,
  CustomerCategoryItem,
  CustomerFormData,
} from "../_types/customer.types";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: MasterCustomerItem | null;
  customerForm: CustomerFormData;
  setCustomerForm: React.Dispatch<React.SetStateAction<CustomerFormData>>;
  categoriesList: CustomerCategoryItem[];
  salesStaffList?: any[];
  currentSalesPic: string;
  onSaveCustomer: () => void;
  isPending: boolean;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  editingCustomer,
  customerForm,
  setCustomerForm,
  categoriesList,
  salesStaffList,
  currentSalesPic,
  onSaveCustomer,
  isPending,
}: CustomerFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCustomer ? `Sunting Pelanggan: ${editingCustomer.brandName}` : "Tambah Pelanggan Baru"}
      description="Lengkapi data brand, PIC kontak, segmentasi komersial, dan status legalitas"
      size="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Kode Pelanggan (Auto)</label>
            <DnaInput
              value={customerForm.customerCode || "AUTO"}
              readOnly
              className="bg-zinc-100 text-zinc-600 font-mono cursor-not-allowed"
              placeholder="CUST-AUTO"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Nama Brand Produk *</label>
            <DnaInput
              value={customerForm.brandName}
              onChange={(e) => setCustomerForm({ ...customerForm, brandName: e.target.value })}
              placeholder="e.g. GLOW SKINCARE"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DnaInput
            label="Nama Pemilik / PIC *"
            value={customerForm.nama}
            onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
            placeholder="Nama Klien"
          />
          <DnaInput
            label="Nomor Telepon / WhatsApp *"
            value={customerForm.phone}
            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
            placeholder="08123456789"
          />
          <DnaInput
            label="Email Resmi"
            value={customerForm.email}
            onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
            placeholder="brand@domain.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DnaInput
            type="date"
            label="Tanggal Lahir Founder"
            value={customerForm.birthDate}
            onChange={(e) => setCustomerForm({ ...customerForm, birthDate: e.target.value })}
          />

          <DnaSelect
            label="Kategori Pelanggan *"
            value={customerForm.categoryId || customerForm.kategori}
            onChange={(val) => {
              const found = categoriesList.find((c) => c.id === val || c.name === val);
              setCustomerForm({
                ...customerForm,
                categoryId: found ? found.id : val,
                kategori: found ? (found.name || found.kategori || "") : val,
              });
            }}
            options={categoriesList.map((c) => ({ value: c.id, label: c.name || c.kategori || "Kategori" }))}
          />

          <DnaSelect
            label="Sales PIC / Penginput *"
            value={customerForm.salesAssignee || customerForm.penginput}
            onChange={(val) => {
              const found = salesStaffList?.find((s: any) => s.id === val || s.name === val);
              setCustomerForm({
                ...customerForm,
                salesAssignee: found ? found.id : val,
                penginput: found ? found.name : val,
              });
            }}
            options={
              salesStaffList?.map((s: any) => ({ value: s.id, label: s.name })) || [
                { value: currentSalesPic, label: currentSalesPic },
              ]
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaInput
            label="Kota / Wilayah *"
            value={customerForm.kota}
            onChange={(e) => setCustomerForm({ ...customerForm, kota: e.target.value })}
            placeholder="Kota Surabaya"
          />
          <DnaInput
            label="Provinsi"
            value={customerForm.provinsi}
            onChange={(e) => setCustomerForm({ ...customerForm, provinsi: e.target.value })}
            placeholder="Jawa Timur"
          />
        </div>

        <DnaTextarea
          label="Alamat Lengkap Pengiriman Dokumen & Barang"
          value={customerForm.alamatLengkap}
          onChange={(e) => setCustomerForm({ ...customerForm, alamatLengkap: e.target.value })}
          placeholder="Jalan, nomor rumah/kantor, kecamatan, kode pos..."
        />

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
            Status 3 Pilar Komersial (Sample, Produksi, Legalitas & Escrow):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DnaCurrencyInput
              label="Saldo Escrow Deposit (Rp)"
              value={customerForm.escrowDeposit}
              onChange={(val) => setCustomerForm({ ...customerForm, escrowDeposit: val })}
            />
            <DnaSelect
              label="Status Paten HKI Merk"
              value={customerForm.legalitasHki}
              onChange={(val) =>
                setCustomerForm({ ...customerForm, legalitasHki: val as MasterCustomerItem["legalitasHki"] })
              }
              options={[
                { value: "Belum", label: "Belum" },
                { value: "Pemeriksaan Substantif", label: "Pemeriksaan Substantif" },
                { value: "Terdaftar Resmi", label: "Terdaftar Resmi" },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DnaSelect
              label="Status BPOM"
              value={customerForm.legalitasBpom}
              onChange={(val) =>
                setCustomerForm({ ...customerForm, legalitasBpom: val as MasterCustomerItem["legalitasBpom"] })
              }
              options={[
                { value: "Belum Diajukan", label: "Belum Diajukan" },
                { value: "Proses Verifikasi", label: "Proses Verifikasi" },
                { value: "Terbit", label: "Terbit" },
              ]}
            />
            <DnaSelect
              label="Status Halal"
              value={customerForm.legalitasHalal}
              onChange={(val) =>
                setCustomerForm({ ...customerForm, legalitasHalal: val as MasterCustomerItem["legalitasHalal"] })
              }
              options={[
                { value: "Belum", label: "Belum" },
                { value: "Audit LPPOM", label: "Audit LPPOM" },
                { value: "Sertifikasi Aktif", label: "Sertifikasi Aktif" },
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSaveCustomer}
            loading={isPending}
          >
            Simpan Data Pelanggan
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
