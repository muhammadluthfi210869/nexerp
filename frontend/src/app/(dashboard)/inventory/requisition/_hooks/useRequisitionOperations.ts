import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  MaterialRequisition,
  CartItem,
  RequisitionKpis,
} from "../_types/requisition.types";

export function useRequisitionOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawRequirements = [], isLoading } = useQuery({
    queryKey: ["scm-goods-requirements"],
    queryFn: async () => {
      try {
        const res = await api.get("/scm/goods-requirements");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: warehouseList = [] } = useQuery({
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

  const { data: catalogMaterials = [] } = useQuery({
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

  const { data: rawSalesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/commercial/sales-orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const dataList: MaterialRequisition[] = useMemo(() => {
    if (!rawRequirements || !Array.isArray(rawRequirements)) return [];
    return rawRequirements.map((r: any) => ({
      id: r.id,
      requisitionNumber: r.code || `REQ-${r.id.slice(0, 8).toUpperCase()}`,
      requestDate: r.date ? new Date(r.date).toISOString().split("T")[0] : "-",
      fromWarehouse: r.notes?.includes("[Gudang:")
        ? r.notes.split("[Gudang:")[1]?.split("]")[0]?.trim()
        : "Gudang Bahan Baku",
      toDivision: r.notes?.includes("[Divisi:")
        ? r.notes.split("[Divisi:")[1]?.split("]")[0]?.trim()
        : "Ruang Mixing Produksi",
      spkNumber: r.notes?.includes("[SPK:")
        ? r.notes.split("[SPK:")[1]?.split("]")[0]?.trim()
        : r.salesOrderId
        ? `SO-${r.salesOrderId.slice(0, 8)}`
        : "-",
      purpose: r.notes?.replace(/\[.*?\]/g, "").trim() || "Kebutuhan Material Produksi",
      totalItems: (r.items || []).length,
      requestedBy: "Tim Produksi",
      status: (r.status as MaterialRequisition["status"]) || "PENDING",
      items: (r.items || []).map((it: any) => ({
        id: it.id,
        materialCode: it.material?.code || it.materialId?.slice(0, 8) || "MAT-01",
        materialName: it.material?.name || "Bahan Baku",
        category: "BAHAN_BAKU" as const,
        requestedQty: Number(it.qty || 0),
        availableStock: Number(it.material?.stockQty || it.material?.stock || 0),
        unit: it.material?.unit || "Kg",
        notes: it.notes || "-",
      })),
    }));
  }, [rawRequirements]);

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [selectedReq, setSelectedReq] = useState<MaterialRequisition | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      setIsCreateOpen(true);
    } else if (action === "approval") {
      setActiveTab("PENDING");
    }
  }, [searchParams]);

  // Form State
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toDivision, setToDivision] = useState("Ruang Mixing Produksi - Line A");
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");
  const [spkNumber, setSpkNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemNote, setItemNote] = useState("");

  useEffect(() => {
    if (warehouseList.length > 0 && !fromWarehouse) {
      setFromWarehouse(warehouseList[0].name);
    }
  }, [warehouseList, fromWarehouse]);

  useEffect(() => {
    if (rawSalesOrders.length > 0 && !selectedSalesOrderId) {
      setSelectedSalesOrderId(rawSalesOrders[0].id);
      setSpkNumber(rawSalesOrders[0].orderNumber || rawSalesOrders[0].id.slice(0, 8));
    }
  }, [rawSalesOrders, selectedSalesOrderId]);

  // Calculate KPIs
  const kpis: RequisitionKpis = useMemo(() => {
    const list = dataList;
    const total = list.length;
    const pending = list.filter((r) => r.status === "PENDING").length;
    const approved = list.filter((r) => r.status === "APPROVED" || r.status === "COMPLETED").length;
    const totalItemsCount = list.reduce(
      (sum, r) => sum + r.items.reduce((iSum, i) => iSum + i.requestedQty, 0),
      0
    );

    return {
      total,
      pending,
      approved,
      totalItemsCount,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.requisitionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.spkNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "PENDING"
          ? item.status === "PENDING"
          : activeTab === "APPROVED"
          ? item.status === "APPROVED"
          : activeTab === "COMPLETED"
          ? item.status === "COMPLETED"
          : activeTab === "REJECTED"
          ? item.status === "REJECTED"
          : true;

      const matchWarehouse =
        warehouseFilter === "ALL" ? true : item.fromWarehouse.includes(warehouseFilter);

      return matchSearch && matchTab && matchWarehouse;
    });
  }, [dataList, searchQuery, activeTab, warehouseFilter]);

  // Cart Handlers
  const handleAddItemToCart = () => {
    if (!selectedMaterialId) {
      toast.error("Pilih material terlebih dahulu");
      return;
    }
    const mat = catalogMaterials.find((m: any) => m.id === selectedMaterialId);
    if (!mat) return;

    if (itemQty <= 0) {
      toast.error("Jumlah permintaan harus lebih dari 0");
      return;
    }

    const existing = cartItems.find((c) => c.materialId === mat.id);
    if (existing) {
      setCartItems(
        cartItems.map((c) =>
          c.materialId === mat.id ? { ...c, requestedQty: c.requestedQty + itemQty } : c
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          materialId: mat.id,
          materialCode: mat.code || mat.id.slice(0, 8),
          materialName: mat.name,
          category: "BAHAN_BAKU",
          requestedQty: itemQty,
          availableStock: Number(mat.stock || mat.currentStock || 0),
          unit: mat.unit || "Kg",
          notes: itemNote,
        },
      ]);
    }

    setSelectedMaterialId("");
    setItemQty(1);
    setItemNote("");
    toast.success(`${mat.name} ditambahkan ke daftar permintaan`);
  };

  const handleRemoveFromCart = (identifier: string) => {
    setCartItems(
      cartItems.filter((c) => c.materialId !== identifier && c.materialCode !== identifier)
    );
  };

  const handleCreateRequisition = async () => {
    if (!selectedSalesOrderId) {
      toast.error("Pilih Sales Order terlebih dahulu");
      return;
    }
    if (!purpose.trim()) {
      toast.error("Keperluan / Keterangan permintaan wajib diisi");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Tambahkan minimal 1 item material ke dalam daftar");
      return;
    }

    try {
      await api.post("/scm/goods-requirements", {
        salesOrderId: selectedSalesOrderId,
        date: new Date().toISOString(),
        notes: `[Gudang: ${fromWarehouse}] [Divisi: ${toDivision}] [SPK: ${spkNumber}] ${
          batchNumber ? `[Batch: ${batchNumber}] ` : ""
        }${purpose}`.trim(),
        items: cartItems.map((c) => ({
          materialId: c.materialId,
          qty: c.requestedQty,
          notes: c.notes || undefined,
        })),
      });

      toast.success("Permintaan Barang (Goods Requirement) berhasil diajukan.");
      queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
      setIsCreateOpen(false);
      setCartItems([]);
      setBatchNumber("");
      setPurpose("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal mengajukan permintaan barang");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/scm/goods-requirements/${id}/status`, { status: "APPROVED" });
      toast.success(
        "Permintaan barang disetujui. Petugas gudang dapat menyiapkan barang (Picking)."
      );
      queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status: "APPROVED" });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyetujui permintaan barang");
    }
  };

  const handleHandoverComplete = async (id: string) => {
    try {
      await api.patch(`/scm/goods-requirements/${id}/status`, { status: "COMPLETED" });
      toast.success("Barang telah diserahterimakan dan status diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status: "COMPLETED" });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal mengonfirmasi serah terima");
    }
  };

  return {
    isLoading,
    rawRequirements,
    warehouseList,
    catalogMaterials,
    rawSalesOrders,
    dataList,
    filteredList,
    kpis,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    warehouseFilter,
    setWarehouseFilter,
    selectedReq,
    setSelectedReq,
    isDetailOpen,
    setIsDetailOpen,
    isCreateOpen,
    setIsCreateOpen,
    // Form states
    fromWarehouse,
    setFromWarehouse,
    toDivision,
    setToDivision,
    selectedSalesOrderId,
    setSelectedSalesOrderId,
    spkNumber,
    setSpkNumber,
    batchNumber,
    setBatchNumber,
    purpose,
    setPurpose,
    cartItems,
    setCartItems,
    selectedMaterialId,
    setSelectedMaterialId,
    itemQty,
    setItemQty,
    itemNote,
    setItemNote,
    // Handlers
    handleAddItemToCart,
    handleRemoveFromCart,
    handleCreateRequisition,
    handleApprove,
    handleHandoverComplete,
  };
}
