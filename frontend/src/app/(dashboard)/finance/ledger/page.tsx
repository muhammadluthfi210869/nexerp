"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Search, 
  BookOpen,
  Calculator,
  History as HistoryIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRightLeft,
  Trash2,
  Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export default function GeneralLedgerPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([]);
  
  // New Line State
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [lineDebit, setLineDebit] = useState("");
  const [lineCredit, setLineCredit] = useState("");
  const [lineNote, setLineNote] = useState("");

  // Queries
  const { data: coa } = useQuery({
    queryKey: ["coa"],
    queryFn: async () => {
      const resp = await api.get("/finance/accounts");
      return resp.data;
    },
  });

  const { data: journals, isLoading } = useQuery<any[]>({
    queryKey: ["journals"],
    queryFn: async () => {
      const resp = await api.get("/finance/journals");
      return resp.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["finance-stats"],
    queryFn: async () => {
       const resp = await api.get("/finance/dashboard/advanced");
       return resp.data;
    }
  });

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addLine = () => {
    if (!selectedAccountId || (!lineDebit && !lineCredit)) {
      toast.error("Account and either Debit or Credit required.");
      return;
    }
    const account = coa?.find((a: any) => a.id === selectedAccountId);
    if (!account) return;

    setLines([...lines, {
      accountId: selectedAccountId,
      accountName: account.name,
      debit: Number(lineDebit) || 0,
      credit: Number(lineCredit) || 0,
      description: lineNote
    }]);

    setSelectedAccountId("");
    setLineDebit("");
    setLineCredit("");
    setLineNote("");
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const createJournalMutation = useMutation({
    mutationFn: async (data: any) => {
      const resp = await api.post("/finance/journals", data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
      setIsAddModalOpen(false);
      setLines([]);
      setReference("");
      setGeneralNotes("");
      toast.success("Journal Entry Berhasil Diposting");
    },
    onError: (error: any) => {
      toast.error("Gagal Posting Journal: " + (error.response?.data?.message || error.message));
    }
  });

  const handleSubmit = () => {
    if (!isBalanced) return toast.error("Journal Tidak Balance!");
    if (lines.length < 2) return toast.error("Journal Minimal 2 Baris!");
    
    createJournalMutation.mutate({
      date,
      reference,
      description: generalNotes,
      lines: lines.map(l => ({
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        description: l.description
      }))
    });
  };

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            GENERAL <span className="text-indigo-600">LEDGER</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <Badge className="bg-slate-900 text-white font-bold tracking-tight text-[10px] uppercase px-4 py-1.5 rounded-full border-none">Fiscal Compliance v4.0</Badge>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Manual Journal & Adjustments</p>
          </div>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger render={
            <Button className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95 border-none uppercase tracking-tighter text-sm">
              <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> New Journal Entry
            </Button>
          } />
          <DialogContent className="sm:max-w-[900px] bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white relative">
               <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none italic">Journal Voucher Form</DialogTitle>
               <DialogDescription className="text-indigo-100 font-medium uppercase text-[10px] tracking-tight mt-2">Double-entry accounting protocol</DialogDescription>
               <Calculator className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-indigo-500 opacity-30" />
            </div>
            
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide font-inter">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Tanggal</Label>
                  <Input 
                    type="date"
                    className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">No. Bukti / Referensi</Label>
                  <Input 
                    placeholder="Nomor memo internal..." 
                    className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 pl-1">Keterangan Umum</Label>
                  <Input 
                    placeholder="Deskripsi tujuan jurnal..." 
                    className="h-12 border-2 border-slate-50 bg-slate-50 font-bold rounded-xl"
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* DYNAMIC ROWS */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[11px] font-black uppercase tracking-tight text-slate-900">Transaction Lines</Label>
                  <div className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-full", isBalanced ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                    {isBalanced ? "Balanced" : `Diff: ${Math.abs(totalDebit - totalCredit).toLocaleString()}`}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="col-span-4">
                    <Select value={selectedAccountId} onValueChange={(v) => setSelectedAccountId(v || "")}>
                      <SelectTrigger className="h-11 border-none bg-white font-bold rounded-xl shadow-sm">
                         <SelectValue placeholder="Pilih Akun (CoA)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {coa?.map((a: any) => (
                          <SelectItem key={a.id} value={a.id} className="font-bold">{a.id} - {a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="Debit (Rp)" 
                    className="h-11 border-none bg-white font-bold col-span-2 shadow-sm"
                    value={lineDebit}
                    onChange={(e) => { setLineDebit(e.target.value); if(e.target.value) setLineCredit(""); }}
                  />
                  <Input 
                    type="number" 
                    placeholder="Kredit (Rp)" 
                    className="h-11 border-none bg-white font-bold col-span-2 shadow-sm"
                    value={lineCredit}
                    onChange={(e) => { setLineCredit(e.target.value); if(e.target.value) setLineDebit(""); }}
                  />
                  <Input 
                    placeholder="Keterangan Baris..." 
                    className="h-11 border-none bg-white font-bold col-span-3 shadow-sm"
                    value={lineNote}
                    onChange={(e) => setLineNote(e.target.value)}
                  />
                  <Button type="button" onClick={addLine} className="h-11 bg-indigo-600 text-white font-black rounded-xl col-span-1 shadow-lg shadow-indigo-100">
                    <Plus size={16} strokeWidth={3} />
                  </Button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-[9px] font-black uppercase text-slate-400">Account</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-slate-400 text-right">Debit</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-slate-400 text-right">Credit</TableHead>
                        <TableHead className="h-10 text-[9px] font-black uppercase text-slate-400">Notes</TableHead>
                        <TableHead className="h-10 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <TableRow key={idx} className="bg-white">
                          <TableCell className="font-bold text-xs">{line.accountName}</TableCell>
                          <TableCell className="font-black text-xs text-emerald-600 text-right">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</TableCell>
                          <TableCell className="font-black text-xs text-rose-600 text-right">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</TableCell>
                          <TableCell className="text-slate-500 text-[10px] uppercase font-bold italic">{line.description}</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)} className="text-slate-300 hover:text-rose-500 h-8 w-8 p-0">
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {lines.length > 0 && (
                        <TableRow className="bg-slate-900 text-white hover:bg-slate-900">
                          <TableCell className="font-black text-[10px] uppercase">Totals</TableCell>
                          <TableCell className="font-black text-xs text-right">{totalDebit.toLocaleString()}</TableCell>
                          <TableCell className="font-black text-xs text-right">{totalCredit.toLocaleString()}</TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Button 
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-tight rounded-2xl shadow-xl shadow-indigo-100 transition-all mt-4"
                disabled={!isBalanced || createJournalMutation.isPending}
                onClick={handleSubmit}
              >
                {createJournalMutation.isPending ? "Posting..." : "Post Journal Entry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<BookOpen className="text-indigo-600" />} label="Total Journals" value={journals?.length || 0} />
        <StatCard icon={<Calculator className="text-emerald-600" />} label="Monthly Profit" value={`Rp ${stats?.profit?.toLocaleString() || 0}`} />
        <StatCard icon={<HistoryIcon className="text-blue-600" />} label="Total Assets" value={`Rp ${stats?.totalAssets?.toLocaleString() || 0}`} />
        <StatCard icon={<AlertCircle className="text-rose-600" />} label="Unposted Drafts" value="0" />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
         <Table>
            <TableHeader className="bg-slate-50/70">
               <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Voucher ID</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Posting Date</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Ref / Memo</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Total Amount</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
                  <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Action</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {journals?.map((jv: any) => (
                  <TableRow key={jv.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                     <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm italic group-hover:scale-110 transition-transform">
                              JV
                           </div>
                           <div>
                              <p className="font-black text-slate-900 tracking-tight text-lg leading-tight uppercase italic">{jv.reference || jv.id}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1 italic">{jv.description || "Manual Journal"}</p>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <p className="font-bold text-slate-700">{jv.date}</p>
                     </TableCell>
                     <TableCell>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 text-sm italic uppercase">{jv.reference}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase italic">Monthly Adjustment</p>
                        </div>
                     </TableCell>
                      <TableCell className="text-right">
                        <p className="font-black text-slate-900 text-base">Rp {(jv.totalAmount || jv.lines?.reduce((sum: number, l: any) => sum + Number(l.debit), 0) || 0).toLocaleString()}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-xl px-4 py-2 font-black uppercase tracking-tight text-[10px] border", 
                          "bg-emerald-100 text-emerald-700 border-emerald-200"
                        )}>
                           POSTED
                        </Badge>
                      </TableCell>
                     <TableCell className="pr-10 text-right">
                        <Button className="h-11 px-6 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-tight text-[10px] rounded-xl shadow-xl hover:-translate-x-1 transition-all border-none italic">
                           View Details <FileText className="ml-2 h-3.5 w-3.5" />
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

