"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type { MrpItemRecord, MrpFormData } from "../_types/kebutuhan.types";

export function useKebutuhanOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MrpItemRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get("action") === "create");
  const [manualNeeds, setManualNeeds] = useState<MrpItemRecord[]>([]);

  // Live query from backend /scm/materials
  const {
    data: materials = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mrp-materials"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return unwrapResponse(res) || [];
    },
  });

  const mrpList: MrpItemRecord[] = useMemo(() => {
    const fromApi: MrpItemRecord[] = (materials as any[]).map((mat) => {
      const stock = Number(mat.stockQty ?? 0);
      const minReq = Number(mat.minLevel ?? 50);
      const gross = Math.max(minReq, 50);
      const net = Math.max(0, gross - stock);
      const category =
        mat.type === "PACKAGING" || mat.type === "BOX" ? "Kemas Primer" : "Bahan Baku";
      const price = Number(mat.unitPrice ?? 10000);

      return {
        id: mat.id,
        materialCode: mat.code || `MAT-${mat.id.slice(0, 6)}`,
        materialName: mat.name,
        category,
        salesOrderRef: "SO-AUTO-ALLOC",
        clientName: "Internal Buffer / Maklon",
        brandProduct: "Kebutuhan Minimum",
        grossRequirement: gross,
        realStockQty: stock,
        onOrderQty: 0,
        netNeedQty: net,
        unit: mat.unit || "kg",
        primarySupplier: "Supplier Rekanan",
        estimatedUnitPrice: price,
        estimatedTotalCost: net * price,
        status: net > 0 ? "DEFICIT" : "SAFE_STOCK",
      };
    });

    return [...manualNeeds, ...fromApi];
  }, [materials, manualNeeds]);

  // Form State for Manual Need Entry
  const [formData, setFormData] = useState<MrpFormData>({
    materialCode: "",
    materialName: "",
    category: "Bahan Baku",
    salesOrderRef: "",
    clientName: "",
    brandProduct: "",
    grossRequirement: 0,
    realStockQty: 0,
    onOrderQty: 0,
    unit: "kg",
    primarySupplier: "",
    estimatedUnitPrice: 0,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.materialCode || !formData.materialName) {
      toast.error("Validasi Gagal", "Kode material dan nama material wajib diisi.");
      return;
    }
    const netNeed = Math.max(0, formData.grossRequirement - formData.realStockQty - formData.onOrderQty);
    const newItem: MrpItemRecord = {
      id: `mrp-${Date.now()}`,
      ...formData,
      netNeedQty: netNeed,
      estimatedTotalCost: netNeed * formData.estimatedUnitPrice,
      status: netNeed > 0 ? "DEFICIT" : "SAFE_STOCK",
    };
    setManualNeeds([newItem, ...manualNeeds]);
    // Local planning worksheet only. POST /scm/goods-requirements needs `salesOrderId` and
    // `items[].materialId` as UUIDs; this form holds a material code/name, so it cannot fill
    // either and the row would be rejected. Nothing is sent until those pickers exist.
    toast.warning(
      "Kebutuhan dicatat lokal",
      `Kebutuhan ${newItem.materialName} masuk ke rencana MRP di layar ini saja â€” belum tersimpan ke server.`,
    );
    setIsCreateOpen(false);
  };

  // Filters
  const filteredList = useMemo(() => {
    return mrpList.filter((item) => {
      if (activeTab === "deficit" && item.status !== "DEFICIT") return false;
      if (activeTab === "safe" && item.status !== "SAFE_STOCK") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.materialCode.toLowerCase().includes(q) ||
        item.materialName.toLowerCase().includes(q) ||
        item.salesOrderRef.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.primarySupplier.toLowerCase().includes(q)
      );
    });
  }, [mrpList, activeTab, searchQuery]);

  // KPIs
  const deficitItems = useMemo(() => mrpList.filter((i) => i.status === "DEFICIT"), [mrpList]);
  const totalDeficitCost = useMemo(() => deficitItems.reduce((sum, i) => sum + i.estimatedTotalCost, 0), [deficitItems]);
  const safeItemsCount = useMemo(() => mrpList.filter((i) => i.status === "SAFE_STOCK").length, [mrpList]);

  const handleGeneratePo = (item: MrpItemRecord) => {
    toast.success("Draft PO Dibuat", `Pengadaan untuk ${item.materialName} (${item.netNeedQty} ${item.unit}) telah dialokasikan ke SCM PO.`);
    router.push("/scm/pembelian/create");
  };

  const handleBatchPo = () => {
    toast.success("Batch PO Ready", "Semua item defisit siap diterbitkan PO massal.");
    router.push("/scm/pembelian/create");
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedItem,
    setSelectedItem,
    isCreateOpen,
    setIsCreateOpen,
    formData,
    setFormData,
    mrpList,
    filteredList,
    deficitItems,
    totalDeficitCost,
    safeItemsCount,
    isLoading,
    isError,
    refetch,
    handleCreateSubmit,
    handleGeneratePo,
    handleBatchPo,
  };
}
