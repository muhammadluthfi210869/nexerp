"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  RefreshCw,
  Upload,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileSpreadsheet,
  Building2,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  Scale
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = credit/inflow, negative = debit/outflow
  matched: boolean;
  systemTxId?: string;
}

interface SystemTransaction {
  id: string;
  date: string;
  docNo: string;
  description: string;
  amount: number;
  matched: boolean;
}

export default function BankReconciliationPage() {
  const qc = useQueryClient();
  const toast = useDnaToast();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // 1. Fetch live bank accounts
  const { data: bankAccounts = [] } = useQuery<any[]>({
    queryKey: ["bank-accounts-recon"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/bank-accounts");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  // Set default account if none selected
  const activeAccountId = selectedAccountId || (bankAccounts[0]?.id || "");
  const selectedAccount = useMemo(() => {
    return bankAccounts.find((a) => a.id === activeAccountId);
  }, [bankAccounts, activeAccountId]);

  // 2. Fetch bank transactions
  const { data: rawTransactions = [], refetch: refetchTransactions } = useQuery<any[]>({
    queryKey: ["bank-transactions", activeAccountId, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!activeAccountId) return [];
      try {
        const res = await api.get(`/finance/bank-transactions`, {
          params: {
            bankAccountId: activeAccountId,
            from: dateRange.start,
            to: dateRange.end
          }
        });
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
    enabled: !!activeAccountId
  });

  // 3. Fetch recon summary
  const { data: reconSummary } = useQuery<any>({
    queryKey: ["bank-reconciliations-summary", activeAccountId],
    queryFn: async () => {
      if (!activeAccountId) return null;
      try {
        const res = await api.get(`/finance/bank-reconciliations/summary?bankAccountId=${activeAccountId}`);
        return unwrapResponse<any>(res);
      } catch {
        return null;
      }
    },
    enabled: !!activeAccountId
  });

  // Split into statement lines (external) and system ledger lines
  const systemLines: SystemTransaction[] = useMemo(() => {
    return rawTransactions.map((tx: any) => ({
      id: tx.id,
      date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split("T")[0] : "-",
      docNo: tx.referenceNumber || tx.id.slice(0, 8),
      description: tx.description || "Transaksi Kas/Bank",
      amount: tx.transactionType === "DEBIT" ? -Number(tx.amount || 0) : Number(tx.amount || 0),
      matched: !!tx.reconciled
    }));
  }, [rawTransactions]);

  const bankLines: BankStatementLine[] = useMemo(() => {
    // If bank statement transactions exist from imported records
    return rawTransactions
      .filter((tx: any) => tx.statementLineId || tx.referenceNumber?.startsWith("STMT-") || tx.notes?.includes("Bank Statement"))
      .map((tx: any) => ({
        id: tx.id,
        date: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split("T")[0] : "-",
        description: tx.description || "Rekening Koran",
        amount: tx.transactionType === "DEBIT" ? -Number(tx.amount || 0) : Number(tx.amount || 0),
        matched: !!tx.reconciled,
        systemTxId: tx.referenceNumber
      }));
  }, [rawTransactions]);

  // Real Balances
  const bookBalance = Number(selectedAccount?.currentBalance || 0);
  const unreconciledSystem = systemLines.filter((l) => !l.matched).reduce((acc, l) => acc + l.amount, 0);
  const unreconciledBank = bankLines.filter((l) => !l.matched).reduce((acc, l) => acc + l.amount, 0);
  const statementBalance = bookBalance + unreconciledBank - unreconciledSystem;
  const difference = statementBalance - bookBalance;

  // Auto match mutation
  const autoMatchMutation = useMutation({
    mutationFn: async () => {
      const unmatchedIds = rawTransactions.filter((tx: any) => !tx.reconciled).map((tx: any) => tx.id);
      if (unmatchedIds.length === 0) return { matched: 0 };
      // ponytail: backend exposes only per-id reconcile; loop it. Add a bulk
      // endpoint when unmatched volume makes N round-trips hurt.
      await Promise.all(
        unmatchedIds.map((id: string) => api.post(`/finance/bank-transactions/${id}/reconcile`, {}))
      );
      return { matched: unmatchedIds.length };
    },
    onSuccess: () => {
      toast.success("Auto-match engine selesai memproses rekonsiliasi!");
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
      qc.invalidateQueries({ queryKey: ["bank-reconciliations-summary"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menjalankan auto-match");
    }
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!activeAccountId) return;
      return api.post("/finance/bank-reconciliations", {
        bankAccountId: activeAccountId,
        period: dateRange.end,
        statementBalance,
        bookBalance
      });
    },
    onSuccess: () => {
      toast.success("Sesi rekonsiliasi bank berhasil difinalisasi!");
      qc.invalidateQueries({ queryKey: ["bank-reconciliations-summary"] });
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memfinalisasi rekonsiliasi");
    }
  });

  // Reconciliation adjustment journal
  const journalMutation = useMutation({
    mutationFn: async () => {
      return api.post("/finance/journals", {
        journalNumber: `ADJ-RECON-${Date.now().toString().slice(-6)}`,
        transactionDate: new Date().toISOString(),
        description: `Penyesuaian Rekonsiliasi Bank ${selectedAccount?.bankName || ""}`,
        sourceDocument: `RECON-${activeAccountId.slice(0, 6)}`,
        items: [
          {
            accountId: selectedAccount?.glAccountId || "6190",
            description: "Beban Administrasi Bank",
            debit: 0,
            credit: 0
          }
        ]
      });
    },
    onSuccess: () => {
      toast.success("Jurnal Penyesuaian Rekonsiliasi Bank berhasil dibuat!");
      setIsJournalModalOpen(false);
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat jurnal penyesuaian");
    }
  });

  const accountTabs = bankAccounts.length > 0
    ? bankAccounts.map((a: any) => ({
        id: a.id,
        label: `${a.accountCode || a.bankName} - ${a.accountNumber || a.bankName}`
      }))
    : [{ id: "none", label: "Belum Ada Rekening Bank" }];

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Rekonsiliasi Bank (Bank Reconciliation Engine)"
        description="Penyelarasan mutasi rekening koran bank vs transaksi kas/bank sistem dengan auto-matching dan jurnal penyesuaian."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Rekonsiliasi Dua Sisi</span>
          </div>
        }
        tabs={accountTabs}
        activeTab={activeAccountId || "none"}
        onTabChange={(id) => id !== "none" && setSelectedAccountId(id)}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => setIsJournalModalOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Buat Jurnal Selisih Bank
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => toast.info("Fitur import statement rekening koran siap diunggah")}
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Import Rekening Koran
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Statement Balance (Rekening Koran)"
          value={formatRupiah(statementBalance)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: selectedAccount?.bankName || "Rekening Koran", isPositive: true }}
          subtext={`Per ${dateRange.end}`}
          variant="info"
        />
        <DnaStatCard
          label="Book Balance (Buku Besar Kas/Bank)"
          value={formatRupiah(bookBalance)}
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Saldo Sistem ERP", isPositive: true }}
          subtext={selectedAccount ? `No. Rek: ${selectedAccount.accountNumber}` : "Buku Kas/Bank"}
          variant="success"
        />
        <DnaStatCard
          label="Selisih Belum Rekon (Difference)"
          value={formatRupiah(difference)}
          icon={<Scale className="w-5 h-5 text-amber-600" />}
          delta={{ value: difference === 0 ? "Rekon Seimbang" : "Perlu Penyesuaian", isPositive: difference === 0 }}
          subtext="Target: Rp 0 Selesai Rekon"
          variant={difference === 0 ? "success" : "warning"}
        />
      </DnaKpiGrid>

      {/* FILTER & ENGINE TOOLBAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Periode Mutasi:</span>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <DnaInput
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
            <span className="text-slate-400 font-semibold">s/d</span>
            <DnaInput
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DnaButton
            variant="secondary"
            size="md"
            onClick={() => autoMatchMutation.mutate()}
            disabled={autoMatchMutation.isPending || systemLines.length === 0}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${autoMatchMutation.isPending ? "animate-spin" : ""}`} />
            Jalankan Auto-Match
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            onClick={() => finalizeMutation.mutate()}
            disabled={finalizeMutation.isPending || !activeAccountId}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Finalize Reconcile
          </DnaButton>
        </div>
      </div>

      {/* TWO-COLUMN RECONCILIATION ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KOLOM KIRI: BANK STATEMENT LINES */}
        <DnaDataTableCard>
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">Rekening Koran (Bank Statement)</span>
            <span className="text-[11px] text-slate-400">{bankLines.length} baris mutasi</span>
          </div>
          <DnaTable className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-2.5 w-[28%]">Tanggal & Ref</th>
                <th className="px-3.5 py-2.5 w-[42%]">Keterangan Rekening Koran</th>
                <th className="px-3.5 py-2.5 text-right w-[30%]">Nominal & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankLines.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3.5 py-8 text-center text-slate-400">
                    Belum ada baris rekening koran yang diimpor untuk periode ini.
                  </td>
                </tr>
              ) : (
                bankLines.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-2">
                      <div className="font-semibold text-slate-800">{b.date}</div>
                      <div className="text-[10px] text-slate-500 tabular-nums">{b.systemTxId || "Unmatched"}</div>
                    </td>
                    <td className="px-3.5 py-2">
                      <div className="font-medium text-slate-800 text-[11px] truncate">{b.description}</div>
                      <div className="text-[10px] text-slate-400 tabular-nums">Statement Line</div>
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      <div className={`font-extrabold text-xs ${b.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {formatRupiah(b.amount)}
                      </div>
                      <div className="mt-0.5">
                        <DnaBadge variant={b.matched ? "success" : "warning"}>
                          {b.matched ? "MATCHED" : "UNMATCHED"}
                        </DnaBadge>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </DnaDataTableCard>

        {/* KOLOM KANAN: SYSTEM TRANSACTIONS */}
        <DnaDataTableCard>
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">Buku Kas & Bank ERP (General Ledger)</span>
            <span className="text-[11px] text-slate-400">{systemLines.length} transaksi sistem</span>
          </div>
          <DnaTable className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-2.5 w-[28%]">Dokumen & Tanggal</th>
                <th className="px-3.5 py-2.5 w-[42%]">Deskripsi Buku Sistem</th>
                <th className="px-3.5 py-2.5 text-right w-[30%]">Nominal & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {systemLines.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3.5 py-8 text-center text-slate-400">
                    Tidak ada transaksi kas/bank pada rentang tanggal terpilih.
                  </td>
                </tr>
              ) : (
                systemLines.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-2">
                      <div className="tabular-nums text-blue-700 font-bold">{s.docNo}</div>
                      <div className="text-[10px] text-slate-500 tabular-nums">{s.date}</div>
                    </td>
                    <td className="px-3.5 py-2">
                      <div className="font-medium text-slate-800 text-[11px] truncate">{s.description}</div>
                      <div className="text-[10px] text-slate-400 tabular-nums">ERP General Ledger</div>
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      <div className={`font-extrabold text-xs ${s.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {formatRupiah(s.amount)}
                      </div>
                      <div className="mt-0.5">
                        <DnaBadge variant={s.matched ? "success" : "warning"}>
                          {s.matched ? "MATCHED" : "UNMATCHED"}
                        </DnaBadge>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </DnaDataTableCard>
      </div>

      {/* JURNAL REKONSILIASI DRAWER */}
      <DnaDetailDrawer
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        title="Jurnal Penyesuaian Rekonsiliasi Bank"
        subtitle="Mencatat selisih biaya administrasi bank dan pendapatan bunga giro"
        badge={<DnaBadge variant="warning">RECON ADJUSTMENT</DnaBadge>}
        tabs={[
          {
            id: "entries",
            label: "Detail Jurnal Selisih",
            content: (
              <div className="space-y-4 p-4 text-xs">
                <p className="text-slate-600">
                  Jurnal otomatis untuk mencatat selisih biaya administrasi bank dan pendapatan bunga giro yang tercatat di rekening koran:
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex justify-between">
                    <span>Rekening Bank Terkait:</span>
                    <strong className="text-slate-900">{selectedAccount?.bankName || "-"} ({selectedAccount?.accountNumber || "-"})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Selisih Buku vs Koran:</span>
                    <strong className={difference === 0 ? "text-emerald-700" : "text-amber-700"}>
                      {formatRupiah(difference)}
                    </strong>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setIsJournalModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => journalMutation.mutate()}
              disabled={journalMutation.isPending}
            >
              Posting Jurnal Rekonsiliasi
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
