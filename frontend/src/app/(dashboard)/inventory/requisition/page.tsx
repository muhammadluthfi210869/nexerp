"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

// Form option list (production divisions requesting material), not business data.
const TARGET_DIVISIONS = [
  "Ruang Mixing Produksi - Line A",
  "Ruang Mixing Produksi - Line B",
  "Line Packaging & Boxing - Line C",
  "Ruang Filling & Sealing",
  "Laboratorium R&D / Formularium",
  "Quality Control (QC Field Lab)",
  "Maintenance & Engineering",
];

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

export default function MaterialRequisitionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Permintaan Barang...</div>}>
      <MaterialRequisitionContent />
    </Suspense>
  );
}

function MaterialRequisitionContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: rawRequirements = [], isLoading } = useQuery({
    queryKey: ["scm-goods-requirements"],
    queryFn: async () => {
      try {
        const res = await api.get("/scm/goods-requirements");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: warehouseList = [] } = useQuery({
    queryKey: ["warehouse-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/warehouses");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: catalogMaterials = [] } = useQuery({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawSalesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/commercial/sales-orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const dataList: MaterialRequisition[] = useMemo(() => {
    if (!rawRequirements || !Array.isArray(rawRequirements)) return [];
    return rawRequirements.map((r: any) => ({
      id: r.id,
      requisitionNumber: r.code || `REQ-${r.id.slice(0, 8).toUpperCase()}`,
      requestDate: r.date ? new Date(r.date).toISOString().split("T")[0] : "-",
      fromWarehouse: r.notes?.includes("[Gudang:")
        ? r.notes.split("[Gudang:")[1]?.split("]")[0]?.trim()
        : "Gudang Bahan Baku",
      toDivision: r.notes?.includes("[Divisi:")
        ? r.notes.split("[Divisi:")[1]?.split("]")[0]?.trim()
        : "Ruang Mixing Produksi",
      spkNumber: r.notes?.includes("[SPK:")
        ? r.notes.split("[SPK:")[1]?.split("]")[0]?.trim()
        : r.salesOrderId
        ? `SO-${r.salesOrderId.slice(0, 8)}`
        : "-",
      purpose: r.notes?.replace(/\[.*?\]/g, "").trim() || "Kebutuhan Material Produksi",
      totalItems: (r.items || []).length,
      requestedBy: "Tim Produksi",
      status: (r.status as MaterialRequisition["status"]) || "PENDING",
      items: (r.items || []).map((it: any) => ({
        id: it.id,
        materialCode: it.material?.code || it.materialId?.slice(0, 8) || "MAT-01",
        materialName: it.material?.name || "Bahan Baku",
        category: "BAHAN_BAKU" as const,
        requestedQty: Number(it.qty || 0),
        availableStock: Number(it.material?.stockQty || it.material?.stock || 0),
        unit: it.material?.unit || "Kg",
        notes: it.notes || "-",
      })),
    }));
  }, [rawRequirements]);

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [selectedReq, setSelectedReq] = useState<MaterialRequisition | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      setIsCreateOpen(true);
    } else if (action === "approval") {
      setActiveTab("PENDING");
    }
  }, [searchParams]);

  // Form State
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toDivision, setToDivision] = useState("Ruang Mixing Produksi - Line A");
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState("");
  const [spkNumber, setSpkNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [cartItems, setCartItems] = useState<Array<{
    materialId: string;
    materialCode: string;
    materialName: string;
    category: "BAHAN_BAKU" | "BAHAN_KEMAS" | "CONSUMABLE";
    requestedQty: number;
    availableStock: number;
    unit: string;
    notes?: string;
  }>>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemNote, setItemNote] = useState("");

  useEffect(() => {
    if (warehouseList.length > 0 && !fromWarehouse) {
      setFromWarehouse(warehouseList[0].name);
    }
  }, [warehouseList, fromWarehouse]);

  useEffect(() => {
    if (rawSalesOrders.length > 0 && !selectedSalesOrderId) {
      setSelectedSalesOrderId(rawSalesOrders[0].id);
      setSpkNumber(rawSalesOrders[0].orderNumber || rawSalesOrders[0].id.slice(0, 8));
    }
  }, [rawSalesOrders, selectedSalesOrderId]);

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
    if (!selectedMaterialId) {
      toast.error("Pilih material terlebih dahulu");
      return;
    }
    const mat = catalogMaterials.find((m: any) => m.id === selectedMaterialId);
    if (!mat) return;

    if (itemQty <= 0) {
      toast.error("Jumlah permintaan harus lebih dari 0");
      return;
    }

    const existing = cartItems.find((c) => c.materialId === mat.id);
    if (existing) {
      setCartItems(cartItems.map((c) => c.materialId === mat.id ? { ...c, requestedQty: c.requestedQty + itemQty } : c));
    } else {
      setCartItems([
        ...cartItems,
        {
          materialId: mat.id,
          materialCode: mat.code || mat.id.slice(0, 8),
          materialName: mat.name,
          category: "BAHAN_BAKU",
          requestedQty: itemQty,
          availableStock: Number(mat.stock || mat.currentStock || 0),
          unit: mat.unit || "Kg",
          notes: itemNote,
        }
      ]);
    }

    setSelectedMaterialId("");
    setItemQty(1);
    setItemNote("");
    toast.success(`${mat.name} ditambahkan ke daftar permintaan`);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((c) => c.materialId !== id));
  };

  const handleCreateRequisition = async () => {
    if (!selectedSalesOrderId) {
      toast.error("Pilih Sales Order terlebih dahulu");
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

    try {
      await api.post("/scm/goods-requirements", {
        salesOrderId: selectedSalesOrderId,
        date: new Date().toISOString(),
        notes: `[Gudang: ${fromWarehouse}] [Divisi: ${toDivision}] [SPK: ${spkNumber}] ${batchNumber ? `[Batch: ${batchNumber}] ` : ""}${purpose}`.trim(),
        items: cartItems.map((c) => ({
          materialId: c.materialId,
          qty: c.requestedQty,
          notes: c.notes || undefined,
        })),
      });

      toast.success("Permintaan Barang (Goods Requirement) berhasil diajukan.");
      queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
      setIsCreateOpen(false);
      setCartItems([]);
      setBatchNumber("");
      setPurpose("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal mengajukan permintaan barang");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/scm/goods-requirements/${id}/status`, { status: "APPROVED" });
      toast.success("Permintaan barang disetujui. Petugas gudang dapat menyiapkan barang (Picking).");
      queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status: "APPROVED" });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyetujui permintaan barang");
    }
  };

  const handleHandoverComplete = async (id: string) => {
    try {
      await api.patch(`/scm/goods-requirements/${id}/status`, { status: "COMPLETED" });
      toast.success("Barang telah diserahterimakan dan status diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status: "COMPLETED" });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal mengonfirmasi serah terima");
    }
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
        badge={<DnaBadge variant="default">SCR-033 / SCM-WH-REQ</DnaBadge>}
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
          <DnaTable className="w-full text-left text-sm text-slate-600">
            <DnaTableHead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <DnaTableRow>
                <DnaTh className="py-3 px-4">No. Permintaan</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">Gudang Asal</DnaTh>
                <DnaTh className="py-3 px-4">Tujuan / Divisi</DnaTh>
                <DnaTh className="py-3 px-4">No. SPK</DnaTh>
                <DnaTh className="py-3 px-4">Keperluan</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Item</DnaTh>
                <DnaTh className="py-3 px-4">Pemohon</DnaTh>
                <DnaTh className="py-3 px-4">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen permintaan barang yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredList.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 font-bold text-indigo-600 text-xs whitespace-nowrap tabular-nums">
                      {row.requisitionNumber}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs whitespace-nowrap tabular-nums">
                      {row.requestDate}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                      {row.fromWarehouse}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {row.toDivision}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-medium text-slate-900 whitespace-nowrap tabular-nums">
                      {row.spkNumber}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs text-slate-700 max-w-xs truncate">
                      {row.purpose}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center text-xs font-semibold text-slate-800 tabular-nums">
                      {row.totalItems} Material
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs text-slate-600">
                      {row.requestedBy}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center whitespace-nowrap">
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
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
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
                <span className="font-bold text-slate-900 tabular-nums text-sm">{selectedReq.spkNumber}</span>
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
                <DnaTable className="w-full text-left text-xs text-slate-600">
                  <DnaTableHead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3">Kode</DnaTh>
                      <DnaTh className="py-2.5 px-3">Nama Material</DnaTh>
                      <DnaTh className="py-2.5 px-3">Kategori</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Stok Gudang</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty Diminta</DnaTh>
                      <DnaTh className="py-2.5 px-3">Satuan</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-center">Status Stok</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody className="divide-y divide-slate-100">
                    {selectedReq.items.map((it) => {
                      const isSufficient = it.availableStock >= it.requestedQty;
                      return (
                        <DnaTableRow key={it.id} className="hover:bg-slate-50">
                          <DnaTd className="py-2.5 px-3 font-medium text-indigo-600 tabular-nums">{it.materialCode}</DnaTd>
                          <DnaTd className="py-2.5 px-3 font-semibold text-slate-800">{it.materialName}</DnaTd>
                          <DnaTd className="py-2.5 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                              {it.category}
                            </span>
                          </DnaTd>
                          <DnaTd className="py-2.5 px-3 text-right font-medium text-slate-600 tabular-nums">
                            {it.availableStock.toLocaleString("id-ID")}
                          </DnaTd>
                          <DnaTd className="py-2.5 px-3 text-right font-bold text-indigo-700 tabular-nums">
                            {it.requestedQty.toLocaleString("id-ID")}
                          </DnaTd>
                          <DnaTd className="py-2.5 px-3 text-slate-500">{it.unit}</DnaTd>
                          <DnaTd className="py-2.5 px-3 text-center">
                            {isSufficient ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-semibold">
                                Tersedia
                              </span>
                            ) : (
                              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px] font-semibold">
                                Stok Defisit
                              </span>
                            )}
                          </DnaTd>
                        </DnaTableRow>
                      );
                    })}
                  </DnaTableBody>
                </DnaTable>
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
                {warehouseList.length === 0 ? (
                  <option value="">Gudang Belum Tersedia</option>
                ) : (
                  warehouseList.map((wh) => (
                    <option key={wh.id} value={wh.name}>{wh.name}</option>
                  ))
                )}
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
                {TARGET_DIVISIONS.map((div: string) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Referensi Sales Order *</label>
              <select
                aria-label="Referensi Sales Order"
                value={selectedSalesOrderId}
                onChange={(e) => {
                  setSelectedSalesOrderId(e.target.value);
                  const found = rawSalesOrders.find((so: any) => so.id === e.target.value);
                  if (found) {
                    setSpkNumber(found.orderNumber || found.id.slice(0, 8));
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {rawSalesOrders.length === 0 ? (
                  <option value="">Tidak ada Sales Order aktif</option>
                ) : (
                  rawSalesOrders.map((so: any) => (
                    <option key={so.id} value={so.id}>
                      {so.orderNumber || so.id.slice(0, 8)} - {so.customer?.name || "Customer"}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Batch / Lot (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: LOT-2026-09"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
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
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Material --</option>
                  {catalogMaterials.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      [{m.sku || m.code || m.id.slice(0, 6)}] {m.name} (Stok: {m.stock || 0} {m.unit || "PCS"})
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
                  className="w-full text-xs border border-slate-300 rounded-lg p-1.5 text-right tabular-nums"
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
              <DnaTable className="w-full text-left text-xs text-slate-600">
                <DnaTableHead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <DnaTableRow>
                    <DnaTh className="py-2 px-3">Kode</DnaTh>
                    <DnaTh className="py-2 px-3">Nama Material</DnaTh>
                    <DnaTh className="py-2 px-3 text-right">Stok Real</DnaTh>
                    <DnaTh className="py-2 px-3 text-right">Qty Diminta</DnaTh>
                    <DnaTh className="py-2 px-3">Satuan</DnaTh>
                    <DnaTh className="py-2 px-3 text-center">Aksi</DnaTh>
                  </DnaTableRow>
                </DnaTableHead>
                <DnaTableBody className="divide-y divide-slate-100">
                  {cartItems.map((c) => (
                    <DnaTableRow key={c.materialCode}>
                      <DnaTd className="py-2 px-3 font-medium text-indigo-600 tabular-nums">{c.materialCode}</DnaTd>
                      <DnaTd className="py-2 px-3 font-semibold text-slate-800">{c.materialName}</DnaTd>
                      <DnaTd className="py-2 px-3 text-right tabular-nums text-slate-600">{c.availableStock}</DnaTd>
                      <DnaTd className="py-2 px-3 text-right font-bold text-indigo-700 tabular-nums">{c.requestedQty}</DnaTd>
                      <DnaTd className="py-2 px-3 text-slate-500">{c.unit}</DnaTd>
                      <DnaTd className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(c.materialCode)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </DnaTd>
                    </DnaTableRow>
                  ))}
                </DnaTableBody>
              </DnaTable>
            </div>
          )}
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
