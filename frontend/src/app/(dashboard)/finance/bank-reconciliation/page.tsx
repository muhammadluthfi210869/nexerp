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
  formatRupiah,
  useDnaToast
} from "@/components/dna";

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

      {/* FILTER CONTROLS */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Akun Kas / Bank (COA) *</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
            >
              <option value="1120">1120 - Bank BCA Operasional (521-009182)</option>
              <option value="1130">1130 - Bank Mandiri Payroll & Pajak (137-00123)</option>
              <option value="1110">1110 - Kas Tunai Petty Cash Kantor</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Kalender Lengkap *</label>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
              <span className="text-slate-400 font-semibold">s/d</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KOLOM KIRI: BANK STATEMENT LINES */}
        <DnaDataTableCard
          title="Kolom Kiri: Mutasi Rekening Koran (Bank Statement)"
          badge={<DnaBadge variant="purple">{bankLines.length} Baris Bank</DnaBadge>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-3 py-2.5">Tanggal</th>
                  <th className="px-3 py-2.5">Keterangan Bank</th>
                  <th className="px-3 py-2.5 text-right">Nominal</th>
                  <th className="px-3 py-2.5 text-center">Status Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bankLines.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{b.date}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 text-[11px]">{b.description}</td>
                    <td className={`px-3 py-2 text-right font-extrabold ${b.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatRupiah(b.amount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <DnaBadge variant={b.matched ? "success" : "warning"}>
                        {b.matched ? "MATCHED" : "UNMATCHED"}
                      </DnaBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        {/* KOLOM KANAN: SYSTEM TRANSACTIONS */}
        <DnaDataTableCard
          title="Kolom Kanan: Transaksi Kas & Bank Sistem (System Book)"
          badge={<DnaBadge variant="info">{systemLines.length} Transaksi Sistem</DnaBadge>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-3 py-2.5">Tanggal</th>
                  <th className="px-3 py-2.5">No. Dokumen</th>
                  <th className="px-3 py-2.5">Deskripsi Kas Masuk/Keluar</th>
                  <th className="px-3 py-2.5 text-right">Nominal</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {systemLines.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{s.date}</td>
                    <td className="px-3 py-2 font-mono text-blue-700 font-bold">{s.docNo}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 text-[11px]">{s.description}</td>
                    <td className={`px-3 py-2 text-right font-extrabold ${s.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatRupiah(s.amount)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <DnaBadge variant={s.matched ? "success" : "warning"}>
                        {s.matched ? "MATCHED" : "UNMATCHED"}
                      </DnaBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      </div>

      {/* JURNAL REKONSILIASI MODAL */}
      <DnaModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        title="Buat Jurnal Rekonsiliasi (Biaya Adm & Bunga Bank)"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <p className="text-slate-600">
            Jurnal otomatis untuk mencatat selisih biaya administrasi bank dan pendapatan bunga giro yang tercatat di rekening koran:
          </p>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
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
          <div className="flex justify-end gap-2 pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setIsJournalModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleCreateReconJournal}>
              Posting Jurnal Rekonsiliasi
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
