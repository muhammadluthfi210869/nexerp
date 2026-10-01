"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  AdjustmentItem,
  AdjustmentFormData,
  AdjustmentNewItem,
  WarehouseOption,
  CatalogMaterialOption,
} from "../_types/stock-adjustment.types";

export function useStockAdjustmentOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdj, setSelectedAdj] = useState<AdjustmentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: rawAdjustments = [], isLoading } = useQuery({
    queryKey: ["warehouse-adjustments"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/adjustments");
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
        return (unwrapResponse(res.data) as any[]) || [];
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
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const adjustments: AdjustmentItem[] = useMemo(() => {
    if (!rawAdjustments || !Array.isArray(rawAdjustments)) return [];
    return rawAdjustments.map((adj: any) => ({
      id: adj.id,
      code: adj.adjNumber || `ADJ-${adj.id.slice(0, 8).toUpperCase()}`,
      date: adj.date || "-",
      warehouse: adj.warehouseName || "Gudang Utama",
      creator: "Warehouse Team",
      notes: adj.notes || "-",
      account: "5100 - Beban Selisih Persediaan",
      items: [
        {
          materialId: adj.materialId,
          name: adj.materialName || "Material",
          unit: adj.unit || "Unit",
          systemQty: adj.qty > 0 ? 0 : Math.abs(adj.qty),
          actualQty: adj.qty > 0 ? adj.qty : 0,
          difference: adj.qty,
          reason: adj.notes || adj.type,
        },
      ],
    }));
  }, [rawAdjustments]);

  // Form state
  const [formData, setFormData] = useState<AdjustmentFormData>({
    warehouseId: "",
    date: new Date().toISOString().split("T")[0],
    account: "5100 - Beban Selisih Persediaan",
    notes: "",
    items: [],
  });

  const [newItem, setNewItem] = useState<AdjustmentNewItem>({
    materialId: "",
    name: "",
    unit: "Kg",
    systemQty: 0,
    actualQty: 0,
    difference: 0,
    reason: "",
  });

  useEffect(() => {
    if (warehouseList.length > 0 && !formData.warehouseId) {
      setFormData((prev) => ({ ...prev, warehouseId: warehouseList[0].id }));
    }
  }, [warehouseList, formData.warehouseId]);

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return adjustments.filter((item) => {
      return (
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [adjustments, searchTerm]);

  const totalDeficit = useMemo(() => {
    return adjustments.reduce((acc, curr) => {
      return acc + curr.items.filter((it) => it.difference < 0).length;
    }, 0);
  }, [adjustments]);

  const totalSurplus = useMemo(() => {
    return adjustments.reduce((acc, curr) => {
      return acc + curr.items.filter((it) => it.difference > 0).length;
    }, 0);
  }, [adjustments]);

  const handleAddItem = () => {
    if (!newItem.materialId) {
      toast.warning("Pilih barang terlebih dahulu");
      return;
    }
    const diff = newItem.actualQty - newItem.systemQty;
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, difference: diff }],
    });
    setNewItem({
      materialId: "",
      name: "",
      unit: "Kg",
      systemQty: 0,
      actualQty: 0,
      difference: 0,
      reason: "",
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.warning("Tambahkan barang yang akan disesuaikan");
      return;
    }

    const targetWhId = formData.warehouseId || warehouseList[0]?.id;
    if (!targetWhId) {
      toast.error("Gudang tidak valid atau belum tersedia");
      return;
    }

    try {
      await Promise.all(
        formData.items.map((it) =>
          api.post("/warehouse/adjustments", {
            materialId: it.materialId,
            warehouseId: targetWhId,
            type: it.difference < 0 ? "WRITE_OFF" : "CORRECTION",
            qty: Math.abs(it.difference),
            notes: `${formData.notes ? formData.notes + " - " : ""}${it.reason || ""}`.trim() || undefined,
          })
        )
      );
      toast.success("Penyesuaian stok berhasil disimpan dan dibukukan.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-transactions"] });
      setIsCreateOpen(false);
      setFormData({
        warehouseId: warehouseList[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        account: "5100 - Beban Selisih Persediaan",
        notes: "",
        items: [],
      });
      if (actionParam === "create") {
        router.push("/stock-adjustment");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan penyesuaian stok");
    }
  };

  const openCreateModal = () => {
    setIsCreateOpen(true);
    router.push("/stock-adjustment/create");
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    if (actionParam === "create") {
      router.push("/stock-adjustment");
    }
  };

  const openDetailModal = (item: AdjustmentItem) => {
    setSelectedAdj(item);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedAdj,
    isDetailOpen,
    isCreateOpen,
    warehouseList,
    catalogMaterials,
    adjustments,
    filteredData,
    formData,
    setFormData,
    newItem,
    setNewItem,
    totalDeficit,
    totalSurplus,
    isLoading,
    handleAddItem,
    handleRemoveItem,
    handleSave,
    openCreateModal,
    closeCreateModal,
    openDetailModal,
    closeDetailModal,
  };
}
