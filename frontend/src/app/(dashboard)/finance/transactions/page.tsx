"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogTitle,
 DialogTrigger,
 DialogHeader,
 DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
 Plus,
 ArrowUpRight,
 ArrowDownLeft,
 CreditCard,
 Wallet,
 Trash2,
 Search,
 DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { OperationalInput } from "@/components/operational";
import {
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalStatusBadge,
 OperationalField,
 getOperationalStatusLabel,
} from "@/components/operational/OperationalUI";
import { formatOperationalCurrency, formatOperationalNumber } from "@/lib/operational-formatters";
import { DnaInput, DnaButton } from "@/components/dna";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from "@/components/ui/select";

interface TransactionLine {
 accountId: string;
 accountName: string;
 amount: number;
}

export default function CashTransactionsPage() {
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [mode, setMode] = useState<"RECEIPT" | "DISBURSEMENT">("RECEIPT");
 const [searchTerm, setSearchTerm] = useState("");

 const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
 queryKey: ["finance-stats-transactions"],
 queryFn: async () => {
 const resp = await api.get("/finance/dashboard/advanced");
 return resp.data.metrics;
 },
 staleTime: 30000,
 });

 // Form State
 const [lines, setLines] = useState<TransactionLine[]>([]);

 const { data: coa } = useQuery({
 queryKey: ["coa"],
 queryFn: async () => {
 const res = await api.get("/finance/accounts");
 return res.data.map((a: any) => ({ id: a.id, name: a.name, code: a.code, category: a.type }));
 },
 });

 const { data: transactions, isLoading: txnLoading, isError: txnError } = useQuery<any[]>({
 queryKey: ["cash-transactions"],
 queryFn: async () => {
 const res = await api.get("/finance/journal");
 return res.data.map((j: any) => {
 const cashLines = j.lines?.filter((l: any) => l.account?.code?.startsWith('11')) || [];
 const netCash = cashLines.reduce((s: number, l: any) => s + Number(l.debit || 0) - Number(l.credit || 0), 0);
 return {
 id: j.reference || j.id,
 date: new Date(j.date).toISOString().split('T')[0],
 entity: j.description || 'Unknown',
 amount: Math.abs(netCash),
 type: netCash >= 0 ? 'RECEIPT' : 'DISBURSEMENT',
 status: 'CONFIRMED',
 };
 });
 },
 });

 const filteredTransactions = transactions?.filter(t =>
 t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
 t.entity.toLowerCase().includes(searchTerm.toLowerCase())
 ) || [];

 return (
 <OperationalMigrationShell
 title="CASH FLOW"
 subtitle="Real-time Cash & Bank Operations • Liquidity Hub v1.0"
 actions={
 <div className="flex gap-3">
 <Dialog open={isModalOpen && mode === "RECEIPT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("RECEIPT"); }}>
 <DialogTrigger asChild>
 <button type="button" className="operational-button is-primary">
 <ArrowUpRight className="h-4 w-4" />
 <span>Cash Receipt</span>
 </button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
 <TransactionForm mode="RECEIPT" coa={coa} lines={lines} setLines={setLines} onSuccess={() => setIsModalOpen(false)} />
 </DialogContent>
 </Dialog>

 <Dialog open={isModalOpen && mode === "DISBURSEMENT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("DISBURSEMENT"); }}>
 <DialogTrigger asChild>
 <button type="button" className="operational-button is-danger">
 <ArrowDownLeft className="h-4 w-4" />
 <span>Disbursement</span>
 </button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
 <TransactionForm mode="DISBURSEMENT" coa={coa} lines={lines} setLines={setLines} onSuccess={() => setIsModalOpen(false)} />
 </DialogContent>
 </Dialog>
 </div>
 }
 >
 {statsLoading || txnLoading ? (
 <div className="py-10 text-center text-[11px] text-slate-400">Loading transactions...</div>
 ) : statsError || txnError ? (
 <div className="py-10 text-center text-[11px] text-rose-500">Failed to load transaction data</div>
 ) : (
 <>
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Main Cash"
 value={formatOperationalCurrency(stats?.balance)}
 icon={<Wallet className="h-4 w-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Bank Balance"
 value={formatOperationalCurrency(stats?.cashIn)}
 icon={<CreditCard className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Inflow MTD"
 value={formatOperationalCurrency(stats?.cashIn)}
 icon={<ArrowUpRight className="h-4 w-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Outflow MTD"
 value={formatOperationalCurrency(stats?.cashOut)}
 icon={<ArrowDownLeft className="h-4 w-4" />}
 tone="red"
 />
 </OperationalMetricGrid>

 <section className="operational-panel">
 <div className="flex items-center justify-between gap-3 mb-4">
 <div>
 <h3 className="text-[13px] font-semibold text-slate-900">
 Journal Transactions Registry
 </h3>
 <p className="text-[11px] text-slate-500 mt-0.5">
 Real-time Fiscal Ledger • {formatOperationalNumber(filteredTransactions.length)} Records
 </p>
 </div>
 <div className="w-72">
 <OperationalInput
 icon={<Search className="h-4 w-4" />}
 placeholder="Search ledger..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 <Table className="table-dense">
 <TableHeader className="bg-slate-50/70">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 pl-4 text-left text-[11px] font-semibold uppercase tracking-tight text-slate-500">ID / Date</TableHead>
 <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight text-center">Type</TableHead>
 <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Entity / Reason</TableHead>
 <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight text-right">Amount</TableHead>
 <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight text-center">Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredTransactions.map((t: any) => (
 <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-3 pl-4">
 <div>
 <p className="font-medium text-slate-900 tracking-tight text-[12px]">{t.id}</p>
 <p className="text-[10px] text-slate-400 mt-0.5">{t.date}</p>
 </div>
 </TableCell>
 <TableCell className="py-3 text-center">
 <OperationalStatusBadge status={t.type === 'RECEIPT' ? 'success' : 'danger'}>
 {t.type}
 </OperationalStatusBadge>
 </TableCell>
 <TableCell className="py-3">
 <p className="font-medium text-slate-900 text-[12px]">{t.entity}</p>
 <p className="text-[10px] text-slate-400 mt-0.5">Operational Transfer</p>
 </TableCell>
 <TableCell className="py-3 text-right font-mono tabular-nums">
 <p className={cn("font-medium text-[12px]", t.type === 'RECEIPT' ? "text-emerald-600" : "text-rose-600")}>
 {t.type === 'RECEIPT' ? '+' : '-'} {formatOperationalCurrency(t.amount)}
 </p>
 </TableCell>
 <TableCell className="py-3 text-center">
 <OperationalStatusBadge status="success">
 {getOperationalStatusLabel(t.status)}
 </OperationalStatusBadge>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </section>
 </>)}
 </OperationalMigrationShell>
 );
}

function TransactionForm({ mode, coa, lines, setLines, onSuccess }: any) {
 const isReceipt = mode === "RECEIPT";
 const color = isReceipt ? "emerald" : "rose";

 const [selectedAccountId, setSelectedAccountId] = useState("");
 const [lineAmount, setLineAmount] = useState("");
 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [entityName, setEntityName] = useState("");
 const [cashAccountId, setCashAccountId] = useState("");
 const [notes, setNotes] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);

 const addLine = () => {
 if (!selectedAccountId || !lineAmount) return;
 const account = coa?.find((a: any) => a.id === selectedAccountId);
 setLines([...lines, { accountId: selectedAccountId, accountName: account.name, amount: Number(lineAmount) }]);
 setSelectedAccountId("");
 setLineAmount("");
 };

 const totalAmount = lines.reduce((sum: number, l: TransactionLine) => sum + l.amount, 0);
 const isSaveDisabled = isSubmitting || !cashAccountId || lines.length === 0;

 const handleSubmit = () => {
 if (isSaveDisabled) return;
 setShowConfirm(true);
 };

 const confirmSubmit = async () => {
 setShowConfirm(false);
 setIsSubmitting(true);
 try {
 const journalLines: any[] = [];
 if (isReceipt) {
 journalLines.push({ accountId: cashAccountId, debit: totalAmount, credit: 0 });
 lines.forEach((l: TransactionLine) => {
 journalLines.push({ accountId: l.accountId, debit: 0, credit: l.amount });
 });
 } else {
 lines.forEach((l: TransactionLine) => {
 journalLines.push({ accountId: l.accountId, debit: l.amount, credit: 0 });
 });
 journalLines.push({ accountId: cashAccountId, debit: 0, credit: totalAmount });
 }
 await api.post("/finance/journals", {
 date,
 description: entityName ? `${entityName} — ${notes}` : notes || entityName,
 lines: journalLines,
 });
 toast.success(isReceipt ? "Deposit confirmed!" : "Payment confirmed!");
 setLines([]);
 setDate(new Date().toISOString().split('T')[0]);
 setEntityName("");
 setCashAccountId("");
 setNotes("");
 onSuccess?.();
 } catch (err: any) {
 toast.error(err?.response?.data?.message || "Transaction failed");
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <>
 <div className={cn("p-8 text-white relative", isReceipt ? "bg-emerald-600" : "bg-rose-600")}>
 <DialogTitle className="text-2xl font-semibold tracking-tight leading-none text-white">
 Cash {isReceipt ? "Receipt" : "Disbursement"}
 </DialogTitle>
 <DialogDescription className="text-white/70 text-[11px] mt-2">
 {isReceipt ? "Record Incoming Funds" : "Authorize Outgoing Payment"}
 </DialogDescription>
 <DollarSign className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 opacity-30 text-white" />
 </div>
 <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide font-inter">
 <div className="grid grid-cols-2 gap-6">
 <OperationalField label="Tanggal">
 <input
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] font-medium text-slate-900"
 />
 </OperationalField>
 <OperationalField label={isReceipt ? "Terima Dari" : "Bayar Kepada"}>
 <input
 type="text"
 placeholder="Nama individu / instansi..."
 value={entityName}
 onChange={(e) => setEntityName(e.target.value)}
 className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] font-medium text-slate-900"
 />
 </OperationalField>
 <OperationalField label={isReceipt ? "Simpan Ke Akun" : "Ambil Dari Akun"}>
 <Select value={cashAccountId} onValueChange={(v) => setCashAccountId(v || "")}>
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-md font-medium text-[12px]">
 <SelectValue placeholder="Pilih CoA Kas & Bank" />
 </SelectTrigger>
 <SelectContent>
 {coa?.filter((a: any) => a.category === "CASH").map((a: any) => (
 <SelectItem key={a.id} value={a.id || ""} className="font-medium text-[12px]">{a.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </OperationalField>
 <OperationalField label="Keterangan">
 <input
 type="text"
 placeholder="Catatan transaksi..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] font-medium text-slate-900"
 />
 </OperationalField>
 </div>

 <div className="space-y-4">
 <Label className="text-[11px] font-semibold text-slate-900">Allocation Table</Label>
 <div className="grid grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-center">
 <div className="col-span-7">
 <Select value={selectedAccountId} onValueChange={(v) => setSelectedAccountId(v || "")}>
 <SelectTrigger className="h-10 bg-slate-50 border border-slate-200 rounded-md font-medium text-[12px]">
 <SelectValue placeholder={isReceipt ? "Pilih Akun Pendapatan/Asal..." : "Pilih Akun Biaya/Tujuan..."} />
 </SelectTrigger>
 <SelectContent>
 {coa?.filter((a: any) => isReceipt ? a.category === "REVENUE" : a.category === "EXPENSE").map((a: any) => (
 <SelectItem key={a.id} value={a.id || ""} className="font-medium text-[12px]">{a.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <input
 type="number"
 placeholder="Nominal (Rp)"
 className="col-span-4 h-10 px-3 bg-white border border-slate-200 rounded-md text-[12px] font-medium"
 value={lineAmount}
 onChange={(e) => setLineAmount(e.target.value)}
 />
 <button
 type="button"
 onClick={addLine}
 className={cn("h-10 rounded-md col-span-1 flex items-center justify-center operational-button", isReceipt ? "is-primary" : "is-danger")}
 >
 <Plus size={14} />
 </button>
 </div>

 <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
 <Table className="table-dense">
 <TableHeader className="bg-slate-50">
 <TableRow className="hover:bg-transparent">
 <TableHead className="h-9 text-[11px] font-medium text-slate-500">Target Account</TableHead>
 <TableHead className="h-9 text-[11px] font-medium text-slate-500 text-right">Amount</TableHead>
 <TableHead className="h-9 text-right"></TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {lines.map((line: any, idx: number) => (
 <TableRow key={idx} className="bg-white">
 <TableCell className="font-medium text-[12px]">{line.accountName}</TableCell>
 <TableCell className="font-medium text-[12px] text-right font-mono tabular-nums">{formatOperationalCurrency(line.amount)}</TableCell>
 <TableCell className="text-right">
 <button
 type="button"
 className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
 onClick={() => setLines(lines.filter((_: any, i: number) => i !== idx))}
 >
 <Trash2 size={14} />
 </button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>

 <button
 type="button"
 onClick={handleSubmit}
 disabled={isSaveDisabled}
 className={cn("w-full h-11 rounded-md operational-button", isReceipt ? "is-primary" : "is-danger")}
 >
 {isSubmitting ? "Processing..." : `Confirm ${isReceipt ? "Deposit" : "Payment"}`}
 </button>
 </div>

 <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Konfirmasi</DialogTitle>
 </DialogHeader>
 <p>Apakah Anda yakin ingin menyimpan data ini?</p>
 <DialogFooter>
 <button type="button" className="operational-button is-secondary" onClick={() => setShowConfirm(false)}>Batal</button>
 <button type="button" className="operational-button is-primary" onClick={confirmSubmit}>Ya, Simpan</button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </>
 );
}
