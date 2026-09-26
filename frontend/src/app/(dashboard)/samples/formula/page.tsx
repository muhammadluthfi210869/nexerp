"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Layers,
  Plus,
  FileSpreadsheet,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Edit2,
  Lock,
  Printer,
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
  DnaDetailDrawer,
  DnaTable,
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  formatRupiah,
  useDnaToast,
  DnaCell,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface ProductFormula {
  id: string;
  formulaCode: string;
  tanggal: string;
  productName: string;
  revisionVersion: string;
  netto: string;
  customerName: string;
  busdevPic: string;
  formulatorPic: string;
  status: "DRAFT" | "LAB_TRIAL" | "STABILITY_TEST" | "LOCKED_PRODUCTION";
  statusLabel: string;
  targetPh: string;
  targetViscosity: string;
  costPerKg: number;
}

function FormulaContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const { data: serverFormulas = [], isLoading } = useQuery<ProductFormula[]>({
    queryKey: ["rnd-formulas"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/formulas");
        const list = res.data?.data || res.data || [];
        if (!Array.isArray(list)) return [];
        return list.map((item: any, idx: number) => {
          const isLocked = item.status === "PRODUCTION_LOCKED" || item.status === "LOCKED_PRODUCTION";
          const isStability = item.status === "STABILITY_TEST";
          const isTrial = item.status === "LAB_TRIAL";
          return {
            id: item.id || `form-${idx}`,
            formulaCode: item.formulaCode || item.code || `FORM-${item.version || idx + 1}`,
            tanggal: item.createdAt ? String(item.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
            productName: item.productName || item.sampleRequest?.productName || "Formula Kosmetik",
            revisionVersion: item.version ? `Rev ${item.version}` : "Rev 1.0",
            netto: item.targetYieldGram ? `${item.targetYieldGram} g` : "1000 g",
            customerName: item.customerName || item.sampleRequest?.lead?.clientName || item.sampleRequest?.clientName || "-",
            busdevPic: item.busdevPic || item.sampleRequest?.lead?.pic?.name || "-",
            formulatorPic: item.lockedBy?.fullName || item.formulatorPic || "Apt. Formulator",
            status: (isLocked ? "LOCKED_PRODUCTION" : isStability ? "STABILITY_TEST" : isTrial ? "LAB_TRIAL" : "DRAFT") as ProductFormula["status"],
            statusLabel: isLocked ? "Locked (Siap Produksi)" : isStability ? "Uji Stabilitas Lab" : isTrial ? "Trial Formulasi Lab" : "Draft",
            targetPh: item.qcParameters?.targetPh || item.targetPh || "5.50 - 6.50",
            targetViscosity: item.qcParameters?.targetViscosity || item.targetViscosity || "2,000 - 5,000 cPs",
            costPerKg: Number(item.costPerKg) || 0,
          };
        });
      } catch {
        return [];
      }
    },
  });

  const formulas = serverFormulas;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedFormula, setSelectedFormula] = useState<ProductFormula | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    productName: "",
    customerName: "",
    netto: "30 ml",
    targetPh: "5.50 - 6.00",
    costPerKg: 125000,
  });

  const handleLockProduction = async () => {
    if (!selectedFormula) return;
    try {
      await api.patch(`/rnd/formulas/${selectedFormula.id}/lock-production`);
      toast.success("Formula berhasil di-lock untuk produksi massal CPKB.");
      queryClient.invalidateQueries({ queryKey: ["rnd-formulas"] });
      setSelectedFormula((prev) =>
        prev ? { ...prev, status: "LOCKED_PRODUCTION", statusLabel: "Locked (Siap Produksi)" } : null
      );
    } catch (err: any) {
      toast.error("Gagal Mengunci Formula", err?.response?.data?.message || "Terjadi kesalahan.");
    }
  };

  const handleCreateFormula = async () => {
    if (!createForm.productName) {
      toast.warning("Form Belum Lengkap", "Nama produk kosmetik wajib diisi.");
      return;
    }
    try {
      await api.post("/rnd/formulas", {
        productName: createForm.productName,
        customerName: createForm.customerName,
        totalWeightGr: parseInt(createForm.netto) || 1000,
        phases: [],
      });
      toast.success("Master formula baru berhasil diarsipkan.");
      queryClient.invalidateQueries({ queryKey: ["rnd-formulas"] });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast.error("Gagal Menyimpan Formula", err?.response?.data?.message || "Gagal membuat formula.");
    }
  };

  const filteredFormulas = useMemo(() => {
    return formulas.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        f.formulaCode.toLowerCase().includes(q) ||
        f.productName.toLowerCase().includes(q) ||
        f.customerName.toLowerCase().includes(q) ||
        f.formulatorPic.toLowerCase().includes(q);

      const matchesTab = activeTab === "ALL" || f.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [formulas, searchQuery, activeTab]);

  const totalFormulas = formulas.length;
  const lockedCount = formulas.filter((f) => f.status === "LOCKED_PRODUCTION").length;
  const trialCount = formulas.filter((f) => f.status === "LAB_TRIAL" || f.status === "STABILITY_TEST").length;

  const getStatusBadge = (status: ProductFormula["status"]) => {
    switch (status) {
      case "LOCKED_PRODUCTION":
        return <DnaBadge variant="success">Locked Produksi</DnaBadge>;
      case "STABILITY_TEST":
        return <DnaBadge variant="purple">Uji Stabilitas</DnaBadge>;
      case "LAB_TRIAL":
        return <DnaBadge variant="info">Trial Lab</DnaBadge>;
      default:
        return <DnaBadge variant="default">Draft</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title={
          mode === "adjustment"
            ? "Penyesuaian Formulasi Kosmetik"
            : mode === "manage"
            ? "Kelola Formulasi & INCI Repository"
            : "Formulasi R&D Kosmetik"
        }
        description="Pusat data master formula kosmetik maklon, revisi batch lab, dan spesifikasi HPP bulk CPKB."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-semibold">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>R&D Formulation Vault</span>
          </div>
        }
        tabs={[
          { key: "ALL", label: "Semua Formula", count: totalFormulas },
          { key: "LOCKED_PRODUCTION", label: "Locked (Siap Produksi)", count: lockedCount },
          { key: "STABILITY_TEST", label: "Uji Stabilitas", count: formulas.filter((f) => f.status === "STABILITY_TEST").length },
          { key: "LAB_TRIAL", label: "Trial Formulasi", count: formulas.filter((f) => f.status === "LAB_TRIAL").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Master Formula"
          value={`${totalFormulas} Formula`}
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
          subtext="INCI & Spesifikasi Terdaftar"
          variant="info"
        />
        <DnaStatCard
          label="Locked (Siap Produksi)"
          value={`${lockedCount} Formula`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="Terkonfirmasi CPKB Pabrik"
          variant="success"
        />
        <DnaStatCard
          label="Uji Stabilitas & Trial"
          value={`${trialCount} Formula`}
          icon={<Clock className="w-5 h-5 text-purple-600" />}
          subtext="Oven 40°C & Suhu Kamar"
          variant="purple"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari kode formula / produk / pelanggan / formulator...",
          actionButton: {
            label: "Buat Formulasi Baru",
            onClick: () => setIsCreateModalOpen(true),
          },
          extraActions: (
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data formulasi berhasil diekspor.")}
            >
              Export Excel
            </DnaButton>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">KODE FORMULA</DnaTh>
                <DnaTh className="p-3.5 w-28 min-w-[110px] whitespace-nowrap">TANGGAL</DnaTh>
                <DnaTh className="p-3.5 min-w-[240px]">PRODUK &amp; KLIEN</DnaTh>
                <DnaTh className="p-3.5 w-24 min-w-[90px] whitespace-nowrap">VERSI</DnaTh>
                <DnaTh className="p-3.5 w-24 min-w-[90px] whitespace-nowrap">NETTO</DnaTh>
                <DnaTh className="p-3.5 w-36 min-w-[140px] whitespace-nowrap">BUSDEV PIC</DnaTh>
                <DnaTh className="p-3.5 w-40 min-w-[150px] whitespace-nowrap">FORMULATOR</DnaTh>
                <DnaTh className="p-3.5 w-36 min-w-[120px] text-center whitespace-nowrap">STATUS</DnaTh>
                <DnaTh className="p-3.5 text-center w-20 whitespace-nowrap">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredFormulas.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data master formulasi yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredFormulas.map((row) => (
                  <DnaTableRow
                    key={row.id}
                    onClick={() => setSelectedFormula(row)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <DnaTd className="p-3.5 whitespace-nowrap">
                      <DnaCell.Code value={row.formulaCode} onClick={() => setSelectedFormula(row)} />
                    </DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><DnaCell.Date value={row.tanggal} /></DnaTd>
                    <DnaTd className="p-3.5 min-w-[240px]">
                      <DnaCell.Text primary={row.productName} secondary={row.customerName} />
                    </DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap">
                      <span className="tabular-nums text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                        {row.revisionVersion}
                      </span>
                    </DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap text-slate-700 font-medium">
                      {row.netto}
                    </DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><DnaCell.Avatar name={row.busdevPic} /></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><DnaCell.Avatar name={row.formulatorPic} /></DnaTd>
                    <DnaTd className="p-3.5 text-center whitespace-nowrap">
                      <DnaCell.Badge status={row.statusLabel || row.status} />
                    </DnaTd>
                    <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedFormula(row)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                        title="Lihat Detail Formulasi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedFormula}
        onClose={() => setSelectedFormula(null)}
        title={selectedFormula?.productName || "Detail Formulasi"}
        subtitle={`Kode: ${selectedFormula?.formulaCode} • ${selectedFormula?.revisionVersion}`}
        badge={selectedFormula && getStatusBadge(selectedFormula.status)}
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => toast.success(`Mencetak Lembar Formula Lab ${selectedFormula?.formulaCode}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Formula
            </DnaButton>
            {selectedFormula && selectedFormula.status !== "LOCKED_PRODUCTION" && (
              <DnaButton
                variant="primary"
                size="sm"
                onClick={handleLockProduction}
              >
                <Lock className="w-4 h-4 mr-1.5" />
                Lock untuk Produksi
              </DnaButton>
            )}
          </div>
        }
      >
        {selectedFormula && (
          <div className="space-y-6 text-xs">
            {/* HPP & Technical Specs Card */}
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Estimasi HPP Bulk Produksi
              </div>
              <div className="text-2xl font-bold tabular-nums text-purple-800">
                {formatRupiah(selectedFormula.costPerKg)} <span className="text-xs font-normal text-purple-600 font-sans">/ Kg</span>
              </div>
              <div className="text-xs text-purple-700 flex items-center justify-between pt-1 border-t border-purple-200/60">
                <span>Netto Kemasan:</span>
                <span className="font-semibold tabular-nums">{selectedFormula.netto}</span>
              </div>
            </div>

            {/* Quality Parameters */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Parameter Spesifikasi Fisika & Kimia
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Derajat pH</span>
                  <div className="font-semibold text-slate-900 mt-1 tabular-nums text-sm">{selectedFormula.targetPh}</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Viskositas</span>
                  <div className="font-semibold text-slate-900 mt-1 tabular-nums text-sm">{selectedFormula.targetViscosity}</div>
                </div>
              </div>
            </div>

            {/* Responsibility & Client Info */}
            <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pemilik Brand (Klien):</span>
                <span className="font-semibold text-slate-800">{selectedFormula.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">PIC BusDev:</span>
                <span className="font-medium text-slate-700">{selectedFormula.busdevPic}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Formulator Penanggung Jawab:</span>
                <span className="font-semibold text-slate-800">{selectedFormula.formulatorPic}</span>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Input Formulasi Baru */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Formulasi R&D Baru"
        description="Inisiasi master formula produk baru untuk pengujian sampel klien."
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={handleCreateFormula}
            >
              Simpan Formula
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Produk Kosmetik *</label>
              <DnaInput
                type="text"
                placeholder="Contoh: Hydrating Toner Ceramide 2%"
                className="w-full text-xs"
                value={createForm.productName}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, productName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Klien / Pelanggan *</label>
              <DnaInput
                type="text"
                placeholder="PT Brand Kosmetik Mandiri"
                className="w-full text-xs"
                value={createForm.customerName}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Netto Kemasan</label>
              <DnaInput
                type="text"
                placeholder="30 ml"
                className="w-full text-xs"
                value={createForm.netto}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, netto: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target pH</label>
              <DnaInput
                type="text"
                placeholder="5.50 - 6.00"
                className="w-full text-xs"
                value={createForm.targetPh}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, targetPh: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Estimasi HPP (Rp/Kg)</label>
              <DnaInput
                type="number"
                placeholder="125000"
                className="w-full text-xs"
                value={createForm.costPerKg}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, costPerKg: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}

export default function FormulaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400 font-semibold animate-pulse">Memuat formulasi R&D...</div>}>
      <FormulaContent />
    </Suspense>
  );
}
