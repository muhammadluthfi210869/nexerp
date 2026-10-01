"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  TransferItem,
  TransferFormData,
  NewItemDraft,
  WarehouseOption,
  CatalogMaterialOption,
} from "../_types/mutation.types";

export function useMutationOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: rawTransfers = [], isLoading } = useQuery({
    queryKey: ["warehouse-transfers"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/transfers");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: warehouseList = [] } = useQuery<WarehouseOption[]>({
    queryKey: ["warehouse-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/warehouses");
        return (unwrapResponse(res.data) as WarehouseOption[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: catalogMaterials = [] } = useQuery<CatalogMaterialOption[]>({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as CatalogMaterialOption[]) || [];
      } catch {
        return [];
      }
    },
  });

  const transfers: TransferItem[] = useMemo(() => {
    if (!rawTransfers || !Array.isArray(rawTransfers)) return [];
    return rawTransfers.map((t: any) => ({
      id: t.id,
      code: t.transferNumber || `TRF-${t.id.slice(0, 8).toUpperCase()}`,
      date: t.date ? new Date(t.date).toISOString().split("T")[0] : "-",
      sourceWarehouse: t.sourceWarehouse?.name || "Gudang Asal",
      destWarehouse: t.destWarehouse?.name || "Gudang Tujuan",
      creator: t.createdById || "Admin Gudang",
      vehicleNo: "Internal Transfer",
      status: (t.status || "PENDING") as TransferItem["status"],
      notes: t.notes || "-",
      items: (t.items || []).map((it: any) => ({
        materialId: it.materialId,
        name: it.material?.name || "Material",
        unit: it.material?.unit || "Unit",
        qty: Number(it.qty || 0),
        notes: it.notes || "-",
      })),
    }));
  }, [rawTransfers]);

  // Form State
  const [formData, setFormData] = useState<TransferFormData>({
    sourceWarehouseId: "",
    destWarehouseId: "",
    date: new Date().toISOString().split("T")[0],
    vehicleNo: "",
    notes: "",
    cartItems: [],
  });

  const [newItem, setNewItem] = useState<NewItemDraft>({
    materialId: "",
    name: "",
    unit: "Kg",
    qtyStock: 0,
    qtyTransfer: 1,
    notes: "",
  });

  useEffect(() => {
    if (warehouseList.length > 0) {
      setFormData((prev) => ({
        ...prev,
        sourceWarehouseId: prev.sourceWarehouseId || warehouseList[0]?.id || "",
        destWarehouseId: prev.destWarehouseId || (warehouseList[1]?.id || warehouseList[0]?.id || ""),
      }));
    }
  }, [warehouseList]);

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return transfers.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transfers, searchTerm, statusFilter]);

  const totalCompleted = useMemo(() => transfers.filter((t) => t.status === "COMPLETED").length, [transfers]);
  const totalPending = useMemo(() => transfers.filter((t) => t.status === "PENDING").length, [transfers]);

  const handleAddItem = () => {
    if (!newItem.materialId || newItem.qtyTransfer <= 0) {
      toast.warning("Pilih barang dan masukkan jumlah transfer yang valid");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      cartItems: [...prev.cartItems, { ...newItem }],
    }));
    setNewItem({
      materialId: "",
      name: "",
      unit: "Kg",
      qtyStock: 0,
      qtyTransfer: 1,
      notes: "",
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      cartItems: prev.cartItems.filter((_, i) => i !== index),
    }));
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    router.push("/goods-transfer/create");
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    if (actionParam === "create") {
      router.push("/goods-transfer");
    }
  };

  const handleViewTransfer = (item: TransferItem) => {
    setSelectedTransfer(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handlePrintTransfer = (item: TransferItem) => {
    toast({
      title: "Mencetak Form Mutasi",
      description: `Mengunduh PDF Bukti Transfer ${item.code}`,
      variant: "info",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sourceWarehouseId === formData.destWarehouseId) {
      toast.error("Gudang asal dan tujuan tidak boleh sama");
      return;
    }
    if (formData.cartItems.length === 0) {
      toast.warning("Tambahkan minimal satu item transfer");
      return;
    }

    try {
      await api.post("/warehouse/transfers", {
        sourceWarehouseId: formData.sourceWarehouseId,
        destWarehouseId: formData.destWarehouseId,
        notes: `${formData.vehicleNo ? `[Kendaraan: ${formData.vehicleNo}] ` : ""}${formData.notes || ""}`.trim() || undefined,
        items: formData.cartItems.map((it) => ({
          materialId: it.materialId,
          qty: it.qtyTransfer,
        })),
      });

      toast.success("Surat Mutasi Transfer berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-transactions"] });
      setIsCreateOpen(false);
      setFormData({
        sourceWarehouseId: warehouseList[0]?.id || "",
        destWarehouseId: warehouseList[1]?.id || warehouseList[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        vehicleNo: "",
        notes: "",
        cartItems: [],
      });
      if (actionParam === "create") {
        router.push("/goods-transfer");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat transfer barang");
    }
  };

  const handleExecuteTransfer = async (id: string) => {
    try {
      await api.post(`/warehouse/transfers/${id}/execute`, {});
      toast.success("Transfer barang berhasil dieksekusi dan stok telah dipindahkan.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-transactions"] });
      setSelectedTransfer(null);
      setIsDetailOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal mengeksekusi transfer barang");
    }
  };

  return {
    // State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedTransfer,
    setSelectedTransfer,
    isDetailOpen,
    setIsDetailOpen,
    isCreateOpen,
    setIsCreateOpen,
    formData,
    setFormData,
    newItem,
    setNewItem,
    // Queries data
    isLoading,
    transfers,
    filteredData,
    warehouseList,
    catalogMaterials,
    totalCompleted,
    totalPending,
    // Handlers
    handleAddItem,
    handleRemoveItem,
    handleOpenCreate,
    handleCloseCreate,
    handleViewTransfer,
    handleCloseDetail,
    handlePrintTransfer,
    handleSave,
    handleExecuteTransfer,
    toast,
  };
}

export type UseMutationOperationsReturn = ReturnType<typeof useMutationOperations>;
