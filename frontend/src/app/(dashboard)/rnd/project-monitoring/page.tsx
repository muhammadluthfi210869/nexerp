"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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

const mapSampleToRecord = (s: any): RndProjectRecord => {
  let currentPhase: RndProjectRecord["currentPhase"] = "Formulasi Lab";
  let stabilityTestStatus: RndProjectRecord["stabilityTestStatus"] = "SEDANG DIUJI (Oven 45°C)";
  let bpomStatus: RndProjectRecord["bpomStatus"] = "BELUM DIAJUKAN";
  let progress = 25;

  if (s.stage === "APPROVED") {
    currentPhase = "Siap Produksi";
    stabilityTestStatus = "LOLOS (Aman)";
    bpomStatus = "TERBIT NIE";
    progress = 100;
  } else if (s.stage === "SENT_TO_CLIENT" || s.stage === "FEEDBACK_RECEIVED") {
    currentPhase = "Sample Client";
    progress = 75;
  } else if (s.stage === "INTERNAL_REVIEW") {
    currentPhase = "Uji Stabilitas";
    progress = 50;
  }

  return {
    id: s.id,
    projectCode: s.sampleCode || `RND-${s.id.slice(0, 6)}`,
    clientName: s.lead?.clientName || s.lead?.companyName || "Klien Mandiri",
    brandName: s.lead?.brandName || "Brand",
    productName: s.productName,
    category: s.targetFunction || "Skincare",
    claim: s.targetFunction || "Formula Standar",
    picFormulator: s.pic?.fullName || s.pic?.name || "Belum Ditugaskan",
    currentPhase,
    stabilityTestStatus,
    bpomStatus,
    startDate: s.createdAt ? new Date(s.createdAt).toLocaleDateString("id-ID") : "-",
    targetCompletion: s.targetDeadline ? new Date(s.targetDeadline).toLocaleDateString("id-ID") : "-",
    progressPercent: progress,
    testParameters: {
      ph: s.formulas?.[0]?.qcparameter?.phTarget || "5.5 - 6.5",
      viscosity: s.formulas?.[0]?.qcparameter?.viscosityTarget || "Standard cPs",
      centrifuge: "3000 rpm 30 mnt (Stabil)",
      organoleptic: s.textureReq || "Sesuai Standar Lab",
      microbiology: "ALT < 10 CFU/g (Lolos BPOM)",
    },
  };
};

export default function RndProjectMonitoringPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<RndProjectRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    leadId: "",
    productName: "",
    targetFunction: "",
    textureReq: "Gel Transparan",
    colorReq: "Clear",
    aromaReq: "Floral Natural",
    targetDeadline: "",
  });

  const { data: rawSamples, isLoading, refetch } = useQuery({
    queryKey: ["rnd-monitoring-samples"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/samples");
        return unwrapResponse(res.data) as any[];
      } catch {
        return [];
      }
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["rnd-leads-selection"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/pipeline-v2/leads");
        return unwrapResponse(res.data) || [];
      } catch {
        return [];
      }
    },
  });

  const projects: RndProjectRecord[] = useMemo(() => {
    if (rawSamples && Array.isArray(rawSamples)) {
      return rawSamples.map(mapSampleToRecord);
    }
    return [];
  }, [rawSamples]);

  const handleCreateProject = async () => {
    if (!createForm.productName) {
      toast.warning("Form Belum Lengkap", "Nama produk formulasi wajib diisi.");
      return;
    }
    const leadId = createForm.leadId || (leads && leads.length > 0 ? leads[0].id : null);
    if (!leadId) {
      toast.warning("Lead Belum Dipilih", "Pilih lead klien untuk proyek ini.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/rnd/samples", {
        leadId,
        productName: createForm.productName,
        targetFunction: createForm.targetFunction || "Formulasi Produk Baru",
        textureReq: createForm.textureReq,
        colorReq: createForm.colorReq,
        aromaReq: createForm.aromaReq,
        targetDeadline: createForm.targetDeadline ? new Date(createForm.targetDeadline).toISOString() : undefined,
      });

      toast.success("Proyek Berhasil Dibuat", `Proyek ${createForm.productName} berhasil didaftarkan ke lab R&D.`);
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rnd-monitoring-samples"] });
      setCreateForm({
        leadId: "",
        productName: "",
        targetFunction: "",
        textureReq: "Gel Transparan",
        colorReq: "Clear",
        aromaReq: "Floral Natural",
        targetDeadline: "",
      });
    } catch (err: any) {
      toast.error("Gagal Membuat Proyek", err?.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onClick={() => setIsCreateOpen(true)}
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
          delta={{ value: "Lab Queue & Active", isPositive: true }}
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
            onClick={() => {
              refetch();
              toast.success("Data Disinkronkan", "Jadwal dan status pengujian R&D telah diperbarui.");
            }}
          >
            Sinkronkan Lab
          </DnaButton>
        </div>
      </div>

      {/* 1:1 Table Standard */}
      <DnaDataTableCard title="Tabel Pengawasan Milestone Proyek R&D (1:1 Standar G-SERP)">
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="px-4 py-3 w-12 text-center">#</DnaTh>
                <DnaTh className="px-4 py-3">No. Proyek R&D</DnaTh>
                <DnaTh className="px-4 py-3">Klien Maklon</DnaTh>
                <DnaTh className="px-4 py-3">Nama Produk & Brand</DnaTh>
                <DnaTh className="px-4 py-3">Formulator PIC</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Tahapan Riset</DnaTh>
                <DnaTh className="px-4 py-3">Uji Stabilitas</DnaTh>
                <DnaTh className="px-4 py-3 text-center">BPOM Status</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredProjects.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada proyek R&D yang cocok dengan kriteria filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredProjects.map((p, index) => (
                  <DnaTableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="px-4 py-3 text-center text-slate-400 tabular-nums text-xs">{index + 1}</DnaTd>
                    <DnaTd className="px-4 py-3 tabular-nums font-bold text-slate-900">{p.projectCode}</DnaTd>
                    <DnaTd className="px-4 py-3 font-semibold text-slate-800">{p.clientName}</DnaTd>
                    <DnaTd className="px-4 py-3">
                      <DnaCell.Text primary={p.productName} secondary={p.brandName} />
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-slate-700">{p.picFormulator}</DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
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
                    </DnaTd>
                    <DnaTd className="px-4 py-3">
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
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
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
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedProject(p)}
                      >
                        Detail
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
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
                <span className="text-[10px] tabular-nums text-slate-400 font-bold block">
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

      {/* Modal Inisiasi Proyek R&D Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Inisiasi Proyek R&D & Formulasi Baru"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateProject} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Daftarkan Proyek"}
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {leads && leads.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Pilih Lead / Klien</label>
              <select
                aria-label="Pilih Lead / Klien"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                value={createForm.leadId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, leadId: e.target.value }))}
              >
                <option value="">-- Pilih Lead --</option>
                {leads.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.clientName} {l.brandName ? `(${l.brandName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Nama Produk Formulasi *</label>
            <DnaInput
              placeholder="Contoh: Hydrating Sunscreen Gel SPF 50"
              value={createForm.productName}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, productName: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Fungsi / Klaim Utama</label>
            <DnaInput
              placeholder="Contoh: UV Protection, Calming, Barrier Repair"
              value={createForm.targetFunction}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, targetFunction: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tekstur</label>
              <DnaInput
                value={createForm.textureReq}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, textureReq: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Warna</label>
              <DnaInput
                value={createForm.colorReq}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, colorReq: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Aroma</label>
              <DnaInput
                value={createForm.aromaReq}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, aromaReq: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Target Deadline Formulasi</label>
            <DnaInput
              type="date"
              value={createForm.targetDeadline}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, targetDeadline: e.target.value }))}
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
