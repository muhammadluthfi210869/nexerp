"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { toast } from "sonner";
import {
  CartItem,
  ApproveDialogState,
  RejectDialogState,
  PurchaseOrder,
  PurchaseRequest,
  PurchasingVendor,
  PurchasingWarehouse,
  PurchasingMaterial,
  CreatePOPayload,
} from "../_types/purchasing.types";

export function usePurchasingOperations() {
  const queryClient = useQueryClient();
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [taxPercent, setTaxPercent] = useState("11");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [approveDialog, setApproveDialog] = useState<ApproveDialogState | null>(null);
  const [rejectDialog, setRejectDialog] = useState<RejectDialogState | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDetailPo, setSelectedDetailPo] = useState<PurchaseOrder | null>(null);

  // Filters
  const [searchPo, setSearchPo] = useState("");
  const [searchItemName, setSearchItemName] = useState("");
  const [searchMinQty, setSearchMinQty] = useState("");
  const [searchMaxQty, setSearchMaxQty] = useState("");
  const [searchMinPrice, setSearchMinPrice] = useState("");
  const [searchMaxPrice, setSearchMaxPrice] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");

  const { data: vendors, isLoading: vendorsLoading } = useQuery<PurchasingVendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await api.get("/scm/vendors");
      return unwrapResponse(res) || [];
    },
  });

  const { data: materials, isLoading: materialsLoading } = useQuery<PurchasingMaterial[]>({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return (unwrapResponse(res) || []).filter(
        (m: any) =>
          m.type === "RAW_MATERIAL" ||
          m.type === "PACKAGING" ||
          m.type === "LABEL" ||
          m.type === "BOX"
      );
    },
  });

  const { data: warehouses, isLoading: whLoading } = useQuery<PurchasingWarehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses/active");
      return unwrapResponse(res) || [];
    },
  });

  const { data: prs, isLoading: prsLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return unwrapResponse(res) || [];
    },
  });

  const { data: purchaseOrders, isLoading: poLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: CreatePOPayload) => {
      const res = await api.post("/scm/purchase-orders", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Purchase Order berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setIsPOModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal membuat PO.");
    },
  });

  const approvePOMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await api.patch(`/scm/purchase-orders/${id}/status`, { status: "APPROVED" });
      return res.data;
    },
    onSuccess: () => {
      toast.success("PO berhasil disetujui.");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setApproveDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui PO.");
    },
  });

  const rejectPOMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.patch(`/scm/purchase-orders/${id}/status`, { status: "REJECTED", reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success("PO ditolak.");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak PO.");
    },
  });

  const approvePRMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/scm/purchase-requests/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("PR disetujui, PO dibuat.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setApproveDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui PR.");
    },
  });

  const rejectPRMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/scm/purchase-requests/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      toast.success("PR ditolak.");
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      setRejectDialog(null);
      setRejectReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak PR.");
    },
  });

  const resetForm = () => {
    setItems([]);
    setSelectedVendor("");
    setSelectedWarehouse("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setSelectedDueDate("");
    setNotes("");
    setTaxPercent("11");
    setDiscountAmount(0);
    setShippingCost(0);
  };

  const addItem = (materialId: string) => {
    const material = materials?.find((m) => m.id === materialId);
    if (!material) return;
    if (items.find((i) => i.materialId === materialId)) {
      toast.error("Barang sudah ada di keranjang.");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        materialId: material.id,
        name: material.name,
        unit: material.unit,
        qty: 1,
        price: Number(material.unitPrice || 0),
      },
    ]);
  };

  const removeItem = (materialId: string) => {
    setItems((prev) => prev.filter((i) => i.materialId !== materialId));
  };

  const updateItem = (materialId: string, field: keyof CartItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.materialId === materialId ? { ...i, [field]: value } : i))
    );
  };

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * (Number(taxPercent) / 100);
  const grandTotal = taxableSubtotal + Number(shippingCost) + tax;

  const handleCreatePO = () => {
    if (!selectedVendor) {
      toast.error("Pilih supplier.");
      return;
    }
    if (items.length === 0) {
      toast.error("Tambah minimal satu barang.");
      return;
    }
    createPOMutation.mutate({
      supplierId: selectedVendor,
      estArrival: selectedDate,
      dueDate: selectedDueDate || undefined,
      notes: notes || undefined,
      discountAmount: Number(discountAmount),
      shippingCost: Number(shippingCost),
      taxPercent: Number(taxPercent),
      totalAmount: grandTotal,
      items: items.map((i) => ({
        materialId: i.materialId,
        quantity: i.qty,
        unitPrice: i.price,
      })),
    });
  };

  const handleApprove = () => {
    if (!approveDialog) return;
    if (approveDialog.type === "PO") {
      approvePOMutation.mutate({ id: approveDialog.id });
    } else {
      approvePRMutation.mutate(approveDialog.id);
    }
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    if (rejectDialog.type === "PO") {
      rejectPOMutation.mutate({ id: rejectDialog.id, reason: rejectReason });
    } else {
      rejectPRMutation.mutate({ id: rejectDialog.id, reason: rejectReason });
    }
  };

  const resetFilters = () => {
    setSearchPo("");
    setSearchItemName("");
    setSearchMinQty("");
    setSearchMaxQty("");
    setSearchMinPrice("");
    setSearchMaxPrice("");
    setSearchDateFrom("");
    setSearchDateTo("");
  };

  const pendingPrCount = String(
    prs?.filter((r) => r.status === "DRAFT" || r.status === "SUBMITTED").length || 0
  ).padStart(2, "0");

  const activePoCount = String(
    purchaseOrders?.filter((po) => po.status === "APPROVED" || po.status === "ORDERED").length || 0
  ).padStart(2, "0");

  const awaitingGrnCount = String(
    purchaseOrders?.filter((po) => po.status === "ORDERED").length || 0
  ).padStart(2, "0");

  const totalPoValue = (purchaseOrders || []).reduce(
    (sum: number, po) => sum + Number(po.totalValue || 0),
    0
  );

  const filteredPurchaseOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    return purchaseOrders.filter((po) => {
      const q = searchPo.toLowerCase();
      const matchSearch =
        !q ||
        (po.poNumber || "").toLowerCase().includes(q) ||
        (po.supplier?.name || po.supplierName || "").toLowerCase().includes(q) ||
        (po.scm?.fullName || "").toLowerCase().includes(q);
      const matchItem =
        !searchItemName ||
        (po.items || []).some((i) =>
          (i.itemName || i.name || "").toLowerCase().includes(searchItemName.toLowerCase())
        );
      const matchQty =
        (!searchMinQty ||
          (po.items || []).some((i) => Number(i.quantity || i.qty || 0) >= Number(searchMinQty))) &&
        (!searchMaxQty ||
          (po.items || []).some((i) => Number(i.quantity || i.qty || 0) <= Number(searchMaxQty)));
      const matchPrice =
        (!searchMinPrice || Number(po.totalValue || 0) >= Number(searchMinPrice)) &&
        (!searchMaxPrice || Number(po.totalValue || 0) <= Number(searchMaxPrice));
      const poDate = po.estArrival || po.orderDate || "";
      const matchDate =
        (!searchDateFrom || poDate >= searchDateFrom) && (!searchDateTo || poDate <= searchDateTo);
      return matchSearch && matchItem && matchQty && matchPrice && matchDate;
    });
  }, [
    purchaseOrders,
    searchPo,
    searchItemName,
    searchMinQty,
    searchMaxQty,
    searchMinPrice,
    searchMaxPrice,
    searchDateFrom,
    searchDateTo,
  ]);

  const vendorOptions = (vendors || []).map((v) => ({ label: v.name, value: v.id }));
  const warehouseOptions = (warehouses || []).map((w) => ({ label: w.name, value: w.id }));
  const materialOptions = (materials || []).map((m) => ({
    label: `${m.name} (${m.unit})`,
    value: m.id,
  }));

  const isLoading = vendorsLoading || materialsLoading || whLoading || prsLoading || poLoading;

  return {
    // State
    isPOModalOpen,
    setIsPOModalOpen,
    items,
    setItems,
    selectedVendor,
    setSelectedVendor,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedDate,
    setSelectedDate,
    selectedDueDate,
    setSelectedDueDate,
    notes,
    setNotes,
    taxPercent,
    setTaxPercent,
    discountAmount,
    setDiscountAmount,
    shippingCost,
    setShippingCost,
    approveDialog,
    setApproveDialog,
    rejectDialog,
    setRejectDialog,
    rejectReason,
    setRejectReason,
    selectedDetailPo,
    setSelectedDetailPo,

    // Filters
    searchPo,
    setSearchPo,
    searchItemName,
    setSearchItemName,
    searchMinQty,
    setSearchMinQty,
    searchMaxQty,
    setSearchMaxQty,
    searchMinPrice,
    setSearchMinPrice,
    searchMaxPrice,
    setSearchMaxPrice,
    searchDateFrom,
    setSearchDateFrom,
    searchDateTo,
    setSearchDateTo,
    resetFilters,

    // Data & Options
    vendors,
    materials,
    warehouses,
    prs,
    purchaseOrders,
    filteredPurchaseOrders,
    vendorOptions,
    warehouseOptions,
    materialOptions,

    // Metrics
    pendingPrCount,
    activePoCount,
    awaitingGrnCount,
    totalPoValue,

    // Financial calculations
    subtotal,
    taxableSubtotal,
    tax,
    grandTotal,

    // Actions & Handlers
    resetForm,
    addItem,
    removeItem,
    updateItem,
    handleCreatePO,
    handleApprove,
    handleReject,

    // Mutation states
    isCreatingPO: createPOMutation.isPending,
    isApprovingPO: approvePOMutation.isPending,
    isRejectingPO: rejectPOMutation.isPending,
    isApprovingPR: approvePRMutation.isPending,
    isRejectingPR: rejectPRMutation.isPending,
    isLoading,
  };
}

export type PurchasingOperations = ReturnType<typeof usePurchasingOperations>;
