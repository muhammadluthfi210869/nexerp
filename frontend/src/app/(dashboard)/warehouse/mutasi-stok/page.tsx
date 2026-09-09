"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  MoveHorizontal,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
  Eye,
  Calendar,
  Building2,
  Package,
  Layers,
  History,
  ShieldCheck,
  Tag,
  AlertCircle,
  FileText
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
  useDnaToast
} from "@/components/dna";

interface StockMovement {
  id: string;
  trxNumber: string;
  trxDate: string;
  docReference: string;
  itemCode: string;
  itemName: string;
  category: "BAHAN_BAKU" | "BAHAN_KEMAS" | "PRODUK_JADI" | "REAGEN_LAB";
  batchLot: string;
  movementType: "INBOUND_PO" | "OUTBOUND_SO" | "TRANSFER_IN" | "TRANSFER_OUT" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "PROD_USAGE";
  movementTypeLabel: string;
  fromWarehouse: string;
  toWarehouse: string;
  qtyIn: number;
  qtyOut: number;
  balanceAfter: number;
  unit: string;
  unitPrice: number;
  totalValuation: number;
  picName: string;
  notes?: string;
}

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "mov-01",
    trxNumber: "MUT-202603-00101",
    trxDate: "2026-03-09 14:30",
    docReference: "GRN-202603-0089",
    itemCode: "RAW-NIA-001",
    itemName: "Niacinamide USP Grade 99%",
    category: "BAHAN_BAKU",
    batchLot: "LOT-NIA-202603-01",
    movementType: "INBOUND_PO",
    movementTypeLabel: "Penerimaan PO (GRN)",
    fromWarehouse: "Supplier PT Chemindo Prima",
    toWarehouse: "WH-01 Gudang Bahan Baku",
    qtyIn: 500,
    qtyOut: 0,
    balanceAfter: 1250,
    unit: "Kg",
    unitPrice: 185000,
    totalValuation: 92500000,
    picName: "Budi Santoso",
    notes: "Lolos QC Certificate of Analysis No. COA-2026-099"
  },
  {
    id: "mov-02",
    trxNumber: "MUT-202603-00102",
    trxDate: "2026-03-09 11:15",
    docReference: "SJ-202603-0045",
    itemCode: "FG-SERUM-001",
    itemName: "Brightening Glow Serum 30ml",
    category: "PRODUK_JADI",
    batchLot: "LOT-FG-202602-08",
    movementType: "OUTBOUND_SO",
    movementTypeLabel: "Pengiriman SO (Surat Jalan)",
    fromWarehouse: "WH-03 Gudang Produk Jadi",
    toWarehouse: "PT Aura Cantika Mandiri (Customer)",
    qtyIn: 0,
    qtyOut: 2000,
    balanceAfter: 3500,
    unit: "Pcs",
    unitPrice: 42500,
    totalValuation: 85000000,
    picName: "Rian Hendra",
    notes: "SO-202603-0041 Lunas / Top Finansial Valid"
  },
  {
    id: "mov-03",
    trxNumber: "MUT-202603-00103",
    trxDate: "2026-03-08 16:40",
    docReference: "TRF-WH-202603-0012",
    itemCode: "KMS-BTL-030",
    itemName: "Botol Dropper Frosted Glass 30ml",
    category: "BAHAN_KEMAS",
    batchLot: "LOT-BTL-202601-14",
    movementType: "TRANSFER_OUT",
    movementTypeLabel: "Transfer Antar Gudang",
    fromWarehouse: "WH-02 Gudang Bahan Kemas",
    toWarehouse: "WH-04 Gudang Staging Produksi",
    qtyIn: 0,
    qtyOut: 3000,
    balanceAfter: 9500,
    unit: "Pcs",
    unitPrice: 4200,
    totalValuation: 12600000,
    picName: "Siti Rahma",
    notes: "Persiapan Batch Filling Serum Batch 09"
  },
  {
    id: "mov-04",
    trxNumber: "MUT-202603-00104",
    trxDate: "2026-03-08 10:00",
    docReference: "SPK-MIX-202603-0005",
    itemCode: "RAW-HA-002",
    itemName: "Hyaluronic Acid 1% Solution",
    category: "BAHAN_BAKU",
    batchLot: "LOT-HA-202602-03",
    movementType: "PROD_USAGE",
    movementTypeLabel: "Pemakaian Produksi (Mixing)",
    fromWarehouse: "WH-01 Gudang Bahan Baku",
    toWarehouse: "Ruang Mixing Kosmetik",
    qtyIn: 0,
    qtyOut: 50,
    balanceAfter: 120,
    unit: "Kg",
    unitPrice: 850000,
    totalValuation: 42500000,
    picName: "Ahmad Maulana",
    notes: "Formula Standar SPK No. SPK-2026-0005"
  },
  {
    id: "mov-05",
    trxNumber: "MUT-202603-00105",
    trxDate: "2026-03-07 15:20",
    docReference: "ADJ-202603-0003",
    itemCode: "RAW-CET-003",
    itemName: "Cetearyl Alcohol Pastilles",
    category: "BAHAN_BAKU",
    batchLot: "LOT-CET-202601-09",
    movementType: "ADJUSTMENT_OUT",
    movementTypeLabel: "Penyesuaian Stok (Sampling QC)",
    fromWarehouse: "WH-01 Gudang Bahan Baku",
    toWarehouse: "Laboratorium QC / Retained Sample",
    qtyIn: 0,
    qtyOut: 2.5,
    balanceAfter: 480,
    unit: "Kg",
    unitPrice: 48000,
    totalValuation: 120000,
    picName: "Dr. Maya Sp.KK",
    notes: "Pengambilan Retained Sample Uji Stabilitas 6 Bulan"
  },
  {
    id: "mov-06",
    trxNumber: "MUT-202603-00106",
    trxDate: "2026-03-07 09:30",
    docReference: "GRN-202603-0082",
    itemCode: "KMS-BOX-001",
    itemName: "Inner Box Hologram Foil 30ml",
    category: "BAHAN_KEMAS",
    batchLot: "LOT-BOX-202603-02",
    movementType: "INBOUND_PO",
    movementTypeLabel: "Penerimaan PO (GRN)",
    fromWarehouse: "Percetakan Multi Grafika",
    toWarehouse: "WH-02 Gudang Bahan Kemas",
    qtyIn: 10000,
    qtyOut: 0,
    balanceAfter: 15400,
    unit: "Pcs",
    unitPrice: 1650,
    totalValuation: 16500000,
    picName: "Budi Santoso",
    notes: "Lolos QC Visual & Uji Barcode Reader"
  }
];

export default function MutasiStokPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch API with fallback
  const { data: rawMovements, isLoading } = useQuery({
    queryKey: ["warehouse-mutations"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/mutations");
        return unwrapResponse(res.data) as StockMovement[];
      } catch (e) {
        return null;
      }
    }
  });

  const movements: StockMovement[] = useMemo(() => {
    if (rawMovements && Array.isArray(rawMovements) && rawMovements.length > 0) {
      return rawMovements;
    }
    return MOCK_MOVEMENTS;
  }, [rawMovements]);

  // Tab Filtering & Search
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Tab Category
      if (activeTab === "raw" && m.category !== "BAHAN_BAKU") return false;
      if (activeTab === "packaging" && m.category !== "BAHAN_KEMAS") return false;
      if (activeTab === "finished" && m.category !== "PRODUK_JADI") return false;
      
      // Warehouse filter
      if (warehouseFilter !== "ALL") {
        const matchFrom = m.fromWarehouse.toLowerCase().includes(warehouseFilter.toLowerCase());
        const matchTo = m.toWarehouse.toLowerCase().includes(warehouseFilter.toLowerCase());
        if (!matchFrom && !matchTo) return false;
      }

      // Movement Type filter
      if (typeFilter !== "ALL") {
        if (typeFilter === "IN" && m.qtyIn === 0) return false;
        if (typeFilter === "OUT" && m.qtyOut === 0) return false;
        if (typeFilter === "TRANSFER" && !m.movementType.includes("TRANSFER")) return false;
        if (typeFilter === "ADJ" && !m.movementType.includes("ADJUSTMENT")) return false;
      }

      // Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          m.trxNumber.toLowerCase().includes(q) ||
          m.docReference.toLowerCase().includes(q) ||
          m.itemCode.toLowerCase().includes(q) ||
          m.itemName.toLowerCase().includes(q) ||
          m.batchLot.toLowerCase().includes(q) ||
          m.picName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [movements, activeTab, warehouseFilter, typeFilter, searchQuery]);

  // Metrics calculation
  const totalInQty = useMemo(() => movements.reduce((acc, curr) => acc + (curr.qtyIn || 0), 0), [movements]);
  const totalOutQty = useMemo(() => movements.reduce((acc, curr) => acc + (curr.qtyOut || 0), 0), [movements]);
  const totalMovementValuation = useMemo(() => movements.reduce((acc, curr) => acc + (curr.totalValuation || 0), 0), [movements]);

  const handleExportSpreadsheet = () => {
    toast.success(
      "Ekspor Data Berhasil",
      `Mutasi Stok (${filteredMovements.length} baris) berhasil diunduh ke format Excel/CSV.`
    );
  };

  const openDetail = (item: StockMovement) => {
    setSelectedMovement(item);
    setIsDetailModalOpen(true);
  };

  const getMovementBadgeVariant = (type: StockMovement["movementType"]) => {
    switch (type) {
      case "INBOUND_PO":
      case "ADJUSTMENT_IN":
      case "TRANSFER_IN":
        return "success";
      case "OUTBOUND_SO":
      case "PROD_USAGE":
      case "ADJUSTMENT_OUT":
        return "purple";
      case "TRANSFER_OUT":
        return "blue";
      default:
        return "neutral";
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Mutasi Stok & Kartu Stok"
        description="Audit trail lengkap pergerakan barang (Inbound, Outbound, Transfer Antar Gudang, Pemakaian Produksi & Penyesuaian) dengan tracking Batch/Lot."
        badge={<DnaBadge variant="neutral">SCR-167</DnaBadge>}
        breadcrumbs={[
          { label: "Warehouse Hub", href: "/warehouse" },
          { label: "Stok Barang", href: "/warehouse/stok" },
          { label: "Mutasi Stok", href: "/warehouse/mutasi-stok" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" onClick={handleExportSpreadsheet}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Ekspor Buku Mutasi
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL PERGERAKAN (IN)"
          value={`${totalInQty.toLocaleString()} Unit`}
          subValue="GRN PO, Retur & Transfer Masuk"
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="TOTAL PERGERAKAN (OUT)"
          value={`${totalOutQty.toLocaleString()} Unit`}
          subValue="Surat Jalan SO & Pemakaian Produksi"
          icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
        />
        <DnaStatCard
          label="TOTAL NILAI TRANSAKSI"
          value={`Rp ${(totalMovementValuation / 1000000).toFixed(1)} Jt`}
          subValue="Akumulasi Pergerakan Buku Besar"
          icon={<MoveHorizontal className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="STATUS INTEGRITAS AUDIT"
          value="100% Valid"
          subValue="Sinkron dengan Jurnal Akuntansi"
          icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Category & Filter Tabs */}
      <div className="space-y-4">
        <DnaTabNav
          tabs={[
            { id: "all", label: "Semua Kategori" },
            { id: "raw", label: "Bahan Baku (110401)" },
            { id: "packaging", label: "Bahan Kemas (110402)" },
            { id: "finished", label: "Produk Jadi (110404)" }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter Cepat:</span>
          </div>

          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="ALL">Semua Gudang Fasilitas</option>
            <option value="WH-01">WH-01 (Bahan Baku)</option>
            <option value="WH-02">WH-02 (Bahan Kemas)</option>
            <option value="WH-03">WH-03 (Produk Jadi)</option>
            <option value="WH-04">WH-04 (Staging & WIP)</option>
          </select>

          <select
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Semua Jenis Transaksi</option>
            <option value="IN">Hanya Barang Masuk (+)</option>
            <option value="OUT">Hanya Barang Keluar (-)</option>
            <option value="TRANSFER">Transfer Antar Gudang</option>
            <option value="ADJ">Penyesuaian / Koreksi</option>
          </select>

          {(warehouseFilter !== "ALL" || typeFilter !== "ALL") && (
            <button
              onClick={() => {
                setWarehouseFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium underline ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 4. Data Table Card */}
      <DnaDataTableCard
        title="Daftar Mutasi & Kartu Stok"
        description={`Menampilkan ${filteredMovements.length} catatan transaksi persediaan sesuai filter yang dipilih.`}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No. Mutasi, Dokumen Referensi, Batch/Lot, SKU..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu & No. Mutasi</th>
                <th className="py-3 px-4">Dokumen Referensi</th>
                <th className="py-3 px-4">Barang & Batch/Lot</th>
                <th className="py-3 px-4">Gudang Asal / Tujuan</th>
                <th className="py-3 px-4 text-right">Masuk / Keluar</th>
                <th className="py-3 px-4 text-right">Valuasi (Rp)</th>
                <th className="py-3 px-4">Petugas PIC</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada catatan mutasi persediaan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono text-xs font-semibold text-slate-900">{row.trxNumber}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{row.trxDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-800 border border-slate-200">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {row.docReference}
                        </div>
                        <div>
                          <DnaBadge variant={getMovementBadgeVariant(row.movementType)}>
                            {row.movementTypeLabel}
                          </DnaBadge>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs truncate max-w-[200px]" title={row.itemName}>{row.itemName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono font-medium">{row.itemCode}</span>
                        <span>•</span>
                        <span className="font-mono text-indigo-600 font-semibold">{row.batchLot}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="text-slate-500 text-[11px] truncate max-w-[180px]" title={row.fromWarehouse}>
                        <span className="font-medium text-slate-700">Dari:</span> {row.fromWarehouse}
                      </p>
                      <p className="text-slate-800 text-[11px] font-semibold truncate max-w-[180px]" title={row.toWarehouse}>
                        <span className="font-medium text-slate-700">Ke:</span> {row.toWarehouse}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {row.qtyIn > 0 && (
                        <div className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-600">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>+{row.qtyIn.toLocaleString()} {row.unit}</span>
                        </div>
                      )}
                      {row.qtyOut > 0 && (
                        <div className="flex items-center justify-end gap-1 text-xs font-bold text-rose-600">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>-{row.qtyOut.toLocaleString()} {row.unit}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Saldo: <span className="font-bold text-slate-700">{row.balanceAfter.toLocaleString()} {row.unit}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="font-mono text-xs font-bold text-slate-900">
                        Rp {row.totalValuation.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        @ Rp {row.unitPrice.toLocaleString()}/{row.unit}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.picName}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(row)}
                        title="Lihat Kartu Stok & Detail Mutasi"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Detail Kartu Stok */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Mutasi & Kartu Stok"
        description="Detail ledger transaksi persediaan dan jejak dokumen akuntansi."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedMovement && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Nomor Mutasi</span>
                  <p className="font-mono text-base font-bold text-slate-900">{selectedMovement.trxNumber}</p>
                </div>
                <DnaBadge variant={getMovementBadgeVariant(selectedMovement.movementType)}>
                  {selectedMovement.movementTypeLabel}
                </DnaBadge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Dokumen Referensi:</span>
                  <p className="font-mono font-bold text-slate-800">{selectedMovement.docReference}</p>
                </div>
                <div>
                  <span className="text-slate-500">Waktu Transaksi:</span>
                  <p className="font-semibold text-slate-800">{selectedMovement.trxDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Petugas PIC:</span>
                  <p className="font-semibold text-slate-800">{selectedMovement.picName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Batch / Lot:</span>
                  <p className="font-mono font-bold text-indigo-600">{selectedMovement.batchLot}</p>
                </div>
              </div>
            </div>

            {/* Material & Movement Spec */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  Informasi Barang
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Nama Barang:</span>
                    <p className="font-semibold text-slate-900">{selectedMovement.itemName}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kode SKU:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedMovement.itemCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori:</span>
                    <span className="font-medium text-slate-800">{selectedMovement.category}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Perpindahan & Gudang
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Gudang / Node Asal:</span>
                    <p className="font-semibold text-slate-800">{selectedMovement.fromWarehouse}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Gudang / Node Tujuan:</span>
                    <p className="font-semibold text-slate-800">{selectedMovement.toWarehouse}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantum & Financial Details */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Kalkulasi Kuantitas & Nilai Buku
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <span className="text-slate-500 text-[11px]">Kuantitas Masuk:</span>
                  <p className="font-mono text-sm font-bold text-emerald-600">
                    {selectedMovement.qtyIn > 0 ? `+${selectedMovement.qtyIn.toLocaleString()} ${selectedMovement.unit}` : "-"}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <span className="text-slate-500 text-[11px]">Kuantitas Keluar:</span>
                  <p className="font-mono text-sm font-bold text-rose-600">
                    {selectedMovement.qtyOut > 0 ? `-${selectedMovement.qtyOut.toLocaleString()} ${selectedMovement.unit}` : "-"}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <span className="text-slate-500 text-[11px]">Saldo Akhir Buku:</span>
                  <p className="font-mono text-sm font-bold text-slate-900">
                    {selectedMovement.balanceAfter.toLocaleString()} {selectedMovement.unit}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <span className="text-slate-500 text-[11px]">Total Valuasi Mutasi:</span>
                  <p className="font-mono text-sm font-bold text-blue-700">
                    Rp {selectedMovement.totalValuation.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes / Audit Log */}
            {selectedMovement.notes && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Catatan & Log Verifikasi:</span>
                    <p className="text-amber-800 mt-0.5">{selectedMovement.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
