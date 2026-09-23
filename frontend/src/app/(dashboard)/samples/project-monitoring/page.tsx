"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FlaskConical,
  Plus,
  Search,
  FileSpreadsheet,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Send,
  ExternalLink
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
  npfEntryDate: string;
  targetFinishDate: string;
  shippingDate?: string;
  sampleWorkDays: number;
  formulaFolderUrl: string;
  notes: string;
  activeRevision: string;
}

const MOCK_RND_PROJECTS: RndProject[] = [
  {
    id: "proj-01",
    projectName: "Serum Brightening Niacinamide 10% + Zinc PCA",
    picFormulator: "Apt. Dedi Kurniawan, S.Farm",
    clientName: "PT Cantika Glow Nusantara",
    brandName: "GlowAura Skin",
    status: "IN_PROGRESS",
    statusLabel: "In Progress",
    npfEntryDate: "2026-03-01",
    targetFinishDate: "2026-03-12",
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
    statusLabel: "Sample Terkirim",
    npfEntryDate: "2026-02-20",
    targetFinishDate: "2026-03-02",
    shippingDate: "2026-03-03",
    sampleWorkDays: 9,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-acne-002",
    notes: "Sample 3 botol dropper 15ml dikirim via JNE YES.",
    activeRevision: "Rev 1"
  },
  {
    id: "proj-03",
    projectName: "Moisturizer Ceramide Barrier Repair 5X",
    picFormulator: "Apt. Siska Handayani, M.Farm",
    clientName: "PT Miracle Beauty Lab",
    brandName: "MiracleSkin",
    status: "APPROVED",
    statusLabel: "Sample Disetujui",
    npfEntryDate: "2026-02-10",
    targetFinishDate: "2026-02-22",
    shippingDate: "2026-02-23",
    sampleWorkDays: 10,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-moist-003",
    notes: "Klien approve sample Rev 2. Menunggu PO & pendaftaran BPOM.",
    activeRevision: "Rev 2"
  },
  {
    id: "proj-04",
    projectName: "Sunscreen Serum SPF 50+ PA++++ Hybrid",
    picFormulator: "Apt. Dedi Kurniawan, S.Farm",
    clientName: "PT Kosmetika Surya Abadi",
    brandName: "SunGlow",
    status: "REVISION",
    statusLabel: "Revisi Sample",
    npfEntryDate: "2026-02-15",
    targetFinishDate: "2026-03-05",
    sampleWorkDays: 14,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-sunscreen-004",
    notes: "Klien request tekstur lebih matte dan minim whitecast.",
    activeRevision: "Rev 2"
  },
  {
    id: "proj-05",
    projectName: "Gentle Facial Wash Oat + Ceramide Low pH",
    picFormulator: "Ahmad Fauzi",
    clientName: "PT Natural Botani Pratama",
    brandName: "OatCare",
    status: "OVERDUE",
    statusLabel: "Overdue",
    npfEntryDate: "2026-02-18",
    targetFinishDate: "2026-03-02",
    sampleWorkDays: 16,
    formulaFolderUrl: "https://drive.google.com/drive/folders/rnd-fw-005",
    notes: "Menunggu pasokan bahan baku surfaktan amino acid impor tiba di gudang.",
    activeRevision: "Rev 1"
  }
];

export default function RndProjectMonitoringPage() {
  const toast = useDnaToast();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<RndProject | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const { data: rawProjects, isLoading } = useQuery({
    queryKey: ["rnd-project-monitoring"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/dashboard");
        return unwrapResponse(res.data) as RndProject[];
      } catch {
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

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeTab === "progress" && p.status !== "IN_PROGRESS" && p.status !== "REVISION") return false;
      if (activeTab === "shipped" && p.status !== "TERKIRIM") return false;
      if (activeTab === "approved" && p.status !== "APPROVED") return false;
      if (activeTab === "overdue" && p.status !== "OVERDUE") return false;

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
  }, [projects, activeTab, searchQuery]);

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
        return <DnaBadge variant="success">APPROVED</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge variant="info">IN PROGRESS</DnaBadge>;
      case "REVISION":
        return <DnaBadge variant="warning">REVISI</DnaBadge>;
      case "TERKIRIM":
        return <DnaBadge variant="info">TERKIRIM</DnaBadge>;
      case "OVERDUE":
        return <DnaBadge variant="danger">OVERDUE</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Monitoring Project R&D & Formulasi"
        description="Pelacakan timeline NPF (New Product Formulation), progres formulasi lab, pengiriman sample, revisi, hingga persetujuan formula klien."
        badge={<DnaBadge variant="neutral">SCR-021</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/samples/rnd-dashboard" },
          { label: "Project Monitoring", href: "/samples/project-monitoring" }
        ]}
        tabs={[
          { id: "all", label: `Semua (${totalProjects})` },
          { id: "progress", label: `Proses Lab (${inProgressCount})` },
          { id: "shipped", label: `Terkirim (${shippedCount})` },
          { id: "approved", label: `Approved (${approvedCount})` },
          { id: "overdue", label: `Overdue (${overdueCount})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Data Project Monitoring R&D berhasil diekspor.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Project
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
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
          label="OVERDUE SLA"
          value={`${overdueCount} Project`}
          subValue="Perlu Eskalasi Formulator"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Project, Klien, Brand, PIC Formulator..."
      >
        <div className="w-full">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-[26%]">Project & Brand</th>
                <th className="py-3 px-4 w-[24%]">Klien & Formulator</th>
                <th className="py-3 px-4 w-[20%]">Target & Pengerjaan</th>
                <th className="py-3 px-4 w-[14%]">Status & Revisi</th>
                <th className="py-3 px-4 w-[10%]">Folder Drive</th>
                <th className="py-3 px-4 w-[6%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data project R&D...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada project R&D yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{row.projectName}</p>
                      <p className="text-[11px] text-indigo-600 font-medium truncate">{row.brandName}</p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-800 text-xs truncate">{row.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{row.picFormulator}</p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <p className="font-mono text-xs font-bold text-slate-900 truncate">
                        Target: {row.targetFinishDate}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        Masuk: {row.npfEntryDate} • {row.sampleWorkDays} Hari
                      </p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(row.status)}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{row.activeRevision}</p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <a
                        href={row.formulaFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-blue-600 text-[11px] font-medium border border-slate-200"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Drive
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(row);
                          setIsDetailDrawerOpen(true);
                        }}
                        title="Lihat Detail Project"
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

      {/* 4. Modal Tambah Project R&D Baru */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tambah Project R&D Baru"
        description="Pendaftaran project formulasi baru dari dokumen NPF (New Product Formulation)."
        size="md"
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
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Nama Project Formulasi *</label>
            <DnaInput
              placeholder="Contoh: Serum Anti-Aging Peptide 5% + Bakuchiol"
              value={newProjectForm.projectName}
              onChange={(e) => setNewProjectForm(prev => ({ ...prev, projectName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Nama Klien *</label>
              <DnaInput
                placeholder="PT Cantika Nusantara"
                value={newProjectForm.clientName}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Nama Brand</label>
              <DnaInput
                placeholder="GlowSkin"
                value={newProjectForm.brandName}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, brandName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tgl Masuk NPF</label>
              <DnaInput
                type="date"
                value={newProjectForm.npfEntryDate}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, npfEntryDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Target Selesai Formulasi</label>
              <DnaInput
                type="date"
                value={newProjectForm.targetFinishDate}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, targetFinishDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Link Folder Formula (Drive)</label>
            <DnaInput
              placeholder="https://drive.google.com/drive/folders/..."
              value={newProjectForm.formulaFolderUrl}
              onChange={(e) => setNewProjectForm(prev => ({ ...prev, formulaFolderUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Catatan Spesifikasi</label>
            <DnaInput
              placeholder="Tekstur, warna, target pH, active ingredients..."
              value={newProjectForm.notes}
              onChange={(e) => setNewProjectForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedProject?.projectName || "Detail Project R&D"}
        subtitle={selectedProject ? `${selectedProject.clientName} (${selectedProject.brandName})` : undefined}
        badge={selectedProject ? getStatusBadge(selectedProject.status) : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan Project",
            content: selectedProject ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{selectedProject.projectName}</span>
                    <span className="font-mono text-slate-500">{selectedProject.activeRevision}</span>
                  </div>
                  <p className="text-slate-600">{selectedProject.clientName} • Brand: {selectedProject.brandName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">PIC Formulator</span>
                    <p className="font-semibold text-slate-900">{selectedProject.picFormulator}</p>
                    <span className="text-[10px] text-slate-400">R&D Lab Formulator</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Durasi Pengerjaan</span>
                    <p className="font-mono font-bold text-indigo-700">{selectedProject.sampleWorkDays} Hari Kerja</p>
                    <span className="text-[10px] text-slate-400">Terhitung sejak NPF masuk</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">Jadwal & Timeline</span>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-400">Tgl Masuk NPF</span>
                      <p className="font-mono font-bold text-slate-700">{selectedProject.npfEntryDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Target Selesai</span>
                      <p className="font-mono font-bold text-slate-700">{selectedProject.targetFinishDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Tgl Pengiriman</span>
                      <p className="font-mono font-bold text-slate-700">{selectedProject.shippingDate || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Catatan Formulator:</span>
                  <p className="text-slate-600">{selectedProject.notes || "Tidak ada catatan."}</p>
                </div>
              </div>
            ) : null
          },
          {
            id: "folder",
            label: "Dokumen Formula",
            content: selectedProject ? (
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-700 uppercase">Akses Cloud Storage & Formula:</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-bold text-slate-800">Google Drive Folder Formula</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">{selectedProject.formulaFolderUrl}</p>
                    </div>
                  </div>
                  <a
                    href={selectedProject.formulaFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1.5 hover:bg-blue-700"
                  >
                    Buka Drive <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
          </div>
        }
      />
    </DnaPageContainer>
  );
}
