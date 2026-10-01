"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  SalesTargetItem,
  SalesCategoryItem,
  MarketingUser,
} from "../_types/sales-target.types";
import { MONTHS_ID } from "../_types/sales-target.types";

export function useSalesTargetOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const qc = useQueryClient();

  const [activeMainTab, setActiveMainTab] = useState<"targets" | "categories">(
    searchParams.get("tab") === "categories" ? "categories" : "targets"
  );

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Detail & Modals
  const [detailTarget, setDetailTarget] = useState<SalesTargetItem | null>(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTargetItem | null>(null);
  const [targetToDelete, setTargetToDelete] = useState<SalesTargetItem | null>(null);

  const [detailCategory, setDetailCategory] = useState<SalesCategoryItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SalesCategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<SalesCategoryItem | null>(null);

  // Form states for Target
  const [formUserId, setFormUserId] = useState("");
  const [formMonth, setFormMonth] = useState(selectedMonth);
  const [formYear, setFormYear] = useState(selectedYear);
  const [formNominal, setFormNominal] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Form states for Category
  const [formCatName, setFormCatName] = useState("");
  const [formCatDesc, setFormCatDesc] = useState("");

  // 1. Fetch Users for Marketing Dropdown
  const { data: marketingUsers = [] } = useQuery<MarketingUser[]>({
    queryKey: ["master-sales-targets-users"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/sales-targets/users");
        const body = unwrapResponse<MarketingUser[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch Sales Targets for Period
  const { data: targets = [], isLoading: isLoadingTargets } = useQuery<SalesTargetItem[]>({
    queryKey: ["master-sales-targets", selectedMonth, selectedYear],
    queryFn: async () => {
      try {
        const res = await api.get("/master/sales-targets", {
          params: { month: selectedMonth, year: selectedYear },
        });
        const body = unwrapResponse<SalesTargetItem[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
    enabled: activeMainTab === "targets",
  });

  // 3. Fetch Sales Categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<SalesCategoryItem[]>({
    queryKey: ["master-sales-categories"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/sales-categories");
        const body = unwrapResponse<SalesCategoryItem[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
    enabled: activeMainTab === "categories",
  });

  // Filtered Targets
  const filteredTargets = useMemo(() => {
    return targets.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        t.marketingName.toLowerCase().includes(q) ||
        t.marketingEmail.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === "REACHED") return t.achievementPercent >= 100;
      if (statusFilter === "ONTRACK") return t.achievementPercent >= 70 && t.achievementPercent < 100;
      if (statusFilter === "UNDER") return t.achievementPercent < 70;

      return true;
    });
  }, [targets, searchTerm, statusFilter]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [categories, searchTerm]);

  // KPI Calculations
  const countAll = targets.length;
  const countReached = targets.filter((t) => t.achievementPercent >= 100).length;
  const countOnTrack = targets.filter((t) => t.achievementPercent >= 70 && t.achievementPercent < 100).length;
  const countUnder = targets.filter((t) => t.achievementPercent < 70).length;

  const totalNominalPeriod = targets.reduce((acc, t) => acc + t.nominalTarget, 0);
  const totalRealizedPeriod = targets.reduce((acc, t) => acc + t.realizedRevenue, 0);
  const avgAchievement =
    totalNominalPeriod > 0 ? Math.round((totalRealizedPeriod / totalNominalPeriod) * 100) : 0;

  const topPerformer = [...targets].sort(
    (a, b) => b.achievementPercent - a.achievementPercent
  )[0];

  // Target Mutations
  const saveTargetMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        userId: formUserId,
        month: formMonth,
        year: formYear,
        nominalTarget: Number(formNominal),
        notes: formNotes,
      };
      if (editingTarget) {
        return api.put(`/master/sales-targets/${editingTarget.id}`, payload);
      } else {
        return api.post("/master/sales-targets", payload);
      }
    },
    onSuccess: () => {
      toast.success(
        "Target Disimpan",
        `Target omzet Rp ${Number(formNominal).toLocaleString("id-ID")} berhasil disimpan.`
      );
      qc.invalidateQueries({ queryKey: ["master-sales-targets"] });
      setIsTargetModalOpen(false);
      setEditingTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", err?.response?.data?.message || "Gagal menyimpan target");
    },
  });

  const deleteTargetMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/master/sales-targets/${id}`);
    },
    onSuccess: () => {
      toast.success("Target Dihapus", "Target penjualan berhasil dihapus.");
      qc.invalidateQueries({ queryKey: ["master-sales-targets"] });
      setTargetToDelete(null);
      if (detailTarget) setDetailTarget(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", err?.response?.data?.message || "Gagal menghapus target");
    },
  });

  // Category Mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formCatName.trim(),
        description: formCatDesc.trim(),
      };
      if (editingCategory) {
        return api.put(`/master/sales-categories/${editingCategory.id}`, payload);
      } else {
        return api.post("/master/sales-categories", payload);
      }
    },
    onSuccess: () => {
      toast.success("Kategori Disimpan", `Kategori '${formCatName}' berhasil disimpan.`);
      qc.invalidateQueries({ queryKey: ["master-sales-categories"] });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", err?.response?.data?.message || "Gagal menyimpan kategori");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/master/sales-categories/${id}`);
    },
    onSuccess: () => {
      toast.success("Kategori Dihapus", "Kategori penjualan berhasil dihapus.");
      qc.invalidateQueries({ queryKey: ["master-sales-categories"] });
      setCategoryToDelete(null);
    },
    onError: (err: any) => {
      toast.error("Gagal", err?.response?.data?.message || "Gagal menghapus kategori");
    },
  });

  const seedCategoriesMutation = useMutation({
    mutationFn: async () => {
      return api.post("/master/sales-categories/seed");
    },
    onSuccess: () => {
      toast.success("Inisialisasi Berhasil", "5 Kategori Penjualan Standar G-SERP berhasil diinisialisasi.");
      qc.invalidateQueries({ queryKey: ["master-sales-categories"] });
    },
    onError: (err: any) => {
      toast.error("Gagal", err?.response?.data?.message || "Gagal menginisialisasi kategori");
    },
  });

  // Handlers for Target
  const handleOpenCreateTarget = () => {
    setEditingTarget(null);
    setFormUserId(marketingUsers[0]?.id || "");
    setFormMonth(selectedMonth);
    setFormYear(selectedYear);
    setFormNominal("");
    setFormNotes("");
    setIsTargetModalOpen(true);
  };

  const handleOpenEditTarget = (target: SalesTargetItem) => {
    setEditingTarget(target);
    setFormUserId(target.userId);
    setFormMonth(target.month);
    setFormYear(target.year);
    setFormNominal(target.nominalTarget.toString());
    setFormNotes(target.notes || "");
    setIsTargetModalOpen(true);
  };

  const handleSaveTarget = () => {
    if (!formUserId || !formNominal || Number(formNominal) <= 0) {
      toast.error("Validasi Gagal", "Pilih Marketing dan isi Nominal Target dengan benar.");
      return;
    }
    saveTargetMutation.mutate();
  };

  const handleConfirmDeleteTarget = () => {
    if (targetToDelete) {
      deleteTargetMutation.mutate(targetToDelete.id);
    }
  };

  // Handlers for Category
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setFormCatName("");
    setFormCatDesc("");
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: SalesCategoryItem) => {
    setEditingCategory(cat);
    setFormCatName(cat.name);
    setFormCatDesc(cat.description || "");
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    if (!formCatName.trim()) {
      toast.error("Validasi Gagal", "Nama Kategori wajib diisi.");
      return;
    }
    saveCategoryMutation.mutate();
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  const userOptions = useMemo(() => {
    return marketingUsers.map((u) => ({
      value: u.id,
      label: `${u.fullName || u.email} (${u.roles?.[0] || "User"})`,
    }));
  }, [marketingUsers]);

  return {
    activeMainTab,
    setActiveMainTab,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,

    detailTarget,
    setDetailTarget,
    isTargetModalOpen,
    setIsTargetModalOpen,
    editingTarget,
    setEditingTarget,
    targetToDelete,
    setTargetToDelete,

    detailCategory,
    setDetailCategory,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    editingCategory,
    setEditingCategory,
    categoryToDelete,
    setCategoryToDelete,

    formUserId,
    setFormUserId,
    formMonth,
    setFormMonth,
    formYear,
    setFormYear,
    formNominal,
    setFormNominal,
    formNotes,
    setFormNotes,

    formCatName,
    setFormCatName,
    formCatDesc,
    setFormCatDesc,

    marketingUsers,
    targets,
    isLoadingTargets,
    categories,
    isLoadingCategories,

    filteredTargets,
    filteredCategories,

    countAll,
    countReached,
    countOnTrack,
    countUnder,
    totalNominalPeriod,
    totalRealizedPeriod,
    avgAchievement,
    topPerformer,
    userOptions,

    saveTargetMutation,
    deleteTargetMutation,
    saveCategoryMutation,
    deleteCategoryMutation,
    seedCategoriesMutation,

    handleOpenCreateTarget,
    handleOpenEditTarget,
    handleSaveTarget,
    handleConfirmDeleteTarget,

    handleOpenCreateCategory,
    handleOpenEditCategory,
    handleSaveCategory,
    handleConfirmDeleteCategory,
  };
}
