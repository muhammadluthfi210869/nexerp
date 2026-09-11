"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Truck,
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
  Boxes,
  ShieldCheck,
  Package,
  Calendar,
  Building2,
  ArrowDownToLine,
  Receipt
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

const INITIAL_GRN_LIST: GoodsReceiptNote[] = [
  {
    id: "grn-1",
    grnNumber: "GRN-202609-0021",
    receiveDate: "2026-09-08",
    poNumber: "PO-202608-000033",
    deliveryOrderNo: "SJ-SON-9921",
    vendorName: "PT Sumber Organik Nusantara",
    vendorCode: "SUP-0012",
    warehouseName: "Gudang Bahan Baku Utama (WH-01)",
    totalQtyGood: 75.0,
    totalQtyReject: 25.0,
    totalQtyFree: 0,
    status: "HAS_REJECT",
    receivedBy: "Bambang Sudiro (Logistics)",
    qcInspector: "Ahmad Dahlan (QC Lead)",
    notes: "25kg drum rusak segel dan reject QC. Telah diterbitkan klaim Retur Pembelian RET-PO-202609-0004.",
    items: [
      {
        id: "gi-1",
        itemCode: "BBK00028",
        itemName: "Super Moisturing Max (Raw Active)",
        qtyOrdered: 100.0,
        qtyReceived: 100.0,
        qtyGood: 75.0,
        qtyReject: 25.0,
        qtyFree: 0,
        unit: "Kg",
        batchNumber: "LOT-SON-2609-001",
        expiryDate: "2028-09-01",
        qcStatus: "PARTIAL_REJECT",
        rejectReason: "Segel drum terbuka dan kontaminasi kelembaban tinggi."
      }
    ]
  },
  {
    id: "grn-2",
    grnNumber: "GRN-202609-0022",
    receiveDate: "2026-09-07",
    poNumber: "PO-202609-000004",
    deliveryOrderNo: "SJ-KJM-11029",
    vendorName: "PT Kemasan Jaya Makmur",
    vendorCode: "SUP-0004",
    warehouseName: "Gudang Kemas & Box (WH-02)",
    totalQtyGood: 8000,
    totalQtyReject: 0,
    totalQtyFree: 200,
    status: "APPROVED",
    receivedBy: "Bambang Sudiro (Logistics)",
    qcInspector: "Siti Rahma (QC Packaging)",
    notes: "Pengiriman botol tube 100ml lengkap dengan bonus 200 pcs spare botol dari vendor (HPP Rp 0).",
    items: [
      {
        id: "gi-2",
        itemCode: "KMS00012",
        itemName: "Botol Tube 100ml Doff White + Flip Cap",
        qtyOrdered: 8000,
        qtyReceived: 8200,
        qtyGood: 8000,
        qtyReject: 0,
        qtyFree: 200,
        unit: "Pcs",
        batchNumber: "LOT-KJM-2609-12",
        qcStatus: "PASSED"
      }
    ]
  },
  {
    id: "grn-3",
    grnNumber: "GRN-202609-0023",
    receiveDate: "2026-09-09",
    poNumber: "PO-202609-000005",
    deliveryOrderNo: "SJ-CRG-88120",
    vendorName: "PT Chemindo Resins Global",
    vendorCode: "SUP-0007",
    warehouseName: "Gudang Karantina & QC (WH-04)",
    totalQtyGood: 100.0,
    totalQtyReject: 0,
    totalQtyFree: 0,
    status: "PENDING_QC",
    receivedBy: "Rahmat Hidayat (Logistics)",
    qcInspector: "Menunggu Penugasan Lab",
    notes: "Bahan aktif baru tiba di docking penerimaan, sedang dalam masa karantina sampling QA.",
    items: [
      {
        id: "gi-3",
        itemCode: "BBK00045",
        itemName: "Cetyl Alcohol Flakes Pure",
        qtyOrdered: 100.0,
        qtyReceived: 100.0,
        qtyGood: 100.0,
        qtyReject: 0,
        qtyFree: 0,
        unit: "Kg",
        batchNumber: "LOT-CRG-2609-04",
        expiryDate: "2029-01-15",
        qcStatus: "PENDING_TEST"
      }
    ]
  }
];

const MOCK_OPEN_POS = [
  {
    poNumber: "PO-202609-000005",
    vendorName: "PT Chemindo Resins Global",
    vendorCode: "SUP-0007",
    items: [
      { itemCode: "BBK00045", itemName: "Cetyl Alcohol Flakes Pure", qtyOrdered: 100.0, unit: "Kg" }
    ]
  },
  {
    poNumber: "PO-202609-000006",
    vendorName: "PT Aroma Alam Lestari",
    vendorCode: "SUP-0008",
    items: [
      { itemCode: "BBK00092", itemName: "Fragrance Sweet Vanilla Premium", qtyOrdered: 20.0, unit: "Kg" }
    ]
  }
];

export default function GoodsInboundPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<GoodsReceiptNote[]>(INITIAL_GRN_LIST);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceiptNote | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryOrderNo, setDeliveryOrderNo] = useState("");
  const [warehouseName, setWarehouseName] = useState("Gudang Bahan Baku Utama (WH-01)");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<GrnItemDetail[]>([]);

  // Calculate KPIs (Poin 64 & 67)
  const kpis = useMemo(() => {
    const list = dataList;
    const totalGrn = list.length;
    const totalGood = list.reduce((sum, g) => sum + g.totalQtyGood, 0);
    const totalReject = list.reduce((sum, g) => sum + g.totalQtyReject, 0);
    const pendingQc = list.filter(g => g.status === "PENDING_QC").length;

    return {
      totalGrn,
      totalGood,
      totalReject,
      pendingQc
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
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
    const po = MOCK_OPEN_POS.find(p => p.poNumber === poNo);
    if (po) {
      setFormItems(po.items.map((it, idx) => ({
        id: `gi-${Date.now()}-${idx}`,
        itemCode: it.itemCode,
        itemName: it.itemName,
        qtyOrdered: it.qtyOrdered,
        qtyReceived: it.qtyOrdered,
        qtyGood: it.qtyOrdered,
        qtyReject: 0,
        qtyFree: 0,
        unit: it.unit,
        batchNumber: `LOT-${Date.now().toString().slice(-4)}`,
        expiryDate: "2028-12-31",
        qcStatus: "PASSED"
      })));
    } else {
      setFormItems([]);
    }
  };

  const handleUpdateItem = (index: number, field: keyof GrnItemDetail, val: any) => {
    const updated = [...formItems];
    const current = { ...updated[index], [field]: val };

    if (field === "qtyGood" || field === "qtyReject" || field === "qtyFree") {
      current.qtyReceived = Number(current.qtyGood) + Number(current.qtyReject) + Number(current.qtyFree);
      if (Number(current.qtyReject) > 0) {
        current.qcStatus = "PARTIAL_REJECT";
      } else {
        current.qcStatus = "PASSED";
      }
    }

    updated[index] = current;
    setFormItems(updated);
  };

  const handleCreateGrn = () => {
    if (!selectedPoNumber) {
      toast.error("Pilih Purchase Order referensi");
      return;
    }
    if (!deliveryOrderNo.trim()) {
      toast.error("Nomor Surat Jalan Supplier wajib diisi");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Tambahkan minimal 1 item penerimaan barang");
      return;
    }

    const po = MOCK_OPEN_POS.find(p => p.poNumber === selectedPoNumber);
    const newNo = `GRN-202609-00${String(dataList.length + 24).padStart(2, "0")}`;

    const totalQtyGood = formItems.reduce((sum, it) => sum + Number(it.qtyGood || 0), 0);
    const totalQtyReject = formItems.reduce((sum, it) => sum + Number(it.qtyReject || 0), 0);
    const totalQtyFree = formItems.reduce((sum, it) => sum + Number(it.qtyFree || 0), 0);

    const hasReject = totalQtyReject > 0;

    const newGrn: GoodsReceiptNote = {
      id: `grn-${Date.now()}`,
      grnNumber: newNo,
      receiveDate,
      poNumber: selectedPoNumber,
      deliveryOrderNo,
      vendorName: po?.vendorName || "Supplier Mitra",
      vendorCode: po?.vendorCode || "SUP-0001",
      warehouseName,
      totalQtyGood,
      totalQtyReject,
      totalQtyFree,
      status: hasReject ? "HAS_REJECT" : "APPROVED",
      receivedBy: "Petugas Gudang (Anda)",
      qcInspector: "Inspektur QC Pabrik",
      notes: formNotes || "Penerimaan fisik barang PO di docking gudang.",
      items: formItems
    };

    setDataList([newGrn, ...dataList]);
    setIsCreateOpen(false);
    setSelectedPoNumber("");
    setDeliveryOrderNo("");
    setFormNotes("");
    setFormItems([]);
    toast.success(`Dokumen Penerimaan Barang ${newNo} berhasil diterbitkan (Stok Bagus: ${totalQtyGood.toLocaleString("id-ID")}).`);
  };

  const getStatusBadge = (status: GoodsReceiptNote["status"]) => {
    switch (status) {
      case "PENDING_QC":
        return <DnaBadge variant="warning">Karantina / Uji QC</DnaBadge>;
      case "APPROVED":
        return <DnaBadge variant="success">Lolos QC & Masuk Stok</DnaBadge>;
      case "HAS_REJECT":
        return <DnaBadge variant="critical">Ada Barang Reject</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Ditolak Total</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Pembelian Masuk (Goods Receipt GRN)"
        description="Penerimaan fisik barang dari supplier, pencatatan 3 pilar (Bagus, Reject, Free Bonus), dan verifikasi QC."
        badge={<DnaBadge variant="neutral">SCR-091 / WH-INBOUND</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
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
              + Input Penerimaan Barang (GRN)
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards (Poin 64 & 67) */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Dokumen GRN"
          value={`${kpis.totalGrn} Penerimaan`}
          icon={<Truck className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+3 minggu ini", isPositive: true }}
        />
        <DnaStatCard
          label="Total Qty Kondisi Bagus"
          value={`${kpis.totalGood.toLocaleString("id-ID")} Qty`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="Total Qty Reject (Klaim Retur)"
          value={`${kpis.totalReject.toLocaleString("id-ID")} Qty`}
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          variant={kpis.totalReject > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Menunggu Sampling QC"
          value={`${kpis.pendingQc} Dokumen`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
      </DnaKpiGrid>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua Penerimaan", count: dataList.length },
            { id: "PENDING_QC", label: "Karantina / Sampling QC", count: dataList.filter(d => d.status === "PENDING_QC").length },
            { id: "APPROVED", label: "Lolos QC & Masuk Stok", count: dataList.filter(d => d.status === "APPROVED").length },
            { id: "HAS_REJECT", label: "Memiliki Barang Reject", count: dataList.filter(d => d.status === "HAS_REJECT" || d.totalQtyReject > 0).length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Surat Penerimaan Barang (Goods Receipt Notes)"
        description="Pemisahan 3 pilar fisik: Barang Bagus (masuk stok & bayar), Reject (klaim retur / tidak bayar), Free (bonus HPP 0)."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No GRN, PO, Surat Jalan, Supplier..."
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. GRN</th>
                <th className="py-3 px-4">Tanggal Masuk</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Referensi PO & Surat Jalan</th>
                <th className="py-3 px-4">Gudang Penerima</th>
                <th className="py-3 px-4 text-right">Qty Bagus</th>
                <th className="py-3 px-4 text-right">Qty Reject</th>
                <th className="py-3 px-4 text-right">Qty Free</th>
                <th className="py-3 px-4">Status QC</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen penerimaan barang masuk yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                      {row.grnNumber}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {row.receiveDate}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      <div>{row.vendorName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{row.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      <div className="text-slate-900 font-medium">{row.poNumber}</div>
                      <div className="text-slate-500 text-[11px]">SJ: {row.deliveryOrderNo}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {row.warehouseName}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-emerald-600">
                      {row.totalQtyGood.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold">
                      {row.totalQtyReject > 0 ? (
                        <span className="text-red-600">{row.totalQtyReject.toLocaleString("id-ID")}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-blue-600">
                      {row.totalQtyFree > 0 ? `+${row.totalQtyFree.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedGrn(row);
                          setIsDetailOpen(true);
                        }}
                      >
                        Detail
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Penerimaan GRN */}
      {selectedGrn && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Penerimaan Barang: ${selectedGrn.grnNumber}`}
          description={`Penerimaan dari ${selectedGrn.vendorName} (PO: ${selectedGrn.poNumber})`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Diterima: <span className="font-semibold text-slate-700">{selectedGrn.receivedBy}</span> | QC: <span className="font-semibold text-slate-700">{selectedGrn.qcInspector}</span>
              </div>
              <div className="flex items-center gap-2">
                <DnaButton variant="outline" size="sm" onClick={() => toast.success("Mencetak Surat Penerimaan Barang (GRN)...")}>
                  Cetak Bukti GRN
                </DnaButton>
                <DnaButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </DnaButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header Summary */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Surat Jalan Supplier</span>
                <span className="font-bold text-slate-900 font-mono">{selectedGrn.deliveryOrderNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Gudang Penyimpanan</span>
                <span className="font-medium text-slate-800">{selectedGrn.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hasil QC (Bagus / Masuk Stok)</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  {selectedGrn.totalQtyGood.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Dokumen</span>
                <div className="mt-0.5">{getStatusBadge(selectedGrn.status)}</div>
              </div>
            </div>

            {selectedGrn.notes && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-indigo-900">
                <span className="font-bold block mb-1">Catatan Penerimaan & Tindak Lanjut QC:</span>
                {selectedGrn.notes}
              </div>
            )}

            {/* Items Table with 3 Pilar Fisik */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Rincian Fisik 3 Pilar per Item</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <DnaTable className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Bahan / Barang</th>
                      <th className="py-2.5 px-3 text-right">Qty PO</th>
                      <th className="py-2.5 px-3 text-right">Qty Datang</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700">Qty Bagus (Bayar)</th>
                      <th className="py-2.5 px-3 text-right text-red-600">Qty Reject</th>
                      <th className="py-2.5 px-3 text-right text-blue-600">Qty Free</th>
                      <th className="py-2.5 px-3">No. Batch / Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedGrn.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-indigo-600 font-medium">{it.itemCode}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{it.itemName}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{it.qtyOrdered} {it.unit}</td>
                        <td className="py-2.5 px-3 text-right text-slate-900 font-bold">{it.qtyReceived} {it.unit}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{it.qtyGood}</td>
                        <td className="py-2.5 px-3 text-right text-red-600 font-bold">{it.qtyReject}</td>
                        <td className="py-2.5 px-3 text-right text-blue-600 font-bold">+{it.qtyFree}</td>
                        <td className="py-2.5 px-3 text-slate-700">{it.batchNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </DnaTable>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* Modal Input Penerimaan GRN Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Input Penerimaan Barang Masuk (GRN)"
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
                {MOCK_OPEN_POS.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>
                    {po.poNumber} - {po.vendorName}
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
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Terima Fisik *</label>
              <DnaInput
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Gudang Alokasi Masuk *</label>
            <select
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
                      <span className="text-[11px] font-mono text-indigo-600 ml-2">[{item.itemCode}]</span>
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
                        className="w-full text-xs font-mono font-bold text-emerald-700 border border-emerald-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-red-600 font-bold mb-0.5">Qty Reject (Klaim Retur)</label>
                      <DnaInput
                        type="number"
                        min="0"
                        value={item.qtyReject}
                        onChange={(e) => handleUpdateItem(idx, "qtyReject", parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold text-red-600 border border-red-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-blue-600 font-bold mb-0.5">Qty Free (Bonus HPP 0)</label>
                      <DnaInput
                        type="number"
                        min="0"
                        value={item.qtyFree}
                        onChange={(e) => handleUpdateItem(idx, "qtyFree", parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold text-blue-600 border border-blue-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-0.5">No. Batch / Lot</label>
                      <DnaInput
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => handleUpdateItem(idx, "batchNumber", e.target.value)}
                        className="w-full text-xs font-mono border border-slate-300 rounded p-1.5"
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
