"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FlaskConical,
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
  FolderOpen,
  ExternalLink,
  Edit2,
  FileText,
  Tag,
  Check,
  RotateCcw,
  Sparkles,
  Send,
  Layers,
  ArrowRight
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

interface RndProject {
  id: string;
  projectName: string;
  picFormulator: string;
  clientName: string;
  brandName: string;
  status: "PENDING" | "IN_PROGRESS" | "TERKIRIM" | "OVERDUE" | "APPROVED" | "REVISION";
  statusLabel: string;
  npfEntryDate: string; // Tgl NPF Masuk
  targetFinishDate: string; // Tgl Target Selesai
  shippingDate?: string; // Tgl Pengiriman Sample
  sampleWorkDays: number; // Total Pengerjaan Sample (hari kerja)
  formulaFolderUrl: string; // Folder Formula / Drive Link
  notes: string;
  activeRevision: string; // Rev 1, Rev 2, etc.
}

const MOCK_RND_PROJECTS: RndProject[] = [
  {
    id: "proj-01",
    projectName: "Serum Brightening Niacinamide 10% + Zinc PCA",
    picFormulator: "Apt. Dedi Kurniawan, S.Farm",
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    status: "IN_PROGRESS",
    statusLabel: "In Progress (Formulasi Lab)",
    npfEntryDate: "2026-03-01",
    targetFinishDate: "2026-03-12",
    shippingDate: undefined,
    sampleWorkDays: 7,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-serum-001",
    notes: "Tekstur watery-gel transparan, tidak lengket, pH target 5.5 - 6.0.",
    activeRevision: "Rev 1"
  },
  {
    id: "proj-02",
    projectName: "Acne Spot Gel Centella + Salicylic Acid 2%",
    picFormulator: "Dr. Maya Sp.KK",
    clientName: "CV Derma Estetika Mandiri",
    brandName: "DermaPure",
    status: "TERKIRIM",
    statusLabel: "Sample Terkirim (Menunggu Review Klien)",
    npfEntryDate: "2026-02-20",
    targetFinishDate: "2026-03-02",
    shippingDate: "2026-03-03",
    sampleWorkDays: 9,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-acne-002",
    notes: "Sample 3 botol dropper 15ml dikirim via JNE YES Resi #JNE88921102.",
    activeRevision: "Rev 1"
  },
  {
    id: "proj-03",
    projectName: "Moisturizer Ceramide Barrier Repair 5X",
    picFormulator: "Apt. Siska Handayani, M.Farm",
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    status: "APPROVED",
    statusLabel: "Sample Disetujui (Lanjut HPP & SPK)",
    npfEntryDate: "2026-02-10",
    targetFinishDate: "2026-02-22",
    shippingDate: "2026-02-23",
    sampleWorkDays: 10,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-moist-003",
    notes: "Klien approve sample Rev 2. Menunggu PO & pendaftaran BPOM NA.",
    activeRevision: "Rev 2"
  },
  {
    id: "proj-04",
    projectName: "Sunscreen Serum SPF 50+ PA++++ Hybrid",
    picFormulator: "Apt. Dedi Kurniawan, S.Farm",
    clientName: "PT Kosmetika Surya Abadi",
    brandName: "SunGlow",
    status: "REVISION",
    statusLabel: "Revisi Sample (Rev 2)",
    npfEntryDate: "2026-02-15",
    targetFinishDate: "2026-03-05",
    shippingDate: undefined,
    sampleWorkDays: 14,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-sunscreen-004",
    notes: "Klien request tekstur lebih matte dan minim whitecast saat blending.",
    activeRevision: "Rev 2"
  },
  {
    id: "proj-05",
    projectName: "Gentle Facial Wash Oat + Ceramide Low pH",
    picFormulator: "Ahmad Fauzi",
    clientName: "PT Natural Botani Pratama",
    brandName: "OatCare",
    status: "OVERDUE",
    statusLabel: "Overdue (Melewati Target)",
    npfEntryDate: "2026-02-18",
    targetFinishDate: "2026-03-02",
    shippingDate: undefined,
    sampleWorkDays: 16,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-fw-005",
    notes: "Menunggu pasokan bahan baku surfaktan amino acid impor tiba di gudang.",
    activeRevision: "Rev 1"
  }
];

export default function RndProjectMonitoringPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [picFilter, setPicFilter] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState<RndProject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for new project
  const [newProjectForm, setNewProjectForm] = useState({
    projectName: "",
    picFormulator: "Apt. Dedi Kurniawan, S.Farm",
    clientName: "",
    brandName: "",
    npfEntryDate: new Date().toISOString().split("T")[0],
    targetFinishDate: "",
    formulaFolderUrl: "",
    notes: ""
  });

  // Query API
  const { data: rawProjects, isLoading } = useQuery({
    queryKey: ["rnd-project-monitoring"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/dashboard");
        return unwrapResponse(res.data) as RndProject[];
      } catch (e) {
        return null;
      }
    }
  });

  const projects: RndProject[] = useMemo(() => {
    if (rawProjects && Array.isArray(rawProjects) && rawProjects.length > 0) {
      return rawProjects;
    }
    return MOCK_RND_PROJECTS;
  }, [rawProjects]);

  // Filtering
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeTab === "progress" && p.status !== "IN_PROGRESS" && p.status !== "REVISION") return false;
      if (activeTab === "shipped" && p.status !== "TERKIRIM") return false;
      if (activeTab === "approved" && p.status !== "APPROVED") return false;
      if (activeTab === "overdue" && p.status !== "OVERDUE") return false;

      if (picFilter !== "ALL" && !p.picFormulator.includes(picFilter)) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          p.projectName.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.brandName.toLowerCase().includes(q) ||
          p.picFormulator.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, activeTab, picFilter, searchQuery]);

  // KPI Calculations
  const totalProjects = projects.length;
  const inProgressCount = projects.filter(p => p.status === "IN_PROGRESS" || p.status === "REVISION").length;
  const shippedCount = projects.filter(p => p.status === "TERKIRIM").length;
  const approvedCount = projects.filter(p => p.status === "APPROVED").length;
  const overdueCount = projects.filter(p => p.status === "OVERDUE").length;

  const handleCreateProject = () => {
    if (!newProjectForm.projectName || !newProjectForm.clientName) {
      toast.warning("Form Belum Lengkap", "Nama Project dan Nama Klien wajib diisi.");
      return;
    }

    toast.success("Project R&D Dibuat", `Project ${newProjectForm.projectName} berhasil didaftarkan ke timeline R&D.`);
    setIsCreateModalOpen(false);
    setNewProjectForm({
      projectName: "",
      picFormulator: "Apt. Dedi Kurniawan, S.Farm",
      clientName: "",
      brandName: "",
      npfEntryDate: new Date().toISOString().split("T")[0],
      targetFinishDate: "",
      formulaFolderUrl: "",
      notes: ""
    });
  };

  const getStatusBadge = (status: RndProject["status"]) => {
    switch (status) {
      case "APPROVED":
        return <DnaBadge variant="success">APPROVED (DEAL)</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge variant="blue">IN PROGRESS</DnaBadge>;
      case "REVISION":
        return <DnaBadge variant="purple">REVISI SAMPLE</DnaBadge>;
      case "TERKIRIM":
        return <DnaBadge variant="info">SAMPLE TERKIRIM</DnaBadge>;
      case "OVERDUE":
        return <DnaBadge variant="danger">OVERDUE</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Project Monitoring R&D & Formulasi"
        description="Pelacakan menyeluruh timeline NPF (New Product Formulation), progres formulasi lab, pengiriman sample, revisi, hingga persetujuan formula klien."
        badge={<DnaBadge variant="neutral">SCR-021 & SCR-176</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "Project Monitoring", href: "/rnd/project-monitoring" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Data Project Monitoring R&D berhasil diekspor ke format Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Project R&D
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={5}>
        <DnaStatCard
          label="TOTAL PROJECT R&D"
          value={`${totalProjects} Project`}
          subValue="NPF Periode Berjalan"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="DALAM FORMULASI"
          value={`${inProgressCount} Formula`}
          subValue="Trial Lab & Optimasi"
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="SAMPLE TERKIRIM"
          value={`${shippedCount} Klien`}
          subValue="Menunggu Review Feedback"
          icon={<Send className="w-5 h-5 text-cyan-600" />}
        />
        <DnaStatCard
          label="APPROVED (DEAL)"
          value={`${approvedCount} Disetujui`}
          subValue="Siap Masuk Pra-Produksi"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="OVERDUE SLA"
          value={`${overdueCount} Project`}
          subValue="Memerlukan Eskalasi PIC"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Filter Bar & Tabs */}
      <div className="space-y-4">
        <DnaTabNav
          tabs={[
            { id: "all", label: `Semua Project (${totalProjects})` },
            { id: "progress", label: `Proses Lab (${inProgressCount})` },
            { id: "shipped", label: `Sample Terkirim (${shippedCount})` },
            { id: "approved", label: `Approved (${approvedCount})` },
            { id: "overdue", label: `Overdue (${overdueCount})` }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter PIC Formulator:</span>
          </div>

          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={picFilter}
            onChange={(e) => setPicFilter(e.target.value)}
          >
            <option value="ALL">Semua Formulator</option>
            <option value="Dedi">Apt. Dedi Kurniawan, S.Farm</option>
            <option value="Maya">Dr. Maya Sp.KK</option>
            <option value="Siska">Apt. Siska Handayani, M.Farm</option>
            <option value="Fauzi">Ahmad Fauzi</option>
          </select>

          {picFilter !== "ALL" && (
            <button
              onClick={() => setPicFilter("ALL")}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium underline ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 4. DataTable Card (11 Kolom standar legacy Project_Monitoring_RND.csv) */}
      <DnaDataTableCard
        title="Daftar Project Monitoring R&D (11 Kolom Legacy Standard)"
        description="Satu baris mewakili 1 project NPF terpadu dengan link folder formula drive dan riwayat revisi."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Project, Klien, Brand, PIC Formulator..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Project Name & Brand</th>
                <th className="py-3 px-4">PIC Formulator</th>
                <th className="py-3 px-4">Client / Perusahaan</th>
                <th className="py-3 px-4">Status & Revisi</th>
                <th className="py-3 px-4">Tgl NPF Masuk</th>
                <th className="py-3 px-4">Target Selesai</th>
                <th className="py-3 px-4">Tgl Pengiriman</th>
                <th className="py-3 px-4 text-center">Pengerjaan</th>
                <th className="py-3 px-4 text-center">Folder Formula</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada project R&D yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{row.projectName}</p>
                      <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mt-0.5">
                        {row.brandName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{row.picFormulator}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {row.clientName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {getStatusBadge(row.status)}
                        <p className="text-[10px] font-mono text-slate-400">{row.activeRevision}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {row.npfEntryDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className={row.status === "OVERDUE" ? "text-rose-600 font-bold" : "text-slate-600"}>
                        {row.targetFinishDate}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {row.shippingDate || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700">
                      {row.sampleWorkDays} Hari
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={row.formulaFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-blue-600 text-[11px] font-semibold border border-slate-200"
                        title="Buka Google Drive Folder Formula"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Link
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(row);
                          setIsDetailModalOpen(true);
                        }}
                        title="Lihat Detail Project & Catatan"
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

      {/* 5. Modal Tambah Project R&D Baru */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tambah Project R&D Baru (SCR-176)"
        description="Pendaftaran project formulasi baru dari dokumen NPF (New Product Formulation)."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateProject}>
              Simpan Project
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Nama Project Formulasi *</label>
            <input
              type="text"
              placeholder="Contoh: Serum Anti-Aging Peptide 5% + Bakuchiol"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-blue-500"
              value={newProjectForm.projectName}
              onChange={(e) => setNewProjectForm(prev => ({ ...prev, projectName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Klien / Perusahaan *</label>
              <input
                type="text"
                placeholder="PT Cantika Nusantara"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={newProjectForm.clientName}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Brand / Merk *</label>
              <input
                type="text"
                placeholder="GlowSkin Co."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={newProjectForm.brandName}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, brandName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">PIC Formulator *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                value={newProjectForm.picFormulator}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, picFormulator: e.target.value }))}
              >
                <option value="Apt. Dedi Kurniawan, S.Farm">Apt. Dedi Kurniawan, S.Farm</option>
                <option value="Dr. Maya Sp.KK">Dr. Maya Sp.KK</option>
                <option value="Apt. Siska Handayani, M.Farm">Apt. Siska Handayani, M.Farm</option>
                <option value="Ahmad Fauzi">Ahmad Fauzi</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Tgl NPF Masuk *</label>
              <input
                type="date"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
                value={newProjectForm.npfEntryDate}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, npfEntryDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Target Selesai Sample *</label>
              <input
                type="date"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
                value={newProjectForm.targetFinishDate}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, targetFinishDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Folder Google Drive Formula (Opsional)</label>
            <input
              type="text"
              placeholder="https://drive.google.com/..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
              value={newProjectForm.formulaFolderUrl}
              onChange={(e) => setNewProjectForm(prev => ({ ...prev, formulaFolderUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Catatan & Parameter Spesifikasi NPF</label>
            <textarea
              rows={2}
              placeholder="Target tekstur, aroma, warna, klaim aktif, target pH..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={newProjectForm.notes}
              onChange={(e) => setNewProjectForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Detail & Riwayat Revisi */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Project R&D & Status Sample"
        description="Detail riwayat pengerjaan formula lab dan catatan revisi klien."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Nama Project</span>
                  <p className="text-sm font-bold text-slate-900">{selectedProject.projectName}</p>
                </div>
                <div>{getStatusBadge(selectedProject.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Klien / Brand:</span>
                  <p className="font-semibold text-slate-800">{selectedProject.clientName} ({selectedProject.brandName})</p>
                </div>
                <div>
                  <span className="text-slate-500">PIC Formulator:</span>
                  <p className="font-semibold text-slate-800">{selectedProject.picFormulator}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tgl Masuk NPF:</span>
                  <p className="font-semibold text-slate-800">{selectedProject.npfEntryDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Target Selesai:</span>
                  <p className="font-semibold text-slate-800">{selectedProject.targetFinishDate}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Catatan & Spesifikasi Produk
              </h4>
              <p className="text-slate-600 leading-relaxed">{selectedProject.notes}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-semibold">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span>Google Drive Repository Formulasi</span>
              </div>
              <a
                href={selectedProject.formulaFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold underline text-xs"
              >
                Buka Folder Formula <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
