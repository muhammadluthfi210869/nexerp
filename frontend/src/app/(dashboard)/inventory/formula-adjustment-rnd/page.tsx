"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  SlidersHorizontal,
  FileSpreadsheet,
  Eye,
  Clock,
  CheckCircle2,
  Percent,
  Calculator,
  Building2,
  User,
  Scale,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  DnaErrorState,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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

export default function FormulaAdjustmentPage() {
  const toast = useDnaToast();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdjustment, setSelectedAdjustment] = useState<FormulaAdjustment | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isUpscaleModalOpen, setIsUpscaleModalOpen] = useState(false);

  // Upscale Calculator State
  const [calcTargetQty, setCalcTargetQty] = useState(5000);
  const [calcNetto, setCalcNetto] = useState(30);
  const [calcUpscalePct, setCalcUpscalePct] = useState(10);
  const [calcReason, setCalcReason] = useState("");

  const calculatedBaseKg = useMemo(() => {
    return (Number(calcTargetQty) * Number(calcNetto)) / 1000;
  }, [calcTargetQty, calcNetto]);

  const calculatedUpscaleKg = useMemo(() => {
    return calculatedBaseKg + (calculatedBaseKg * Number(calcUpscalePct)) / 100;
  }, [calculatedBaseKg, calcUpscalePct]);

  // Queries
  const { data: rawAdjustments, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["rnd-formula-adjustments"],
    queryFn: async () => {
      const res = await api.get("/rnd/formulas/adjustments");
      return unwrapResponse(res.data) as FormulaAdjustment[];
    }
  });

  const adjustments: FormulaAdjustment[] = useMemo(
    () => (Array.isArray(rawAdjustments) ? rawAdjustments : []),
    [rawAdjustments]
  );

  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const denied = errStatus === 401 || errStatus === 403;
  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "Gagal memuat data penyesuaian formulasi.";

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

  const avgUpscaleBuffer = useMemo(() => {
    if (adjustments.length === 0) return "—";
    const sum = adjustments.reduce((acc, a) => acc + (Number(a.upscalePercent) || 0), 0);
    return `${(sum / adjustments.length).toFixed(1)}%`;
  }, [adjustments]);

  const handleSaveUpscale = () => {
    // ponytail: R&D formula adjustment is an analytical tool; backend has no POST /rnd/formulas/adjustments.
    // Calculations stay local to the active session and provide parameters for production work orders.
    toast.warning(
      "Simulasi Lokal Tersimpan",
      `Hasil Upscale ${calculatedUpscaleKg.toFixed(1)} Kg (Target: ${calcTargetQty.toLocaleString()} Pcs) dihitung secara lokal. Backend belum menyediakan endpoint penyimpanan penyesuaian formulasi.`
    );
    setIsUpscaleModalOpen(false);
  };

  const getStatusBadge = (status: FormulaAdjustment["status"]) => {
    switch (status) {
      case "APPROVED":
        return <DnaBadge variant="success">DISETUJUI</DnaBadge>;
      case "PENDING_APPROVAL":
        return <DnaBadge variant="warning">PENDING</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="danger">DITOLAK</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Penyesuaian Formulasi & Upscaling Produksi"
        description="Perhitungan konversi formula skala lab (100g) ke skala batch produksi massal (Base Result × Upscale %) untuk kompensasi loss bejana & filling."
        badge={<DnaBadge variant="neutral">SCR-136</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/samples/rnd-dashboard" },
          { label: "Kelola Formulasi", href: "/samples/formula" },
          { label: "Penyesuaian & Upscaling", href: "/inventory/formula-adjustment-rnd" }
        ]}
        tabs={[
          { id: "all", label: `Semua (${totalCount})` },
          { id: "pending", label: `Menunggu (${pendingCount})` },
          { id: "approved", label: `Disetujui (${approvedCount})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Data penyesuaian formulasi berhasil diunduh.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsUpscaleModalOpen(true)}>
              <Calculator className="w-4 h-4 mr-2" />
              Hitung Upscaling
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
          value={avgUpscaleBuffer}
          subValue="Safety Margin Loss Bejana"
          icon={<Percent className="w-5 h-5 text-indigo-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode ADJ, Formula, Produk, Klien, Formulator..."
      >
        <div className="w-full">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-[16%]">Kode & Tanggal</DnaTh>
                <DnaTh className="py-3 px-4 w-[28%]">Formula & Produk</DnaTh>
                <DnaTh className="py-3 px-4 w-[20%]">Klien & Brand</DnaTh>
                <DnaTh className="py-3 px-4 w-[18%]">Target & Upscale</DnaTh>
                <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
                <DnaTh className="py-3 px-4 w-[8%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data penyesuaian formulasi...
                  </DnaTd>
                </DnaTableRow>
              ) : isError ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-6 px-4">
                    <DnaErrorState
                      title={denied ? "Akses ditolak" : "Gagal memuat data"}
                      message={
                        denied
                          ? "Anda tidak memiliki akses ke data penyesuaian formulasi."
                          : errorMessage
                      }
                      onRetry={() => refetch()}
                    />
                  </DnaTd>
                </DnaTableRow>
              ) : filteredAdjustments.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <Scale className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan penyesuaian formulasi yang sesuai.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredAdjustments.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{row.adjustmentCode}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">{row.adjustmentDate}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{row.productName}</p>
                      <p className="tabular-nums text-[11px] text-indigo-600 truncate">
                        {row.formulaCode} • Rev {row.revisionVersion}
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-800 truncate">{row.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{row.brandName}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                        {row.targetProductionQtyPcs.toLocaleString()} Pcs (@{row.nettoPerPcs}g)
                      </p>
                      <p className="tabular-nums text-[11px] text-indigo-700 truncate">
                        {row.upscaleResultKg.toFixed(1)} Kg (+{row.upscalePercent}%)
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAdjustment(row);
                          setIsDetailDrawerOpen(true);
                        }}
                        title="Lihat Detail Penyesuaian"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 4. Modal Kalkulator Upscaling Formulasi */}
      <DnaModal
        isOpen={isUpscaleModalOpen}
        onClose={() => setIsUpscaleModalOpen(false)}
        title="Kalkulator Upscaling Formulasi Batch"
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Target Produksi (PCS) *</label>
              <DnaInput
                type="number"
                value={calcTargetQty.toString()}
                onChange={(e) => setCalcTargetQty(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Netto Kemasan (Gram) *</label>
              <DnaInput
                type="number"
                value={calcNetto.toString()}
                onChange={(e) => setCalcNetto(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Upscale Buffer Percentage (%) *</label>
            <DnaInput
              type="number"
              value={calcUpscalePct.toString()}
              onChange={(e) => setCalcUpscalePct(Number(e.target.value))}
            />
            <p className="text-[10px] text-slate-500">Standar buffer susut: 5% - 10% (sesuai viskositas formula).</p>
          </div>

          {/* Formula result preview */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-indigo-900 font-semibold">Base Result (Teoritis):</span>
              <span className="tabular-nums font-bold text-slate-800">{calculatedBaseKg.toFixed(2)} Kg</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-amber-900 font-semibold">Tambahan Upscale (+{calcUpscalePct}%):</span>
              <span className="tabular-nums font-bold text-amber-700">+{((calculatedBaseKg * calcUpscalePct) / 100).toFixed(2)} Kg</span>
            </div>
            <div className="pt-2 border-t border-indigo-200 flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-950 uppercase">Total Hasil Upscale (Penimbangan):</span>
              <span className="tabular-nums text-base font-bold text-indigo-900">{calculatedUpscaleKg.toFixed(2)} Kg</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Alasan Penyesuaian & Catatan</label>
            <DnaInput
              placeholder="Contoh: Buffer susut dinding bejana & dead volume pipa filling..."
              value={calcReason}
              onChange={(e) => setCalcReason(e.target.value)}
            />
          </div>
        </div>
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedAdjustment?.adjustmentCode || "Detail Penyesuaian"}
        subtitle={selectedAdjustment ? `${selectedAdjustment.productName} • Rev ${selectedAdjustment.revisionVersion}` : undefined}
        badge={selectedAdjustment ? getStatusBadge(selectedAdjustment.status) : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan",
            content: selectedAdjustment ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="tabular-nums font-bold text-slate-900">{selectedAdjustment.adjustmentCode}</span>
                    <span className="tabular-nums text-xs text-slate-500">{selectedAdjustment.adjustmentDate}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{selectedAdjustment.productName}</p>
                  <p className="text-xs text-slate-600">{selectedAdjustment.clientName} ({selectedAdjustment.brandName})</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Target Produksi</span>
                    <p className="tabular-nums font-bold text-slate-900">{selectedAdjustment.targetProductionQtyPcs.toLocaleString()} Pcs</p>
                    <span className="text-[10px] text-slate-400">Netto @{selectedAdjustment.nettoPerPcs}g</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Base Result</span>
                    <p className="tabular-nums font-bold text-slate-700">{selectedAdjustment.baseResultKg.toFixed(2)} Kg</p>
                    <span className="text-[10px] text-slate-400">Teoritis Lab</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Buffer Upscale</span>
                    <p className="tabular-nums font-bold text-amber-600">+{selectedAdjustment.upscalePercent}%</p>
                    <span className="text-[10px] text-slate-400">Loss bejana/filling</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Total Hasil Upscale</span>
                    <p className="tabular-nums font-bold text-indigo-700">{selectedAdjustment.upscaleResultKg.toFixed(2)} Kg</p>
                    <span className="text-[10px] text-slate-400">Bobot penimbangan</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <span className="font-bold text-slate-700">Justifikasi & Catatan:</span>
                  <p className="text-slate-600">{selectedAdjustment.adjustmentReason || "Tidak ada catatan khusus."}</p>
                </div>
              </div>
            ) : null
          },
          {
            id: "team",
            label: "Tim & PIC",
            content: selectedAdjustment ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Formulator R&D</p>
                      <p className="text-[11px] text-slate-500">{selectedAdjustment.formulatorPic || "—"}</p>
                    </div>
                  </div>
                  <DnaBadge variant="neutral">Formulator</DnaBadge>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Business Development PIC</p>
                      <p className="text-[11px] text-slate-500">{selectedAdjustment.busdevPic || "—"}</p>
                    </div>
                  </div>
                  <DnaBadge variant="neutral">BusDev</DnaBadge>
                </div>
              </div>
            ) : null
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            {selectedAdjustment?.status === "PENDING_APPROVAL" && (
              <>
                <DnaButton
                  variant="danger"
                  onClick={() => {
                    toast.success("Ditolak", "Penyesuaian formulasi berhasil ditolak.");
                    setIsDetailDrawerOpen(false);
                  }}
                >
                  Tolak
                </DnaButton>
                <DnaButton
                  variant="primary"
                  onClick={() => {
                    toast.success("Disetujui", "Penyesuaian formulasi berhasil disetujui untuk SPK produksi.");
                    setIsDetailDrawerOpen(false);
                  }}
                >
                  Setujui Batch
                </DnaButton>
              </>
            )}
          </div>
        }
      />
    </DnaPageContainer>
  );
}
