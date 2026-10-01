"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  WarehouseNode,
  BinLocation,
  GoodsCategory,
  WarehouseFormData,
  BinFormData,
  CategoryFormData,
} from "../_types/gudang.types";

export function useGudangOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("ALL");

  // Modals
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Warehouse Form (SCR-036)
  const [warehouseForm, setWarehouseForm] = useState<WarehouseFormData>({
    name: "",
    code: "",
    type: "RAW_MATERIAL",
    phone: "",
    province: "Banten",
    city: "Tangerang",
    address: "",
    picName: "",
  });

  // Bin Form
  const [binForm, setBinForm] = useState<BinFormData>({
    binCode: "",
    warehouseCode: "WH-01",
    aisle: "Lorong A",
    rackLevel: "Tingkat 1",
    zoneType: "COOL_ROOM",
    capacityMax: 1000,
  });

  // Category Form (SCR-028)
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    code: "",
    name: "",
    description: "",
    inventoryAccount: "110401",
    cogsAccount: "510101",
    salesAccount: "410101",
    salesReturnAccount: "410201",
    unbilledGoodsAccount: "210201",
  });

  // Queries
  const { data: rawWarehouses = [] } = useQuery({
    queryKey: ["master-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const warehouses: WarehouseNode[] = useMemo(() => {
    if (!rawWarehouses || !Array.isArray(rawWarehouses)) return [];
    return rawWarehouses.map((w: any) => ({
      id: w.id,
      code: w.code || `WH-${w.id.slice(0, 4).toUpperCase()}`,
      name: w.name,
      type: (w.type || "RAW_MATERIAL") as any,
      typeLabel: w.description || w.type || "Gudang Penyimpanan",
      address: w.address || "-",
      city: w.city || "-",
      province: w.province || "-",
      phone: w.phone || "-",
      picName: w.picName || "PIC Gudang",
      totalBins: w.totalBins || 0,
      capacityUtilityPercent: w.capacityUtilityPercent || 0,
      temperatureZone: (w.temperatureZone || "AMBIENT") as any,
      status: (w.status || "ACTIVE") as any,
    }));
  }, [rawWarehouses]);

  const { data: rawBins = [] } = useQuery({
    queryKey: ["warehouse-locations"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/locations");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const bins: BinLocation[] = useMemo(() => {
    if (!rawBins || !Array.isArray(rawBins)) return [];
    return rawBins.map((b: any) => ({
      id: b.id,
      binCode: b.code || b.name || "BIN-01",
      warehouseCode: b.warehouseCode || b.warehouse?.code || "WH-01",
      warehouseName: b.warehouseName || b.warehouse?.name || "Gudang Utama",
      aisle: b.aisle || b.zone || "Lorong A",
      rackLevel: b.rackLevel || b.level || "Tingkat 1",
      zoneType: (b.zoneType || "AMBIENT") as any,
      capacityMax: Number(b.capacityMax || 1000),
      currentWeightOrQty: Number(b.currentStock || b.currentWeightOrQty || 0),
      occupancyPercent: Number(b.occupancyPercent || 0),
      activeSku: b.activeSku || "-",
      status: (b.status || "AVAILABLE") as any,
    }));
  }, [rawBins]);

  const { data: rawCategories = [] } = useQuery({
    queryKey: ["master-categories"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/categories");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const categories: GoodsCategory[] = useMemo(() => {
    if (!rawCategories || !Array.isArray(rawCategories)) return [];
    return rawCategories.map((c: any) => ({
      id: c.id,
      code: c.code || `CAT-${c.id.slice(0, 4).toUpperCase()}`,
      name: c.name,
      description: c.description || "-",
      inventoryAccount: c.inventoryAccount || "110401 - Persediaan Bahan Baku",
      cogsAccount: c.cogsAccount || "510101 - HPP Bahan Baku",
      salesAccount: c.salesAccount || "410101 - Penjualan",
      salesReturnAccount: c.salesReturnAccount || "410201 - Retur Penjualan",
      unbilledGoodsAccount: c.unbilledGoodsAccount || "210201 - Barang Belum Difaktur",
    }));
  }, [rawCategories]);

  // Filtered Bins
  const filteredBins = useMemo(() => {
    return bins.filter((b) => {
      if (selectedWarehouseFilter !== "ALL" && b.warehouseCode !== selectedWarehouseFilter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          b.binCode.toLowerCase().includes(q) ||
          b.warehouseName.toLowerCase().includes(q) ||
          b.activeSku.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bins, selectedWarehouseFilter, searchQuery]);

  // Handlers
  const handleSaveWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.address) {
      toast.warning("Form Belum Lengkap", "Nama gudang dan alamat lengkap wajib diisi.");
      return;
    }
    try {
      await api.post("/master/warehouses", {
        name: warehouseForm.name,
        address: warehouseForm.address,
        city: warehouseForm.city,
        province: warehouseForm.province,
        phone: warehouseForm.phone,
        picName: warehouseForm.picName,
        description: `Gudang tipe ${warehouseForm.type}`,
      });
      toast.success("Gudang Fasilitas Disimpan", `Gudang ${warehouseForm.name} berhasil didaftarkan ke sistem.`);
      queryClient.invalidateQueries({ queryKey: ["master-warehouses"] });
      setIsWarehouseModalOpen(false);
    } catch (err: any) {
      toast.error("Gagal Menyimpan Gudang", err?.response?.data?.message || err.message);
    }
  };

  const handleSaveBin = () => {
    if (!binForm.binCode) {
      toast.warning("Form Belum Lengkap", "Kode lokasi Bin wajib diisi.");
      return;
    }
    toast.warning(
      "Lokasi Bin belum tersimpan",
      `Backend belum menyediakan rute tambah lokasi bin (POST /warehouse/locations). Rak ${binForm.binCode} tidak didaftarkan.`
    );
    setIsBinModalOpen(false);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.code || !categoryForm.name) {
      toast.warning("Form Belum Lengkap", "Kode dan Nama Kategori wajib diisi.");
      return;
    }
    toast.warning(
      "Kategori belum tersimpan",
      `Backend belum menyediakan rute mapping CoA kategori barang. Kategori ${categoryForm.name} tidak didaftarkan.`
    );
    setIsCategoryModalOpen(false);
  };

  const handleViewWarehouseDetail = (w: WarehouseNode) => {
    toast.info("Detail Gudang", `Membuka detail fasilitas ${w.name} (${w.code})`);
  };

  const handleViewCategoryDetail = (c: GoodsCategory) => {
    toast.info("Detail Kategori & CoA", `Membuka konfigurasi akun untuk ${c.name} (${c.code})`);
  };

  return {
    toast,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedWarehouseFilter,
    setSelectedWarehouseFilter,
    isWarehouseModalOpen,
    setIsWarehouseModalOpen,
    isBinModalOpen,
    setIsBinModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    warehouseForm,
    setWarehouseForm,
    binForm,
    setBinForm,
    categoryForm,
    setCategoryForm,
    warehouses,
    bins,
    categories,
    filteredBins,
    handleSaveWarehouse,
    handleSaveBin,
    handleSaveCategory,
    handleViewWarehouseDetail,
    handleViewCategoryDetail,
  };
}
