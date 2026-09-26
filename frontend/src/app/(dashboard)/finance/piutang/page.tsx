"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  FileText,
  Receipt,
  ShoppingCart,
  ShieldCheck,
  FileCheck2,
  Building2,
  CreditCard,
  TrendingUp,
  Wallet,
  AlertTriangle,
  FlaskConical,
  Eye,
  ChevronRight,
  MoreHorizontal,
  Clock,
  CircleDollarSign,
  Package,
  RotateCcw,
  AlertCircle,
  Printer,
  Mail,
  ExternalLink,
  Loader2,
  History,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, DnaDataTableCard, DnaStatCard, DnaTabNav, DnaSelect, DnaTextarea, DnaEmptyState } from "@/components/dna";
import {
  DnaTable,
  DnaTableBody,
  DnaTd,
  DnaTh,
  DnaTableHead,
  DnaTableRow,
  DnaDialog as Dialog,
  DnaDialogContent as DialogContent,
  DnaDialogHeader as DialogHeader,
  DnaDialogTitle as DialogTitle,
  DnaDialogFooter as DialogFooter,
  DnaDialogDescription as DialogDescription,
} from "@/components/dna";
import { DashboardShell } from "@/components/layout/DashboardShell";
import Link from "next/link";
import { unwrapResponse } from "@/lib/unwrap-response";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ───────────────────────────────────────────
   Types
   ─────────────────────────────────────────── */
interface Invoice {
  id: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
  source: string;
}

interface Bill {
  id: string;
  vendor: string;
  date: string;
  dueDate: string;
  total: number;
  status: string;
}

/* ───────────────────────────────────────────
   AR Hub row shapes — mapped 1:1 from live endpoints.
   `pelanggan` / `kode_faktur` / `sisa` are the keys the collection modal reads.
   ─────────────────────────────────────────── */
interface ArInvoiceRow {
  id: string;
  kode_faktur: string;
  kode_so: string;
  ref: string;
  tanggal: string;
  pelanggan: string;
  produk?: string;
  grand_total: number;
  dibayar: number;
  sisa: number;
  status: string;
}

const num = (v: unknown) => Number(v ?? 0);
const fmtDate = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "—");

/* ───────────────────────────────────────────
   Faktur Penjualan Tab
   ─────────────────────────────────────────── */
function FakturJualTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["piutang-invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      const body = unwrapResponse<any>(resp);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows
        .filter((inv) => inv.category === "RECEIVABLE")
        .map((inv) => ({
          id: inv.invoiceNumber ?? "—",
          customer:
            inv.so?.lead?.clientName ||
            inv.workOrder?.lead?.clientName ||
            inv.customerName ||
            "Pelanggan tidak diketahui",
          date: inv.issuedAt ? new Date(inv.issuedAt).toISOString().split("T")[0] : "—",
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "—",
          amount: Number(inv.outstandingAmount ?? inv.amountDue ?? inv.totalAmount ?? 0),
          status: inv.status,
          source: inv.so?.orderNumber ? "Sales Order" : inv.workOrder?.woNumber ? "Work Order" : "Faktur",
        }));
    },
  });

  const filtered = (invoices ?? []).filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceivables = (invoices ?? []).reduce((acc, inv) => acc + inv.amount, 0);
  const overdue = (invoices ?? []).filter(
    (inv) => inv.dueDate !== "—" && new Date(inv.dueDate).getTime() < Date.now()
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DnaStatCard label="Total Receivables" value={`Rp ${totalReceivables.toLocaleString("id-ID")}`} subValue={`${(invoices ?? []).length} Faktur`} icon={<CreditCard className="text-blue-600" />} />
        <DnaStatCard label="Collected (MTD)" value="—" subValue="Dari Ledger Faktur" icon={<Wallet className="text-emerald-500" />} />
        <DnaStatCard label="Overdue" value={`${overdue.length} Faktur`} subValue="Lewat Jatuh Tempo" icon={<AlertTriangle className="text-amber-500" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Faktur Penjualan</h3>
        <Link href="/finance/invoices" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <FileCheck2 className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      <DnaDataTableCard
        customToolbar={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        }
      >
        <DnaTable className="table-dense">
          <DnaTableHead className="bg-slate-50/70">
            <DnaTableRow className="hover:bg-transparent border-slate-100">
              <DnaTh className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice Identity</DnaTh>
              <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Client / Partner</DnaTh>
              <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Commercial Origin</DnaTh>
              <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Amount Due</DnaTh>
              <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</DnaTh>
              <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filtered.map((inv) => (
              <DnaTableRow key={inv.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                <DnaTd className="pl-6 text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <FileCheck2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.id}</span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">Due: {inv.dueDate}</span>
                    </div>
                  </div>
                </DnaTd>
                <DnaTd className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-500 uppercase">{inv.customer.charAt(0)}</div>
                    <p className="font-black text-slate-900 text-xs uppercase italic">{inv.customer}</p>
                  </div>
                </DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant="default">{inv.source}</DnaBadge>
                </DnaTd>
                <DnaTd className="text-right font-black text-slate-900 text-xs tabular-nums">Rp {inv.amount.toLocaleString("id-ID")}</DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "critical" : "info"}>{inv.status}</DnaBadge>
                </DnaTd>
                <DnaTd className="pr-6 text-right">
                  <div className="flex justify-end gap-1.5">
                    <DnaButton variant="outline" size="sm" icon={<Printer className="h-3.5 w-3.5" />} />
                    <DnaButton variant="outline" size="sm" icon={<Mail className="h-3.5 w-3.5" />} />
                    <DnaButton variant="outline" size="sm" icon={<MoreHorizontal className="h-3.5 w-3.5" />} />
                  </div>
                </DnaTd>
              </DnaTableRow>
            ))}
            {filtered.length === 0 && (
              <DnaTableRow>
                <DnaTd colSpan={6} className="text-center py-10 text-slate-400 italic">No invoices found.</DnaTd>
              </DnaTableRow>
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}

/* ───────────────────────────────────────────
   Faktur Pembelian Tab
   ─────────────────────────────────────────── */
function FakturBeliTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: bills } = useQuery<Bill[]>({
    queryKey: ["piutang-bills"],
    queryFn: async () => {
      const resp = await api.get("/finance/bills");
      const body = unwrapResponse<any>(resp);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows
        .filter((b) => b.category === "PAYABLE")
        .map((b) => ({
          id: b.billNumber ?? b.invoiceNumber ?? "—",
          vendor: b.vendorName || b.supplier?.name || "Vendor tidak diketahui",
          date: b.issuedAt ? new Date(b.issuedAt).toISOString().split("T")[0] : "—",
          dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split("T")[0] : "—",
          total: Number(b.outstandingAmount ?? b.totalAmount ?? 0),
          status: b.status,
        }));
    },
  });

  const filtered = (bills ?? []).filter(
    (b) => b.id.toLowerCase().includes(searchTerm.toLowerCase()) || b.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebt = (bills ?? []).reduce((acc, b) => acc + b.total, 0);
  const paid = (bills ?? []).filter((b) => b.status === "PAID").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Total Debt (AP)" value={`Rp ${totalDebt.toLocaleString("id-ID")}`} icon={<AlertCircle className="text-rose-600" />} />
        <DnaStatCard label="Jumlah Faktur" value={`${(bills ?? []).length} Faktur`} icon={<CreditCard className="text-amber-600" />} />
        <DnaStatCard label="Belum Lunas" value={`${(bills ?? []).length - paid} Faktur`} icon={<Package className="text-slate-500" />} />
        <DnaStatCard label="Lunas" value={`${paid} Faktur`} icon={<Receipt className="text-emerald-600" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Faktur Pembelian</h3>
        <Link href="/finance/bills" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <Receipt className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      <DnaDataTableCard
        customToolbar={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search bills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        }
      >
        <DnaTable>
          <DnaTableHead className="bg-slate-50/50">
            <DnaTableRow className="hover:bg-transparent border-slate-100">
              <DnaTh className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Bill ID</DnaTh>
              <DnaTh className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Vendor Entity</DnaTh>
              <DnaTh className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Timeline</DnaTh>
              <DnaTh className="py-4 px-4 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Balance</DnaTh>
              <DnaTh className="py-4 px-4 text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</DnaTh>
              <DnaTh className="pr-10 text-right py-4 px-4 font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filtered.map((bill) => (
              <DnaTableRow key={bill.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                <DnaTd className="py-8 pl-10 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{bill.id}</span>
                  </div>
                </DnaTd>
                <DnaTd className="text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="font-black text-slate-900 text-sm uppercase italic">{bill.vendor}</p>
                  </div>
                </DnaTd>
                <DnaTd className="text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Issue: {bill.date}</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Due: {bill.dueDate}
                    </p>
                  </div>
                </DnaTd>
                <DnaTd className="text-right font-black text-slate-900 tabular-nums">Rp {bill.total.toLocaleString("id-ID")}</DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant={bill.status === "PAID" ? "success" : bill.status === "PARTIAL" ? "warning" : "critical"}>{bill.status}</DnaBadge>
                </DnaTd>
                <DnaTd className="pr-10 text-right">
                  <div className="flex justify-end gap-2">
                    <DnaButton variant="outline" size="sm" icon={<ShieldCheck className="h-4 w-4" />} />
                    <DnaButton variant="outline" size="sm" icon={<MoreHorizontal className="h-4 w-4" />} />
                  </div>
                </DnaTd>
              </DnaTableRow>
            ))}
            {filtered.length === 0 && (
              <DnaTableRow>
                <DnaTd colSpan={6} className="text-center py-10 text-slate-400 italic">No bills found.</DnaTd>
              </DnaTableRow>
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}

/* ───────────────────────────────────────────
   Sales Orders Tab
   ─────────────────────────────────────────── */
function SalesOrdersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["piutang-sales-orders"],
    queryFn: async () => (await api.get("/finance/sales-orders")).data,
  });

  const filteredOrders = orders?.filter(
    (o: any) =>
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.lead?.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingVerification = orders?.filter((o: any) => o.paymentProofUrl && !o.isPaymentVerified) || [];

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Master Sales Order Log</h3>
        <Link href="/finance/sales-orders" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <ShoppingCart className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      {pendingVerification.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
          {pendingVerification.map((order: any) => (
            <div
              key={order.id}
              className="p-6 bg-white border border-slate-200 shadow-sm border-l-4 border-amber-500 rounded-2xl group hover:scale-[1.02] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <DnaBadge variant="warning">AWAITING DP</DnaBadge>
                <span className="text-[10px] font-black text-slate-300">#{order.id}</span>
              </div>
              <h4 className="font-black text-slate-900 uppercase italic text-sm line-clamp-1">{order.lead?.clientName}</h4>
              <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1">{formatCurrency(Number(order.totalAmount))}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                <DnaButton
                  variant="primary"
                  className="flex-1 h-10 bg-blue-600 hover:bg-amber-500 rounded-xl"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsProofModalOpen(true);
                  }}
                >
                  Verify Payment
                </DnaButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <DnaDataTableCard
        customToolbar={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search orders, clients, or IDs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        }
      >
        <DnaTable className="table-dense">
          <DnaTableHead className="bg-slate-50/50">
            <DnaTableRow className="border-slate-100">
              <DnaTh className="py-4 pl-6 font-black text-slate-400 uppercase tracking-tight text-[10px]">Order Protocol</DnaTh>
              <DnaTh className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Commercial Value</DnaTh>
              <DnaTh className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Payment Intel</DnaTh>
              <DnaTh className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Lifecycle</DnaTh>
              <DnaTh className="pr-6 text-right py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Audit</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredOrders?.map((order: any) => (
              <DnaTableRow key={order.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                <DnaTd className="py-4 pl-6">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black italic shadow-sm group-hover:bg-amber-500 transition-all duration-500">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase italic text-base leading-none">{order.lead?.clientName}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-2 flex items-center gap-1">
                        <span className="text-amber-500 font-bold">ID:</span> {order.orderNumber} •{" "}
                        <span className="text-blue-500 font-bold">PIC:</span> {order.lead?.pic?.name}
                      </p>
                    </div>
                  </div>
                </DnaTd>
                <DnaTd>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm tracking-tighter tabular-nums">{formatCurrency(Number(order.totalAmount))}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">MOQ: {order.quantity?.toLocaleString()} Pcs</span>
                  </div>
                </DnaTd>
                <DnaTd className="text-center">
                  {order.isPaymentVerified ? (
                    <div className="flex flex-col items-center gap-1">
                      <DnaBadge variant="success">VERIFIED</DnaBadge>
                      <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tight">On {new Date(order.paymentVerifiedAt).toLocaleDateString()}</span>
                    </div>
                  ) : order.paymentProofUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <DnaBadge variant="warning" className="animate-pulse">PENDING VALIDATION</DnaBadge>
                      <DnaButton
                        variant="ghost"
                        className="h-6 text-[8px] text-blue-600 hover:bg-blue-50"
                        icon={<ExternalLink className="h-2 w-2" />}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsProofModalOpen(true);
                        }}
                      >
                        Review Proof
                      </DnaButton>
                    </div>
                  ) : (
                    <DnaBadge variant="default">AWAITING PROOF</DnaBadge>
                  )}
                </DnaTd>
                <DnaTd className="text-center">
                  <DnaBadge variant={order.status === "DP_PAID" ? "info" : order.status === "PENDING_DP" ? "warning" : "default"}>
                    {order.status?.replace("_", " ")}
                  </DnaBadge>
                </DnaTd>
                <DnaTd className="text-right pr-6">
                  <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </DnaButton>
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>

      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  Payment <span className="text-amber-400">Verification</span>
                </h3>
                <DialogDescription className="text-blue-200 font-medium uppercase text-[9px] tracking-tight mt-1">
                  Audit Protocol for SO #{selectedOrder?.orderNumber}
                </DialogDescription>
              </div>
              <ShieldCheck className="h-10 w-10 text-amber-400 opacity-50" />
            </div>
          </div>
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total Transaction</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter italic tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0))}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Expected DP (30%)</p>
                <p className="text-2xl font-black text-emerald-600 tracking-tighter italic tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0) * 0.3)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-tight text-slate-400 flex items-center gap-2">
                <Eye className="h-3 w-3" /> Transferred Proof Document
              </label>
              <div className="aspect-video w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 group overflow-hidden relative">
                {selectedOrder?.paymentProofUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-tight mb-4">Proof of transfer uploaded by BussDev</p>
                    <a
                      href={selectedOrder.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-tight py-3 px-8 rounded-xl shadow-sm hover:bg-amber-500 transition-all flex items-center gap-2"
                    >
                      Open Full Document <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-10">
                    <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4 opacity-50" />
                    <p className="text-xs font-black text-rose-900/60 uppercase italic">No Proof Document Attached</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="p-10 pt-0 flex gap-4">
            <DnaButton variant="outline" className="flex-1 h-16 rounded-2xl" onClick={() => setIsProofModalOpen(false)}>
              Reject & Notify BD
            </DnaButton>
            <DnaButton
              variant="primary"
              className="flex-[2] h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
              disabled={!selectedOrder?.paymentProofUrl}
            >
              Verify & Approve Order
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───────────────────────────────────────────
   AR Hub Tab
   ─────────────────────────────────────────── */
function ARHubTab() {
  const [activeTab, setActiveTab] = useState("products");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  // Receivables awaiting validation — same endpoint the /finance/ar-hub surface uses.
  const pendingQuery = useQuery<{ orders: ArInvoiceRow[]; samples: ArInvoiceRow[] }>({
    queryKey: ["piutang-ar-hub-pending"],
    queryFn: async () => {
      const resp = await api.get("/finance/ar-hub/pending");
      const body = unwrapResponse<any>(resp);
      const rawOrders: any[] = body?.orders ?? [];
      const rawSamples: any[] = body?.samples ?? [];

      return {
        orders: rawOrders.map((inv) => {
          const grand = num(inv.amountDue);
          const sisa = num(inv.outstanding);
          return {
            id: inv.id,
            kode_faktur: inv.invoiceNumber || "—",
            kode_so: inv.so?.orderNumber || inv.workOrder?.woNumber || "—",
            ref: inv.dueDate ? fmtDate(inv.dueDate) : "—",
            tanggal: fmtDate(inv.issuedAt),
            pelanggan:
              inv.so?.lead?.clientName || inv.workOrder?.lead?.clientName || "Pelanggan tidak diketahui",
            grand_total: grand,
            dibayar: grand - sisa,
            sisa,
            status: inv.status || "—",
          };
        }),
        samples: rawSamples.map((s) => {
          const amount = num(s.amount);
          return {
            id: s.id,
            kode_faktur: s.activityType === "DOWN_PAYMENT" ? "DP Order" : "Sample Fee",
            kode_so: s.lead?.productInterest || "—",
            ref: s.activityType || "—",
            tanggal: fmtDate(s.createdAt),
            pelanggan: s.lead?.clientName || "—",
            produk: s.lead?.productInterest || s.notes || "—",
            grand_total: amount,
            dibayar: 0,
            sisa: amount,
            status: "MENUNGGU VALIDASI",
          };
        }),
      };
    },
  });

  // Collection figures come from the invoice ledger, not a separate store.
  const invoicesQuery = useQuery<any[]>({
    queryKey: ["piutang-ar-hub-invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  // Sales returns live in the BusDev module.
  const returnsQuery = useQuery<any[]>({
    queryKey: ["piutang-ar-hub-returns"],
    retry: false,
    queryFn: async () => {
      try {
        const resp = await api.get("/bussdev/returns");
        const body = unwrapResponse<any>(resp);
        const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
        return rows.map((r) => ({
          id: r.id,
          no_retur: r.so?.orderNumber || "—",
          pelanggan: r.so?.lead?.clientName || "—",
          brand: r.so?.brandName || "—",
          tanggal: fmtDate(r.returnDate),
          jumlah_item: Array.isArray(r.items) ? r.items.length : 0,
          status: r.returnStatus || "—",
          catatan: r.notes || "—",
        }));
      } catch {
        return [];
      }
    },
  });

  const receivables = (invoicesQuery.data ?? []).filter((inv) => inv.category === "RECEIVABLE");
  const totalReceivables = receivables.reduce((acc, inv) => acc + num(inv.outstandingAmount), 0);
  const overdue30 = receivables
    .filter((inv) => {
      if (!inv.dueDate || num(inv.outstandingAmount) <= 0) return false;
      return new Date(inv.dueDate).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000;
    })
    .reduce((acc, inv) => acc + num(inv.outstandingAmount), 0);
  const now = new Date();
  const collectionsMtd = receivables
    .filter((inv) => {
      if (inv.status !== "PAID" || !inv.paidAt) return false;
      const paid = new Date(inv.paidAt);
      return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
    })
    .reduce((acc, inv) => acc + num(inv.amountDue), 0);

  const orders = pendingQuery.data?.orders ?? [];
  const samples = pendingQuery.data?.samples ?? [];
  const returns = returnsQuery.data ?? [];
  const sampleRevenue = samples.reduce((acc, s) => acc + s.sisa, 0);

  const rp = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Total Receivables" value={rp(totalReceivables)} subValue={`${receivables.filter((i) => num(i.outstandingAmount) > 0).length} Faktur Outstanding`} icon={<TrendingUp className="text-blue-600" />} />
        <DnaStatCard label="Overdue (30+ Days)" value={rp(overdue30)} subValue="Risk Profile: Low" icon={<CreditCard className="text-rose-600" />} />
        <DnaStatCard label="Collections (MTD)" value={rp(collectionsMtd)} subValue="Dari Ledger Faktur" icon={<Wallet className="text-emerald-500" />} />
        <DnaStatCard label="Sample Revenue" value={rp(sampleRevenue)} subValue="R&D Commitment" icon={<FlaskConical className="text-amber-500" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Penerimaan Piutang</h3>
        <Link href="/finance/ar-hub" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> + Validasi
        </Link>
      </div>

      <div className="w-full">
      <DnaDataTableCard
        customToolbar={
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
            <DnaTabNav
              tabs={[
                { id: "products", label: "Regular Products", icon: Package },
                { id: "samples", label: "R&D Samples", icon: FlaskConical },
                { id: "returns", label: "Retur", icon: RotateCcw },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <DnaButton variant="outline" className="h-11 w-11 p-0 rounded-xl bg-slate-50 text-slate-400">
              <History className="h-5 w-5" />
            </DnaButton>
          </div>
        }
      >
        <div hidden={activeTab !== "products"} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          {orders.length === 0 ? (
            <DnaEmptyState
              icon={<FileText className="h-10 w-10 text-slate-300" />}
              title="Tidak Ada Faktur Menunggu Validasi"
              description="Faktur penjualan berstatus UNPAID/PARTIAL akan muncul di sini untuk validasi penerimaan."
            />
          ) : (
          <DnaTable className="table-dense">
            <DnaTableHead className="bg-slate-50/50">
              <DnaTableRow className="hover:bg-transparent border-slate-100">
                <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Faktur Identity</DnaTh>
                <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">SO / Client</DnaTh>
                <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Jatuh Tempo</DnaTh>
                <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</DnaTh>
                <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</DnaTh>
                <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {orders.map((inv) => (
                <DnaTableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                  <DnaTd className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase">{inv.tanggal}</span>
                      </div>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase">{inv.kode_so}</span>
                      <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.pelanggan}</span>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-4">
                    <DnaBadge variant="default">{inv.ref}</DnaBadge>
                  </DnaTd>
                  <DnaTd className="text-right tabular-nums py-4 text-slate-900 text-xs font-black">
                    Rp {inv.grand_total.toLocaleString("id-ID")}
                  </DnaTd>
                  <DnaTd className="text-right tabular-nums py-4 text-rose-600 text-xs font-black">
                    Rp {inv.sisa.toLocaleString("id-ID")}
                  </DnaTd>
                  <DnaTd className="text-center py-4">
                    <DnaBadge variant={inv.status === "Lunas" ? "success" : "critical"}>{inv.status}</DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-6 text-right py-4">
                    <div className="flex justify-end gap-2">
                      <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                        <Eye className="h-3.5 w-3.5" />
                      </DnaButton>
                      {inv.sisa > 0 && (
                        <DnaButton
                          onClick={() => openPaymentModal(inv)}
                          variant="primary"
                          className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
                        </DnaButton>
                      )}
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
          )}
        </div>

        <div hidden={activeTab !== "samples"} className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
          {samples.length === 0 ? (
            <DnaEmptyState
              icon={<FlaskConical className="h-10 w-10 text-slate-300" />}
              title="Tidak Ada Pembayaran Sample Menunggu Validasi"
              description="Aktivitas pembayaran sample / down payment dari BusDev yang belum divalidasi akan muncul di sini."
            />
          ) : (
          <DnaTable className="table-dense">
            <DnaTableHead className="bg-slate-50/50">
              <DnaTableRow className="hover:bg-transparent border-slate-100">
                <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Sample Identity</DnaTh>
                <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan / Produk</DnaTh>
                <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</DnaTh>
                <DnaTh className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</DnaTh>
                <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
                <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {samples.map((inv) => (
                <DnaTableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                  <DnaTd className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <FlaskConical className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase">Ref: {inv.ref}</span>
                      </div>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase">{inv.pelanggan}</span>
                      <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.produk}</span>
                    </div>
                  </DnaTd>
                  <DnaTd className="text-right tabular-nums py-4 text-slate-900 text-xs font-black">
                    Rp {inv.grand_total.toLocaleString("id-ID")}
                  </DnaTd>
                  <DnaTd className="text-right tabular-nums py-4 text-rose-600 text-xs font-black">
                    Rp {inv.sisa.toLocaleString("id-ID")}
                  </DnaTd>
                  <DnaTd className="text-center py-4">
                    <DnaBadge variant={inv.status === "Lunas" ? "success" : "critical"}>{inv.status}</DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-6 text-right py-4">
                    <div className="flex justify-end gap-2">
                      <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg bg-slate-50 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                        <Eye className="h-3.5 w-3.5" />
                      </DnaButton>
                      <DnaButton
                        onClick={() => openPaymentModal(inv)}
                        variant="primary"
                        className="h-8 px-4 rounded-lg text-[8px] tracking-widest shadow-sm transition-all hover:scale-105 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" /> Collect
                      </DnaButton>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
          )}
        </div>

        <div hidden={activeTab !== "returns"} className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
          {returns.length === 0 ? (
            <DnaEmptyState
              icon={<RotateCcw className="h-10 w-10 text-slate-300" />}
              title="Belum Ada Retur Penjualan"
              description="Retur dari BusDev akan muncul di sini untuk adjustment piutang: kurangi outstanding invoice + buat jurnal adjustment."
            />
          ) : (
          <DnaTable className="table-dense">
            <DnaTableHead className="bg-slate-50/50">
              <DnaTableRow className="hover:bg-transparent border-slate-100">
                <DnaTh className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">No. Retur / SO</DnaTh>
                <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan / Brand</DnaTh>
                <DnaTh className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Catatan</DnaTh>
                <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Tanggal</DnaTh>
                <DnaTh className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Item</DnaTh>
                <DnaTh className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {returns.map((r) => (
                <DnaTableRow key={r.id} className="hover:bg-slate-50/30 transition-all border-b border-slate-50">
                  <DnaTd className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-sm">
                        <RotateCcw className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{r.no_retur}</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase">Retur Penjualan</span>
                      </div>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase">{r.pelanggan}</span>
                      <span className="text-[9px] font-medium text-blue-600 uppercase italic">{r.brand}</span>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-4">
                    <span className="text-[10px] text-slate-500">{r.catatan}</span>
                  </DnaTd>
                  <DnaTd className="text-center py-4 text-[10px] text-slate-500 tabular-nums">{r.tanggal}</DnaTd>
                  <DnaTd className="text-center py-4 text-xs font-black text-slate-900 tabular-nums">{r.jumlah_item}</DnaTd>
                  <DnaTd className="pr-6 text-right py-4">
                    <DnaBadge variant={r.status === "APPROVED" ? "success" : "info"}>{r.status}</DnaBadge>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
          )}
        </div>
      </DnaDataTableCard>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border-none"
            >
              <div className="p-8 bg-blue-600 text-white flex flex-row justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">AR Collection Settlement</h3>
                  <p className="text-blue-200 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">Revenue Settlement Protocol v2.1</p>
                </div>
                <CircleDollarSign className="h-12 w-12 text-white/80" />
              </div>
              <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Debtor</p>
                  <p className="font-black text-xs uppercase text-slate-900 truncate">{selectedInvoice.pelanggan}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Invoice ID</p>
                  <p className="font-black text-xs uppercase text-slate-900">{selectedInvoice.kode_faktur}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Outstanding</p>
                  <p className="font-black text-xs text-rose-600">Rp {selectedInvoice.sisa.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Payment Date</label>
                    <div className="relative">
                      <DnaInput type="date" className="h-11 bg-slate-50 border-none font-black uppercase text-xs focus:ring-4 focus:ring-blue-500/5 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Target Account</label>
                    <DnaSelect
                      className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs"
                      options={["BCA Main (2640...)", "Mandiri Corporate", "Petty Cash (IDR)"]}
                    >
                      <option>BCA Main (2640...)</option>
                      <option>Mandiri Corporate</option>
                      <option>Petty Cash (IDR)</option>
                    </DnaSelect>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Collection Amount (IDR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                    <DnaInput type="number" defaultValue={selectedInvoice.sisa} className="h-12 pl-12 bg-slate-50 border-none font-black text-lg text-slate-900 tabular-nums focus:ring-4 focus:ring-blue-500/5 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-tight ml-1">Remarks / Reference</label>
                  <DnaTextarea
                    rows={3}
                    placeholder="E.g., Bank transfer reference..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <DnaButton onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50">
                    Abort & Dismiss
                  </DnaButton>
                  <DnaButton onClick={() => setIsModalOpen(false)} variant="primary" className="flex-[2] h-12 rounded-xl tracking-widest text-[10px] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Commit Collection
                  </DnaButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-8 flex gap-8 items-center shadow-sm mt-6">
        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-slate-100">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Owner Insight: Revenue Integrity</p>
          <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">
            Sample revenue collection is critical for R&D overhead coverage. Ensure all{" "}
            <span className="text-blue-600 font-black">R&D Samples</span> with outstanding balances are flagged in the next executive pipeline review.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   Page Root
   ─────────────────────────────────────────── */
export default function PiutangPage() {
  const [activeTab, setActiveTab] = useState("faktur-jual");

  return (
    <DashboardShell title="Piutang" titleAccent="&amp; Hutang" subtitle="Manajemen Piutang &amp; Hutang Terintegrasi">
      <div className="w-full space-y-4">
        <DnaTabNav
          tabs={[
            { id: "faktur-jual", label: "Faktur Penjualan", icon: FileCheck2 },
            { id: "faktur-beli", label: "Faktur Pembelian", icon: Receipt },
            { id: "sales-orders", label: "Sales Orders", icon: ShoppingCart },
            { id: "ar-hub", label: "AR Hub", icon: ShieldCheck },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div hidden={activeTab !== "faktur-jual"} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <FakturJualTab />
        </div>

        <div hidden={activeTab !== "faktur-beli"} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <FakturBeliTab />
        </div>

        <div hidden={activeTab !== "sales-orders"} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <SalesOrdersTab />
        </div>

        <div hidden={activeTab !== "ar-hub"} className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <ARHubTab />
        </div>
      </div>
    </DashboardShell>
  );
}
