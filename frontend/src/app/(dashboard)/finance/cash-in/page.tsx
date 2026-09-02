"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowUpCircle, Plus, Trash2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DnaInput, DnaButton, DnaBadge, TableWrapper } from "@/components/dna";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
      toast.success(`Kas Masuk Rp ${totalCash.toLocaleString()} berhasil dicatat!`);
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
    <DashboardShell title="KAS" titleAccent="MASUK" subtitle="Penerimaan Dana — Multi-Line Cash Receipt Terminal"
      actions={<DnaBadge status="success">Cash In</DnaBadge>}
    >
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-emerald-500">
          <ArrowUpCircle size={180} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Tanggal Transaksi</Label>
            <DnaInput type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Kas / Bank (Debit) <span className="text-red-500">*</span></Label>
             <Select onValueChange={(v: string | null) => setCashAccountId(v || "")}>
              <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                <SelectValue placeholder="Pilih Akun Kas/Bank" />
              </SelectTrigger>
              <SelectContent>
                {cashAccounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400">Diterima Dari</Label>
            <DnaInput placeholder="Nama pengirim..." value={sender} onChange={e => setSender(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" />
          </div>
        </div>

        <div className="mb-8">
          <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 mb-2 block">Tambah Penerimaan per Akun (Kredit)</Label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-end">
            <div>
              <Label className="text-[8px] font-black uppercase text-slate-400">Akun Pendapatan</Label>
              <Select onValueChange={v => setCartAccount(v || "")} value={cartAccount}>
                <SelectTrigger className="h-10 bg-white border border-slate-200 rounded-xl text-xs">
                  <SelectValue placeholder="Pilih Akun" />
                </SelectTrigger>
                <SelectContent>
                  {counterpartAccounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[8px] font-black uppercase text-slate-400">Jumlah (Rp)</Label>
              <DnaInput type="number" placeholder="0" value={cartAmount} onChange={e => setCartAmount(e.target.value)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs" />
            </div>
            <div>
              <Label className="text-[8px] font-black uppercase text-slate-400">Memo</Label>
              <DnaInput placeholder="Catatan" value={cartMemo} onChange={e => setCartMemo(e.target.value)} className="h-10 bg-white border border-slate-100 rounded-xl text-xs" />
            </div>
            <DnaButton onClick={addEntry} variant="primary" className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> Tambah
            </DnaButton>
          </div>
        </div>

        <div className="mb-8">
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400">Akun</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400 text-right">Jumlah</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400">Memo</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-xs">{e.accountName}</TableCell>
                    <TableCell className="font-black text-xs text-right text-emerald-600 font-mono tabular-nums">Rp {e.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-slate-400">{e.memo}</TableCell>
                    <TableCell className="text-right">
                      <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-rose-500" onClick={() => removeEntry(idx)}>
                        <Trash2 size={14} />
                      </DnaButton>
                    </TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-[10px] text-slate-400 py-8">Belum ada entry. Tambah penerimaan di atas.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <div className="mb-4 md:mb-0">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Penerimaan</p>
            <p className="text-2xl font-black tracking-tighter text-emerald-600 font-mono tabular-nums">Rp {totalCash.toLocaleString()}</p>
          </div>
          <DnaButton variant="primary" className="bg-emerald-600 hover:bg-emerald-700 h-14 px-12 rounded-2xl disabled:opacity-20"
            disabled={!isReady || isSubmitting}
            onClick={handleSubmit}
            icon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? "Memproses..." : "Simpan Transaksi"}
          </DnaButton>
        </div>
      </div>

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
    </DashboardShell>
  );
}
