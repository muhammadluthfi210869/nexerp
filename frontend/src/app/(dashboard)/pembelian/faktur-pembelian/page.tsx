"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Upload,
  Calendar,
  CreditCard,
  Building2,
  Receipt,
  Trash2,
  AlertTriangle,
  Send,
  HelpCircle
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

export interface BillItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  price: number;
  discountRp: number;
  total: number;
  rejectQty?: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  poNumber: string;
  vendorName: string;
  procurementCategory: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  totalDiscountRp: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dpDeduction: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  unpaidReason?: string;
  notes?: string;
  items: BillItemDetail[];
  pic: string;
}

const INITIAL_BILLS: PurchaseBill[] = [
  {
    id: "b-1",
    billNumber: "FP-202609-000001",
    poNumber: "PO-202608-000033",
    vendorName: "PT Sumber Organik Nusantara",
    procurementCategory: "Bahan Baku (110401)",
    invoiceDate: "2026-08-31",
    dueDate: "2026-09-30",
    subtotal: 15000000,
    totalDiscountRp: 500000,
    taxAmount: 1595000,
    grandTotal: 16095000,
    paidAmount: 0,
    dpDeduction: 0,
    paymentStatus: "UNPAID",
    unpaidReason: "Menunggu termin jatuh tempo 30 hari sesuai kesepakatan PO.",
    notes: "Pengadaan bahan aktif pelembab batch September.",
    pic: "Mega Utami",
    items: [
      {
        id: "bi-1",
        itemCode: "BBK00028",
        itemName: "Super Moisturing Max (Drum 25kg)",
        qty: 100,
        unit: "Kg",
        price: 150000,
        discountRp: 500000,
        total: 14500000,
        rejectQty: 0
      }
    ]
  },
  {
    id: "b-2",
    billNumber: "FP-202609-000002",
    poNumber: "PO-202609-000004",
    vendorName: "PT Kemasan Jaya Makmur",
    procurementCategory: "Bahan Kemas (110402)",
    invoiceDate: "2026-09-02",
    dueDate: "2026-09-16",
    subtotal: 28500000,
    totalDiscountRp: 0,
    taxAmount: 3135000,
    grandTotal: 31635000,
    paidAmount: 31635000,
    dpDeduction: 14250000,
    paymentStatus: "PAID",
    notes: "Pelunasan cetak botol tube via transfer Bank Mandiri.",
    pic: "Mega Utami",
    items: [
      {
        id: "bi-2",
        itemCode: "KMS00012",
        itemName: "Botol Tube 100ml Doff White + Flip Cap",
        qty: 8000,
        unit: "Pcs",
        price: 3500,
        discountRp: 0,
        total: 28000000,
        rejectQty: 0
      },
      {
        id: "bi-3",
        itemCode: "KMS00105",
        itemName: "Master Carton Box K125/M125",
        qty: 100,
        unit: "Pcs",
        price: 5000,
        discountRp: 0,
        total: 500000,
        rejectQty: 0
      }
    ]
  },
  {
    id: "b-3",
    billNumber: "FP-202609-000003",
    poNumber: "PO-202608-000019",
    vendorName: "PT Chemindo Resins Global",
    procurementCategory: "Reagen & Bahan Lab (510201)",
    invoiceDate: "2026-09-05",
    dueDate: "2026-09-19",
    subtotal: 8200000,
    totalDiscountRp: 200000,
    taxAmount: 880000,
    grandTotal: 8880000,
    paidAmount: 4000000,
    dpDeduction: 0,
    paymentStatus: "PARTIAL",
    unpaidReason: "Pembayaran tahap 1 telah dibayarkan 50%, sisa 50% saat hasil QC Release.",
    notes: "Bahan uji lab reagen batch serum.",
    pic: "Rini Sulistyo",
    items: [
      {
        id: "bi-4",
        itemCode: "BBK00045",
        itemName: "Cetyl Alcohol Flakes Pure",
        qty: 200,
        unit: "Kg",
        price: 41000,
        discountRp: 200000,
        total: 8000000,
        rejectQty: 0
      }
    ]
  },
  {
    id: "b-4",
    billNumber: "FP-202608-000088",
    poNumber: "PO-202608-000015",
    vendorName: "PT Aroma Alam Lestari",
    procurementCategory: "Bahan Baku (110401)",
    invoiceDate: "2026-08-20",
    dueDate: "2026-09-03",
    subtotal: 12500000,
    totalDiscountRp: 0,
    taxAmount: 1375000,
    grandTotal: 13875000,
    paidAmount: 0,
    dpDeduction: 0,
    paymentStatus: "UNPAID",
    unpaidReason: "Invoice overdue 6 hari. Menunggu otorisasi Direktur Keuangan.",
    notes: "Pengadaan wewangian premium grade.",
    pic: "Rini Sulistyo",
    items: [
      {
        id: "bi-5",
        itemCode: "BBK00092",
        itemName: "Fragrance Sweet Vanilla",
        qty: 25,
        unit: "Kg",
        price: 500000,
        discountRp: 0,
        total: 12500000,
        rejectQty: 0
      }
    ]
  }
];

const PROCUREMENT_CATEGORIES = [
  "Bahan Baku (110401)",
  "Bahan Kemas (110402)",
  "Reagen & Bahan Lab (510201)",
  "Perlengkapan Produksi & Sanitasi (510301)",
  "Jasa Maklon Eksternal (510401)"
];

export default function FakturPembelianPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<PurchaseBill[]>(INITIAL_BILLS);

  // Filters (Poin 7: Navbar 3 tabs utama)
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [reasonModalBill, setReasonModalBill] = useState<PurchaseBill | null>(null);
  const [newReasonText, setNewReasonText] = useState("");

  // Create Form State (Poin 4: Tanggal invoice custom)
  const [billNumber, setBillNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [procurementCategory, setProcurementCategory] = useState(PROCUREMENT_CATEGORIES[0]);
  const [invoiceDate, setInvoiceDate] = useState("2026-09-09");
  const [dueDate, setDueDate] = useState("2026-10-09");
  const [formNotes, setFormNotes] = useState("");
  const [unpaidReason, setUnpaidReason] = useState("Menunggu termin jatuh tempo reguler 30 hari.");
  const [items, setItems] = useState<BillItemDetail[]>([
    {
      id: "item-1",
      itemCode: "BBK00028",
      itemName: "Super Moisturing Max",
      qty: 10,
      unit: "Kg",
      price: 150000,
      discountRp: 0,
      total: 1500000,
      rejectQty: 0
    }
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const totalCount = list.length;
    const totalGrand = list.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalUnpaid = list
      .filter(b => b.paymentStatus === "UNPAID" || b.paymentStatus === "PARTIAL")
      .reduce((sum, b) => sum + (b.grandTotal - b.paidAmount), 0);
    const paidCount = list.filter(b => b.paymentStatus === "PAID").length;

    return {
      totalCount,
      totalGrand,
      totalUnpaid,
      paidCount
    };
  }, [dataList]);

  // Filtered list based on Poin 7 (Semua / Sudah Dibayar / Belum Dibayar)
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.unpaidReason && item.unpaidReason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "PAID" ? item.paymentStatus === "PAID" :
        activeTab === "UNPAID" ? (item.paymentStatus === "UNPAID" || item.paymentStatus === "PARTIAL") : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  // Add Item to Form
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        itemCode: "",
        itemName: "",
        qty: 1,
        unit: "Pcs",
        price: 0,
        discountRp: 0,
        total: 0,
        rejectQty: 0
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof BillItemDetail, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };

    if (field === "qty" || field === "price" || field === "discountRp") {
      const q = field === "qty" ? value : current.qty;
      const p = field === "price" ? value : current.price;
      const d = field === "discountRp" ? value : current.discountRp;
      current.total = Math.max(0, (q * p) - d);
    }

    newItems[index] = current;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const formSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.qty * it.price), 0);
  }, [items]);

  const formTotalDiscount = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.discountRp || 0), 0);
  }, [items]);

  const formTax = useMemo(() => {
    return (formSubtotal - formTotalDiscount) * 0.11;
  }, [formSubtotal, formTotalDiscount]);

  const formGrandTotal = useMemo(() => {
    return (formSubtotal - formTotalDiscount) + formTax;
  }, [formSubtotal, formTotalDiscount, formTax]);

  const handleCreateBill = () => {
    if (!billNumber.trim()) {
      toast.error("Nomor Faktur Pembelian (Vendor Invoice No) wajib diisi");
      return;
    }
    if (!vendorName.trim()) {
      toast.error("Nama Supplier / Vendor wajib diisi");
      return;
    }
    if (items.length === 0 || !items[0].itemName) {
      toast.error("Isi minimal 1 detail item barang");
      return;
    }

    const newBill: PurchaseBill = {
      id: `b-${Date.now()}`,
      billNumber,
      poNumber: poNumber || "PO-DIRECT",
      vendorName,
      procurementCategory,
      invoiceDate,
      dueDate,
      subtotal: formSubtotal,
      totalDiscountRp: formTotalDiscount,
      taxAmount: formTax,
      grandTotal: formGrandTotal,
      paidAmount: 0,
      dpDeduction: 0,
      paymentStatus: "UNPAID",
      unpaidReason,
      notes: formNotes,
      pic: "Finance Staff (Anda)",
      items
    };

    setDataList([newBill, ...dataList]);
    setIsCreateOpen(false);
    setBillNumber("");
    setPoNumber("");
    setVendorName("");
    setFormNotes("");
    toast.success(`Faktur Pembelian ${billNumber} berhasil dicatat & masuk ke daftar Hutang Dagang (AP).`);
  };

  const handleSaveReason = () => {
    if (!reasonModalBill) return;
    setDataList(dataList.map(b => {
      if (b.id === reasonModalBill.id) {
        return { ...b, unpaidReason: newReasonText };
      }
      return b;
    }));
    setReasonModalBill(null);
    toast.success("Catatan alasan belum lunas berhasil diperbarui.");
  };

  const handleImportExcel = () => {
    setIsImportModalOpen(false);
    toast.success("File Excel berhasil diproses: 3 Faktur Pembelian baru ditambahkan.");
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Faktur Pembelian (Purchase Invoices)"
        description="Kelola tagihan masuk dari supplier, pencatatan hutang dagang (AP), dan verifikasi termin jatuh tempo."
        badge={<DnaBadge variant="neutral">SCR-046 / FIN-PUR-BILL</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<Upload className="w-4 h-4 text-indigo-600" />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Excel
            </DnaButton>
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Faktur Pembelian diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Input Faktur Pembelian
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Tagihan Masuk"
          value={`${kpis.totalCount} Faktur`}
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+5 bulan ini", isPositive: true }}
        />
        <DnaStatCard
          label="Total Nilai Faktur"
          value={`Rp ${kpis.totalGrand.toLocaleString("id-ID")}`}
          icon={<DollarSign className="w-5 h-5 text-slate-700" />}
        />
        <DnaStatCard
          label="Hutang Belum Lunas"
          value={`Rp ${kpis.totalUnpaid.toLocaleString("id-ID")}`}
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          variant={kpis.totalUnpaid > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Faktur Lunas"
          value={`${kpis.paidCount} Faktur`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* Navigation Tabs (Poin 7) */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua", count: dataList.length },
            { id: "UNPAID", label: "Belum Dibayar", count: dataList.filter(d => d.paymentStatus === "UNPAID" || d.paymentStatus === "PARTIAL").length },
            { id: "PAID", label: "Sudah Dibayar", count: dataList.filter(d => d.paymentStatus === "PAID").length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Faktur Pembelian (Accounts Payable Bills)"
        description="Pencatatan faktur supplier dengan rincian diskon Rupiah dan alasan belum lunas."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No Faktur, PO, vendor, alasan belum lunas..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Tgl Invoice</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Kategori COA</th>
                <th className="py-3 px-4 text-right">Grand Total (Rp)</th>
                <th className="py-3 px-4 text-right">Sisa Hutang</th>
                <th className="py-3 px-4">Status Bayar</th>
                <th className="py-3 px-4">Alasan Belum Lunas</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada faktur pembelian yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => {
                  const remaining = Math.max(0, row.grandTotal - row.paidAmount);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                        {row.billNumber}
                        <div className="text-[11px] text-slate-400 font-normal font-sans">{row.poNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {row.invoiceDate}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap font-medium text-slate-800">
                        {row.dueDate}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                        {row.vendorName}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                          {row.procurementCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono font-bold text-slate-900">
                        Rp {row.grandTotal.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono font-bold">
                        {remaining > 0 ? (
                          <span className="text-amber-600">Rp {remaining.toLocaleString("id-ID")}</span>
                        ) : (
                          <span className="text-emerald-600">Rp 0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.paymentStatus === "PAID" && (
                          <DnaBadge variant="success">Sudah Dibayar</DnaBadge>
                        )}
                        {row.paymentStatus === "PARTIAL" && (
                          <DnaBadge variant="warning">Sebagian</DnaBadge>
                        )}
                        {row.paymentStatus === "UNPAID" && (
                          <DnaBadge variant="critical">Belum Dibayar</DnaBadge>
                        )}
                      </td>
                      {/* Poin 8: Alasan Belum Lunas */}
                      <td className="py-3 px-4 text-xs max-w-xs">
                        {row.paymentStatus !== "PAID" ? (
                          <div
                            onClick={() => {
                              setReasonModalBill(row);
                              setNewReasonText(row.unpaidReason || "");
                            }}
                            className="cursor-pointer hover:text-indigo-600 text-slate-600 truncate flex items-center gap-1 group"
                            title="Klik untuk edit catatan alasan belum lunas"
                          >
                            <span className="truncate">{row.unpaidReason || "Klik untuk isi alasan..."}</span>
                            <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100">Edit</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">- (Lunas) -</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setSelectedBill(row);
                              setIsDetailOpen(true);
                            }}
                          >
                            Detail
                          </DnaButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Faktur */}
      {selectedBill && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Faktur Pembelian: ${selectedBill.billNumber}`}
          description={`Tagihan dari supplier ${selectedBill.vendorName} (${selectedBill.poNumber})`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Dicatat oleh: <span className="font-semibold text-slate-700">{selectedBill.pic}</span>
              </div>
              <DnaButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Tgl Faktur (Custom)</span>
                <span className="font-bold text-slate-900 font-mono">{selectedBill.invoiceDate}</span>
                <span className="text-slate-500 block text-[11px]">Jatuh Tempo: {selectedBill.dueDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kategori COA</span>
                <span className="font-medium text-slate-800">{selectedBill.procurementCategory}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Grand Total Tagihan</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  Rp {selectedBill.grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Pembayaran</span>
                <div className="mt-0.5">
                  {selectedBill.paymentStatus === "PAID" ? (
                    <DnaBadge variant="success">LUNAS</DnaBadge>
                  ) : (
                    <DnaBadge variant="warning">Sisa Rp {(selectedBill.grandTotal - selectedBill.paidAmount).toLocaleString("id-ID")}</DnaBadge>
                  )}
                </div>
              </div>
            </div>

            {selectedBill.unpaidReason && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                <span className="font-bold block mb-1">Catatan Alasan Belum Lunas:</span>
                {selectedBill.unpaidReason}
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Rincian Barang & Diskon Nominal (Rp)</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3 text-right">Qty (Kondisi Bagus)</th>
                      <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right">Diskon (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Total Netto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedBill.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-indigo-600 font-medium">{it.itemCode}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{it.itemName}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {it.qty} {it.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          Rp {it.price.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">
                          - Rp {(it.discountRp || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          Rp {it.total.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono">Rp {selectedBill.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Total Diskon (Rp):</span>
                  <span className="font-mono">- Rp {selectedBill.totalDiscountRp.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN (11%):</span>
                  <span className="font-mono">Rp {selectedBill.taxAmount.toLocaleString("id-ID")}</span>
                </div>
                {selectedBill.dpDeduction > 0 && (
                  <div className="flex justify-between text-purple-600 font-medium">
                    <span>Potongan DP:</span>
                    <span className="font-mono">- Rp {selectedBill.dpDeduction.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-indigo-700">Rp {selectedBill.grandTotal.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* Modal Edit Alasan Belum Lunas (Poin 8) */}
      {reasonModalBill && (
        <DnaModal
          isOpen={!!reasonModalBill}
          onClose={() => setReasonModalBill(null)}
          title={`Catatan Alasan Belum Lunas: ${reasonModalBill.billNumber}`}
          description={`Update alasan mengapa faktur dari ${reasonModalBill.vendorName} belum dibayarkan.`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <DnaButton variant="outline" size="sm" onClick={() => setReasonModalBill(null)}>
                Batal
              </DnaButton>
              <DnaButton variant="primary" size="sm" onClick={handleSaveReason}>
                Simpan Catatan
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">Alasan Belum Lunas *</label>
            <textarea
              rows={3}
              value={newReasonText}
              onChange={(e) => setNewReasonText(e.target.value)}
              placeholder="Contoh: Menunggu termin 30 hari, barang reject dalam proses penggantian..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </DnaModal>
      )}

      {/* Modal Input Faktur Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Input Faktur Pembelian (Purchase Invoice)"
        description="Catat tagihan faktur supplier baru dengan diskon Rupiah dan tanggal invoice custom."
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
              onClick={handleCreateBill}
            >
              Simpan Faktur Pembelian
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Faktur Vendor *</label>
              <input
                type="text"
                placeholder="Contoh: INV/2026/09/0088"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Nama Supplier / Vendor *</label>
              <input
                type="text"
                placeholder="Contoh: PT Sumber Organik Nusantara"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. PO Referensi</label>
              <input
                type="text"
                placeholder="Contoh: PO-202609-000005"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Faktur Vendor (Custom) *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Jatuh Tempo *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Kategori Pengadaan (COA) *</label>
              <select
                aria-label="Kategori Pengadaan"
                value={procurementCategory}
                onChange={(e) => setProcurementCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {PROCUREMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-xs">Rincian Barang & Diskon Nominal (Rp)</h4>
              <DnaButton variant="secondary" size="sm" icon={<Plus className="w-3 h-3" />} onClick={handleAddItem}>
                Tambah Baris
              </DnaButton>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 items-center">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Kode Item"
                      value={item.itemCode}
                      onChange={(e) => handleUpdateItem(idx, "itemCode", e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-1 font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Nama Barang"
                      value={item.itemName}
                      onChange={(e) => handleUpdateItem(idx, "itemName", e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-1"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(idx, "qty", parseFloat(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-300 rounded p-1 text-right font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Harga Rp"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(idx, "price", parseFloat(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-300 rounded p-1 text-right font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Diskon Rp"
                      value={item.discountRp}
                      onChange={(e) => handleUpdateItem(idx, "discountRp", parseFloat(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-300 rounded p-1 text-right font-mono text-emerald-700"
                    />
                  </div>
                  <div className="col-span-1 text-right font-mono font-bold text-xs text-slate-800">
                    {item.total.toLocaleString("id-ID")}
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form Calculation Summary */}
            <div className="flex justify-end pt-3">
              <div className="w-72 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">Rp {formSubtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Total Diskon (Rp):</span>
                  <span className="font-mono">- Rp {formTotalDiscount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN (11%):</span>
                  <span className="font-mono">Rp {formTax.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-indigo-700">Rp {formGrandTotal.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Alasan Belum Lunas (Poin 8) *</label>
            <input
              type="text"
              value={unpaidReason}
              onChange={(e) => setUnpaidReason(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </DnaModal>

      {/* Modal Import Excel */}
      <DnaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Faktur Pembelian dari File Excel"
        description="Unggah file .xlsx / .csv yang berisi rincian faktur pembelian, item barang, dan diskon nominal."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsImportModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={handleImportExcel}
            >
              Proses Import Data
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
            <div className="font-bold text-slate-800">Klik untuk upload file Excel (.xlsx / .csv)</div>
            <div className="text-slate-500 text-[11px] mt-1">Maksimal ukuran file 10MB</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
            <span className="font-bold block mb-1">Petunjuk Kolom Excel:</span>
            NoFaktur, TanggalInvoice, Vendor, NoPO, KategoriCOA, KodeItem, Qty, HargaSatuan, DiskonRp, JatuhTempo
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
