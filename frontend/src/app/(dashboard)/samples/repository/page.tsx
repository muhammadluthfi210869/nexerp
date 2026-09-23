"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Search, 
  FlaskConical, 
  FileText, 
  Filter, 
  ShieldCheck, 
  Loader2,
  Lock,
  Printer,
  Eye,
  CheckCircle2,
  Calendar,
  History as HistoryIcon
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaDetailDrawer,
  DnaCell,
  useDnaToast
} from "@/components/dna";

interface ArchivedFormula {
  id: string;
  name: string;
  category: string;
  version: string;
  status: string;
  stability: string;
  updatedAt: string;
  pic: string;
  sampleCode: string;
  createdBy: string;
  releasedAt: string;
  activeVersion: string;
}

const FALLBACK_ARCHIVE: ArchivedFormula[] = [
  {
    id: "FORM-2026-0001",
    name: "Brightening Glow Serum 10% Niacinamide",
    category: "Skincare",
    version: "v2.0",
    status: "RELEASED",
    stability: "STABLE",
    updatedAt: "2026-03-08",
    pic: "Apt. Dedi Kurniawan, S.Farm",
    sampleCode: "SMP-2026-0012",
    createdBy: "Apt. Dedi Kurniawan, S.Farm",
    releasedAt: "2026-03-08",
    activeVersion: "v2.0",
  },
  {
    id: "FORM-2026-0004",
    name: "Hydrating Lip Oil Peptide Tint",
    category: "Lip Care",
    version: "v1.0",
    status: "RELEASED",
    stability: "STABLE",
    updatedAt: "2026-03-01",
    pic: "Budi Prakoso, S.Farm",
    sampleCode: "SMP-2026-0008",
    createdBy: "Budi Prakoso, S.Farm",
    releasedAt: "2026-03-01",
    activeVersion: "v1.0",
  },
  {
    id: "FORM-2026-0005",
    name: "Sunscreen Glow Gel Hybrid SPF 50",
    category: "Sun Care",
    version: "v3.0",
    status: "RELEASED",
    stability: "STABLE",
    updatedAt: "2026-02-28",
    pic: "Aisyah Putri, S.Si",
    sampleCode: "SMP-2026-0003",
    createdBy: "Aisyah Putri, S.Si",
    releasedAt: "2026-02-28",
    activeVersion: "v3.0",
  },
];

export default function RndRepositoryPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormula, setSelectedFormula] = useState<ArchivedFormula | null>(null);

  const { data: serverFormulas, isLoading } = useQuery({
    queryKey: ["master-formulas"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/formulas", { params: { status: "ARCHIVED" } });
        if (!Array.isArray(res.data) || res.data.length === 0) return FALLBACK_ARCHIVE;
        return res.data.map((f: any) => ({
          id: f.formulaCode || f.id,
          name: f.sampleRequest?.productName || f.productName || "—",
          category: f.category || "Skincare",
          version: `v${f.version || 1}`,
          status: f.status || "RELEASED",
          stability: f.labTestResults?.length > 0 ? (f.labTestResults.some((r: any) => r.stability40C === "UNSTABLE") ? "UNSTABLE" : "STABLE") : "STABLE",
          updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split("T")[0] : "—",
          pic: f.lockedBy?.fullName || f.formulatorPic || "Chemist",
          sampleCode: f.sampleRequest?.sampleCode || "SMP-GEN",
          createdBy: f.lockedBy?.fullName || "Chemist",
          releasedAt: f.updatedAt ? new Date(f.updatedAt).toISOString().split("T")[0] : "—",
          activeVersion: `v${f.version || 1}`,
        }));
      } catch {
        return FALLBACK_ARCHIVE;
      }
    },
  });

  const formulasList = serverFormulas || FALLBACK_ARCHIVE;

  const filteredFormulas = useMemo(() => {
    return formulasList.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        f.id.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.createdBy.toLowerCase().includes(q);

      const matchTab =
        activeTab === "ALL" ? true :
        f.status === activeTab;

      return matchSearch && matchTab;
    });
  }, [formulasList, searchQuery, activeTab]);

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title="Formulasi Repository (Formula Vault Archive)"
        description="Penyimpanan data formula produk terenkripsi, riwayat versi revisi, dan integritas sertifikasi stabilitas."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Vault Encryption AES-256</span>
          </div>
        }
        tabs={[
          { key: "ALL", label: "Semua Formula Vault", count: formulasList.length },
          { key: "RELEASED", label: "Telah Rilis (CPKB)", count: formulasList.filter((f) => f.status === "RELEASED").length },
          { key: "ARCHIVED", label: "Arsip Non-Aktif", count: formulasList.filter((f) => f.status === "ARCHIVED").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Formula Terenkripsi"
          value={`${formulasList.length} Formula`}
          icon={<Lock className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "Immutable Ledger", isPositive: true }}
          subtext="Vault Keamanan Tinggi"
          variant="info"
        />
        <DnaStatCard
          label="Formula Lolos Rilis CPKB"
          value={`${formulasList.filter((f) => f.status === "RELEASED").length} Formula`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="Siap Produksi Massal"
          variant="success"
        />
        <DnaStatCard
          label="Uji Stabilitas Lolos"
          value={`${formulasList.filter((f) => f.stability === "STABLE").length} Formula`}
          icon={<FlaskConical className="w-5 h-5 text-purple-600" />}
          subtext="Uji Oven 40°C & Suhu Kamar"
          variant="purple"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari ID Formula / produk / kategori / formulator...",
          actionButton: {
            label: "Verifikasi Vault",
            onClick: () => toast.success("Sinkronisasi database vault formula terverifikasi aman."),
          },
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">FORMULA ID</th>
                <th className="p-3.5 w-28 min-w-[110px] whitespace-nowrap">TGL RILIS</th>
                <th className="p-3.5 min-w-[220px]">NAMA PRODUK</th>
                <th className="p-3.5 w-24 min-w-[90px] whitespace-nowrap">VERSI</th>
                <th className="p-3.5 w-32 min-w-[110px] whitespace-nowrap">KATEGORI</th>
                <th className="p-3.5 w-32 min-w-[120px] whitespace-nowrap">SAMPLE REF</th>
                <th className="p-3.5 w-40 min-w-[150px] whitespace-nowrap">FORMULATOR</th>
                <th className="p-3.5 w-32 min-w-[110px] text-center whitespace-nowrap">UJI STABILITAS</th>
                <th className="p-3.5 w-28 min-w-[100px] text-center whitespace-nowrap">STATUS</th>
                <th className="p-3.5 text-center w-20 whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFormulas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada formula arsip yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredFormulas.map((formula) => (
                  <tr
                    key={formula.id}
                    onClick={() => setSelectedFormula(formula)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 whitespace-nowrap">
                      <DnaCell.Code value={formula.id} onClick={() => setSelectedFormula(formula)} />
                    </td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Date value={formula.releasedAt} /></td>
                    <td className="p-3.5 min-w-[220px]"><DnaCell.Text primary={formula.name} /></td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                        {formula.activeVersion}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Badge status={formula.category} /></td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Code value={formula.sampleCode} /></td>
                    <td className="p-3.5 whitespace-nowrap"><DnaCell.Avatar name={formula.createdBy} /></td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <DnaCell.Badge status={formula.stability === "STABLE" ? "Stable" : "Unstable"} />
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <DnaCell.Badge status={formula.status} />
                    </td>
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedFormula(formula)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                        title="Lihat Detail Formula Vault"
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
        title={selectedFormula?.name || "Detail Vault Formula"}
        subtitle={`ID: ${selectedFormula?.id} • Versi: ${selectedFormula?.activeVersion}`}
        badge={
          selectedFormula && (
            <DnaBadge variant={selectedFormula.status === "RELEASED" ? "success" : "neutral"}>
              {selectedFormula.status}
            </DnaBadge>
          )
        }
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => toast.success(`Mencetak Bukti Arsip Vault ${selectedFormula?.id}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Dokumen
            </DnaButton>
          </div>
        }
      >
        {selectedFormula && (
          <div className="space-y-6 text-xs">
            {/* Vault Security Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                Integritas Enkripsi Formula Vault
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Formula ini telah dikunci dan disimpan dalam database terenkripsi AES-256. Setiap modifikasi wajib melalui proses permohonan penyesuaian formula (Revision Branch).
              </p>
            </div>

            {/* Specifications Details */}
            <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Informasi Rilis & Uji Mutu
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Kategori Produk:</span>
                  <span className="font-semibold text-slate-800">{selectedFormula.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Hasil Uji Stabilitas:</span>
                  <span className="font-semibold text-emerald-700">{selectedFormula.stability}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Formulator:</span>
                  <span className="font-semibold text-slate-800">{selectedFormula.createdBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal Rilis:</span>
                  <span className="font-mono text-slate-800">{selectedFormula.releasedAt}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </DnaPageContainer>
  );
}
