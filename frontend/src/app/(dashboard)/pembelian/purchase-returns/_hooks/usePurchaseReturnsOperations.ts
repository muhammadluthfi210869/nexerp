"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  PurchaseReturn,
  ReturnItem,
  AvailableInbound,
  PurchaseReturnKpis,
  CompensationType,
} from "../_types/purchase-returns.types";

export function usePurchaseReturnsOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const {
    data: rawReturns,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["purchase-returns"],
    queryFn: async () => {
      const res = await api.get("/purchase/returns");
      return unwrapResponse(res) || [];
    },
  });

  const { data: rawInbounds } = useQuery({
    queryKey: ["warehouse-inbounds"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      return unwrapResponse(res) || [];
    },
  });

  const availableInbounds: AvailableInbound[] = useMemo(() => {
    if (!rawInbounds || !Array.isArray(rawInbounds)) return [];
    return rawInbounds.map((inb: any) => ({
      id: inb.id,
      grnNumber: inb.inboundNumber || `GRN-${inb.id.slice(0, 8)}`,
      poNumber: inb.po?.poNumber || inb.poNumber || "-",
      vendorName: inb.supplier?.name || inb.vendorName || "-",
      vendorId: inb.supplierId || inb.vendorId,
      warehouseId: inb.warehouseId,
      items: (inb.items || []).map((it: any) => ({
        materialId: it.materialId,
        itemCode: it.material?.sku || it.itemCode || "MAT",
        itemName: it.material?.name || it.itemName || "Material",
        qtyReceived: Number(it.qtyGood || it.qtyActual || 0),
        unit: it.material?.unit || "Kg",
        unitPrice: Number(it.unitPrice || 0),
      })),
    }));
  }, [rawInbounds]);

  const dataList: PurchaseReturn[] = useMemo(() => {
    if (!rawReturns || !Array.isArray(rawReturns)) return [];
    return rawReturns.map((r: any) => ({
      id: r.id,
      returnNumber: r.returnNumber || `RET-${r.id.slice(0, 8)}`,
      returnDate: r.date ? r.date.split("T")[0] : "",
      poNumber: r.inbound?.po?.poNumber || r.poNumber || "-",
      grnNumber: r.inbound?.inboundNumber || r.grnNumber || "-",
      vendorName: r.supplier?.name || r.supplierName || r.vendorName || "-",
      vendorCode: r.supplierId?.slice(0, 8) || "SUP",
      compensationType: "POTONG_TAGIHAN",
      totalQty: (r.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0),
      totalAmount: Number(r.totalValue || r.debitNoteAmount || 0),
      status: (["DRAFT", "WAITING_APPROVAL", "COMPLETED", "CANCELLED"] as const).includes(r.status)
        ? r.status
        : "DRAFT",
      pic: r.creator?.fullName || "SCM Staff",
      notes: r.notes || "",
      items: (r.items || []).map((it: any) => ({
        id: it.id,
        itemCode: it.material?.sku || "MAT",
        itemName: it.material?.name || "Material",
        qtyReturned: Number(it.quantity || 0),
        unit: it.material?.unit || "Kg",
        unitPrice: Number(it.unitPrice || 0),
        totalPrice: Number(it.totalPrice || 0),
        rejectReason: it.reason || "Cacat kualitas",
      })),
    }));
  }, [rawReturns]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [compensationFilter, setCompensationFilter] = useState("ALL");
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [selectedGrnId, setSelectedGrnId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [compensationType, setCompensationType] = useState<CompensationType>("POTONG_TAGIHAN");
  const [formNotes, setFormNotes] = useState("");
  const [items, setItems] = useState<ReturnItem[]>([
    {
      id: "it-1",
      itemCode: "BBK00019",
      itemName: "Niacinamide PC Grade (Reject)",
      qtyReturned: 5,
      unit: "Kg",
      unitPrice: 350000,
      totalPrice: 1750000,
      rejectReason: "Warna bahan menguning (Oksidasi / tidak lolos QC)",
    },
  ]);

  // Calculate KPIs
  const kpis: PurchaseReturnKpis = useMemo(() => {
    const list = dataList;
    const total = list.length;
    const totalValue = list.reduce((sum, r) => sum + r.totalAmount, 0);
    const pending = list.filter((r) => r.status === "WAITING_APPROVAL").length;
    const approved = list.filter((r) => r.status === "COMPLETED").length;

    return {
      total,
      totalValue,
      pending,
      approved,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab = activeTab === "ALL" ? true : item.status === activeTab;

      const matchComp = compensationFilter === "ALL" ? true : item.compensationType === compensationFilter;

      return matchSearch && matchTab && matchComp;
    });
  }, [dataList, searchQuery, activeTab, compensationFilter]);

  const handleSelectGrn = (grnId: string) => {
    setSelectedGrnId(grnId);
    const inb = availableInbounds.find((i) => i.id === grnId);
    if (inb && inb.items.length > 0) {
      setItems(
        inb.items.map((it: any, idx: number) => ({
          id: `item-${idx}`,
          itemCode: it.itemCode,
          itemName: it.itemName,
          qtyReturned: 1,
          unit: it.unit,
          unitPrice: it.unitPrice,
          totalPrice: it.unitPrice,
          rejectReason: "Barang cacat/reject saat inbound",
        }))
      );
    }
  };

  const handleUpdateItem = (index: number, field: keyof ReturnItem, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };
    if (field === "qtyReturned" || field === "unitPrice") {
      current.totalPrice = (current.qtyReturned || 0) * (current.unitPrice || 0);
    }
    newItems[index] = current;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `it-${Date.now()}`,
        itemCode: "",
        itemName: "",
        qtyReturned: 1,
        unit: "Kg",
        unitPrice: 0,
        totalPrice: 0,
        rejectReason: "Cacat fisik kemasan / formula",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const formTotalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + it.totalPrice, 0);
  }, [items]);

  const createReturnMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/returns", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      toast.success("Pengajuan retur berhasil dibuat & diteruskan ke supplier.");
      setIsCreateOpen(false);
      setSelectedGrnId("");
      setFormNotes("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat pengajuan retur");
    },
  });

  const handleCreateReturn = () => {
    if (!selectedGrnId) {
      toast.error("Pilih dokumen GRN referensi barang yang diretur");
      return;
    }
    if (items.length === 0 || !items[0].itemName) {
      toast.error("Isi minimal 1 detail item barang yang diretur");
      return;
    }

    const inb = availableInbounds.find((i) => i.id === selectedGrnId);
    createReturnMutation.mutate({
      supplierId: inb?.vendorId,
      inboundId: inb?.id,
      date: returnDate,
      notes: formNotes || `Retur kompensasi ${compensationType}`,
      items: items.map((it) => ({
        materialId: (it as any).materialId || "mat-001",
        quantity: it.qtyReturned,
        unitPrice: it.unitPrice,
        reason: it.rejectReason,
      })),
    });
  };

  // POST /purchase/returns/:id/approve. The backend moves the return to COMPLETED (there is no
  // APPROVED state), so the toast says what actually happened rather than "Disetujui Vendor".
  const approveReturnMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.post(`/purchase/returns/${id}/approve`)),
    onSuccess: (_data, id) => {
      toast.success("Klaim retur disetujui & ditutup (Debit Note diterbitkan).");
      if (selectedReturn?.id === id) setSelectedReturn(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  // PATCH /purchase/returns/:id/status { status: "COMPLETED" }.
  const completeReturnMut = useMutation({
    mutationFn: async (id: string) =>
      unwrapResponse(await api.patch(`/purchase/returns/${id}/status`, { status: "COMPLETED" })),
    onSuccess: (_data, id) => {
      toast.success("Kompensasi retur selesai (Barang pengganti diterima / Tagihan dipotong).");
      if (selectedReturn?.id === id) setSelectedReturn(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const handleApproveVendor = (id: string) => approveReturnMut.mutate(id);
  const handleCompleteReturn = (id: string) => completeReturnMut.mutate(id);

  return {
    // Queries data & state
    dataList,
    availableInbounds,
    filteredList,
    kpis,
    isLoading,
    isError,
    refetch,

    // Filters & Drawer selection
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    compensationFilter,
    setCompensationFilter,
    selectedReturn,
    setSelectedReturn,

    // Modal & Form state
    isCreateOpen,
    setIsCreateOpen,
    selectedGrnId,
    returnDate,
    setReturnDate,
    compensationType,
    setCompensationType,
    formNotes,
    setFormNotes,
    items,
    formTotalAmount,

    // Handlers
    handleSelectGrn,
    handleUpdateItem,
    handleAddItem,
    handleRemoveItem,
    handleCreateReturn,
    handleApproveVendor,
    handleCompleteReturn,

    // Mutation objects for loading states
    createReturnMutation,
    approveReturnMut,
    completeReturnMut,
    toast,
  };
}
