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
import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

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
   Static fallback data
   ─────────────────────────────────────────── */
const STATIC_SALES_INVOICES = [
  { kode_faktur: "SI-001", kode_do: "DO-001", kode_so: "SO-001", tanggal: "01/04/2026", pelanggan: "PT Maju Jaya", grand_total: 15000000, dibayar: 10000000, sisa: 5000000, status: "Belum Lunas" },
  { kode_faktur: "SI-002", kode_do: "DO-002", kode_so: "SO-002", tanggal: "03/04/2026", pelanggan: "CV Sejahtera", grand_total: 7500000, dibayar: 7500000, sisa: 0, status: "Lunas" },
  { kode_faktur: "SI-003", kode_do: "DO-003", kode_so: "SO-005", tanggal: "07/04/2026", pelanggan: "Beauty Hub Indonesia", grand_total: 22500000, dibayar: 10000000, sisa: 12500000, status: "Belum Lunas" },
  { kode_faktur: "SI-004", kode_do: "DO-004", kode_so: "SO-008", tanggal: "10/04/2026", pelanggan: "PT Cosmo Indah", grand_total: 18000000, dibayar: 18000000, sisa: 0, status: "Lunas" },
  { kode_faktur: "SI-005", kode_do: "DO-005", kode_so: "SO-012", tanggal: "14/04/2026", pelanggan: "UD Sinar Jaya", grand_total: 5000000, dibayar: 0, sisa: 5000000, status: "Belum Lunas" },
];

const STATIC_SAMPLE_INVOICES = [
  { kode_faktur: "SSI-001", kode_sample: "SS-001", tanggal: "02/04/2026", pelanggan: "UD Baru", produk: "Hair Mask Dandruff Solution", grand_total: 500000, dibayar: 250000, sisa: 250000, status: "Belum Lunas" },
  { kode_faktur: "SSI-002", kode_sample: "SS-003", tanggal: "06/04/2026", pelanggan: "Beauty Hub Indonesia", produk: "Sunscreen Stick SPF 50", grand_total: 750000, dibayar: 750000, sisa: 0, status: "Lunas" },
  { kode_faktur: "SSI-003", kode_sample: "SS-005", tanggal: "12/04/2026", pelanggan: "UD Sinar Jaya", produk: "Hand Body Lotion 250ml", grand_total: 425000, dibayar: 0, sisa: 425000, status: "Belum Lunas" },
];

/* ───────────────────────────────────────────
   Faktur Penjualan Tab
   ─────────────────────────────────────────── */
function FakturJualTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["piutang-invoices"],
    queryFn: async () => {
      const resp = await api.get("/finance/invoices");
      return resp.data.map((inv: any) => ({
        id: inv.invoiceNumber,
        customer: inv.customerName,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(inv.dueDate).toISOString().split("T")[0],
        amount: Number(inv.totalAmount),
        status: inv.status,
        source: "Sales Order",
      }));
    },
  });

  const filtered = (invoices ?? []).filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Receivables" value="Rp 170.0M" subValue="Rp 45.0M Overdue 14 Days" icon={<CreditCard className="text-blue-600" />} />
        <StatCard label="Collected (MTD)" value="Rp 89.2M" subValue="65% Target Completion" icon={<Wallet className="text-emerald-500" />} />
        <StatCard label="Pending Approval" value="4 Invoices" subValue="Execute Review Gate" icon={<AlertTriangle className="text-amber-500" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Faktur Penjualan</h3>
        <Link href="/finance/invoices" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <FileCheck2 className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      <TableWrapper
        filters={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        }
      >
        <Table className="table-dense">
          <TableHeader className="bg-slate-50/70">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice Identity</TableHead>
              <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Client / Partner</TableHead>
              <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Commercial Origin</TableHead>
              <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Amount Due</TableHead>
              <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</TableHead>
              <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                <TableCell className="pl-6 text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <FileCheck2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.id}</span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">Due: {inv.dueDate}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-500 uppercase">{inv.customer.charAt(0)}</div>
                    <p className="font-black text-slate-900 text-xs uppercase italic">{inv.customer}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="rounded-lg border border-slate-200 text-slate-500 font-medium uppercase text-[8px] tracking-tight px-1.5 py-0.5">{inv.source}</span>
                </TableCell>
                <TableCell className="text-right font-black text-slate-900 text-xs font-mono tabular-nums">Rp {inv.amount.toLocaleString("id-ID")}</TableCell>
                <TableCell className="text-center">
                  <DnaBadge status={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "critical" : "info"}>{inv.status}</DnaBadge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex justify-end gap-1.5">
                    <DnaButton variant="outline" size="sm" icon={<Printer className="h-3.5 w-3.5" />} />
                    <DnaButton variant="outline" size="sm" icon={<Mail className="h-3.5 w-3.5" />} />
                    <DnaButton variant="outline" size="sm" icon={<MoreHorizontal className="h-3.5 w-3.5" />} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">No invoices found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  );
}

/* ───────────────────────────────────────────
   Faktur Pembelian Tab
   ─────────────────────────────────────────── */
function FakturBeliTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: bills, isLoading } = useQuery<Bill[]>({
    queryKey: ["piutang-bills"],
    queryFn: async () => {
      const resp = await api.get("/finance/bills");
      return resp.data.map((b: any) => ({
        id: b.billNumber,
        vendor: b.vendorName,
        date: new Date(b.createdAt).toISOString().split("T")[0],
        dueDate: new Date(b.dueDate).toISOString().split("T")[0],
        total: Number(b.totalAmount),
        status: b.status,
      }));
    },
  });

  const filtered = (bills ?? []).filter(
    (b) => b.id.toLowerCase().includes(searchTerm.toLowerCase()) || b.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Debt (AP)" value="Rp 170.0M" icon={<AlertCircle className="text-rose-600" />} />
        <StatCard label="Monthly Expense" value="Rp 45.0M" icon={<CreditCard className="text-amber-600" />} />
        <StatCard label="Uncollected AR" value="Rp 12.5M" icon={<Package className="text-slate-500" />} />
        <StatCard label="Cash In (MTD)" value="Rp 89.2M" icon={<Receipt className="text-emerald-600" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Faktur Pembelian</h3>
        <Link href="/finance/bills" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <Receipt className="h-3 w-3" /> + Tambah Baru
        </Link>
      </div>

      <TableWrapper
        filters={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search bills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        }
      >
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Bill ID</TableHead>
              <TableHead className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Vendor Entity</TableHead>
              <TableHead className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Timeline</TableHead>
              <TableHead className="py-4 px-4 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Balance</TableHead>
              <TableHead className="py-4 px-4 text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Protocol Status</TableHead>
              <TableHead className="pr-10 text-right py-4 px-4 font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((bill) => (
              <TableRow key={bill.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                <TableCell className="py-8 pl-10 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="font-black text-slate-900 tracking-tight text-base uppercase italic">{bill.id}</span>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="font-black text-slate-900 text-sm uppercase italic">{bill.vendor}</p>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Issue: {bill.date}</p>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Due: {bill.dueDate}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-slate-900 font-mono tabular-nums">Rp {bill.total.toLocaleString("id-ID")}</TableCell>
                <TableCell className="text-center">
                  <DnaBadge status={bill.status === "PAID" ? "success" : bill.status === "PARTIAL" ? "warning" : "critical"}>{bill.status}</DnaBadge>
                </TableCell>
                <TableCell className="pr-10 text-right">
                  <div className="flex justify-end gap-2">
                    <DnaButton variant="outline" size="sm" icon={<ShieldCheck className="h-4 w-4" />} />
                    <DnaButton variant="outline" size="sm" icon={<MoreHorizontal className="h-4 w-4" />} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">No bills found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableWrapper>
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
                <DnaBadge status="warning">AWAITING DP</DnaBadge>
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

      <TableWrapper
        filters={
          <div className="relative w-full max-w-md">
            <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Search orders, clients, or IDs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        }
      >
        <Table className="table-dense">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="py-4 pl-6 font-black text-slate-400 uppercase tracking-tight text-[10px]">Order Protocol</TableHead>
              <TableHead className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Commercial Value</TableHead>
              <TableHead className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Payment Intel</TableHead>
              <TableHead className="py-4 font-black text-slate-400 uppercase tracking-tight text-[10px] text-center">Lifecycle</TableHead>
              <TableHead className="pr-6 text-right py-4 font-black text-slate-400 uppercase tracking-tight text-[10px]">Audit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders?.map((order: any) => (
              <TableRow key={order.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                <TableCell className="py-4 pl-6">
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
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-sm tracking-tighter font-mono tabular-nums">{formatCurrency(Number(order.totalAmount))}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">MOQ: {order.quantity?.toLocaleString()} Pcs</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {order.isPaymentVerified ? (
                    <div className="flex flex-col items-center gap-1">
                      <DnaBadge status="success">VERIFIED</DnaBadge>
                      <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tight">On {new Date(order.paymentVerifiedAt).toLocaleDateString()}</span>
                    </div>
                  ) : order.paymentProofUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <DnaBadge status="warning" className="animate-pulse">PENDING VALIDATION</DnaBadge>
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
                    <DnaBadge status="default">AWAITING PROOF</DnaBadge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <DnaBadge status={order.status === "DP_PAID" ? "info" : order.status === "PENDING_DP" ? "warning" : "default"}>
                    {order.status?.replace("_", " ")}
                  </DnaBadge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400">
                    <ChevronRight className="h-4 w-4" />
                  </DnaButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>

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
                <p className="text-2xl font-black text-slate-900 tracking-tighter italic font-mono tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0))}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Expected DP (30%)</p>
                <p className="text-2xl font-black text-emerald-600 tracking-tighter italic font-mono tabular-nums">{formatCurrency(Number(selectedOrder?.totalAmount || 0) * 0.3)}</p>
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Receivables" value="Rp 125.4M" subValue="+12.5% MTD" icon={<TrendingUp className="text-blue-600" />} />
        <StatCard label="Overdue (30+ Days)" value="Rp 12.0M" subValue="Risk Profile: Low" icon={<CreditCard className="text-rose-600" />} />
        <StatCard label="Collections (MTD)" value="Rp 89.2M" subValue="70% Target Completion" icon={<Wallet className="text-emerald-500" />} />
        <StatCard label="Sample Revenue" value="Rp 2.4M" subValue="R&D Commitment" icon={<FlaskConical className="text-amber-500" />} />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Penerimaan Piutang</h3>
        <Link href="/finance/ar-hub" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> + Validasi
        </Link>
      </div>

      <Tabs defaultValue="products" className="w-full">
      <TableWrapper
        filters={
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
            <TabsList className="bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100">
              <TabsTrigger
                value="products"
                className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                <Package className="mr-2 h-4 w-4" /> Regular Products
              </TabsTrigger>
              <TabsTrigger
                value="samples"
                className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                <FlaskConical className="mr-2 h-4 w-4" /> R&D Samples
              </TabsTrigger>
              <TabsTrigger
                value="returns"
                className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Retur
              </TabsTrigger>
            </TabsList>
            <DnaButton variant="outline" className="h-11 w-11 p-0 rounded-xl bg-slate-50 text-slate-400">
              <History className="h-5 w-5" />
            </DnaButton>
          </div>
        }
      >
        <TabsContent value="products" className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <Table className="table-dense">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Faktur Identity</TableHead>
                <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">SO / Client</TableHead>
                <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">DO Reference</TableHead>
                <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</TableHead>
                <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</TableHead>
                <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATIC_SALES_INVOICES.map((inv) => (
                <TableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase">{inv.tanggal}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase">{inv.kode_so}</span>
                      <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.pelanggan}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm bg-slate-100 text-slate-600">{inv.kode_do}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums py-4 text-slate-900 text-xs font-black">
                    Rp {inv.grand_total.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums py-4 text-rose-600 text-xs font-black">
                    Rp {inv.sisa.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <DnaBadge status={inv.status === "Lunas" ? "success" : "critical"}>{inv.status}</DnaBadge>
                  </TableCell>
                  <TableCell className="pr-6 text-right py-4">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="samples" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
          <Table className="table-dense">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="pl-6 py-4 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Sample Identity</TableHead>
                <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan / Produk</TableHead>
                <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Valuation</TableHead>
                <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Outstanding</TableHead>
                <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
                <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATIC_SAMPLE_INVOICES.map((inv) => (
                <TableRow key={inv.kode_faktur} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <FlaskConical className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{inv.kode_faktur}</span>
                        <span className="text-[9px] font-medium text-slate-400 uppercase">Ref: {inv.kode_sample}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase">{inv.pelanggan}</span>
                      <span className="text-[9px] font-medium text-blue-600 uppercase italic">{inv.produk}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums py-4 text-slate-900 text-xs font-black">
                    Rp {inv.grand_total.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums py-4 text-rose-600 text-xs font-black">
                    Rp {inv.sisa.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <DnaBadge status={inv.status === "Lunas" ? "success" : "critical"}>{inv.status}</DnaBadge>
                  </TableCell>
                  <TableCell className="pr-6 text-right py-4">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="returns" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-8">
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 bg-slate-50/50 text-center">
              <RotateCcw className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">Retur Penjualan</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                Retur dari BusDev akan muncul di sini untuk adjustment piutang. Proses: Kurangi outstanding invoice + buat jurnal adjustment.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400">Pending Retur</p>
                  <p className="text-xl font-black text-slate-900 mt-1">2</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400">Total Adjustment</p>
                  <p className="text-xl font-black text-rose-600 mt-1">Rp 3.2M</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400">Approved</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">1</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </TableWrapper>
      </Tabs>

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
                    <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs appearance-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none px-4">
                      <option>BCA Main (2640...)</option>
                      <option>Mandiri Corporate</option>
                      <option>Petty Cash (IDR)</option>
                    </select>
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
                  <textarea
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
  return (
    <DashboardShell title="Piutang" titleAccent="&amp; Hutang" subtitle="Manajemen Piutang &amp; Hutang Terintegrasi">
      <Tabs defaultValue="faktur-jual" className="w-full">
        <TabsList className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 mb-8">
          <TabsTrigger
            value="faktur-jual"
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            <FileCheck2 className="mr-2 h-3.5 w-3.5" /> Faktur Penjualan
          </TabsTrigger>
          <TabsTrigger
            value="faktur-beli"
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            <Receipt className="mr-2 h-3.5 w-3.5" /> Faktur Pembelian
          </TabsTrigger>
          <TabsTrigger
            value="sales-orders"
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            <ShoppingCart className="mr-2 h-3.5 w-3.5" /> Sales Orders
          </TabsTrigger>
          <TabsTrigger
            value="ar-hub"
            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            <ShieldCheck className="mr-2 h-3.5 w-3.5" /> AR Hub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faktur-jual" className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <FakturJualTab />
        </TabsContent>

        <TabsContent value="faktur-beli" className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <FakturBeliTab />
        </TabsContent>

        <TabsContent value="sales-orders" className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <SalesOrdersTab />
        </TabsContent>

        <TabsContent value="ar-hub" className="m-0 animate-in fade-in slide-in-from-left-4 duration-500">
          <ARHubTab />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
