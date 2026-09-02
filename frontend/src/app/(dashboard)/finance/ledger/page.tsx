"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  Search, 
  BookOpen,
  Calculator,
  History as HistoryIcon,
  AlertCircle,
  FileText,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DataCard, DnaInput, DnaButton, TableWrapper, DnaBadge } from "@/components/dna";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

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
  const [searchTerm, setSearchTerm] = useState("");
  
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
  const [showConfirm, setShowConfirm] = useState(false);

  // Queries
  const { data: coa } = useQuery({
    queryKey: ["coa"],
    queryFn: async () => {
      const resp = await api.get("/finance/accounts");
      const data = resp.data;
      return Array.isArray(data) ? data : (data?.accounts || data?.data || []);
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
       return resp.data.metrics;
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
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
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

  const filteredJournals = journals?.filter(jv => 
    (jv.reference || jv.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (jv.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardShell
      title="GENERAL"
      titleAccent="LEDGER"
      subtitle="(Manual Journal & Adjustments • Fiscal Compliance v4.0)"
      actions={
        <DnaButton onClick={() => setIsAddModalOpen(true)} variant="primary" className="h-11 px-6 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-tighter text-xs">
          <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> New Journal Entry
        </DnaButton>
      }
    >
      <div className="grid grid-cols-12 gap-8 items-start animate-fade-slide-in">
        {/* Left Column: Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <DataCard title="LEDGER ACTIONS" dotColor="bg-blue-600">
            <div className="space-y-4">
              <DnaButton
                onClick={() => setIsAddModalOpen(true)}
                variant="primary"
                className="w-full h-11 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-tighter text-xs"
              >
                <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> New Journal Entry
              </DnaButton>
              
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">Cari Voucher</Label>
                <DnaInput 
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Keterangan / Ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs h-10 border border-slate-200"
                />
              </div>
            </div>
          </DataCard>

          <DataCard title="COMPLIANCE AUDIT" dotColor="bg-emerald-500">
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-500 uppercase">Unposted Drafts</span>
                <DnaBadge status="info">0</DnaBadge>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-500 uppercase">System Integrity</span>
                <DnaBadge status="success">100% OK</DnaBadge>
              </div>
            </div>
          </DataCard>
        </div>

        {/* Right Column: Main Content */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<BookOpen className="text-blue-600" />} label="Total Journals" value={journals?.length || 0} />
            <StatCard icon={<Calculator className="text-emerald-600" />} label="Monthly Profit" value={`Rp ${stats?.profit?.toLocaleString() || 0}`} />
            <StatCard icon={<HistoryIcon className="text-blue-600" />} label="Total Assets" value={`Rp ${stats?.totalAssets?.toLocaleString() || 0}`} />
          </div>

          {/* DATA TABLE */}
          <TableWrapper
            filters={
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-xs">
                  General Ledger Registry
                </h3>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                  Fiscal Ledger Vouchers • {filteredJournals.length} Records
                </p>
              </div>
            }
          >
            <Table className="table-dense">
               <TableHeader className="bg-slate-50/70">
                  <TableRow className="hover:bg-transparent border-slate-100">
                     <TableHead className="py-4 pl-6 font-black text-slate-400 uppercase tracking-tight text-[9px]">Voucher / Description</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Posting Date</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Total Amount</TableHead>
                     <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
                     <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Action</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filteredJournals.map((jv: any) => (
                     <TableRow key={jv.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                        <TableCell className="py-3 pl-6">
                           <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center font-black text-[10px] italic">
                                 JV
                              </div>
                              <div>
                                 <p className="font-black text-slate-900 tracking-tight text-xs leading-tight uppercase italic">{jv.reference || jv.id}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5 italic">{jv.description || "Manual Journal"}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="py-3">
                           <p className="font-medium text-slate-700 text-xs">{jv.date}</p>
                        </TableCell>
                        <TableCell className="py-3 text-right font-mono tabular-nums text-xs font-black">
                           Rp {(jv.totalAmount || jv.lines?.reduce((sum: number, l: any) => sum + Number(l.debit), 0) || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                           <DnaBadge status="success">
                              POSTED
                           </DnaBadge>
                        </TableCell>
                        <TableCell className="py-3 pr-6 text-right">
                           <DnaButton variant="primary" size="sm" className="italic text-[9px] h-8">
                              Details <FileText className="ml-1.5 h-3.5 w-3.5" />
                           </DnaButton>
                        </TableCell>
                     </TableRow>
                  ))}
                  {filteredJournals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-slate-400 italic text-xs">
                        Tidak ada catatan jurnal voucher ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
               </TableBody>
            </Table>
          </TableWrapper>
        </div>
      </div>

      {/* Dialog container placed globally */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white relative">
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">Journal Voucher Form</DialogTitle>
             <DialogDescription className="text-blue-100 font-medium uppercase text-[9px] tracking-tight mt-2">Double-entry accounting protocol</DialogDescription>
             <Calculator className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 text-white opacity-35" />
          </div>
          
          <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide font-inter">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">Tanggal</Label>
                <DnaInput 
                  type="date"
                  className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">No. Bukti / Referensi</Label>
                <DnaInput 
                  placeholder="Nomor memo internal..." 
                  className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">Keterangan Jurnal</Label>
                <DnaInput 
                  placeholder="Deskripsi tujuan jurnal..." 
                  className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </div>
            </div>

            {/* DYNAMIC ROWS */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-tight text-slate-900">Transaction Lines</Label>
                <DnaBadge status={isBalanced ? "success" : "critical"}>
                  {isBalanced ? "Balanced" : `Diff: ${Math.abs(totalDebit - totalCredit).toLocaleString()}`}
                </DnaBadge>
              </div>

              <div className="grid grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-center">
                <div className="col-span-4">
                  <Select value={selectedAccountId} onValueChange={(v) => setSelectedAccountId(v || "")}>
                    <SelectTrigger className="h-10 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                       <SelectValue placeholder="Pilih Akun (CoA)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {coa?.map((a: any) => (
                        <SelectItem key={a.id} value={a.id || ""} className="font-medium text-xs">{a.id} - {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DnaInput 
                  type="number" 
                  placeholder="Debit (Rp)" 
                  className="border-none bg-white col-span-2 shadow-sm text-xs h-10"
                  value={lineDebit}
                  onChange={(e) => { setLineDebit(e.target.value); if(e.target.value) setLineCredit(""); }}
                />
                <DnaInput 
                  type="number" 
                  placeholder="Kredit (Rp)" 
                  className="border-none bg-white col-span-2 shadow-sm text-xs h-10"
                  value={lineCredit}
                  onChange={(e) => { setLineCredit(e.target.value); if(e.target.value) setLineDebit(""); }}
                />
                <DnaInput 
                  placeholder="Notes..." 
                  className="border-none bg-white col-span-3 shadow-sm text-xs h-10"
                  value={lineNote}
                  onChange={(e) => setLineNote(e.target.value)}
                />
                <DnaButton type="button" onClick={addLine} variant="primary" className="h-10 rounded-lg col-span-1 shadow-sm p-0 flex items-center justify-center">
                  <Plus size={14} strokeWidth={3} />
                </DnaButton>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <Table className="table-dense">
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 text-[9px] font-black uppercase text-slate-400">Account</TableHead>
                      <TableHead className="h-9 text-[9px] font-black uppercase text-slate-400 text-right">Debit</TableHead>
                      <TableHead className="h-9 text-[9px] font-black uppercase text-slate-400 text-right">Credit</TableHead>
                      <TableHead className="h-9 text-[9px] font-black uppercase text-slate-400">Notes</TableHead>
                      <TableHead className="h-9 text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, idx) => (
                      <TableRow key={idx} className="bg-white">
                        <TableCell className="font-medium text-xs">{line.accountName}</TableCell>
                        <TableCell className="font-black text-xs text-emerald-600 text-right font-mono tabular-nums">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-black text-xs text-rose-600 text-right font-mono tabular-nums">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-slate-500 text-[10px] uppercase font-medium italic">{line.description}</TableCell>
                        <TableCell className="text-right">
                          <DnaButton type="button" variant="outline" className="text-slate-300 hover:text-rose-500 h-8 w-8 p-0 rounded-lg" onClick={() => removeLine(idx)}>
                            <Trash2 size={14} />
                          </DnaButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lines.length > 0 && (
                      <TableRow className="bg-blue-600 text-white hover:bg-blue-600">
                         <TableCell className="font-black text-[9px] uppercase">Totals</TableCell>
                         <TableCell className="font-black text-xs text-right font-mono tabular-nums">{totalDebit.toLocaleString()}</TableCell>
                         <TableCell className="font-black text-xs text-right font-mono tabular-nums">{totalCredit.toLocaleString()}</TableCell>
                         <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DnaButton 
              variant="primary"
              className="w-full h-12 rounded-xl shadow-sm mt-4 text-xs"
              disabled={!isBalanced || createJournalMutation.isPending}
              onClick={handleSubmit}
            >
              {createJournalMutation.isPending ? "Posting..." : "Post Journal Entry"}
            </DnaButton>
          </div>
        </DialogContent>
      </Dialog>
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
