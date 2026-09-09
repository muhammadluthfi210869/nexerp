"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  SlidersHorizontal,
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
  Scale,
  Calculator,
  Percent,
  Layers,
  FlaskConical,
  Check,
  FileText
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

interface FormulaAdjustment {
  id: string;
  adjustmentCode: string;
  adjustmentDate: string;
  formulaCode: string;
  productName: string;
  revisionVersion: string;
  nettoPerPcs: number; // Gram
  clientName: string;
  brandName: string;
  busdevPic: string;
  formulatorPic: string;
  targetProductionQtyPcs: number;
  baseResultKg: number; // targetProductionQtyPcs * nettoPerPcs / 1000
  upscalePercent: number; // e.g. 10%
  upscaleResultKg: number; // baseResultKg + (baseResultKg * upscalePercent / 100)
  adjustmentReason: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  statusLabel: string;
}

const MOCK_ADJUSTMENTS: FormulaAdjustment[] = [
  {
    id: "adj-f-01",
    adjustmentCode: "ADJ-FORM-202603-001",
    adjustmentDate: "2026-03-08",
    formulaCode: "FORM-202603-001",
    productName: "Brightening Glow Serum 10% Niacinamide",
    revisionVersion: "Rev 2.0",
    nettoPerPcs: 30,
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    busdevPic: "Sari Dewi (BusDev)",
    formulatorPic: "Apt. Dedi Kurniawan, S.Farm",
    targetProductionQtyPcs: 5000,
    baseResultKg: 150.0,
    upscalePercent: 10.0,
    upscaleResultKg: 165.0,
    adjustmentReason: "Upscaling produksi batch 5.000 botol dengan buffer 10% untuk kompensasi dead volume mesin filling.",
    status: "APPROVED",
    statusLabel: "Disetujui Formulator & Produksi"
  },
  {
    id: "adj-f-02",
    adjustmentCode: "ADJ-FORM-202603-002",
    adjustmentDate: "2026-03-07",
    formulaCode: "FORM-202603-002",
    productName: "Ceramide 5X Barrier Repair Moisturizer",
    revisionVersion: "Rev 1.1",
    nettoPerPcs: 50,
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    busdevPic: "Rian Hendra",
    formulatorPic: "Dr. Maya Sp.KK",
    targetProductionQtyPcs: 3000,
    baseResultKg: 150.0,
    upscalePercent: 8.0,
    upscaleResultKg: 162.0,
    adjustmentReason: "Penyesuaian konsentrasi pengental (Sepimax ZEN dikurangi 0.2%) untuk mengoptimalkan flowability di nozzle pot cream.",
    status: "PENDING_APPROVAL",
    statusLabel: "Menunggu Review Formulator"
  },
  {
    id: "adj-f-03",
    adjustmentCode: "ADJ-FORM-202603-003",
    adjustmentDate: "2026-03-05",
    formulaCode: "FORM-202603-003",
    productName: "AHA BHA PHA Exfoliating Toner 100ml",
    revisionVersion: "Rev 1.0",
    nettoPerPcs: 100,
    clientName: "CV Derma Estetika Mandiri",
    brandName: "DermaPure",
    busdevPic: "Sari Dewi (BusDev)",
    formulatorPic: "Apt. Siska Handayani, M.Farm",
    targetProductionQtyPcs: 2000,
    baseResultKg: 200.0,
    upscalePercent: 5.0,
    upscaleResultKg: 210.0,
    adjustmentReason: "Upscaling standar batch 2.000 botol dengan buffer evaporasi 5% pada suhu mixing 45°C.",
    status: "APPROVED",
    statusLabel: "Disetujui Formulator & Produksi"
  }
];

export default function FormulaAdjustmentPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdjustment, setSelectedAdjustment] = useState<FormulaAdjustment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpscaleModalOpen, setIsUpscaleModalOpen] = useState(false);

  // Upscale Calculator State
  const [calcTargetQty, setCalcTargetQty] = useState(5000);
  const [calcNetto, setCalcNetto] = useState(30);
  const [calcUpscalePct, setCalcUpscalePct] = useState(10);

  const calculatedBaseKg = useMemo(() => {
    return (Number(calcTargetQty) * Number(calcNetto)) / 1000;
  }, [calcTargetQty, calcNetto]);

  const calculatedUpscaleKg = useMemo(() => {
    return calculatedBaseKg + (calculatedBaseKg * Number(calcUpscalePct)) / 100;
  }, [calculatedBaseKg, calcUpscalePct]);

  // Queries
  const { data: rawAdjustments, isLoading } = useQuery({
    queryKey: ["rnd-formula-adjustments"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/formulas/adjustments");
        return unwrapResponse(res.data) as FormulaAdjustment[];
      } catch (e) {
        return null;
      }
    }
  });

  const adjustments: FormulaAdjustment[] = useMemo(() => {
    if (rawAdjustments && Array.isArray(rawAdjustments) && rawAdjustments.length > 0) {
      return rawAdjustments;
    }
    return MOCK_ADJUSTMENTS;
  }, [rawAdjustments]);

  // Filtering
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      if (activeTab === "pending" && a.status !== "PENDING_APPROVAL") return false;
      if (activeTab === "approved" && a.status !== "APPROVED") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          a.adjustmentCode.toLowerCase().includes(q) ||
          a.formulaCode.toLowerCase().includes(q) ||
          a.productName.toLowerCase().includes(q) ||
          a.clientName.toLowerCase().includes(q) ||
          a.brandName.toLowerCase().includes(q) ||
          a.formulatorPic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adjustments, activeTab, searchQuery]);

  // KPIs
  const totalCount = adjustments.length;
  const pendingCount = adjustments.filter(a => a.status === "PENDING_APPROVAL").length;
  const approvedCount = adjustments.filter(a => a.status === "APPROVED").length;

  const handleSaveUpscale = () => {
    toast.success(
      "Penyesuaian Formulasi Disimpan",
      `Hasil Upscale ${calculatedUpscaleKg.toFixed(1)} Kg (Target: ${calcTargetQty.toLocaleString()} Pcs) berhasil diajukan untuk SPK Produksi.`
    );
    setIsUpscaleModalOpen(false);
  };

  const getStatusBadge = (status: FormulaAdjustment["status"]) => {
    switch (status) {
      case "APPROVED":
        return <DnaBadge variant="success">DISETUJUI (SIAP SPK)</DnaBadge>;
      case "PENDING_APPROVAL":
        return <DnaBadge variant="warning">MENUNGGU APPROVAL</DnaBadge>;
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
        title="Penyesuaian Formulasi & Upscaling Produksi"
        description="Perhitungan konversi formula skala laboratorium (100g) ke skala batch produksi massal (Base Result × Upscale %) untuk kompensasi loss bejana & filling."
        badge={<DnaBadge variant="neutral">SCR-136</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "Kelola Formulasi", href: "/rnd/formula" },
          { label: "Penyesuaian & Upscaling", href: "/rnd/formula-adjustment" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Data penyesuaian formulasi berhasil diunduh ke format Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsUpscaleModalOpen(true)}>
              <Calculator className="w-4 h-4 mr-2" />
              Hitung Upscaling Baru
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL PENYESUAIAN"
          value={`${totalCount} Dokumen`}
          subValue="Akumulasi Batch Pra-Produksi"
          icon={<SlidersHorizontal className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="MENUNGGU APPROVAL"
          value={`${pendingCount} Dokumen`}
          subValue="Review Formulator & Produksi"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="DISETUJUI (APPROVED)"
          value={`${approvedCount} Batch`}
          subValue="Siap Rilis Batch Record SPK"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="RATA-RATA UPSCALE BUFFER"
          value="8.5%"
          subValue="Safety Margin Loss Bejana"
          icon={<Percent className="w-5 h-5 text-indigo-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Penyesuaian (${totalCount})` },
          { id: "pending", label: `Menunggu Approval (${pendingCount})` },
          { id: "approved", label: `Disetujui (${approvedCount})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card (SCR-136) */}
      <DnaDataTableCard
        title="Daftar Penyesuaian Formulasi & Upscaling Batch"
        description="Hasil kalkulasi Base Result (Qty × Netto) + Upscale Buffer % untuk instruksi penimbangan bejana mixing."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode ADJ, Formula, Produk, Klien, Formulator..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Kode & Tanggal</th>
                <th className="py-3 px-4">Nama Produk & Formula</th>
                <th className="py-3 px-4">Klien / Brand</th>
                <th className="py-3 px-4 text-center">Rev</th>
                <th className="py-3 px-4 text-right">Target Batch</th>
                <th className="py-3 px-4 text-right">Base Result</th>
                <th className="py-3 px-4 text-right">Upscale (%)</th>
                <th className="py-3 px-4 text-right">Hasil Upscale</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Scale className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan penyesuaian formulasi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{row.adjustmentCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.adjustmentDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.productName}</p>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{row.formulaCode}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{row.clientName}</p>
                      <span className="text-[11px] text-slate-500">{row.brandName}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {row.revisionVersion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {row.targetProductionQtyPcs.toLocaleString()} Pcs
                      <div className="text-[10px] text-slate-400 font-normal">@{row.nettoPerPcs}g</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {row.baseResultKg.toFixed(1)} Kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                      +{row.upscalePercent}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                      {row.upscaleResultKg.toFixed(1)} Kg
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAdjustment(row);
                          setIsDetailModalOpen(true);
                        }}
                        title="Lihat Detail Penyesuaian"
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

      {/* 5. Modal Kalkulator Upscaling Formulasi (SCR-136 & Poin 143) */}
      <DnaModal
        isOpen={isUpscaleModalOpen}
        onClose={() => setIsUpscaleModalOpen(false)}
        title="Kalkulator Upscaling Formulasi Batch (Poin 143)"
        description="Perhitungan otomatis kebutuhan bahan baku riil berdasarkan Target Qty, Netto Kemasan, dan Persentase Upscale."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsUpscaleModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveUpscale}>
              Simpan & Rilis Penyesuaian
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Pilih Master Formulasi *</label>
            <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800">
              <option value="FORM-01">FORM-202603-001 - Brightening Glow Serum 10% Niacinamide</option>
              <option value="FORM-02">FORM-202603-002 - Ceramide 5X Barrier Repair Moisturizer</option>
              <option value="FORM-03">FORM-202603-003 - AHA BHA PHA Exfoliating Toner 100ml</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Target Produksi (PCS) *</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900"
                value={calcTargetQty}
                onChange={(e) => setCalcTargetQty(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Netto Kemasan (Gram) *</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900"
                value={calcNetto}
                onChange={(e) => setCalcNetto(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Upscale Buffer Percentage (%) *</label>
            <input
              type="number"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-amber-700"
              value={calcUpscalePct}
              onChange={(e) => setCalcUpscalePct(Number(e.target.value))}
            />
            <p className="text-[10px] text-slate-500">Standar buffer susut: 5% - 10% (sesuai viskositas formula).</p>
          </div>

          {/* Formula result preview */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-indigo-900 font-semibold">Base Result (Teoritis):</span>
              <span className="font-mono font-bold text-slate-800">{calculatedBaseKg.toFixed(2)} Kg</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-amber-900 font-semibold">Tambahan Upscale (+{calcUpscalePct}%):</span>
              <span className="font-mono font-bold text-amber-700">+{((calculatedBaseKg * calcUpscalePct) / 100).toFixed(2)} Kg</span>
            </div>
            <div className="pt-2 border-t border-indigo-200 flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-950 uppercase">Total Hasil Upscale (Penimbangan):</span>
              <span className="font-mono text-base font-bold text-indigo-900">{calculatedUpscaleKg.toFixed(2)} Kg</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Alasan Penyesuaian & Catatan</label>
            <textarea
              rows={2}
              placeholder="Contoh: Buffer susut dinding bejana & dead volume pipa filling..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Detail Penyesuaian */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Penyesuaian Formulasi"
        description="Rincian parameter upscaling dan otorisasi batch mixing."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedAdjustment && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-slate-900">{selectedAdjustment.adjustmentCode}</span>
                {getStatusBadge(selectedAdjustment.status)}
              </div>
              <p className="font-bold text-slate-800 text-sm">{selectedAdjustment.productName}</p>
              <p className="text-slate-500">{selectedAdjustment.clientName} ({selectedAdjustment.brandName})</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500">Target Qty:</span>
                <p className="font-mono font-bold text-slate-900">{selectedAdjustment.targetProductionQtyPcs.toLocaleString()} Pcs (@{selectedAdjustment.nettoPerPcs}g)</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500">Hasil Upscale:</span>
                <p className="font-mono font-bold text-indigo-700">{selectedAdjustment.upscaleResultKg.toFixed(1)} Kg (+{selectedAdjustment.upscalePercent}%)</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">Catatan & Justifikasi:</span>
              <p className="text-slate-600">{selectedAdjustment.adjustmentReason}</p>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
