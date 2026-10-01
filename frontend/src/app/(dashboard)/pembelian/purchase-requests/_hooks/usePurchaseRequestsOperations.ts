"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  PurchaseRequestRecord,
  PRItemDetail,
  PRPriority,
  PRRequesterRole,
} from "../_types/purchase-requests.types";

export function usePurchaseRequestsOperations() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPr, setSelectedPr] = useState<PurchaseRequestRecord | null>(null);

  // Live Query from backend /purchase/requests
  const {
    data: rawPrs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["purchase-requests-list"],
    queryFn: async () => {
      const res = await api.get("/purchase/requests");
      return unwrapResponse(res) || [];
    },
  });

  // Query raw materials for cart items
  const { data: rawMaterials = [] } = useQuery({
    queryKey: ["raw-materials-dropdown"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return unwrapResponse(res) || [];
    },
  });

  const prList: PurchaseRequestRecord[] = useMemo(() => {
    return (rawPrs as any[]).map((pr) => {
      const totalEst =
        pr.items?.reduce(
          (sum: number, it: any) =>
            sum + Number(it.qtyRequired ?? it.quantity ?? 0) * Number(it.estimatedPrice ?? 0),
          0
        ) || 0;

      return {
        id: pr.id,
        prCode: pr.requestNumber || pr.id,
        date: pr.createdAt ? new Date(pr.createdAt).toLocaleDateString("id-ID") : "-",
        department: pr.warehouse?.name || "Produksi Pabrik",
        requesterName: pr.creator?.name || "Staff Pengadaan",
        requesterRole: (pr.creator?.role?.includes("HEAD") || pr.creator?.role?.includes("DIRECTOR")
          ? "HEAD"
          : "STAFF") as PRRequesterRole,
        categoryCoa: pr.budgetCode || "110401 - Persediaan Bahan Baku",
        priority: (pr.priority as PRPriority) || "MEDIUM",
        targetDate: pr.createdAt
          ? new Date(new Date(pr.createdAt).getTime() + 7 * 86400000).toLocaleDateString("id-ID")
          : "-",
        totalEstimated: totalEst,
        status: pr.status || "PENDING",
        approvalNotes: pr.notes,
        items: (pr.items || []).map((it: any) => ({
          id: it.id,
          materialCode: it.material?.code || it.materialId || "-",
          materialName: it.material?.name || "Item Material",
          categoryCoa: pr.budgetCode || "110401 - Persediaan Bahan Baku",
          qty: Number(it.qtyRequired ?? it.quantity ?? 0),
          unit: it.material?.unit || "kg",
          estimatedPrice: Number(it.estimatedPrice ?? 0),
          subtotal: Number(it.qtyRequired ?? it.quantity ?? 0) * Number(it.estimatedPrice ?? 0),
          notes: it.notes,
        })),
      };
    });
  }, [rawPrs]);

  // Modal Create PR State
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const [formDept, setFormDept] = useState("Produksi Pabrik");
  const [formRequester, setFormRequester] = useState("Staff Produksi");
  const [formRole, setFormRole] = useState<"STAFF" | "HEAD">("STAFF");
  const [formCoa, setFormCoa] = useState("110401 - Persediaan Bahan Baku");
  const [formPriority, setFormPriority] = useState<PRPriority>("MEDIUM");

  // Multi-line Cart in Create Form
  const [cartItems, setCartItems] = useState<PRItemDetail[]>([
    {
      id: "draft-1",
      materialCode: "RAW-ACT-002",
      materialName: "Alpha Arbutin Pure Grade",
      categoryCoa: "110401 - Persediaan Bahan Baku",
      qty: 10,
      unit: "kg",
      estimatedPrice: 850000,
      subtotal: 8500000,
      notes: "Trial formula pencerah",
    },
  ]);

  // Reject Dialog Modal State
  const [rejectModalPr, setRejectModalPr] = useState<PurchaseRequestRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Filters & Tabs
  const filteredPrList = useMemo(() => {
    return prList.filter((pr) => {
      if (activeTab === "pending" && !["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(pr.status)) {
        return false;
      }
      if (activeTab === "approved" && pr.status !== "APPROVED") return false;
      if (activeTab === "ordered" && pr.status !== "ORDERED") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        pr.prCode.toLowerCase().includes(q) ||
        pr.department.toLowerCase().includes(q) ||
        pr.requesterName.toLowerCase().includes(q) ||
        pr.items.some((it) => it.materialName.toLowerCase().includes(q) || it.materialCode.toLowerCase().includes(q))
      );
    });
  }, [prList, activeTab, searchQuery]);

  // KPIs
  const totalBudget = useMemo(() => prList.reduce((sum, p) => sum + p.totalEstimated, 0), [prList]);
  const pendingCount = useMemo(
    () => prList.filter((p) => ["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(p.status)).length,
    [prList]
  );
  const approvedCount = useMemo(() => prList.filter((p) => p.status === "APPROVED").length, [prList]);
  const orderedCount = useMemo(() => prList.filter((p) => p.status === "ORDERED").length, [prList]);

  // Handlers
  const handleAddItem = () => {
    const newItem: PRItemDetail = {
      id: `draft-${Date.now()}`,
      materialCode: "RAW-MAT-00" + (cartItems.length + 1),
      materialName: "Bahan Baru #" + (cartItems.length + 1),
      categoryCoa: formCoa,
      qty: 10,
      unit: "kg",
      estimatedPrice: 100000,
      subtotal: 1000000,
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (cartItems.length <= 1) {
      toast.warning("Minimal 1 Item", "Permintaan pembelian wajib memiliki minimal 1 item barang.");
      return;
    }
    setCartItems(cartItems.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof PRItemDetail, val: any) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === "qty" || field === "estimatedPrice") {
            updated.subtotal = Number(updated.qty || 0) * Number(updated.estimatedPrice || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Mutations
  const createPrMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/requests", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests-list"] });
      toast.success("PR Berhasil Dibuat", "Pengajuan telah dikirim untuk approval.");
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Buat PR", err?.response?.data?.message || err.message);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/purchase/requests/${id}/approve`);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests-list"] });
      toast.success("Otorisasi Berhasil", "Status PR berhasil disetujui.");
      setSelectedPr(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Otorisasi", err?.response?.data?.message || err.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.post(`/purchase/requests/${id}/reject`, { reason });
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests-list"] });
      toast.error("PR Ditolak", "Pengajuan telah ditolak.");
      setRejectModalPr(null);
      setSelectedPr(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Menolak PR", err?.response?.data?.message || err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.warning("Minimal 1 Item", "Permintaan pembelian wajib memiliki minimal 1 item barang.");
      return;
    }

    const itemsPayload = cartItems.map((it) => {
      const matched = (rawMaterials as any[]).find(
        (m) => m.id === it.id || m.code === it.materialCode || m.name?.toLowerCase() === it.materialName?.toLowerCase()
      );
      return {
        materialId: matched?.id || (rawMaterials as any[])[0]?.id || "default-mat",
        qtyRequired: Number(it.qty) || 1,
        estimatedPrice: Number(it.estimatedPrice) || 0,
      };
    });

    createPrMutation.mutate({
      notes: `Pengajuan ${formDept} (${formRequester}) - Prioritas: ${formPriority}`,
      budgetCode: formCoa,
      priority: formPriority,
      items: itemsPayload,
    });
  };

  const handleApprove = (pr: PurchaseRequestRecord) => {
    approveMutation.mutate(pr.id);
  };

  const handleReject = () => {
    if (!rejectModalPr) return;
    if (!rejectReason.trim()) {
      toast.warning("Alasan Wajib Diisi", "Mohon isi catatan alasan penolakan PR untuk revisi departemen.");
      return;
    }
    rejectMutation.mutate({ id: rejectModalPr.id, reason: rejectReason });
  };

  return {
    // State
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedPr,
    setSelectedPr,
    isCreateOpen,
    setIsCreateOpen,
    formDept,
    setFormDept,
    formRequester,
    setFormRequester,
    formRole,
    setFormRole,
    formCoa,
    setFormCoa,
    formPriority,
    setFormPriority,
    cartItems,
    setCartItems,
    rejectModalPr,
    setRejectModalPr,
    rejectReason,
    setRejectReason,

    // Data & Queries
    prList,
    filteredPrList,
    isLoading,
    isError,
    refetch,

    // KPIs
    totalBudget,
    pendingCount,
    approvedCount,
    orderedCount,

    // Actions & Handlers
    handleAddItem,
    handleRemoveItem,
    handleUpdateItem,
    handleCreateSubmit,
    handleApprove,
    handleReject,
    createPrMutation,
    approveMutation,
    rejectMutation,
  };
}
