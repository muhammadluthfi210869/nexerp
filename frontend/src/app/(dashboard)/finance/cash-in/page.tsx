"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Trash2, Save, ArrowUpCircle } from "lucide-react";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DnaInput, DnaButton, DnaBadge, TableWrapper } from "@/components/dna";
import { toast } from "sonner";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";
import {
 OperationalButton,
 OperationalField,
 OperationalInput,
 OperationalPageShell,
 OperationalPanel,
 OperationalStatusBadge,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

export default function CashInPage() {
 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [cashAccountId, setCashAccountId] = useState("");
 const [sender, setSender] = useState("");
 const [entries, setEntries] = useState<{ accountId: string; accountName: string; amount: number; memo: string }[]>([]);
 const [cartAccount, setCartAccount] = useState("");
 const [cartAmount, setCartAmount] = useState("");
 const [cartMemo, setCartMemo] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);

 const { data: accounts } = useQuery({
 queryKey: ["coa"],
 queryFn: async () => {
 const res = await api.get("/finance/accounts");
 return res.data;
 },
 });

 const cashAccounts = accounts?.filter((a: any) => a.code?.startsWith('11')) || [];
 const counterpartAccounts = accounts?.filter((a: any) => ['REVENUE', 'LIABILITY'].includes(a.type)) || [];

 const addEntry = () => {
 if (!cartAccount || !cartAmount) return;
 const acc = counterpartAccounts.find((a: any) => a.id === cartAccount);
 setEntries([...entries, { accountId: cartAccount, accountName: acc?.name || '', amount: Number(cartAmount), memo: cartMemo }]);
 setCartAccount("");
 setCartAmount("");
 setCartMemo("");
 };

 const removeEntry = (idx: number) => setEntries(entries.filter((_, i) => i !== idx));

 const totalCash = entries.reduce((s, e) => s + e.amount, 0);
 const isReady = cashAccountId && entries.length > 0;

 const handleSubmit = () => {
 if (!isReady || isSubmitting) return;
 setShowConfirm(true);
 };

 const confirmSubmit = async () => {
 setShowConfirm(false);
 setIsSubmitting(true);
 try {
 const lines = [
 { accountId: cashAccountId, debit: totalCash, credit: 0 },
 ...entries.map(e => ({ accountId: e.accountId, debit: 0, credit: e.amount })),
 ];
 await api.post("/finance/journals", {
 date,
 description: `Kas Masuk dari ${sender}: ${entries.map(e => e.memo).filter(Boolean).join(', ') || totalCash}`,
 lines,
 });
 toast.success(`Kas Masuk ${formatOperationalCurrency(totalCash)} berhasil dicatat!`);
 setEntries([]);
 setSender("");
 setCartAccount("");
 setCartAmount("");
 setCartMemo("");
 } catch (err: any) {
 toast.error(err.response?.data?.message || "Gagal menyimpan transaksi");
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <OperationalPageShell
 title="Kas Masuk"
 subtitle="Penerimaan dana — entri jurnal multi-line"
 actions={<OperationalStatusBadge status="success">Cash In</OperationalStatusBadge>}
 >
 <OperationalPanel>
 <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
 <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-600">
 <ArrowUpCircle className="h-4 w-4" />
 </div>
 <h3 className="text-[13px] font-semibold text-slate-900">Header Transaksi</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <OperationalField label="Tanggal Transaksi">
 <DnaInput type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 rounded-md border-slate-200 text-[12px] font-medium" />
 </OperationalField>
 <OperationalField label="Kas / Bank (Debit)">
 <Select value={cashAccountId} onValueChange={(v: string | null) => setCashAccountId(v || "")}>
 <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
 <SelectValue placeholder="Pilih akun kas/bank" />
 </SelectTrigger>
 <SelectContent>
 {cashAccounts.map((acc: any) => (
 <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </OperationalField>
 <OperationalField label="Diterima Dari">
 <DnaInput placeholder="Nama pengirim..." value={sender} onChange={e => setSender(e.target.value)} className="h-9 rounded-md border-slate-200 text-[12px] font-medium" />
 </OperationalField>
 </div>
 </OperationalPanel>

 <OperationalPanel>
 <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
 <h3 className="text-[13px] font-semibold text-slate-900">Tambah Penerimaan per Akun (Kredit)</h3>
 </div>
 <div className="grid grid-cols-1 gap-3 rounded-md border border-slate-100 bg-slate-50/50 p-3 md:grid-cols-4 md:items-end">
 <OperationalField label="Akun Pendapatan">
 <Select onValueChange={v => setCartAccount(v || "")} value={cartAccount}>
 <SelectTrigger className="h-9 rounded-md border border-slate-200 bg-white text-[12px] font-medium text-slate-700">
 <SelectValue placeholder="Pilih akun" />
 </SelectTrigger>
 <SelectContent>
 {counterpartAccounts.map((acc: any) => (
 <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </OperationalField>
 <OperationalField label="Jumlah (Rp)">
 <DnaInput type="number" placeholder="0" value={cartAmount} onChange={e => setCartAmount(e.target.value)} className="h-9 rounded-md border-slate-200 text-[12px] font-medium tabular-nums" />
 </OperationalField>
 <OperationalField label="Memo">
 <DnaInput placeholder="Catatan" value={cartMemo} onChange={e => setCartMemo(e.target.value)} className="h-9 rounded-md border-slate-200 text-[12px] font-medium" />
 </OperationalField>
 <OperationalButton variant="primary" onClick={addEntry}>
 <Plus className="h-4 w-4" /> Tambah
 </OperationalButton>
 </div>

 <div className="mt-4">
 <TableWrapper>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className="text-[12px] font-semibold normal-case text-slate-500">Akun</TableHead>
 <TableHead className="text-[12px] font-semibold normal-case text-slate-500 text-right">Jumlah</TableHead>
 <TableHead className="text-[12px] font-semibold normal-case text-slate-500">Memo</TableHead>
 <TableHead className="text-right"></TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {entries.map((e, idx) => (
 <TableRow key={idx}>
 <TableCell className="text-[12px] font-medium text-slate-900">{e.accountName}</TableCell>
 <TableCell className="text-right text-[12px] font-semibold text-emerald-700 tabular-nums">{formatOperationalCurrency(e.amount)}</TableCell>
 <TableCell className="text-[12px] text-slate-500">{e.memo}</TableCell>
 <TableCell className="text-right">
 <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-md text-slate-400 hover:text-rose-600" onClick={() => removeEntry(idx)}>
 <Trash2 size={14} />
 </DnaButton>
 </TableCell>
 </TableRow>
 ))}
 {entries.length === 0 && (
 <TableRow>
 <TableCell colSpan={4} className="py-8 text-center text-[12px] text-slate-500">Belum ada entry. Tambah penerimaan di atas.</TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </TableWrapper>
 </div>

 <div className="mt-4 flex flex-col items-stretch justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/50 p-4 md:flex-row md:items-center">
 <div>
 <p className="text-[11px] font-medium text-slate-500">Total Penerimaan</p>
 <p className="text-[18px] font-semibold text-emerald-700 tabular-nums">{formatOperationalCurrency(totalCash)}</p>
 </div>
 <OperationalButton
 variant="primary"
 disabled={!isReady || isSubmitting}
 onClick={handleSubmit}
 >
 <Save className="h-4 w-4" />
 {isSubmitting ? "Memproses..." : "Simpan Transaksi"}
 </OperationalButton>
 </div>
 </OperationalPanel>

 <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Konfirmasi</DialogTitle>
 </DialogHeader>
 <p>Apakah Anda yakin ingin menyimpan data ini?</p>
 <DialogFooter>
 <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
 <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </OperationalPageShell>
 );
}
