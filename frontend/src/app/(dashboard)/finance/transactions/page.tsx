"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaDialog as Dialog,
  DnaDialogContent as DialogContent,
  DnaDialogDescription as DialogDescription,
  DnaDialogTitle as DialogTitle,
  DnaDialogTrigger as DialogTrigger,
  DnaDialogHeader as DialogHeader,
  DnaDialogFooter as DialogFooter,
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaCell,
} from "@/components/dna";
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
import { QueryLoading, QueryError } from "@/components/query-states";

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
  const [lines, setLiness] = useState<TransactionLine[]>([]);

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
    <DnaPageContainer>
      <DnaPageHeader
        title="Cash Flow & Bank"
        subtitle="Real-time Cash & Bank Operations • Liquidity Hub"
        badgeText="Finance"
        actionButtons={
          <div className="flex items-center gap-2.5">
            <Dialog open={isModalOpen && mode === "RECEIPT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("RECEIPT"); }}>
              <DialogTrigger asChild>
                <DnaButton variant="primary" className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700">
                  <ArrowUpRight className="mr-1.5 h-4 w-4" /> Cash Receipt
                </DnaButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
                <TransactionForm mode="RECEIPT" coa={coa} lines={lines} setLiness={setLiness} onSuccess={() => setIsModalOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen && mode === "DISBURSEMENT"} onOpenChange={(o) => { setIsModalOpen(o); if(o) setMode("DISBURSEMENT"); }}>
              <DialogTrigger asChild>
                <DnaButton variant="primary" className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700">
                  <ArrowDownLeft className="mr-1.5 h-4 w-4" /> Disbursement
                </DnaButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
                <TransactionForm mode="DISBURSEMENT" coa={coa} lines={lines} setLiness={setLiness} onSuccess={() => setIsModalOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {statsLoading || txnLoading ? (
        <QueryLoading message="Loading transactions..." />
      ) : statsError || txnError ? (
        <QueryError error="Failed to load transaction data" onRetry={() => window.location.reload()} />
      ) : (
        <>
          <DnaKpiGrid cols={4}>
            <DnaStatCard icon={<Wallet className="text-emerald-600" />} label="Main Cash" value={stats?.balance ? `Rp ${(Number(stats.balance) / 1000000).toFixed(1)}M` : "Rp 0"} />
            <DnaStatCard icon={<CreditCard className="text-blue-600" />} label="Bank Balance" value={stats?.cashIn ? `Rp ${(Number(stats.cashIn) / 1000000).toFixed(1)}M` : "Rp 0"} />
            <DnaStatCard icon={<ArrowUpRight className="text-emerald-500" />} label="Inflow MTD" value={stats?.cashIn ? `+ Rp ${(Number(stats.cashIn) / 1000000).toFixed(0)}M` : "+ Rp 0"} />
            <DnaStatCard icon={<ArrowDownLeft className="text-rose-500" />} label="Outflow MTD" value={stats?.cashOut ? `- Rp ${(Number(stats.cashOut) / 1000000).toFixed(0)}M` : "- Rp 0"} />
          </DnaKpiGrid>

          <DnaDataTableCard
            toolbarProps={{
              searchProps: {
                value: searchTerm,
                onChange: setSearchTerm,
                placeholder: "Cari transaksi ledger...",
              },
            }}
          >
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="h-[40px] bg-slate-50/75 hover:bg-slate-50/75">
                  <DnaTh className="w-[180px] px-4 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">No. Jurnal</DnaTh>
                  <DnaTh className="w-[120px] px-4 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tanggal</DnaTh>
                  <DnaTh className="w-[130px] px-4 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tipe</DnaTh>
                  <DnaTh className="px-4 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Entitas / Deskripsi</DnaTh>
                  <DnaTh className="w-[160px] px-4 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Nominal</DnaTh>
                  <DnaTh className="w-[120px] px-4 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</DnaTh>
                  <DnaTh className="w-[70px] pr-4 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredTransactions.map((t: any) => (
                  <DnaTableRow key={t.id} className="h-[48px] hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                    <DnaTd className="px-4 py-2.5">
                      <DnaCell.Code code={t.id} />
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5">
                      <DnaCell.Text text={t.date} />
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5 text-center">
                      <DnaBadge variant={t.type === 'RECEIPT' ? 'success' : 'critical'}>
                        {t.type}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5">
                      <span className="text-[12px] font-medium text-slate-800 line-clamp-1">{t.entity}</span>
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5 text-right tabular-nums">
                      <span className={cn("text-[12px] font-semibold", t.type === 'RECEIPT' ? "text-emerald-600" : "text-rose-600")}>
                        {t.type === 'RECEIPT' ? '+' : '-'} Rp {t.amount.toLocaleString()}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-4 py-2.5 text-center">
                      <DnaBadge variant="success">
                        {t.status}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="pr-4 py-2.5 text-right">
                      <DnaButton variant="ghost" className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Search size={14} />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </DnaDataTableCard>
        </>
      )}
    </DnaPageContainer>
  );
}

function TransactionForm({ mode, coa, lines, setLiness, onSuccess }: any) {
  const isReceipt = mode === "RECEIPT";
  
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [lineAmount, setLinesAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entityName, setEntityName] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const addLine = () => {
    if (!selectedAccountId || !lineAmount) return;
    const account = coa?.find((a: any) => a.id === selectedAccountId);
    setLiness([...lines, { accountId: selectedAccountId, accountName: account.name, amount: Number(lineAmount) }]);
    setSelectedAccountId("");
    setLinesAmount("");
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
      setLiness([]);
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
        <DialogTitle className="text-xl font-bold uppercase tracking-tight leading-none text-white">
          Cash {isReceipt ? "Receipt" : "Disbursement"}
        </DialogTitle>
        <DialogDescription className="text-white/80 font-medium text-xs tracking-tight mt-1.5">
          {isReceipt ? "Record Incoming Funds" : "Authorize Outgoing Payment"}
        </DialogDescription>
        <DollarSign className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 opacity-30 text-white" />
      </div>
      <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide font-inter">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-tight text-slate-500 pl-1">Tanggal</div>
            <DnaInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-slate-200 rounded-lg text-xs" />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-tight text-slate-500 pl-1">{isReceipt ? "Terima Dari" : "Bayar Kepada"}</div>
            <DnaInput placeholder="Nama individu / instansi..." value={entityName} onChange={(e) => setEntityName(e.target.value)} className="border-slate-200 rounded-lg text-xs" />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-tight text-slate-500 pl-1">{isReceipt ? "Simpan Ke Akun" : "Ambil Dari Akun"}</div>
             <DnaSelect
               label="Simpan Ke Akun"
               value={cashAccountId}
               placeholder="Pilih CoA Kas & Bank"
               onChange={(value) => setCashAccountId(value)}
               options={coa?.filter((a: any) => a.category === "CASH").map((a: any) => ({ label: a.name, value: a.id || "" }))}
             />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-tight text-slate-500 pl-1">Keterangan</div>
            <DnaInput placeholder="Catatan transaksi..." value={notes} onChange={(e) => setNotes(e.target.value)} className="border-slate-200 rounded-lg text-xs" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-tight text-slate-700">Allocation Table</div>
          <div className="grid grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 items-center">
            <div className="col-span-7">
               <DnaSelect
                 value={selectedAccountId}
                 placeholder={isReceipt ? "Pilih Akun Pendapatan/Asal..." : "Pilih Akun Biaya/Tujuan..."}
                 onChange={(value) => setSelectedAccountId(value)}
                 options={coa?.filter((a: any) => isReceipt ? a.category === "REVENUE" : a.category === "EXPENSE").map((a: any) => ({ label: a.name, value: a.id || "" }))}
               />
            </div>
            <DnaInput 
              type="number" 
              placeholder="Nominal (Rp)" 
              className="border-slate-200 bg-white col-span-4 shadow-sm text-xs h-10"
              value={lineAmount}
              onChange={(e) => setLinesAmount(e.target.value)}
            />
            <DnaButton type="button" onClick={addLine} variant="primary" className={cn("h-10 rounded-lg col-span-1 shadow-sm p-0 flex items-center justify-center", isReceipt ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")}>
              <Plus size={14} strokeWidth={3} />
            </DnaButton>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
            <DnaTable className="table-dense">
              <DnaTableHead className="bg-slate-50">
                <DnaTableRow className="hover:bg-transparent">
                  <DnaTh className="h-9 text-[11px] font-bold uppercase text-slate-500">Target Account</DnaTh>
                  <DnaTh className="h-9 text-[11px] font-bold uppercase text-slate-500 text-right">Amount</DnaTh>
                  <DnaTh className="h-9 text-right"></DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {lines.map((line: any, idx: number) => (
                  <DnaTableRow key={idx} className="bg-white">
                    <DnaTd className="font-medium text-[12px] text-slate-800">{line.accountName}</DnaTd>
                    <DnaTd className="font-semibold text-[12px] text-right tabular-nums text-slate-800">Rp {line.amount.toLocaleString()}</DnaTd>
                    <DnaTd className="text-right">
                      <DnaButton variant="outline" className="text-slate-400 hover:text-rose-500 h-8 w-8 p-0 rounded-lg" onClick={() => setLiness(lines.filter((_: any, i: number) => i !== idx))}>
                        <Trash2 size={14} />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
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
          <p className="text-sm text-slate-600">Apakah Anda yakin ingin menyimpan data ini?</p>
          <DialogFooter>
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
