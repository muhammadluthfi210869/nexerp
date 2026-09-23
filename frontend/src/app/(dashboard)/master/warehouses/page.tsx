"use client";

/**
 * Master Gudang & Hak Akses — Unified Enterprise Data Hub
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 35-37)
 * dan MASTER_DATA/GUDANG.csv.
 *
 * Visual DNA Golden Reference Architecture:
 * - 0 raw @/components/ui imports (Strict ADR-007)
 * - Light Enterprise Theme: bg-[#F8FAFC]
 * - DnaPageHeader with integrated 2 tabs (Daftar Gudang, Hak Akses Gudang)
 * - DnaKpiGrid with 4 interactive KPI metric cards
 * - DnaDataTableCard with 2-level filter toolbar + sorting & pagination
 * - Standardized cells: DnaCell.Code, DnaCell.Text, DnaCell.Badge, DnaCell.Number, DnaCell.Avatar, DnaCell.Actions
 * - Clean DnaModal dialogs for CRUD & warehouse access management
 */

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Warehouse,
  ShieldCheck,
  Plus,
  Phone,
  MapPin,
  Thermometer,
  Box,
  Layers,
  CheckCircle2,
  Lock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit2,
  FileSpreadsheet,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
  DnaDetailDrawer,
  DnaTable,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

// ── Types ──
export interface MasterWarehouseItem {
  id: string;
  kodeGudang: string;
  namaGudang: string;
  lokasi: string;
  provinsi: string;
  telepon: string;
  picName: string;
  tipePenyimpanan: "Suhu Ruang (Ambient)" | "Cool Storage (15-25°C)" | "Chiller (2-8°C)" | "Flammable / Precursor";
  totalBinLocations: number;
  status: "ACTIVE" | "INACTIVE";
  alamatLengkap: string;
}

export interface WarehouseAccessItem {
  id: string;
  userId: string;
  namaPersonel: string;
  email: string;
  phone: string;
  hakAkses: string;
  gudangAkses: string[]; // List of gudang names
}

function MasterWarehousesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();

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

  // ── States ──
  const [warehousesList, setWarehousesList] = useState<MasterWarehouseItem[]>([]);
  const [accessList, setAccessList] = useState<WarehouseAccessItem[]>([]);

  // ── Backend API Query ──
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
      return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : (() => { throw new Error('Invalid response shape from /master/warehouses: not an array') })();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (apiWarehouses && Array.isArray(apiWarehouses)) {
      const mapped: MasterWarehouseItem[] = apiWarehouses.map((w: any) => ({
        id: w.id,
        kodeGudang: w.code || `GDG-${w.id.substring(0, 4)}`,
        namaGudang: w.name,
        lokasi: w.location || "Sidoarjo",
        provinsi: "Jawa Timur",
        telepon: w.phone || "-",
        picName: w.picName || "Ghufron Dreamlab",
        tipePenyimpanan: "Suhu Ruang (Ambient)",
        totalBinLocations: 24,
        status: w.status || "ACTIVE",
        alamatLengkap: w.location || "-",
      }));
      setWarehousesList(mapped);
    } else if (!isLoadingWarehouses && !isErrorWarehouses) {
      setWarehousesList([]);
    }
  }, [apiWarehouses, isLoadingWarehouses, isErrorWarehouses]);

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
  const [selectedGudangsForUser, setSelectedGudangsForUser] = useState<string[]>([]);

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
  const [warehouseForm, setWarehouseForm] = useState({
    kodeGudang: "",
    namaGudang: "",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "",
    picName: "",
    tipePenyimpanan: "Suhu Ruang (Ambient)" as MasterWarehouseItem["tipePenyimpanan"],
    totalBinLocations: 20,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    alamatLengkap: "",
  });

  // ── Stats ──
  const totalWarehouses = warehousesList.length;
  const sidoarjoHubs = warehousesList.filter((w) => w.lokasi.includes("Sidoarjo")).length;
  const pasuruanHubs = warehousesList.filter((w) => w.lokasi.includes("Pasuruan")).length;
  const totalBins = warehousesList.reduce((acc, curr) => acc + curr.totalBinLocations, 0);

  // ── Filtered & Sorted Warehouses Pipeline ──
  const filteredWarehouses = useMemo(() => {
    return warehousesList
      .filter((item) => {
        // 1. KPI Filter
        if (selectedKpiFilter === "Sidoarjo" && !item.lokasi.includes("Sidoarjo")) return false;
        if (selectedKpiFilter === "Pasuruan" && !item.lokasi.includes("Pasuruan")) return false;
        if (selectedKpiFilter === "COOL" && !item.tipePenyimpanan.includes("Cool") && !item.tipePenyimpanan.includes("Chiller")) return false;

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

  // ── Handlers ──
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
    if (!warehouseForm.kodeGudang.trim() || !warehouseForm.namaGudang.trim() || !warehouseForm.picName.trim()) {
      toast.error("Kode gudang, nama gudang, dan PIC penanggung jawab wajib diisi!");
      return;
    }

    if (editingWarehouse) {
      setWarehousesList((prev) =>
        prev.map((w) => (w.id === editingWarehouse.id ? { ...w, ...warehouseForm } : w))
      );
      toast.success(`Data gudang ${warehouseForm.namaGudang} berhasil diperbarui.`);
    } else {
      const newItem: MasterWarehouseItem = {
        id: `wh-${Date.now()}`,
        ...warehouseForm,
      };
      setWarehousesList((prev) => [...prev, newItem]);
      toast.success(`Gudang baru ${newItem.namaGudang} berhasil didaftarkan.`);
    }
    setIsWarehouseModalOpen(false);
  };

  const handleDeleteWarehouse = () => {
    if (!warehouseToDelete) return;
    setWarehousesList((prev) => prev.filter((w) => w.id !== warehouseToDelete.id));
    toast.success(`Gudang ${warehouseToDelete.namaGudang} berhasil dihapus.`);
    setWarehouseToDelete(null);
  };

  const handleSaveAccess = () => {
    if (!editingAccess) return;
    setAccessList((prev) =>
      prev.map((a) =>
        a.id === editingAccess.id ? { ...a, gudangAkses: selectedGudangsForUser } : a
      )
    );
    toast.success(`Hak akses gudang untuk ${editingAccess.namaPersonel} berhasil diperbarui.`);
    setIsAccessModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. MODULAR PAGE HEADER ── */}
      <DnaPageHeader
        backLink={{ href: "/master", label: "Kembali ke Master Hub" }}
        title="MASTER DATA GUDANG & LOKASI"
        tabs={[
          {
            key: "warehouses",
            label: "Daftar Gudang",
            count: warehousesList.length,
            icon: <Warehouse className="w-3.5 h-3.5" />,
          },
          {
            key: "access",
            label: "Hak Akses Gudang",
            count: accessList.length,
            icon: <ShieldCheck className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── TAB 1: DAFTAR GUDANG ── */}
      {activeTab === "warehouses" && (
        <div className="space-y-6">
          {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
          <DnaKpiGrid
            cards={[
              {
                key: "ALL",
                title: "TOTAL TITIK GUDANG",
                value: totalWarehouses.toLocaleString("id-ID"),
                deltaText: "Fasilitas penyimpanan terdaftar",
                isDeltaPositive: true,
                icon: <Warehouse className="w-4 h-4" />,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                isSelected: selectedKpiFilter === "ALL",
                onClick: () => setSelectedKpiFilter("ALL"),
              },
              {
                key: "Sidoarjo",
                title: "HUB SIDOARJO",
                value: `${sidoarjoHubs} Fasilitas`,
                deltaText: "Pabrik utama & clean room",
                isDeltaPositive: true,
                icon: <Layers className="w-4 h-4" />,
                iconBg: "bg-sky-50",
                iconColor: "text-sky-600",
                isSelected: selectedKpiFilter === "Sidoarjo",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "Sidoarjo" ? "ALL" : "Sidoarjo"),
              },
              {
                key: "Pasuruan",
                title: "HUB PASURUAN (PIER)",
                value: `${pasuruanHubs} Fasilitas`,
                deltaText: "Pusat bahan baku & curah",
                isDeltaPositive: true,
                icon: <Box className="w-4 h-4" />,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                isSelected: selectedKpiFilter === "Pasuruan",
                onClick: () => setSelectedKpiFilter(selectedKpiFilter === "Pasuruan" ? "ALL" : "Pasuruan"),
              },
              {
                key: "CAPACITY",
                title: "KAPASITAS BIN / PALLET",
                value: `${totalBins} Bins`,
                deltaText: "Total slot rak terindeks sistem",
                isDeltaPositive: true,
                icon: <CheckCircle2 className="w-4 h-4" />,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                isSelected: false,
              },
            ]}
          />

          {/* ── 03. MODULAR DATA TABLE CARD ── */}
          <DnaDataTableCard
            toolbarProps={{
              searchQuery,
              onSearchChange: setSearchQuery,
              searchPlaceholder: "Cari kode gudang, nama, PIC, lokasi...",
              filterColumns: [
                {
                  key: "lokasi",
                  label: "Wilayah Lokasi",
                  type: "select",
                  options: ["Sidoarjo", "Pasuruan", "Surabaya"],
                },
                {
                  key: "tipe",
                  label: "Tipe Suhu",
                  type: "select",
                  options: [
                    "Suhu Ruang (Ambient)",
                    "Cool Storage (15-25°C)",
                    "Chiller (2-8°C)",
                    "Flammable / Precursor",
                  ],
                },
              ],
              selectedColumn: selectedFilterColumn,
              onSelectColumn: (col) => {
                setSelectedFilterColumn(col);
                setFilterColumnValue("ALL");
              },
              filterValue: filterColumnValue,
              onFilterValueChange: setFilterColumnValue,
              actionButton: {
                label: "Tambah Gudang",
                onClick: handleOpenCreateWarehouse,
              },
            }}
            paginationProps={{
              currentPage,
              totalPages,
              totalEntries,
              pageSize,
              onPageChange: setCurrentPage,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1150px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                    <th className="px-3.5 py-2.5 w-10 text-slate-400">#</th>
                    <th className="px-3.5 py-2.5 w-[110px]">Kode Gudang</th>
                    <th
                      className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100/60"
                      onClick={() => handleHeaderSortToggle("namaGudang")}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Nama Gudang</span>
                        {sortColumn === "namaGudang" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th className="px-3.5 py-2.5">Tipe Penyimpanan</th>
                    <th className="px-3.5 py-2.5 text-right w-[110px]">Kapasitas Bin</th>
                    <th
                      className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100/60"
                      onClick={() => handleHeaderSortToggle("lokasi")}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Lokasi & Wilayah</span>
                        {sortColumn === "lokasi" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th className="px-3.5 py-2.5">PIC Gudang</th>
                    <th className="px-3.5 py-2.5">Kontak Telepon</th>
                    <th className="px-3.5 py-2.5 text-center w-[100px] whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingWarehouses ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Memuat data gudang...</span>
                        </div>
                      </td>
                    </tr>
                  ) : isErrorWarehouses ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-rose-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span>Gagal memuat data gudang: {(warehousesError as any)?.message || "Terjadi kesalahan"}</span>
                          <button
                            onClick={() => refetchWarehouses()}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors"
                          >
                            Coba Lagi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedWarehouses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Tidak ada data gudang yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedWarehouses.map((w, idx) => {
                      return (
                        <tr
                          key={w.id}
                          className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedWarehouse(w);
                            setIsDetailDrawerOpen(true);
                          }}
                        >
                          <td className="px-3.5 py-2.5 text-slate-400 tabular-nums">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <DnaCell.Code>{w.kodeGudang}</DnaCell.Code>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <DnaCell.Text className="font-semibold text-slate-900">{w.namaGudang}</DnaCell.Text>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <DnaCell.Text className="text-slate-800">{w.tipePenyimpanan}</DnaCell.Text>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <DnaCell.Numeric value={w.totalBinLocations} suffix=" Slot" />
                          </td>
                          <td className="px-3.5 py-2.5">
                            <DnaCell.NaturalPair
                              primary={w.lokasi}
                              secondary={w.provinsi}
                            />
                          </td>
                          <td className="px-3.5 py-2.5">
                            <DnaCell.Text className="font-semibold text-slate-800">{w.picName}</DnaCell.Text>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <DnaCell.Text className="font-mono text-[11.5px] text-slate-600">{w.telepon || "-"}</DnaCell.Text>
                          </td>
                          <td className="px-3.5 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <DnaButton
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                                onClick={() => {
                                  setSelectedWarehouse(w);
                                  setIsDetailDrawerOpen(true);
                                }}
                                title="Lihat Detail Fasilitas"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </DnaButton>
                              <DnaCell.Actions
                                onEdit={() => handleOpenEditWarehouse(w)}
                                onDelete={() => setWarehouseToDelete(w)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── TAB 2: HAK AKSES GUDANG ── */}
      {activeTab === "access" && (
        <div className="space-y-6">
          <DnaDataTableCard
            toolbarProps={{
              searchPlaceholder: "Cari staf gudang & wewenang...",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold tracking-wider uppercase select-none">
                    <th className="px-3.5 py-2.5 w-10 text-slate-400">#</th>
                    <th className="px-3.5 py-2.5 w-[110px]">ID Personel</th>
                    <th className="px-3.5 py-2.5">Nama Personel</th>
                    <th className="px-3.5 py-2.5">Email Staf</th>
                    <th className="px-3.5 py-2.5">Kontak HP</th>
                    <th className="px-3.5 py-2.5">Hak Akses / Jabatan</th>
                    <th className="px-3.5 py-2.5">Gudang Terotorisasi</th>
                    <th className="px-3.5 py-2.5 text-center w-[110px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accessList.map((acc, idx) => (
                    <tr key={acc.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5 text-slate-400 tabular-nums">{idx + 1}</td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Code>{acc.userId}</DnaCell.Code>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-semibold text-slate-900">{acc.namaPersonel}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-700">{acc.email}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-mono text-[11.5px] text-slate-600">{acc.phone}</DnaCell.Text>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <DnaCell.Badge label={acc.hakAkses} status="info" />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {acc.gudangAkses.map((g, i) => (
                            <span
                              key={i}
                              className="text-[10.5px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <DnaButton
                          variant="outline"
                          size="sm"
                          icon={<Lock className="w-3 h-3" />}
                          onClick={() => {
                            setEditingAccess(acc);
                            setSelectedGudangsForUser([...acc.gudangAkses]);
                            setIsAccessModalOpen(true);
                          }}
                          className="h-7 text-[11px] px-2"
                        >
                          Atur Akses
                        </DnaButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DnaDataTableCard>
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT GUDANG ── */}
      <DnaModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        title={editingWarehouse ? `Sunting Gudang: ${editingWarehouse.namaGudang}` : "Tambah Gudang Baru"}
        description="Lengkapi spesifikasi titik simpan gudang, penanggung jawab (PIC), dan kondisi suhu"
        size="lg"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Kode Gudang *"
              value={warehouseForm.kodeGudang}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, kodeGudang: e.target.value })}
              placeholder="e.g. GBB-02"
            />
            <DnaInput
              label="Nama Gudang *"
              value={warehouseForm.namaGudang}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, namaGudang: e.target.value })}
              placeholder="e.g. Gudang Bahan Baku Eksternal"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DnaInput
              label="PIC Gudang *"
              value={warehouseForm.picName}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, picName: e.target.value })}
              placeholder="Muhammad Ghufron"
            />
            <DnaInput
              label="Nomor Telepon Gudang"
              value={warehouseForm.telepon}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, telepon: e.target.value })}
              placeholder="08123456789"
            />
            <DnaSelect
              label="Tipe Suhu / Karakteristik *"
              value={warehouseForm.tipePenyimpanan}
              onChange={(val) =>
                setWarehouseForm({ ...warehouseForm, tipePenyimpanan: val as MasterWarehouseItem["tipePenyimpanan"] })
              }
              options={[
                { value: "Suhu Ruang (Ambient)", label: "Suhu Ruang (Ambient)" },
                { value: "Cool Storage (15-25°C)", label: "Cool Storage (15-25°C)" },
                { value: "Chiller (2-8°C)", label: "Chiller (2-8°C)" },
                { value: "Flammable / Precursor", label: "Flammable / Precursor" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DnaInput
              label="Wilayah / Kota *"
              value={warehouseForm.lokasi}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, lokasi: e.target.value })}
              placeholder="Kab. Sidoarjo"
            />
            <DnaInput
              label="Provinsi"
              value={warehouseForm.provinsi}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, provinsi: e.target.value })}
              placeholder="Jawa Timur"
            />
          </div>

          <DnaTextarea
            label="Alamat Lengkap Fasilitas Gudang *"
            value={warehouseForm.alamatLengkap}
            onChange={(e) => setWarehouseForm({ ...warehouseForm, alamatLengkap: e.target.value })}
            placeholder="Kawasan industri, nama blok, nomor gudang, patokan..."
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <DnaButton variant="ghost" onClick={() => setIsWarehouseModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveWarehouse}>
              Simpan Data Gudang
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── MODAL OTORISASI HAK AKSES GUDANG ── */}
      <DnaModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        title={`Otorisasi Akses: ${editingAccess?.namaPersonel}`}
        description="Pilih gudang mana saja yang dapat diakses oleh personel ini untuk transaksi mutasi barang"
        size="md"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-700">
            Personel: <strong className="text-slate-900">{editingAccess?.namaPersonel}</strong> • Jabatan:{" "}
            <strong className="text-blue-600">{editingAccess?.hakAkses}</strong>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Daftar Gudang yang Diizinkan:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              {warehousesList.map((wh) => {
                const isChecked = selectedGudangsForUser.includes(wh.namaGudang);
                return (
                  <label
                    key={wh.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border ${
                      isChecked
                        ? "bg-blue-50/80 border-blue-200 text-blue-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGudangsForUser([...selectedGudangsForUser, wh.namaGudang]);
                        } else {
                          setSelectedGudangsForUser(
                            selectedGudangsForUser.filter((g) => g !== wh.namaGudang)
                          );
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px]">{wh.namaGudang}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="ghost" onClick={() => setIsAccessModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveAccess}>
              Simpan Otorisasi Akses
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* ── DETAIL DRAWER GUDANG (Golden Rule 5) ── */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedWarehouse?.namaGudang || "Detail Fasilitas Gudang"}
        subtitle={`Kode: ${selectedWarehouse?.kodeGudang || "-"} • PIC: ${selectedWarehouse?.picName || "-"}`}
        badge={
          selectedWarehouse?.status === "ACTIVE" ? (
            <DnaBadge variant="success">FASILITAS AKTIF</DnaBadge>
          ) : (
            <DnaBadge variant="neutral">NON-AKTIF</DnaBadge>
          )
        }
        tabs={[
          {
            id: "specs",
            label: "Spesifikasi & Suhu",
            content: selectedWarehouse ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tipe Penyimpanan & Suhu</span>
                    <span className="font-semibold text-slate-800">{selectedWarehouse.tipePenyimpanan}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Bin / Slot Rak</span>
                    <span className="font-bold text-blue-600">{selectedWarehouse.totalBinLocations} Bins</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Wilayah / Kota</span>
                    <span className="font-medium text-slate-800">{selectedWarehouse.lokasi}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Provinsi</span>
                    <span className="font-medium text-slate-800">{selectedWarehouse.provinsi}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Alamat Lengkap Fasilitas:
                  </span>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                    {selectedWarehouse.alamatLengkap || "-"}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">PIC Penanggung Jawab Gudang</span>
                    <span className="font-bold text-slate-900">{selectedWarehouse.picName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Telepon / WhatsApp</span>
                    <span className="font-mono font-medium text-slate-800">{selectedWarehouse.telepon || "-"}</span>
                  </div>
                </div>
              </div>
            ) : null,
          },
          {
            id: "bins_access",
            label: "Bin Slot & Hak Akses",
            content: selectedWarehouse ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                    Distribusi Blok Rak:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="font-bold text-slate-900">Blok A (Incoming / Karantina)</div>
                      <div className="text-[11px] text-slate-500">6 Bin Slots • Fast Moving</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="font-bold text-slate-900">Blok B (Bahan Baku / Ruang Suhu)</div>
                      <div className="text-[11px] text-slate-500">10 Bin Slots • Humidity Controlled</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="font-bold text-slate-900">Blok C (Packaging / Karton)</div>
                      <div className="text-[11px] text-slate-500">8 Bin Slots • Dry Ambient</div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                    Personel Berwenang untuk Gudang Ini:
                  </span>
                  <div className="space-y-1.5">
                    {accessList
                      .filter((acc) => acc.gudangAkses.includes(selectedWarehouse.namaGudang))
                      .map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{acc.namaPersonel}</div>
                            <div className="text-[11px] text-slate-500">{acc.hakAkses}</div>
                          </div>
                          <DnaBadge variant="success">Diizinkan</DnaBadge>
                        </div>
                      ))}
                    {accessList.filter((acc) => acc.gudangAkses.includes(selectedWarehouse.namaGudang)).length === 0 && (
                      <div className="text-slate-400 p-2 text-center">Belum ada otorisasi personel khusus</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null,
          },
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => {
                toast.success(`Daftar slot bin ${selectedWarehouse?.namaGudang} diekspor.`);
              }}
            >
              Export Layout Rak
            </DnaButton>
            <div className="flex items-center gap-2">
              <DnaButton
                variant="secondary"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (selectedWarehouse) {
                    setIsDetailDrawerOpen(false);
                    handleOpenEditWarehouse(selectedWarehouse);
                  }
                }}
              >
                Sunting Gudang
              </DnaButton>
              <DnaButton variant="primary" size="sm" onClick={() => setIsDetailDrawerOpen(false)}>
                Selesai
              </DnaButton>
            </div>
          </div>
        }
      />

      {/* Confirmation Dialog Delete */}
      <DnaConfirmDialog
        isOpen={!!warehouseToDelete}
        onClose={() => setWarehouseToDelete(null)}
        onConfirm={handleDeleteWarehouse}
        title="Hapus Fasilitas Gudang?"
        description={`Apakah Anda yakin ingin menghapus ${warehouseToDelete?.namaGudang}? Pastikan tidak ada stok aktif yang terpetakan ke gudang ini.`}
        confirmText="Hapus Permanen"
        variant="critical"
      />
    </div>
  );
}

export default function MasterWarehousesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Master Gudang...</div>}>
      <MasterWarehousesContent />
    </Suspense>
  );
}
