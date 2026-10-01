import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  RndProjectRecord,
  CreateProjectFormData,
  LeadOption,
  mapSampleToRecord,
} from "../_types/project-monitoring.types";

const initialCreateForm: CreateProjectFormData = {
  leadId: "",
  productName: "",
  targetFunction: "",
  textureReq: "Gel Transparan",
  colorReq: "Clear",
  aromaReq: "Floral Natural",
  targetDeadline: "",
};

export function useRndProjectMonitoringOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<RndProjectRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProjectFormData>(initialCreateForm);

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

  const { data: leads = [] } = useQuery<LeadOption[]>({
    queryKey: ["rnd-leads-selection"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/pipeline-v2/leads");
        return (unwrapResponse(res.data) as LeadOption[]) || [];
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
      setCreateForm(initialCreateForm);
    } catch (err: any) {
      toast.error("Gagal Membuat Proyek", err?.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncLab = () => {
    refetch();
    toast.success("Data Disinkronkan", "Jadwal dan status pengujian R&D telah diperbarui.");
  };

  const openCreateModal = () => setIsCreateOpen(true);
  const closeCreateModal = () => setIsCreateOpen(false);
  const openDetailModal = (project: RndProjectRecord) => setSelectedProject(project);
  const closeDetailModal = () => setSelectedProject(null);

  const totalCount = projects.length;
  const labCount = projects.filter((p) => p.currentPhase === "Formulasi Lab").length;
  const stabilityCount = projects.filter((p) => p.currentPhase === "Uji Stabilitas").length;
  const sampleCount = projects.filter((p) => p.currentPhase === "Sample Client").length;
  const readyCount = projects.filter((p) => p.currentPhase === "Siap Produksi").length;

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    openDetailModal,
    closeDetailModal,
    isCreateOpen,
    openCreateModal,
    closeCreateModal,
    isSubmitting,
    createForm,
    setCreateForm,
    projects,
    filteredProjects,
    leads,
    isLoading,
    handleCreateProject,
    handleSyncLab,
    totalCount,
    labCount,
    stabilityCount,
    sampleCount,
    readyCount,
  };
}
