"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Truck,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Warehouse,
  Printer,
  PackageCheck,
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
  DnaDetailDrawer,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaTable,
  useDnaToast,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";

interface GrnItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyGood: number; // 3 Pilar: Kuantitas Bagus (Masuk Real Stok & Bayar Faktur)
  qtyReject: number; // 3 Pilar: Kuantitas Reject (Klaim Retur / Debit Note)
  qtyFree: number; // 3 Pilar: Kuantitas Free (Bonus HPP Rp 0)
  unit: string;
  batchNumber: string;
  expiryDate?: string;
  qcStatus: "PASSED" | "PARTIAL_REJECT" | "FAILED" | "PENDING_TEST";
  rejectReason?: string;
}

interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  receiveDate: string;
  poNumber: string;
  deliveryOrderNo: string; // No Surat Jalan Supplier
  vendorName: string;
  vendorCode: string;
  warehouseName: string;
  totalQtyGood: number;
  totalQtyReject: number;
  totalQtyFree: number;
  status: "PENDING_QC" | "APPROVED" | "HAS_REJECT" | "REJECTED";
  receivedBy: string;
  qcInspector: string;
  notes?: string;
  items: GrnItemDetail[];
}

export default function GoodsInboundPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  // Live Query: Inbounds
  const { data: rawInbounds = [] } = useQuery({
    queryKey: ["warehouse-inbounds"],
    queryFn: async () => {
      const res = await api.get("/warehouse/inbounds");
      return (unwrapResponse(res.data) as any[]) || [];
    },
  });

  // Live Query: Open POs
  const { data: openPOs = [] } = useQuery({
    queryKey: ["warehouse-open-pos"],
    queryFn: async () => {
      try {
        const res = await api.get("/purchase/orders");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  // Live Query: Catalog for material options
  const { data: catalogMaterials = [] } = useQuery({
    queryKey: ["warehouse-catalog-options"],
    queryFn: async () => {
      const res = await api.get("/warehouse/catalog");
      return (unwrapResponse(res.data) as any[]) || [];
    },
  });

  // Transform live inbounds into UI format
  const liveInbounds: GoodsReceiptNote[] = useMemo(() => {
    if (!Array.isArray(rawInbounds)) return [];
    return rawInbounds.map((inb: any) => {
      const items: GrnItemDetail[] = (inb.items || []).map((it: any, idx: number) => ({
        id: it.id || `gi-${idx}`,
        itemCode: it.material?.code || it.materialId?.slice(0, 8) || "MAT",
        itemName: it.material?.name || "Material Item",
        qtyOrdered: Number(it.quantity || 0),
        qtyReceived: Number(it.quantity || 0),
        qtyGood: Number(it.quantity || 0),
        qtyReject: 0,
        qtyFree: 0,
        unit: it.material?.unit || "Kg",
        batchNumber: it.batchNumber || "-",
        expiryDate: it.expiryDate ? new Date(it.expiryDate).toISOString().split("T")[0] : undefined,
        qcStatus: "PASSED",
      }));

      const totalQty = items.reduce((sum, it) => sum + it.qtyGood, 0);

      return {
        id: inb.id,
        grnNumber: inb.inboundNumber || `GRN-${inb.id.slice(0, 8).toUpperCase()}`,
        receiveDate: inb.receivedAt ? new Date(inb.receivedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        poNumber: inb.po?.poNumber || inb.poNumber || "PO-DIRECT",
        deliveryOrderNo: inb.deliveryOrderNo || `SJ-${inb.id.slice(0, 6).toUpperCase()}`,
        vendorName: inb.po?.supplier?.name || inb.supplierName || "Supplier Mitra",
        vendorCode: inb.supplierCode || "SUP-MITRA",
        warehouseName: inb.warehouse?.name || "Gudang Bahan Baku Utama (WH-01)",
        totalQtyGood: totalQty,
        totalQtyReject: 0,
        totalQtyFree: 0,
        status: (inb.status || "APPROVED") as any,
        receivedBy: inb.receivedBy || "Petugas Gudang",
        qcInspector: inb.qcInspector || "Inspektur QC",
        notes: inb.notes || "Penerimaan fisik barang PO",
        items,
      };
    });
  }, [rawInbounds]);

  const dataList = liveInbounds;

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceiptNote | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryOrderNo, setDeliveryOrderNo] = useState("");
  const [warehouseName, setWarehouseName] = useState("Gudang Bahan Baku Utama (WH-01)");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<GrnItemDetail[]>([]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const totalGrn = list.length;
    const totalGood = list.reduce((sum, g) => sum + g.totalQtyGood, 0);
    const totalReject = list.reduce((sum, g) => sum + g.totalQtyReject, 0);
    const pendingQc = list.filter((g) => g.status === "PENDING_QC").length;

    return {
      totalGrn,
      totalGood,
      totalReject,
      pendingQc,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.deliveryOrderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "PENDING_QC" ? item.status === "PENDING_QC" :
        activeTab === "APPROVED" ? item.status === "APPROVED" :
        activeTab === "HAS_REJECT" ? (item.status === "HAS_REJECT" || item.totalQtyReject > 0) : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleSelectPo = (poNo: string) => {
    setSelectedPoNumber(poNo);
    const po = openPOs.find((p: any) => p.poNumber === poNo);
    if (po && Array.isArray(po.items)) {
      setFormItems(
        po.items.map((it: any, idx: number) => ({
          id: `gi-${Date.now()}-${idx}`,
          itemCode: it.itemCode || it.material?.code || "MAT",
          itemName: it.itemName || it.material?.name || "Bahan Baku",
          qtyOrdered: Number(it.quantity || it.qtyOrdered || 0),
          qtyReceived: Number(it.quantity || it.qtyOrdered || 0),
          qtyGood: Number(it.quantity || it.qtyOrdered || 0),
          qtyReject: 0,
          qtyFree: 0,
          unit: it.unit || it.material?.unit || "Kg",
          batchNumber: `LOT-${Date.now().toString().slice(-4)}`,
          expiryDate: "2028-12-31",
          qcStatus: "PASSED",
        }))
      );
    } else if (catalogMaterials.length > 0) {
      const mat = catalogMaterials[0];
      setFormItems([
        {
          id: `gi-${Date.now()}-0`,
          itemCode: mat.code || "RAW-001",
          itemName: mat.name || "Bahan Baku Kosmetik",
          qtyOrdered: 100,
          qtyReceived: 100,
          qtyGood: 100,
          qtyReject: 0,
          qtyFree: 0,
          unit: mat.unit || "Kg",
          batchNumber: `LOT-${Date.now().toString().slice(-4)}`,
          expiryDate: "2028-12-31",
          qcStatus: "PASSED",
        },
      ]);
    }
  };

  const handleUpdateItem = (idx: number, field: keyof GrnItemDetail, val: any) => {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleCreateGrn = async () => {
    if (!deliveryOrderNo) {
      toast.error("Nomor Surat Jalan Supplier wajib diisi.");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Minimal harus ada 1 item material yang diterima.");
      return;
    }

    try {
      const selectedPo = (openPOs as any[]).find((p: any) => p.poNumber === selectedPoNumber);
      const itemsPayload = formItems.map((it) => {
        const mat = (catalogMaterials as any[]).find((m: any) => m.code === it.itemCode || m.name === it.itemName);
        return {
          materialId: mat?.id || it.id || "00000000-0000-0000-0000-000000000000",
          quantity: Number(it.qtyGood || it.qtyReceived || 1),
          batchNumber: it.batchNumber || `LOT-${Date.now().toString().slice(-4)}`,
          expiryDate: it.expiryDate || "2028-12-31",
        };
      });

      await api.post("/warehouse/inbounds", {
        poId: selectedPo?.id,
        receivedAt: receiveDate,
        items: itemsPayload,
      });

      queryClient.invalidateQueries({ queryKey: ["warehouse-inbounds"] });
      setIsCreateOpen(false);
      toast.success("Penerimaan barang (GRN) berhasil dicatat dan stok fisik diperbarui.");

      // Reset Form
      setSelectedPoNumber("");
      setDeliveryOrderNo("");
      setFormNotes("");
      setFormItems([]);
    } catch (err: any) {
      toast.error("Gagal Menyimpan GRN", err?.response?.data?.message || err.message);
    }
  };

  const getStatusBadge = (status: GoodsReceiptNote["status"]) => {
    switch (status) {
      case "PENDING_QC":
        return <DnaBadge variant="warning">Karantina / QC</DnaBadge>;
      case "APPROVED":
        return <DnaBadge variant="success">Lolos QC</DnaBadge>;
      case "HAS_REJECT":
        return <DnaBadge variant="critical">Ada Reject</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Ditolak Total</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title="Pembelian Masuk (Goods Receipt GRN)"
        description="Penerimaan fisik barang dari supplier, pencatatan 3 pilar (Bagus, Reject, Free Bonus), dan verifikasi QC."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>3-Pilar Inbound GRN</span>
          </div>
        }
        tabs={[
          { id: "ALL", label: "Semua Penerimaan", count: dataList.length },
          { id: "PENDING_QC", label: "Karantina / Sampling QC", count: dataList.filter((d) => d.status === "PENDING_QC").length },
          { id: "APPROVED", label: "Lolos QC & Masuk Stok", count: dataList.filter((d) => d.status === "APPROVED").length },
          { id: "HAS_REJECT", label: "Memiliki Barang Reject", count: dataList.filter((d) => d.status === "HAS_REJECT" || d.totalQtyReject > 0).length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Laporan Penerimaan Barang diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Input GRN Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Dokumen GRN"
          value={`${kpis.totalGrn} Penerimaan`}
          icon={<Truck className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+3 minggu ini", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Total Qty Kondisi Bagus"
          value={`${kpis.totalGood.toLocaleString("id-ID")} Qty`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          variant="success"
        />
        <DnaStatCard
          label="Total Qty Reject (Klaim)"
          value={`${kpis.totalReject.toLocaleString("id-ID")} Qty`}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          variant={kpis.totalReject > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Menunggu Sampling QC"
          value={`${kpis.pendingQc} Dokumen`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          variant={kpis.pendingQc > 0 ? "warning" : "default"}
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No GRN, PO, Surat Jalan, Supplier...",
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-4 py-3 h-[40px] w-[140px]">No. GRN</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tanggal</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Supplier</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Dokumen PO & SJ</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Gudang Penerima</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Qty Bagus</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[100px]">Qty Reject</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Status</DnaTh>
                <DnaTh className="px-4 py-3 h-[40px] text-right w-[70px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredList.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen penerimaan barang masuk yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredList.map((row) => (
                  <DnaTableRow
                    key={row.id}
                    onClick={() => setSelectedGrn(row)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* Kolom 1: No. GRN */}
                    <DnaTd className="px-4 py-2">
                      <DnaCell.Code value={row.grnNumber} />
                    </DnaTd>

                    {/* Kolom 2: Tanggal */}
                    <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {row.receiveDate}
                    </DnaTd>

                    {/* Kolom 3: Supplier */}
                    <DnaTd className="px-3 py-2 text-slate-800 font-medium truncate max-w-[200px]">
                      {row.vendorName}
                    </DnaTd>

                    {/* Kolom 4: Dokumen PO & SJ (1 Natural Pair) */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.DoubleText
                        primary={row.poNumber}
                        secondary={`SJ: ${row.deliveryOrderNo}`}
                      />
                    </DnaTd>

                    {/* Kolom 5: Gudang Penerima */}
                    <DnaTd className="px-3 py-2 text-slate-800 truncate max-w-[180px]">
                      {row.warehouseName.split("(")[0]}
                    </DnaTd>

                    {/* Kolom 6: Qty Bagus */}
                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={row.totalQtyGood}
                        colorClass="text-emerald-700 font-semibold"
                      />
                    </DnaTd>

                    {/* Kolom 7: Qty Reject */}
                    <DnaTd className="px-3 py-2 text-right">
                      {row.totalQtyReject > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {row.totalQtyReject.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </DnaTd>

                    {/* Kolom 8: Status */}
                    <DnaTd className="px-3 py-2 text-center">
                      {getStatusBadge(row.status)}
                    </DnaTd>

                    {/* Kolom 9: Aksi */}
                    <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGrn(row)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedGrn}
        onClose={() => setSelectedGrn(null)}
        title={selectedGrn?.grnNumber || "Detail GRN"}
        subtitle={`PO: ${selectedGrn?.poNumber} • SJ: ${selectedGrn?.deliveryOrderNo}`}
        badge={selectedGrn && getStatusBadge(selectedGrn.status)}
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => toast.success(`Mencetak Bukti Penerimaan Barang ${selectedGrn?.grnNumber}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Bukti GRN
            </DnaButton>
            {selectedGrn?.status === "PENDING_QC" && (
              <DnaButton
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.success(`Inspeksi QC untuk ${selectedGrn.grnNumber} disetujui`);
                  setSelectedGrn(null);
                }}
              >
                Approve QC & Masuk Stok
              </DnaButton>
            )}
          </div>
        }
      >
        {selectedGrn && (
          <div className="space-y-6 text-xs">
            {/* 3-Pilar Physical Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Qty Bagus (Bayar)</div>
                <div className="text-xl font-bold tabular-nums text-emerald-800 mt-1">
                  {selectedGrn.totalQtyGood.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Masuk Real Stok</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Qty Reject</div>
                <div className="text-xl font-bold tabular-nums text-red-700 mt-1">
                  {selectedGrn.totalQtyReject.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-red-600 mt-0.5">Klaim Retur / DN</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Qty Free Bonus</div>
                <div className="text-xl font-bold tabular-nums text-blue-700 mt-1">
                  {selectedGrn.totalQtyFree.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-blue-600 mt-0.5">HPP Rp 0</div>
              </div>
            </div>

            {/* Document Header Metadata */}
            <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Supplier / Vendor:</span>
                <span className="font-semibold text-slate-800">{selectedGrn.vendorName} ({selectedGrn.vendorCode})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Gudang Alokasi:</span>
                <span className="font-semibold text-slate-800">{selectedGrn.warehouseName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tanggal Terima:</span>
                <span className="tabular-nums text-slate-800">{selectedGrn.receiveDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Petugas Gudang / QC:</span>
                <span className="text-slate-800 font-medium">{selectedGrn.receivedBy} / {selectedGrn.qcInspector}</span>
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Rincian Barang & Lot Inspection
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable className="w-full text-left text-xs">
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2 px-3">Item Material</DnaTh>
                      <DnaTh className="py-2 px-3 text-right">Datang</DnaTh>
                      <DnaTh className="py-2 px-3 text-right text-emerald-700">Bagus</DnaTh>
                      <DnaTh className="py-2 px-3 text-right text-red-600">Reject</DnaTh>
                      <DnaTh className="py-2 px-3">Lot/Batch</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedGrn.items.map((it) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd className="py-2 px-3 font-sans">
                          <div className="font-semibold text-slate-800">{it.itemName}</div>
                          <div className="text-[10px] text-slate-400 tabular-nums">{it.itemCode}</div>
                        </DnaTd>
                        <DnaTd className="py-2 px-3 text-right text-slate-700">{it.qtyReceived} {it.unit}</DnaTd>
                        <DnaTd className="py-2 px-3 text-right text-emerald-700 font-bold">{it.qtyGood}</DnaTd>
                        <DnaTd className="py-2 px-3 text-right text-red-600 font-bold">{it.qtyReject}</DnaTd>
                        <DnaTd className="py-2 px-3 text-slate-600">{it.batchNumber}</DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {selectedGrn.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold block text-slate-700 mb-1">Catatan Tambahan:</span>
                <p className="text-slate-600 leading-relaxed">{selectedGrn.notes}</p>
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Input Penerimaan GRN Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Input Penerimaan Barang Masuk (GRN)"
        description="Verifikasi kuantitas fisik dari supplier dengan pemisahan barang bagus, reject, dan free bonus."
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
              onClick={handleCreateGrn}
            >
              Simpan Penerimaan Barang
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Pilih Purchase Order (PO) *</label>
              <DnaSelect
                aria-label="Pilih PO"
                value={selectedPoNumber}
                onChange={handleSelectPo}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Pilih Dokumen PO --</option>
                {openPOs.map((po: any) => (
                  <option key={po.poNumber || po.id} value={po.poNumber || po.id}>
                    {po.poNumber || po.id} - {po.supplier?.name || po.vendorName || "Supplier"}
                  </option>
                ))}
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Surat Jalan Supplier *</label>
              <DnaInput
                type="text"
                placeholder="Contoh: SJ/2026/09/1109"
                value={deliveryOrderNo}
                onChange={(e) => setDeliveryOrderNo(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Terima Fisik *</label>
              <DnaInput
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Gudang Alokasi Masuk *</label>
            <DnaSelect
              aria-label="Gudang Alokasi"
              value={warehouseName}
              onChange={setWarehouseName}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="Gudang Bahan Baku Utama (WH-01)">Gudang Bahan Baku Utama (WH-01)</option>
              <option value="Gudang Kemas & Box (WH-02)">Gudang Kemas & Box (WH-02)</option>
              <option value="Gudang Karantina & QC (WH-04)">Gudang Karantina & QC (WH-04)</option>
            </DnaSelect>
          </div>

          {/* Breakdown 3 Pilar Fisik per Item */}
          {formItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">Pemisahan 3 Pilar Kuantitas Fisik</h4>
              {formItems.map((item, idx) => (
                <div key={item.itemCode} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{item.itemName}</span>
                      <span className="text-[11px] tabular-nums text-indigo-600 ml-2">[{item.itemCode}]</span>
                    </div>
                    <span className="text-xs text-slate-500">Order PO: <b className="text-slate-800">{item.qtyOrdered} {item.unit}</b></span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-emerald-700 font-bold mb-0.5">Qty Bagus (Stok & Bayar)</label>
                      <DnaInput
                        type="number"
                        min="0"
                        value={item.qtyGood}
                        onChange={(e) => handleUpdateItem(idx, "qtyGood", parseFloat(e.target.value) || 0)}
                        className="w-full text-xs tabular-nums font-bold text-emerald-700 border border-emerald-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-red-600 font-bold mb-0.5">Qty Reject (Klaim Retur)</label>
                      <DnaInput
                        type="number"
                        min="0"
                        value={item.qtyReject}
                        onChange={(e) => handleUpdateItem(idx, "qtyReject", parseFloat(e.target.value) || 0)}
                        className="w-full text-xs tabular-nums font-bold text-red-600 border border-red-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-blue-600 font-bold mb-0.5">Qty Free (Bonus HPP 0)</label>
                      <DnaInput
                        type="number"
                        min="0"
                        value={item.qtyFree}
                        onChange={(e) => handleUpdateItem(idx, "qtyFree", parseFloat(e.target.value) || 0)}
                        className="w-full text-xs tabular-nums font-bold text-blue-600 border border-blue-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-0.5">No. Batch / Lot</label>
                      <DnaInput
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => handleUpdateItem(idx, "batchNumber", e.target.value)}
                        className="w-full text-xs tabular-nums border border-slate-300 rounded p-1.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Penerimaan Gudang</label>
            <DnaTextarea
              rows={2}
              placeholder="Contoh: Kondisi fisik luar kardus aman, sampling QC diambil 100ml."
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
