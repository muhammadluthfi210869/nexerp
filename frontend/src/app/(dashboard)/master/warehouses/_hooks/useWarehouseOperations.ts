"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import type {
  MasterWarehouseItem,
  WarehouseAccessItem,
  AccessUserOption,
  WarehouseFormData,
} from "../_types/warehouse.types";

export function useWarehouseOperations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    tabParam === "access" ? "access" : "warehouses"
  );

  useEffect(() => {
    if (tabParam === "access" || tabParam === "warehouses") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/master/warehouses?tab=${tabId}`);
  };

  // States
  const [warehousesList, setWarehousesList] = useState<MasterWarehouseItem[]>([]);
  const [accessList, setAccessList] = useState<WarehouseAccessItem[]>([]);

  // â”€â”€ Backend API Query â”€â”€
  const {
    data: apiWarehouses,
    isLoading: isLoadingWarehouses,
    isError: isErrorWarehouses,
    error: warehousesError,
    refetch: refetchWarehouses,
  } = useQuery({
    queryKey: ["master-warehouses"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses");
      const body = unwrapResponse(res);
      return Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
        ? body.data
        : (() => {
            throw new Error("Invalid response shape from /master/warehouses: not an array");
          })();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (apiWarehouses && Array.isArray(apiWarehouses)) {
      const mapped: MasterWarehouseItem[] = apiWarehouses.map((w: any) => ({
        id: w.id,
        kodeGudang: w.code || `GDG-${w.id.substring(0, 4).toUpperCase()}`,
        namaGudang: w.name,
        lokasi: w.city || w.location || "Kab. Sidoarjo",
        provinsi: w.province || "Jawa Timur",
        telepon: w.phone || "-",
        picName: w.picName || "-",
        tipePenyimpanan: (w.description as any) || "Suhu Ruang (Ambient)",
        totalBinLocations: w._count?.locations ?? 0,
        status: w.status || "ACTIVE",
        alamatLengkap: w.address || w.location || "-",
      }));
      setWarehousesList(mapped);
    } else if (!isLoadingWarehouses && !isErrorWarehouses) {
      setWarehousesList([]);
    }
  }, [apiWarehouses, isLoadingWarehouses, isErrorWarehouses]);

  // â”€â”€ Hak akses gudang â”€â”€
  const {
    data: apiUsersAccess,
    isLoading: isLoadingAccess,
    isError: isErrorAccess,
    error: accessError,
    refetch: refetchAccess,
  } = useQuery({
    queryKey: ["master-warehouses-users-access"],
    queryFn: async () => {
      const res = await api.get("/master/warehouses/users-access");
      const body = unwrapResponse(res);
      return Array.isArray(body) ? body : [];
    },
    staleTime: 30000,
  });

  const accessUsers = useMemo<AccessUserOption[]>(() => {
    if (!Array.isArray(apiUsersAccess)) return [];
    return apiUsersAccess.map((u: any) => ({
      id: u.userId,
      fullName: u.namaPersonel || u.email,
      email: u.email || "-",
      role: u.hakAkses || "STAFF",
    }));
  }, [apiUsersAccess]);

  useEffect(() => {
    if (apiUsersAccess && Array.isArray(apiUsersAccess)) {
      setAccessList(
        apiUsersAccess.map((u: any) => ({
          id: u.userId,
          userId: u.userId,
          namaPersonel: u.namaPersonel || u.email,
          email: u.email || "-",
          phone: u.phone || "-",
          hakAkses: u.hakAkses || "STAFF",
          gudangAkses: (u.warehouses || []).map((w: any) => w.name),
          warehouseIds: (u.warehouses || []).map((w: any) => w.id),
        }))
      );
    }
  }, [apiUsersAccess]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string>("ALL");
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<string>("lokasi");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Detail Drawer
  const [selectedWarehouse, setSelectedWarehouse] = useState<MasterWarehouseItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Modals
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<MasterWarehouseItem | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<MasterWarehouseItem | null>(null);
  const [editingAccess, setEditingAccess] = useState<WarehouseAccessItem | null>(null);
  const [selectedWarehouseIdsForUser, setSelectedWarehouseIdsForUser] = useState<string[]>([]);
  const [accessTargetUserId, setAccessTargetUserId] = useState<string>("");
  const [accessSearchQuery, setAccessSearchQuery] = useState("");

  const filteredAccessList = useMemo(() => {
    if (!accessSearchQuery.trim()) return accessList;
    const q = accessSearchQuery.toLowerCase();
    return accessList.filter(
      (a) =>
        a.namaPersonel.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        a.hakAkses.toLowerCase().includes(q) ||
        a.gudangAkses.some((g) => g.toLowerCase().includes(q))
    );
  }, [accessList, accessSearchQuery]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      if (tabParam === "access") {
        setIsAccessModalOpen(true);
      } else {
        setIsWarehouseModalOpen(true);
      }
    }
  }, [searchParams, tabParam]);

  // Form Gudang
  const [warehouseForm, setWarehouseForm] = useState<WarehouseFormData>({
    kodeGudang: "",
    namaGudang: "",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "",
    picName: "",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 20,
    status: "ACTIVE",
    alamatLengkap: "",
  });

  // â”€â”€ Stats â”€â”€
  const totalWarehouses = warehousesList.length;
  const sidoarjoHubs = warehousesList.filter((w) => w.lokasi.includes("Sidoarjo")).length;
  const pasuruanHubs = warehousesList.filter((w) => w.lokasi.includes("Pasuruan")).length;
  const totalBins = warehousesList.reduce((acc, curr) => acc + curr.totalBinLocations, 0);

  // â”€â”€ Filtered & Sorted Warehouses Pipeline â”€â”€
  const filteredWarehouses = useMemo(() => {
    return warehousesList
      .filter((item) => {
        // 1. KPI Filter
        if (selectedKpiFilter === "Sidoarjo" && !item.lokasi.includes("Sidoarjo")) return false;
        if (selectedKpiFilter === "Pasuruan" && !item.lokasi.includes("Pasuruan")) return false;
        if (
          selectedKpiFilter === "COOL" &&
          !item.tipePenyimpanan.includes("Cool") &&
          !item.tipePenyimpanan.includes("Chiller")
        )
          return false;

        // 2. Toolbar Filter
        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "lokasi" && !item.lokasi.includes(filterColumnValue)) {
            return false;
          }
          if (selectedFilterColumn === "tipe" && item.tipePenyimpanan !== filterColumnValue) {
            return false;
          }
        }

        // 3. Global Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.kodeGudang.toLowerCase().includes(q);
          const matchName = item.namaGudang.toLowerCase().includes(q);
          const matchPic = item.picName.toLowerCase().includes(q);
          const matchLokasi = item.lokasi.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchPic && !matchLokasi) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortColumn) {
          case "kodeGudang":
            return dir * a.kodeGudang.localeCompare(b.kodeGudang);
          case "namaGudang":
            return dir * a.namaGudang.localeCompare(b.namaGudang);
          case "lokasi":
            return dir * a.lokasi.localeCompare(b.lokasi);
          case "picName":
            return dir * a.picName.localeCompare(b.picName);
          case "totalBinLocations":
            return dir * (a.totalBinLocations - b.totalBinLocations);
          default:
            return 0;
        }
      });
  }, [
    warehousesList,
    selectedKpiFilter,
    selectedFilterColumn,
    filterColumnValue,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Pagination Slice
  const totalEntries = filteredWarehouses.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedWarehouses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWarehouses.slice(start, start + pageSize);
  }, [filteredWarehouses, currentPage, pageSize]);

  // Sorting Handler
  const handleHeaderSortToggle = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  // Selection Handler
  const toggleSelectAll = () => {
    if (selectedRowIds.length === paginatedWarehouses.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginatedWarehouses.map((w) => w.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // â”€â”€ Mutations â”€â”€
  const invalidateWarehouses = () =>
    queryClient.invalidateQueries({ queryKey: ["master-warehouses"] });

  const saveWarehouseMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: warehouseForm.namaGudang.trim(),
        picName: warehouseForm.picName.trim() || undefined,
        description: warehouseForm.tipePenyimpanan,
        phone: warehouseForm.telepon.trim() || undefined,
        province: warehouseForm.provinsi.trim() || undefined,
        city: warehouseForm.lokasi.trim() || undefined,
        address: warehouseForm.alamatLengkap.trim() || undefined,
      };
      const res = editingWarehouse
        ? await api.patch(`/master/warehouses/${editingWarehouse.id}`, payload)
        : await api.post("/master/warehouses", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      toast.success(
        editingWarehouse
          ? `Data gudang ${warehouseForm.namaGudang} berhasil diperbarui.`
          : `Gudang baru ${warehouseForm.namaGudang} berhasil didaftarkan.`
      );
      setIsWarehouseModalOpen(false);
      setEditingWarehouse(null);
      invalidateWarehouses();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteWarehouseMut = useMutation({
    mutationFn: async (id: string) =>
      unwrapResponse(await api.delete(`/master/warehouses/${id}`)),
    onSuccess: () => {
      toast.success(`Gudang ${warehouseToDelete?.namaGudang} berhasil dihapus.`);
      setWarehouseToDelete(null);
      invalidateWarehouses();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const saveAccessMut = useMutation({
    mutationFn: async () => {
      const targetUserId = accessTargetUserId || editingAccess?.userId;
      if (!targetUserId) {
        throw new Error("Pilih personel penerima akses terlebih dahulu.");
      }
      return unwrapResponse(
        await api.put(`/master/warehouses/access/${targetUserId}`, {
          warehouseIds: selectedWarehouseIdsForUser,
        })
      );
    },
    onSuccess: () => {
      toast.success("Hak akses gudang personel berhasil disimpan.");
      setIsAccessModalOpen(false);
      setAccessTargetUserId("");
      setEditingAccess(null);
      setSelectedWarehouseIdsForUser([]);
      queryClient.invalidateQueries({ queryKey: ["master-warehouses-users-access"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  // Handlers
  const handleOpenCreateWarehouse = () => {
    setEditingWarehouse(null);
    setWarehouseForm({
      kodeGudang: `GDG-0${warehousesList.length + 1}`,
      namaGudang: "",
      lokasi: "Kab. Sidoarjo",
      provinsi: "Jawa Timur",
      telepon: "",
      picName: "",
      tipePenyimpanan: "Suhu Ruang (Ambient)",
      totalBinLocations: 20,
      status: "ACTIVE",
      alamatLengkap: "",
    });
    setIsWarehouseModalOpen(true);
  };

  const handleOpenEditWarehouse = (item: MasterWarehouseItem) => {
    setEditingWarehouse(item);
    setWarehouseForm({
      kodeGudang: item.kodeGudang,
      namaGudang: item.namaGudang,
      lokasi: item.lokasi,
      provinsi: item.provinsi,
      telepon: item.telepon,
      picName: item.picName,
      tipePenyimpanan: item.tipePenyimpanan,
      totalBinLocations: item.totalBinLocations,
      status: item.status,
      alamatLengkap: item.alamatLengkap,
    });
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = () => {
    if (!warehouseForm.namaGudang.trim()) {
      toast.error("Nama gudang wajib diisi!");
      return;
    }
    saveWarehouseMut.mutate();
  };

  const handleDeleteWarehouse = () => {
    if (!warehouseToDelete) return;
    deleteWarehouseMut.mutate(warehouseToDelete.id);
  };

  const handleOpenCreateAccess = () => {
    setEditingAccess(null);
    setAccessTargetUserId("");
    setSelectedWarehouseIdsForUser([]);
    setIsAccessModalOpen(true);
  };

  const handleOpenEditAccess = (acc: WarehouseAccessItem) => {
    setEditingAccess(acc);
    setAccessTargetUserId(acc.userId);
    setSelectedWarehouseIdsForUser([...(acc.warehouseIds || [])]);
    setIsAccessModalOpen(true);
  };

  const handleSaveAccess = () => saveAccessMut.mutate();

  return {
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    selectedKpiFilter,
    setSelectedKpiFilter,
    selectedFilterColumn,
    setSelectedFilterColumn,
    filterColumnValue,
    setFilterColumnValue,
    sortColumn,
    sortDirection,
    handleHeaderSortToggle,
    currentPage,
    setCurrentPage,
    pageSize,
    totalEntries,
    totalPages,
    selectedRowIds,
    toggleSelectAll,
    toggleSelectRow,
    // Lists
    warehousesList,
    filteredWarehouses,
    paginatedWarehouses,
    accessList,
    filteredAccessList,
    accessUsers,
    // Loading & Error
    isLoadingWarehouses,
    isErrorWarehouses,
    warehousesError,
    refetchWarehouses,
    isLoadingAccess,
    isErrorAccess,
    accessError,
    refetchAccess,
    // Stats
    totalWarehouses,
    sidoarjoHubs,
    pasuruanHubs,
    totalBins,
    // Modals & Drawers
    isWarehouseModalOpen,
    setIsWarehouseModalOpen,
    isAccessModalOpen,
    setIsAccessModalOpen,
    editingWarehouse,
    warehouseToDelete,
    setWarehouseToDelete,
    selectedWarehouse,
    setSelectedWarehouse,
    isDetailDrawerOpen,
    setIsDetailDrawerOpen,
    editingAccess,
    setEditingAccess,
    selectedWarehouseIdsForUser,
    setSelectedWarehouseIdsForUser,
    accessTargetUserId,
    setAccessTargetUserId,
    accessSearchQuery,
    setAccessSearchQuery,
    // Forms
    warehouseForm,
    setWarehouseForm,
    // Actions
    handleOpenCreateWarehouse,
    handleOpenEditWarehouse,
    handleSaveWarehouse,
    handleDeleteWarehouse,
    handleOpenCreateAccess,
    handleOpenEditAccess,
    handleSaveAccess,
    saveWarehouseMut,
    deleteWarehouseMut,
    saveAccessMut,
  };
}
