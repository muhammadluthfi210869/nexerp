"use client";

import React, { useState, useMemo } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  Plus,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface RndProjectRecord {
  id: string;
  projectCode: string;
  clientName: string;
  brandName: string;
  productName: string;
  category: string;
  claim: string;
  picFormulator: string;
  currentPhase: "Formulasi Lab" | "Uji Stabilitas" | "Sample Client" | "Uji Khasiat" | "BPOM Notifikasi" | "Siap Produksi";
  stabilityTestStatus: "LOLOS (Aman)" | "SEDANG DIUJI (Oven 45°C)" | "REVISI VISKOSITAS";
  bpomStatus: "BELUM DIAJUKAN" | "SUBMITTED" | "TERBIT NIE";
  startDate: string;
  targetCompletion: string;
  progressPercent: number;
  testParameters: {
    ph: string;
    viscosity: string;
    centrifuge: string;
    organoleptic: string;
    microbiology: string;
  };
}

const INITIAL_PROJECTS: RndProjectRecord[] = [
  {
    id: "rnd-p-1",
    projectCode: "RND-2026-081",
    clientName: "PT Glow Skin Global",
    brandName: "GlowSkin Aesthetic",
    productName: "Sunscreen Glow Gel SPF 50 PA++++ 30ml",
    category: "Sun Care",
    claim: "Water-based, No White Cast, Niacinamide 2%",
    picFormulator: "dr. Rian Pratama",
    currentPhase: "Siap Produksi",
    stabilityTestStatus: "LOLOS (Aman)",
    bpomStatus: "TERBIT NIE",
    startDate: "01/07/2026",
    targetCompletion: "25/08/2026",
    progressPercent: 100,
    testParameters: {
      ph: "5.8 - 6.2 (Sesuai)",
      viscosity: "14.500 cPs (Lolos)",
      centrifuge: "3000 rpm 30 mnt (Stabil)",
      organoleptic: "Light Gel Translucent, Odor Floral",
      microbiology: "ALT < 10 CFU/g (Lolos BPOM)",
    },
  },
  {
    id: "rnd-p-2",
    projectCode: "RND-2026-085",
    clientName: "CV Aura Natural",
    brandName: "AuraGlow Botanica",
    productName: "Centella Soothing Moisturizer Gel 50ml",
    category: "Skin Care",
    claim: "Cica 5%, Ceramide NP, Barrier Repair",
    picFormulator: "Aisyah Putri, S.Si",
    currentPhase: "Uji Stabilitas",
    stabilityTestStatus: "SEDANG DIUJI (Oven 45°C)",
    bpomStatus: "SUBMITTED",
    startDate: "15/07/2026",
    targetCompletion: "10/09/2026",
    progressPercent: 75,
    testParameters: {
      ph: "5.5 (Stabil)",
      viscosity: "18.000 cPs (Stabil)",
      centrifuge: "3000 rpm 30 mnt (Stabil)",
      organoleptic: "Semi-opaque Gel Pale Green",
      microbiology: "Dalam Masa Inkubasi 14 Hari",
    },
  },
  {
    id: "rnd-p-3",
    projectCode: "RND-2026-089",
    clientName: "PT Derma Estetika",
    brandName: "DermaGleam",
    productName: "Brightening Serum Tranexamic Acid 3%",
    category: "Face Serum",
    claim: "Anti Flek Hitam, Kojic Acid Dipalmitate",
    picFormulator: "dr. Rian Pratama",
    currentPhase: "Sample Client",
    stabilityTestStatus: "LOLOS (Aman)",
    bpomStatus: "BELUM DIAJUKAN",
    startDate: "20/07/2026",
    targetCompletion: "20/09/2026",
    progressPercent: 60,
    testParameters: {
      ph: "4.8 - 5.2 (Sesuai)",
      viscosity: "2.800 cPs (Lolos)",
      centrifuge: "3000 rpm 30 mnt (Stabil)",
      organoleptic: "Clear Liquid, Tanpa Aroma",
      microbiology: "Negatif Pseudomonas & Staph",
    },
  },
  {
    id: "rnd-p-4",
    projectCode: "RND-2026-092",
    clientName: "PT Cantika Herbal Nusantara",
    brandName: "HerbalCare",
    productName: "Gentle Oat Cleanser Gel Low pH 100ml",
    category: "Cleanser",
    claim: "Sulfat Free, Oat Extract, pH 5.5",
    picFormulator: "Aisyah Putri, S.Si",
    currentPhase: "Formulasi Lab",
    stabilityTestStatus: "REVISI VISKOSITAS",
    bpomStatus: "BELUM DIAJUKAN",
    startDate: "05/08/2026",
    targetCompletion: "30/09/2026",
    progressPercent: 35,
    testParameters: {
      ph: "5.4 (Sesuai)",
      viscosity: "8.500 cPs (Terlalu Cair - Perlu Thickener)",
      centrifuge: "Sedang Formulasi Ulang",
      organoleptic: "Milky Gel Oat",
      microbiology: "Belum Diuji",
    },
  },
];

export default function RndProjectMonitoringPage() {
  const toast = useDnaToast();
  const [projects, setProjects] = useState<RndProjectRecord[]>(INITIAL_PROJECTS);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<RndProjectRecord | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeTab === "LAB" && p.currentPhase !== "Formulasi Lab") return false;
      if (activeTab === "STABILITY" && p.currentPhase !== "Uji Stabilitas") return false;
      if (activeTab === "SAMPLE" && p.currentPhase !== "Sample Client") return false;
      if (activeTab === "DONE" && p.currentPhase !== "Siap Produksi") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.projectCode.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        p.picFormulator.toLowerCase().includes(q)
      );
    });
  }, [projects, activeTab, searchQuery]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Monitoring Proyek R&D & Formulasi Maklon"
        subtitle="Pengawasan kronologis riset formula kosmetik, uji stabilitas lab, notifikasi BPOM, dan serah terima sample"
        breadcrumbs={[{ label: "R&D", href: "/rnd/dashboard" }, { label: "Project Monitoring" }]}
        tabs={[
          { key: "ALL", label: "Semua Proyek", count: projects.length },
          { key: "LAB", label: "Formulasi Lab", count: projects.filter((p) => p.currentPhase === "Formulasi Lab").length },
          { key: "STABILITY", label: "Uji Stabilitas", count: projects.filter((p) => p.currentPhase === "Uji Stabilitas").length },
          { key: "SAMPLE", label: "Review Klien", count: projects.filter((p) => p.currentPhase === "Sample Client").length },
          { key: "DONE", label: "Siap Maklon", count: projects.filter((p) => p.currentPhase === "Siap Produksi").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => toast.success("Inisiasi Proyek", "Form pembukaan proyek formulasi R&D baru dibuka.")}
          >
            + Proyek R&D Baru
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Proyek R&D Aktif"
          value={`${projects.length} Proyek`}
          variant="blue"
          icon={<FlaskConical className="h-4 w-4" />}
          delta={{ value: "4 Formulator Standby", isPositive: true }}
        />
        <DnaStatCard
          label="Dalam Uji Stabilitas Lab"
          value={`${projects.filter((p) => p.currentPhase === "Uji Stabilitas").length} Batch Uji`}
          variant="amber"
          icon={<Clock className="h-4 w-4" />}
          delta={{ value: "Oven 45°C & RT Chamber", isPositive: true }}
        />
        <DnaStatCard
          label="Siap Produksi / NIE Terbit"
          value={`${projects.filter((p) => p.currentPhase === "Siap Produksi").length} Formula`}
          variant="emerald"
          icon={<CheckCircle2 className="h-4 w-4" />}
          delta={{ value: "Formula Valid CPKB", isPositive: true }}
        />
        <DnaStatCard
          label="Tingkat Lolos Uji Stabilitas"
          value="92.4%"
          variant="indigo"
          icon={<ShieldCheck className="h-4 w-4" />}
          delta={{ value: "Target Mutu > 90%", isPositive: true }}
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="w-80">
          <DnaInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Cari kode proyek, nama produk, klien, formulator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DnaButton
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => toast.success("Data Sinkron", "Jadwal dan status pengujian terhubung ke LIMS.")}
          >
            Sinkronkan Lab
          </DnaButton>
        </div>
      </div>

      {/* 1:1 Table Standard */}
      <DnaDataTableCard title="Tabel Pengawasan Milestone Proyek R&D (1:1 Standar G-SERP)">
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">No. Proyek R&D</th>
                <th className="px-4 py-3">Klien Maklon</th>
                <th className="px-4 py-3">Nama Produk & Brand</th>
                <th className="px-4 py-3">Formulator PIC</th>
                <th className="px-4 py-3 text-center">Tahapan Riset</th>
                <th className="px-4 py-3">Uji Stabilitas</th>
                <th className="px-4 py-3 text-center">BPOM Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada proyek R&D yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p, index) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.projectCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.clientName}</td>
                    <td className="px-4 py-3">
                      <DnaCell.Text primary={p.productName} secondary={p.brandName} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.picFormulator}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          p.currentPhase === "Siap Produksi"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.currentPhase === "Uji Stabilitas"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {p.currentPhase}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          p.stabilityTestStatus.includes("LOLOS")
                            ? "text-emerald-700 bg-emerald-50"
                            : p.stabilityTestStatus.includes("REVISI")
                            ? "text-rose-700 bg-rose-50"
                            : "text-amber-700 bg-amber-50"
                        }`}
                      >
                        {p.stabilityTestStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge
                        variant={
                          p.bpomStatus === "TERBIT NIE"
                            ? "emerald"
                            : p.bpomStatus === "SUBMITTED"
                            ? "blue"
                            : "default"
                        }
                      >
                        {p.bpomStatus}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedProject(p)}
                      >
                        Detail
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Proyek R&D */}
      <DnaModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title="Detail Proyek Riset & Formulasi Laboratorium"
        size="lg"
      >
        {selectedProject && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block">
                  {selectedProject.projectCode} • {selectedProject.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedProject.productName}</h3>
                <p className="text-xs text-slate-500">
                  Klien: <span className="font-semibold text-slate-800">{selectedProject.clientName}</span> ({selectedProject.brandName})
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">PIC Formulator:</span>
                <span className="font-bold text-slate-800 text-xs">{selectedProject.picFormulator}</span>
              </div>
            </div>

            {/* Klaim Produk & Target */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="font-bold text-blue-900 block mb-0.5">Target Klaim Formulasi & Bahan Aktif:</span>
              <p className="text-blue-800">{selectedProject.claim}</p>
            </div>

            {/* Hasil Uji Laboratorium Fisik & Kimia */}
            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-2">
                Parameter Pengujian Fisik & Kimiawi (LIMS Lab R&D)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Uji Derajat Keasaman (pH)</span>
                  <span className="font-bold text-slate-800">{selectedProject.testParameters.ph}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Viskositas Gel / Cairan</span>
                  <span className="font-bold text-slate-800">{selectedProject.testParameters.viscosity}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Uji Pemisahan Sentrifugasi</span>
                  <span className="font-bold text-slate-800">{selectedProject.testParameters.centrifuge}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Uji Mikrobiologi & ALT</span>
                  <span className="font-bold text-slate-800">{selectedProject.testParameters.microbiology}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedProject(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
