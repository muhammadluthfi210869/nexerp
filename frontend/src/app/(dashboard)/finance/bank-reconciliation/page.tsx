"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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

const FALLBACK_BANK_LINES: BankStatementLine[] = [
  { id: "b1", date: "2026-09-08", description: "TRSF E-BANKING CR PT GLOWING BEAUTY", amount: 450000000, matched: true, systemTxId: "KM-2609-001" },
  { id: "b2", date: "2026-09-08", description: "TRSF KELUAR DB PT KIMIA NUSANTARA", amount: -120000000, matched: true, systemTxId: "KK-2609-001" },
  { id: "b3", date: "2026-09-07", description: "BIAYA ADM REK KORAN BULANAN", amount: -250000, matched: false },
  { id: "b4", date: "2026-09-07", description: "BUNGA JASA GIRO DEPOSIT", amount: 4250000, matched: false },
];

const FALLBACK_SYSTEM_LINES: SystemTransaction[] = [
  { id: "s1", date: "2026-09-08", docNo: "KM-2609-001", description: "Penerimaan Termin 50% Produksi PO-8821", amount: 450000000, matched: true },
  { id: "s2", date: "2026-09-08", docNo: "KK-2609-001", description: "Pembayaran Bahan Baku Ekstrak Centella", amount: -120000000, matched: true },
  { id: "s3", date: "2026-09-06", docNo: "KM-2609-004", description: "Penjualan Batch Sample R&D", amount: 15000000, matched: false },
];

export default function BankReconciliationPage() {
  const toast = useDnaToast();
  const [selectedAccount, setSelectedAccount] = useState("1120");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [bankLines, setBankLines] = useState<BankStatementLine[]>(FALLBACK_BANK_LINES);
  const [systemLines, setSystemLines] = useState<SystemTransaction[]>(FALLBACK_SYSTEM_LINES);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Balances
  const statementBalance = 1554000000;
  const bookBalance = 1550000000;
  const difference = statementBalance - bookBalance; // 4.000.000 (bunga - adm)

  const handleAutoMatch = () => {
    toast.success("Auto-match engine mencocokkan transaksi dengan toleransi tanggal ±2 hari...");
  };

  const handleCreateReconJournal = () => {
    toast.success("Jurnal Penyesuaian Bunga & Biaya Bank berhasil dibuat (Dr Beban Adm, Cr Pendapatan Bunga, Net Kas)!");
    setIsJournalModalOpen(false);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Rekonsiliasi Bank (Bank Reconciliation Engine)"
        description="Penyelarasan mutasi rekening koran bank (Statement Lines) vs transaksi kas/bank sistem (Book Balance) dengan auto-matching dan jurnal penyesuaian."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Poin 20 & 21: Two-Column Engine & Filter COA Custom</span>
          </div>
        }
        tabs={[
          { id: "1120", label: "1120 - Bank BCA" },
          { id: "1130", label: "1130 - Mandiri Payroll" },
          { id: "1110", label: "1110 - Petty Cash" }
        ]}
        activeTab={selectedAccount}
        onTabChange={setSelectedAccount}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => setIsJournalModalOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Buat Jurnal Selisih Bank
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Upload Rekening Koran CSV/Excel berhasil!")}>
              <Upload className="w-4 h-4 mr-1.5" />
              Import Rekening Koran
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS (SCR-076) */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Statement Balance (Rekening Koran)"
          value={formatRupiah(statementBalance)}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Saldo Bank BCA", isPositive: true }}
          subtext="Per 08 September 2026"
          variant="info"
        />
        <DnaStatCard
          label="Book Balance (Buku Besar Kas/Bank)"
          value={formatRupiah(bookBalance)}
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Saldo Sistem ERP", isPositive: true }}
          subtext="Akun COA 1120 Bank BCA"
          variant="success"
        />
        <DnaStatCard
          label="Selisih Belum Rekon (Difference)"
          value={formatRupiah(difference)}
          icon={<Scale className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Perlu Jurnal Rekonsiliasi", isPositive: false }}
          subtext="Target: Rp 0 Selesai Rekon"
          variant="warning"
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
          <DnaButton variant="secondary" size="md" onClick={handleAutoMatch}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Jalankan Auto-Match
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={() => toast.success("Rekonsiliasi Bank difinalisasi & dikunci!")}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Finalize Reconcile
          </DnaButton>
        </div>
      </div>

      {/* TWO-COLUMN RECONCILIATION ENGINE (SCR-076) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KOLOM KIRI: BANK STATEMENT LINES */}
        <DnaDataTableCard>
          <DnaTable className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-2.5 w-[28%]">Tanggal & Ref</th>
                <th className="px-3.5 py-2.5 w-[42%]">Keterangan Rekening Koran</th>
                <th className="px-3.5 py-2.5 text-right w-[30%]">Nominal & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankLines.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2">
                    <div className="font-semibold text-slate-800">{b.date}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{b.systemTxId || "Unmatched Bank"}</div>
                  </td>
                  <td className="px-3.5 py-2">
                    <div className="font-medium text-slate-800 text-[11px] truncate">{b.description}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Statement Line</div>
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
              ))}
            </tbody>
          </DnaTable>
        </DnaDataTableCard>

        {/* KOLOM KANAN: SYSTEM TRANSACTIONS */}
        <DnaDataTableCard>
          <DnaTable className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-2.5 w-[28%]">Dokumen & Tanggal</th>
                <th className="px-3.5 py-2.5 w-[42%]">Deskripsi Buku Sistem</th>
                <th className="px-3.5 py-2.5 text-right w-[30%]">Nominal & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {systemLines.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2">
                    <div className="font-mono text-blue-700 font-bold">{s.docNo}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.date}</div>
                  </td>
                  <td className="px-3.5 py-2">
                    <div className="font-medium text-slate-800 text-[11px] truncate">{s.description}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ERP General Ledger</div>
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
              ))}
            </tbody>
          </DnaTable>
        </DnaDataTableCard>
      </div>

      {/* JURNAL REKONSILIASI DRAWER (QUICK PEEK) */}
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
                    <span>Beban Administrasi Bank (6190):</span>
                    <strong className="text-rose-700">Rp 250.000 (Dr)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendapatan Jasa Bunga Giro (4190):</span>
                    <strong className="text-emerald-700">Rp 4.250.000 (Cr)</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                    <span>Net Mutasi Kas/Bank Masuk:</span>
                    <strong className="text-blue-700">+Rp 4.000.000 (Dr Kas/Bank)</strong>
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
            <DnaButton variant="primary" size="md" onClick={handleCreateReconJournal}>
              Posting Jurnal Rekonsiliasi
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
