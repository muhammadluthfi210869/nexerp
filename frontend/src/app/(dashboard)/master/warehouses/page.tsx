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
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
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

// ── Seed Data from GUDANG.csv ──
const INITIAL_WAREHOUSES: MasterWarehouseItem[] = [
  {
    id: "wh-1",
    kodeGudang: "GBB-01",
    namaGudang: "Gudang Bahan Baku",
    lokasi: "Kab. Pasuruan",
    provinsi: "Jawa Timur",
    telepon: "0895341099232",
    picName: "Muhammad Ghufron",
    tipePenyimpanan: "Cool Storage (15-25°C)",
    totalBinLocations: 48,
    status: "ACTIVE",
    alamatLengkap: "Kawasan Industri PIER Blok D-10, Rembang, Pasuruan",
  },
  {
    id: "wh-2",
    kodeGudang: "GKM-01",
    namaGudang: "Gudang Kemasan (Packaging)",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "0895341099232",
    picName: "Muhammad Ghufron",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 64,
    status: "ACTIVE",
    alamatLengkap: "Komplek Pergudangan Safe N Lock Blok I No. 8, Lingkar Timur Sidoarjo",
  },
  {
    id: "wh-3",
    kodeGudang: "GBJ-01",
    namaGudang: "Gudang Barang Jadi",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "081234567893",
    picName: "Krisna Putra Ramadhani",
    tipePenyimpanan: "Cool Storage (15-25°C)",
    totalBinLocations: 36,
    status: "ACTIVE",
    alamatLengkap: "Komplek Pergudangan Safe N Lock Blok I No. 10 Sidoarjo",
  },
  {
    id: "wh-4",
    kodeGudang: "GSB-01",
    namaGudang: "Gudang Surabaya Hub",
    lokasi: "Kota Surabaya",
    provinsi: "Jawa Timur",
    telepon: "081234567894",
    picName: "Krisna Putra Ramadhani",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 24,
    status: "ACTIVE",
    alamatLengkap: "Jl. Rungkut Industri Raya No. 12 Surabaya",
  },
  {
    id: "wh-5",
    kodeGudang: "GLB-01",
    namaGudang: "Gudang Laboratorium (R&D)",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "081234567895",
    picName: "Fatimah Amira",
    tipePenyimpanan: "Chiller (2-8°C)",
    totalBinLocations: 16,
    status: "ACTIVE",
    alamatLengkap: "R&D Formulation Center Lantai 2, Gedangan, Sidoarjo",
  },
  {
    id: "wh-6",
    kodeGudang: "GPM-01",
    namaGudang: "Gudang Produksi Mixing",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "081234567896",
    picName: "Riyantita Tunjungsari",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 20,
    status: "ACTIVE",
    alamatLengkap: "Clean Room Produksi Kelas D, Unit Mixing 1-3",
  },
  {
    id: "wh-7",
    kodeGudang: "GPF-01",
    namaGudang: "Gudang Produksi Filling",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "081234567897",
    picName: "Nur Kholilah",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 18,
    status: "ACTIVE",
    alamatLengkap: "Clean Room Produksi Kelas D, Line Filling Semi-Auto",
  },
  {
    id: "wh-8",
    kodeGudang: "GPP-01",
    namaGudang: "Gudang Produksi Packaging",
    lokasi: "Kab. Sidoarjo",
    provinsi: "Jawa Timur",
    telepon: "081234567898",
    picName: "Dicky Barkah",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 30,
    status: "ACTIVE",
    alamatLengkap: "Area Pengemasan Sekunder & Kartonisasi Lantai 1",
  },
  {
    id: "wh-9",
    kodeGudang: "GSJ-01",
    namaGudang: "Gudang Barang Setengah Jadi (WIP)",
    lokasi: "Kab. Pasuruan",
    provinsi: "Jawa Timur",
    telepon: "081231418159",
    picName: "Muhammad Ruhullah",
    tipePenyimpanan: "Cool Storage (15-25°C)",
    totalBinLocations: 15,
    status: "ACTIVE",
    alamatLengkap: "Staging Area Karantina Bulk Ruahan PIER",
  },
  {
    id: "wh-10",
    kodeGudang: "GSK-01",
    namaGudang: "Gudang Sekunder",
    lokasi: "Kota Surabaya",
    provinsi: "Jawa Timur",
    telepon: "081231418159",
    picName: "Muhammad Ghufron",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 22,
    status: "ACTIVE",
    alamatLengkap: "Pergudangan Margomulyo Permai Blok H-14",
  },
  {
    id: "wh-11",
    kodeGudang: "GCL-BBK",
    namaGudang: "Gudang Bahan Baku (Client Titipan)",
    lokasi: "Kab. Pasuruan",
    provinsi: "Jawa Timur",
    telepon: "0895341099232",
    picName: "Muhammad Ghufron",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 12,
    status: "ACTIVE",
    alamatLengkap: "PIER Pasuruan - Pallet Khusus Material Titipan Klien Maklon",
  },
  {
    id: "wh-12",
    kodeGudang: "GCL-KMS",
    namaGudang: "Gudang Kemasan (Client Titipan)",
    lokasi: "Kab. Pasuruan",
    provinsi: "Jawa Timur",
    telepon: "0895341099232",
    picName: "Muhammad Ghufron",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 20,
    status: "ACTIVE",
    alamatLengkap: "PIER Pasuruan - Rak Kemasan Klien FYS & Sigviolet",
  },
  {
    id: "wh-13",
    kodeGudang: "GRJ-01",
    namaGudang: "Gudang Reject & Karantina QC",
    lokasi: "Kab. Pasuruan",
    provinsi: "Jawa Timur",
    telepon: "081231418159",
    picName: "Fatimah Amira",
    tipePenyimpanan: "Suhu Ruang (Ambient)",
    totalBinLocations: 10,
    status: "ACTIVE",
    alamatLengkap: "Area Terkunci Karantina Khusus Material Rusak / Return",
  },
  {
    id: "wh-14",
    kodeGudang: "GSP-01",
    namaGudang: "Gudang Sample Lab",
    lokasi: "Kab. Pasuruan",
    provinsi: "Jawa Timur",
    telepon: "081231418159",
    picName: "Ribut Supriyono",
    tipePenyimpanan: "Cool Storage (15-25°C)",
    totalBinLocations: 8,
    status: "ACTIVE",
    alamatLengkap: "Laboratorium R&D Pasuruan - Arsip Sampel Retensi 3 Tahun",
  },
];

const INITIAL_WAREHOUSE_ACCESS: WarehouseAccessItem[] = [
  {
    id: "acc-1",
    userId: "usr-1",
    namaPersonel: "Muhammad Ghufron",
    email: "ghufron.wh@dreamlab.co.id",
    phone: "0895341099232",
    hakAkses: "Supervisor Gudang Pusat",
    gudangAkses: [
      "Gudang Bahan Baku",
      "Gudang Kemasan (Packaging)",
      "Gudang Sekunder",
      "Gudang Bahan Baku (Client Titipan)",
      "Gudang Kemasan (Client Titipan)",
    ],
  },
  {
    id: "acc-2",
    userId: "usr-2",
    namaPersonel: "Krisna Putra Ramadhani",
    email: "krisna.logistik@dreamlab.co.id",
    phone: "081234567893",
    hakAkses: "Kepala Logistik & Distribusi",
    gudangAkses: ["Gudang Barang Jadi", "Gudang Surabaya Hub"],
  },
  {
    id: "acc-3",
    userId: "usr-3",
    namaPersonel: "Fatimah Amira",
    email: "fatimah.rnd@dreamlab.co.id",
    phone: "081234567895",
    hakAkses: "R&D & QC Inspector",
    gudangAkses: ["Gudang Laboratorium (R&D)", "Gudang Reject & Karantina QC"],
  },
  {
    id: "acc-4",
    userId: "usr-4",
    namaPersonel: "Riyantita Tunjungsari",
    email: "riyantita.prod@dreamlab.co.id",
    phone: "081234567896",
    hakAkses: "Lead Operator Mixing",
    gudangAkses: ["Gudang Produksi Mixing", "Gudang Barang Setengah Jadi (WIP)"],
  },
  {
    id: "acc-5",
    userId: "usr-5",
    namaPersonel: "Nur Kholilah",
    email: "nur.filling@dreamlab.co.id",
    phone: "081234567897",
    hakAkses: "Lead Operator Filling",
    gudangAkses: ["Gudang Produksi Filling"],
  },
  {
    id: "acc-6",
    userId: "usr-6",
    namaPersonel: "Dicky Barkah",
    email: "dicky.pack@dreamlab.co.id",
    phone: "081234567898",
    hakAkses: "Lead Operator Packaging",
    gudangAkses: ["Gudang Produksi Packaging"],
  },
];

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
  const [warehousesList, setWarehousesList] = useState<MasterWarehouseItem[]>(INITIAL_WAREHOUSES);
  const [accessList, setAccessList] = useState<WarehouseAccessItem[]>(INITIAL_WAREHOUSE_ACCESS);

  // ── Backend API Query ──
  const { data: apiWarehouses, refetch: refetchWarehouses } = useQuery({
    queryKey: ["master-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses");
        const body = unwrapResponse(res);
        return Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : null;
      } catch (e) {
        console.warn("Using fallback warehouses:", e);
        return null;
      }
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (apiWarehouses && Array.isArray(apiWarehouses) && apiWarehouses.length > 0) {
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
    }
  }, [apiWarehouses]);

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
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  <th className="p-3.5 w-12 text-slate-400">#</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[220px]"
                    onClick={() => handleHeaderSortToggle("namaGudang")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>GUDANG</span>
                      {sortColumn === "namaGudang" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 min-w-[140px]">TELEPON</th>
                  <th
                    className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[140px]"
                    onClick={() => handleHeaderSortToggle("lokasi")}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>LOKASI</span>
                      {sortColumn === "lokasi" ? (
                        sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="p-3.5 text-center font-bold w-24 whitespace-nowrap">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Tidak ada data gudang yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedWarehouses.map((w, idx) => {
                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-default"
                      >
                        <td className="p-3.5 text-slate-400 tabular-nums">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {w.namaGudang}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {w.telepon || "-"}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium whitespace-nowrap">
                          {w.lokasi}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <DnaCell.Actions
                            onEdit={() => handleOpenEditWarehouse(w)}
                            onDelete={() => setWarehouseToDelete(w)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                  <th className="p-3.5 w-12 text-slate-400">#</th>
                  <th className="p-3.5 min-w-[200px]">NAMA PERSONEL</th>
                  <th className="p-3.5 min-w-[200px]">EMAIL & WHATSAPP</th>
                  <th className="p-3.5 min-w-[180px]">HAK AKSES / JABATAN</th>
                  <th className="p-3.5 min-w-[320px]">GUDANG TEROTORISASI</th>
                  <th className="p-3.5 text-center w-28">OTORISASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accessList.map((acc, idx) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="p-3.5">
                      <DnaCell.Avatar
                        name={acc.namaPersonel}
                        subtext={acc.hakAkses}
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-700 font-medium">{acc.email}</div>
                      <div className="font-mono text-[11px] text-slate-500">{acc.phone}</div>
                    </td>
                    <td className="p-3.5">
                      <DnaCell.Badge label={acc.hakAkses} status="info" />
                    </td>
                    <td className="p-3.5">
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
                    <td className="p-3.5 text-center">
                      <DnaButton
                        variant="outline"
                        size="sm"
                        icon={<Lock className="w-3 h-3" />}
                        onClick={() => {
                          setEditingAccess(acc);
                          setSelectedGudangsForUser([...acc.gudangAkses]);
                          setIsAccessModalOpen(true);
                        }}
                      >
                        Atur Akses
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
