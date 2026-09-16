"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  Plus,
  Eye,
  CreditCard,
  Upload,
  Calendar,
  Filter,
  Save,
  Trash2,
  FileText,
  DollarSign,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  ArrowDownLeft,
  Receipt,
  Download,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaCell,
  DnaModal,
  DnaButton,
  DnaInput,
  useDnaToast,
} from "@/components/dna";

export interface InvoiceItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  price: number;
  discount: number; // Diskon nominal (Rp)
  total: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  soNumber: string;
  customerName: string;
  brandName: string;
  invoiceDate: string; // Tanggal invoice custom
  dueDate: string;
  subtotal: number;
  totalDiscount: number;
  taxAmount: number; // PPN 11%
  downPaymentOffset: number; // Potongan DP yang sudah disetor
  grandTotal: number;
  paidAmount: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  arGatekeeperStatus: "HELD" | "RELEASED"; // AR Gatekeeper DO
  unpaidReason?: string; // Alasan belum lunas
  notes?: string;
  items: InvoiceItemDetail[];
  picBusDev: string;
}

const INITIAL_SALES_INVOICES: SalesInvoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-202603-0001",
    soNumber: "SO-2026-001",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "C-Jelita Herbal",
    invoiceDate: "2026-03-05",
    dueDate: "2026-04-05",
    subtotal: 130000000,
    totalDiscount: 5000000,
    taxAmount: 13750000,
    downPaymentOffset: 65000000,
    grandTotal: 73750000,
    paidAmount: 0,
    paymentStatus: "UNPAID",
    arGatekeeperStatus: "HELD",
    unpaidReason: "Menunggu pelunasan termin ke-2 sebelum DO delivery released.",
    notes: "Batch 1 formulasi 10.000 pcs Brightening Niacinamide Serum.",
    picBusDev: "Andi Pratama",
    items: [
      {
        id: "itm-1",
        itemCode: "FG-SRM-001",
        itemName: "Brightening Niacinamide Serum 10% 30ml",
        qty: 10000,
        unit: "pcs",
        price: 13000,
        discount: 5000000,
        total: 125000000,
      },
    ],
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-202603-0002",
    soNumber: "SO-2026-003",
    customerName: "CV Aura Natural Skincare",
    brandName: "AuraGlow Botanical",
    invoiceDate: "2026-03-02",
    dueDate: "2026-03-16",
    subtotal: 75000000,
    totalDiscount: 2000000,
    taxAmount: 8030000,
    downPaymentOffset: 32000000,
    grandTotal: 49030000,
    paidAmount: 49030000,
    paymentStatus: "PAID",
    arGatekeeperStatus: "RELEASED",
    unpaidReason: "",
    notes: "Lunas transfer BCA Maklon. Surat Jalan DO-2026-003 diterbitkan.",
    picBusDev: "Siti Rahma",
    items: [
      {
        id: "itm-2",
        itemCode: "FG-MST-002",
        itemName: "Centella Soothing Moisturizer Gel 50gr",
        qty: 5000,
        unit: "pcs",
        price: 15000,
        discount: 2000000,
        total: 73000000,
      },
    ],
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-202602-0014",
    soNumber: "SO-2026-004",
    customerName: "PT Derma Estetika Utama",
    brandName: "DermaGleam Pro",
    invoiceDate: "2026-02-26",
    dueDate: "2026-03-26",
    subtotal: 190000000,
    totalDiscount: 0,
    taxAmount: 20900000,
    downPaymentOffset: 45000000,
    grandTotal: 165900000,
    paidAmount: 80000000,
    paymentStatus: "PARTIAL",
    arGatekeeperStatus: "HELD",
    unpaidReason: "Pembayaran termin parsial 50%, sisa Rp 85.900.000 dijanjikan 15 Maret.",
    notes: "Pengiriman batch 1 diizinkan sebagian sesuai saldo terbayar.",
    picBusDev: "Budi Santoso",
    items: [
      {
        id: "itm-3",
        itemCode: "FG-SUN-003",
        itemName: "Hydrating Hybrid Sunscreen SPF 50+ 40ml",
        qty: 10000,
        unit: "pcs",
        price: 19000,
        discount: 0,
        total: 190000000,
      },
    ],
  },
];

function FakturPenjualanContent() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<SalesInvoice[]>(INITIAL_SALES_INVOICES);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailInvoice, setDetailInvoice] = useState<SalesInvoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formSoNumber, setFormSoNumber] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formInvoiceDate, setFormInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDueDate, setFormDueDate] = useState("");
  const [formSubtotal, setFormSubtotal] = useState("");
  const [formDiscount, setFormDiscount] = useState("0");
  const [formDpOffset, setFormDpOffset] = useState("0");
  const [formNotes, setFormNotes] = useState("");
  const [formPic, setFormPic] = useState("Andi Pratama");

  // Tab Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      let matchesTab = true;
      if (activeTab === "paid") {
        matchesTab = inv.paymentStatus === "PAID";
      } else if (activeTab === "unpaid") {
        matchesTab = inv.paymentStatus === "UNPAID" || inv.paymentStatus === "PARTIAL";
      }

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.soNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.brandName.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [invoices, activeTab, searchTerm]);

  // KPIs
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalUnpaid = totalInvoiced - totalPaid;
  const heldCount = invoices.filter((i) => i.arGatekeeperStatus === "HELD").length;

  const countAll = invoices.length;
  const countPaid = invoices.filter((i) => i.paymentStatus === "PAID").length;
  const countUnpaid = invoices.filter((i) => i.paymentStatus !== "PAID").length;

  const toggleGatekeeper = (invId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invId) {
          const nextStatus = inv.arGatekeeperStatus === "HELD" ? "RELEASED" : "HELD";
          toast.success(
            "AR Gatekeeper Diperbarui",
            `Delivery Order untuk ${inv.invoiceNumber} kini berstatus ${nextStatus}.`
          );
          return { ...inv, arGatekeeperStatus: nextStatus };
        }
        return inv;
      })
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || !formSubtotal || Number(formSubtotal) <= 0) {
      toast.error("Validasi Gagal", "Harap isi nama klien dan subtotal tagihan dengan benar.");
      return;
    }

    const sub = Number(formSubtotal);
    const disc = Number(formDiscount) || 0;
    const dp = Number(formDpOffset) || 0;
    const taxable = Math.max(0, sub - disc);
    const tax = taxable * 0.11;
    const grand = Math.max(0, taxable + tax - dp);
    const invNum = formInvoiceNumber || `INV-202603-000${invoices.length + 1}`;

    const newInv: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      soNumber: formSoNumber || "SO-2026-999",
      customerName: formCustomer,
      brandName: formBrand || "Private Label",
      invoiceDate: formInvoiceDate,
      dueDate: formDueDate || "2026-04-15",
      subtotal: sub,
      totalDiscount: disc,
      taxAmount: tax,
      downPaymentOffset: dp,
      grandTotal: grand,
      paidAmount: 0,
      paymentStatus: "UNPAID",
      arGatekeeperStatus: "HELD",
      unpaidReason: "Tagihan baru diterbitkan, menunggu jatuh tempo pembayaran klien.",
      notes: formNotes,
      picBusDev: formPic,
      items: [
        {
          id: `item-${Date.now()}`,
          itemCode: "FG-CUST-01",
          itemName: "Finished Goods Maklon",
          qty: 1000,
          unit: "pcs",
          price: sub / 1000,
          discount: disc,
          total: taxable,
        },
      ],
    };

    setInvoices([newInv, ...invoices]);
    toast.success("Faktur Penjualan Dibuat", `${newInv.invoiceNumber} sebesar Rp ${grand.toLocaleString("id-ID")} diterbitkan.`);
    setIsCreateOpen(false);

    // Reset
    setFormInvoiceNumber("");
    setFormSoNumber("");
    setFormCustomer("");
    setFormBrand("");
    setFormSubtotal("");
    setFormDiscount("0");
    setFormDpOffset("0");
    setFormNotes("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <DnaPageHeader
        title="FAKTUR PENJUALAN & AR GATEKEEPER"
        description="Penerbitan billing penagihan piutang maklon kosmetik, kompensasi potongan DP, tanggal custom invoice, dan kontrol AR Gatekeeper (tahan / rilis Surat Jalan DO pengiriman gudang)."
        tabs={[
          { key: "all", label: "Semua Tagihan", count: countAll },
          { key: "paid", label: "Sudah Dibayar (Lunas)", count: countPaid },
          { key: "unpaid", label: "Belum Dibayar (Piutang)", count: countUnpaid },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaButton
              variant="secondary"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => setIsExcelOpen(true)}
            >
              Import / Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Buat Faktur Penjualan
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Piutang Tertagih (Grand Total)",
            value: `Rp ${(totalInvoiced / 1000000).toFixed(1)} Jt`,
            subtitle: `${countAll} faktur penjualan aktif`,
            trend: "+15% bln ini",
            icon: DollarSign,
            variant: "blue",
          },
          {
            label: "Kas Masuk / Terbayar",
            value: `Rp ${(totalPaid / 1000000).toFixed(1)} Jt`,
            subtitle: `${countPaid} tagihan lunas`,
            trend: "Realized AR",
            icon: CheckCircle2,
            variant: "emerald",
          },
          {
            label: "Sisa Piutang Berjalan (Outstanding)",
            value: `Rp ${(totalUnpaid / 1000000).toFixed(1)} Jt`,
            subtitle: `${countUnpaid} menunggu pelunasan`,
            trend: "Butuh follow-up",
            icon: Clock,
            variant: "amber",
          },
          {
            label: "Delivery Order Ditahan (AR Gatekeeper)",
            value: `${heldCount} Pengiriman`,
            subtitle: "Terkunci sebelum lunas / syarat DP",
            trend: "Perlindungan aset",
            icon: ShieldAlert,
            variant: heldCount > 0 ? "critical" : "purple",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        title={`Daftar Faktur Penjualan: ${
          activeTab === "all"
            ? "Semua Siklus Tagihan"
            : activeTab === "paid"
            ? "Faktur Lunas (Sudah Terbayar)"
            : "Faktur Menunggu Pelunasan (Piutang Belum Lunas)"
        }`}
        count={filteredInvoices.length}
        totalItems={invoices.length}
        actions={
          <div className="w-72">
            <DnaInput
              placeholder="Cari no faktur, SO, klien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Contract Type</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Diskon (Rp)</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Delivery Gatekeeper</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada faktur ditemukan</p>
                    <p className="text-xs text-slate-400">Sesuaikan filter atau buat faktur baru.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const remaining = inv.grandTotal - inv.paidAmount;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-blue-600 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {inv.customerName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {inv.brandName ? "Jasa Maklon" : "Jual Putus"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono">
                        {inv.dueDate}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        Rp {inv.grandTotal.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        Rp {inv.totalDiscount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        Rp {remaining.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <DnaCell.Badge
                          status={
                            inv.paymentStatus === "PAID"
                              ? "success"
                              : inv.paymentStatus === "PARTIAL"
                              ? "warning"
                              : "critical"
                          }
                          label={
                            inv.paymentStatus === "PAID"
                              ? "Lunas"
                              : inv.paymentStatus === "PARTIAL"
                              ? "Sebagian"
                              : "Belum Bayar"
                          }
                        />
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleGatekeeper(inv.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-tight border transition-all cursor-pointer ${
                            inv.arGatekeeperStatus === "RELEASED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                          title="Klik untuk ubah status tahan/lepas pengiriman DO"
                        >
                          {inv.arGatekeeperStatus === "RELEASED" ? "RELEASED" : "HELD"}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={inv.unpaidReason || inv.notes}>
                        {inv.unpaidReason || inv.notes || "—"}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <DnaButton variant="ghost" size="sm" onClick={() => setDetailInvoice(inv)}>
                            Lihat
                          </DnaButton>
                          <button
                            type="button"
                            onClick={() => {
                              toast.info("Input Pembayaran", `Buka pembayaran untuk ${inv.invoiceNumber}`);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Bayar Tagihan"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal Detail Faktur Penjualan */}
      <DnaModal
        isOpen={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        title="Rincian Faktur Penjualan & Gatekeeper"
        size="lg"
      >
        {detailInvoice && (
          <div className="space-y-5 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nomor Faktur Penjualan
                </span>
                <h3 className="text-base font-bold text-slate-900">{detailInvoice.invoiceNumber}</h3>
                <p className="text-xs text-slate-500">
                  Tgl Invoice: {detailInvoice.invoiceDate} • Jatuh Tempo: {detailInvoice.dueDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DnaCell.Badge
                  status={
                    detailInvoice.paymentStatus === "PAID"
                      ? "success"
                      : detailInvoice.paymentStatus === "PARTIAL"
                      ? "warning"
                      : "critical"
                  }
                  label={
                    detailInvoice.paymentStatus === "PAID"
                      ? "Lunas"
                      : detailInvoice.paymentStatus === "PARTIAL"
                      ? "Sebagian"
                      : "Belum Bayar"
                  }
                />
                <span
                  className={`px-2 py-1 rounded text-xs font-bold border ${
                    detailInvoice.arGatekeeperStatus === "RELEASED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {detailInvoice.arGatekeeperStatus === "RELEASED" ? "DO RELEASED" : "DO HELD"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 block">Klien Pemesan</span>
                <span className="font-semibold text-slate-900 text-xs">{detailInvoice.customerName}</span>
                <p className="text-[11px] text-slate-500">Brand: {detailInvoice.brandName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">No. Sales Order</span>
                <span className="font-mono font-semibold text-blue-600 text-xs">
                  {detailInvoice.soNumber}
                </span>
                <p className="text-[11px] text-slate-500">PIC BusDev: {detailInvoice.picBusDev}</p>
              </div>
            </div>

            {/* Table Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase">
                  <tr>
                    <th className="p-3">Produk / Item</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Harga Satuan</th>
                    <th className="p-3 text-right">Diskon (Rp)</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailInvoice.items.map((it) => (
                    <tr key={it.id}>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">{it.itemName}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{it.itemCode}</p>
                      </td>
                      <td className="p-3 text-right font-medium">{it.qty.toLocaleString("id-ID")} {it.unit}</td>
                      <td className="p-3 text-right">Rp {it.price.toLocaleString("id-ID")}</td>
                      <td className="p-3 text-right text-rose-600 font-medium">-Rp {it.discount.toLocaleString("id-ID")}</td>
                      <td className="p-3 text-right font-bold text-slate-900">Rp {it.total.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rekapitulasi Pembayaran & Offset DP */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal Barang:</span>
                <span className="font-semibold text-slate-800">Rp {detailInvoice.subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Diskon (Rp):</span>
                <span>-Rp {detailInvoice.totalDiscount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PPN 11%:</span>
                <span className="font-semibold text-slate-800">Rp {detailInvoice.taxAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold border-t border-slate-100 pt-1">
                <span>Potongan Down Payment (Kompensasi DP):</span>
                <span>-Rp {detailInvoice.downPaymentOffset.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total Tagihan:</span>
                <span>Rp {detailInvoice.grandTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 pt-1">
                <span>Sudah Dibayar:</span>
                <span>Rp {detailInvoice.paidAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600 border-t border-slate-100 pt-1">
                <span>Sisa Piutang (Outstanding):</span>
                <span>Rp {(detailInvoice.grandTotal - detailInvoice.paidAmount).toLocaleString("id-ID")}</span>
              </div>
            </div>

            {detailInvoice.unpaidReason && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">Catatan Piutang / Alasan Belum Lunas:</span>
                {detailInvoice.unpaidReason}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setDetailInvoice(null)}>
                Tutup
              </DnaButton>
              <DnaButton
                variant={detailInvoice.arGatekeeperStatus === "HELD" ? "primary" : "outline"}
                onClick={() => {
                  toggleGatekeeper(detailInvoice.id);
                  setDetailInvoice(null);
                }}
              >
                {detailInvoice.arGatekeeperStatus === "HELD" ? "Rilis DO (Release)" : "Tahan DO (Hold)"}
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Buat Faktur Penjualan Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Terbitkan Faktur Penjualan Baru"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nomor Faktur (Kosongkan utk auto)</label>
              <DnaInput
                placeholder="Contoh: INV-202603-0004"
                value={formInvoiceNumber}
                onChange={(e) => setFormInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">No. Referensi Sales Order *</label>
              <DnaInput
                placeholder="Contoh: SO-2026-001"
                value={formSoNumber}
                onChange={(e) => setFormSoNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Klien / Perusahaan *</label>
              <DnaInput
                placeholder="Contoh: PT Cantika Jelita Nusantara"
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Brand Klien</label>
              <DnaInput
                placeholder="Contoh: C-Jelita Herbal"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tanggal Faktur (Custom Date) *</label>
              <DnaInput
                type="date"
                value={formInvoiceDate}
                onChange={(e) => setFormInvoiceDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tanggal Jatuh Tempo *</label>
              <DnaInput
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Subtotal Barang (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="Contoh: 100000000"
                value={formSubtotal}
                onChange={(e) => setFormSubtotal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Diskon Nominal (Rp)</label>
              <DnaInput
                type="number"
                placeholder="0"
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Potongan DP (Offset Rp)</label>
              <DnaInput
                type="number"
                placeholder="0"
                value={formDpOffset}
                onChange={(e) => setFormDpOffset(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Faktur & Termin Pembayaran</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: Termin 30 hari. Barang ditahan sampai transfer pelunasan diterima."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Terbitkan Faktur
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* Modal Import / Export Excel */}
      <DnaModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        title="Import / Export Excel Faktur Penjualan"
        size="md"
      >
        <div className="space-y-4 text-sm">
          <p className="text-xs text-slate-500">
            Unggah file spreadsheet (.xlsx/.csv) untuk sinkronisasi massal faktur penjualan atau unduh laporan buku piutang.
          </p>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-xs text-slate-700">Tarik & Lepas file Excel di sini</p>
            <p className="text-[10px] text-slate-400 mt-1">Mendukung format .xlsx, .xls, .csv hingga 10MB</p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <DnaButton
              variant="outline"
              icon={<Download className="w-4 h-4" />}
              onClick={() => {
                toast.success("Download Template", "Template Faktur_Penjualan.xlsx berhasil diunduh.");
              }}
            >
              Unduh Template
            </DnaButton>
            <div className="flex gap-2">
              <DnaButton variant="secondary" onClick={() => setIsExcelOpen(false)}>
                Batal
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={() => {
                  toast.success("Import Berhasil", "3 data tagihan berhasil diimpor.");
                  setIsExcelOpen(false);
                }}
              >
                Mulai Import
              </DnaButton>
            </div>
          </div>
        </div>
      </DnaModal>
    </div>
  );
}

export default function FakturPenjualanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Faktur Penjualan...</div>}>
      <FakturPenjualanContent />
    </Suspense>
  );
}
