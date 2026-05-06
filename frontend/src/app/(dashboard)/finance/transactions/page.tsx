"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  ArrowRight,
  Trash2,
  Loader2,
  Search,
  Filter,
  DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TransactionLine {
  accountId: string;
  accountName: string;
  amount: number;
}

export default function CashTransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"RECEIPT" | "DISBURSEMENT">("RECEIPT");

  const { data: stats } = useQuery({
    queryKey: ["finance-stats-transactions"],
    queryFn: async () => {
      const resp = await api.get("/finance/dashboard/advanced");
      return resp.data.metrics;
    },
    staleTime: 30000,
  });
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entityName, setEntityName] = useState(""); // Received From / Paid To
  const [cashAccountId, setCashAccountId] = useState(""); // CoA Kas/Bank
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<TransactionLine[]>([]);
  
  // New Line State
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [lineAmount, setLineAmount] = useState("");

  const { data: coa } = useQuery({
    queryKey: ["coa"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      return res.data.map((a: any) => ({ id: a.id, name: a.name, code: a.code, category: a.type }));
    },
  });

  const { data: transactions } = useQuery<any[]>({
    queryKey: ["cash-transactions"],
    queryFn: async () => {
      const res = await api.get("/finance/journal");
      return res.data.map((j: any) => ({
        id: j.reference || j.id,
        date: new Date(j.date).toISOString().split('T')[0],
        type: j.lines?.some((l: any) => l.debit > 0 && l.account?.code?.startsWith('1')) ? 'RECEIPT' : 'DISBURSEMENT',
        entity: j.description || 'Unknown',
        amount: Math.abs(j.lines?.reduce((sum: number, l: any) => sum + Number(l.debit || 0) - Number(l.credit || 0), 0) || 0),
        status: 'CONFIRMED',
      }));
    },
  });

  const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);

  const addLine = () => {
    if (!selectedAccountId || !lineAmount) return;
    const account = coa?.find((a: any) => a.id === selectedAccountId);
    if (!account) return;

    setLines([...lines, {
      accountId: selectedAccountId,
      accountName: account.name,
      amount: Number(lineAmount)
    }]);
    setSelectedAccountId("");
    setLineAmount("");
  };

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            CASH <span className="text-emerald-600">FLOW</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <Badge className="bg-slate-900 text-white font-bold tracking-tight text-[10px] uppercase px-4 py-1.5 rounded-full border-none">Liquidity Hub v1.0</Badge>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Real-time Cash & Bank Operations</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isModalOpen && mode === "RECEIPT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("RECEIPT"); }}>
            <DialogTrigger render={
              <Button className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-2xl shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 active:scale-95 border-none uppercase tracking-tighter text-sm">
                <ArrowUpRight className="mr-2 h-5 w-5 stroke-[3px]" /> Cash Receipt
              </Button>
            } />
            <DialogContent className="sm:max-w-[800px] bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
               <TransactionForm mode="RECEIPT" coa={coa} lines={lines} setLines={setLines} />
            </DialogContent>
          </Dialog>

          <Dialog open={isModalOpen && mode === "DISBURSEMENT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("DISBURSEMENT"); }}>
            <DialogTrigger render={
              <Button className="h-12 bg-rose-600 hover:bg-rose-700 text-white font-black px-8 rounded-2xl shadow-xl shadow-rose-100 transition-all hover:-translate-y-1 active:scale-95 border-none uppercase tracking-tighter text-sm">
                <ArrowDownLeft className="mr-2 h-5 w-5 stroke-[3px]" /> Disbursement
              </Button>
            } />
            <DialogContent className="sm:max-w-[800px] bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
               <TransactionForm mode="DISBURSEMENT" coa={coa} lines={lines} setLines={setLines} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Wallet className="text-emerald-600" />} label="Main Cash" value={stats?.balance ? `Rp ${(Number(stats.balance) / 1000000).toFixed(1)}M` : "Rp 0"} />
        <StatCard icon={<CreditCard className="text-blue-600" />} label="Bank Balance" value={stats?.cashIn ? `Rp ${(Number(stats.cashIn) / 1000000).toFixed(1)}M` : "Rp 0"} />
        <StatCard icon={<ArrowUpRight className="text-emerald-500" />} label="Inflow MTD" value={stats?.cashIn ? `+ Rp ${(Number(stats.cashIn) / 1000000).toFixed(0)}M` : "+ Rp 0"} />
        <StatCard icon={<ArrowDownLeft className="text-rose-500" />} label="Outflow MTD" value={stats?.cashOut ? `- Rp ${(Number(stats.cashOut) / 1000000).toFixed(0)}M` : "- Rp 0"} />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden font-inter">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">ID / Date</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Type</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Entity / Reason</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Amount</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
              <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((t: any) => (
              <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                <TableCell className="py-8 pl-10">
                  <div>
                    <p className="font-black text-slate-900 tracking-tight text-lg leading-tight uppercase italic">{t.id}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1 italic">{t.date}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase", 
                    t.type === 'RECEIPT' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {t.type === 'RECEIPT' ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownLeft size={12} strokeWidth={3} />}
                    {t.type}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-black text-slate-900 text-sm uppercase italic">{t.entity}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic mt-1">Operational Transfer</p>
                </TableCell>
                <TableCell className="text-right">
                  <p className={cn("font-black text-lg", t.type === 'RECEIPT' ? "text-emerald-600" : "text-rose-600")}>
                    {t.type === 'RECEIPT' ? '+' : '-'} Rp {t.amount.toLocaleString()}
                  </p>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-slate-900 text-white font-black uppercase text-[9px] px-3 py-1 rounded-lg italic">
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell className="pr-10 text-right">
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
                    <Search size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TransactionForm({ mode, coa, lines, setLines }: any) {
  const isReceipt = mode === "RECEIPT";
  const color = isReceipt ? "emerald" : "rose";
  
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [lineAmount, setLineAmount] = useState("");

  const addLine = () => {
    if (!selectedAccountId || !lineAmount) return;
    const account = coa?.find((a: any) => a.id === selectedAccountId);
    setLines([...lines, { accountId: selectedAccountId, accountName: account.name, amount: Number(lineAmount) }]);
    setSelectedAccountId("");
    setLineAmount("");
  };

  return (
    <>
      <div className={cn("p-8 text-white relative", isReceipt ? "bg-emerald-600" : "bg-rose-600")}>
        <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none italic">
          Cash {isReceipt ? "Receipt" : "Disbursement"}
        </DialogTitle>
        <DialogDescription className="text-white/70 font-medium uppercase text-[10px] tracking-tight mt-2">
          {isReceipt ? "Record Incoming Funds" : "Authorize Outgoing Payment"}
        </DialogDescription>
        <DollarSign className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 opacity-30" />
      </div>
      <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide font-inter">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Tanggal</Label>
            <Input type="date" className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">{isReceipt ? "Terima Dari" : "Bayar Kepada"}</Label>
            <Input placeholder="Nama individu / instansi..." className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">{isReceipt ? "Simpan Ke Akun" : "Ambil Dari Akun"}</Label>
            <Select>
              <SelectTrigger className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl">
                <SelectValue placeholder="Pilih CoA Kas & Bank" />
              </SelectTrigger>
              <SelectContent>
                {coa?.filter((a: any) => a.category === "CASH").map((a: any) => (
                  <SelectItem key={a.id} value={a.id} className="font-bold">{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Keterangan</Label>
            <Input placeholder="Catatan transaksi..." className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl" />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-tight text-slate-900">Allocation Table</Label>
          <div className="grid grid-cols-12 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="col-span-7">
              <Select value={selectedAccountId} onValueChange={(v) => setSelectedAccountId(v || "")}>
                <SelectTrigger className="h-11 border-none bg-white font-bold rounded-xl shadow-sm">
                   <SelectValue placeholder={isReceipt ? "Pilih Akun Pendapatan/Asal..." : "Pilih Akun Biaya/Tujuan..."} />
                </SelectTrigger>
                <SelectContent>
                  {coa?.filter((a: any) => isReceipt ? a.category === "REVENUE" : a.category === "EXPENSE").map((a: any) => (
                    <SelectItem key={a.id} value={a.id} className="font-bold">{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input 
              type="number" 
              placeholder="Nominal (Rp)" 
              className="h-11 border-none bg-white font-bold col-span-4 shadow-sm"
              value={lineAmount}
              onChange={(e) => setLineAmount(e.target.value)}
            />
            <Button type="button" onClick={addLine} className={cn("h-11 text-white font-black rounded-xl col-span-1 shadow-lg", isReceipt ? "bg-emerald-600 shadow-emerald-100" : "bg-rose-600 shadow-rose-100")}>
              <Plus size={16} strokeWidth={3} />
            </Button>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 text-[9px] font-black uppercase text-slate-400">Target Account</TableHead>
                  <TableHead className="h-10 text-[9px] font-black uppercase text-slate-400 text-right">Amount</TableHead>
                  <TableHead className="h-10 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line: any, idx: number) => (
                  <TableRow key={idx} className="bg-white">
                    <TableCell className="font-bold text-xs">{line.accountName}</TableCell>
                    <TableCell className="font-black text-xs text-right italic">Rp {line.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setLines(lines.filter((_: any, i: number) => i !== idx))} className="text-slate-300 hover:text-rose-500 h-8 w-8 p-0">
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Button className={cn("w-full h-14 text-white font-black uppercase tracking-tight rounded-2xl shadow-xl transition-all", isReceipt ? "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700" : "bg-rose-600 shadow-rose-100 hover:bg-rose-700")}>
          Confirm {isReceipt ? "Deposit" : "Payment"}
        </Button>
      </div>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string | number }) {
   return (
      <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-8 flex flex-col gap-4 bg-white hover:translate-y-[-4px] transition-all duration-500">
         <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">
            {icon}
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-slate-300">{label}</p>
            <p className="text-2xl font-black tracking-tighter mt-1 text-slate-900">{value}</p>
         </div>
      </Card>
   );
}

