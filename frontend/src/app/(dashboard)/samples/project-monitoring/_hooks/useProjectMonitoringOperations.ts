"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import { exportToCsv } from "@/lib/export-utils";
import {
  RndProject,
  CreateProjectForm,
  LeadOption,
  ProjectTabType,
  mapSampleToProject,
} from "../_types/project-monitoring.types";

const INITIAL_FORM: CreateProjectForm = {
  leadId: "",
  projectName: "",
  picFormulator: "Apt. Dedi Kurniawan, S.Farm",
  clientName: "",
  brandName: "",
  npfEntryDate: new Date().toISOString().split("T")[0],
  targetFinishDate: "",
  formulaFolderUrl: "",
  notes: "",
};

export function useProjectMonitoringOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<RndProject | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [newProjectForm, setNewProjectForm] = useState<CreateProjectForm>(INITIAL_FORM);

  const { data: leads = [] } = useQuery<LeadOption[]>({
    queryKey: ["leads-selection"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/pipeline-v2/leads");
        return unwrapResponse(res.data) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawSamples, isLoading } = useQuery<any[]>({
    queryKey: ["rnd-project-monitoring"],
    queryFn: async () => {
      try {
        const res = await api.get("/rnd/samples");
        return unwrapResponse(res.data) as any[];
      } catch {
        return [];
      }
    },
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
  const inProgressCount = projects.filter((p) => p.status === "IN_PROGRESS" || p.status === "REVISION").length;
  const shippedCount = projects.filter((p) => p.status === "TERKIRIM").length;
  const approvedCount = projects.filter((p) => p.status === "APPROVED").length;
  const overdueCount = projects.filter((p) => p.status === "OVERDUE").length;

  const handleLeadChange = (leadId: string) => {
    const selected = leads.find((l) => String(l.id) === leadId);
    setNewProjectForm((prev) => ({
      ...prev,
      leadId,
      clientName: selected?.clientName || selected?.companyName || prev.clientName,
      brandName: selected?.brandName || prev.brandName,
    }));
  };

  const handleCreateProject = async () => {
    if (!newProjectForm.projectName) {
      toast.warning("Form Belum Lengkap", "Nama Project formulasi wajib diisi.");
      return;
    }

    const leadId = newProjectForm.leadId || (leads && leads.length > 0 ? String(leads[0].id) : null);
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
        ...INITIAL_FORM,
        npfEntryDate: new Date().toISOString().split("T")[0],
      });
    } catch (err: any) {
      toast.error("Gagal Mendaftarkan Project", err?.response?.data?.message || "Terjadi kesalahan saat memproses ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    exportToCsv({
      filename: `monitoring-project-rnd-${new Date().toISOString().slice(0, 10)}.csv`,
      title: "Laporan Monitoring Proyek R&D & Formulasi",
      data: filteredProjects,
      columns: [
        { header: "ID Proyek", accessor: "id" },
        { header: "Nama Proyek", accessor: "projectName" },
        { header: "Customer / Klien", accessor: "clientName" },
        { header: "Brand", accessor: "brandName" },
        { header: "Formulator PIC", accessor: "picFormulator" },
        { header: "Revisi Aktif", accessor: "activeRevision" },
        { header: "Tgl Mulai NPF", accessor: "npfEntryDate" },
        { header: "Target Selesai", accessor: "targetFinishDate" },
        { header: "Status", accessor: "statusLabel" },
        { header: "Catatan", accessor: "notes" },
      ],
    });
  };

  const openDetailDrawer = (project: RndProject) => {
    setSelectedProject(project);
    setIsDetailDrawerOpen(true);
  };

  const closeDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    isDetailDrawerOpen,
    setIsDetailDrawerOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isSubmitting,
    newProjectForm,
    setNewProjectForm,
    leads,
    rawSamples,
    isLoading,
    projects,
    filteredProjects,
    totalProjects,
    inProgressCount,
    shippedCount,
    approvedCount,
    overdueCount,
    handleLeadChange,
    handleCreateProject,
    handleExport,
    openDetailDrawer,
    closeDetailDrawer,
    openCreateModal,
    closeCreateModal,
  };
}
