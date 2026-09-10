"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRightLeft,
  Warehouse,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Trash2,
  FileText,
  Boxes,
  ArrowRight,
  ClipboardList
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

interface RequisitionItem {
  id: string;
  materialCode: string;
  materialName: string;
  category: "BAHAN_BAKU" | "BAHAN_KEMAS" | "CONSUMABLE";
  requestedQty: number;
  availableStock: number;
  unit: string;
  notes?: string;
}

interface MaterialRequisition {
  id: string;
  requisitionNumber: string;
  requestDate: string;
  fromWarehouse: string;
  toDivision: string;
  spkNumber: string;
  batchNumber?: string;
  purpose: string;
  totalItems: number;
  requestedBy: string;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
  approvalNotes?: string;
  items: RequisitionItem[];
}

const INITIAL_REQUISITIONS: MaterialRequisition[] = [
  {
    id: "req-1",
    requisitionNumber: "REQ-202609-0012",
    requestDate: "2026-09-09",
    fromWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    toDivision: "Ruang Mixing Produksi - Line A",
    spkNumber: "SPK-2026-09-008",
    batchNumber: "LOT-BL-2609-01",
    purpose: "Bahan Baku Batch 1 Body Lotion Brightening 100ml (PO-202608-000033)",
    totalItems: 4,
    requestedBy: "Rahmat Hidayat (Supervisor Mixing)",
    status: "APPROVED",
    items: [
      { id: "ri-1", materialCode: "BBK00028", materialName: "Super Moisturing Max", category: "BAHAN_BAKU", requestedQty: 45.5, availableStock: 120.0, unit: "Kg" },
      { id: "ri-2", materialCode: "BBK00031", materialName: "Niacinamide PC (Vitamin B3)", category: "BAHAN_BAKU", requestedQty: 15.0, availableStock: 85.0, unit: "Kg" },
      { id: "ri-3", materialCode: "BBK00045", materialName: "Cetyl Alcohol Flakes", category: "BAHAN_BAKU", requestedQty: 30.0, availableStock: 250.0, unit: "Kg" },
      { id: "ri-4", materialCode: "BBK00092", materialName: "Fragrance Sweet Vanilla", category: "BAHAN_BAKU", requestedQty: 3.5, availableStock: 18.0, unit: "Kg" }
    ]
  },
  {
    id: "req-2",
    requisitionNumber: "REQ-202609-0013",
    requestDate: "2026-09-09",
    fromWarehouse: "Gudang Kemas & Box (WH-02)",
    toDivision: "Line Packaging & Boxing - Line C",
    spkNumber: "SPK-2026-09-006",
    batchNumber: "LOT-FS-2609-03",
    purpose: "Kemas Primer & Sekunder Facial Wash Tea Tree 100ml",
    totalItems: 3,
    requestedBy: "Siti Rahma (Lead Packing)",
    status: "PENDING",
    items: [
      { id: "ri-5", materialCode: "KMS00012", materialName: "Botol Tube 100ml Doff White + Flip Cap", category: "BAHAN_KEMAS", requestedQty: 5000, availableStock: 12500, unit: "Pcs" },
      { id: "ri-6", materialCode: "KMS00088", materialName: "Inner Box Printing Ivory 300gsm", category: "BAHAN_KEMAS", requestedQty: 5000, availableStock: 5200, unit: "Pcs" },
      { id: "ri-7", materialCode: "KMS00105", materialName: "Master Carton Box K125/M125 (Isi 48)", category: "BAHAN_KEMAS", requestedQty: 105, availableStock: 350, unit: "Pcs" }
    ]
  },
  {
    id: "req-3",
    requisitionNumber: "REQ-202609-0010",
    requestDate: "2026-09-08",
    fromWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    toDivision: "Laboratorium R&D / Formularium",
    spkNumber: "SAMPLE-2026-089",
    purpose: "Bahan Uji Coba Trial Formula Serum Peptide Anti-Aging",
    totalItems: 2,
    requestedBy: "Dr. Farah (R&D Chemist)",
    status: "COMPLETED",
    items: [
      { id: "ri-8", materialCode: "BBK00112", materialName: "Copper Tripeptide-1 Solution 5%", category: "BAHAN_BAKU", requestedQty: 0.5, availableStock: 2.2, unit: "Kg" },
      { id: "ri-9", materialCode: "BBK00015", materialName: "Hyaluronic Acid Multi-Molecular", category: "BAHAN_BAKU", requestedQty: 1.0, availableStock: 14.5, unit: "Kg" }
    ]
  },
  {
    id: "req-4",
    requisitionNumber: "REQ-202609-0008",
    requestDate: "2026-09-07",
    fromWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    toDivision: "Ruang Filling & Sealing",
    spkNumber: "SPK-2026-08-044",
    purpose: "Bahan Tambahan Emulsifier Batch 2 Hair Tonic",
    totalItems: 1,
    requestedBy: "Budi Santoso (Foreman)",
    status: "REJECTED",
    approvalNotes: "Stok fisik di WH-01 sedang dalam masa karantina QA Re-testing. Mohon gunakan Batch Alternatif.",
    items: [
      { id: "ri-10", materialCode: "BBK00067", materialName: "Polysorbate 20 Pure Grade", category: "BAHAN_BAKU", requestedQty: 25.0, availableStock: 0, unit: "Kg" }
    ]
  }
];

const MASTER_WAREHOUSES = [
  "Gudang Bahan Baku Utama (WH-01)",
  "Gudang Kemas & Box (WH-02)",
  "Gudang Produk Jadi (WH-03)",
  "Gudang Karantina & QC (WH-04)",
  "Gudang Retur & Reject (WH-05)"
];

const TARGET_DIVISIONS = [
  "Ruang Mixing Produksi - Line A",
  "Ruang Mixing Produksi - Line B",
  "Line Packaging & Boxing - Line C",
  "Ruang Filling & Sealing",
  "Laboratorium R&D / Formularium",
  "Quality Control (QC Field Lab)",
  "Maintenance & Engineering"
];

const AVAILABLE_MATERIALS = [
  { code: "BBK00028", name: "Super Moisturing Max", category: "BAHAN_BAKU", unit: "Kg", stock: 120.0 },
  { code: "BBK00031", name: "Niacinamide PC (Vitamin B3)", category: "BAHAN_BAKU", unit: "Kg", stock: 85.0 },
  { code: "BBK00045", name: "Cetyl Alcohol Flakes", category: "BAHAN_BAKU", unit: "Kg", stock: 250.0 },
  { code: "BBK00092", name: "Fragrance Sweet Vanilla", category: "BAHAN_BAKU", unit: "Kg", stock: 18.0 },
  { code: "BBK00112", name: "Copper Tripeptide-1 Solution 5%", category: "BAHAN_BAKU", unit: "Kg", stock: 2.2 },
  { code: "KMS00012", name: "Botol Tube 100ml Doff White + Flip Cap", category: "BAHAN_KEMAS", unit: "Pcs", stock: 12500 },
  { code: "KMS00088", name: "Inner Box Printing Ivory 300gsm", category: "BAHAN_KEMAS", unit: "Pcs", stock: 5200 },
  { code: "KMS00105", name: "Master Carton Box K125/M125 (Isi 48)", category: "BAHAN_KEMAS", unit: "Pcs", stock: 350 }
];

export default function MaterialRequisitionPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<MaterialRequisition[]>(INITIAL_REQUISITIONS);

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [selectedReq, setSelectedReq] = useState<MaterialRequisition | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [fromWarehouse, setFromWarehouse] = useState(MASTER_WAREHOUSES[0]);
  const [toDivision, setToDivision] = useState(TARGET_DIVISIONS[0]);
  const [spkNumber, setSpkNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [cartItems, setCartItems] = useState<Array<{
    materialCode: string;
    materialName: string;
    category: "BAHAN_BAKU" | "BAHAN_KEMAS" | "CONSUMABLE";
    requestedQty: number;
    availableStock: number;
    unit: string;
    notes?: string;
  }>>([]);
  const [selectedMaterialCode, setSelectedMaterialCode] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemNote, setItemNote] = useState("");

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const total = list.length;
    const pending = list.filter(r => r.status === "PENDING").length;
    const approved = list.filter(r => r.status === "APPROVED" || r.status === "COMPLETED").length;
    const totalItemsCount = list.reduce((sum, r) => sum + r.items.reduce((iSum, i) => iSum + i.requestedQty, 0), 0);

    return {
      total,
      pending,
      approved,
      totalItemsCount
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.requisitionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.spkNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "PENDING" ? item.status === "PENDING" :
        activeTab === "APPROVED" ? item.status === "APPROVED" :
        activeTab === "COMPLETED" ? item.status === "COMPLETED" :
        activeTab === "REJECTED" ? item.status === "REJECTED" : true;

      const matchWarehouse = warehouseFilter === "ALL" ? true : item.fromWarehouse.includes(warehouseFilter);

      return matchSearch && matchTab && matchWarehouse;
    });
  }, [dataList, searchQuery, activeTab, warehouseFilter]);

  // Cart Handlers
  const handleAddItemToCart = () => {
    if (!selectedMaterialCode) {
      toast.error("Pilih material terlebih dahulu");
      return;
    }
    const mat = AVAILABLE_MATERIALS.find(m => m.code === selectedMaterialCode);
    if (!mat) return;

    if (itemQty <= 0) {
      toast.error("Jumlah permintaan harus lebih dari 0");
      return;
    }

    const existing = cartItems.find(c => c.materialCode === mat.code);
    if (existing) {
      setCartItems(cartItems.map(c => c.materialCode === mat.code ? { ...c, requestedQty: c.requestedQty + itemQty } : c));
    } else {
      setCartItems([
        ...cartItems,
        {
          materialCode: mat.code,
          materialName: mat.name,
          category: mat.category as any,
          requestedQty: itemQty,
          availableStock: mat.stock,
          unit: mat.unit,
          notes: itemNote
        }
      ]);
    }

    setSelectedMaterialCode("");
    setItemQty(1);
    setItemNote("");
    toast.success(`${mat.name} ditambahkan ke daftar permintaan`);
  };

  const handleRemoveFromCart = (code: string) => {
    setCartItems(cartItems.filter(c => c.materialCode !== code));
  };

  const handleCreateRequisition = () => {
    if (!spkNumber.trim()) {
      toast.error("Nomor SPK / Referensi Order wajib diisi");
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

    const todayStr = new Date().toISOString().split("T")[0];
    const newNo = `REQ-202609-00${String(dataList.length + 10).padStart(2, "0")}`;

    const newReq: MaterialRequisition = {
      id: `req-${Date.now()}`,
      requisitionNumber: newNo,
      requestDate: todayStr,
      fromWarehouse,
      toDivision,
      spkNumber,
      batchNumber: batchNumber || undefined,
      purpose,
      totalItems: cartItems.length,
      requestedBy: "Logistics Admin (Anda)",
      status: "PENDING",
      items: cartItems.map((c, idx) => ({
        id: `ri-${Date.now()}-${idx}`,
        ...c
      }))
    };

    setDataList([newReq, ...dataList]);
    setIsCreateOpen(false);
    setCartItems([]);
    setSpkNumber("");
    setBatchNumber("");
    setPurpose("");
    toast.success(`Permintaan Barang ${newNo} berhasil diajukan dan menunggu persetujuan Kepala Gudang.`);
  };

  const handleApprove = (id: string) => {
    setDataList(dataList.map(item => {
      if (item.id === id) {
        return { ...item, status: "APPROVED" };
      }
      return item;
    }));
    if (selectedReq && selectedReq.id === id) {
      setSelectedReq({ ...selectedReq, status: "APPROVED" });
    }
    toast.success("Permintaan barang disetujui. Petugas gudang dapat menyiapkan barang (Picking).");
  };

  const handleHandoverComplete = (id: string) => {
    setDataList(dataList.map(item => {
      if (item.id === id) {
        return { ...item, status: "COMPLETED" };
      }
      return item;
    }));
    if (selectedReq && selectedReq.id === id) {
      setSelectedReq({ ...selectedReq, status: "COMPLETED" });
    }
    toast.success("Barang telah diserahterimakan dan stok gudang terpotong secara otomatis.");
  };

  const getStatusBadge = (status: MaterialRequisition["status"]) => {
    switch (status) {
      case "PENDING":
        return <DnaBadge variant="warning">Menunggu Approval</DnaBadge>;
      case "APPROVED":
        return <DnaBadge variant="info">Disetujui (Siap Picking)</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai Diserahkan</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Ditolak</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Permintaan Barang"
        description="Kelola pengajuan pengeluaran bahan baku, kemas, dan pendukung dari gudang ke divisi produksi / R&D."
        badge={<DnaBadge variant="neutral">SCR-033 / SCM-WH-REQ</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Permintaan Barang diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Buat Permintaan Barang
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Permintaan"
          value={`${kpis.total} Dokumen`}
          icon={<ClipboardList className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+3 minggu ini", isPositive: true }}
        />
        <DnaStatCard
          label="Menunggu Persetujuan"
          value={`${kpis.pending} Dokumen`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          variant={kpis.pending > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Disetujui & Siap Serah"
          value={`${kpis.approved} Dokumen`}
          icon={<Boxes className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="Total Unit Diminta"
          value={`${kpis.totalItemsCount.toLocaleString("id-ID")} Qty`}
          icon={<Warehouse className="w-5 h-5 text-blue-600" />}
        />
      </DnaKpiGrid>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua", count: dataList.length },
            { id: "PENDING", label: "Menunggu Approval", count: dataList.filter(d => d.status === "PENDING").length },
            { id: "APPROVED", label: "Siap Serah (Approved)", count: dataList.filter(d => d.status === "APPROVED").length },
            { id: "COMPLETED", label: "Selesai Diserahkan", count: dataList.filter(d => d.status === "COMPLETED").length },
            { id: "REJECTED", label: "Ditolak", count: dataList.filter(d => d.status === "REJECTED").length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Bon Permintaan Barang (Material Requisitions)"
        description="Semua pengeluaran stok harus melalui verifikasi ketersediaan dan serah terima resmi."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No Req, SPK, keperluan, pemohon..."
        actions={
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter Gudang"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Gudang Asal</option>
              <option value="WH-01">Gudang Bahan Baku (WH-01)</option>
              <option value="WH-02">Gudang Kemas (WH-02)</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Permintaan</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Gudang Asal</th>
                <th className="py-3 px-4">Tujuan / Divisi</th>
                <th className="py-3 px-4">No. SPK / Keperluan</th>
                <th className="py-3 px-4 text-center">Item</th>
                <th className="py-3 px-4">Pemohon</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen permintaan barang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                      {row.requisitionNumber}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {row.requestDate}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {row.fromWarehouse}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      <div className="font-semibold text-slate-900">{row.toDivision}</div>
                      {row.batchNumber && (
                        <div className="text-[11px] text-slate-500 font-mono">Lot: {row.batchNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs max-w-xs">
                      <div className="font-mono font-medium text-slate-900">{row.spkNumber}</div>
                      <div className="text-[11px] text-slate-500 truncate">{row.purpose}</div>
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-semibold text-slate-800">
                      {row.totalItems} Material
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {row.requestedBy}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedReq(row);
                            setIsDetailOpen(true);
                          }}
                        >
                          Detail
                        </DnaButton>
                        {row.status === "PENDING" && (
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handleApprove(row.id)}
                          >
                            Setujui
                          </DnaButton>
                        )}
                        {row.status === "APPROVED" && (
                          <DnaButton
                            variant="secondary"
                            size="sm"
                            icon={<Send className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => handleHandoverComplete(row.id)}
                          >
                            Serah Terima
                          </DnaButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Permintaan */}
      {selectedReq && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Permintaan Barang: ${selectedReq.requisitionNumber}`}
          description={`Pengajuan dari ${selectedReq.fromWarehouse} menuju ${selectedReq.toDivision}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Diajukan oleh: <span className="font-semibold text-slate-700">{selectedReq.requestedBy}</span> ({selectedReq.requestDate})
              </div>
              <div className="flex items-center gap-2">
                {selectedReq.status === "PENDING" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => {
                      handleApprove(selectedReq.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    Setujui Permintaan
                  </DnaButton>
                )}
                {selectedReq.status === "APPROVED" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    icon={<Send className="w-4 h-4" />}
                    onClick={() => {
                      handleHandoverComplete(selectedReq.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    Konfirmasi Serah Terima Barang
                  </DnaButton>
                )}
                <DnaButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </DnaButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">No. SPK / Referensi</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{selectedReq.spkNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Pengajuan</span>
                <div className="mt-0.5">{getStatusBadge(selectedReq.status)}</div>
              </div>
              <div>
                <span className="text-slate-500 block">Keperluan / Keterangan</span>
                <span className="text-slate-700">{selectedReq.purpose}</span>
              </div>
            </div>

            {selectedReq.approvalNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                <span className="font-bold block mb-1">Catatan Persetujuan / Penolakan:</span>
                {selectedReq.approvalNotes}
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Daftar Material yang Diminta</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Material</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-right">Stok Gudang</th>
                      <th className="py-2.5 px-3 text-right">Qty Diminta</th>
                      <th className="py-2.5 px-3">Satuan</th>
                      <th className="py-2.5 px-3 text-center">Status Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReq.items.map((it) => {
                      const isSufficient = it.availableStock >= it.requestedQty;
                      return (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-medium text-indigo-600">{it.materialCode}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{it.materialName}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-mono text-slate-700">
                              {it.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                            {it.availableStock.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                            {it.requestedQty.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{it.unit}</td>
                          <td className="py-2.5 px-3 text-center">
                            {isSufficient ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-semibold">
                                Tersedia
                              </span>
                            ) : (
                              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px] font-semibold">
                                Stok Defisit
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* Modal Buat Permintaan Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Pengajuan Bon Permintaan Barang"
        description="Isi form untuk meminta transfer material dari gudang penyimpanan ke line produksi atau divisi lain."
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={handleCreateRequisition}
            >
              Ajukan Permintaan
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Warehouse & Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Gudang Asal (Pengeluaran)</label>
              <select
                aria-label="Gudang Asal"
                value={fromWarehouse}
                onChange={(e) => setFromWarehouse(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {MASTER_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tujuan / Divisi Pemohon</label>
              <select
                aria-label="Tujuan Divisi"
                value={toDivision}
                onChange={(e) => setToDivision(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TARGET_DIVISIONS.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. SPK / No. Order Referensi *</label>
              <input
                type="text"
                placeholder="Contoh: SPK-2026-09-012"
                value={spkNumber}
                onChange={(e) => setSpkNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Batch / Lot (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: LOT-2026-09"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Keperluan / Keterangan Penggunaan *</label>
            <input
              type="text"
              placeholder="Contoh: Kebutuhan bahan baku produksi Face Wash Batch 1"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Item Adder */}
          <div className="border-t border-slate-200 pt-3">
            <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center justify-between">
              <span>Tambahkan Material</span>
              <span className="text-[11px] font-normal text-slate-500">{cartItems.length} Item dalam Keranjang</span>
            </h4>
            <div className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-end">
              <div className="col-span-6">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Pilih Material / Bahan</label>
                <select
                  aria-label="Pilih Material"
                  value={selectedMaterialCode}
                  onChange={(e) => setSelectedMaterialCode(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Material --</option>
                  {AVAILABLE_MATERIALS.map((m) => (
                    <option key={m.code} value={m.code}>
                      [{m.code}] {m.name} (Stok: {m.stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Qty Diminta</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={itemQty}
                  onChange={(e) => setItemQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-1.5 text-right font-mono"
                />
              </div>
              <div className="col-span-3">
                <DnaButton
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddItemToCart}
                >
                  Tambah
                </DnaButton>
              </div>
            </div>
          </div>

          {/* Cart Table */}
          {cartItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Kode</th>
                    <th className="py-2 px-3">Nama Material</th>
                    <th className="py-2 px-3 text-right">Stok Real</th>
                    <th className="py-2 px-3 text-right">Qty Diminta</th>
                    <th className="py-2 px-3">Satuan</th>
                    <th className="py-2 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map((c) => (
                    <tr key={c.materialCode}>
                      <td className="py-2 px-3 font-mono font-medium text-indigo-600">{c.materialCode}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{c.materialName}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{c.availableStock}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{c.requestedQty}</td>
                      <td className="py-2 px-3 text-slate-500">{c.unit}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(c.materialCode)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
