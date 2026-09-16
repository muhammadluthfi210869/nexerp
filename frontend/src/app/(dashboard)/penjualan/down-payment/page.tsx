"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Eye,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  FileCheck2,
  ArrowUpRight,
  Search,
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaCell,
  DnaModal,
  DnaButton,
  DnaInput,
  useDnaToast,
} from "@/components/dna";

type DpCategory = "sample" | "legalitas" | "produksi";

interface DpRecord {
  id: string;
  code: string;
  category: DpCategory;
  date: string;
  customerName: string;
  brandName: string;
  refNumber: string; // SMP-xxx or REG-BPOM-xxx or SO-xxx
  bankAccount: string;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  status: "FULL" | "PARTIAL" | "UNUSED";
  notes?: string;
}

const INITIAL_DP_DATA: DpRecord[] = [
  // Sample Tab
  {
    id: "dp-smp-01",
    code: "DP-SMP-2026-001",
    category: "sample",
    date: "2026-03-05",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "C-Jelita Herbal",
    refNumber: "SMP-2026-081",
    bankAccount: "BCA Maklon (264-035-1589)",
    amount: 1500000,
    usedAmount: 0,
    remainingAmount: 1500000,
    status: "UNUSED",
    notes: "DP 3 varian formulasi serum brightening Somethinc benchmark.",
  },
  {
    id: "dp-smp-02",
    code: "DP-SMP-2026-002",
    category: "sample",
    date: "2026-03-02",
    customerName: "CV Aura Natural Skincare",
    brandName: "AuraGlow Botanical",
    refNumber: "SMP-2026-080",
    bankAccount: "Mandiri Corp (137-00-9821-44)",
    amount: 750000,
    usedAmount: 750000,
    remainingAmount: 0,
    status: "FULL",
    notes: "Biaya komitmen sample telah di-offset penuh ke PO SO-2026-003.",
  },
  {
    id: "dp-smp-03",
    code: "DP-SMP-2026-003",
    category: "sample",
    date: "2026-02-27",
    customerName: "PT Derma Estetika Utama",
    brandName: "DermaGleam Pro",
    refNumber: "SMP-2026-079",
    bankAccount: "BCA Maklon (264-035-1589)",
    amount: 1000000,
    usedAmount: 500000,
    remainingAmount: 500000,
    status: "PARTIAL",
    notes: "Baru di-offset 50% untuk batch sunscreen perdana.",
  },

  // Legalitas Tab
  {
    id: "dp-leg-01",
    code: "DP-LEG-2026-001",
    category: "legalitas",
    date: "2026-03-04",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "C-Jelita Herbal",
    refNumber: "REG-BPOM-2026-012",
    bankAccount: "BCA Maklon (264-035-1589)",
    amount: 8500000,
    usedAmount: 8500000,
    remainingAmount: 0,
    status: "FULL",
    notes: "Uang muka pengurusan 2 Notifikasi BPOM & Pendaftaran Merk HAKI.",
  },
  {
    id: "dp-leg-02",
    code: "DP-LEG-2026-002",
    category: "legalitas",
    date: "2026-03-01",
    customerName: "UD Berkah Ayu Sejahtera",
    brandName: "AyuAura",
    refNumber: "REG-BPOM-2026-009",
    bankAccount: "Mandiri Corp (137-00-9821-44)",
    amount: 4250000,
    usedAmount: 0,
    remainingAmount: 4250000,
    status: "UNUSED",
    notes: "Menunggu kelengkapan dokumen surat kuasa direktur.",
  },

  // Produksi Tab
  {
    id: "dp-prd-01",
    code: "DP-PRD-2026-001",
    category: "produksi",
    date: "2026-03-06",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "C-Jelita Herbal",
    refNumber: "SO-2026-001",
    bankAccount: "BCA Maklon (264-035-1589)",
    amount: 65000000,
    usedAmount: 0,
    remainingAmount: 65000000,
    status: "UNUSED",
    notes: "DP 50% Produksi 10.000 pcs Brightening Niacinamide Serum.",
  },
  {
    id: "dp-prd-02",
    code: "DP-PRD-2026-002",
    category: "produksi",
    date: "2026-03-03",
    customerName: "CV Aura Natural Skincare",
    brandName: "AuraGlow Botanical",
    refNumber: "SO-2026-003",
    bankAccount: "BCA Maklon (264-035-1589)",
    amount: 32000000,
    usedAmount: 32000000,
    remainingAmount: 0,
    status: "FULL",
    notes: "Telah dialokasikan pemotong Tagihan Faktur FP-2026-008.",
  },
  {
    id: "dp-prd-03",
    code: "DP-PRD-2026-003",
    category: "produksi",
    date: "2026-02-25",
    customerName: "PT Derma Estetika Utama",
    brandName: "DermaGleam Pro",
    refNumber: "SO-2026-004",
    bankAccount: "Mandiri Corp (137-00-9821-44)",
    amount: 45000000,
    usedAmount: 20000000,
    remainingAmount: 25000000,
    status: "PARTIAL",
    notes: "Alokasi termin 1 pengiriman partial kemasan primer.",
  },
];

const statusBadgeConfig: Record<string, { status: "success" | "warning" | "info"; label: string }> = {
  FULL: { status: "success", label: "Terpakai Penuh" },
  PARTIAL: { status: "warning", label: "Terpakai Sebagian" },
  UNUSED: { status: "info", label: "Belum Terpakai" },
};

function DownPaymentContent() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("sample");
  const [records, setRecords] = useState<DpRecord[]>(INITIAL_DP_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<DpRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [formCategory, setFormCategory] = useState<DpCategory>("sample");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formBank, setFormBank] = useState("BCA Maklon (264-035-1589)");
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filteredRecords = records.filter((r) => {
    const matchesTab = r.category === activeTab;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.code.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.brandName.toLowerCase().includes(q) ||
      r.refNumber.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Calculate KPIs for current tab or globally
  const currentTabRecords = records.filter((r) => r.category === activeTab);
  const totalAmount = currentTabRecords.reduce((acc, r) => acc + r.amount, 0);
  const totalUsed = currentTabRecords.reduce((acc, r) => acc + r.usedAmount, 0);
  const totalRemaining = currentTabRecords.reduce((acc, r) => acc + r.remainingAmount, 0);
  const conversionRate = totalAmount > 0 ? Math.round((totalUsed / totalAmount) * 100) : 0;

  const sampleCount = records.filter((r) => r.category === "sample").length;
  const legalitasCount = records.filter((r) => r.category === "legalitas").length;
  const produksiCount = records.filter((r) => r.category === "produksi").length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || !formAmount || Number(formAmount) <= 0) {
      toast.error("Validasi Gagal", "Harap isi nama klien dan jumlah nominal DP dengan benar.");
      return;
    }

    const newCode = `DP-${formCategory.slice(0, 3).toUpperCase()}-2026-00${records.length + 1}`;
    const newRecord: DpRecord = {
      id: `dp-${Date.now()}`,
      code: newCode,
      category: formCategory,
      date: new Date().toISOString().split("T")[0],
      customerName: formCustomer,
      brandName: formBrand || "Private Label",
      refNumber: formRef || (formCategory === "sample" ? "SMP-NEW" : formCategory === "legalitas" ? "REG-BPOM-NEW" : "SO-NEW"),
      bankAccount: formBank,
      amount: Number(formAmount),
      usedAmount: 0,
      remainingAmount: Number(formAmount),
      status: "UNUSED",
      notes: formNotes,
    };

    setRecords([newRecord, ...records]);
    toast.success("Uang Muka Diterima", `Penerimaan DP ${newCode} sebesar Rp ${Number(formAmount).toLocaleString("id-ID")} tercatat.`);
    setIsCreateOpen(false);

    // Reset Form
    setFormCustomer("");
    setFormBrand("");
    setFormRef("");
    setFormAmount("");
    setFormNotes("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header with 3 Tabs per Requirement Poin 14 */}
      <DnaPageHeader
        title="UANG MUKA PENJUALAN (DOWN PAYMENT)"
        description="Pusat administrasi saldo uang muka maklon kosmetik. Terintegrasi 3 alur tahap komersial: Sample Formulasi R&D, Pengurusan Legalitas BPOM/HAKI, dan Uang Muka Kontrak PO Produksi Massal."
        tabs={[
          { key: "sample", label: "1. DP Sample R&D", count: sampleCount },
          { key: "legalitas", label: "2. DP Legalitas (BPOM / HAKI)", count: legalitasCount },
          { key: "produksi", label: "3. DP PO Produksi Massal", count: produksiCount },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DpCategory)}
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setFormCategory(activeTab as DpCategory);
              setIsCreateOpen(true);
            }}
          >
            Terima Uang Muka Baru
          </DnaButton>
        }
      />

      {/* KPI Summary Cards */}
      <DnaKpiGrid
        items={[
          {
            label: `Total DP ${activeTab.toUpperCase()}`,
            value: `Rp ${(totalAmount / 1000000).toFixed(1)} Jt`,
            subtitle: `${currentTabRecords.length} transaksi penerimaan`,
            trend: "+18% bln ini",
            icon: DollarSign,
            variant: "blue",
          },
          {
            label: "Sisa Saldo Unused",
            value: `Rp ${(totalRemaining / 1000000).toFixed(1)} Jt`,
            subtitle: "Dapat dialokasikan ke tagihan",
            trend: "Siap kompensasi",
            icon: Wallet,
            variant: "amber",
          },
          {
            label: "DP Terpakai / Terpotong",
            value: `Rp ${(totalUsed / 1000000).toFixed(1)} Jt`,
            subtitle: "Telah di-offset ke faktur",
            trend: "Terealisasi",
            icon: CheckCircle2,
            variant: "emerald",
          },
          {
            label: "Rasio Realisasi Tagihan",
            value: `${conversionRate}%`,
            subtitle: "Tingkat pemotongan ke invoice",
            trend: "Komitmen tinggi",
            icon: TrendingUp,
            variant: "purple",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        title={`Daftar Uang Muka: ${
          activeTab === "sample"
            ? "Biaya Riset & Formulasi Sample"
            : activeTab === "legalitas"
            ? "Pendaftaran BPOM & Notifikasi Kosmetik"
            : "Komitmen Produksi Massal (PO Maklon)"
        }`}
        count={filteredRecords.length}
        totalItems={currentTabRecords.length}
        actions={
          <div className="w-72">
            <DnaInput
              placeholder="Cari kode, klien, brand, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">DP No</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-center">Kategori</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3">Applied To</th>
                <th className="py-3 px-3 text-right">Remaining Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada data uang muka pada kategori ini</p>
                    <p className="text-xs text-slate-400">Pilih tab lain atau klik tombol Terima Uang Muka Baru.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((dp) => (
                  <tr key={dp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-semibold text-blue-600 text-xs whitespace-nowrap">
                      {dp.code}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900 text-xs whitespace-nowrap">
                      {dp.customerName}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                        {dp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                      {dp.date}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                      Rp {dp.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {dp.refNumber || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 text-xs whitespace-nowrap">
                      Rp {dp.remainingAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <DnaCell.Badge
                        status={statusBadgeConfig[dp.status]?.status || "default"}
                        label={statusBadgeConfig[dp.status]?.label || dp.status}
                      />
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(dp)}
                        >
                          Lihat
                        </DnaButton>
                        <button
                          type="button"
                          onClick={() => {
                            toast.info(
                              "Alokasi DP",
                              `Alokasikan saldo ${dp.code} sebesar Rp ${dp.remainingAmount.toLocaleString("id-ID")} ke Faktur Penjualan.`
                            );
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                          title="Alokasikan ke Faktur"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Rekam DP */}
      <DnaModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Rincian Uang Muka Penjualan"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-5 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nomor Bukti DP
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedRecord.code}</h3>
                <p className="text-xs text-slate-500">Tanggal Terima: {selectedRecord.date}</p>
              </div>
              <DnaCell.Badge
                status={statusBadgeConfig[selectedRecord.status]?.status || "default"}
                label={statusBadgeConfig[selectedRecord.status]?.label || selectedRecord.status}
              />
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Kategori Alur</span>
                  <span className="font-semibold text-slate-800 uppercase text-xs">
                    {selectedRecord.category === "sample"
                      ? "Sample R&D"
                      : selectedRecord.category === "legalitas"
                      ? "Legalitas BPOM"
                      : "Produksi Massal"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Nomor Referensi</span>
                  <span className="font-mono font-semibold text-blue-600 text-xs">
                    {selectedRecord.refNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Klien Maklon</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedRecord.customerName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Brand Kosmetik</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedRecord.brandName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400 block">Kas / Bank Penerima</span>
                  <span className="font-semibold text-slate-800 text-xs">{selectedRecord.bankAccount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rekapitulasi Saldo</h4>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Total DP Diterima:</span>
                <span className="font-bold text-slate-900">
                  Rp {selectedRecord.amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Telah Dialokasikan / Terpotong:</span>
                <span className="font-bold text-slate-600">
                  Rp {selectedRecord.usedAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-800 font-bold">Sisa Saldo Unused:</span>
                <span className="font-bold text-emerald-600 text-base">
                  Rp {selectedRecord.remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {selectedRecord.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="font-bold block mb-1 text-slate-500">Catatan Transaksi:</span>
                {selectedRecord.notes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
              {selectedRecord.remainingAmount > 0 && (
                <DnaButton
                  variant="primary"
                  onClick={() => {
                    toast.success("Alokasi Berhasil", `Saldo DP ${selectedRecord.code} diproses.`);
                    setSelectedRecord(null);
                  }}
                >
                  Alokasikan ke Invoice
                </DnaButton>
              )}
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Terima Uang Muka Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Penerimaan Uang Muka (Down Payment)"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Kategori Uang Muka *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "sample", label: "Sample R&D" },
                { id: "legalitas", label: "Legalitas BPOM" },
                { id: "produksi", label: "Produksi (PO)" },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFormCategory(cat.id as DpCategory)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    formCategory === cat.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Klien Pemesan *</label>
            <DnaInput
              placeholder="Contoh: PT Cantika Jelita Nusantara"
              value={formCustomer}
              onChange={(e) => setFormCustomer(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Brand</label>
              <DnaInput
                placeholder="Contoh: C-Jelita Herbal"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nomor Referensi (SO/SMP/BPOM)</label>
              <DnaInput
                placeholder="Contoh: SO-2026-001"
                value={formRef}
                onChange={(e) => setFormRef(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah DP (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="Contoh: 10000000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Kas / Bank Penerima</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formBank}
                onChange={(e) => setFormBank(e.target.value)}
              >
                <option value="BCA Maklon (264-035-1589)">BCA Maklon (264-035-1589)</option>
                <option value="Mandiri Corp (137-00-9821-44)">Mandiri Corp (137-00-9821-44)</option>
                <option value="Kas Utama Kantor">Kas Utama Kantor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Penerimaan</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: DP 50% produksi batch 1 serum brightening."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Uang Muka
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}

export default function DownPaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Uang Muka Penjualan...</div>}>
      <DownPaymentContent />
    </Suspense>
  );
}
