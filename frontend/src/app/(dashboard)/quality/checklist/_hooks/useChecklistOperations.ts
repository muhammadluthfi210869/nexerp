"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import {
  ChecklistItem,
  ChecklistCategory,
  ChecklistActiveTab,
  NewChecklistForm,
  UNKNOWN,
} from "../_types";

export function useChecklistOperations() {
  const searchParams = useSearchParams();
  const { showToast } = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ChecklistActiveTab>("checklist");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false);
  const [selectedManageItem, setSelectedManageItem] = useState<ChecklistItem | null>(null);

  // â”€â”€ TAB 1 + 3: live checklists (no literal fallback anywhere) â”€â”€
  const {
    data: checklists = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ChecklistItem[]>({
    queryKey: ["qc-checklists"],
    queryFn: async () => {
      const res = await api.get("/qc/checklists");
      const raw = res.data?.data || res.data || [];
      if (!Array.isArray(raw)) return [];
      return raw.map(
        (c: any): ChecklistItem => ({
          id: c.id,
          title: c.title || UNKNOWN,
          salesOrderId: c.salesOrderId ?? null,
          workOrderId: c.workOrderId ?? null,
          status: c.status || "PENDING",
          items: Array.isArray(c.items) ? c.items : [],
          completedItems: Array.isArray(c.completedItems) ? c.completedItems : [],
          notes: c.notes ?? null,
          progress: Number(c.progress ?? 0),
          createdAt: c.createdAt ?? "",
          updatedAt: c.updatedAt ?? "",
          creator: c.creator ?? undefined,
        }),
      );
    },
  });

  // â”€â”€ TAB 2: live categories, read-only â”€â”€
  const {
    data: categories = [],
    isLoading: catLoading,
    isError: catError,
    refetch: refetchCategories,
  } = useQuery<ChecklistCategory[]>({
    queryKey: ["qc-checklist-categories"],
    queryFn: async () => {
      const res = await api.get("/qc/checklists/categories");
      const raw = res.data?.data || res.data || [];
      if (!Array.isArray(raw)) return [];
      return raw.map(
        (c: any): ChecklistCategory => ({
          id: c.id,
          label: c.label || c.id || UNKNOWN,
          order: Number(c.order ?? 0),
          gate: c.gate || UNKNOWN,
        }),
      );
    },
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") setIsCreateChecklistOpen(true);
    const tab = searchParams.get("tab");
    if (tab === "manage" || tab === "category" || tab === "checklist") setActiveTab(tab as ChecklistActiveTab);
  }, [searchParams]);

  // POST /qc/checklists takes { title, workOrderId?, items[] } â€” nothing else.
  const [newChecklistForm, setNewChecklistForm] = useState<NewChecklistForm>({ title: "", workOrderId: "" });

  const createChecklist = useMutation({
    mutationFn: async () => {
      const res = await api.post("/qc/checklists", {
        title: newChecklistForm.title.trim(),
        workOrderId: newChecklistForm.workOrderId.trim() || undefined,
        items: [],
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-checklists"] });
      setIsCreateChecklistOpen(false);
      setNewChecklistForm({ title: "", workOrderId: "" });
      showToast({ type: "success", title: "Checklist Dibuat", message: "Checklist berhasil didaftarkan." });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        title: "Gagal Membuat Checklist",
        message: err?.response?.data?.message || err?.message || "Server menolak permintaan.",
      });
    },
  });

  // PATCH /qc/checklists/:id { completedItems } is the real milestone write.
  const toggleMilestone = useMutation({
    mutationFn: async ({ id, completedItems }: { id: string; completedItems: string[] }) => {
      const res = await api.patch(`/qc/checklists/${id}`, { completedItems });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qc-checklists"] });
      showToast({ type: "success", title: "Status Milestone Diperbarui", message: "Progres tahapan berhasil disimpan." });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        title: "Gagal Menyimpan Milestone",
        message: err?.response?.data?.message || err?.message || "Server menolak permintaan.",
      });
    },
  });

  const handleToggleSubItemStatus = (item: ChecklistItem, label: string) => {
    const done = item.completedItems.includes(label);
    const next = done
      ? item.completedItems.filter((l) => l !== label)
      : [...item.completedItems, label];
    toggleMilestone.mutate({ id: item.id, completedItems: next });
  };

  const q = searchQuery.toLowerCase();
  const filteredChecklists = checklists.filter(
    (c) => c.title.toLowerCase().includes(q) || (c.salesOrderId || "").toLowerCase().includes(q),
  );

  const handleSaveChecklist = () => {
    if (!newChecklistForm.title.trim()) {
      showToast({ type: "error", title: "Validasi Gagal", message: "Judul checklist wajib diisi." });
      return;
    }
    createChecklist.mutate();
  };

  const handleRetry = () => {
    refetch();
    refetchCategories();
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isCreateChecklistOpen,
    setIsCreateChecklistOpen,
    selectedManageItem,
    setSelectedManageItem,
    newChecklistForm,
    setNewChecklistForm,
    checklists,
    categories,
    filteredChecklists,
    isLoading: isLoading || catLoading,
    isError: isError || catError,
    createChecklist,
    toggleMilestone,
    handleSaveChecklist,
    handleToggleSubItemStatus,
    handleRetry,
  };
}
