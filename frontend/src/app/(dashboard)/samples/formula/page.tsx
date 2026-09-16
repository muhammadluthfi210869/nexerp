"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Layers,
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
  FlaskConical,
  Edit2,
  X,
  History,
  Send,
  Lock
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
    costPerKg: 145000
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
    costPerKg: 185000
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
    costPerKg: 95000
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
    costPerKg: 240000
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
    costPerKg: 175000
  }
];

function FormulaContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // "adjustment" | "manage" | null
  const [formulas, setFormulas] = useState<ProductFormula[]>(INITIAL_FORMULAS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedFormula, setSelectedFormula] = useState<ProductFormula | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const toast = useDnaToast();

  // Filtered Formulas
  const filteredFormulas = useMemo(() => {
    return formulas.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        f.formulaCode.toLowerCase().includes(q) ||
        f.productName.toLowerCase().includes(q) ||
        f.customerName.toLowerCase().includes(q) ||
        f.formulatorPic.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [formulas, searchQuery, statusFilter]);

  const totalFormulas = formulas.length;
  const lockedCount = formulas.filter((f) => f.status === "LOCKED_PRODUCTION").length;
  const trialCount = formulas.filter((f) => f.status === "LAB_TRIAL" || f.status === "STABILITY_TEST").length;

  const handleAdjustFormula = (formula: ProductFormula) => {
    setSelectedFormula(formula);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Penyesuaian Formula Disimpan", "Versi revisi formula baru berhasil diarsipkan.");
    setIsAdjustModalOpen(false);
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title={
          mode === "adjustment"
            ? "Penyesuaian Formulasi Kosmetik"
            : mode === "manage"
            ? "Kelola Formulasi & INCI Repository"
            : "Formulasi R&D Kosmetik"
        }
        description="Pusat data master formula kosmetik maklon, revisi batch lab, dan spesifikasi HPP bulk (1:1 G-SERP Parity)."
        breadcrumbs={[
          { label: "Operasional", href: "/dashboard-rnd" },
          { label: "Pra Produksi", href: "/formulation" },
          { label: "Formulasi", href: "/formulation" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Excel", "Data formulasi berhasil diekspor.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Formulasi Baru
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="TOTAL MASTER FORMULA"
          value={`${totalFormulas} Formula`}
          subValue="INCI & Spesifikasi Terdaftar"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="LOCKED (SIAP PRODUKSI)"
          value={`${lockedCount} Formula`}
          subValue="Terkonfirmasi CPKB Pabrik"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="DALAM UJI STABILITAS / TRIAL"
          value={`${trialCount} Formula`}
          subValue="Oven 40°C & Suhu Kamar"
          icon={<Clock className="w-5 h-5 text-purple-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable (1:1 G-SERP Row 136, 137, 138 — EXACT 11 COLUMNS) */}
      <DnaDataTableCard
        title="Daftar Master Formulasi Kosmetik"
        description="Struktur formulasi aktif, nomor revisi, volume netto, formulator penanggung jawab, dan status lisensi."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode formula, produk, pelanggan, formulator..."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="LOCKED_PRODUCTION">Locked (Siap Produksi)</option>
              <option value="STABILITY_TEST">Uji Stabilitas Lab</option>
              <option value="LAB_TRIAL">Trial Formulasi</option>
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
                <th className="py-3 px-3">Nama Produk</th>
                <th className="py-3 px-3 text-center w-16">Rev</th>
                <th className="py-3 px-3 text-right w-16">Netto</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3 w-24">BusDev</th>
                <th className="py-3 px-3 w-36">Formulator</th>
                <th className="py-3 px-3 text-center w-28">Status</th>
                <th className="py-3 px-3 text-center w-28">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFormulas.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada data formulasi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredFormulas.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{row.formulaCode}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{row.tanggal}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.productName}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600">{row.revisionVersion}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{row.netto}</td>
                    <td className="py-3 px-3 text-slate-700">{row.customerName}</td>
                    <td className="py-3 px-3 text-slate-600">{row.busdevPic}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{row.formulatorPic}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === "LOCKED_PRODUCTION"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.status === "STABILITY_TEST"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedFormula(row)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Lihat Detail Formulasi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAdjustFormula(row)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                          title="Sesuaikan Formula (SCR-137)"
                        >
                          <Edit2 className="w-4 h-4" />
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

      {/* 4. Modal Detail Formulasi & Komposisi Fase */}
      {selectedFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{selectedFormula.productName}</h3>
                <p className="text-xs font-mono text-blue-600">{selectedFormula.formulaCode} • {selectedFormula.revisionVersion}</p>
              </div>
              <button onClick={() => setSelectedFormula(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Klien:</span>
                <span className="font-semibold text-slate-900">{selectedFormula.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Formulator:</span>
                <span className="font-medium text-slate-800">{selectedFormula.formulatorPic}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Target pH:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedFormula.targetPh}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Target Viskositas:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedFormula.targetViscosity}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Biaya HPP Bulk / Kg:</span>
                <span className="font-mono font-bold text-emerald-600">Rp {selectedFormula.costPerKg.toLocaleString("id-ID")}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Status Lisensi:</span>
                <span className="font-bold text-slate-700">{selectedFormula.statusLabel}</span>
              </div>
            </div>

            {/* Fase Komposisi Bahan */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-700">
                Komposisi Fase Formulasi Lab (INCI Standard):
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="p-2.5">Fase</th>
                    <th className="p-2.5">Nama Bahan / INCI</th>
                    <th className="p-2.5 text-center">Konsentrasi (%)</th>
                    <th className="p-2.5">Fungsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-blue-600">Fase A</td>
                    <td className="p-2.5 font-semibold text-slate-800">Aqua Demineralisata</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-700">75.50 %</td>
                    <td className="p-2.5 text-slate-500">Solvent / Carrier</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-amber-600">Fase B</td>
                    <td className="p-2.5 font-semibold text-slate-800">Glycerin & Butylene Glycol</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-700">14.50 %</td>
                    <td className="p-2.5 text-slate-500">Humectant / Moisture</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-purple-600">Fase C</td>
                    <td className="p-2.5 font-semibold text-slate-800">Niacinamide PC Grade 99%</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-700">10.00 %</td>
                    <td className="p-2.5 text-slate-500">Active Brightening</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <DnaButton variant="outline" onClick={() => setSelectedFormula(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Penyesuaian Formulasi (SCR-137) */}
      {isAdjustModalOpen && selectedFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Sesuaikan Formulasi (SCR-137)</h3>
                <p className="text-xs text-slate-500">{selectedFormula.formulaCode} • {selectedFormula.productName}</p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Versi Revisi Baru</label>
                <Input defaultValue={`Rev ${parseFloat(selectedFormula.revisionVersion.replace('Rev ', '')) + 0.1}`} className="h-8 text-xs font-mono font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Target pH</label>
                  <Input defaultValue={selectedFormula.targetPh} className="h-8 text-xs font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Target Viskositas</label>
                  <Input defaultValue={selectedFormula.targetViscosity} className="h-8 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Catatan Penyesuaian Formulator</label>
                <Input placeholder="Alasan penyesuaian (misal peningkatan stabilitas viskositas)..." className="h-8 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <DnaButton type="button" variant="outline" onClick={() => setIsAdjustModalOpen(false)}>
                  Batal
                </DnaButton>
                <DnaButton type="submit" variant="primary">
                  Simpan Revisi Formula
                </DnaButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </DnaPageContainer>
  );
}

export default function FormulaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Memuat Formulasi...</div>}>
      <FormulaContent />
    </Suspense>
  );
}
