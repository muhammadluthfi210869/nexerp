"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  AssetRegisterItem,
  AssetFormData,
} from "../_types/assets.types";

export const usefulLifeMap: Record<string, number> = {
  Inventaris: 4,
  Motor: 4,
  Mobil: 8,
  Bangunan: 20,
};

const initialFormData: AssetFormData = {
  name: "",
  category: "Inventaris",
  acquisitionDate: new Date().toISOString().split("T")[0],
  cost: "",
  location: "Ruang Produksi Manufaktur",
  department: "Produksi Manufaktur",
};

export function useAssetsOperations() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateMode, setDateMode] = useState<"ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetRegisterItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Form (SCR-025)
  const [formData, setFormData] = useState<AssetFormData>(initialFormData);

  const { data: assetsRaw = [] } = useQuery({
    queryKey: ["finance-assets-register"],
    queryFn: async (): Promise<any[]> => {
      try {
        const res = await api.get("/finance/fixed-assets");
        return unwrapResponse<any[]>(res) || [];
      } catch {
        const res2 = await api.get("/finance/assets");
        return unwrapResponse<any[]>(res2) || [];
      }
    },
  });

  const assets: AssetRegisterItem[] = useMemo(() => {
    return (assetsRaw || []).map((a: any) => {
      const acqCost = Number(a.acquisitionCost || a.cost || 0);
      const accDep = Number(a.accumDepreciation || 0);
      const bValue = Number(a.bookValue || (acqCost - accDep));
      const statusVal = a.status === "DISPOSED" || a.status === "DISPOSAL" ? "DISPOSAL" : a.status === "MAINTENANCE" ? "MAINTENANCE" : "AKTIF";
      return {
        id: a.id,
        assetCode: a.code || `AST-${a.id?.slice(0, 8)}`,
        name: a.name || "Aset Tetap",
        category: (a.category || "Inventaris") as any,
        acquisitionDate: a.acquisitionDate ? new Date(a.acquisitionDate).toISOString().split("T")[0] : "",
        acquisitionCost: acqCost,
        depreciationMethod: a.depreciationMethod || "Garis Lurus (Straight-Line)",
        usefulLifeYears: Number(a.usefulLifeYears || usefulLifeMap[a.category] || 4),
        accumDepreciation: accDep,
        bookValue: bValue,
        status: statusVal as "AKTIF" | "DISPOSAL" | "MAINTENANCE",
        location: a.location || "-",
        department: a.department || "-",
        purchaseHistory: a.purchaseHistory || [],
      };
    });
  }, [assetsRaw]);

  const totalCost = useMemo(() => assets.reduce((acc, r) => acc + r.acquisitionCost, 0), [assets]);
  const totalDeprec = useMemo(() => assets.reduce((acc, r) => acc + r.accumDepreciation, 0), [assets]);
  const totalBookValue = useMemo(() => assets.reduce((acc, r) => acc + r.bookValue, 0), [assets]);

  const statusOptions = useMemo(() => [
    { value: "ALL", label: "Semua Status Aset" },
    { value: "AKTIF", label: "Aktif Beroperasi", color: "success" as const },
    { value: "MAINTENANCE", label: "Dalam Pemeliharaan", color: "warning" as const },
    { value: "DISPOSAL", label: "Disposal / Dijual", color: "critical" as const },
  ], []);

  const filterColumns = useMemo(() => {
    const categories = Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));
    const locations = Array.from(new Set(assets.map((a) => a.location).filter(Boolean)));
    const departments = Array.from(new Set(assets.map((a) => a.department).filter(Boolean)));
    return [
      {
        key: "category",
        label: "Kategori Aset",
        type: "select" as const,
        options: categories,
      },
      {
        key: "location",
        label: "Lokasi Penempatan",
        type: "select" as const,
        options: locations,
      },
      {
        key: "department",
        label: "Departemen Pemakai",
        type: "select" as const,
        options: departments,
      },
      {
        key: "acquisitionCost",
        label: "Urutkan Harga Perolehan",
        type: "sort_numeric" as const,
      },
      {
        key: "bookValue",
        label: "Urutkan Nilai Buku",
        type: "sort_numeric" as const,
      },
    ];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        // Status filter
        if (selectedStatus !== "ALL" && a.status !== selectedStatus) {
          return false;
        }

        // Live Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = a.assetCode.toLowerCase().includes(q);
          const matchName = a.name.toLowerCase().includes(q);
          const matchLoc = a.location.toLowerCase().includes(q);
          const matchDept = a.department.toLowerCase().includes(q);
          const matchCat = a.category.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchLoc && !matchDept && !matchCat) {
            return false;
          }
        }

        // Column select filter
        if (selectedColumn === "category" && filterValue) {
          if (a.category !== filterValue) return false;
        }
        if (selectedColumn === "location" && filterValue) {
          if (a.location !== filterValue) return false;
        }
        if (selectedColumn === "department" && filterValue) {
          if (a.department !== filterValue) return false;
        }

        // Date mode filter (Acquisition Date)
        if (dateMode !== "ALL" && a.acquisitionDate) {
          const itemDate = new Date(a.acquisitionDate);
          const today = new Date();

          if (dateMode === "1_DAY") {
            const isToday =
              itemDate.getFullYear() === today.getFullYear() &&
              itemDate.getMonth() === today.getMonth() &&
              itemDate.getDate() === today.getDate();
            if (!isToday) return false;
          } else if (dateMode === "1_WEEK") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(today.getDate() - 7);
            if (itemDate < oneWeekAgo || itemDate > today) return false;
          } else if (dateMode === "1_MONTH") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);
            if (itemDate < oneMonthAgo || itemDate > today) return false;
          } else if (dateMode === "1_YEAR") {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            if (itemDate < oneYearAgo || itemDate > today) return false;
          } else if (dateMode === "CUSTOM") {
            if (startDate && a.acquisitionDate < startDate) return false;
            if (endDate && a.acquisitionDate > endDate) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedColumn === "acquisitionCost") {
          if (filterValue === "asc") return a.acquisitionCost - b.acquisitionCost;
          if (filterValue === "desc") return b.acquisitionCost - a.acquisitionCost;
        }
        if (selectedColumn === "bookValue") {
          if (filterValue === "asc") return a.bookValue - b.bookValue;
          if (filterValue === "desc") return b.bookValue - a.bookValue;
        }
        return 0;
      });
  }, [assets, selectedStatus, searchQuery, selectedColumn, filterValue, dateMode, startDate, endDate]);

  const handleResetAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedColumn("");
    setFilterValue("");
    setDateMode("ALL");
    setStartDate("");
    setEndDate("");
  };

  const createAssetMutation = useMutation({
    mutationFn: async () => {
      return api.post("/finance/fixed-assets", {
        assetName: formData.name,
        assetCategory: formData.category,
        acquisitionDate: formData.acquisitionDate,
        acquisitionCost: Number(formData.cost),
        usefulLife: (usefulLifeMap[formData.category] || 4) * 12,
        location: formData.location,
        department: formData.department,
      });
    },
    onSuccess: () => {
      toast.success("Aset Tetap baru berhasil didaftarkan ke database!");
      queryClient.invalidateQueries({ queryKey: ["finance-assets-register"] });
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        category: "Inventaris",
        acquisitionDate: new Date().toISOString().split("T")[0],
        cost: "",
        location: "Ruang Produksi Manufaktur",
        department: "Produksi Manufaktur",
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mendaftarkan aset tetap.");
    },
  });

  const handleSaveAsset = () => {
    if (!formData.name || !formData.cost) {
      toast.error("Mohon lengkapi nama dan harga perolehan aset!");
      return;
    }
    createAssetMutation.mutate();
  };

  const handleRunDepreciation = () => {
    toast.success("Menjalankan kalkulasi depresiasi bulanan (Straight-Line)...");
  };

  const handlePrintBarcode = () => {
    toast.success("Mencetak label barcode aset...");
  };

  const handleRecordUpgrade = () => {
    toast.success("Membuka form penambahan perbaikan / overhaul aset...");
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    selectedColumn,
    setSelectedColumn,
    filterValue,
    setFilterValue,
    filterColumns,
    dateMode,
    setDateMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetAll,
    selectedAsset,
    setSelectedAsset,
    isCreateModalOpen,
    setIsCreateModalOpen,
    formData,
    setFormData,
    assets,
    filteredAssets,
    totalCost,
    totalDeprec,
    totalBookValue,
    createAssetMutation,
    handleSaveAsset,
    handleRunDepreciation,
    handlePrintBarcode,
    handleRecordUpgrade,
  };
}
