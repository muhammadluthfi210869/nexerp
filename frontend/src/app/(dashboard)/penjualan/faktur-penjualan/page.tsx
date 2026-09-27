"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  DnaBadge,
  DnaModal,
  DnaDetailDrawer,
  DnaButton,
  DnaInput,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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

function FakturPenjualanContent() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

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

  // Query live Invoices
  const {
    data: invoices = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SalesInvoice[]>({
    queryKey: ["commercial-invoices"],
    queryFn: async () => {
      const resp = await api.get("/commercial/invoices");
      return (resp.data || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.id,
        soNumber: inv.salesOrder?.orderNumber || inv.soId || "-",
        customerName: inv.salesOrder?.lead?.clientName || inv.customerName || "Customer",
        brandName: inv.salesOrder?.brandName || inv.brandName || "Brand",
        invoiceDate: inv.invoiceDate
          ? new Date(inv.invoiceDate).toISOString().split("T")[0]
          : inv.createdAt
          ? new Date(inv.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "2026-04-15",
        subtotal: Number(inv.amountDue) || 0,
        totalDiscount: Number(inv.discountAmount) || 0,
        taxAmount: Number(inv.taxAmount) || 0,
        downPaymentOffset: Number(inv.downPaymentOffset) || 0,
        grandTotal: Number(inv.amountDue) || 0,
        paidAmount: Number(inv.paidAmount) || 0,
        paymentStatus: (inv.status === "PAID"
          ? "PAID"
          : inv.status === "PARTIAL"
          ? "PARTIAL"
          : "UNPAID") as "PAID" | "UNPAID" | "PARTIAL",
        arGatekeeperStatus: (inv.salesOrder?.deliveryGateStatus || "HELD") as "HELD" | "RELEASED",
        unpaidReason:
          inv.unpaidReason ||
          (inv.status !== "PAID" ? "Menunggu pelunasan termin ke-2 sebelum DO delivery released." : undefined),
        notes: inv.notes || "",
        picBusDev: inv.salesOrder?.lead?.pic?.name || "Andi Pratama",
        items: (inv.items || []).map((it: any) => ({
          id: it.id,
          itemCode: it.productId || "FG-ITEM",
          itemName: it.description || it.productName || "Finished Goods Maklon",
          qty: Number(it.quantity) || 1000,
          unit: "pcs",
          price: Number(it.unitPrice) || Number(inv.amountDue) || 0,
          discount: Number(it.discount) || 0,
          total: Number(it.subtotal) || Number(inv.amountDue) || 0,
        })),
      }));
    },
  });

  // Query SOs
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders-dropdown"],
    queryFn: async () => {
      try {
        const resp = await api.get("/commercial/sales-orders");
        return resp.data || [];
      } catch {
        return [];
      }
    },
  });

  // Release Delivery Gate Mutation
  const releaseGatekeeperMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return api.post(`/commercial/invoices/${invoiceId}/release-delivery`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-invoices"] });
      toast.success(
        "AR Gatekeeper Diperbarui",
        "Delivery Order untuk tagihan kini berstatus RELEASED."
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal merilis delivery gatekeeper";
      toast.error("Gagal", msg);
    },
  });

  // Create Invoice Mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/commercial/invoices", payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["commercial-invoices"] });
      toast.success(
        "Faktur Penjualan Dibuat",
        `${variables.id} sebesar Rp ${Number(variables.amountDue).toLocaleString("id-ID")} diterbitkan.`
      );
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
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal menerbitkan faktur";
      toast.error("Validasi Gagal", msg);
    },
  });

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
    releaseGatekeeperMutation.mutate(invId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubtotal || Number(formSubtotal) <= 0) {
      toast.error("Validasi Gagal", "Harap isi subtotal tagihan dengan benar.");
      return;
    }

    const sub = Number(formSubtotal);
    const disc = Number(formDiscount) || 0;
    const dp = Number(formDpOffset) || 0;
    const taxable = Math.max(0, sub - disc);
    const tax = taxable * 0.11;
    const grand = Math.max(0, taxable + tax - dp);
    const invNum = formInvoiceNumber || `INV-${Date.now().toString().slice(-6)}`;

    const matchedSO = salesOrders.find(
      (so: any) =>
        so.orderNumber?.toLowerCase() === formSoNumber.trim().toLowerCase() ||
        so.lead?.clientName?.toLowerCase() === formCustomer.trim().toLowerCase()
    );
    const soId = matchedSO?.id || (salesOrders[0]?.id ?? "00000000-0000-0000-0000-000000000001");

    createInvoiceMutation.mutate({
      id: invNum,
      soId,
      type: "PELUNASAN",
      amountDue: grand,
      invoiceDate: formInvoiceDate,
      overrideCreditLimit: true,
      overrideReason: "Otorisasi manual manajemen",
    });
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
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : isError ? (
        <DnaErrorState
          title="Gagal Memuat Faktur Penjualan"
          message={(error as any)?.message || "Terjadi kesalahan saat memuat data tagihan."}
          onRetry={() => refetch()}
        />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchPlaceholder: "Cari no faktur, SO, pelanggan, atau brand...",
            searchValue: searchTerm,
            onSearchChange: setSearchTerm,
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <DnaTh className="px-4 py-2.5 w-[170px]">No. Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">No. Sales Order</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tgl Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Jatuh Tempo</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Pelanggan & Brand</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Total Tagihan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Sisa Piutang</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status Bayar</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">AR Gatekeeper</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredInvoices.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="text-center py-12 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                      <p className="font-semibold text-slate-600">Tidak ada faktur ditemukan</p>
                      <p className="text-xs text-slate-400">Sesuaikan filter atau buat faktur baru.</p>
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredInvoices.map((inv) => {
                    const remaining = inv.grandTotal - inv.paidAmount;
                    return (
                      <DnaTableRow key={inv.id} className="h-[48px] hover:bg-slate-50/60 transition-colors">
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={inv.invoiceNumber} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={inv.soNumber} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Text text={inv.invoiceDate} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Text text={inv.dueDate} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <div>
                            <div className="text-[12px] font-medium text-slate-900 line-clamp-1">{inv.customerName}</div>
                            <div className="text-[10.5px] text-slate-400 font-normal mt-0.5 line-clamp-1">{inv.brandName || "Reguler"}</div>
                          </div>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right">
                          <DnaCell.Numeric value={inv.grandTotal} prefix="Rp " />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums">
                          <span className={`text-[12px] font-semibold ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            Rp {remaining.toLocaleString("id-ID")}
                          </span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          <DnaBadge
                            variant={
                              inv.paymentStatus === "PAID"
                                ? "success"
                                : inv.paymentStatus === "PARTIAL"
                                ? "warning"
                                : "critical"
                            }
                          >
                            {inv.paymentStatus === "PAID"
                              ? "Lunas"
                              : inv.paymentStatus === "PARTIAL"
                              ? "Sebagian"
                              : "Belum Bayar"}
                          </DnaBadge>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => toggleGatekeeper(inv.id)}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                              inv.arGatekeeperStatus === "RELEASED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                            }`}
                            title="Klik untuk ubah status tahan/lepas pengiriman DO"
                          >
                            DO {inv.arGatekeeperStatus}
                          </button>
                        </DnaTd>
                        <DnaTd className="pr-4 py-2.5 text-right">
                          <DnaButton
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            onClick={() => setDetailInvoice(inv)}
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* Detail Invoice Drawer */}
      <DnaDetailDrawer
        isOpen={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        title={detailInvoice?.invoiceNumber || "Rincian Faktur Penjualan"}
        subtitle={detailInvoice ? `${detailInvoice.customerName} • ${detailInvoice.brandName}` : undefined}
        badge={
          detailInvoice ? (
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
                className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  detailInvoice.arGatekeeperStatus === "RELEASED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                DO {detailInvoice.arGatekeeperStatus}
              </span>
            </div>
          ) : undefined
        }
        actions={
          detailInvoice ? (
            <div className="flex items-center justify-between w-full">
              <DnaButton
                variant={detailInvoice.arGatekeeperStatus === "HELD" ? "primary" : "secondary"}
                onClick={() => {
                  toggleGatekeeper(detailInvoice.id);
                  setDetailInvoice({
                    ...detailInvoice,
                    arGatekeeperStatus: detailInvoice.arGatekeeperStatus === "HELD" ? "RELEASED" : "HELD",
                  });
                }}
              >
                {detailInvoice.arGatekeeperStatus === "HELD" ? "Rilis DO Pengiriman" : "Tahan DO (Hold)"}
              </DnaButton>
              <DnaButton variant="secondary" onClick={() => setDetailInvoice(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {detailInvoice && (
          <div className="space-y-5 text-xs">
            {/* Meta Information Cards */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Sales Order</span>
                <span className="tabular-nums font-bold text-blue-600 text-xs">{detailInvoice.soNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIC BusDev</span>
                <span className="font-semibold text-slate-800 text-xs">{detailInvoice.picBusDev}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tgl Faktur</span>
                <span className="tabular-nums text-slate-700 text-xs">{detailInvoice.invoiceDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jatuh Tempo</span>
                <span className="tabular-nums font-semibold text-rose-600 text-xs">{detailInvoice.dueDate}</span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Item Barang / Jasa</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="p-2.5">Produk / Item</DnaTh>
                      <DnaTh className="p-2.5 text-right">Qty</DnaTh>
                      <DnaTh className="p-2.5 text-right">Harga Satuan</DnaTh>
                      <DnaTh className="p-2.5 text-right">Subtotal</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {detailInvoice.items.map((it) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd className="p-2.5">
                          <p className="font-bold text-slate-800">{it.itemName}</p>
                          <p className="text-[10px] text-slate-400 tabular-nums">{it.itemCode}</p>
                        </DnaTd>
                        <DnaTd className="p-2.5 text-right font-medium">{it.qty.toLocaleString("id-ID")} {it.unit}</DnaTd>
                        <DnaTd className="p-2.5 text-right tabular-nums">Rp {it.price.toLocaleString("id-ID")}</DnaTd>
                        <DnaTd className="p-2.5 text-right font-bold text-slate-900 tabular-nums">Rp {it.total.toLocaleString("id-ID")}</DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {/* Rekapitulasi Pembayaran & Offset DP */}
            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Rincian Finansial</p>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal Barang:</span>
                <span className="font-semibold text-slate-800 tabular-nums">Rp {detailInvoice.subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Diskon (Rp):</span>
                <span className="tabular-nums">-Rp {detailInvoice.totalDiscount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PPN 11%:</span>
                <span className="font-semibold text-slate-800 tabular-nums">Rp {detailInvoice.taxAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold border-t border-slate-200 pt-1.5">
                <span>Potongan Down Payment (Kompensasi DP):</span>
                <span className="tabular-nums">-Rp {detailInvoice.downPaymentOffset.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total Tagihan:</span>
                <span className="tabular-nums text-blue-600">Rp {detailInvoice.grandTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 pt-1">
                <span>Sudah Dibayar:</span>
                <span className="tabular-nums text-emerald-600">Rp {detailInvoice.paidAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600 border-t border-slate-200 pt-1.5">
                <span>Sisa Piutang (Outstanding):</span>
                <span className="tabular-nums">Rp {(detailInvoice.grandTotal - detailInvoice.paidAmount).toLocaleString("id-ID")}</span>
              </div>
            </div>

            {detailInvoice.unpaidReason && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">Catatan Piutang / Alasan Belum Lunas:</span>
                {detailInvoice.unpaidReason}
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

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
