"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import { SalesReturn, ReturnType } from "../_types/retur-penjualan.types";

export function useReturPenjualanOperations() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailReturn, setDetailReturn] = useState<SalesReturn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formSoId, setFormSoId] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formMaterialId, setFormMaterialId] = useState("");
  const [formProductName, setFormProductName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formType, setFormType] = useState<ReturnType>("POTONG_TAGIHAN");
  const [formReason, setFormReason] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Fetch Sales Returns
  const {
    data: returns = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SalesReturn[]>({
    queryKey: ["bussdev-returns"],
    queryFn: async () => {
      const resp = await api.get("/bussdev/returns");
      return (resp.data || []).map((r: any) => {
        const qty = (r.items || []).reduce(
          (sum: number, it: any) => sum + (Number(it.qtyReturned) || Number(it.qtyOriginal) || 0),
          0
        );
        const unitPrice = Number(r.items?.[0]?.unitPrice) || 0;
        const total = (r.items || []).reduce((sum: number, it: any) => {
          const itemQty = Number(it.qtyReturned) || Number(it.qtyOriginal) || 0;
          const price = Number(it.unitPrice) || unitPrice || 0;
          return sum + itemQty * price;
        }, 0);

        const productName =
          r.items?.[0]?.material?.name ||
          r.items?.[0]?.productName ||
          r.so?.items?.[0]?.productName ||
          "Produk Retur Maklon";

        const mappedStatus =
          r.returnStatus === "SELESAI"
            ? "SELESAI"
            : r.returnStatus === "QC_PASSED"
            ? "QC_PASSED"
            : r.returnStatus === "DITOLAK"
            ? "DITOLAK"
            : "PROSES";

        return {
          id: r.id,
          returnCode: `RET-${r.id.slice(0, 8).toUpperCase()}`,
          soId: r.soId || "",
          soNumber: r.so?.orderNumber || (r.soId ? `SO-${r.soId.slice(0, 8)}` : "N/A"),
          customerName: r.so?.lead?.clientName || "Klien Maklon",
          brandName: r.so?.brandName || "Private Label",
          returnDate: r.returnDate
            ? new Date(r.returnDate).toISOString().split("T")[0]
            : r.createdAt
            ? new Date(r.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          warehouseId: r.warehouseId || "",
          warehouseName: r.warehouse?.name || "Gudang Karantina Maklon (KRT-01)",
          productName,
          qtyReturned: qty > 0 ? qty : 1,
          unitPrice,
          totalValue: total > 0 ? total : 0,
          returnType: (r.returnStatus as any) || "POTONG_TAGIHAN",
          status: mappedStatus as SalesReturn["status"],
          reason: r.notes || "Pengembalian barang dalam inspeksi karantina.",
        };
      });
    },
  });

  // Fetch Sales Orders for dropdown
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders"],
    queryFn: async () => {
      const resp = await api.get("/commercial/sales-orders");
      return resp.data || [];
    },
  });

  // Fetch Warehouses for dropdown
  const { data: warehouses = [] } = useQuery({
    queryKey: ["active-warehouses"],
    queryFn: async () => {
      try {
        const resp = await api.get("/warehouse/warehouses");
        return resp.data || [];
      } catch {
        return [];
      }
    },
  });

  // Auto populate on SO select
  const handleSoChange = (selectedId: string) => {
    setFormSoId(selectedId);
    const chosenSo = salesOrders.find((so: any) => so.id === selectedId);
    if (chosenSo) {
      if (chosenSo.items && chosenSo.items.length > 0) {
        const firstItem = chosenSo.items[0];
        setFormMaterialId(firstItem.materialItemId || "");
        setFormProductName(firstItem.productName || "");
        setFormPrice(String(firstItem.unitPrice || 0));
        setFormQty(String(firstItem.quantity || 1));
      }
    }
  };

  const resetForm = () => {
    setFormSoId("");
    setFormWarehouseId("");
    setFormMaterialId("");
    setFormProductName("");
    setFormQty("");
    setFormPrice("");
    setFormReason("");
  };

  // Create Return Mutation
  const createReturnMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/bussdev/returns", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bussdev-returns"] });
      toast.success(
        "Retur Penjualan Dicatat",
        "Klaim retur berhasil dicatat ke gudang karantina dan nota kredit diproses."
      );
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mencatat retur penjualan";
      toast.error("Validasi Gagal", msg);
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return api.patch(`/bussdev/returns/${id}`, { returnStatus: status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bussdev-returns"] });
      toast.success("Retur Diperbarui", "Status klaim retur berhasil diperbarui.");
      setDetailReturn(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal memperbarui retur";
      toast.error("Gagal", msg);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSoId) {
      toast.error("Validasi Gagal", "Harap pilih referensi Sales Order.");
      return;
    }
    const qty = Number(formQty) || 1;
    const price = Number(formPrice) || 0;

    // Use selected warehouse or first available warehouse
    const targetWarehouseId =
      formWarehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined);

    if (!targetWarehouseId) {
      toast.error("Validasi Gagal", "Gudang karantina wajib dipilih.");
      return;
    }

    const payload: any = {
      soId: formSoId,
      warehouseId: targetWarehouseId,
      returnStatus: formType,
      notes: formReason || "Klaim retur produk maklon",
    };

    if (formMaterialId) {
      payload.items = [
        {
          materialId: formMaterialId,
          qtyReturned: qty,
          qtyOriginal: qty,
          unitPrice: price,
        },
      ];
    }

    createReturnMutation.mutate(payload);
  };

  const handleOpenCreate = () => {
    if (salesOrders.length > 0 && !formSoId) {
      handleSoChange(salesOrders[0].id);
    }
    if (warehouses.length > 0 && !formWarehouseId) {
      setFormWarehouseId(warehouses[0].id);
    }
    setIsCreateOpen(true);
  };

  const filteredReturns = returns.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.returnCode.toLowerCase().includes(q) ||
      r.soNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.productName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReturnsCount = returns.length;
  const totalValue = returns.reduce((acc, r) => acc + r.totalValue, 0);
  const inProcessCount = returns.filter((r) => r.status === "PROSES" || r.status === "QC_PASSED").length;
  const completedCount = returns.filter((r) => r.status === "SELESAI").length;
  const prosesCount = returns.filter((r) => r.status === "PROSES").length;
  const qcPassedCount = returns.filter((r) => r.status === "QC_PASSED").length;

  return {
    returns,
    salesOrders,
    warehouses,
    filteredReturns,
    isLoading,
    isError,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    detailReturn,
    setDetailReturn,
    isCreateOpen,
    setIsCreateOpen,
    handleOpenCreate,
    // Form fields
    formSoId,
    setFormSoId,
    formWarehouseId,
    setFormWarehouseId,
    formMaterialId,
    setFormMaterialId,
    formProductName,
    setFormProductName,
    formQty,
    setFormQty,
    formPrice,
    setFormPrice,
    formType,
    setFormType,
    formReason,
    setFormReason,
    handleSoChange,
    resetForm,
    handleCreateSubmit,
    createReturnMutation,
    updateStatusMutation,
    // Counts
    totalReturnsCount,
    totalValue,
    inProcessCount,
    completedCount,
    prosesCount,
    qcPassedCount,
  };
}
