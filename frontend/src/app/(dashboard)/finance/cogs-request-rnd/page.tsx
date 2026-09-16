"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  X,
  Package,
  Layers
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast
} from "@/components/dna";
import { Input } from "@/components/ui/input";

interface CogsRequest {
  id: string;
  requestCode: string;
  requestDate: string;
  customerName: string;
  productName: string;
  formulaCode: string;
  moqQty: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  statusLabel: string;
  // Detail Costing
  formulaCost: number;
  primaryPackCost: number;
  secondaryPackCost: number;
  laborCost: number;
  overheadCost: number;
  totalHppPerPcs: number;
  recommendedPrice: number;
  notes?: string;
}

const INITIAL_COGS: CogsRequest[] = [
  {
    id: "cogs-01",
    requestCode: "HPP-2026-0001",
    requestDate: "2026-03-08",
    customerName: "PT Cantika Glow Nusantara",
    productName: "Brightening Glow Serum 10% Niacinamide 30ml",
    formulaCode: "FORM-2026-0001 (Rev 2.0)",
    moqQty: 5000,
    status: "APPROVED",
    statusLabel: "Disetujui Management",
    formulaCost: 4350,
    primaryPackCost: 4200,
    secondaryPackCost: 1650,
    laborCost: 850,
    overheadCost: 650,
    totalHppPerPcs: 12050,
    recommendedPrice: 24500,
    notes: "MOQ 5.000 pcs disetujui untuk kontrak maklon kosmetik."
  },
  {
    id: "cogs-02",
    requestCode: "HPP-2026-0002",
    requestDate: "2026-03-07",
    customerName: "PT Miracle Beauty Lab",
    productName: "Ceramide 5X Barrier Repair Moisturizer 50g",
    formulaCode: "FORM-2026-0002 (Rev 1.1)",
    moqQty: 3000,
    status: "APPROVED",
    statusLabel: "Disetujui Management",
    formulaCost: 9250,
    primaryPackCost: 6500,
    secondaryPackCost: 2100,
    laborCost: 950,
    overheadCost: 850,
    totalHppPerPcs: 20300,
    recommendedPrice: 38000,
    notes: "Biaya kemasan jar akrilik impor disesuaikan kurs USD 16.200."
  },
  {
    id: "cogs-03",
    requestCode: "HPP-2026-0003",
    requestDate: "2026-03-05",
    customerName: "PT Cantika Herbal Nusantara",
    productName: "Soothing Acne Gel Cica + Tea Tree 30gr",
    formulaCode: "FORM-2026-0003 (Rev 1.0)",
    moqQty: 5000,
    status: "PENDING",
    statusLabel: "Menunggu Approval",
    formulaCost: 2850,
    primaryPackCost: 3200,
    secondaryPackCost: 1400,
    laborCost: 750,
    overheadCost: 550,
    totalHppPerPcs: 9000,
    recommendedPrice: 18500,
    notes: "Perhitungan HPP awal menunggu rilis harga final kemasan tube lokal."
  },
  {
    id: "cogs-04",
    requestCode: "HPP-2026-0004",
    requestDate: "2026-03-01",
    customerName: "CV Royal Beauty Luxe",
    productName: "Hydrating Lip Oil Peptide Tint 5ml",
    formulaCode: "FORM-2026-0004 (Rev 1.0)",
    moqQty: 10000,
    status: "APPROVED",
    statusLabel: "Disetujui Management",
    formulaCost: 1200,
    primaryPackCost: 5500,
    secondaryPackCost: 1800,
    laborCost: 650,
    overheadCost: 450,
    totalHppPerPcs: 9950,
    recommendedPrice: 22000,
    notes: "MOQ 10.000 pcs disetujui untuk peluncuran seasonal Q3."
  }
];

function CogsRequestContent() {
  const searchParams = useSearchParams();
  const [cogsList, setCogsList] = useState<CogsRequest[]>(INITIAL_COGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCogs, setSelectedCogs] = useState<CogsRequest | null>(null);
  const toast = useDnaToast();

  // Create Form State (1:1 G-SERP Row 140)
  const [formData, setFormData] = useState({
    pelanggan: "PT Sinar Indah Kosmetika",
    salesSample: "SMP-2026-0015",
    formula: "FORM-2026-0005",
    tanggal: new Date().toISOString().slice(0, 10),
    kemasanPrimer: "Botol Dropper 30ml Frosted",
    kemasanPrimer2: "-",
    kemasanSekunder: "Inner Box Printing Foil Emas",
    netto: "30 ml",
    jumlahMoq: 5000
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const filteredCogs = useMemo(() => {
    return cogsList.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.requestCode.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.productName.toLowerCase().includes(q) ||
        c.formulaCode.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cogsList, searchQuery, statusFilter]);

  const totalRequests = cogsList.length;
  const approvedCount = cogsList.filter((c) => c.status === "APPROVED").length;
  const pendingCount = cogsList.filter((c) => c.status === "PENDING").length;

  const handleSaveCogs = (e: React.FormEvent) => {
    e.preventDefault();
    const newCogs: CogsRequest = {
      id: `cogs-${Date.now()}`,
      requestCode: `HPP-2026-${String(cogsList.length + 1).padStart(4, "0")}`,
      requestDate: formData.tanggal,
      customerName: formData.pelanggan,
      productName: "Sunscreen Glow Gel Hybrid SPF 50 30ml",
      formulaCode: formData.formula,
      moqQty: Number(formData.jumlahMoq) || 5000,
      status: "PENDING",
      statusLabel: "Menunggu Approval",
      formulaCost: 5250,
      primaryPackCost: 3800,
      secondaryPackCost: 1500,
      laborCost: 850,
      overheadCost: 650,
      totalHppPerPcs: 12450,
      recommendedPrice: 25000,
      notes: "Kalkulasi HPP awal berdasarkan simulasi kemasan primer & sekunder."
    };

    setCogsList([newCogs, ...cogsList]);
    setIsCreateModalOpen(false);
    toast.success("Permintaan HPP Dibuat", "Dokumen pengajuan HPP berhasil diteruskan ke Finance & Management.");
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Permintaan HPP (Cost of Goods Sold)"
        description="Pengajuan perhitungan HPP maklon berbasis formula lab, spesifikasi kemasan primer/sekunder, dan MOQ (1:1 G-SERP Parity)."
        breadcrumbs={[
          { label: "Operasional", href: "/dashboard-rnd" },
          { label: "Pra Produksi", href: "/request-cogs" },
          { label: "Permintaan HPP", href: "/request-cogs" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Excel", "Data rekapitulasi HPP berhasil diekspor.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Permintaan HPP
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="TOTAL PENGAJUAN HPP"
          value={`${totalRequests} Pengajuan`}
          subValue="Simulasi Biaya Maklon"
          icon={<Calculator className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="HPP DISETUJUI (APPROVED)"
          value={`${approvedCount} Disetujui`}
          subValue="Siap Rilis Penawaran (Quotation)"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="MENUNGGU APPROVAL MANAGEMENT"
          value={`${pendingCount} Pending`}
          subValue="Review Margin & Biaya Kemasan"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable (1:1 G-SERP Row 139 — EXACT 9 COLUMNS) */}
      <DnaDataTableCard
        title="Daftar Permintaan HPP Produk"
        description="Pelacakan estimasi biaya pokok produksi berdasarkan formula, jumlah MOQ, dan persetujuan komersial."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode HPP, pelanggan, produk, formula..."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="APPROVED">Disetujui Management</option>
              <option value="PENDING">Menunggu Approval</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3 text-center w-10">#</th>
                <th className="py-3 px-3 w-28">Kode</th>
                <th className="py-3 px-3 w-24">Tanggal</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Produk</th>
                <th className="py-3 px-3 w-40">Formula</th>
                <th className="py-3 px-3 text-right w-28">Jumlah MOQ</th>
                <th className="py-3 px-3 text-center w-36">Status</th>
                <th className="py-3 px-3 text-center w-16">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data permintaan HPP ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCogs.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{row.requestCode}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{row.requestDate}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.customerName}</td>
                    <td className="py-3 px-3 text-slate-800">{row.productName}</td>
                    <td className="py-3 px-3 font-mono text-indigo-600 font-bold">{row.formulaCode}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {row.moqQty.toLocaleString("id-ID")} pcs
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedCogs(row)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Lihat Rincian HPP per Unit"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 4. Modal Buat Permintaan HPP (1:1 G-SERP Row 140 / ?action=create) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Buat Permintaan HPP Baru</h3>
                <p className="text-xs text-slate-500">Kalkulasi biaya pokok penjualan maklon (G-SERP Row 140)</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCogs} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.pelanggan}
                    onChange={(e) => setFormData({ ...formData, pelanggan: e.target.value })}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Tanggal Request <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Sales Sample Ref</label>
                  <Input
                    value={formData.salesSample}
                    onChange={(e) => setFormData({ ...formData, salesSample: e.target.value })}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Formula Code</label>
                  <Input
                    value={formData.formula}
                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kemasan Primer</label>
                  <Input
                    value={formData.kemasanPrimer}
                    onChange={(e) => setFormData({ ...formData, kemasanPrimer: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kemasan Primer 2</label>
                  <Input
                    value={formData.kemasanPrimer2}
                    onChange={(e) => setFormData({ ...formData, kemasanPrimer2: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Kemasan Sekunder</label>
                  <Input
                    value={formData.kemasanSekunder}
                    onChange={(e) => setFormData({ ...formData, kemasanSekunder: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Netto Produk <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.netto}
                    onChange={(e) => setFormData({ ...formData, netto: e.target.value })}
                    className="h-8 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Jumlah Target MOQ (Pcs) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    required
                    value={formData.jumlahMoq}
                    onChange={(e) => setFormData({ ...formData, jumlahMoq: parseInt(e.target.value) || 0 })}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <DnaButton type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Kembali
                </DnaButton>
                <DnaButton type="submit" variant="primary">
                  Simpan Permintaan HPP
                </DnaButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Detail HPP Roll-up */}
      {selectedCogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Rincian Komposisi HPP per Unit</h3>
                <p className="text-xs font-mono text-blue-600">{selectedCogs.requestCode} • {selectedCogs.productName}</p>
              </div>
              <button onClick={() => setSelectedCogs(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">1. Formula Bulk / Netto:</span>
                <span className="font-mono font-bold text-slate-800">Rp {selectedCogs.formulaCost.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">2. Kemasan Primer (Botol/Jar/Tube):</span>
                <span className="font-mono font-bold text-slate-800">Rp {selectedCogs.primaryPackCost.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">3. Kemasan Sekunder (Box Printing/Seal):</span>
                <span className="font-mono font-bold text-slate-800">Rp {selectedCogs.secondaryPackCost.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">4. Upah Tenaga Kerja Langsung:</span>
                <span className="font-mono font-bold text-slate-800">Rp {selectedCogs.laborCost.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">5. Alokasi Overhead Pabrik (Listrik & QC):</span>
                <span className="font-mono font-bold text-slate-800">Rp {selectedCogs.overheadCost.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900">Total HPP per Pcs (BOM):</span>
                <span className="font-mono font-bold text-rose-600 text-sm">Rp {selectedCogs.totalHppPerPcs.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-lg border border-emerald-200">
                <span className="font-bold text-emerald-900">Rekomendasi Harga Jual (Quotation):</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">Rp {selectedCogs.recommendedPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <DnaButton variant="outline" onClick={() => setSelectedCogs(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}

export default function CogsRequestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Memuat Permintaan HPP...</div>}>
      <CogsRequestContent />
    </Suspense>
  );
}
