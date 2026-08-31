"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Search,
 Wallet,
 Building2,
 Receipt,
 CircleDollarSign,
 FileCheck2,
 Clock,
 CheckCircle2,
 Plus,
 CreditCard,
 ArrowRight,
 AlertTriangle,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
import { QueryLoading, QueryError } from "@/components/query-states";

const statusMap: Record<string, { label: string; badge: "success" | "warning" | "critical" }> = {
 PAID: { label: "Lunas", badge: "success" },
 PARTIAL: { label: "Sebagian", badge: "warning" },
 UNPAID: { label: "Terutang", badge: "critical" },
};

export default function BayarConsolidatedPage() {
 const queryClient = useQueryClient();
 const [searchPembelian, setSearchPembelian] = useState("");
 const [searchPenjualan, setSearchPenjualan] = useState("");
 const [searchSample, setSearchSample] = useState("");

 const { data: bills, isLoading: billsLoading, isError: billsError } = useQuery<any[]>({
 queryKey: ["vendor-bills"],
 queryFn: async () => {
 const resp = await api.get("/finance/bills");
 return resp.data.map((b: any) => ({
 id: b.id || b.billNumber,
 billNumber: b.billNumber,
 vendorName: b.vendorName,
 totalAmount: Number(b.totalAmount),
 paidAmount: Number(b.paidAmount || 0),
 remaining: Number(b.remaining || b.totalAmount),
 status: b.status,
 }));
 },
 });

 const { data: invoices, isLoading: invLoading, isError: invError } = useQuery<any[]>({
 queryKey: ["invoices-receivable"],
 queryFn: async () => {
 const resp = await api.get("/finance/invoices");
 return resp.data
 .filter((inv: any) => inv.type === "RECEIVABLE" || !inv.type)
 .map((inv: any) => ({
 id: inv.id,
 invoiceNumber: inv.invoiceNumber,
 customerName: inv.customerName,
 totalAmount: Number(inv.totalAmount),
 paidAmount: Number(inv.paidAmount || 0),
 remainingAmount: Number(inv.remainingAmount || inv.totalAmount),
 status: inv.status,
 dueDate: new Date(inv.dueDate).toISOString().split("T")[0],
 }));
 },
 });

 const { data: samples, isLoading: sampLoading, isError: sampError } = useQuery<any[]>({
 queryKey: ["bussdev-samples-payment"],
 queryFn: async () => {
 const resp = await api.get("/bussdev/samples");
 return resp.data
 .filter((s: any) => s.status !== "CANCELLED")
 .map((s: any) => ({
 id: s.id,
 code: s.code,
 customerName: s.customerName,
 totalAmount: Number(s.totalAmount || s.unitPrice * s.qty),
 paidAmount: Number(s.paidAmount || 0),
 remainingAmount: Number(s.remainingAmount || s.unitPrice * s.qty),
 paymentStatus: s.paymentStatus || "UNPAID",
 }));
 },
 });

 const filteredBills = (bills || []).filter((b: any) =>
 (b.billNumber || "").toLowerCase().includes(searchPembelian.toLowerCase()) ||
 (b.vendorName || "").toLowerCase().includes(searchPembelian.toLowerCase())
 );
 const filteredInvoices = (invoices || []).filter((inv: any) =>
 (inv.invoiceNumber || "").toLowerCase().includes(searchPenjualan.toLowerCase()) ||
 (inv.customerName || "").toLowerCase().includes(searchPenjualan.toLowerCase())
 );
 const filteredSamples = (samples || []).filter((s: any) =>
 (s.code || "").toLowerCase().includes(searchSample.toLowerCase()) ||
 (s.customerName || "").toLowerCase().includes(searchSample.toLowerCase())
 );

 const totalBillOutstanding = (bills || []).reduce((s: number, b: any) => s + (b.remaining || 0), 0);
 const totalReceivable = (invoices || []).reduce((s: number, inv: any) => s + inv.remainingAmount, 0);
 const totalSampleOutstanding = (samples || []).reduce((s: number, sm: any) => s + sm.remainingAmount, 0);
 const overdueCount = (invoices || []).filter((inv: any) => inv.status === "OVERDUE").length;

 return (
 <OperationalMigrationShell
 title="Hub Pembayaran"
 subtitle="Pembayaran pembelian, penjualan, dan sample"
 >
 <Tabs defaultValue="pembelian" className="space-y-6">
 <div className="relative">
 <TabsList className="bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl h-14 inline-flex gap-1 border border-slate-200/50 shadow-inner">
 {[
 { id: "pembelian", label: "Bayar Pembelian", icon: Receipt },
 { id: "penjualan", label: "Bayar Penjualan", icon: CircleDollarSign },
 { id: "sample", label: "Bayar Sample", icon: FileCheck2 },
 ].map((tab) => (
 <TabsTrigger
 key={tab.id}
 value={tab.id}
 className="relative rounded-xl px-6 h-full data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500 transition-all duration-300 text-[10px] font-black uppercase tracking-tight"
 >
 <div className="flex items-center gap-2">
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </div>
 </TabsTrigger>
 ))}
 </TabsList>
 </div>

 <TabsContent value="pembelian" className="space-y-6 animate-fade-slide-in">
 {billsLoading ? (
 <QueryLoading message="Memuat faktur pembelian..." />
 ) : billsError ? (
 <QueryError error="Gagal memuat data faktur" onRetry={() => queryClient.invalidateQueries({ queryKey: ["vendor-bills"] })} />
 ) : (
 <>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <StatCard label="Total Faktur" value={(bills || []).length} icon={<Receipt className="text-blue-600" />} />
 <StatCard label="Total Terutang" value={formatOperationalCurrency(totalBillOutstanding)} icon={<AlertTriangle className="text-rose-500" />} />
 <StatCard label="Pemasok" value={`${new Set((bills || []).map((b: any) => b.vendorName)).size} Vendor`} icon={<Building2 className="text-slate-500" />} />
 </div>
 <TableWrapper
 filters={
 <div className="flex items-center justify-between w-full">
 <div className="relative w-full max-w-md">
 <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari invoice / supplier..." value={searchPembelian} onChange={(e) => setSearchPembelian(e.target.value)} />
 </div>
 <DnaButton variant="primary" icon={<Plus className="h-4 w-4" />} className="bg-rose-600 hover:bg-rose-700" onClick={() => window.location.href = "/finance/bayar-pembelian"}>
 Bayar Baru
 </DnaButton>
 </div>
 }
 >
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/70">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice</TableHead>
 <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pemasok</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Jumlah</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Dibayar</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sisa</TableHead>
 <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
 <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredBills.map((bill: any) => (
 <TableRow key={bill.id} className="group hover:bg-slate-50/30 transition-all border-b border-slate-50">
 <TableCell className="pl-6 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
 <Receipt className="h-4 w-4" />
 </div>
 <span className="font-black text-slate-900 text-xs uppercase italic">{bill.billNumber}</span>
 </div>
 </TableCell>
 <TableCell className="py-4">
 <div className="flex items-center gap-2">
 <Building2 className="h-3.5 w-3.5 text-slate-400" />
 <span className="font-black text-slate-700 text-xs uppercase">{bill.vendorName}</span>
 </div>
 </TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">{formatOperationalCurrency(bill.totalAmount)}</TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-emerald-600 text-xs">{formatOperationalCurrency(bill.paidAmount)}</TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">{formatOperationalCurrency(bill.remaining)}</TableCell>
 <TableCell className="text-center py-4">
 <DnaBadge status={statusMap[bill.status]?.badge || "default"}>{statusMap[bill.status]?.label || getOperationalStatusLabel(bill.status)}</DnaBadge>
 </TableCell>
 <TableCell className="pr-6 text-right py-4">
 <DnaButton variant="primary" size="sm" icon={<Wallet className="h-3.5 w-3.5" />} onClick={() => window.location.href = "/finance/bayar-pembelian"}>Bayar</DnaButton>
 </TableCell>
 </TableRow>
 ))}
 {filteredBills.length === 0 && (
 <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada faktur ditemukan.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </TableWrapper>
 </>
 )}
 </TabsContent>

 <TabsContent value="penjualan" className="space-y-6 animate-fade-slide-in">
 {invLoading ? (
 <QueryLoading message="Memuat faktur penjualan..." />
 ) : invError ? (
 <QueryError error="Gagal memuat data faktur" onRetry={() => queryClient.invalidateQueries({ queryKey: ["invoices-receivable"] })} />
 ) : (
 <>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <StatCard label="Total Piutang" value={formatOperationalCurrency(totalReceivable)} icon={<Wallet className="text-emerald-600" />} />
 <StatCard label="Jatuh Tempo" value={overdueCount.toString()} subValue="Faktur jatuh tempo" icon={<Clock className="text-rose-500" />} />
 <StatCard label="Belum Tertagih" value={`${filteredInvoices.length} Faktur`} icon={<FileCheck2 className="text-amber-500" />} />
 </div>
 <TableWrapper
 filters={
 <div className="flex items-center justify-between w-full">
 <div className="relative w-full max-w-md">
 <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari invoice / pelanggan..." value={searchPenjualan} onChange={(e) => setSearchPenjualan(e.target.value)} />
 </div>
 <DnaButton variant="primary" icon={<CreditCard className="h-4 w-4" />} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => window.location.href = "/finance/bayar-penjualan"}>
 Terima Pembayaran
 </DnaButton>
 </div>
 }
 >
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/70">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Invoice</TableHead>
 <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Jumlah</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Dibayar</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sisa</TableHead>
 <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
 <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredInvoices.map((inv: any) => (
 <TableRow key={inv.id} className="group hover:bg-emerald-50/30 transition-all border-b border-slate-50">
 <TableCell className="pl-6 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
 <FileCheck2 className="h-4 w-4" />
 </div>
 <div>
 <span className="font-black text-slate-900 text-xs uppercase italic">{inv.invoiceNumber}</span>
 <p className="text-[9px] font-medium text-slate-400">Jatuh tempo: {inv.dueDate}</p>
 </div>
 </div>
 </TableCell>
 <TableCell className="py-4">
 <span className="font-black text-slate-900 text-xs uppercase">{inv.customerName}</span>
 </TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">{formatOperationalCurrency(inv.totalAmount)}</TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-emerald-600 text-xs">{formatOperationalCurrency(inv.paidAmount)}</TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-rose-600 text-xs">{formatOperationalCurrency(inv.remainingAmount)}</TableCell>
 <TableCell className="text-center py-4">
 <DnaBadge status={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "critical" : "warning"}>
 {inv.status === "PAID" ? "Lunas" : inv.status === "OVERDUE" ? "Jatuh Tempo" : "Belum Lunas"}
 </DnaBadge>
 </TableCell>
 <TableCell className="pr-6 text-right py-4">
 <DnaButton variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" icon={<CircleDollarSign className="h-3.5 w-3.5" />} onClick={() => window.location.href = "/finance/bayar-penjualan"}>
 Terima
 </DnaButton>
 </TableCell>
 </TableRow>
 ))}
 {filteredInvoices.length === 0 && (
 <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada faktur ditemukan.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </TableWrapper>
 </>
 )}
 </TabsContent>

 <TabsContent value="sample" className="space-y-6 animate-fade-slide-in">
 {sampLoading ? (
 <QueryLoading message="Memuat data sample..." />
 ) : sampError ? (
 <QueryError error="Gagal memuat data sample" onRetry={() => queryClient.invalidateQueries({ queryKey: ["bussdev-samples-payment"] })} />
 ) : (
 <>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <StatCard label="Total Terutang" value={formatOperationalCurrency(totalSampleOutstanding)} icon={<Wallet className="text-rose-500" />} />
 <StatCard label="Menunggu Bayar" value={(samples || []).filter((s: any) => s.remainingAmount > 0).length} subValue="Sample menunggu pembayaran" icon={<Clock className="text-amber-500" />} />
 <StatCard label="Total Sample" value={`${filteredSamples.length} Order`} icon={<FileCheck2 className="text-blue-600" />} />
 </div>
 <TableWrapper
 filters={
 <div className="flex items-center justify-between w-full">
 <div className="relative w-full max-w-md">
 <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari kode sample / customer..." value={searchSample} onChange={(e) => setSearchSample(e.target.value)} />
 </div>
 <DnaButton variant="primary" icon={<ArrowRight className="h-4 w-4" />} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => window.location.href = "/finance/bayar-sample"}>
 Bayar Sample
 </DnaButton>
 </div>
 }
 >
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/70">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Kode Sample</TableHead>
 <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Pelanggan</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Total</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sudah Bayar</TableHead>
 <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Sisa</TableHead>
 <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">Status</TableHead>
 <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredSamples.map((sample: any) => (
 <TableRow key={sample.id} className="group hover:bg-emerald-50/30 transition-all border-b border-slate-50">
 <TableCell className="pl-6 py-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
 <FileCheck2 className="h-4 w-4" />
 </div>
 <span className="font-black text-slate-900 text-xs uppercase italic">{sample.code}</span>
 </div>
 </TableCell>
 <TableCell className="py-4">
 <span className="font-black text-slate-900 text-xs uppercase">{sample.customerName}</span>
 </TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">{formatOperationalCurrency(sample.totalAmount)}</TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-emerald-600 text-xs">{formatOperationalCurrency(sample.paidAmount)}</TableCell>
 <TableCell className="text-right font-mono tabular-nums py-4 font-black text-rose-600 text-xs">{formatOperationalCurrency(sample.remainingAmount)}</TableCell>
 <TableCell className="text-center py-4">
 <DnaBadge status={sample.paymentStatus === "PAID" ? "success" : sample.paymentStatus === "PARTIAL" ? "warning" : "critical"}>
 {sample.paymentStatus === "PAID" ? "Lunas" : sample.paymentStatus === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
 </DnaBadge>
 </TableCell>
 <TableCell className="pr-6 text-right py-4">
 {sample.remainingAmount > 0 && (
 <DnaButton variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700" icon={<CircleDollarSign className="h-3.5 w-3.5" />} onClick={() => window.location.href = "/finance/bayar-sample"}>Bayar</DnaButton>
 )}
 </TableCell>
 </TableRow>
 ))}
 {filteredSamples.length === 0 && (
 <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400 italic text-xs">Tidak ada sample payment ditemukan.</TableCell></TableRow>
 )}
 </TableBody>
 </Table>
 </TableWrapper>
 </>
 )}
 </TabsContent>
 </Tabs>
 </OperationalMigrationShell>
 );
}
