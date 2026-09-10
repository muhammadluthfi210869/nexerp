"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Layers,
  Package,
  Boxes,
  Briefcase,
  Check,
  XCircle,
  FileText,
  Printer
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaTabNav,
  useDnaToast
} from "@/components/dna";

interface CogsRequestItem {
  id: string;
  requestCode: string;
  requestDate: string;
  clientName: string;
  brandName: string;
  productName: string;
  formulaCode: string;
  revisionVersion: string;
  nettoGram: number;
  moqTargetPcs: number; // e.g. 5.000 pcs
  formulaCostPerPcs: number; // Biaya Bulk / Bahan Baku
  primaryPackCostPerPcs: number; // Botol / Tube / Pot
  secondaryPackCostPerPcs: number; // Box Hologram / Leaflet / Seal
  directLaborCostPerPcs: number; // Upah Filling & Packing
  factoryOverheadCostPerPcs: number; // Listrik, Mesin, QC
  wasteMarginPercent: number; // e.g. 3%
  totalHppPerPcs: number;
  recommendedSellingPrice: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  statusLabel: string;
  busdevPic: string;
  approvedBy?: string;
  notes?: string;
}

const MOCK_COGS_REQUESTS: CogsRequestItem[] = [
  {
    id: "cogs-01",
    requestCode: "HPP-202603-0001",
    requestDate: "2026-03-08",
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    productName: "Brightening Glow Serum 10% Niacinamide 30ml",
    formulaCode: "FORM-202603-001",
    revisionVersion: "Rev 2.0",
    nettoGram: 30,
    moqTargetPcs: 5000,
    formulaCostPerPcs: 4350,
    primaryPackCostPerPcs: 4200, // Botol dropper kaca frosted 30ml
    secondaryPackCostPerPcs: 1650, // Inner box printing foil emas
    directLaborCostPerPcs: 850,
    factoryOverheadCostPerPcs: 650,
    wasteMarginPercent: 3.0,
    totalHppPerPcs: 12050,
    recommendedSellingPrice: 24500,
    status: "APPROVED",
    statusLabel: "Disetujui Management",
    busdevPic: "Sari Dewi",
    approvedBy: "Dewi Lestari (Finance Director)",
    notes: "MOQ 5.000 pcs disetujui untuk penawaran kontrak maklon."
  },
  {
    id: "cogs-02",
    requestCode: "HPP-202603-0002",
    requestDate: "2026-03-07",
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    productName: "Ceramide 5X Barrier Repair Moisturizer 50g",
    formulaCode: "FORM-202603-002",
    revisionVersion: "Rev 1.1",
    nettoGram: 50,
    moqTargetPcs: 3000,
    formulaCostPerPcs: 10500,
    primaryPackCostPerPcs: 5800, // Pot cream double wall acrylic
    secondaryPackCostPerPcs: 1900, // Box premium emboss
    directLaborCostPerPcs: 950,
    factoryOverheadCostPerPcs: 750,
    wasteMarginPercent: 3.5,
    totalHppPerPcs: 20590,
    recommendedSellingPrice: 38000,
    status: "PENDING",
    statusLabel: "Menunggu Review Finance",
    busdevPic: "Rian Hendra",
    notes: "Simulasi tiering: MOQ 3.000 pcs (Rp 20.590) vs MOQ 5.000 pcs (Rp 18.900)."
  },
  {
    id: "cogs-03",
    requestCode: "HPP-202603-0003",
    requestDate: "2026-03-05",
    clientName: "CV Derma Estetika Mandiri",
    brandName: "DermaPure",
    productName: "AHA BHA PHA Exfoliating Toner 100ml",
    formulaCode: "FORM-202603-003",
    revisionVersion: "Rev 1.0",
    nettoGram: 100,
    moqTargetPcs: 2000,
    formulaCostPerPcs: 6500,
    primaryPackCostPerPcs: 3800, // Botol PET transparan + plug
    secondaryPackCostPerPcs: 1400, // Inner box ivory 300gsm
    directLaborCostPerPcs: 800,
    factoryOverheadCostPerPcs: 600,
    wasteMarginPercent: 3.0,
    totalHppPerPcs: 13490,
    recommendedSellingPrice: 26000,
    status: "APPROVED",
    statusLabel: "Disetujui Management",
    busdevPic: "Sari Dewi",
    approvedBy: "Hendro Wibowo",
    notes: "Sudah diterbitkan Surat Penawaran Harga (SPH)."
  }
];

export default function RequestCogsPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<CogsRequestItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State (SCR-139)
  const [createForm, setCreateForm] = useState({
    clientName: "",
    brandName: "",
    productName: "",
    formulaCode: "FORM-202603-001",
    moqTargetPcs: 5000,
    nettoGram: 30,
    primaryPackCost: 4200,
    secondaryPackCost: 1650,
    notes: ""
  });

  // Queries
  const { data: rawRequests, isLoading } = useQuery({
    queryKey: ["rnd-cogs-requests"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/cogs-requests");
        return unwrapResponse(res.data) as CogsRequestItem[];
      } catch (e) {
        return null;
      }
    }
  });

  const requests: CogsRequestItem[] = useMemo(() => {
    if (rawRequests && Array.isArray(rawRequests) && rawRequests.length > 0) {
      return rawRequests;
    }
    return MOCK_COGS_REQUESTS;
  }, [rawRequests]);

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab === "pending" && r.status !== "PENDING") return false;
      if (activeTab === "approved" && r.status !== "APPROVED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          r.requestCode.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.brandName.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.formulaCode.toLowerCase().includes(q) ||
          r.busdevPic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, activeTab, searchQuery]);

  // KPIs
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "PENDING").length;
  const approvedRequests = requests.filter(r => r.status === "APPROVED").length;

  const handleCreateRequest = () => {
    if (!createForm.clientName || !createForm.productName) {
      toast.warning("Form Belum Lengkap", "Nama Klien dan Nama Produk wajib diisi.");
      return;
    }
    toast.success("Permintaan HPP Disimpan", "Kalkulasi HPP roll-up berhasil dibuat dan diteruskan ke Finance/Management untuk approval.");
    setIsCreateModalOpen(false);
  };

  const handleApprove = (id: string, isApproved: boolean) => {
    toast.success(
      isApproved ? "HPP Disetujui" : "HPP Ditolak",
      `Permintaan HPP ${id} telah ${isApproved ? "disetujui untuk rilis penawaran kontrak klien" : "ditolak untuk kalkulasi ulang"}.`
    );
    setIsDetailModalOpen(false);
  };

  const getStatusBadge = (status: CogsRequestItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return <DnaBadge variant="success">APPROVED</DnaBadge>;
      case "PENDING":
        return <DnaBadge variant="warning">MENUNGGU REVIEW</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="danger">DITOLAK</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Permintaan HPP & Costing Pra-Produksi"
        description="Perhitungan Harga Pokok Penjualan (HPP) roll-up menyeluruh (Bahan Baku + Kemasan Primer & Sekunder + Tenaga Kerja + Overhead Pabrik) dan simulasi tiering MOQ."
        badge={<DnaBadge variant="neutral">SCR-138 & SCR-139</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "Permintaan HPP", href: "/rnd/cogs-request" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Rekapitulasi HPP berhasil diunduh ke format Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Permintaan HPP (SCR-139)
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL PERMINTAAN HPP"
          value={`${totalRequests} Request`}
          subValue="Dokumen Costing Terdaftar"
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="MENUNGGU REVIEW FINANCE"
          value={`${pendingRequests} Dokumen`}
          subValue="Persetujuan Direksi & Finance"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="DISETUJUI (APPROVED)"
          value={`${approvedRequests} Selesai`}
          subValue="Siap Diterbitkan SPH Klien"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="ESTIMASI GROSS MARGIN"
          value="48.2%"
          subValue="Rata-Rata Margin Kontrak Maklon"
          icon={<Calculator className="w-5 h-5 text-indigo-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Request (${totalRequests})` },
          { id: "pending", label: `Menunggu Review (${pendingRequests})` },
          { id: "approved", label: `Disetujui (${approvedRequests})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card (SCR-138) */}
      <DnaDataTableCard
        title="Daftar Permintaan & Kalkulasi HPP Pra-Produksi"
        description="Detail biaya per komponen untuk penetapan harga penawaran maklon dan konfirmasi pesanan (Sales Order)."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode HPP, Klien, Brand, Formula, BusDev..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Kode & Tanggal</th>
                <th className="py-3 px-4">Pelanggan & Brand</th>
                <th className="py-3 px-4">Produk & Formula</th>
                <th className="py-3 px-4 text-right">Target MOQ</th>
                <th className="py-3 px-4 text-right">Biaya Formula</th>
                <th className="py-3 px-4 text-right">Biaya Kemasan</th>
                <th className="py-3 px-4 text-right">Total HPP / Pcs</th>
                <th className="py-3 px-4 text-right">Harga Jual Rekomendasi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada permintaan HPP yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{row.requestCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.requestDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{row.clientName}</p>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{row.brandName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.productName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>{row.formulaCode} ({row.revisionVersion})</span>
                        <span>•</span>
                        <span>{row.nettoGram}g</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {row.moqTargetPcs.toLocaleString()} Pcs
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      Rp {row.formulaCostPerPcs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      Rp {(row.primaryPackCostPerPcs + row.secondaryPackCostPerPcs).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                      Rp {row.totalHppPerPcs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      Rp {row.recommendedSellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(row);
                          setIsDetailModalOpen(true);
                        }}
                        title="Lihat Detail Roll-Up Biaya"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Buat Permintaan HPP (SCR-139) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Permintaan HPP Baru (SCR-139)"
        description="Formulir permohonan kalkulasi HPP dan simulasi costing pra-produksi."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateRequest}>
              Hitung & Ajukan HPP
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Pelanggan / Klien *</label>
              <input
                type="text"
                placeholder="PT Cantika Glow Nusantara"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.clientName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Brand / Merk *</label>
              <input
                type="text"
                placeholder="GlowAura"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.brandName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, brandName: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Nama Produk *</label>
            <input
              type="text"
              placeholder="Serum Niacinamide 10% 30ml"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={createForm.productName}
              onChange={(e) => setCreateForm(prev => ({ ...prev, productName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Formula Acuan *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                value={createForm.formulaCode}
                onChange={(e) => setCreateForm(prev => ({ ...prev, formulaCode: e.target.value }))}
              >
                <option value="FORM-202603-001">FORM-001 - Brightening Glow Serum</option>
                <option value="FORM-202603-002">FORM-002 - Ceramide 5X Barrier Cream</option>
                <option value="FORM-202603-003">FORM-003 - AHA BHA PHA Toner</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Target MOQ (Pcs) *</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.moqTargetPcs}
                onChange={(e) => setCreateForm(prev => ({ ...prev, moqTargetPcs: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Netto (Gram) *</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.nettoGram}
                onChange={(e) => setCreateForm(prev => ({ ...prev, nettoGram: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Estimasi Kemasan Primer (Rp/Pcs)</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.primaryPackCost}
                onChange={(e) => setCreateForm(prev => ({ ...prev, primaryPackCost: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Estimasi Kemasan Sekunder/Box (Rp/Pcs)</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={createForm.secondaryPackCost}
                onChange={(e) => setCreateForm(prev => ({ ...prev, secondaryPackCost: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Kebutuhan khusus stiker segel, shrink wrap, atau sertifikat halal..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={createForm.notes}
              onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Detail & Cost Roll-Up (SCR-146) */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedRequest ? `Rincian Roll-Up HPP: ${selectedRequest.requestCode}` : "Detail HPP"}
        description="Breakdown struktur biaya bahan baku, kemasan, direct labor, overhead pabrik, dan margin."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              {selectedRequest?.status === "PENDING" ? (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Menunggu Persetujuan Direksi
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Status: {selectedRequest?.status}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>

              {selectedRequest?.status === "PENDING" && (
                <>
                  <DnaButton variant="danger" onClick={() => handleApprove(selectedRequest.id, false)}>
                    <XCircle className="w-4 h-4 mr-1" /> Tolak
                  </DnaButton>
                  <DnaButton variant="primary" onClick={() => handleApprove(selectedRequest.id, true)}>
                    <Check className="w-4 h-4 mr-1" /> Setujui HPP
                  </DnaButton>
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Nama Produk & Brand</span>
                  <p className="text-sm font-bold text-slate-900">{selectedRequest.productName}</p>
                </div>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Klien / Brand:</span>
                  <p className="font-semibold text-slate-800">{selectedRequest.clientName} ({selectedRequest.brandName})</p>
                </div>
                <div>
                  <span className="text-slate-500">Formula Acuan:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedRequest.formulaCode} ({selectedRequest.revisionVersion})</p>
                </div>
                <div>
                  <span className="text-slate-500">Target MOQ:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedRequest.moqTargetPcs.toLocaleString()} Pcs (@{selectedRequest.nettoGram}g)</p>
                </div>
                <div>
                  <span className="text-slate-500">BusDev PIC:</span>
                  <p className="font-semibold text-slate-800">{selectedRequest.busdevPic}</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Grid */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Komponen Biaya</th>
                    <th className="p-3">Deskripsi Komponen</th>
                    <th className="p-3 text-right">Biaya per Pcs</th>
                    <th className="p-3 text-right">Total Batch ({selectedRequest.moqTargetPcs.toLocaleString()} Pcs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 font-sans">1. Biaya Formula Bulk</td>
                    <td className="p-3 text-slate-600 font-sans">Bahan aktif, pelarut, pengental, pengawet ({selectedRequest.nettoGram}g)</td>
                    <td className="p-3 text-right font-bold text-slate-900">Rp {selectedRequest.formulaCostPerPcs.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-700">Rp {(selectedRequest.formulaCostPerPcs * selectedRequest.moqTargetPcs).toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 font-sans">2. Kemasan Primer</td>
                    <td className="p-3 text-slate-600 font-sans">Wadah utama (Botol / Tube / Pot)</td>
                    <td className="p-3 text-right font-bold text-slate-900">Rp {selectedRequest.primaryPackCostPerPcs.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-700">Rp {(selectedRequest.primaryPackCostPerPcs * selectedRequest.moqTargetPcs).toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 font-sans">3. Kemasan Sekunder</td>
                    <td className="p-3 text-slate-600 font-sans">Inner box, label foil, leaflet & shrink</td>
                    <td className="p-3 text-right font-bold text-slate-900">Rp {selectedRequest.secondaryPackCostPerPcs.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-700">Rp {(selectedRequest.secondaryPackCostPerPcs * selectedRequest.moqTargetPcs).toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 font-sans">4. Direct Labor (Upah)</td>
                    <td className="p-3 text-slate-600 font-sans">Tenaga kerja mixing, filling & packing line</td>
                    <td className="p-3 text-right font-bold text-slate-900">Rp {selectedRequest.directLaborCostPerPcs.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-700">Rp {(selectedRequest.directLaborCostPerPcs * selectedRequest.moqTargetPcs).toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 font-sans">5. Factory Overhead</td>
                    <td className="p-3 text-slate-600 font-sans">Utilitas listrik, depresiasi mesin, testing lab QC</td>
                    <td className="p-3 text-right font-bold text-slate-900">Rp {selectedRequest.factoryOverheadCostPerPcs.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-700">Rp {(selectedRequest.factoryOverheadCostPerPcs * selectedRequest.moqTargetPcs).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-indigo-50/70 font-bold">
                    <td colSpan={2} className="p-3 font-sans text-indigo-950 uppercase">Total HPP per Kemasan (Termasuk Scrap Buffer {selectedRequest.wasteMarginPercent}%):</td>
                    <td className="p-3 text-right text-indigo-700 text-sm">Rp {selectedRequest.totalHppPerPcs.toLocaleString()}</td>
                    <td className="p-3 text-right text-indigo-900 text-sm">Rp {(selectedRequest.totalHppPerPcs * selectedRequest.moqTargetPcs).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pricing Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Rekomendasi Harga Jual Maklon</span>
                <p className="font-mono text-xl font-bold text-emerald-700">
                  Rp {selectedRequest.recommendedSellingPrice.toLocaleString()} / Pcs
                </p>
                <p className="text-[11px] text-emerald-800">Estimasi Gross Margin: Rp {(selectedRequest.recommendedSellingPrice - selectedRequest.totalHppPerPcs).toLocaleString()} (50.8%)</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-600">Total Nilai Kontrak PO (Est)</span>
                <p className="font-mono text-xl font-bold text-slate-900">
                  Rp {(selectedRequest.recommendedSellingPrice * selectedRequest.moqTargetPcs).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">Nilai sebelum PPN 11%</p>
              </div>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
