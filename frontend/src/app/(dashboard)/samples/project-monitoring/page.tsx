"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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

const mapSampleToProject = (s: any): RndProject => {
  let status: RndProject["status"] = "IN_PROGRESS";
  let statusLabel = "In Progress";
  if (s.stage === "APPROVED") {
    status = "APPROVED";
    statusLabel = "Sample Disetujui";
  } else if (s.stage === "REVISING" || s.stage === "FEEDBACK_RECEIVED") {
    status = "REVISION";
    statusLabel = "Revisi Sample";
  } else if (s.stage === "SENT_TO_CLIENT") {
    status = "TERKIRIM";
    statusLabel = "Sample Terkirim";
  } else if (s.stage === "QUEUE" || s.stage === "WAITING_FINANCE") {
    status = "PENDING";
    statusLabel = "Menunggu Antrian";
  } else if (s.targetDeadline && new Date(s.targetDeadline) < new Date() && s.stage !== "APPROVED") {
    status = "OVERDUE";
    statusLabel = "Overdue";
  }

  const createdDate = s.createdAt ? new Date(s.createdAt) : new Date();
  const workDays = Math.max(1, Math.round((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    id: s.id,
    projectName: s.productName || "Formula R&D",
    picFormulator: s.pic?.fullName || s.pic?.name || "Belum Ditugaskan",
    clientName: s.lead?.clientName || s.lead?.companyName || "Klien Mandiri",
    brandName: s.lead?.brandName || "Brand",
    status,
    statusLabel,
    npfEntryDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : "-",
    targetFinishDate: s.targetDeadline ? new Date(s.targetDeadline).toISOString().split("T")[0] : "-",
    shippingDate: s.sentToClientAt ? new Date(s.sentToClientAt).toISOString().split("T")[0] : undefined,
    sampleWorkDays: workDays,
    formulaFolderUrl: s.formulaFolderUrl || `https://drive.google.com/drive/folders/rnd-${s.sampleCode || s.id}`,
    notes: s.targetFunction || s.feedbackNotes || s.textureReq || "Parameter spesifikasi lab aktif.",
    activeRevision: s.formulas?.[0] ? `Rev ${s.formulas[0].version}` : `Rev ${s.revisionCount || 1}`,
  };
};

export default function RndProjectMonitoringPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<RndProject | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProjectForm, setNewProjectForm] = useState({
    leadId: "",
    projectName: "",
    picFormulator: "Apt. Dedi Kurniawan, S.Farm",
    clientName: "",
    brandName: "",
    npfEntryDate: new Date().toISOString().split("T")[0],
    targetFinishDate: "",
    formulaFolderUrl: "",
    notes: ""
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-selection"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/pipeline-v2/leads");
        return unwrapResponse(res.data) || [];
      } catch {
        return [];
      }
    }
  });

  const { data: rawSamples, isLoading } = useQuery({
    queryKey: ["rnd-project-monitoring"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/samples");
        return unwrapResponse(res.data) as any[];
      } catch {
        return [];
      }
    }
  });

  const projects: RndProject[] = useMemo(() => {
    if (rawSamples && Array.isArray(rawSamples)) {
      return rawSamples.map(mapSampleToProject);
    }
    return [];
  }, [rawSamples]);

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

  const handleCreateProject = async () => {
    if (!newProjectForm.projectName) {
      toast.warning("Form Belum Lengkap", "Nama Project formulasi wajib diisi.");
      return;
    }

    const leadId = newProjectForm.leadId || (leads && leads.length > 0 ? leads[0].id : null);
    if (!leadId) {
      toast.warning("Lead Belum Dipilih", "Pilih Klien / Lead terkait formulasi ini.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/rnd/samples", {
        leadId,
        productName: newProjectForm.projectName,
        targetFunction: newProjectForm.notes || "Pengembangan Formulasi R&D",
        textureReq: "Sesuai Standar Lab",
        colorReq: "Sesuai Standar Lab",
        aromaReq: "Sesuai Standar Lab",
        targetDeadline: newProjectForm.targetFinishDate ? new Date(newProjectForm.targetFinishDate).toISOString() : undefined,
      });

      toast.success("Project R&D Dibuat", `Project ${newProjectForm.projectName} berhasil didaftarkan ke timeline R&D.`);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rnd-project-monitoring"] });
      setNewProjectForm({
        leadId: "",
        projectName: "",
        picFormulator: "Apt. Dedi Kurniawan, S.Farm",
        clientName: "",
        brandName: "",
        npfEntryDate: new Date().toISOString().split("T")[0],
        targetFinishDate: "",
        formulaFolderUrl: "",
        notes: ""
      });
    } catch (err: any) {
      toast.error("Gagal Mendaftarkan Project", err?.response?.data?.message || "Terjadi kesalahan saat memproses ke server.");
    } finally {
      setIsSubmitting(false);
    }
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
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-[26%]">Project & Brand</DnaTh>
                <DnaTh className="py-3 px-4 w-[24%]">Klien & Formulator</DnaTh>
                <DnaTh className="py-3 px-4 w-[20%]">Target & Pengerjaan</DnaTh>
                <DnaTh className="py-3 px-4 w-[14%]">Status & Revisi</DnaTh>
                <DnaTh className="py-3 px-4 w-[10%]">Folder Drive</DnaTh>
                <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data project R&D...
                  </DnaTd>
                </DnaTableRow>
              ) : filteredProjects.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada project R&D yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredProjects.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{row.projectName}</p>
                      <p className="text-[11px] text-indigo-600 font-medium truncate">{row.brandName}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-800 text-xs truncate">{row.clientName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{row.picFormulator}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-slate-900 truncate">
                        Target: {row.targetFinishDate}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums truncate">
                        Masuk: {row.npfEntryDate} • {row.sampleWorkDays} Hari
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(row.status)}
                      </div>
                      <p className="text-[10px] tabular-nums text-slate-400 mt-0.5 truncate">{row.activeRevision}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <a
                        href={row.formulaFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-blue-600 text-[11px] font-medium border border-slate-200"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Drive
                      </a>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
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
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
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
            <DnaButton variant="primary" onClick={handleCreateProject} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Project"}
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {leads && leads.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Pilih Lead / Klien Terdaftar</label>
              <select
                aria-label="Pilih Lead / Klien Terdaftar"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                value={newProjectForm.leadId}
                onChange={(e) => {
                  const selected = leads.find((l: any) => String(l.id) === e.target.value);
                  setNewProjectForm(prev => ({
                    ...prev,
                    leadId: e.target.value,
                    clientName: selected?.clientName || prev.clientName,
                    brandName: selected?.brandName || prev.brandName,
                  }));
                }}
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
                    <span className="tabular-nums text-slate-500">{selectedProject.activeRevision}</span>
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
                    <p className="tabular-nums font-bold text-indigo-700">{selectedProject.sampleWorkDays} Hari Kerja</p>
                    <span className="text-[10px] text-slate-400">Terhitung sejak NPF masuk</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">Jadwal & Timeline</span>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-400">Tgl Masuk NPF</span>
                      <p className="tabular-nums font-bold text-slate-700">{selectedProject.npfEntryDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Target Selesai</span>
                      <p className="tabular-nums font-bold text-slate-700">{selectedProject.targetFinishDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Tgl Pengiriman</span>
                      <p className="tabular-nums font-bold text-slate-700">{selectedProject.shippingDate || "—"}</p>
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
                      <p className="text-[11px] text-slate-500 tabular-nums truncate max-w-xs">{selectedProject.formulaFolderUrl}</p>
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
