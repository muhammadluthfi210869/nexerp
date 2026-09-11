"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Warehouse,
  Plus,
  Boxes,
  MapPin,
  Layers,
  ThermometerSnowflake,
  ShieldCheck,
  Search,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Phone,
  UserCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Grid3X3,
  Box
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaTabNav,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaTable,
  useDnaToast
} from "@/components/dna";

interface WarehouseNode {
  id: string;
  code: string;
  name: string;
  type: "RAW_MATERIAL" | "PACKAGING" | "FINISHED_GOODS" | "STAGING_WIP" | "QUARANTINE_REJECT";
  typeLabel: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  picName: string;
  totalBins: number;
  capacityUtilityPercent: number;
  temperatureZone: "AMBIENT" | "COOL_ROOM" | "AIR_CONDITIONED";
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
}

interface BinLocation {
  id: string;
  binCode: string;
  warehouseCode: string;
  warehouseName: string;
  aisle: string;
  rackLevel: string;
  zoneType: "AMBIENT" | "COOL_ROOM";
  capacityMax: number;
  currentWeightOrQty: number;
  occupancyPercent: number;
  activeSku: string;
  status: "AVAILABLE" | "OCCUPIED" | "FULL" | "BLOCKED";
}

interface GoodsCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  inventoryAccount: string;
  cogsAccount: string;
  salesAccount: string;
  salesReturnAccount: string;
  unbilledGoodsAccount: string;
}

const MOCK_WAREHOUSES: WarehouseNode[] = [
  {
    id: "wh-01",
    code: "WH-01",
    name: "Gudang Bahan Baku (Raw Material)",
    type: "RAW_MATERIAL",
    typeLabel: "Bahan Baku & Ekstrak Botani",
    address: "Kawasan Industri Kosmetik Blok A No. 12",
    city: "Tangerang",
    province: "Banten",
    phone: "021-5550101",
    picName: "Hendro Wibowo (Kepala Gudang)",
    totalBins: 16,
    capacityUtilityPercent: 78,
    temperatureZone: "COOL_ROOM",
    status: "ACTIVE"
  },
  {
    id: "wh-02",
    code: "WH-02",
    name: "Gudang Bahan Kemas (Packaging)",
    type: "PACKAGING",
    typeLabel: "Botol, Tube, Box & Label",
    address: "Kawasan Industri Kosmetik Blok A No. 14",
    city: "Tangerang",
    province: "Banten",
    phone: "021-5550102",
    picName: "Siti Rahma",
    totalBins: 24,
    capacityUtilityPercent: 62,
    temperatureZone: "AMBIENT",
    status: "ACTIVE"
  },
  {
    id: "wh-03",
    code: "WH-03",
    name: "Gudang Produk Jadi (Finished Goods)",
    type: "FINISHED_GOODS",
    typeLabel: "Produk Siap Kirim (Maklon)",
    address: "Kawasan Industri Kosmetik Blok B No. 05",
    city: "Tangerang",
    province: "Banten",
    phone: "021-5550103",
    picName: "Rian Hendra",
    totalBins: 20,
    capacityUtilityPercent: 84,
    temperatureZone: "AIR_CONDITIONED",
    status: "ACTIVE"
  },
  {
    id: "wh-04",
    code: "WH-04",
    name: "Gudang Staging & WIP Produksi",
    type: "STAGING_WIP",
    typeLabel: "Antrean Mixing & Filling",
    address: "Gedung Produksi Lantai 1",
    city: "Tangerang",
    province: "Banten",
    phone: "021-5550104",
    picName: "Ahmad Maulana",
    totalBins: 10,
    capacityUtilityPercent: 45,
    temperatureZone: "AIR_CONDITIONED",
    status: "ACTIVE"
  },
  {
    id: "wh-05",
    code: "WH-05",
    name: "Gudang Karantina & Transit Reject",
    type: "QUARANTINE_REJECT",
    typeLabel: "Area Karantina QC & Reject",
    address: "Area Isolasi QC Lab Gedung C",
    city: "Tangerang",
    province: "Banten",
    phone: "021-5550105",
    picName: "Dr. Maya Sp.KK",
    totalBins: 8,
    capacityUtilityPercent: 30,
    temperatureZone: "AIR_CONDITIONED",
    status: "ACTIVE"
  }
];

const MOCK_BINS: BinLocation[] = [
  {
    id: "bin-01",
    binCode: "WH01-A1-01",
    warehouseCode: "WH-01",
    warehouseName: "Gudang Bahan Baku",
    aisle: "Lorong A",
    rackLevel: "Tingkat 1",
    zoneType: "COOL_ROOM",
    capacityMax: 1000,
    currentWeightOrQty: 850,
    occupancyPercent: 85,
    activeSku: "RAW-NIA-001 (Niacinamide 99%)",
    status: "OCCUPIED"
  },
  {
    id: "bin-02",
    binCode: "WH01-A1-02",
    warehouseCode: "WH-01",
    warehouseName: "Gudang Bahan Baku",
    aisle: "Lorong A",
    rackLevel: "Tingkat 2",
    zoneType: "COOL_ROOM",
    capacityMax: 500,
    currentWeightOrQty: 120,
    occupancyPercent: 24,
    activeSku: "RAW-HA-002 (Hyaluronic Acid)",
    status: "OCCUPIED"
  },
  {
    id: "bin-03",
    binCode: "WH01-B1-01",
    warehouseCode: "WH-01",
    warehouseName: "Gudang Bahan Baku",
    aisle: "Lorong B",
    rackLevel: "Tingkat 1",
    zoneType: "COOL_ROOM",
    capacityMax: 1000,
    currentWeightOrQty: 480,
    occupancyPercent: 48,
    activeSku: "RAW-CET-003 (Cetearyl Alcohol)",
    status: "OCCUPIED"
  },
  {
    id: "bin-04",
    binCode: "WH01-B1-02",
    warehouseCode: "WH-01",
    warehouseName: "Gudang Bahan Baku",
    aisle: "Lorong B",
    rackLevel: "Tingkat 2",
    zoneType: "COOL_ROOM",
    capacityMax: 1000,
    currentWeightOrQty: 0,
    occupancyPercent: 0,
    activeSku: "-",
    status: "AVAILABLE"
  },
  {
    id: "bin-05",
    binCode: "WH02-C1-01",
    warehouseCode: "WH-02",
    warehouseName: "Gudang Bahan Kemas",
    aisle: "Lorong C",
    rackLevel: "Pallet Level 1",
    zoneType: "AMBIENT",
    capacityMax: 10000,
    currentWeightOrQty: 9500,
    occupancyPercent: 95,
    activeSku: "KMS-BTL-030 (Botol Dropper 30ml)",
    status: "OCCUPIED"
  },
  {
    id: "bin-06",
    binCode: "WH02-C1-02",
    warehouseCode: "WH-02",
    warehouseName: "Gudang Bahan Kemas",
    aisle: "Lorong C",
    rackLevel: "Pallet Level 2",
    zoneType: "AMBIENT",
    capacityMax: 20000,
    currentWeightOrQty: 15400,
    occupancyPercent: 77,
    activeSku: "KMS-BOX-001 (Inner Box Hologram)",
    status: "OCCUPIED"
  }
];

const MOCK_CATEGORIES: GoodsCategory[] = [
  {
    id: "cat-01",
    code: "CAT-RAW",
    name: "Bahan Baku Kosmetik",
    description: "Zat aktif, surfaktan, emollient, pengental, pewarna & ekstrak alami",
    inventoryAccount: "110401 - Persediaan Bahan Baku",
    cogsAccount: "510101 - Harga Pokok Bahan Baku",
    salesAccount: "410101 - Pendapatan Jasa Maklon",
    salesReturnAccount: "410201 - Retur Penjualan Maklon",
    unbilledGoodsAccount: "210201 - Barang Belum Difaktur"
  },
  {
    id: "cat-02",
    code: "CAT-PACK",
    name: "Bahan Kemas & Wadah",
    description: "Botol dropper, pot cream, tube, inner box, master carton & label stiker",
    inventoryAccount: "110402 - Persediaan Bahan Kemas",
    cogsAccount: "510102 - Harga Pokok Bahan Kemas",
    salesAccount: "410101 - Pendapatan Jasa Maklon",
    salesReturnAccount: "410201 - Retur Penjualan Maklon",
    unbilledGoodsAccount: "210201 - Barang Belum Difaktur"
  },
  {
    id: "cat-03",
    code: "CAT-FG",
    name: "Produk Jadi (Finished Goods)",
    description: "Skincare, bodycare & decorative cosmetics yang telah selesai packing siap kirim",
    inventoryAccount: "110404 - Persediaan Barang Jadi",
    cogsAccount: "510104 - HPP Produk Jadi",
    salesAccount: "410101 - Pendapatan Penjualan Maklon",
    salesReturnAccount: "410201 - Retur Penjualan Maklon",
    unbilledGoodsAccount: "210201 - Barang Belum Difaktur"
  }
];

export default function GudangPage() {
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
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    code: "",
    type: "RAW_MATERIAL",
    phone: "",
    province: "Banten",
    city: "Tangerang",
    address: "",
    picName: ""
  });

  // Bin Form
  const [binForm, setBinForm] = useState({
    binCode: "",
    warehouseCode: "WH-01",
    aisle: "Lorong A",
    rackLevel: "Tingkat 1",
    zoneType: "COOL_ROOM" as "AMBIENT" | "COOL_ROOM",
    capacityMax: 1000
  });

  // Category Form (SCR-028)
  const [categoryForm, setCategoryForm] = useState({
    code: "",
    name: "",
    description: "",
    inventoryAccount: "110401",
    cogsAccount: "510101",
    salesAccount: "410101",
    salesReturnAccount: "410201",
    unbilledGoodsAccount: "210201"
  });

  // Queries
  const { data: rawWarehouses } = useQuery({
    queryKey: ["master-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses");
        return unwrapResponse(res.data) as WarehouseNode[];
      } catch (e) {
        return null;
      }
    }
  });

  const warehouses: WarehouseNode[] = useMemo(() => {
    if (rawWarehouses && Array.isArray(rawWarehouses) && rawWarehouses.length > 0) {
      return rawWarehouses;
    }
    return MOCK_WAREHOUSES;
  }, [rawWarehouses]);

  const bins: BinLocation[] = MOCK_BINS;
  const categories: GoodsCategory[] = MOCK_CATEGORIES;

  // Filtered Bins
  const filteredBins = useMemo(() => {
    return bins.filter(b => {
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
  const handleSaveWarehouse = () => {
    if (!warehouseForm.name || !warehouseForm.address) {
      toast.warning("Form Belum Lengkap", "Nama gudang dan alamat lengkap wajib diisi.");
      return;
    }
    toast.success("Gudang Fasilitas Disimpan", `Gudang ${warehouseForm.name} berhasil didaftarkan ke sistem.`);
    setIsWarehouseModalOpen(false);
  };

  const handleSaveBin = () => {
    if (!binForm.binCode) {
      toast.warning("Form Belum Lengkap", "Kode lokasi Bin wajib diisi.");
      return;
    }
    toast.success("Lokasi Bin Disimpan", `Lokasi rak ${binForm.binCode} berhasil didaftarkan.`);
    setIsBinModalOpen(false);
  };

  const handleSaveCategory = () => {
    if (!categoryForm.code || !categoryForm.name) {
      toast.warning("Form Belum Lengkap", "Kode dan Nama Kategori wajib diisi.");
      return;
    }
    toast.success("Kategori Barang Disimpan", `Kategori ${categoryForm.name} dengan mapping CoA Akuntansi berhasil didaftarkan.`);
    setIsCategoryModalOpen(false);
  };

  return (
    <DnaPageContainer>
      {/* 1. Page Header */}
      <DnaPageHeader
        title="Denah & Kelola Lokasi Gudang"
        description="Master data fasilitas gudang, denah matriks visual rak & bin penyimpanan, zona temperatur, dan mapping Akun CoA Kategori Barang."
        badge={<DnaBadge variant="neutral">SCR-035 & SCR-036</DnaBadge>}
        breadcrumbs={[
          { label: "Warehouse Hub", href: "/warehouse" },
          { label: "Denah & Lokasi", href: "/warehouse/gudang" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
              <Tag className="w-4 h-4 mr-2" />
              Kategori Barang (SCR-028)
            </DnaButton>
            <DnaButton variant="secondary" onClick={() => setIsBinModalOpen(true)}>
              <Grid3X3 className="w-4 h-4 mr-2" />
              Tambah Bin / Rak
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsWarehouseModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Gudang (SCR-036)
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL FASILITAS GUDANG"
          value={`${warehouses.length} Nodes`}
          subValue="WH-01 s/d WH-05 Operasional"
          icon={<Warehouse className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="TOTAL LOKASI RAK & BIN"
          value={`${bins.length * 10} Slots`}
          subValue="Kapasitas Penyimpanan Terdaftar"
          icon={<Boxes className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="RATA-RATA UTILISASI"
          value="68.4%"
          subValue="Occupancy Ruang Penyimpanan"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="ZONA COOL ROOM"
          value="2 Gudang"
          subValue="Suhu Terjaga 15 - 25°C"
          icon={<ThermometerSnowflake className="w-5 h-5 text-cyan-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Navigation Tabs */}
      <DnaTabNav
        tabs={[
          { id: "map", label: "Denah Visual & Matriks Rak" },
          { id: "warehouses", label: `Master Gudang (${warehouses.length})` },
          { id: "bins", label: `Master Rak & Bin (${bins.length})` },
          { id: "categories", label: `Kategori & CoA Akun (${categories.length})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. Tab Contents */}

      {/* Tab 1: Denah Visual & Matriks Rak */}
      {activeTab === "map" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {warehouses.map((wh) => (
              <div key={wh.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 hover:border-blue-400 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-xs border border-blue-100">
                      {wh.code}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{wh.name}</h4>
                      <p className="text-[11px] text-slate-500">{wh.typeLabel}</p>
                    </div>
                  </div>
                  <DnaBadge variant="success">AKTIF</DnaBadge>
                </div>

                {/* Progress bar occupancy */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Utilisasi Kapasitas:</span>
                    <span className="font-bold text-slate-800">{wh.capacityUtilityPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${wh.capacityUtilityPercent > 80 ? "bg-amber-500" : "bg-blue-600"}`}
                      style={{ width: `${wh.capacityUtilityPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rack matrix miniature preview */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matriks Visual Rak:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-semibold border ${
                          idx < 5 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                        title={`Slot Rak #${idx + 1}`}
                      >
                        R{idx + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {wh.city}
                  </span>
                  <span className="font-medium text-slate-700">PIC: {wh.picName.split(" ")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Master Fasilitas Gudang (SCR-035) */}
      {activeTab === "warehouses" && (
        <DnaDataTableCard
          title="Master Fasilitas Gudang (SCR-035)"
          description="Daftar seluruh gudang penyimpanan bahan baku, kemas, produk jadi, staging & karantina."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari Nama Gudang, PIC, Kota..."
        >
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Kode & Fasilitas</th>
                  <th className="py-3 px-4">Alamat & Lokasi</th>
                  <th className="py-3 px-4">Penanggung Jawab (PIC)</th>
                  <th className="py-3 px-4">Zona Suhu & Rak</th>
                  <th className="py-3 px-4">Utilisasi Ruang</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warehouses.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {row.code}
                        </span>
                        <p className="font-semibold text-slate-900 text-xs">{row.name}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{row.typeLabel}</p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="text-slate-800 font-medium truncate max-w-[200px]" title={row.address}>
                        {row.address}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{row.city}, {row.province}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.picName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{row.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        {row.temperatureZone === "COOL_ROOM" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <ThermometerSnowflake className="w-3 h-3" /> Cool (15-25°C)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Ambient (25-30°C)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{row.totalBins} Rak / Bin Terdaftar</p>
                    </td>
                    <td className="py-3 px-4 text-xs w-28">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span>{row.capacityUtilityPercent}%</span>
                        <span className="text-slate-400">Terisi</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${row.capacityUtilityPercent > 80 ? "bg-amber-500" : "bg-blue-600"}`}
                          style={{ width: `${row.capacityUtilityPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <DnaBadge variant={row.status === "ACTIVE" ? "success" : "neutral"}>
                        {row.status === "ACTIVE" ? "AKTIF" : row.status}
                      </DnaBadge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Detail Fasilitas", `Melihat data ${row.name}`)}
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* Tab 3: Master Rak & Bin Lokasi */}
      {activeTab === "bins" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Filter Gudang:</span>
<DnaSelect 
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none"
              value={selectedWarehouseFilter}
              onChange={setSelectedWarehouseFilter}
            >
              <option value="ALL">Semua Gudang</option>
              <option value="WH-01">WH-01 (Bahan Baku)</option>
              <option value="WH-02">WH-02 (Bahan Kemas)</option>
              <option value="WH-03">WH-03 (Produk Jadi)</option>
            </DnaSelect>
          </div>

          <DnaDataTableCard
            title="Daftar Lokasi Rak & Bin"
            description="Detail posisi lorong, tingkat rak, dan kapasitas muatan barang."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari Kode Bin, SKU Tersimpan..."
          >
            <div className="overflow-x-auto">
              <DnaTable className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Kode Bin & Lokasi</th>
                    <th className="py-3 px-4">Posisi & Tingkat</th>
                    <th className="py-3 px-4">SKU Tersimpan</th>
                    <th className="py-3 px-4">Kapasitas & Muatan</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBins.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs font-bold text-slate-900">{row.binCode}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{row.warehouseName}</p>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <p className="font-semibold text-slate-800">{row.aisle}</p>
                        <p className="text-[11px] text-slate-500">{row.rackLevel}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-800 truncate max-w-[200px]" title={row.activeSku}>
                        {row.activeSku}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        <p className="text-slate-900 font-semibold">{row.currentWeightOrQty} / {row.capacityMax}</p>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${row.occupancyPercent > 80 ? "bg-amber-500" : "bg-emerald-600"}`}
                            style={{ width: `${row.occupancyPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <DnaBadge variant={row.status === "AVAILABLE" ? "success" : "purple"}>
                          {row.status === "AVAILABLE" ? "TERSEDIA" : "TERISI"}
                        </DnaBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DnaTable>
            </div>
          </DnaDataTableCard>
        </div>
      )}

      {/* Tab 4: Kategori Barang & Mapping CoA (SCR-027 & SCR-028) */}
      {activeTab === "categories" && (
        <DnaDataTableCard
          title="Kategori Barang & Mapping Akun Akuntansi (SCR-027)"
          description="Konfigurasi integrasi kategori barang ke Buku Besar Akuntansi (CoA Persediaan, COGS, Penjualan & Retur)."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari Kategori, Kode, Akun..."
        >
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Kode & Kategori</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Akun Persediaan (Inventory)</th>
                  <th className="py-3 px-4">Akun HPP (COGS)</th>
                  <th className="py-3 px-4">Akun Pendapatan Penjualan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                        {row.code}
                      </span>
                      <p className="font-semibold text-slate-900 text-xs mt-1">{row.name}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 truncate max-w-[200px]" title={row.description}>
                      {row.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {row.inventoryAccount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-medium text-slate-700">
                        {row.cogsAccount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-medium text-slate-700">
                        {row.salesAccount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Kategori Barang", `Detail konfigurasi CoA ${row.name}`)}
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* 5. Modal Tambah Gudang (SCR-036) */}
      <DnaModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        title="Tambah Fasilitas Gudang Baru (SCR-036)"
        description="Pendaftaran master data gudang atau zona penyimpanan baru."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsWarehouseModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveWarehouse}>
              Simpan Gudang
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Kode Gudang *</label>
              <DnaInput
                type="text"
                placeholder="Contoh: WH-06"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={warehouseForm.code}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Tipe Fasilitas *</label>
  <DnaSelect 
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                value={warehouseForm.type}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="RAW_MATERIAL">Bahan Baku (Raw Material)</option>
                <option value="PACKAGING">Bahan Kemas (Packaging)</option>
                <option value="FINISHED_GOODS">Produk Jadi (Finished Goods)</option>
                <option value="STAGING_WIP">Staging Produksi / WIP</option>
              </DnaSelect>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Nama Gudang *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: Gudang Buffer Kemas Blok C"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={warehouseForm.name}
              onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Provinsi *</label>
              <DnaInput
                type="text"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={warehouseForm.province}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, province: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Kota / Kabupaten *</label>
              <DnaInput
                type="text"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={warehouseForm.city}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Alamat Lengkap *</label>
            <DnaTextarea
              rows={2}
              placeholder="Jalan, Kawasan Industri, Nomor Kavling..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={warehouseForm.address}
              onChange={(e) => setWarehouseForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Penanggung Jawab (PIC)</label>
              <DnaInput
                type="text"
                placeholder="Nama Staff / Kepala"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={warehouseForm.picName}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, picName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nomor Telepon</label>
              <DnaInput
                type="text"
                placeholder="021-..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={warehouseForm.phone}
                onChange={(e) => setWarehouseForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Tambah Rak / Bin */}
      <DnaModal
        isOpen={isBinModalOpen}
        onClose={() => setIsBinModalOpen(false)}
        title="Tambah Lokasi Rak / Bin"
        description="Mendaftarkan slot penyimpanan spesifik pada lorong dan tingkat rak."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsBinModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveBin}>
              Simpan Bin
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Pilih Gudang *</label>
  <DnaSelect 
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                value={binForm.warehouseCode}
                onChange={(value) => setBinForm(prev => ({ ...prev, warehouseCode: value }))}
              >
                <option value="WH-01">WH-01 Gudang Bahan Baku</option>
                <option value="WH-02">WH-02 Gudang Bahan Kemas</option>
                <option value="WH-03">WH-03 Gudang Produk Jadi</option>
              </DnaSelect>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Kode Bin *</label>
              <DnaInput
                type="text"
                placeholder="Contoh: WH01-A1-05"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={binForm.binCode}
                onChange={(e) => setBinForm(prev => ({ ...prev, binCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Lorong / Baris</label>
              <DnaInput
                type="text"
                placeholder="Contoh: Lorong A"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={binForm.aisle}
                onChange={(e) => setBinForm(prev => ({ ...prev, aisle: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Tingkat / Level</label>
              <DnaInput
                type="text"
                placeholder="Contoh: Tingkat 1"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={binForm.rackLevel}
                onChange={(e) => setBinForm(prev => ({ ...prev, rackLevel: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Zona Suhu</label>
  <DnaSelect 
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                value={binForm.zoneType}
                onChange={(value) => setBinForm(prev => ({ ...prev, zoneType: value as any }))}
              >
                <option value="COOL_ROOM">Cool Room (15-25°C)</option>
                <option value="AMBIENT">Suhu Ruang (Ambient)</option>
              </DnaSelect>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Kapasitas Maksimal (Kg / Pcs)</label>
              <DnaInput
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={binForm.capacityMax}
                onChange={(e) => setBinForm(prev => ({ ...prev, capacityMax: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>
      </DnaModal>

      {/* 7. Modal Kategori Barang (SCR-028) */}
      <DnaModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Buat Kategori Barang & Mapping CoA (SCR-028)"
        description="Konfigurasi kategori produk maklon dengan integrasi akun buku besar akuntansi."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveCategory}>
              Simpan Kategori
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Kode Kategori *</label>
              <DnaInput
                type="text"
                placeholder="Contoh: CAT-REAG"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                value={categoryForm.code}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Nama Kategori *</label>
              <DnaInput
                type="text"
                placeholder="Contoh: Reagen & Bahan Kimia Uji Lab"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Deskripsi Kategori</label>
            <DnaInput
              type="text"
              placeholder="Keterangan kategori barang..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">
              Pemetaan Akun Buku Besar (Chart of Accounts)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Akun Persediaan (Inventory Asset) *</label>
    <DnaSelect 
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  value={categoryForm.inventoryAccount}
                  onChange={(value) => setCategoryForm(prev => ({ ...prev, inventoryAccount: value }))}
                >
                  <option value="110401">110401 - Persediaan Bahan Baku</option>
                  <option value="110402">110402 - Persediaan Bahan Kemas</option>
                  <option value="110404">110404 - Persediaan Produk Jadi</option>
                  <option value="510201">510201 - Persediaan Reagen Lab & QC</option>
                </DnaSelect>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Akun HPP (COGS Account) *</label>
    <DnaSelect 
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  value={categoryForm.cogsAccount}
                  onChange={(value) => setCategoryForm(prev => ({ ...prev, cogsAccount: value }))}
                >
                  <option value="510101">510101 - HPP Bahan Baku</option>
                  <option value="510102">510102 - HPP Bahan Kemas</option>
                  <option value="510104">510104 - HPP Produk Jadi</option>
                </DnaSelect>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Akun Penjualan (Revenue Account) *</label>
    <DnaSelect 
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  value={categoryForm.salesAccount}
                  onChange={(value) => setCategoryForm(prev => ({ ...prev, salesAccount: value }))}
                >
                  <option value="410101">410101 - Pendapatan Penjualan Maklon</option>
                  <option value="410102">410102 - Pendapatan Jasa Produksi</option>
                </DnaSelect>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Akun Retur Penjualan *</label>
    <DnaSelect 
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  value={categoryForm.salesReturnAccount}
                  onChange={(value) => setCategoryForm(prev => ({ ...prev, salesReturnAccount: value }))}
                >
                  <option value="410201">410201 - Retur Penjualan Maklon</option>
                </DnaSelect>
              </div>
            </div>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
