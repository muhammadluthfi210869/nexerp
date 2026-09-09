"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileSpreadsheet,
  Plus,
  Scale,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  DollarSign,
  Printer,
  FileText,
  Building2,
  BookOpen,
  Trash2
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

interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  lineDescription: string;
}

interface JournalHeader {
  id: string;
  code: string;
  date: string;
  description: string;
  reference: string;
  type: "MANUAL" | "AUTO_AR" | "AUTO_AP" | "AUTO_STOCK" | "ADJUSTMENT";
  status: "POSTED" | "DRAFT";
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  lines: JournalEntryLine[];
}

const FALLBACK_JOURNALS: JournalHeader[] = [
  {
    id: "1",
    code: "DL-FIN-JRN-08092026-0001",
    date: "2026-09-08",
    description: "Realisasi Penerimaan Pembayaran Termin PO-8821 PT Glowing",
    reference: "KM-2609-001",
    type: "AUTO_AR",
    status: "POSTED",
    totalDebit: 450000000,
    totalCredit: 450000000,
    createdBy: "Finance Auto System",
    lines: [
      { id: "l1", accountCode: "1120", accountName: "Bank BCA Operasional", debit: 450000000, credit: 0, lineDescription: "Penerimaan rekening koran BCA" },
      { id: "l2", accountCode: "1210", accountName: "Piutang Usaha Pelanggan (AR)", debit: 0, credit: 450000000, lineDescription: "Pengurangan piutang invoice AR-INV-2609-01" },
    ]
  },
  {
    id: "2",
    code: "DL-FIN-JRN-07092026-0002",
    date: "2026-09-07",
    description: "Pelunasan Pembayaran Faktur Supplier Centella",
    reference: "KK-2609-001",
    type: "AUTO_AP",
    status: "POSTED",
    totalDebit: 120000000,
    totalCredit: 120000000,
    createdBy: "Finance Auto System",
    lines: [
      { id: "l3", accountCode: "2110", accountName: "Hutang Usaha Supplier", debit: 120000000, credit: 0, lineDescription: "Pelunasan BILL-2608-012" },
      { id: "l4", accountCode: "1120", accountName: "Bank BCA Operasional", debit: 0, credit: 120000000, lineDescription: "Transfer keluar dari rekening BCA" },
    ]
  },
  {
    id: "3",
    code: "DL-FIN-JRN-05092026-0003",
    date: "2026-09-05",
    description: "Penyesuaian Biaya Sewa Fasilitas Dibayar di Muka Periode Sep",
    reference: "ADJ-2609-01",
    type: "ADJUSTMENT",
    status: "POSTED",
    totalDebit: 25000000,
    totalCredit: 25000000,
    createdBy: "Siti Accounting",
    lines: [
      { id: "l5", accountCode: "6130", accountName: "Beban Sewa & Fasilitas", debit: 25000000, credit: 0, lineDescription: "Amortisasi sewa bulan berjalan" },
      { id: "l6", accountCode: "1410", accountName: "Sewa Dibayar Dimuka", debit: 0, credit: 25000000, lineDescription: "Pengurangan aset lancar sewa" },
    ]
  }
];

export default function JurnalUmumPage() {
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalHeader | null>(null);

  // Form states (SCR-080)
  const [headerForm, setHeaderForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: ""
  });

  const [linesForm, setLinesForm] = useState<Array<{ id: string; accountCode: string; accountName: string; debit: number; credit: number; lineDescription: string }>>([
    { id: "1", accountCode: "1120", accountName: "Bank BCA Operasional", debit: 0, credit: 0, lineDescription: "" },
    { id: "2", accountCode: "4110", accountName: "Pendapatan Produksi Maklon", debit: 0, credit: 0, lineDescription: "" }
  ]);

  const formTotalDebit = useMemo(() => linesForm.reduce((acc, l) => acc + (Number(l.debit) || 0), 0), [linesForm]);
  const formTotalCredit = useMemo(() => linesForm.reduce((acc, l) => acc + (Number(l.credit) || 0), 0), [linesForm]);
  const isFormBalanced = formTotalDebit > 0 && formTotalDebit === formTotalCredit;

  const totalDebitBulanIni = useMemo(() => FALLBACK_JOURNALS.reduce((acc, j) => acc + j.totalDebit, 0), []);
  const totalCreditBulanIni = useMemo(() => FALLBACK_JOURNALS.reduce((acc, j) => acc + j.totalCredit, 0), []);

  const filteredJournals = useMemo(() => {
    return FALLBACK_JOURNALS.filter((j) => {
      const matchSearch =
        j.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === "ALL" || j.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [searchQuery, typeFilter]);

  const addRow = () => {
    setLinesForm([
      ...linesForm,
      { id: Date.now().toString(), accountCode: "1110", accountName: "Kas Operasional", debit: 0, credit: 0, lineDescription: "" }
    ]);
  };

  const removeRow = (index: number) => {
    if (linesForm.length <= 2) {
      toast.error("Minimal harus terdapat 2 baris akun!");
      return;
    }
    setLinesForm(linesForm.filter((_, i) => i !== index));
  };

  const handleSaveJournal = () => {
    if (!isFormBalanced) {
      toast.error("Total Debit harus sama dengan Total Kredit (Balanced)!");
      return;
    }
    if (!headerForm.description) {
      toast.error("Mohon isi deskripsi jurnal!");
      return;
    }
    toast.success("Jurnal Umum berhasil disimpan dan diposting ke Buku Besar!");
    setIsCreateModalOpen(false);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Jurnal Umum (General Journal)"
        description="Pencatatan transaksi akuntansi double-entry, jurnal penyesuaian (adjusting entries), reklasifikasi akun, dan posting ke Buku Besar."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Format ERP Lama G-SERP (Poin 25-27)</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/finance/ledger">
              <DnaButton variant="secondary" size="md">
                <BookOpen className="w-4 h-4 mr-1.5" />
                Buku Besar
              </DnaButton>
            </Link>
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Jurnal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Jurnal Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS (SCR-079) */}
      <DnaKpiGrid cols={3}>
        <DnaStatCard
          label="Total Debit Bulan Ini"
          value={formatRupiah(totalDebitBulanIni)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Balanced", isPositive: true }}
          subtext="Total Mutasi Sisi Debit"
          variant="success"
        />
        <DnaStatCard
          label="Total Kredit Bulan Ini"
          value={formatRupiah(totalCreditBulanIni)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Balanced", isPositive: true }}
          subtext="Total Mutasi Sisi Kredit"
          variant="success"
        />
        <DnaStatCard
          label="Unbalanced Draft Journal"
          value="0 (Sempurna)"
          icon={<Scale className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Zero Variance", isPositive: true }}
          subtext="Seluruh Jurnal Seimbang"
          variant="info"
        />
      </DnaKpiGrid>

      {/* TABLE LIST FORMAT ERP LAMA G-SERP (SCR-079) */}
      <DnaDataTableCard
        title="Daftar Jurnal Umum (General Journal Book)"
        badge={<DnaBadge variant="purple">{filteredJournals.length} Jurnal</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
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
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Tipe Jurnal</option>
              <option value="MANUAL">Manual Adjustment</option>
              <option value="AUTO_AR">Subledger AR (Penjualan)</option>
              <option value="AUTO_AP">Subledger AP (Pembelian)</option>
              <option value="ADJUSTMENT">Closing Adjustment</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode/deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">#</th>
                <th className="px-3.5 py-3">Kode</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Deskripsi Jurnal</th>
                <th className="px-3.5 py-3 text-right">Debit (Rp)</th>
                <th className="px-3.5 py-3 text-right">Kredit (Rp)</th>
                <th className="px-3.5 py-3 text-center">Tipe</th>
                <th className="px-3.5 py-3">Referensi</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJournals.map((j, idx) => (
                <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{j.code}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{j.date}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{j.description}</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700">{formatRupiah(j.totalDebit)}</td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">{formatRupiah(j.totalCredit)}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600 font-medium">
                      {j.type}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 text-[11px]">{j.reference}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={j.status === "POSTED" ? "success" : "default"}>
                      {j.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedJournal(j)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Lihat Rincian Multi-line"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toast.success(`Mencetak Bukti Jurnal ${j.code}...`)}
                        className="p-1 text-slate-400 hover:text-purple-600 rounded transition-colors"
                        title="Print Jurnal"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT JURNAL UMUM (SCR-080) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jurnal Umum Baru (Double-Entry Journal)"
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal *</label>
              <input
                type="date"
                value={headerForm.date}
                onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Referensi Dokumen (Opsional)</label>
              <input
                type="text"
                placeholder="e.g. ADJ-SEP-26 / MEMO-DIR-01"
                value={headerForm.reference}
                onChange={(e) => setHeaderForm({ ...headerForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Deskripsi / Keterangan Jurnal *</label>
            <input
              type="text"
              placeholder="e.g. Penyesuaian Beban Sewa Pabrik Bulan Berjalan"
              value={headerForm.description}
              onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* MULTI-LINE ENTRIES */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800">Daftar Akun Jurnal (Multi-line)</span>
              <DnaButton variant="secondary" size="sm" onClick={addRow}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Baris
              </DnaButton>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-1.5 w-1/3">Akun CoA *</th>
                  <th className="py-1.5 text-right w-1/4">Debit (Rp)</th>
                  <th className="py-1.5 text-right w-1/4">Kredit (Rp)</th>
                  <th className="py-1.5">Deskripsi Baris</th>
                  <th className="py-1.5 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linesForm.map((line, idx) => (
                  <tr key={line.id}>
                    <td className="py-1.5 pr-2">
                      <select
                        value={line.accountCode}
                        onChange={(e) => {
                          const updated = [...linesForm];
                          updated[idx].accountCode = e.target.value;
                          setLinesForm(updated);
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="1110">1110 - Kas Operasional</option>
                        <option value="1120">1120 - Bank BCA Operasional</option>
                        <option value="1210">1210 - Piutang Usaha</option>
                        <option value="2110">2110 - Hutang Usaha</option>
                        <option value="4110">4110 - Pendapatan Produksi</option>
                        <option value="5110">5110 - Beban Bahan Baku</option>
                        <option value="6130">6130 - Beban Sewa & Utilitas</option>
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={line.debit || ""}
                        onChange={(e) => {
                          const updated = [...linesForm];
                          updated[idx].debit = Number(e.target.value);
                          setLinesForm(updated);
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs text-right font-semibold"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={line.credit || ""}
                        onChange={(e) => {
                          const updated = [...linesForm];
                          updated[idx].credit = Number(e.target.value);
                          setLinesForm(updated);
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs text-right font-semibold"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        placeholder="Memo..."
                        value={line.lineDescription}
                        onChange={(e) => {
                          const updated = [...linesForm];
                          updated[idx].lineDescription = e.target.value;
                          setLinesForm(updated);
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <button onClick={() => removeRow(idx)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* BALANCE INDICATOR */}
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Status Balance:</span>
                <DnaBadge variant={isFormBalanced ? "success" : "critical"}>
                  {isFormBalanced ? "SEIMBANG (OK)" : `SELISIH: ${formatRupiah(Math.abs(formTotalDebit - formTotalCredit))}`}
                </DnaBadge>
              </div>
              <div className="text-right space-x-4">
                <span>Total Debit: <strong>{formatRupiah(formTotalDebit)}</strong></span>
                <span>Total Kredit: <strong>{formatRupiah(formTotalCredit)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleSaveJournal} disabled={!isFormBalanced}>
              Simpan & Posting Jurnal
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* DETAIL JURNAL MODAL */}
      <DnaModal
        isOpen={!!selectedJournal}
        onClose={() => setSelectedJournal(null)}
        title={`Rincian Jurnal: ${selectedJournal?.code}`}
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <strong className="text-slate-800">{selectedJournal?.date}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Deskripsi:</span>
              <strong className="text-slate-800">{selectedJournal?.description}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Referensi / Tipe:</span>
              <span className="font-mono">{selectedJournal?.reference} ({selectedJournal?.type})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dibuat Oleh:</span>
              <span>{selectedJournal?.createdBy}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-2.5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-1">Kode Akun</th>
                  <th className="py-1">Nama Akun Buku Besar</th>
                  <th className="py-1 text-right">Debit</th>
                  <th className="py-1 text-right">Kredit</th>
                  <th className="py-1">Keterangan Baris</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedJournal?.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 font-mono text-blue-700 font-bold">{l.accountCode}</td>
                    <td className="py-2 font-semibold text-slate-800">{l.accountName}</td>
                    <td className="py-2 text-right font-extrabold text-emerald-700">
                      {l.debit > 0 ? formatRupiah(l.debit) : "-"}
                    </td>
                    <td className="py-2 text-right font-extrabold text-rose-700">
                      {l.credit > 0 ? formatRupiah(l.credit) : "-"}
                    </td>
                    <td className="py-2 text-slate-600 text-[11px]">{l.lineDescription}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedJournal(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
