"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Trash2,
  FileText,
  Truck,
  DollarSign,
  PackageX,
  CreditCard,
  Building2,
  ArrowRight
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
  status: "PENDING_VENDOR" | "APPROVED" | "COMPLETED" | "REJECTED";
  pic: string;
  notes?: string;
  items: ReturnItem[];
}

const INITIAL_PURCHASE_RETURNS: PurchaseReturn[] = [
  {
    id: "ret-1",
    returnNumber: "RET-PO-202609-0004",
    returnDate: "2026-09-08",
    poNumber: "PO-202608-000033",
    grnNumber: "GRN-202609-0021",
    vendorName: "PT Sumber Organik Nusantara",
    vendorCode: "SUP-0012",
    compensationType: "POTONG_TAGIHAN",
    totalQty: 25,
    totalAmount: 3750000,
    status: "APPROVED",
    pic: "Mega Utami (SCM)",
    notes: "Barang rusak segel saat penerimaan QC. Vendor setuju potong faktur FP-202609-000001.",
    items: [
      {
        id: "ri-1",
        itemCode: "BBK00028",
        itemName: "Super Moisturing Max (Drum 25kg)",
        qtyReturned: 25,
        unit: "Kg",
        unitPrice: 150000,
        totalPrice: 3750000,
        rejectReason: "Segel drum rusak dan terjadi kontaminasi kelembaban tinggi (Uji Lab QC Reject)."
      }
    ]
  },
  {
    id: "ret-2",
    returnNumber: "RET-PO-202609-0003",
    returnDate: "2026-09-06",
    poNumber: "PO-202608-000029",
    grnNumber: "GRN-202609-0018",
    vendorName: "PT Kemasan Jaya Makmur",
    vendorCode: "SUP-0004",
    compensationType: "GANTI_BARANG",
    totalQty: 1200,
    totalAmount: 4200000,
    status: "PENDING_VENDOR",
    pic: "Bambang Sudiro (Warehouse Lead)",
    notes: "Botol cacat cetak printing miring > 5 derajat. Menunggu kiriman pengganti dari vendor.",
    items: [
      {
        id: "ri-2",
        itemCode: "KMS00012",
        itemName: "Botol Tube 100ml Doff White + Flip Cap",
        qtyReturned: 1200,
        unit: "Pcs",
        unitPrice: 3500,
        totalPrice: 4200000,
        rejectReason: "Printing sablon logo offset miring dan buram."
      }
    ]
  },
  {
    id: "ret-3",
    returnNumber: "RET-PO-202609-0002",
    returnDate: "2026-09-01",
    poNumber: "PO-202608-000015",
    grnNumber: "GRN-202608-0099",
    vendorName: "PT Aroma Alam Lestari",
    vendorCode: "SUP-0008",
    compensationType: "REFUND_DANA",
    totalQty: 5,
    totalAmount: 2500000,
    status: "COMPLETED",
    pic: "Mega Utami (SCM)",
    notes: "Pengembalian dana via transfer BCA Rekening Operasional karena supplier tidak memiliki stok batch baru.",
    items: [
      {
        id: "ri-3",
        itemCode: "BBK00092",
        itemName: "Fragrance Sweet Vanilla Grade A",
        qtyReturned: 5,
        unit: "Kg",
        unitPrice: 500000,
        totalPrice: 2500000,
        rejectReason: "Viskositas aroma tidak sesuai COA standar pabrikan."
      }
    ]
  },
  {
    id: "ret-4",
    returnNumber: "RET-PO-202608-0001",
    returnDate: "2026-08-25",
    poNumber: "PO-202608-000005",
    grnNumber: "GRN-202608-0050",
    vendorName: "PT Indo Paper Box Perkasa",
    vendorCode: "SUP-0019",
    compensationType: "POTONG_TAGIHAN",
    totalQty: 500,
    totalAmount: 1500000,
    status: "REJECTED",
    pic: "Bambang Sudiro (Warehouse Lead)",
    notes: "Klaim ditolak supplier karena kerusakan kardus terjadi akibat kelalaian ekspedisi pihak ketiga buyer.",
    items: [
      {
        id: "ri-4",
        itemCode: "KMS00088",
        itemName: "Inner Box Printing Ivory 300gsm",
        qtyReturned: 500,
        unit: "Pcs",
        unitPrice: 3000,
        totalPrice: 1500000,
        rejectReason: "Kardus basah terkena hujan saat handling."
      }
    ]
  }
];

const MOCK_INBOUNDS = [
  {
    id: "grn-1",
    grnNumber: "GRN-202609-0025",
    poNumber: "PO-202609-000005",
    vendorName: "PT Chemindo Resins Global",
    items: [
      { itemCode: "BBK00045", itemName: "Cetyl Alcohol Flakes", qtyReceived: 100, unit: "Kg", unitPrice: 42000 }
    ]
  },
  {
    id: "grn-2",
    grnNumber: "GRN-202609-0026",
    poNumber: "PO-202609-000004",
    vendorName: "PT Mitra Kemas Solusindo",
    items: [
      { itemCode: "KMS00105", itemName: "Master Carton Box K125/M125", qtyReceived: 300, unit: "Pcs", unitPrice: 8500 }
    ]
  }
];

export default function PurchaseReturnsPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<PurchaseReturn[]>(INITIAL_PURCHASE_RETURNS);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [compensationFilter, setCompensationFilter] = useState("ALL");
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Form State
  const [selectedGrnId, setSelectedGrnId] = useState("");
  const [compType, setCompType] = useState<PurchaseReturn["compensationType"]>("POTONG_TAGIHAN");
  const [formNotes, setFormNotes] = useState("");
  const [returnItems, setReturnItems] = useState<Array<{
    itemCode: string;
    itemName: string;
    qtyReturned: number;
    unit: string;
    unitPrice: number;
    rejectReason: string;
  }>>([]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const total = list.length;
    const pending = list.filter(r => r.status === "PENDING_VENDOR").length;
    const approved = list.filter(r => r.status === "APPROVED" || r.status === "COMPLETED").length;
    const totalValue = list
      .filter(r => r.status !== "REJECTED")
      .reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      total,
      pending,
      approved,
      totalValue
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "PENDING_VENDOR" ? item.status === "PENDING_VENDOR" :
        activeTab === "APPROVED" ? item.status === "APPROVED" :
        activeTab === "COMPLETED" ? item.status === "COMPLETED" :
        activeTab === "REJECTED" ? item.status === "REJECTED" : true;

      const matchComp = compensationFilter === "ALL" ? true : item.compensationType === compensationFilter;

      return matchSearch && matchTab && matchComp;
    });
  }, [dataList, searchQuery, activeTab, compensationFilter]);

  const handleSelectGrn = (grnId: string) => {
    setSelectedGrnId(grnId);
    const grn = MOCK_INBOUNDS.find(g => g.id === grnId);
    if (grn) {
      setReturnItems(grn.items.map(it => ({
        itemCode: it.itemCode,
        itemName: it.itemName,
        qtyReturned: 1,
        unit: it.unit,
        unitPrice: it.unitPrice,
        rejectReason: "Barang rusak fisik / tidak memenuhi standar QC"
      })));
    } else {
      setReturnItems([]);
    }
  };

  const handleCreateReturn = () => {
    if (!selectedGrnId) {
      toast.error("Pilih dokumen Inbound GRN asal penerimaan barang");
      return;
    }
    const grn = MOCK_INBOUNDS.find(g => g.id === selectedGrnId);
    if (!grn) return;

    if (returnItems.length === 0) {
      toast.error("Tentukan minimal 1 item barang yang akan diretur");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const newNo = `RET-PO-202609-00${String(dataList.length + 5).padStart(2, "0")}`;

    const totalQty = returnItems.reduce((sum, it) => sum + it.qtyReturned, 0);
    const totalAmount = returnItems.reduce((sum, it) => sum + (it.qtyReturned * it.unitPrice), 0);

    const newReturn: PurchaseReturn = {
      id: `ret-${Date.now()}`,
      returnNumber: newNo,
      returnDate: todayStr,
      poNumber: grn.poNumber,
      grnNumber: grn.grnNumber,
      vendorName: grn.vendorName,
      vendorCode: "SUP-0088",
      compensationType: compType,
      totalQty,
      totalAmount,
      status: "PENDING_VENDOR",
      pic: "Mega Utami (SCM)",
      notes: formNotes || "Klaim retur otomatis dari hasil inspeksi Quality Control.",
      items: returnItems.map((it, idx) => ({
        id: `ri-${Date.now()}-${idx}`,
        ...it,
        totalPrice: it.qtyReturned * it.unitPrice
      }))
    };

    setDataList([newReturn, ...dataList]);
    setIsCreateOpen(false);
    setSelectedGrnId("");
    setReturnItems([]);
    setFormNotes("");
    toast.success(`Dokumen Retur ${newNo} berhasil diterbitkan senilai Rp ${totalAmount.toLocaleString("id-ID")}`);
  };

  const handleApproveVendor = (id: string) => {
    setDataList(dataList.map(item => {
      if (item.id === id) {
        return { ...item, status: "APPROVED" };
      }
      return item;
    }));
    if (selectedReturn && selectedReturn.id === id) {
      setSelectedReturn({ ...selectedReturn, status: "APPROVED" });
    }
    toast.success("Vendor telah menyetujui klaim retur. Debit Note siap diaplikasikan pada faktur.");
  };

  const handleCompleteReturn = (id: string) => {
    setDataList(dataList.map(item => {
      if (item.id === id) {
        return { ...item, status: "COMPLETED" };
      }
      return item;
    }));
    if (selectedReturn && selectedReturn.id === id) {
      setSelectedReturn({ ...selectedReturn, status: "COMPLETED" });
    }
    toast.success("Kompensasi retur selesai (Barang pengganti diterima / Tagihan dipotong).");
  };

  const getStatusBadge = (status: PurchaseReturn["status"]) => {
    switch (status) {
      case "PENDING_VENDOR":
        return <DnaBadge variant="warning">Menunggu Vendor</DnaBadge>;
      case "APPROVED":
        return <DnaBadge variant="info">Disetujui Vendor</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai Kompensasi</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Klaim Ditolak</DnaBadge>;
    }
  };

  const getCompensationBadge = (comp: PurchaseReturn["compensationType"]) => {
    switch (comp) {
      case "POTONG_TAGIHAN":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">Debit Note (Potong Faktur)</span>;
      case "GANTI_BARANG":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">Tukar Barang Baru</span>;
      case "REFUND_DANA":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Refund Kas / Transfer</span>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Retur Pembelian (Purchase Returns)"
        description="Kelola klaim retur barang reject dari gudang ke supplier, penerbitan Debit Note, dan penggantian material."
        badge={<DnaBadge variant="neutral">SCR-042 / SCM-PUR-RET</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
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

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua", count: dataList.length },
            { id: "PENDING_VENDOR", label: "Menunggu Vendor", count: dataList.filter(d => d.status === "PENDING_VENDOR").length },
            { id: "APPROVED", label: "Disetujui Vendor", count: dataList.filter(d => d.status === "APPROVED").length },
            { id: "COMPLETED", label: "Selesai", count: dataList.filter(d => d.status === "COMPLETED").length },
            { id: "REJECTED", label: "Ditolak", count: dataList.filter(d => d.status === "REJECTED").length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Pengajuan Retur Pembelian & Debit Note"
        description="Barang reject penerimaan gudang tidak ditagihkan ke finance dan otomatis memotong hutang vendor."
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Retur</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Referensi PO & GRN</th>
                <th className="py-3 px-4 text-center">Total Qty</th>
                <th className="py-3 px-4 text-right">Nilai Retur</th>
                <th className="py-3 px-4">Kompensasi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <PackageX className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen retur pembelian yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                      {row.returnNumber}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {row.returnDate}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-900">
                      <div>{row.vendorName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{row.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      <div className="text-slate-900 font-medium">{row.poNumber}</div>
                      <div className="text-slate-500 text-[11px]">{row.grnNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-semibold text-slate-800">
                      {row.totalQty.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-red-600">
                      Rp {row.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getCompensationBadge(row.compensationType)}
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
                            setSelectedReturn(row);
                            setIsDetailOpen(true);
                          }}
                        >
                          Detail
                        </DnaButton>
                        {row.status === "PENDING_VENDOR" && (
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handleApproveVendor(row.id)}
                          >
                            Setujui
                          </DnaButton>
                        )}
                        {row.status === "APPROVED" && (
                          <DnaButton
                            variant="secondary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => handleCompleteReturn(row.id)}
                          >
                            Selesaikan
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

      {/* Modal Detail Retur */}
      {selectedReturn && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Retur Pembelian: ${selectedReturn.returnNumber}`}
          description={`Klaim retur untuk supplier ${selectedReturn.vendorName}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                PIC Pengajuan: <span className="font-semibold text-slate-700">{selectedReturn.pic}</span> ({selectedReturn.returnDate})
              </div>
              <div className="flex items-center gap-2">
                {selectedReturn.status === "PENDING_VENDOR" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => {
                      handleApproveVendor(selectedReturn.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    Konfirmasi Disetujui Vendor
                  </DnaButton>
                )}
                {selectedReturn.status === "APPROVED" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => {
                      handleCompleteReturn(selectedReturn.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    Kompensasi Selesai (Update Faktur)
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
            {/* Header Cards */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">No. PO & GRN</span>
                <span className="font-bold text-slate-900 font-mono">{selectedReturn.poNumber}</span>
                <span className="text-slate-500 block text-[11px]">{selectedReturn.grnNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jenis Kompensasi</span>
                <div className="mt-0.5">{getCompensationBadge(selectedReturn.compensationType)}</div>
              </div>
              <div>
                <span className="text-slate-500 block">Total Nilai Pengurang AP</span>
                <span className="font-bold text-red-600 font-mono text-sm">
                  Rp {selectedReturn.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Klaim</span>
                <div className="mt-0.5">{getStatusBadge(selectedReturn.status)}</div>
              </div>
            </div>

            {selectedReturn.notes && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-indigo-900">
                <span className="font-bold block mb-1">Catatan Negosiasi Supplier:</span>
                {selectedReturn.notes}
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Item yang Diretur & Alasan Reject</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Material</th>
                      <th className="py-2.5 px-3 text-right">Qty Retur</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3">Alasan Reject QC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReturn.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-medium text-indigo-600">{it.itemCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{it.itemName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                          {it.qtyReturned.toLocaleString("id-ID")} {it.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          Rp {it.unitPrice.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          Rp {it.totalPrice.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 italic max-w-xs">
                          {it.rejectReason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* Modal Buat Retur Pembelian */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Penerbitan Retur Pembelian (Debit Note)"
        description="Pilih dokumen penerimaan gudang (GRN) yang memiliki barang reject untuk diajukan klaim ke supplier."
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
              onClick={handleCreateReturn}
            >
              Terbitkan Dokumen Retur
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Pilih Dokumen Penerimaan Gudang (GRN) *</label>
              <select
                aria-label="Pilih Inbound GRN"
                value={selectedGrnId}
                onChange={(e) => handleSelectGrn(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Dokumen GRN --</option>
                {MOCK_INBOUNDS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.grnNumber} - {g.vendorName} ({g.poNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Jenis Kompensasi Retur *</label>
              <select
                aria-label="Jenis Kompensasi"
                value={compType}
                onChange={(e) => setCompType(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="POTONG_TAGIHAN">Debit Note (Potong Faktur Tagihan)</option>
                <option value="GANTI_BARANG">Tukar Barang Baru (Replacement)</option>
                <option value="REFUND_DANA">Refund Kas / Transfer Bank</option>
              </select>
            </div>
          </div>

          {returnItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">Item Barang yang Diretur</h4>
              {returnItems.map((item, idx) => (
                <div key={item.itemCode} className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded border border-slate-200 items-center">
                  <div className="col-span-4">
                    <div className="font-semibold text-slate-800">{item.itemName}</div>
                    <div className="text-[11px] font-mono text-indigo-600">{item.itemCode}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Qty Retur ({item.unit})</label>
                    <input
                      type="number"
                      min="1"
                      value={item.qtyReturned}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setReturnItems(returnItems.map((r, i) => i === idx ? { ...r, qtyReturned: val } : r));
                      }}
                      className="w-full text-xs border border-slate-300 rounded p-1 font-mono text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Harga Satuan</label>
                    <div className="text-xs font-mono font-medium text-slate-800 mt-1">
                      Rp {item.unitPrice.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Alasan Reject QC</label>
                    <input
                      type="text"
                      value={item.rejectReason}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReturnItems(returnItems.map((r, i) => i === idx ? { ...r, rejectReason: val } : r));
                      }}
                      className="w-full text-xs border border-slate-300 rounded p-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan & Bukti Retur</label>
            <textarea
              rows={2}
              placeholder="Contoh: Sesuai kesepakatan via WA dengan Bu Lina (Supplier) tanggal 09/09/2026."
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
