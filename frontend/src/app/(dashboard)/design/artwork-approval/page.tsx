"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  KpiCard,
  TableWrapper,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaDrawer,
  DnaModal,
  DnaTabNav,
  DnaInput,
  DnaTextarea,
  DnaCheckbox
} from "@/components/dna";
import {
  Palette,
  CheckCircle2,
  ExternalLink,
  Plus,
  History,
  Trash2,
  FolderGit2,
  Users,
  ShieldCheck,
  ShoppingCart,
  UploadCloud,
  X,
  Search,
  Award,
  AlertCircle
} from "lucide-react";
import {
  getSharedArtworkProjects,
  saveSharedArtworkProjects,
  getSharedLegalityTasks,
  getSharedSalesOrders,
} from "@/lib/shared-erp-flow";
import { FileText, BookOpen, MessageSquare, AlertTriangle, Clock, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionApproval {
  status: "APPROVED" | "PENDING" | "REVISE";
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface DesignVersion {
  id: string;
  versionNumber: string;
  gdriveUrl: string;
  notes: string;
  uploadedAt: string;
  uploadedBy: string;
  isAcc: boolean;
  approvals: {
    clientBd: VersionApproval;
    qc: VersionApproval;
    purchasing: VersionApproval;
  };
}

interface ArtworkProject {
  id: string;
  projectCode: string;
  clientName: string;
  productName: string;
  soCategory: string;
  packagingType: string;
  batchNumber?: string;
  expiredDate?: string;
  attachmentUrl?: string;
  assignedDesigner: string;
  activeVersionId: string;
  status: "ACC_READY" | "IN_REVISION" | "WAITING_APPROVAL" | "DRAFT";
  versions: DesignVersion[];
  createdAt: string;
  updatedAt: string;
  // Item 64: BPOM fields
  bpomNumber?: string;
  bpomStatus?: "Draft" | "Submitted" | "Approved" | "Rejected";
  bpomHistory?: { status: string; timestamp: string; user: string; notes?: string }[];
}

const SO_CATEGORIES = [
  "Fragrance",
  "Skincare",
  "Decorative Cosmetics",
  "Hair Care",
  "Body Care",
  "Sun Care",
  "Herbal / Natural",
  "Other",
];

const INITIAL_ARTWORK_DATA: ArtworkProject[] = [
  {
    id: "art-001",
    projectCode: "ART-2026-001",
    clientName: "PT Aura Cantika Estetika",
    productName: "Brightening Day Cream 30g",
    packagingType: "Pot Acrylic 30g + Hot Print Gold",
    soCategory: "Skincare",
    assignedDesigner: "Edi (Creative)",
    activeVersionId: "v3",
    status: "ACC_READY",
    createdAt: "2026-08-28",
    updatedAt: "2026-09-03",
    versions: [
      {
        id: "v1",
        versionNumber: "v1",
        gdriveUrl: "https://drive.google.com/drive/folders/1AuraDayCream_v1_draft",
        notes: "Konsep awal desain label & box luar dengan tema pearl gold.",
        uploadedAt: "2026-08-28 10:00",
        uploadedBy: "Edi",
        isAcc: false,
        approvals: {
          clientBd: { status: "REVISE", notes: "Font logo merek minta dibesarkan 15%." },
          qc: { status: "REVISE", notes: "Klaim 'Instant White' harus diubah sesuai regulasi BPOM." },
          purchasing: { status: "APPROVED", notes: "Dimensi pot sesuai standar cetak pabrik." }
        }
      },
      {
        id: "v2",
        versionNumber: "v2",
        gdriveUrl: "https://drive.google.com/drive/folders/1AuraDayCream_v2_revised",
        notes: "Revisi klaim BPOM dan ukuran font brand disesuaikan.",
        uploadedAt: "2026-08-30 14:20",
        uploadedBy: "Edi",
        isAcc: false,
        approvals: {
          clientBd: { status: "APPROVED", notes: "Desain disetujui owner brand." },
          qc: { status: "REVISE", notes: "Nomor NA BPOM perlu space barcode 2mm ke kanan." },
          purchasing: { status: "APPROVED", notes: "Finishing hot print gold siap cetak." }
        }
      },
      {
        id: "v3",
        versionNumber: "v3",
        gdriveUrl: "https://drive.google.com/drive/folders/1AuraDayCream_v3_FINAL_ACC",
        notes: "Final artwork siap cetak (FA / Final Art) dengan layout barcode akurat.",
        uploadedAt: "2026-09-02 09:15",
        uploadedBy: "Edi",
        isAcc: true,
        approvals: {
          clientBd: { status: "APPROVED", notes: "ACC Final via Jessica BD.", updatedAt: "2026-09-02" },
          qc: { status: "APPROVED", notes: "ACC Kompatibilitas BPOM & Legalitas.", updatedAt: "2026-09-02" },
          purchasing: { status: "APPROVED", notes: "File FA dikirim ke vendor percetakan.", updatedAt: "2026-09-03" }
        }
      }
    ]
  },
  {
    id: "art-002",
    projectCode: "ART-2026-002",
    clientName: "CV Glow Botanica Herb",
    productName: "Centella Calming Serum 20ml",
    soCategory: "Skincare",
    packagingType: "Botol Pipet Kaca Amber 20ml + Stiker Vinyl",
    assignedDesigner: "Edi (Creative)",
    activeVersionId: "v2",
    status: "WAITING_APPROVAL",
    createdAt: "2026-08-30",
    updatedAt: "2026-09-03",
    versions: [
      {
        id: "v1",
        versionNumber: "v1",
        gdriveUrl: "https://drive.google.com/drive/folders/1GlowSerum_v1",
        notes: "Desain stiker botol pipet dengan dominasi warna sage green.",
        uploadedAt: "2026-08-30 11:30",
        uploadedBy: "Edi",
        isAcc: false,
        approvals: {
          clientBd: { status: "REVISE", notes: "Warna hijau minta diganti agak emerald matte." },
          qc: { status: "APPROVED", notes: "Daftar komposisi ingredients sudah sesuai formula." },
          purchasing: { status: "APPROVED", notes: "Material stiker doff waterproof aman." }
        }
      },
      {
        id: "v2",
        versionNumber: "v2",
        gdriveUrl: "https://drive.google.com/drive/folders/1GlowSerum_v2_emerald",
        notes: "Penyesuaian warna emerald matte & penambahan logo Halal Indonesia.",
        uploadedAt: "2026-09-02 16:00",
        uploadedBy: "Edi",
        isAcc: true,
        approvals: {
          clientBd: { status: "PENDING", notes: "Menunggu konfirmasi final klien." },
          qc: { status: "APPROVED", notes: "Komposisi dan logo halal sudah sesuai." },
          purchasing: { status: "PENDING", notes: "Menunggu approval klien sebelum rilis PO cetak." }
        }
      }
    ]
  },
  {
    id: "art-003",
    projectCode: "ART-2026-003",
    clientName: "PT Derma Dermacos Solution",
    productName: "Gentle Facial Cleanser 100ml",
    soCategory: "Skincare",
    packagingType: "Tube 100ml Silk Screen Print",
    assignedDesigner: "Edi (Creative)",
    activeVersionId: "v1",
    status: "IN_REVISION",
    createdAt: "2026-09-01",
    updatedAt: "2026-09-03",
    versions: [
      {
        id: "v1",
        versionNumber: "v1",
        gdriveUrl: "https://drive.google.com/drive/folders/1DermaCleanser_v1",
        notes: "Draft artwork kemasan tube silk screen print 3 warna.",
        uploadedAt: "2026-09-01 13:00",
        uploadedBy: "Edi",
        isAcc: true,
        approvals: {
          clientBd: { status: "APPROVED", notes: "Klien setuju konsep minimalis." },
          qc: { status: "REVISE", notes: "Instruksi pemakaian perlu diperjelas urutannya." },
          purchasing: { status: "REVISE", notes: "Gradasi warna tidak bisa disablon tube, gunakan solid color." }
        }
      }
    ]
  }
];

export default function ArtworkApprovalPage() {
  const [projects, setProjects] = useState<ArtworkProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [designerFilter, setDesignerFilter] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState<ArtworkProject | null>(null);

  // Modals / Drawers state
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"detail" | "bpom" | "protocol">("detail");

  // Form states
  const [newProjectForm, setNewProjectForm] = useState({
    projectCode: "",
    clientName: "",
    productName: "",
    soCategory: "Skincare",
    packagingType: "Pot Acrylic 30g",
    batchNumber: "",
    expiredDate: "",
    attachmentUrl: "",
    initialVersion: "v1.0",
    gdriveUrl: "",
    notes: ""
  });

  const [newVersionForm, setNewVersionForm] = useState({
    versionNumber: "",
    gdriveUrl: "",
    notes: "",
    setAsAcc: true
  });

  const [legalityTasks, setLegalityTasks] = useState(getSharedLegalityTasks());

  // Load from localStorage & Shared Flow
  const refreshProjects = () => {
    const saved = localStorage.getItem("NEXERP_ARTWORK_PROJECTS");
    let currentProjects = INITIAL_ARTWORK_DATA;
    if (saved) {
      try {
        currentProjects = JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }

    // Auto-sync projects from LOCKED_ACTIVE SOs
    const activeSos = getSharedSalesOrders().filter(s => s.status === "LOCKED_ACTIVE");
    let hasNew = false;
    const updated = [...currentProjects];

    activeSos.forEach(so => {
      const exists = updated.some(p => p.clientName === so.customerName && p.productName === so.productName);
      if (!exists) {
        hasNew = true;
        const newProj: ArtworkProject = {
          id: `art-so-${so.code}`,
          projectCode: `ART-${so.code.replace(/[^0-9]/g, "").slice(-4)}`,
          clientName: so.customerName,
          productName: so.productName,
          soCategory: so.category || "Skincare",
          packagingType: "Botol Dropper 30ml + Soft Box",
          assignedDesigner: "Edi (Creative)",
          activeVersionId: "v1",
          status: "WAITING_APPROVAL",
          createdAt: so.date,
          updatedAt: new Date().toISOString().split("T")[0],
          versions: [
            {
              id: "v1",
              versionNumber: "v1.0",
              gdriveUrl: "https://drive.google.com/artwork/draft-v1",
              notes: "Draft artwork diinisiasi otomatis dari Sales Order Locked Active.",
              uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
              uploadedBy: "Edi (Creative)",
              isAcc: true,
              approvals: {
                clientBd: { status: "PENDING" },
                qc: { status: "PENDING" },
                purchasing: { status: "PENDING" }
              }
            }
          ]
        };
        updated.push(newProj);
      }
    });

    setProjects(updated);
    if (hasNew || !saved) {
      localStorage.setItem("NEXERP_ARTWORK_PROJECTS", JSON.stringify(updated));
    }
    setLegalityTasks(getSharedLegalityTasks());
  };

  useEffect(() => {
    refreshProjects();

    const handleLegalityChange = () => setLegalityTasks(getSharedLegalityTasks());
    const handleArtworkChange = () => refreshProjects();

    window.addEventListener("nexerp:legality-updated", handleLegalityChange);
    window.addEventListener("nexerp:artwork-updated", handleArtworkChange);

    return () => {
      window.removeEventListener("nexerp:legality-updated", handleLegalityChange);
      window.removeEventListener("nexerp:artwork-updated", handleArtworkChange);
    };
  }, []);

  const saveProjects = (updated: ArtworkProject[]) => {
    setProjects(updated);
    localStorage.setItem("NEXERP_ARTWORK_PROJECTS", JSON.stringify(updated));
  };

  // KPIs
  const totalProjects = projects.length;
  const accReadyCount = projects.filter((p) => p.status === "ACC_READY").length;
  const waitingApprovalCount = projects.filter((p) => p.status === "WAITING_APPROVAL").length;
  const inRevisionCount = projects.filter((p) => p.status === "IN_REVISION").length;

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.packagingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.soCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchDesigner = designerFilter === "ALL" || p.assignedDesigner === designerFilter;
      return matchSearch && matchStatus && matchDesigner;
    });
  }, [projects, searchQuery, statusFilter, designerFilter]);

  // Handle Set Active Version ACC
  const handleSetAccVersion = (projectId: string, versionId: string) => {
    const updated = projects.map((proj) => {
      if (proj.id !== projectId) return proj;

      const newVersions = proj.versions.map((v) => ({
        ...v,
        isAcc: v.id === versionId
      }));

      // Check if all approvals are approved in the selected version
      const selectedVer = newVersions.find((v) => v.id === versionId);
      const isAllApproved =
        selectedVer?.approvals.clientBd.status === "APPROVED" &&
        selectedVer?.approvals.qc.status === "APPROVED" &&
        selectedVer?.approvals.purchasing.status === "APPROVED";

      return {
        ...proj,
        activeVersionId: versionId,
        status: isAllApproved ? ("ACC_READY" as const) : proj.status,
        versions: newVersions,
        updatedAt: new Date().toISOString().split("T")[0]
      };
    });

    saveProjects(updated);
    if (selectedProject?.id === projectId) {
      const current = updated.find((p) => p.id === projectId);
      if (current) setSelectedProject(current);
    }
  };

  // Handle Update Approval Status
  const handleUpdateApproval = (
    projectId: string,
    versionId: string,
    role: "clientBd" | "qc" | "purchasing",
    newStatus: "APPROVED" | "PENDING" | "REVISE",
    notes?: string
  ) => {
    const updated = projects.map((proj) => {
      if (proj.id !== projectId) return proj;

      const newVersions = proj.versions.map((v) => {
        if (v.id !== versionId) return v;
        return {
          ...v,
          approvals: {
            ...v.approvals,
            [role]: {
              status: newStatus,
              notes: notes !== undefined ? notes : v.approvals[role].notes,
              updatedAt: new Date().toISOString().split("T")[0],
              updatedBy: "Edi (Design Workspace)"
            }
          }
        };
      });

      // Recalculate status
      const activeVer = newVersions.find((v) => v.isAcc) || newVersions[newVersions.length - 1];
      let calculatedStatus: ArtworkProject["status"] = "WAITING_APPROVAL";
      const approvals = [
        activeVer.approvals.clientBd.status,
        activeVer.approvals.qc.status,
        activeVer.approvals.purchasing.status
      ];

      if (approvals.every((s) => s === "APPROVED")) {
        calculatedStatus = "ACC_READY";
      } else if (approvals.some((s) => s === "REVISE")) {
        calculatedStatus = "IN_REVISION";
      }

      return {
        ...proj,
        status: calculatedStatus,
        versions: newVersions,
        updatedAt: new Date().toISOString().split("T")[0]
      };
    });

    saveProjects(updated);
    if (selectedProject?.id === projectId) {
      const current = updated.find((p) => p.id === projectId);
      if (current) setSelectedProject(current);
    }
  };

  // Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.clientName || !newProjectForm.productName) {
      alert("Mohon isi Nama Client dan Nama Produk.");
      return;
    }

    const code = newProjectForm.projectCode || `ART-2026-00${projects.length + 1}`;
    const initialVersionObj: DesignVersion = {
      id: "v1",
      versionNumber: newProjectForm.initialVersion || "v1.0",
      gdriveUrl: newProjectForm.gdriveUrl || "https://drive.google.com",
      notes: newProjectForm.notes || "Initial artwork draft upload.",
      uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      uploadedBy: "Edi (Creative)",
      isAcc: true,
      approvals: {
        clientBd: { status: "PENDING" },
        qc: { status: "PENDING" },
        purchasing: { status: "PENDING" }
      }
    };

    const newProj: ArtworkProject = {
      id: `art-${Date.now()}`,
      projectCode: code,
      clientName: newProjectForm.clientName,
      productName: newProjectForm.productName,
      soCategory: newProjectForm.soCategory,
      packagingType: newProjectForm.packagingType,
      batchNumber: newProjectForm.batchNumber || `BATCH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
      expiredDate: newProjectForm.expiredDate || `${new Date().getFullYear() + 2}-12-31`,
      attachmentUrl: newProjectForm.attachmentUrl,
      assignedDesigner: "Edi (Creative)",
      activeVersionId: "v1",
      status: "WAITING_APPROVAL",
      versions: [initialVersionObj],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0]
    };

    saveProjects([newProj, ...projects]);
    setIsNewProjectModalOpen(false);
    setNewProjectForm({
      projectCode: "",
      clientName: "",
      productName: "",
      soCategory: "Skincare",
      packagingType: "Pot Acrylic 30g",
      batchNumber: "",
      expiredDate: "",
      attachmentUrl: "",
      initialVersion: "v1.0",
      gdriveUrl: "",
      notes: ""
    });
  };

  // Add New Revision Version
  const handleAddNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newVersionForm.versionNumber) return;

    const nextVerId = `v${selectedProject.versions.length + 1}`;
    const newVerObj: DesignVersion = {
      id: nextVerId,
      versionNumber: newVersionForm.versionNumber,
      gdriveUrl: newVersionForm.gdriveUrl || "https://drive.google.com",
      notes: newVersionForm.notes || "Penyesuaian revisi desain.",
      uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      uploadedBy: "Edi (Creative)",
      isAcc: newVersionForm.setAsAcc,
      approvals: {
        clientBd: { status: "PENDING" },
        qc: { status: "PENDING" },
        purchasing: { status: "PENDING" }
      }
    };

    const updated = projects.map((p) => {
      if (p.id !== selectedProject.id) return p;

      const newVersions = newVersionForm.setAsAcc
        ? p.versions.map((v) => ({ ...v, isAcc: false })).concat(newVerObj)
        : [...p.versions, newVerObj];

      return {
        ...p,
        activeVersionId: newVersionForm.setAsAcc ? nextVerId : p.activeVersionId,
        status: "WAITING_APPROVAL" as const,
        versions: newVersions,
        updatedAt: new Date().toISOString().split("T")[0]
      };
    });

    saveProjects(updated);
    const updatedSelected = updated.find((p) => p.id === selectedProject.id);
    if (updatedSelected) setSelectedProject(updatedSelected);

    setIsNewVersionModalOpen(false);
    setNewVersionForm({
      versionNumber: "",
      gdriveUrl: "",
      notes: "",
      setAsAcc: true
    });
  };

  // Delete Project
  const handleDeleteProject = (projectId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus project artwork ini?")) return;
    const updated = projects.filter((p) => p.id !== projectId);
    saveProjects(updated);
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setIsDetailDrawerOpen(false);
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Page Header */}
      <DnaPageHeader
        title="Artwork Approval & Design History"
        badge={<DnaBadge status="purple">DESIGN WORKSPACE</DnaBadge>}
        subtitle="Kelola versi desain kemasan, persetujuan multi-stakeholder (Client via BD, QC, Purchasing), dan arsip file Google Drive."
        action={
          <DnaButton
            variant="primary"
            onClick={() => {
              setNewProjectForm({
                projectCode: `ART-2026-00${projects.length + 1}`,
                clientName: "",
                productName: "",
                soCategory: "Skincare",
                packagingType: "Pot Acrylic 30g + Hot Print Gold",
                batchNumber: "",
                expiredDate: "",
                attachmentUrl: "",
                initialVersion: "v1.0",
                gdriveUrl: "",
                notes: ""
              });
              setIsNewProjectModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Project Artwork Baru
          </DnaButton>
        }
      />

      {/* 2. KPI Metrics Grid */}
      <DnaKpiGrid>
        <KpiCard
          label="Total Project Artwork"
          value={totalProjects}
          subtext="Semua desain kemasan aktif"
          variant="slate"
        />
        <KpiCard
          label="ACC / Siap Cetak (FA)"
          value={accReadyCount}
          subtext="Disetujui Client, QC & Purchasing"
          variant="emerald"
        />
        <KpiCard
          label="Menunggu Approval"
          value={waitingApprovalCount}
          subtext="Dalam antrean review approval"
          variant="amber"
        />
        <KpiCard
          label="Dalam Proses Revisi"
          value={inRevisionCount}
          subtext="Memerlukan penyesuaian desain"
          variant="rose"
        />
      </DnaKpiGrid>

      {/* 3. Filter & Search Toolbar via Visual DNA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <DnaTabNav
            tabs={[
              { id: "ALL", label: "Semua Project", badge: projects.length },
              { id: "ACC_READY", label: "ACC / Siap Cetak", badge: accReadyCount },
              { id: "WAITING_APPROVAL", label: "Menunggu Approval", badge: waitingApprovalCount },
              { id: "IN_REVISION", label: "Dalam Revisi", badge: inRevisionCount },
            ]}
            activeTab={statusFilter}
            onChange={(tabId) => setStatusFilter(tabId)}
          />
          <select
            className="h-9 w-44 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            value={designerFilter}
            onChange={(e) => setDesignerFilter(e.target.value)}
          >
            <option value="ALL">Semua Desainer</option>
            <option value="Edi (Creative)">Edi (Creative)</option>
          </select>
        </div>

        <div className="w-72">
          <DnaInput
            placeholder="Cari kode project, client, produk, kemasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* 4. Table of Artwork Projects via Visual DNA */}
      <TableWrapper>
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh>KODE &amp; CLIENT</DnaTh>
              <DnaTh>PRODUK &amp; KEMASAN</DnaTh>
              <DnaTh>KATEGORI SO</DnaTh>
              <DnaTh align="center">IZIN EDAR BPOM</DnaTh>
              <DnaTh>VERSI ACC / DIGUNAKAN</DnaTh>
              <DnaTh>MULTI-STAKEHOLDER APPROVAL</DnaTh>
              <DnaTh>FILE GDRIVE</DnaTh>
              <DnaTh>STATUS</DnaTh>
              <DnaTh align="right">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredProjects.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                  Tidak ada project artwork yang sesuai pencarian.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredProjects.map((project) => {
                const activeVer = project.versions.find((v) => v.isAcc) || project.versions[project.versions.length - 1];
                const matchedLegality = legalityTasks.find(
                  (l) => l.customerName === project.clientName || l.productName === project.productName
                );
                // Item 64: use project bpomNumber, fall back to legality match
                const bpomNum = project.bpomNumber || matchedLegality?.bpomRegNumber;
                const bpomStat = project.bpomStatus;
                const bpomStatusLabel: Record<string, string> = {
                  Draft: "Draft",
                  Submitted: "Submitted",
                  Approved: "Approved",
                  Rejected: "Rejected",
                };

                return (
                  <DnaTableRow key={project.id}>
                    {/* Project & Client */}
                    <DnaTd>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 tracking-wider">
                          {project.projectCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {project.clientName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Desainer: {project.assignedDesigner}
                        </span>
                      </div>
                    </DnaTd>

                    {/* Product & Packaging Type */}
                    <DnaTd>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {project.productName}
                        </span>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          {project.packagingType}
                        </span>
                      </div>
                    </DnaTd>

                    {/* Kategori SO */}
                    <DnaTd align="center">
                      {project.soCategory ? (
                        <DnaBadge variant="purple">{project.soCategory}</DnaBadge>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </DnaTd>

                    {/* BPOM Status Indicator — Item 64: bpomNumber + bpomStatus */}
                    <DnaTd align="center">
                      {bpomNum ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <DnaBadge status={bpomStat === "Approved" ? "success" : bpomStat === "Rejected" ? "critical" : "info"}>
                            {bpomStat ? bpomStatusLabel[bpomStat] : "Registered"}
                          </DnaBadge>
                          <span className="font-mono text-[9px] font-bold text-blue-700">{bpomNum}</span>
                          {bpomStat && (
                            <span className="text-[8px] text-slate-400">{bpomStat}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <DnaBadge status="warning">Belum Terbit</DnaBadge>
                          <span className="text-[9px] text-amber-600 dark:text-amber-400">—</span>
                        </div>
                      )}
                    </DnaTd>

                    {/* Active ACC Version */}
                    <DnaTd>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 text-[11px] font-black bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
                          {activeVer.versionNumber}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ★ ACC
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 block mt-1">
                        {project.versions.length} Total Versi Riwayat
                      </span>
                    </DnaTd>

                    {/* Approval Pills */}
                    <DnaTd>
                      <div className="flex flex-col gap-1 text-[10px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-600 flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-500" /> Client (BD):
                          </span>
                          <ApprovalBadge status={activeVer.approvals.clientBd.status} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-600 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> QC Lab:
                          </span>
                          <ApprovalBadge status={activeVer.approvals.qc.status} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-600 flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3 text-amber-500" /> Purchasing:
                          </span>
                          <ApprovalBadge status={activeVer.approvals.purchasing.status} />
                        </div>
                      </div>
                    </DnaTd>

                    {/* GDrive Link */}
                    <DnaTd>
                      <a
                        href={activeVer.gdriveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        GDrive FA
                      </a>
                    </DnaTd>

                    {/* Overall Status */}
                    <DnaTd>
                      {project.status === "ACC_READY" ? (
                        <DnaBadge status="success">🟢 SIAP CETAK (ACC)</DnaBadge>
                      ) : project.status === "IN_REVISION" ? (
                        <DnaBadge status="critical">🔴 PROSES REVISI</DnaBadge>
                      ) : (
                        <DnaBadge status="warning">🟡 MENUNGGU REVIEW</DnaBadge>
                      )}
                    </DnaTd>

                    {/* Actions */}
                    <DnaTd align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <DnaButton
                          variant="secondary"
                          size="sm"
                          icon={<History className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedProject(project);
                            setIsDetailDrawerOpen(true);
                          }}
                        >
                          Riwayat & Approval
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                          onClick={() => handleDeleteProject(project.id)}
                          title="Hapus Project"
                        />
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>

      {/* 5. Detail & Design History Drawer */}
      <DnaDrawer
        isOpen={isDetailDrawerOpen && !!selectedProject}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={`Riwayat Versi Desain — ${selectedProject?.projectCode}`}
        badge={selectedProject?.status}
        className="max-w-2xl"
      >
        {selectedProject && (
          <div className="space-y-4">
            {/* Project Summary Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Nama Klien & Produk
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {selectedProject.clientName} • {selectedProject.productName}
                  </span>
                </div>
                <div>
                  {selectedProject.status === "ACC_READY" ? (
                    <DnaBadge status="success">FINAL ACC APPROVED</DnaBadge>
                  ) : (
                    <DnaBadge status="warning">REVIEW IN PROGRESS</DnaBadge>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <span>Kemasan: <strong>{selectedProject.packagingType}</strong></span>
                <span>No. Batch: <strong className="font-mono text-purple-700 dark:text-purple-300">{selectedProject.batchNumber || "BATCH-202609-01"}</strong></span>
                <span>Exp Date: <strong className="font-mono text-amber-700 dark:text-amber-300">{selectedProject.expiredDate || "2028-12-31"}</strong></span>
                <span>Desainer: <strong>{selectedProject.assignedDesigner}</strong></span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
              {[
                { id: "detail", label: "Detail & Versi", icon: <FolderGit2 className="w-3.5 h-3.5" /> },
                { id: "bpom", label: "Dokumen BPOM", icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: "protocol", label: "Protokol Komunikasi", icon: <MessageSquare className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id as typeof drawerTab)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                    drawerTab === tab.id
                      ? "border-purple-600 text-purple-700 dark:text-purple-300"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Detail & Versi */}
            {drawerTab === "detail" && (
              <div className="space-y-4">
                <div className="space-y-4">
                  {selectedProject.versions.map((ver) => {
                    return (
                      <div
                        key={ver.id}
                        className={`border rounded-2xl p-4 transition-all ${
                          ver.isAcc
                            ? "bg-purple-50/40 border-purple-300 ring-2 ring-purple-200/60"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        {/* Version Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                          <div className="flex items-center gap-2.5">
                            <span className="px-3 py-1 bg-purple-700 text-white text-xs font-black rounded-xl">
                              {ver.versionNumber}
                            </span>
                            {ver.isAcc && (
                              <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                VERSI ACC DIGUNAKAN
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-medium">
                              Diunggah: {ver.uploadedAt} oleh {ver.uploadedBy}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!ver.isAcc && (
                              <DnaButton
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetAccVersion(selectedProject.id, ver.id)}
                              >
                                Jadikan ACC
                              </DnaButton>
                            )}
                            <a
                              href={ver.gdriveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Buka GDrive ↗
                            </a>
                          </div>
                        </div>

                        {/* Version Notes / Changelog */}
                        <div className="my-3 p-2.5 bg-slate-100/70 rounded-xl text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">
                            Catatan Perubahan / Desain:
                          </span>
                          {ver.notes || "Tidak ada catatan."}
                        </div>

                        {/* 3 Stakeholders Approval Controls: BusDev, QC, Purchasing */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          {/* 1. BusDev / Client */}
                          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-500" /> BusDev & Client
                              </span>
                              <ApprovalBadge status={ver.approvals.clientBd.status} />
                            </div>
                            <p className="text-[11px] text-slate-500 truncate" title={ver.approvals.clientBd.notes}>
                              {ver.approvals.clientBd.notes || "Belum ada catatan."}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <DnaButton
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                                onClick={() => handleUpdateApproval(selectedProject.id, ver.id, "clientBd", "APPROVED")}
                              >
                                ✓ ACC BusDev
                              </DnaButton>
                              <DnaButton
                                variant="danger"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  const note = prompt("Masukkan catatan revisi BusDev / Client:");
                                  if (note !== null) handleUpdateApproval(selectedProject.id, ver.id, "clientBd", "REVISE", note);
                                }}
                              >
                                ✕ Revisi
                              </DnaButton>
                            </div>
                          </div>

                          {/* 2. QC Lab */}
                          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> QC Lab
                              </span>
                              <ApprovalBadge status={ver.approvals.qc.status} />
                            </div>
                            <p className="text-[11px] text-slate-500 truncate" title={ver.approvals.qc.notes}>
                              {ver.approvals.qc.notes || "Belum ada catatan."}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <DnaButton
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                                onClick={() => handleUpdateApproval(selectedProject.id, ver.id, "qc", "APPROVED")}
                              >
                                ✓ ACC QC
                              </DnaButton>
                              <DnaButton
                                variant="danger"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  const note = prompt("Masukkan catatan revisi QC Lab:");
                                  if (note !== null) handleUpdateApproval(selectedProject.id, ver.id, "qc", "REVISE", note);
                                }}
                              >
                                ✕ Revisi
                              </DnaButton>
                            </div>
                          </div>

                          {/* 3. Purchasing */}
                          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center gap-1.5">
                                <ShoppingCart className="w-3.5 h-3.5 text-amber-500" /> Purchasing
                              </span>
                              <ApprovalBadge status={ver.approvals.purchasing.status} />
                            </div>
                            <p className="text-[11px] text-slate-500 truncate" title={ver.approvals.purchasing.notes}>
                              {ver.approvals.purchasing.notes || "Belum ada catatan."}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <DnaButton
                                variant="outline"
                                size="sm"
                                className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                                onClick={() => handleUpdateApproval(selectedProject.id, ver.id, "purchasing", "APPROVED")}
                              >
                                ✓ ACC Purchase
                              </DnaButton>
                              <DnaButton
                                variant="danger"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  const note = prompt("Masukkan catatan revisi Purchasing / Cetak:");
                                  if (note !== null) handleUpdateApproval(selectedProject.id, ver.id, "purchasing", "REVISE", note);
                                }}
                              >
                                ✕ Revisi
                              </DnaButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <DnaButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setNewVersionForm({
                      versionNumber: `v${selectedProject.versions.length + 1}.0`,
                      gdriveUrl: "",
                      notes: "",
                      setAsAcc: true
                    });
                    setIsNewVersionModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Upload Versi Revisi
                </DnaButton>
              </div>
            )}

            {/* Tab: Dokumen BPOM */}
            {drawerTab === "bpom" && (
              <div className="space-y-4">
                {(() => {
                  const matchedLegality = legalityTasks.find(
                    (l) => l.customerName === selectedProject.clientName || l.productName === selectedProject.productName
                  );
                  return (
                    <div className="space-y-3">
                      {/* BPOM Registration Number Card — Item 64 & 65: editable bpomNumber/bpomStatus + history */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-black text-slate-900 uppercase">Dokumen Pendukung — BPOM</h4>
                        </div>
                        {/* Item 64: inline bpomNumber + bpomStatus editable fields */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-1">No. BPOM</label>
                            <DnaInput
                              placeholder="NA18260100452"
                              value={selectedProject.bpomNumber || matchedLegality?.bpomRegNumber || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, bpomNumber: val } : p));
                                setSelectedProject((prev: any) => prev ? { ...prev, bpomNumber: val } : prev);
                              }}
                              className="text-xs h-8"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-1">Status BPOM</label>
                            <select
                              className="w-full h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white"
                              value={selectedProject.bpomStatus || ""}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                const now = new Date().toISOString().split("T")[0];
                                setProjects(prev => prev.map(p => {
                                  if (p.id !== selectedProject.id) return p;
                                  const newHistory = [
                                    ...(p.bpomHistory || []),
                                    { status: val, timestamp: now, user: "Edi (Design)", notes: "" },
                                  ];
                                  return { ...p, bpomStatus: val, bpomHistory: newHistory };
                                }));
                                setSelectedProject((prev: any) => prev ? { ...prev, bpomStatus: val } : prev);
                              }}
                            >
                              <option value="">— Pilih —</option>
                              <option value="Draft">Draft</option>
                              <option value="Submitted">Submitted</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">Status BPOM:</span>
                            {selectedProject.bpomStatus === "Approved" ? (
                              <DnaBadge status="success">TERBIT</DnaBadge>
                            ) : selectedProject.bpomStatus === "Submitted" ? (
                              <DnaBadge status="warning">SUBMITTED</DnaBadge>
                            ) : selectedProject.bpomStatus === "Rejected" ? (
                              <DnaBadge status="critical">REJECTED</DnaBadge>
                            ) : selectedProject.bpomNumber || matchedLegality?.bpomRegNumber ? (
                              <DnaBadge status="info">DRAFT</DnaBadge>
                            ) : (
                              <DnaBadge status="critical">BELUM TERBIT</DnaBadge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">No. Registrasi:</span>
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {selectedProject.bpomNumber || matchedLegality?.bpomRegNumber || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">No. Aplikasi:</span>
                            <span className="text-xs font-mono text-slate-700">
                              {matchedLegality?.applicationNumber || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">Tanggal Terbit:</span>
                            <span className="text-xs font-mono text-slate-700">
                              {matchedLegality?.issuedDate || "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">PIC APJ:</span>
                            <span className="text-xs text-slate-700">{matchedLegality?.apjPic || "—"}</span>
                          </div>
                          {matchedLegality?.documentUrl && (
                            <div className="pt-2 border-t border-slate-200">
                              <a
                                href={matchedLegality.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Buka Dokumen BPOM ↗
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Attachment from Artwork Project */}
                      {selectedProject.attachmentUrl && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                            <h4 className="text-xs font-black text-slate-900 uppercase">Lampiran File Referensi</h4>
                          </div>
                          <a
                            href={selectedProject.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Buka Lampiran ↗
                          </a>
                        </div>
                      )}

                      {/* Item 65: BPOM status history timeline */}
                      {(selectedProject.bpomHistory?.length ?? 0) > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <History className="w-4 h-4 text-blue-600" />
                            <h4 className="text-xs font-black text-slate-900 uppercase">Riwayat Status BPOM</h4>
                          </div>
                          <div className="space-y-2">
                            {(selectedProject.bpomHistory || []).map((h, i) => (
                              <div key={i} className="flex items-start gap-2 text-[10px]">
                                <span className={cn(
                                  "w-2 h-2 mt-1 rounded-full flex-shrink-0",
                                  h.status === "Approved" ? "bg-emerald-500" :
                                  h.status === "Submitted" ? "bg-amber-500" :
                                  h.status === "Rejected" ? "bg-rose-500" : "bg-slate-400"
                                )} />
                                <div>
                                  <span className="font-semibold text-slate-700">{h.status}</span>
                                  <span className="text-slate-400 ml-1">{h.timestamp}</span>
                                  <span className="text-slate-400 ml-1">· {h.user}</span>
                                  {h.notes && <span className="text-slate-500 ml-1">— {h.notes}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!matchedLegality && !selectedProject.bpomNumber && !selectedProject.attachmentUrl && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <p className="text-xs text-amber-700">
                            Belum ada data BPOM atau lampiran untuk project ini. Hubungi tim Legalitas untuk update.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tab: Protokol Komunikasi */}
            {drawerTab === "protocol" && (
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-black text-purple-900 uppercase">Protokol Komunikasi Tim Design</h4>
                  </div>
                  <div className="space-y-2 text-xs text-purple-800">
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">1. Cara Mengajukan Input Design</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Brief design diajukan via ticket di Creative Board atau langsung ke <strong>Edi (Creative)</strong>.</li>
                        <li>Include: Nama produk, brand guidelines, referensi desain (moodboard), dan target tanggal publish.</li>
                        <li>Jika ada regulasi BPOM, lampirkan nomor notifikasi atau klaim yang sudah disetujui.</li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">2. Deadline Pengajuan</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Desain draft: <strong>3 hari kerja</strong> setelah brief diterima.</li>
                        <li>Revisi minor: <strong>1 hari kerja</strong>.</li>
                        <li>Revisi major / brief baru: <strong>3 hari kerja</strong>.</li>
                        <li>Jika deadline terlewat, eskalasi ke <strong>Head of Creative</strong>.</li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">3. Alur Persetujuan</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Desain draft → review <strong>BusDev</strong> (konfirmasi branding & klaim).</li>
                        <li>Setelah ACC BusDev → review <strong>QC Lab</strong> (validasi klaim BPOM & regulatory).</li>
                        <li>Setelah ACC QC → review <strong> Purchasing</strong> (konfirmasi spesifikasi cetak & vendor).</li>
                        <li>KETIGA approval harus <strong>APPROVED</strong> sebelum artwork bisa di-ACC final.</li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">4. Aturan Revisi</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Revisi ke-1 s/d ke-3: gratis, termasuk dalam biaya desain awal.</li>
                        <li>Revisi ke-4+: akan ada biaya tambahan sesuai kompleksitas (ditentukan oleh Head of Creative).</li>
                        <li>Setiap revisi wajib dicatat di kolom notes versi di Creative Board.</li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900">5. Escalation</p>
                      <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                        <li>Jika klien tidak memberikan feedback dalam <strong>5 hari kerja</strong>, eskalasi ke <strong>BusDev PIC</strong>.</li>
                        <li>Jika deadlock antar stakeholder (BD vs QC vs Purchasing), eskalasi ke <strong>Direksi / Head of R&D</strong>.</li>
                        <li>Jika revisi sudah 3x dan masih REVISE, sistem otomatis eskalasi ke Head of Creative.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <p className="text-xs text-slate-600">
                    Protokol ini berlaku untuk seluruh project desain kemasan. Update terakhir: <strong>September 2026</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DnaDrawer>

      {/* 6. Modal Create New Artwork Project */}
      <DnaModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Buat Project Artwork Baru"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            Daftarkan produk baru untuk mulai proses desain kemasan dan approval.
          </p>

          <form onSubmit={handleCreateProject} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Kode Project:</label>
              <DnaInput
                type="text"
                value={newProjectForm.projectCode}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, projectCode: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Nama Client / Brand:</label>
              <DnaInput
                type="text"
                placeholder="Contoh: PT Aura Cantika Estetika"
                value={newProjectForm.clientName}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, clientName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Nama Produk:</label>
              <DnaInput
                type="text"
                placeholder="Contoh: Brightening Day Cream 30g"
                value={newProjectForm.productName}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, productName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Kategori SO:</label>
              <select
                className="w-full h-9 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                value={newProjectForm.soCategory}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, soCategory: e.target.value })}
              >
                {SO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Tipe Kemasan & Finishing:</label>
              <DnaInput
                type="text"
                placeholder="Contoh: Pot Acrylic 30g + Hot Print Gold"
                value={newProjectForm.packagingType}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, packagingType: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Batch Number (No. Batch):</label>
                <DnaInput
                  type="text"
                  placeholder="Contoh: BATCH-202609-01"
                  value={newProjectForm.batchNumber}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, batchNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Expired Date (Kedaluwarsa):</label>
                <DnaInput
                  type="date"
                  value={newProjectForm.expiredDate}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, expiredDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Link Lampiran / File Referensi:</label>
              <DnaInput
                type="url"
                placeholder="https://drive.google.com/... atau tautan file lainnya"
                value={newProjectForm.attachmentUrl}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, attachmentUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Link Google Drive (File Desain):</label>
              <DnaInput
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={newProjectForm.gdriveUrl}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, gdriveUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Catatan Desain Awal:</label>
              <DnaTextarea
                rows={2}
                placeholder="Catatan konsep desain, warna dominan, dll..."
                value={newProjectForm.notes}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <DnaButton variant="secondary" onClick={() => setIsNewProjectModalOpen(false)}>
                Batal
              </DnaButton>
              <DnaButton variant="primary" type="submit">
                Simpan Project
              </DnaButton>
            </div>
          </form>
        </div>
      </DnaModal>

      {/* 7. Modal Add Revision Version */}
      <DnaModal
        isOpen={Boolean(isNewVersionModalOpen && selectedProject)}
        onClose={() => setIsNewVersionModalOpen(false)}
        title="Upload Versi Revisi Baru"
        maxWidth="max-w-md"
      >
        {selectedProject && (
          <div className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              Project: <span className="font-bold text-foreground">{selectedProject.productName}</span>
            </p>

            <form onSubmit={handleAddNewVersion} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Nomor Versi:</label>
                <DnaInput
                  type="text"
                  placeholder="Contoh: v2.0 atau v3.0 - Final ACC"
                  value={newVersionForm.versionNumber}
                  onChange={(e) => setNewVersionForm({ ...newVersionForm, versionNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Link Google Drive (File Desain):</label>
                <DnaInput
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newVersionForm.gdriveUrl}
                  onChange={(e) => setNewVersionForm({ ...newVersionForm, gdriveUrl: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Catatan Perubahan (Changelog):</label>
                <DnaTextarea
                  rows={3}
                  placeholder="Apa saja yang diperbaiki pada revisi ini..."
                  value={newVersionForm.notes}
                  onChange={(e) => setNewVersionForm({ ...newVersionForm, notes: e.target.value })}
                />
              </div>

              <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                <DnaCheckbox
                  id="setAsAcc"
                  checked={newVersionForm.setAsAcc}
                  onChange={(e) => setNewVersionForm({ ...newVersionForm, setAsAcc: e.target.checked })}
                  label="Jadikan versi ini sebagai Versi ACC / Aktif"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                <DnaButton variant="secondary" onClick={() => setIsNewVersionModalOpen(false)}>
                  Batal
                </DnaButton>
                <DnaButton variant="primary" type="submit">
                  Tambahkan Versi
                </DnaButton>
              </div>
            </form>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}

function ApprovalBadge({ status }: { status: "APPROVED" | "PENDING" | "REVISE" }) {
  if (status === "APPROVED") {
    return <DnaBadge variant="success">✓ ACC</DnaBadge>;
  }
  if (status === "REVISE") {
    return <DnaBadge variant="danger">✕ REVISI</DnaBadge>;
  }
  return <DnaBadge variant="warning">⏱ PENDING</DnaBadge>;
}
