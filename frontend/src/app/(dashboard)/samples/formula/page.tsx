"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

const INITIAL_FORMULAS: ProductFormula[] = [
  {
    id: "form-01",
    formulaCode: "FORM-2026-0001",
    tanggal: "2026-03-08",
    productName: "Brightening Glow Serum 10% Niacinamide",
    revisionVersion: "Rev 2.0",
    netto: "30 ml",
    customerName: "PT Cantika Glow Nusantara",
    busdevPic: "Sari Dewi",
    formulatorPic: "Apt. Dedi Kurniawan, S.Farm",
    status: "LOCKED_PRODUCTION",
    statusLabel: "Locked (Siap Produksi)",
    targetPh: "5.50 - 6.00",
    targetViscosity: "1,500 - 2,500 cPs",
    costPerKg: 145000,
  },
  {
    id: "form-02",
    formulaCode: "FORM-2026-0002",
    tanggal: "2026-03-07",
    productName: "Ceramide 5X Barrier Repair Moisturizer",
    revisionVersion: "Rev 1.1",
    netto: "50 gr",
    customerName: "PT Miracle Beauty Lab",
    busdevPic: "Rendi BusDev",
    formulatorPic: "Dr. Maya Sp.KK",
    status: "STABILITY_TEST",
    statusLabel: "Uji Stabilitas Lab",
    targetPh: "5.00 - 5.50",
    targetViscosity: "30,000 - 45,000 cPs",
    costPerKg: 185000,
  },
  {
    id: "form-03",
    formulaCode: "FORM-2026-0003",
    tanggal: "2026-03-05",
    productName: "Soothing Acne Gel Cica + Tea Tree",
    revisionVersion: "Rev 1.0",
    netto: "30 gr",
    customerName: "PT Cantika Herbal Nusantara",
    busdevPic: "Rina BusDev",
    formulatorPic: "Apt. Dedi Kurniawan, S.Farm",
    status: "LAB_TRIAL",
    statusLabel: "Trial Formulasi Lab",
    targetPh: "5.50 - 6.20",
    targetViscosity: "10,000 - 15,000 cPs",
    costPerKg: 95000,
  },
  {
    id: "form-04",
    formulaCode: "FORM-2026-0004",
    tanggal: "2026-03-01",
    productName: "Hydrating Lip Oil Peptide Tint",
    revisionVersion: "Rev 1.0",
    netto: "5 ml",
    customerName: "CV Royal Beauty Luxe",
    busdevPic: "Siti BusDev",
    formulatorPic: "Budi Prakoso, S.Farm",
    status: "LOCKED_PRODUCTION",
    statusLabel: "Locked (Siap Produksi)",
    targetPh: "N/A (Anhydrous)",
    targetViscosity: "4,000 - 6,000 cPs",
    costPerKg: 240000,
  },
  {
    id: "form-05",
    formulaCode: "FORM-2026-0005",
    tanggal: "2026-02-28",
    productName: "Sunscreen Glow Gel Hybrid SPF 50",
    revisionVersion: "Rev 3.0",
    netto: "30 gr",
    customerName: "PT Sinar Indah Kosmetika",
    busdevPic: "Maya BusDev",
    formulatorPic: "Aisyah Putri, S.Si",
    status: "LOCKED_PRODUCTION",
    statusLabel: "Locked (Siap Produksi)",
    targetPh: "6.00 - 6.50",
    targetViscosity: "18,000 - 25,000 cPs",
    costPerKg: 175000,
  },
];

function FormulaContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const [formulas, setFormulas] = useState<ProductFormula[]>(INITIAL_FORMULAS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedFormula, setSelectedFormula] = useState<ProductFormula | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const toast = useDnaToast();

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
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">KODE FORMULA</th>
                <th className="p-3.5 w-28 min-w-[110px] whitespace-nowrap">TANGGAL</th>
                <th className="p-3.5 min-w-[240px]">PRODUK &amp; KLIEN</th>
                <th className="p-3.5 w-24 min-w-[90px] whitespace-nowrap">VERSI</th>
                <th className="p-3.5 w-24 min-w-[90px] whitespace-nowrap">NETTO</th>
                <th className="p-3.5 w-36 min-w-[140px] whitespace-nowrap">BUSDEV PIC</th>
                <th className="p-3.5 w-40 min-w-[150px] whitespace-nowrap">FORMULATOR</th>
                <th className="p-3.5 w-36 min-w-[120px] text-center whitespace-nowrap">STATUS</th>
                <th className="p-3.5 text-center w-20 whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFormulas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data master formulasi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredFormulas.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedFormula(row)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 whitespace-nowrap">
                      <DnaCell.Code value={row.formulaCode} onClick={() => setSelectedFormula(row)} />
                    </td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Date value={row.tanggal} /></td>
                    <td className="p-3.5 min-w-[240px]">
                      <DnaCell.Text primary={row.productName} secondary={row.customerName} />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                        {row.revisionVersion}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-700 font-medium">
                      {row.netto}
                    </td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Avatar name={row.busdevPic} /></td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Avatar name={row.formulatorPic} /></td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <DnaCell.Badge status={row.statusLabel || row.status} />
                    </td>
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedFormula(row)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                        title="Lihat Detail Formulasi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                onClick={() => {
                  setFormulas((prev) =>
                    prev.map((f) =>
                      f.id === selectedFormula.id
                        ? { ...f, status: "LOCKED_PRODUCTION", statusLabel: "Locked (Siap Produksi)" }
                        : f
                    )
                  );
                  setSelectedFormula((prev) =>
                    prev ? { ...prev, status: "LOCKED_PRODUCTION", statusLabel: "Locked (Siap Produksi)" } : null
                  );
                  toast.success("Formula berhasil di-lock untuk produksi massal CPKB.");
                }}
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
              <div className="text-2xl font-bold font-mono text-purple-800">
                {formatRupiah(selectedFormula.costPerKg)} <span className="text-xs font-normal text-purple-600 font-sans">/ Kg</span>
              </div>
              <div className="text-xs text-purple-700 flex items-center justify-between pt-1 border-t border-purple-200/60">
                <span>Netto Kemasan:</span>
                <span className="font-semibold font-mono">{selectedFormula.netto}</span>
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
                  <div className="font-semibold text-slate-900 mt-1 font-mono text-sm">{selectedFormula.targetPh}</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Viskositas</span>
                  <div className="font-semibold text-slate-900 mt-1 font-mono text-sm">{selectedFormula.targetViscosity}</div>
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
              onClick={() => {
                toast.success("Master formula baru berhasil diarsipkan.");
                setIsCreateModalOpen(false);
              }}
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
              <DnaInput type="text" placeholder="Contoh: Hydrating Toner Ceramide 2%" className="w-full text-xs" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Klien / Pelanggan *</label>
              <DnaInput type="text" placeholder="PT Brand Kosmetik Mandiri" className="w-full text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Netto Kemasan</label>
              <DnaInput type="text" placeholder="30 ml" className="w-full text-xs" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target pH</label>
              <DnaInput type="text" placeholder="5.50 - 6.00" className="w-full text-xs" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Estimasi HPP (Rp/Kg)</label>
              <DnaInput type="number" placeholder="125000" className="w-full text-xs" />
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
