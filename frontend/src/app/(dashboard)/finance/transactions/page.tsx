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
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { StatCard, DnaInput, DnaButton, TableWrapper, DnaBadge } from "@/components/dna";
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
    <DashboardShell
      title="CASH"
      titleAccent="FLOW"
      subtitle="(Real-time Cash & Bank Operations • Liquidity Hub v1.0)"
      actions={
        <div className="flex gap-3">
          <Dialog open={isModalOpen && mode === "RECEIPT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("RECEIPT"); }}>
            <DialogTrigger asChild>
              <DnaButton variant="primary" className="h-11 px-5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-tighter text-xs">
                <ArrowUpRight className="mr-2 h-4.5 w-4.5 stroke-[3px]" /> Cash Receipt
              </DnaButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
               <TransactionForm mode="RECEIPT" coa={coa} lines={lines} setLines={setLines} onSuccess={() => setIsModalOpen(false)} />
             </DialogContent>
           </Dialog>

           <Dialog open={isModalOpen && mode === "DISBURSEMENT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("DISBURSEMENT"); }}>
             <DialogTrigger asChild>
               <DnaButton variant="primary" className="h-11 px-5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-tighter text-xs bg-rose-600 hover:bg-rose-700">
                 <ArrowDownLeft className="mr-2 h-4.5 w-4.5 stroke-[3px]" /> Disbursement
               </DnaButton>
             </DialogTrigger>
             <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
                <TransactionForm mode="DISBURSEMENT" coa={coa} lines={lines} setLines={setLines} onSuccess={() => setIsModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {statsLoading || txnLoading ? (
        <QueryLoading message="Loading transactions..." />
      ) : statsError || txnError ? (
        <QueryError error="Failed to load transaction data" onRetry={() => window.location.reload()} />
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Wallet className="text-emerald-600" />} label="Main Cash" value={stats?.balance ? `Rp ${(Number(stats.balance) / 1000000).toFixed(1)}M` : "Rp 0"} />
        <StatCard icon={<CreditCard className="text-blue-600" />} label="Bank Balance" value={stats?.cashIn ? `Rp ${(Number(stats.cashIn) / 1000000).toFixed(1)}M` : "Rp 0"} />
        <StatCard icon={<ArrowUpRight className="text-emerald-500" />} label="Inflow MTD" value={stats?.cashIn ? `+ Rp ${(Number(stats.cashIn) / 1000000).toFixed(0)}M` : "+ Rp 0"} />
        <StatCard icon={<ArrowDownLeft className="text-rose-500" />} label="Outflow MTD" value={stats?.cashOut ? `- Rp ${(Number(stats.cashOut) / 1000000).toFixed(0)}M` : "- Rp 0"} />
      </div>

      <div className="mt-6">
        <TableWrapper
          filters={
            <div className="flex items-center gap-3 w-full justify-between">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                  Journal Transactions Registry
                </h3>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                  Real-time Fiscal Ledger • {filteredTransactions.length} Records
                </p>
              </div>
              <div className="relative w-64">
                <DnaInput 
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Search ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          }
        >
          <Table className="table-dense">
            <TableHeader className="bg-slate-50/70">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">ID / Date</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Type</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Entity / Reason</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Amount</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
                <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t: any) => (
                <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                  <TableCell className="py-3 pl-6">
                    <div>
                      <p className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{t.id}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5 italic">{t.date}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <DnaBadge status={t.type === 'RECEIPT' ? 'success' : 'critical'}>
                      {t.type}
                    </DnaBadge>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-black text-slate-900 text-xs uppercase italic">{t.entity}</p>
                    <p className="text-[9px] font-medium text-slate-400 uppercase italic mt-0.5">Operational Transfer</p>
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono tabular-nums">
                    <p className={cn("font-black text-xs", t.type === 'RECEIPT' ? "text-emerald-600" : "text-rose-600")}>
                      {t.type === 'RECEIPT' ? '+' : '-'} Rp {t.amount.toLocaleString()}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <DnaBadge status="success">
                      {t.status}
                    </DnaBadge>
                  </TableCell>
                  <TableCell className="py-3 pr-6 text-right">
                    <DnaButton variant="outline" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                      <Search size={14} />
                    </DnaButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>
      </>)}
    </DashboardShell>
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
        <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">
          Cash {isReceipt ? "Receipt" : "Disbursement"}
        </DialogTitle>
        <DialogDescription className="text-white/70 font-medium uppercase text-[9px] tracking-tight mt-2">
          {isReceipt ? "Record Incoming Funds" : "Authorize Outgoing Payment"}
        </DialogDescription>
        <DollarSign className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 opacity-30 text-white" />
      </div>
      <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide font-inter">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">Tanggal</Label>
            <DnaInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">{isReceipt ? "Terima Dari" : "Bayar Kepada"}</Label>
            <DnaInput placeholder="Nama individu / instansi..." value={entityName} onChange={(e) => setEntityName(e.target.value)} className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">{isReceipt ? "Simpan Ke Akun" : "Ambil Dari Akun"}</Label>
            <Select value={cashAccountId} onValueChange={(v) => setCashAccountId(v || "")}>
              <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                <SelectValue placeholder="Pilih CoA Kas & Bank" />
              </SelectTrigger>
              <SelectContent>
                {coa?.filter((a: any) => a.category === "CASH").map((a: any) => (
                  <SelectItem key={a.id} value={a.id || ""} className="font-medium text-xs">{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">Keterangan</Label>
            <DnaInput placeholder="Catatan transaksi..." value={notes} onChange={(e) => setNotes(e.target.value)} className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs" />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[9px] font-black uppercase tracking-tight text-slate-900">Allocation Table</Label>
          <div className="grid grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-center">
            <div className="col-span-7">
              <Select value={selectedAccountId} onValueChange={(v) => setSelectedAccountId(v || "")}>
                <SelectTrigger className="h-10 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                   <SelectValue placeholder={isReceipt ? "Pilih Akun Pendapatan/Asal..." : "Pilih Akun Biaya/Tujuan..."} />
                </SelectTrigger>
                <SelectContent>
                  {coa?.filter((a: any) => isReceipt ? a.category === "REVENUE" : a.category === "EXPENSE").map((a: any) => (
                    <SelectItem key={a.id} value={a.id || ""} className="font-medium text-xs">{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DnaInput 
              type="number" 
              placeholder="Nominal (Rp)" 
              className="border-none bg-white col-span-4 shadow-sm text-xs h-10"
              value={lineAmount}
              onChange={(e) => setLineAmount(e.target.value)}
            />
            <DnaButton type="button" onClick={addLine} variant="primary" className={cn("h-10 rounded-lg col-span-1 shadow-sm p-0 flex items-center justify-center", isReceipt ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")}>
              <Plus size={14} strokeWidth={3} />
            </DnaButton>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
            <Table className="table-dense">
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 text-[9px] font-black uppercase text-slate-400">Target Account</TableHead>
                  <TableHead className="h-9 text-[9px] font-black uppercase text-slate-400 text-right">Amount</TableHead>
                  <TableHead className="h-9 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line: any, idx: number) => (
                  <TableRow key={idx} className="bg-white">
                    <TableCell className="font-medium text-xs">{line.accountName}</TableCell>
                    <TableCell className="font-black text-xs text-right italic font-mono tabular-nums">Rp {line.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DnaButton variant="outline" className="text-slate-300 hover:text-rose-500 h-8 w-8 p-0 rounded-lg" onClick={() => setLines(lines.filter((_: any, i: number) => i !== idx))}>
                        <Trash2 size={14} />
                      </DnaButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DnaButton variant="primary" onClick={handleSubmit} disabled={isSaveDisabled} className={cn("w-full h-11 rounded-xl shadow-sm", isReceipt ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")}>
          {isSubmitting ? "Processing..." : `Confirm ${isReceipt ? "Deposit" : "Payment"}`}
        </DnaButton>
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
    </>
  );
}
