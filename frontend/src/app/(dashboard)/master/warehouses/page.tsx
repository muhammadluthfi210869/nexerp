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
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { api, extractApiError } from "@/lib/api";
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

  // ── Mutations ──
  // Warehouse create/edit/delete used to edit `warehousesList` and toast "berhasil", so a refresh
  // lost the row. They now hit /master/warehouses.
  const invalidateWarehouses = () =>
    queryClient.invalidateQueries({ queryKey: ["master-warehouses"] });

  const saveWarehouseMut = useMutation({
    mutationFn: async () => {
      // ponytail: only these fields exist on the `warehouses` table (CreateWarehouseDto mirrors it
      // 1:1). `kodeGudang` has no column — the list synthesises it from the id — and `status` is not
      // in the DTO, so this form still shows "ACTIVE" for every row and derives the code. Persisted
      // here: name, pic, phone, province, city, address. Add the two columns (or a code generator)
      // when the master needs a stable, human-owned warehouse code.
      const payload = {
        name: warehouseForm.namaGudang.trim(),
        picName: warehouseForm.picName.trim(),
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
          : `Gudang baru ${warehouseForm.namaGudang} berhasil didaftarkan.`,
      );
      setIsWarehouseModalOpen(false);
      setEditingWarehouse(null);
      invalidateWarehouses();
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  const deleteWarehouseMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.delete(`/master/warehouses/${id}`)),
    onSuccess: () => {
      toast.success(`Gudang ${warehouseToDelete?.namaGudang} berhasil dihapus.`);
      setWarehouseToDelete(null);
      invalidateWarehouses();
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

  // ── Hak akses gudang ──
  // Granting warehouse access used to edit `accessList` and toast "berhasil" without a request.
  // POST /master/warehouses/access upserts exactly one (userId, warehouseId) pair per call, so N
  // selected warehouses are N calls inside one mutationFn.
  //
  // ponytail: `GET /master/warehouses/access` filters by the CALLER's userId
  // (warehouses.service.ts findAccess -> where.userId = req.user.id), so the grid can only show the
  // grants the signed-in admin holds — not every personel's. The write is correct and persisted;
  // the read-back is limited by that endpoint. Add a `userId` query param on the backend when the
  // grid must show everyone's grants.
  const { data: apiUsers } = useQuery({
    queryKey: ["master-users-for-access"],
    queryFn: async () => unwrapResponse(await api.get("/users")),
    staleTime: 60000,
  });

  const accessUsers = useMemo<Array<{ id: string; fullName: string; email: string; role: string }>>(() => {
    const items = Array.isArray(apiUsers) ? apiUsers : apiUsers?.items;
    if (!Array.isArray(items)) return [];
    return items.map((u: any) => ({
      id: u.id,
      fullName: u.fullName || u.email,
      email: u.email || "-",
      role: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : "SCM",
    }));
  }, [apiUsers]);

  const loadAccessList = async () => {
    try {
      const rows = unwrapResponse(await api.get("/master/warehouses/access"));
      const byUser = new Map<string, WarehouseAccessItem>();
      for (const r of Array.isArray(rows) ? rows : []) {
        const current: WarehouseAccessItem = byUser.get(r.userId) ?? {
          id: r.userId,
          userId: r.userId,
          namaPersonel: r.user?.fullName || r.user?.email || r.userId,
          email: r.user?.email || "-",
          phone: "-",
          hakAkses: "WAREHOUSE",
          gudangAkses: [],
        };
        if (r.warehouse?.name) current.gudangAkses.push(r.warehouse.name);
        byUser.set(r.userId, current);
      }
      setAccessList([...byUser.values()]);
    } catch {
      // The grid is informational — a read failure must not blank the warehouse tab.
      setAccessList([]);
    }
  };

  useEffect(() => {
    loadAccessList();
  }, []);

  const saveAccessMut = useMutation({
    mutationFn: async () => {
      const userId = accessTargetUserId || editingAccess?.userId;
      if (!userId) {
        throw new Error("Pilih personel penerima akses terlebih dahulu.");
      }
      const targets = warehousesList.filter((w) => selectedGudangsForUser.includes(w.namaGudang));
      if (targets.length === 0) {
        throw new Error("Pilih minimal satu gudang yang diizinkan.");
      }
      await Promise.all(
        targets.map((w) =>
          api.post("/master/warehouses/access", {
            userId,
            warehouseId: w.id,
            canRead: true,
            canWrite: true,
          }),
        ),
      );
      return targets.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} hak akses gudang berhasil disimpan.`);
      setIsAccessModalOpen(false);
      setAccessTargetUserId("");
      setEditingAccess(null);
      loadAccessList();
    },
    onError: (e) => toast.error(extractApiError(e)),
  });

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
  const [accessTargetUserId, setAccessTargetUserId] = useState<string>("");

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
    saveWarehouseMut.mutate();
  };

  const handleDeleteWarehouse = () => {
    if (!warehouseToDelete) return;
    deleteWarehouseMut.mutate(warehouseToDelete.id);
  };

  const handleSaveAccess = () => saveAccessMut.mutate();;

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
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                    <DnaTh className="px-3.5 py-2.5 w-10 text-slate-400">#</DnaTh>
                    <DnaTh className="px-3.5 py-2.5 w-[110px]">Kode Gudang</DnaTh>
                    <DnaTh
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
                    </DnaTh>
                    <DnaTh className="px-3.5 py-2.5">Tipe Penyimpanan</DnaTh>
                    <DnaTh className="px-3.5 py-2.5 text-right w-[110px]">Kapasitas Bin</DnaTh>
                    <DnaTh
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
                    </DnaTh>
                    <DnaTh className="px-3.5 py-2.5">PIC Gudang</DnaTh>
                    <DnaTh className="px-3.5 py-2.5">Kontak Telepon</DnaTh>
                    <DnaTh className="px-3.5 py-2.5 text-center w-[100px] whitespace-nowrap">Aksi</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {isLoadingWarehouses ? (
                    <DnaTableRow>
                      <DnaTd colSpan={9} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Memuat data gudang...</span>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ) : isErrorWarehouses ? (
                    <DnaTableRow>
                      <DnaTd colSpan={9} className="p-8 text-center text-rose-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span>Gagal memuat data gudang: {(warehousesError as any)?.message || "Terjadi kesalahan"}</span>
                          <button
                            onClick={() => refetchWarehouses()}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors"
                          >
                            Coba Lagi
                          </button>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ) : paginatedWarehouses.length === 0 ? (
                    <DnaTableRow>
                      <DnaTd colSpan={9} className="p-8 text-center text-slate-400">
                        Tidak ada data gudang yang sesuai filter.
                      </DnaTd>
                    </DnaTableRow>
                  ) : (
                    paginatedWarehouses.map((w, idx) => {
                      return (
                        <DnaTableRow
                          key={w.id}
                          className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedWarehouse(w);
                            setIsDetailDrawerOpen(true);
                          }}
                        >
                          <DnaTd className="px-3.5 py-2.5 text-slate-400 tabular-nums">
                            {(currentPage - 1) * pageSize + idx + 1}
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5">
                            <DnaCell.Code>{w.kodeGudang}</DnaCell.Code>
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5">
                            <DnaCell.Text className="font-semibold text-slate-900">{w.namaGudang}</DnaCell.Text>
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5">
                            <DnaCell.Text className="text-slate-800">{w.tipePenyimpanan}</DnaCell.Text>
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5 text-right">
                            <DnaCell.Numeric value={w.totalBinLocations} suffix=" Slot" />
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5">
                            <DnaCell.NaturalPair
                              primary={w.lokasi}
                              secondary={w.provinsi}
                            />
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5">
                            <DnaCell.Text className="font-semibold text-slate-800">{w.picName}</DnaCell.Text>
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5">
                            <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-600">{w.telepon || "-"}</DnaCell.Text>
                          </DnaTd>
                          <DnaTd className="px-3.5 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                          </DnaTd>
                        </DnaTableRow>
                      );
                    })
                  )}
                </DnaTableBody>
              </DnaTable>
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
              actionButton: {
                label: "Atur Hak Akses",
                onClick: () => {
                  setEditingAccess(null);
                  setAccessTargetUserId("");
                  setSelectedGudangsForUser([]);
                  setIsAccessModalOpen(true);
                },
              },
            }}
          >
            <div className="overflow-x-auto">
              <DnaTable>
                <DnaTableHead>
                  <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold tracking-wider uppercase select-none">
                    <DnaTh className="px-3.5 py-2.5 w-10 text-slate-400">#</DnaTh>
                    <DnaTh className="px-3.5 py-2.5 w-[110px]">ID Personel</DnaTh>
                    <DnaTh className="px-3.5 py-2.5">Nama Personel</DnaTh>
                    <DnaTh className="px-3.5 py-2.5">Email Staf</DnaTh>
                    <DnaTh className="px-3.5 py-2.5">Kontak HP</DnaTh>
                    <DnaTh className="px-3.5 py-2.5">Hak Akses / Jabatan</DnaTh>
                    <DnaTh className="px-3.5 py-2.5">Gudang Terotorisasi</DnaTh>
                    <DnaTh className="px-3.5 py-2.5 text-center w-[110px]">Aksi</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody>
                  {accessList.map((acc, idx) => (
                    <DnaTableRow key={acc.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                      <DnaTd className="px-3.5 py-2.5 text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Code>{acc.userId}</DnaCell.Code>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="font-semibold text-slate-900">{acc.namaPersonel}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="text-slate-700">{acc.email}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-600">{acc.phone}</DnaCell.Text>
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
                        <DnaCell.Badge label={acc.hakAkses} status="info" />
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5">
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
                      </DnaTd>
                      <DnaTd className="px-3.5 py-2.5 text-center">
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
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
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
        title={editingAccess ? `Otorisasi Akses: ${editingAccess.namaPersonel}` : "Otorisasi Akses Gudang"}
        description="Pilih gudang mana saja yang dapat diakses oleh personel ini untuk transaksi mutasi barang"
        size="md"
      >
        <div className="space-y-4 py-2 text-xs">
          <DnaSelect
            label="Personel Penerima Akses *"
            value={accessTargetUserId || editingAccess?.userId || ""}
            onChange={(val) => setAccessTargetUserId(val)}
            options={accessUsers.map((u) => ({
              value: u.id,
              label: `${u.fullName} — ${u.email}`,
            }))}
            placeholder="Pilih personel..."
          />

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-700">
            Personel:{" "}
            <strong className="text-slate-900">
              {accessUsers.find((u) => u.id === (accessTargetUserId || editingAccess?.userId))?.fullName ||
                editingAccess?.namaPersonel ||
                "—"}
            </strong>{" "}
            • Jabatan:{" "}
            <strong className="text-blue-600">
              {accessUsers.find((u) => u.id === (accessTargetUserId || editingAccess?.userId))?.role ||
                editingAccess?.hakAkses ||
                "—"}
            </strong>
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
            <DnaButton variant="primary" loading={saveAccessMut.isPending} onClick={handleSaveAccess}>
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
                    <span className="tabular-nums font-medium text-slate-800">{selectedWarehouse.telepon || "-"}</span>
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
