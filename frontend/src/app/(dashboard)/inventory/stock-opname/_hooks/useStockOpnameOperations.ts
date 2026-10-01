import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  OpnameRecord,
  OpnameFormData,
  OpnameNewItem,
  WarehouseOption,
  CatalogMaterialOption,
} from "../_types/stock-opname.types";

export function useStockOpnameOperations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOpn, setSelectedOpn] = useState<OpnameRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: rawOpnames = [] } = useQuery({
    queryKey: ["inventory-opnames"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/opname");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: warehouses = [] } = useQuery<WarehouseOption[]>({
    queryKey: ["inventory-warehouses"],
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
    queryKey: ["inventory-catalog-materials"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const opnames: OpnameRecord[] = useMemo(() => {
    return rawOpnames.map((o: any) => ({
      id: o.id,
      code: o.opnameNumber || `OPN-${o.id.slice(0, 8).toUpperCase()}`,
      date: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "-",
      warehouse: o.warehouse?.name || "Gudang Utama",
      creator: o.pic?.name || o.picId || "Staff Gudang",
      status: (o.status || "COMPLETED") as any,
      notes: o.notes || "-",
      items: (o.items || []).map((it: any) => ({
        materialId: it.materialId,
        name: it.material?.name || "Material",
        unit: it.material?.unit || "Unit",
        systemQty: Number(it.systemQty || 0),
        actualQty: Number(it.actualQty || 0),
        difference: Number(it.difference || 0),
        notes: it.notes || "",
      })),
    }));
  }, [rawOpnames]);

  // Form State
  const [formData, setFormData] = useState<OpnameFormData>({
    warehouseId: "",
    warehouse: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
  });

  const [newItem, setNewItem] = useState<OpnameNewItem>({
    materialId: "",
    name: "",
    unit: "Unit",
    systemQty: 0,
    actualQty: 0,
    difference: 0,
    notes: "",
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return opnames.filter((item) => {
      return (
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [opnames, searchTerm]);

  const totalCompleted = opnames.filter((o) => o.status === "COMPLETED").length;
  const totalDraft = opnames.filter((o) => o.status === "DRAFT").length;

  const accuracy = useMemo(() => {
    if (opnames.length === 0) return "100%";
    let totalSys = 0;
    let totalAct = 0;
    opnames.forEach((o) => {
      o.items.forEach((i) => {
        totalSys += i.systemQty;
        totalAct += i.actualQty;
      });
    });
    if (totalSys === 0) return "100%";
    const acc = (1 - Math.abs(totalSys - totalAct) / totalSys) * 100;
    return `${Math.max(0, acc).toFixed(1)}%`;
  }, [opnames]);

  const handleAddItem = () => {
    if (!newItem.name) {
      toast({ title: "Pilih Material", description: "Pilih material terlebih dahulu", variant: "warning" });
      return;
    }
    const diff = newItem.actualQty - newItem.systemQty;
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...newItem, difference: diff }],
    }));
    setNewItem({ materialId: "", name: "", unit: "Unit", systemQty: 0, actualQty: 0, difference: 0, notes: "" });
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWhId = formData.warehouseId || warehouses[0]?.id;
    if (!targetWhId) {
      toast({ title: "Gudang Kosong", description: "Pilih gudang terlebih dahulu", variant: "warning" });
      return;
    }

    try {
      await api.post("/warehouse/opname", {
        warehouseId: targetWhId,
        picId: "SYSTEM",
        notes: formData.notes || "Stock opname fisik gudang",
        items: formData.items.map((it) => ({
          materialId: it.materialId || (catalogMaterials[0]?.id as string) || "MAT-01",
          systemQty: it.systemQty,
          actualQty: it.actualQty,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ["inventory-opnames"] });
      setIsCreateOpen(false);
      setFormData({
        warehouseId: "",
        warehouse: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        items: [],
      });
      toast({
        title: "Stock Opname Disimpan",
        description: `Audit fisik berhasil disimpan ke server.`,
        variant: "success",
      });
      if (actionParam === "create") {
        router.push("/stock-opname");
      }
    } catch (err: any) {
      toast({
        title: "Gagal Menyimpan",
        description: err?.response?.data?.message || "Terjadi kesalahan saat menyimpan opname",
        variant: "error",
      });
    }
  };

  const openCreateModal = () => {
    setIsCreateOpen(true);
    router.push("/stock-opname/create");
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    if (actionParam === "create") {
      router.push("/stock-opname");
    }
  };

  const openDetailModal = (opn: OpnameRecord) => {
    setSelectedOpn(opn);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
  };

  const handlePrintOpname = (opn: OpnameRecord) => {
    toast({
      title: "Mencetak Berita Acara Opname",
      description: `Mengunduh PDF Opname ${opn.code}`,
      variant: "info",
    });
  };

  return {
    router,
    searchParams,
    actionParam,
    toast,
    queryClient,
    searchTerm,
    setSearchTerm,
    selectedOpn,
    setSelectedOpn,
    isDetailOpen,
    setIsDetailOpen,
    isCreateOpen,
    setIsCreateOpen,
    warehouses,
    catalogMaterials,
    opnames,
    filteredData,
    formData,
    setFormData,
    newItem,
    setNewItem,
    totalCompleted,
    totalDraft,
    accuracy,
    handleAddItem,
    handleRemoveItem,
    handleSave,
    openCreateModal,
    closeCreateModal,
    openDetailModal,
    closeDetailModal,
    handlePrintOpname,
  };
}
