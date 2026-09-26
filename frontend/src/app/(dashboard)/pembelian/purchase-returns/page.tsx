"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  RotateCcw,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Send,
  Trash2,
  DollarSign,
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
  DnaDetailDrawer,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface ReturnItem {
  id: string;
  itemCode: string;
  itemName: string;
  qtyReturned: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  rejectReason: string;
}

interface PurchaseReturn {
  id: string;
  returnNumber: string;
  returnDate: string;
  poNumber: string;
  grnNumber: string;
  vendorName: string;
  vendorCode: string;
  compensationType: "POTONG_TAGIHAN" | "GANTI_BARANG" | "REFUND_DANA";
  totalQty: number;
  totalAmount: number;
  // Mirrors the backend `PurchaseReturnStatus` enum (purchase-return.dto.ts) exactly. There is
  // no APPROVED and no REJECTED state on the server; the old UI vocabulary invented both and
  // rendered DRAFT/CANCELLED rows as "Disetujui Vendor".
  status: "DRAFT" | "WAITING_APPROVAL" | "COMPLETED" | "CANCELLED";
  pic: string;
  notes?: string;
  items: ReturnItem[];
}

export default function PurchaseReturnsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Retur Pembelian...</div>}>
      <PurchaseReturnsContent />
    </Suspense>
  );
}

function PurchaseReturnsContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const { data: rawReturns, isLoading, isError, refetch } = useQuery({
    queryKey: ["purchase-returns"],
    queryFn: async () => {
      const res = await api.get("/purchase/returns");
      return unwrapResponse(res) || [];
    },
  });

  const { data: rawInbounds } = useQuery({
    queryKey: ["warehouse-inbounds"],
    queryFn: async () => {
      const res = await api.get("/scm/inbounds");
      return unwrapResponse(res) || [];
    },
  });

  const availableInbounds = useMemo(() => {
    if (!rawInbounds || !Array.isArray(rawInbounds)) return [];
    return rawInbounds.map((inb: any) => ({
      id: inb.id,
      grnNumber: inb.inboundNumber || `GRN-${inb.id.slice(0, 8)}`,
      poNumber: inb.po?.poNumber || inb.poNumber || "-",
      vendorName: inb.supplier?.name || inb.vendorName || "-",
      vendorId: inb.supplierId || inb.vendorId,
      warehouseId: inb.warehouseId,
      items: (inb.items || []).map((it: any) => ({
        materialId: it.materialId,
        itemCode: it.material?.sku || it.itemCode || "MAT",
        itemName: it.material?.name || it.itemName || "Material",
        qtyReceived: Number(it.qtyGood || it.qtyActual || 0),
        unit: it.material?.unit || "Kg",
        unitPrice: Number(it.unitPrice || 0),
      })),
    }));
  }, [rawInbounds]);

  const dataList: PurchaseReturn[] = useMemo(() => {
    if (!rawReturns || !Array.isArray(rawReturns)) return [];
    return rawReturns.map((r: any) => ({
      id: r.id,
      returnNumber: r.returnNumber || `RET-${r.id.slice(0, 8)}`,
      returnDate: r.date ? r.date.split("T")[0] : "",
      poNumber: r.inbound?.po?.poNumber || r.poNumber || "-",
      grnNumber: r.inbound?.inboundNumber || r.grnNumber || "-",
      vendorName: r.supplier?.name || r.supplierName || r.vendorName || "-",
      vendorCode: r.supplierId?.slice(0, 8) || "SUP",
      compensationType: "POTONG_TAGIHAN",
      totalQty: (r.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0),
      totalAmount: Number(r.totalValue || r.debitNoteAmount || 0),
      status: (["DRAFT", "WAITING_APPROVAL", "COMPLETED", "CANCELLED"] as const).includes(r.status)
        ? r.status
        : "DRAFT",
      pic: r.creator?.fullName || "SCM Staff",
      notes: r.notes || "",
      items: (r.items || []).map((it: any) => ({
        id: it.id,
        itemCode: it.material?.sku || "MAT",
        itemName: it.material?.name || "Material",
        qtyReturned: Number(it.quantity || 0),
        unit: it.material?.unit || "Kg",
        unitPrice: Number(it.unitPrice || 0),
        totalPrice: Number(it.totalPrice || 0),
        rejectReason: it.reason || "Cacat kualitas",
      })),
    }));
  }, [rawReturns]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [compensationFilter, setCompensationFilter] = useState("ALL");
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [selectedGrnId, setSelectedGrnId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [compensationType, setCompensationType] = useState<PurchaseReturn["compensationType"]>("POTONG_TAGIHAN");
  const [formNotes, setFormNotes] = useState("");
  const [items, setItems] = useState<ReturnItem[]>([
    {
      id: "it-1",
      itemCode: "BBK00019",
      itemName: "Niacinamide PC Grade (Reject)",
      qtyReturned: 5,
      unit: "Kg",
      unitPrice: 350000,
      totalPrice: 1750000,
      rejectReason: "Warna bahan menguning (Oksidasi / tidak lolos QC)",
    },
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const total = list.length;
    const totalValue = list.reduce((sum, r) => sum + r.totalAmount, 0);
    const pending = list.filter((r) => r.status === "WAITING_APPROVAL").length;
    const approved = list.filter((r) => r.status === "COMPLETED").length;

    return {
      total,
      totalValue,
      pending,
      approved,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab = activeTab === "ALL" ? true : item.status === activeTab;

      const matchComp = compensationFilter === "ALL" ? true : item.compensationType === compensationFilter;

      return matchSearch && matchTab && matchComp;
    });
  }, [dataList, searchQuery, activeTab, compensationFilter]);

  const handleSelectGrn = (grnId: string) => {
    setSelectedGrnId(grnId);
    const inb = availableInbounds.find((i) => i.id === grnId);
    if (inb && inb.items.length > 0) {
      setItems(
        inb.items.map((it: any, idx: number) => ({
          id: `item-${idx}`,
          itemCode: it.itemCode,
          itemName: it.itemName,
          qtyReturned: 1,
          unit: it.unit,
          unitPrice: it.unitPrice,
          totalPrice: it.unitPrice,
          rejectReason: "Barang cacat/reject saat inbound",
        }))
      );
    }
  };

  const handleUpdateItem = (index: number, field: keyof ReturnItem, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };
    if (field === "qtyReturned" || field === "unitPrice") {
      current.totalPrice = (current.qtyReturned || 0) * (current.unitPrice || 0);
    }
    newItems[index] = current;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `it-${Date.now()}`,
        itemCode: "",
        itemName: "",
        qtyReturned: 1,
        unit: "Kg",
        unitPrice: 0,
        totalPrice: 0,
        rejectReason: "Cacat fisik kemasan / formula",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const formTotalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + it.totalPrice, 0);
  }, [items]);

  const createReturnMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/returns", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      toast.success("Pengajuan retur berhasil dibuat & diteruskan ke supplier.");
      setIsCreateOpen(false);
      setSelectedGrnId("");
      setFormNotes("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat pengajuan retur");
    },
  });

  const handleCreateReturn = () => {
    if (!selectedGrnId) {
      toast.error("Pilih dokumen GRN referensi barang yang diretur");
      return;
    }
    if (items.length === 0 || !items[0].itemName) {
      toast.error("Isi minimal 1 detail item barang yang diretur");
      return;
    }

    const inb = availableInbounds.find((i) => i.id === selectedGrnId);
    createReturnMutation.mutate({
      supplierId: inb?.vendorId,
      inboundId: inb?.id,
      date: returnDate,
      notes: formNotes || `Retur kompensasi ${compensationType}`,
      items: items.map((it) => ({
        materialId: (it as any).materialId || "mat-001",
        quantity: it.qtyReturned,
        unitPrice: it.unitPrice,
        reason: it.rejectReason,
      })),
    });
  };

  // POST /purchase/returns/:id/approve. The backend moves the return to COMPLETED (there is no
  // APPROVED state), so the toast says what actually happened rather than "Disetujui Vendor".
  const approveReturnMut = useMutation({
    mutationFn: async (id: string) => unwrapResponse(await api.post(`/purchase/returns/${id}/approve`)),
    onSuccess: (_data, id) => {
      toast.success("Klaim retur disetujui & ditutup (Debit Note diterbitkan).");
      if (selectedReturn?.id === id) setSelectedReturn(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  // PATCH /purchase/returns/:id/status { status: "COMPLETED" }.
  const completeReturnMut = useMutation({
    mutationFn: async (id: string) =>
      unwrapResponse(await api.patch(`/purchase/returns/${id}/status`, { status: "COMPLETED" })),
    onSuccess: (_data, id) => {
      toast.success("Kompensasi retur selesai (Barang pengganti diterima / Tagihan dipotong).");
      if (selectedReturn?.id === id) setSelectedReturn(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const handleApproveVendor = (id: string) => approveReturnMut.mutate(id);
  const handleCompleteReturn = (id: string) => completeReturnMut.mutate(id);

  const getStatusBadge = (status: PurchaseReturn["status"]) => {
    switch (status) {
      case "DRAFT":
        return <DnaBadge variant="neutral">Draft</DnaBadge>;
      case "WAITING_APPROVAL":
        return <DnaBadge variant="warning">Menunggu Persetujuan</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai Kompensasi</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
    }
  };

  const getCompensationBadge = (comp: PurchaseReturn["compensationType"]) => {
    switch (comp) {
      case "POTONG_TAGIHAN":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">Debit Note</span>;
      case "GANTI_BARANG":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">Tukar Barang</span>;
      case "REFUND_DANA":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Refund Dana</span>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Unified Tabs */}
      <DnaPageHeader
        title="Retur Pembelian (Purchase Returns)"
        description="Kelola klaim retur barang reject dari gudang ke supplier, penerbitan Debit Note, dan penggantian material."
        badge={<DnaBadge variant="neutral">SCR-042 / SCM-PUR-RET</DnaBadge>}
        tabs={[
          { key: "ALL", label: "Semua", count: dataList.length },
          { key: "DRAFT", label: "Draft", count: dataList.filter((d) => d.status === "DRAFT").length },
          { key: "WAITING_APPROVAL", label: "Menunggu Persetujuan", count: dataList.filter((d) => d.status === "WAITING_APPROVAL").length },
          { key: "COMPLETED", label: "Selesai", count: dataList.filter((d) => d.status === "COMPLETED").length },
          { key: "CANCELLED", label: "Dibatalkan", count: dataList.filter((d) => d.status === "CANCELLED").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Retur Pembelian diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Buat Retur Pembelian
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Klaim Retur"
          value={`${kpis.total} Kasus`}
          icon={<RotateCcw className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+2 minggu ini", isPositive: true }}
        />
        <DnaStatCard
          label="Nilai Klaim Aktif"
          value={`Rp ${kpis.totalValue.toLocaleString("id-ID")}`}
          icon={<DollarSign className="w-5 h-5 text-purple-600" />}
        />
        <DnaStatCard
          label="Menunggu Vendor"
          value={`${kpis.pending} Dokumen`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          variant={kpis.pending > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Selesai / Terkompensasi"
          value={`${kpis.approved} Dokumen`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Data Retur Pembelian"
            message="Terjadi kesalahan saat menghubungi server. Silakan coba lagi."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari No Retur, PO, GRN, supplier..."
          actions={
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter Kompensasi"
                value={compensationFilter}
                onChange={(e) => setCompensationFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Jenis Kompensasi</option>
                <option value="POTONG_TAGIHAN">Debit Note (Potong Faktur)</option>
                <option value="GANTI_BARANG">Tukar Barang Baru</option>
                <option value="REFUND_DANA">Refund Dana</option>
              </select>
            </div>
          }
        >
          <div className="w-full">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-3 px-4 w-[20%]">NO. RETUR & TANGGAL</DnaTh>
                  <DnaTh className="py-3 px-4 w-[24%]">SUPPLIER & REF (PO/GRN)</DnaTh>
                  <DnaTh className="py-3 px-4 w-[16%]">KUANTITAS & KOMPENSASI</DnaTh>
                  <DnaTh className="py-3 px-4 text-right w-[16%]">NILAI KLAIM (DEBIT NOTE)</DnaTh>
                  <DnaTh className="py-3 px-4 text-center w-[14%]">STATUS</DnaTh>
                  <DnaTh className="py-3 px-4 text-right w-[10%]">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada Retur Pembelian"
                        description="Belum ada data retur pembelian atau tidak ada hasil yang sesuai dengan filter."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredList.map((row) => (
                    <DnaTableRow
                      key={row.id}
                      onClick={() => setSelectedReturn(row)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <DnaTd className="py-3 px-4">
                        <span className="tabular-nums font-bold text-indigo-600 block truncate">
                          {row.returnNumber}
                        </span>
                        <span className="text-[11px] tabular-nums text-slate-500 block truncate">
                          {row.returnDate}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate">
                          {row.vendorName}
                        </span>
                        <span className="text-[11px] tabular-nums text-slate-500 block truncate">
                          {row.poNumber} • {row.grnNumber}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {row.totalQty.toLocaleString("id-ID")} Item
                        </span>
                        <div className="mt-0.5">{getCompensationBadge(row.compensationType)}</div>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <span className="tabular-nums font-bold text-red-600 block text-xs">
                          Rp {row.totalAmount.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Pengurang Hutang</span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-center">
                        {getStatusBadge(row.status)}
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedReturn(row)}
                          >
                            Detail
                          </DnaButton>
                          {row.status === "WAITING_APPROVAL" && (
                            <DnaButton
                              variant="primary"
                              size="sm"
                              loading={approveReturnMut.isPending}
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handleApproveVendor(row.id)}
                            >
                              Setujui
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
      )}

      {/* DnaDetailDrawer for Return Inspection */}
      <DnaDetailDrawer
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={selectedReturn?.returnNumber || "Rincian Retur Pembelian"}
        subtitle={selectedReturn ? `Supplier: ${selectedReturn.vendorName} • PO: ${selectedReturn.poNumber}` : undefined}
        badge={selectedReturn ? getStatusBadge(selectedReturn.status) : undefined}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              PIC Pengajuan: <span className="font-semibold text-slate-700">{selectedReturn?.pic}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedReturn?.status === "WAITING_APPROVAL" && (
                <DnaButton
                  variant="primary"
                  size="sm"
                  loading={approveReturnMut.isPending}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => handleApproveVendor(selectedReturn.id)}
                >
                  Setujui Klaim Retur
                </DnaButton>
              )}
              {selectedReturn?.status === "DRAFT" && (
                <DnaButton
                  variant="primary"
                  size="sm"
                  loading={completeReturnMut.isPending}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => handleCompleteReturn(selectedReturn.id)}
                >
                  Tandai Kompensasi Selesai
                </DnaButton>
              )}
              <DnaButton variant="outline" size="sm" onClick={() => setSelectedReturn(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        }
      >
        {selectedReturn && (
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Referensi Inbound</span>
                <span className="font-bold text-slate-900 tabular-nums text-xs block">{selectedReturn.poNumber}</span>
                <span className="text-slate-500 text-[11px] mt-0.5">GRN: {selectedReturn.grnNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Total Nilai Debit Note</span>
                <span className="font-bold text-red-600 tabular-nums text-sm block">
                  Rp {selectedReturn.totalAmount.toLocaleString("id-ID")}
                </span>
                <div className="mt-0.5">{getCompensationBadge(selectedReturn.compensationType)}</div>
              </div>
            </div>

            {/* Sub-tabel Item Retur */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Daftar Barang yang Diretur ({selectedReturn.items.length} Item)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3">Kode</DnaTh>
                      <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Harga</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Total Nilai</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedReturn.items.map((it) => (
                      <DnaTableRow key={it.id} className="hover:bg-slate-50">
                        <DnaTd className="py-2.5 px-3 text-indigo-600 font-medium">{it.itemCode}</DnaTd>
                        <DnaTd className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                          {it.itemName}
                          <p className="text-[10px] text-rose-600 font-normal font-sans">{it.rejectReason}</p>
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right text-slate-700">
                          {it.qtyReturned} {it.unit}
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right text-slate-600">
                          Rp {it.unitPrice.toLocaleString("id-ID")}
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right font-bold text-red-600">
                          Rp {it.totalPrice.toLocaleString("id-ID")}
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Buat Retur Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Pengajuan Retur Pembelian (Debit Note)"
        description="Pilih dokumen penerimaan barang (GRN) yang memiliki material reject/cacat untuk dikembalikan ke supplier."
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="sm" icon={<Send className="w-4 h-4" />} onClick={handleCreateReturn}>
              Kirim Pengajuan Retur
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Pilih Dokumen GRN Asal *</label>
              <select
                aria-label="Pilih GRN"
                value={selectedGrnId}
                onChange={(e) => handleSelectGrn(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Pilih GRN Penerimaan --</option>
                {availableInbounds.map((inb) => (
                  <option key={inb.id} value={inb.id}>
                    {inb.grnNumber} - {inb.vendorName} ({inb.poNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Pengajuan *</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Pilihan Kompensasi yang Diharapkan *</label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                  compensationType === "POTONG_TAGIHAN"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="compType"
                  checked={compensationType === "POTONG_TAGIHAN"}
                  onChange={() => setCompensationType("POTONG_TAGIHAN")}
                  className="text-indigo-600"
                />
                Debit Note (Potong Faktur)
              </label>
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                  compensationType === "GANTI_BARANG"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="compType"
                  checked={compensationType === "GANTI_BARANG"}
                  onChange={() => setCompensationType("GANTI_BARANG")}
                  className="text-indigo-600"
                />
                Tukar Barang Baru
              </label>
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                  compensationType === "REFUND_DANA"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="compType"
                  checked={compensationType === "REFUND_DANA"}
                  onChange={() => setCompensationType("REFUND_DANA")}
                  className="text-indigo-600"
                />
                Refund Dana Transfer
              </label>
            </div>
          </div>

          {/* Dynamic Items Table */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[10px]">
                Item Barang yang Diretur ({items.length})
              </span>
              <DnaButton type="button" size="sm" variant="secondary" onClick={handleAddItem}>
                + Tambah Item
              </DnaButton>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className="w-24">
                      <input
                        placeholder="Kode"
                        value={item.itemCode}
                        onChange={(e) => handleUpdateItem(idx, "itemCode", e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 tabular-nums"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        placeholder="Nama Bahan / Kemasan"
                        value={item.itemName}
                        onChange={(e) => handleUpdateItem(idx, "itemName", e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded p-1.5"
                      />
                    </div>
                    <div className="w-16">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qtyReturned}
                        onChange={(e) => handleUpdateItem(idx, "qtyReturned", Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 text-right tabular-nums"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Harga"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, "unitPrice", Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded p-1.5 text-right tabular-nums"
                      />
                    </div>
                    <div className="w-24 text-right font-bold text-red-600 tabular-nums text-[11px]">
                      Rp {item.totalPrice.toLocaleString("id-ID")}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <input
                      placeholder="Alasan reject (contoh: Kontaminasi fisik, bocor, kadaluarsa)..."
                      value={item.rejectReason}
                      onChange={(e) => handleUpdateItem(idx, "rejectReason", e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
              <span className="font-bold text-slate-600">Total Nilai Debit Note:</span>
              <span className="text-sm font-bold text-red-600 tabular-nums">
                Rp {formTotalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan untuk supplier..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
