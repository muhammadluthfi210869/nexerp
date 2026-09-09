"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  BookOpen,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
  Scale,
  Building2,
  ChevronDown
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
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface LedgerEntry {
  id: string;
  date: string;
  journalNo: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface AccountSummary {
  accountCode: string;
  accountName: string;
  category: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  endingBalance: number;
}

const FALLBACK_ACCOUNTS: AccountSummary[] = [
  { accountCode: "1110", accountName: "Kas Operasional Kantor", category: "Kas & Bank", openingBalance: 45000000, totalDebit: 350000000, totalCredit: 310000000, endingBalance: 85000000 },
  { accountCode: "1120", accountName: "Bank BCA Operasional (521-009182)", category: "Kas & Bank", openingBalance: 1250000000, totalDebit: 2100000000, totalCredit: 1800000000, endingBalance: 1550000000 },
  { accountCode: "1130", accountName: "Bank Mandiri Payroll & Pajak", category: "Kas & Bank", openingBalance: 420000000, totalDebit: 800000000, totalCredit: 650000000, endingBalance: 570000000 },
  { accountCode: "1210", accountName: "Piutang Usaha Pelanggan (AR)", category: "Piutang", openingBalance: 850000000, totalDebit: 1450000000, totalCredit: 1300000000, endingBalance: 1000000000 },
  { accountCode: "1310", accountName: "Persediaan Bahan Baku Pabrik", category: "Persediaan", openingBalance: 980000000, totalDebit: 620000000, totalCredit: 480000000, endingBalance: 1120000000 },
  { accountCode: "2110", accountName: "Hutang Usaha Supplier Bahan Kemas", category: "Hutang Lancar", openingBalance: 620000000, totalDebit: 450000000, totalCredit: 520000000, endingBalance: 690000000 },
  { accountCode: "4110", accountName: "Pendapatan Produksi OEM/ODM", category: "Pendapatan", openingBalance: 0, totalDebit: 0, totalCredit: 1450000000, endingBalance: 1450000000 },
];

const FALLBACK_MUTATIONS: LedgerEntry[] = [
  { id: "1", date: "2026-09-01", journalNo: "JV-2609-001", reference: "PO-BCA-001", description: "Penerimaan Termin 50% Produksi PT Kosmetik Glow", debit: 450000000, credit: 0, balance: 1700000000 },
  { id: "2", date: "2026-09-03", journalNo: "JV-2609-004", reference: "PO-RAW-991", description: "Pembayaran Bahan Baku Ekstrak Centella Asiatica", debit: 0, credit: 120000000, balance: 1580000000 },
  { id: "3", date: "2026-09-05", journalNo: "JV-2609-011", reference: "EXP-UTIL-01", description: "Pembayaran Utilitas Listrik Industri & Boiler", debit: 0, credit: 45000000, balance: 1535000000 },
  { id: "4", date: "2026-09-07", journalNo: "JV-2609-015", reference: "PO-BCA-002", description: "Penerimaan Pelunasan Batch Serum Niacinamide", debit: 380000000, credit: 0, balance: 1915000000 },
  { id: "5", date: "2026-09-08", journalNo: "JV-2609-020", reference: "PACK-PO-04", description: "Pembayaran Botol Airless Pump 30ml", debit: 0, credit: 65000000, balance: 1850000000 },
];

export default function GeneralLedgerPage() {
  const toast = useDnaToast();
  const [selectedAccount, setSelectedAccount] = useState<string>("1120");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });

  const activeAccount = useMemo(() => {
    return FALLBACK_ACCOUNTS.find((a) => a.accountCode === selectedAccount) || FALLBACK_ACCOUNTS[1];
  }, [selectedAccount]);

  const handleExportExcel = () => {
    toast.success(`Exporting Buku Besar Akun ${activeAccount.accountCode} - ${activeAccount.accountName} ke Excel...`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Buku Besar Umum (General Ledger)"
        description="Audit terperinci mutasi debit, kredit, dan saldo berjalan untuk seluruh bagan akun (Chart of Accounts)."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-medium">
            <Scale className="w-3.5 h-3.5" />
            <span>Akun Aktif: {activeAccount.accountCode} - {activeAccount.accountName}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak GL
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Saldo Awal Periode"
          value={formatRupiah(activeAccount.openingBalance)}
          icon={<BookOpen className="w-5 h-5 text-slate-600" />}
          subtext="Per 01 September 2026"
          variant="default"
        />
        <DnaStatCard
          label="Total Mutasi Debit"
          value={formatRupiah(activeAccount.totalDebit)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+Debit Periode", isPositive: true }}
          subtext="Akumulasi Debit Berjalan"
          variant="success"
        />
        <DnaStatCard
          label="Total Mutasi Kredit"
          value={formatRupiah(activeAccount.totalCredit)}
          icon={<Scale className="w-5 h-5 text-amber-600" />}
          delta={{ value: "-Kredit Periode", isPositive: false }}
          subtext="Akumulasi Kredit Berjalan"
          variant="warning"
        />
        <DnaStatCard
          label="Saldo Akhir Buku Besar"
          value={formatRupiah(activeAccount.endingBalance)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Balance Terverifikasi", isPositive: true }}
          subtext="Ending Net Balance"
          variant="info"
        />
      </DnaKpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ACCOUNT SELECTOR SIDEBAR */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>Pilih Akun COA</span>
            <DnaBadge variant="default">{FALLBACK_ACCOUNTS.length} Akun</DnaBadge>
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode/nama akun..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {FALLBACK_ACCOUNTS.map((acc) => (
              <button
                key={acc.accountCode}
                onClick={() => setSelectedAccount(acc.accountCode)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                  selectedAccount === acc.accountCode
                    ? "bg-blue-50 border-blue-200 text-blue-900 font-semibold shadow-xs"
                    : "border-slate-100 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-[11px] text-blue-700 font-bold">{acc.accountCode}</span>
                  <span className="text-[10px] text-slate-500">{acc.category}</span>
                </div>
                <div className="truncate font-medium">{acc.accountName}</div>
                <div className="text-right text-[11px] font-extrabold text-slate-900 mt-1">
                  {formatRupiah(acc.endingBalance)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* LEDGER DETAILS TABLE */}
        <div className="lg:col-span-3 space-y-4">
          <DnaDataTableCard
            title={`Rincian Mutasi Akun: ${activeAccount.accountCode} - ${activeAccount.accountName}`}
            badge={<DnaBadge variant="purple">Periode: {dateRange.start} s/d {dateRange.end}</DnaBadge>}
            customToolbar={
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <span className="text-xs text-slate-500">s/d</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-3.5 py-3">Tanggal</th>
                    <th className="px-3.5 py-3">No. Jurnal</th>
                    <th className="px-3.5 py-3">Referensi</th>
                    <th className="px-3.5 py-3">Keterangan / Memo</th>
                    <th className="px-3.5 py-3 text-right">Debit</th>
                    <th className="px-3.5 py-3 text-right">Kredit</th>
                    <th className="px-3.5 py-3 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/60 font-semibold">
                    <td className="px-3.5 py-2.5 text-slate-500">{dateRange.start}</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-400">-</td>
                    <td className="px-3.5 py-2.5 text-slate-400">-</td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-800">SALDO AWAL (OPENING BALANCE)</td>
                    <td className="px-3.5 py-2.5 text-right font-medium text-slate-500">-</td>
                    <td className="px-3.5 py-2.5 text-right font-medium text-slate-500">-</td>
                    <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">{formatRupiah(activeAccount.openingBalance)}</td>
                  </tr>
                  {FALLBACK_MUTATIONS.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3.5 py-2.5 text-slate-600">{entry.date}</td>
                      <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{entry.journalNo}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">{entry.reference}</td>
                      <td className="px-3.5 py-2.5 text-slate-800 font-medium">{entry.description}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">
                        {entry.debit > 0 ? formatRupiah(entry.debit) : "-"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">
                        {entry.credit > 0 ? formatRupiah(entry.credit) : "-"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                        {formatRupiah(entry.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/75 font-black border-t-2 border-blue-300">
                    <td colSpan={4} className="px-3.5 py-3 text-blue-950 font-black text-right">TOTAL MUTASI & SALDO AKHIR:</td>
                    <td className="px-3.5 py-3 text-right text-emerald-900 font-extrabold">{formatRupiah(activeAccount.totalDebit)}</td>
                    <td className="px-3.5 py-3 text-right text-rose-900 font-extrabold">{formatRupiah(activeAccount.totalCredit)}</td>
                    <td className="px-3.5 py-3 text-right text-blue-950 font-black text-sm">{formatRupiah(activeAccount.endingBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DnaDataTableCard>
        </div>
      </div>
    </DnaPageContainer>
  );
}
