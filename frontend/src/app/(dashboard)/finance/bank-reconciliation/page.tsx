"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  formatRupiah,
} from "@/components/dna";
import { RefreshCw, CheckCircle2, AlertCircle, FileCheck, ArrowRightLeft, Calendar } from "lucide-react";

interface StatementLine {
  id: string;
  date: string;
  description: string;
  refNo: string;
  debit: number;
  credit: number;
  isMatched: boolean;
  matchedEntryId?: string;
}

interface LedgerLine {
  id: string;
  date: string;
  description: string;
  refNo: string;
  debit: number;
  credit: number;
  isMatched: boolean;
}

const SAMPLE_STATEMENT: StatementLine[] = [
  { id: "stmt-1", date: "2026-09-01", description: "TRSF E-BANKING CR DARI PT GLOW INDAH", refNo: "SO-202609-001", debit: 0, credit: 150000000, isMatched: true, matchedEntryId: "led-1" },
  { id: "stmt-2", date: "2026-09-02", description: "BIAYA ADM BANK BULANAN", refNo: "ADM-BCA-09", debit: 25000, credit: 0, isMatched: false },
  { id: "stmt-3", date: "2026-09-03", description: "KLIRING DEBET PEMBAYARAN PT KIMIA FARMA", refNo: "PO-202609-042", debit: 85000000, credit: 0, isMatched: true, matchedEntryId: "led-2" },
  { id: "stmt-4", date: "2026-09-05", description: "BUNGA GIRO BULAN AGUSTUS", refNo: "INT-BCA-08", debit: 0, credit: 3450000, isMatched: false },
];

const SAMPLE_LEDGER: LedgerLine[] = [
  { id: "led-1", date: "2026-09-01", description: "Penerimaan DP Penjualan (PT Glow Indah)", refNo: "SO-202609-001", debit: 150000000, credit: 0, isMatched: true },
  { id: "led-2", date: "2026-09-03", description: "Pelunasan Faktur Pembelian Bahan Baku", refNo: "PO-202609-042", debit: 0, credit: 85000000, isMatched: true },
  { id: "led-3", date: "2026-09-06", description: "Biaya Transport Pengiriman Ekspedisi", refNo: "DO-202609-011", debit: 0, credit: 1200000, isMatched: false },
];

export default function BankReconciliationPage() {
  const [statements, setStatements] = useState<StatementLine[]>(SAMPLE_STATEMENT);
  const [ledger, setLedger] = useState<LedgerLine[]>(SAMPLE_LEDGER);
  const [selectedBank, setSelectedBank] = useState("bca");
  const [selectedMonth, setSelectedMonth] = useState("2026-09");

  const bookBalance = 1250000000;
  const stmtBalance = 1253425000; // Selisih bunga - adm
  const difference = stmtBalance - bookBalance;

  const handleAutoMatch = () => {
    alert("Auto-matching selesai: 2 transaksi berhasil dicocokkan berdasarkan referensi & nominal.");
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Rekonsiliasi Bank & Kas"
        subtitle="Pencocokan mutasi rekening koran perbankan vs pembukuan buku besar internal (Poin 20-21 REQUIREMENT.md)"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Rekonsiliasi Bank" }]}
        actions={
          <div className="flex items-center space-x-2">
            <DnaButton variant="secondary" onClick={handleAutoMatch}>
              <ArrowRightLeft className="h-4 w-4 mr-1.5" /> Auto Match (Cepat)
            </DnaButton>
            <DnaButton variant="primary">
              <FileCheck className="h-4 w-4 mr-1.5" /> Posting Penyesuaian
            </DnaButton>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase">Pilih Rekening Bank</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="mt-1 block px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 bg-slate-50"
            >
              <option value="bca">BCA Operasional (541-0988-121) - 11300</option>
              <option value="mandiri">Mandiri Payroll (132-00-987) - 11310</option>
              <option value="cash">Kas Utama Brankas - 11100</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase">Periode Pembukuan</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 block px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6 pr-4">
          <div>
            <div className="text-[11px] text-slate-400">Saldo Buku Besar</div>
            <div className="text-[14px] font-mono font-bold text-slate-900">{formatRupiah(bookBalance)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Saldo Rekening Koran</div>
            <div className="text-[14px] font-mono font-bold text-slate-900">{formatRupiah(stmtBalance)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Selisih Rekonsiliasi</div>
            <div className="text-[14px] font-mono font-bold text-amber-600">{formatRupiah(difference)}</div>
          </div>
        </div>
      </div>

      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Status Rekonsiliasi"
          value={difference === 0 ? "SEIMBANG (0)" : "BELUM REKONSILE"}
          variant={difference === 0 ? "emerald" : "amber"}
          icon={<CheckCircle2 className="h-4 w-4" />}
          delta={{ value: "2 Item Outstanding", isPositive: false }}
        />
        <DnaStatCard
          label="Transaksi Koran Belum Dijurnal"
          value="2 Transaksi"
          variant="blue"
          delta={{ value: "Adm Bank & Bunga Giro", isPositive: true }}
        />
        <DnaStatCard
          label="Buku Kas Belum Kliring"
          value="1 Transaksi"
          variant="slate"
          delta={{ value: "Biaya Kirim Ekspedisi", isPositive: true }}
        />
      </DnaKpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rekening Koran (Bank Statement) */}
        <DnaDataTableCard title="Mutasi Rekening Koran (Bank Statement)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Tgl & Ref</th>
                  <th className="px-3 py-2.5">Keterangan Bank</th>
                  <th className="px-3 py-2.5 text-right">Debit / Kredit</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {statements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-800">{s.date}</div>
                      <DnaCell.Code value={s.refNo} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{s.description}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium">
                      {s.credit > 0 ? (
                        <span className="text-emerald-600">+{formatRupiah(s.credit)}</span>
                      ) : (
                        <span className="text-slate-800">-{formatRupiah(s.debit)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <DnaBadge variant={s.isMatched ? "emerald" : "amber"}>
                        {s.isMatched ? "Matched" : "Unmatched"}
                      </DnaBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>

        {/* Buku Kas Sistem (Ledger) */}
        <DnaDataTableCard title="Buku Kas Sistem ERP (General Ledger)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Tgl & Ref</th>
                  <th className="px-3 py-2.5">Deskripsi Transaksi</th>
                  <th className="px-3 py-2.5 text-right">Debit / Kredit</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-800">{l.date}</div>
                      <DnaCell.Code value={l.refNo} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{l.description}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium">
                      {l.debit > 0 ? (
                        <span className="text-emerald-600">+{formatRupiah(l.debit)}</span>
                      ) : (
                        <span className="text-slate-800">-{formatRupiah(l.credit)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <DnaBadge variant={l.isMatched ? "emerald" : "amber"}>
                        {l.isMatched ? "Matched" : "Outstanding"}
                      </DnaBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      </div>
    </DnaPageContainer>
  );
}
