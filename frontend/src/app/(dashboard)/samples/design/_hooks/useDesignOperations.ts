"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDnaToast } from "@/components/dna";
import { api, extractApiError } from "@/lib/api";
import {
  DesignTask,
  AvailableSalesOrder,
  DesignFormData,
  DesignKpiStats,
  unwrapList,
} from "../_types/design.types";

export function useDesignOperations() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useDnaToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<DesignTask | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<DesignTask[]>({
    queryKey: ["creative-tasks"],
    queryFn: async () => {
      try {
        const res = await api.get("/creative/tasks");
        return unwrapList(res.data).map(
          (item: any): DesignTask => ({
            id: item.id,
            brief: item.brief || "â€”",
            taskType: item.taskType || null,
            kanbanState: item.kanbanState || "INBOX",
            revisionCount: Number(item.revisionCount ?? 0),
            isLocked: Boolean(item.isLocked),
            isFinal: Boolean(item.isFinal),
            slaDeadline: item.slaDeadline || null,
            finalArtworkUrl: item.finalArtworkUrl || null,
            finalMockupUrl: item.finalMockupUrl || null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            lead: item.lead
              ? {
                  id: item.lead.id,
                  clientName: item.lead.clientName || "â€”",
                  brandName: item.lead.brandName || null,
                  productInterest: item.lead.productInterest || null,
                }
              : null,
            versions: Array.isArray(item.versions)
              ? item.versions.map((v: any) => ({
                  id: v.id,
                  versionNumber: Number(v.versionNumber ?? 0),
                  artworkUrl: v.artworkUrl || null,
                  mockupUrl: v.mockupUrl || null,
                }))
              : [],
          })
        );
      } catch {
        return [];
      }
    },
  });

  // Sales order picker for the create form (drives leadId server-side).
  const { data: salesOrders = [] } = useQuery<AvailableSalesOrder[]>({
    queryKey: ["creative-available-sales-orders"],
    enabled: isCreateModalOpen,
    queryFn: async () => {
      try {
        const res = await api.get("/creative/available-sales-orders");
        return unwrapList(res.data).map(
          (so: any): AvailableSalesOrder => ({
            id: so.id,
            orderNumber: so.orderNumber || "â€”",
            leadId: so.leadId,
            brandName: so.brandName || null,
            lead: so.lead
              ? { clientName: so.lead.clientName || "â€”", brandName: so.lead.brandName || null }
              : null,
          })
        );
      } catch {
        return [];
      }
    },
  });

  const [formData, setFormData] = useState<DesignFormData>({
    soId: "",
    brief: "",
    taskType: "PACKAGING",
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const so = salesOrders.find((s) => s.id === formData.soId);
      if (!so) throw new Error("Pilih Sales Order terlebih dahulu.");
      const res = await api.post("/creative/task", {
        leadId: so.leadId,
        soId: so.id,
        brief: formData.brief,
        taskType: formData.taskType,
      });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative-tasks"] });
      setIsCreateModalOpen(false);
      setFormData({ soId: "", brief: "", taskType: "PACKAGING" });
      toast.success("Desain Berhasil Dibuat", "Task desain masuk ke papan Creative.");
    },
    onError: (error) => {
      const { message } = extractApiError(error);
      toast.error("Gagal Membuat Desain", message || "Task desain tidak dapat dibuat.");
    },
  });

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.soId) {
      toast.warning("Lengkapi Data", "Sales Order wajib dipilih.");
      return;
    }
    if (formData.brief.trim().length < 3) {
      toast.warning("Lengkapi Data", "Brief desain wajib diisi.");
      return;
    }
    createMutation.mutate();
  };

  const filteredDesigns = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.brief.toLowerCase().includes(q) ||
        (d.lead?.clientName || "").toLowerCase().includes(q) ||
        (d.lead?.brandName || "").toLowerCase().includes(q) ||
        (d.lead?.productInterest || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "REVISION"
          ? d.kanbanState === "REVISION" || d.revisionCount > 0
          : d.kanbanState === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

  const stats: DesignKpiStats = useMemo(() => {
    const totalBerjalan = data.length;
    const menungguApproval = data.filter(
      (d) => d.kanbanState === "WAITING_APJ" || d.kanbanState === "WAITING_CLIENT"
    ).length;
    const disetujui = data.filter((d) => d.isLocked || d.isFinal).length;
    const perluRevisi = data.filter(
      (d) => d.kanbanState === "REVISION" || d.revisionCount > 0
    ).length;

    return { totalBerjalan, menungguApproval, disetujui, perluRevisi };
  }, [data]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedDesign,
    setSelectedDesign,
    formData,
    setFormData,
    data,
    isLoading,
    isError,
    refetch,
    salesOrders,
    createMutation,
    handleSaveDesign,
    filteredDesigns,
    stats,
  };
}
