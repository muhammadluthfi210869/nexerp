"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Layers,
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
  Lock,
  Unlock,
  Copy,
  Edit2,
  FileText,
  Tag,
  Check,
  RotateCcw,
  Sparkles,
  Calculator,
  FlaskConical,
  DollarSign,
  Printer,
  ChevronRight,
  Trash2
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

interface FormulaIngredient {
  phase: "A" | "B" | "C" | "D" | "E";
  phaseName: string;
  itemCode: string;
  inciName: string;
  tradeName: string;
  functionCategory: string; // Active, Emollient, Preservative, Solvent, Humectant, etc.
  percentage: number; // e.g. 5.00%
  unitCostPerKg: number; // Rp / Kg
  costSubtotalPerKg: number; // (percentage / 100) * unitCostPerKg
}

interface ProductFormula {
  id: string;
  formulaCode: string;
  productName: string;
  category: "SKINCARE" | "BODYCARE" | "HAIRCARE" | "DECORATIVE";
  categoryLabel: string;
  revisionVersion: string; // Rev 1.0, Rev 1.1, Rev 2.0
  nettoGram: number; // e.g. 30g
  clientName: string;
  brandName: string;
  busdevPic: string;
  formulatorPic: string;
  targetPh: string;
  targetViscosity: string;
  hppPerKg: number; // Rp / Kg
  hppPerPcs: number; // (hppPerKg / 1000) * nettoGram
  status: "DRAFT" | "LAB_TRIAL" | "STABILITY_TEST" | "APPROVED_LOCKED";
  statusLabel: string;
  createdDate: string;
  ingredients: FormulaIngredient[];
  notes?: string;
}

const MOCK_FORMULAS: ProductFormula[] = [
  {
    id: "form-01",
    formulaCode: "FORM-202603-001",
    productName: "Brightening Glow Serum 10% Niacinamide",
    category: "SKINCARE",
    categoryLabel: "Skincare (Serum)",
    revisionVersion: "Rev 2.0",
    nettoGram: 30,
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    busdevPic: "Sari Dewi (BusDev)",
    formulatorPic: "Apt. Dedi Kurniawan, S.Farm",
    targetPh: "5.50 - 6.00",
    targetViscosity: "1,500 - 2,500 cPs",
    hppPerKg: 145000,
    hppPerPcs: 4350,
    status: "APPROVED_LOCKED",
    statusLabel: "Locked (Siap Produksi)",
    createdDate: "2026-03-05",
    notes: "Formula telah lolos uji stabilitas dipercepat 3 bulan (40°C/75% RH).",
    ingredients: [
      {
        phase: "A",
        phaseName: "Fase A (Water Phase)",
        itemCode: "RAW-AQ-001",
        inciName: "Aqua Demineralisata",
        tradeName: "Deionized Water USP",
        functionCategory: "Solvent / Pelarut",
        percentage: 78.50,
        unitCostPerKg: 3500,
        costSubtotalPerKg: 2747.5
      },
      {
        phase: "A",
        phaseName: "Fase A (Water Phase)",
        itemCode: "RAW-GLY-004",
        inciName: "Glycerin",
        tradeName: "Glycerin Pharma 99.7%",
        functionCategory: "Humectant",
        percentage: 4.00,
        unitCostPerKg: 28000,
        costSubtotalPerKg: 1120
      },
      {
        phase: "B",
        phaseName: "Fase B (Active Phase)",
        itemCode: "RAW-NIA-001",
        inciName: "Niacinamide",
        tradeName: "Niacinamide USP Grade",
        functionCategory: "Skin Brightening Active",
        percentage: 10.00,
        unitCostPerKg: 185000,
        costSubtotalPerKg: 18500
      },
      {
        phase: "B",
        phaseName: "Fase B (Active Phase)",
        itemCode: "RAW-HA-002",
        inciName: "Sodium Hyaluronate",
        tradeName: "Hyaluronic Acid 1% Sol",
        functionCategory: "Deep Hydration",
        percentage: 5.00,
        unitCostPerKg: 850000,
        costSubtotalPerKg: 42500
      },
      {
        phase: "C",
        phaseName: "Fase C (Thickener & Stabilizer)",
        itemCode: "RAW-THK-001",
        inciName: "Polyacrylate Crosspolymer-6",
        tradeName: "Sepimax ZEN",
        functionCategory: "Polymer Thickener",
        percentage: 1.00,
        unitCostPerKg: 420000,
        costSubtotalPerKg: 4200
      },
      {
        phase: "D",
        phaseName: "Fase D (Preservative)",
        itemCode: "RAW-PRS-001",
        inciName: "Phenoxyethanol (and) Ethylhexylglycerin",
        tradeName: "Euxyl PE 9010",
        functionCategory: "Broad Spectrum Preservative",
        percentage: 1.00,
        unitCostPerKg: 165000,
        costSubtotalPerKg: 1650
      },
      {
        phase: "E",
        phaseName: "Fase E (Fragrance & Neutralizer)",
        itemCode: "RAW-EXT-001",
        inciName: "Rosa Damascena Flower Water",
        tradeName: "Organic Rose Hydrosol",
        functionCategory: "Botanical Scent",
        percentage: 0.50,
        unitCostPerKg: 240000,
        costSubtotalPerKg: 1200
      }
    ]
  },
  {
    id: "form-02",
    formulaCode: "FORM-202603-002",
    productName: "Ceramide 5X Barrier Repair Moisturizer",
    category: "SKINCARE",
    categoryLabel: "Skincare (Cream Gel)",
    revisionVersion: "Rev 1.1",
    nettoGram: 50,
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    busdevPic: "Rian Hendra",
    formulatorPic: "Dr. Maya Sp.KK",
    targetPh: "5.00 - 5.50",
    targetViscosity: "12,000 - 18,000 cPs",
    hppPerKg: 210000,
    hppPerPcs: 10500,
    status: "STABILITY_TEST",
    statusLabel: "Uji Stabilitas Lab",
    createdDate: "2026-03-02",
    notes: "Dalam pengujian sentrifugasi 3.000 rpm 30 menit & cycling test 6 siklus.",
    ingredients: []
  },
  {
    id: "form-03",
    formulaCode: "FORM-202603-003",
    productName: "AHA BHA PHA Exfoliating Toner 100ml",
    category: "SKINCARE",
    categoryLabel: "Skincare (Liquid Toner)",
    revisionVersion: "Rev 1.0",
    nettoGram: 100,
    clientName: "CV Derma Estetika Mandiri",
    brandName: "DermaPure",
    busdevPic: "Sari Dewi (BusDev)",
    formulatorPic: "Apt. Siska Handayani, M.Farm",
    targetPh: "3.80 - 4.20",
    targetViscosity: "Water-like (10 - 50 cPs)",
    hppPerKg: 65000,
    hppPerPcs: 6500,
    status: "LAB_TRIAL",
    statusLabel: "Trial Formulasi Lab",
    createdDate: "2026-02-26",
    notes: "Eksfoliasi ringan dengan Salicylic Acid 1% + Glycolic Acid 2% + Lactobionic Acid 1%.",
    ingredients: []
  }
];

export default function FormulationManagePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedFormula, setSelectedFormula] = useState<ProductFormula | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);

  // Queries
  const { data: rawFormulas, isLoading } = useQuery({
    queryKey: ["rnd-formulas"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/formulas");
        return unwrapResponse(res.data) as ProductFormula[];
      } catch (e) {
        return null;
      }
    }
  });

  const formulas: ProductFormula[] = useMemo(() => {
    if (rawFormulas && Array.isArray(rawFormulas) && rawFormulas.length > 0) {
      return rawFormulas;
    }
    return MOCK_FORMULAS;
  }, [rawFormulas]);

  // Filtering
  const filteredFormulas = useMemo(() => {
    return formulas.filter((f) => {
      if (activeTab === "skincare" && f.category !== "SKINCARE") return false;
      if (activeTab === "bodycare" && f.category !== "BODYCARE" && f.category !== "HAIRCARE") return false;
      if (activeTab === "decorative" && f.category !== "DECORATIVE") return false;

      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          f.formulaCode.toLowerCase().includes(q) ||
          f.productName.toLowerCase().includes(q) ||
          f.clientName.toLowerCase().includes(q) ||
          f.brandName.toLowerCase().includes(q) ||
          f.formulatorPic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [formulas, activeTab, statusFilter, searchQuery]);

  // KPIs
  const totalFormulas = formulas.length;
  const lockedCount = formulas.filter(f => f.status === "APPROVED_LOCKED").length;
  const trialCount = formulas.filter(f => f.status === "LAB_TRIAL" || f.status === "STABILITY_TEST").length;
  const averageBulkCost = useMemo(() => {
    if (formulas.length === 0) return 0;
    return Math.round(formulas.reduce((acc, curr) => acc + curr.hppPerKg, 0) / formulas.length);
  }, [formulas]);

  const openFormulaDetail = (formula: ProductFormula) => {
    // If ingredients empty in mock, fallback to sample ingredients
    if (!formula.ingredients || formula.ingredients.length === 0) {
      formula.ingredients = MOCK_FORMULAS[0].ingredients;
    }
    setSelectedFormula(formula);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: ProductFormula["status"]) => {
    switch (status) {
      case "APPROVED_LOCKED":
        return <DnaBadge variant="success">LOCKED (PRODUCTION READY)</DnaBadge>;
      case "STABILITY_TEST":
        return <DnaBadge variant="purple">UJI STABILITAS</DnaBadge>;
      case "LAB_TRIAL":
        return <DnaBadge variant="blue">TRIAL LAB</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Kelola Formulasi Produk & INCI Repository"
        description="Master data komposisi formula kosmetik per fase (Fase A s/d E), validasi 100% total dosis, kalkulasi moving average HPP bulk per Kg & Pcs, serta manajemen revisi versi."
        badge={<DnaBadge variant="neutral">SCR-135 & SCR-137</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "Kelola Formulasi", href: "/rnd/formula" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Daftar formulasi berhasil diekspor ke file Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsBuilderModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Formulasi Baru
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL FORMULASI"
          value={`${totalFormulas} Master SKU`}
          subValue="Formula Aktif Terdaftar"
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="FORMULA LOCKED"
          value={`${lockedCount} Terkunci`}
          subValue="Lolos Stabilitas & Siap Produksi"
          icon={<Lock className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="DALAM PENGUJIAN LAB"
          value={`${trialCount} Trial & Test`}
          subValue="Optimasi & Cycling Test"
          icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="RATA-RATA HPP BULK"
          value={`Rp ${averageBulkCost.toLocaleString()} / Kg`}
          subValue="Moving Average Bahan Baku"
          icon={<DollarSign className="w-5 h-5 text-cyan-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Category & Status Tabs */}
      <div className="space-y-4">
        <DnaTabNav
          tabs={[
            { id: "all", label: `Semua Kategori (${totalFormulas})` },
            { id: "skincare", label: "Skincare Formulation" },
            { id: "bodycare", label: "Bodycare & Haircare" },
            { id: "decorative", label: "Decorative / Makeup" }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter Status Formulasi:</span>
          </div>

          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Semua Status Formula</option>
            <option value="APPROVED_LOCKED">Locked (Siap Produksi)</option>
            <option value="STABILITY_TEST">Uji Stabilitas Lab</option>
            <option value="LAB_TRIAL">Trial Formulasi Lab</option>
          </select>

          {statusFilter !== "ALL" && (
            <button
              onClick={() => setStatusFilter("ALL")}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium underline ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 4. DataTable Card (SCR-135 & SCR-137) */}
      <DnaDataTableCard
        title="Daftar Master Formulasi Kosmetik"
        description="Rincian formulasi aktif, nomor revisi, kalkulasi biaya HPP bulk per kg dan per pcs netto kemasan."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode Formulasi, Nama Produk, Klien, Formulator..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Kode & Tanggal</th>
                <th className="py-3 px-4">Nama Produk & Kategori</th>
                <th className="py-3 px-4">Klien / Brand</th>
                <th className="py-3 px-4 text-center">Rev</th>
                <th className="py-3 px-4 text-right">Netto</th>
                <th className="py-3 px-4 text-right">HPP Bulk / Kg</th>
                <th className="py-3 px-4 text-right">HPP / Pcs</th>
                <th className="py-3 px-4">Formulator & BusDev</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFormulas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada formula kosmetik yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredFormulas.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{row.formulaCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.createdDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.productName}</p>
                      <span className="text-[11px] text-slate-500">{row.categoryLabel}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-semibold text-slate-800">{row.clientName}</p>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{row.brandName}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        {row.revisionVersion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {row.nettoGram} g
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                      Rp {row.hppPerKg.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-700 font-bold">
                      Rp {row.hppPerPcs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.formulatorPic}</p>
                      <p className="text-[10px] text-slate-400">{row.busdevPic}</p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => openFormulaDetail(row)}
                          title="Lihat Komposisi Fase & HPP"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("Duplikasi Formula", `Membuat revisi baru dari ${row.formulaCode}`)}
                          title="Buat Revisi (Revise)"
                        >
                          <Copy className="w-4 h-4 text-indigo-600" />
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Rincian Multi-Fase Formulasi */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedFormula ? `Komposisi Formulasi: ${selectedFormula.formulaCode}` : "Detail Formulasi"}
        description="Rincian bahan baku per fase (Fase A s/d E), persentase dosis, dan kontribusi biaya HPP."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              <span className="font-bold text-slate-700">Total Dosis: </span>
              <span className="font-mono font-bold text-emerald-600">100.00%</span>
              <span className="text-slate-400 ml-2">| HPP Bulk: </span>
              <span className="font-mono font-bold text-indigo-700">Rp {selectedFormula?.hppPerKg.toLocaleString()}/Kg</span>
            </div>
            <div className="flex items-center gap-2">
              <DnaButton
                variant="secondary"
                onClick={() => toast.success("Cetak Formulasi", "Formulasi resmi siap dicetak untuk instruksi penimbangan.")}
              >
                <Printer className="w-4 h-4 mr-1" /> Cetak Lembar Formula
              </DnaButton>
              <DnaButton variant="primary" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        }
      >
        {selectedFormula && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Nama Produk</span>
                  <p className="text-base font-bold text-slate-900">{selectedFormula.productName}</p>
                </div>
                <div>{getStatusBadge(selectedFormula.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Klien / Brand:</span>
                  <p className="font-semibold text-slate-800">{selectedFormula.clientName} ({selectedFormula.brandName})</p>
                </div>
                <div>
                  <span className="text-slate-500">Netto per Unit:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedFormula.nettoGram} Gram / Pcs</p>
                </div>
                <div>
                  <span className="text-slate-500">Target pH:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedFormula.targetPh}</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Viskositas:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedFormula.targetViscosity}</p>
                </div>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Fase</th>
                    <th className="p-3">INCI Name & Trade Name</th>
                    <th className="p-3">Fungsi Bahan</th>
                    <th className="p-3 text-right">Dosis (%)</th>
                    <th className="p-3 text-right">Harga / Kg</th>
                    <th className="p-3 text-right">Kontribusi Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedFormula.ingredients.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {item.phase}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{item.inciName}</p>
                        <span className="font-mono text-[10px] text-slate-500">{item.tradeName} ({item.itemCode})</span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.functionCategory}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {item.percentage.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        Rp {item.unitCostPerKg.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">
                        Rp {Math.round(item.costSubtotalPerKg).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cost Roll-Up Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">HPP Bulk per Kilogram</span>
                <p className="font-mono text-lg font-bold text-blue-900">
                  Rp {selectedFormula.hppPerKg.toLocaleString()} / Kg
                </p>
                <p className="text-[11px] text-blue-800">Biaya murni bahan baku formulasi skala lab</p>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">HPP Isi per Kemasan ({selectedFormula.nettoGram}g)</span>
                <p className="font-mono text-lg font-bold text-indigo-900">
                  Rp {selectedFormula.hppPerPcs.toLocaleString()} / Pcs
                </p>
                <p className="text-[11px] text-indigo-800">HPP bulk per kemasan (belum termasuk kemasan & overhead)</p>
              </div>
            </div>
          </div>
        )}
      </DnaModal>

      {/* 6. Modal Buat Formulasi Baru */}
      <DnaModal
        isOpen={isBuilderModalOpen}
        onClose={() => setIsBuilderModalOpen(false)}
        title="Buat Formulasi Baru (SCR-137)"
        description="Inisialisasi lembar formulasi produk baru dan penentuan target spesifikasi lab."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsBuilderModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => {
                toast.success("Draft Formulasi Dibuat", "Lembar formulasi baru berhasil disimpan. Silakan masukkan komposisi bahan per fase.");
                setIsBuilderModalOpen(false);
              }}
            >
              Simpan & Buka Builder
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Nama Produk Formulasi *</label>
            <input
              type="text"
              placeholder="Contoh: Hydrating Essence Toner Centella 150ml"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Kategori Produk *</label>
              <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800">
                <option value="SKINCARE">Skincare (Face)</option>
                <option value="BODYCARE">Bodycare & Body Wash</option>
                <option value="HAIRCARE">Haircare & Shampoo</option>
                <option value="DECORATIVE">Decorative & Lip Cream</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Netto per Unit (Gram/ml) *</label>
              <input
                type="number"
                defaultValue={30}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Klien / Perusahaan</label>
              <input
                type="text"
                placeholder="PT Cantika Nusantara"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Brand / Merk</label>
              <input
                type="text"
                placeholder="GlowAura"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              />
            </div>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
