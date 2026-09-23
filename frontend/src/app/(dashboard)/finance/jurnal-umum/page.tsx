"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
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
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Jurnal Umum...</div>}>
      <JurnalUmumContent />
    </Suspense>
  );
}

function JurnalUmumContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalHeader | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
    const type = searchParams.get("type");
    if (type === "adjustment") {
      setTypeFilter("ADJUSTMENT");
    }
  }, [searchParams]);

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
        tabs={[
          { id: "ALL", label: "Semua Jurnal" },
          { id: "MANUAL", label: "Manual" },
          { id: "AUTO_AR", label: "Penjualan (AR)" },
          { id: "AUTO_AP", label: "Pembelian (AP)" },
          { id: "ADJUSTMENT", label: "Penyesuaian" }
        ]}
        activeTab={typeFilter}
        onTabChange={setTypeFilter}
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

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No Jurnal, deskripsi, referensi...",
          extraActions: (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
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
          ),
        }}
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <DnaTh className="w-[140px]">No. Jurnal</DnaTh>
              <DnaTh className="w-[110px]">Tanggal</DnaTh>
              <DnaTh>Deskripsi Transaksi</DnaTh>
              <DnaTh className="w-[130px]">No. Referensi</DnaTh>
              <DnaTh align="center" className="w-[120px]">Tipe Jurnal</DnaTh>
              <DnaTh align="right" className="w-[140px]">Total Debit</DnaTh>
              <DnaTh align="right" className="w-[140px]">Total Kredit</DnaTh>
              <DnaTh align="center" className="w-[120px]">Status</DnaTh>
              <DnaTh align="center" className="w-[90px]">Aksi</DnaTh>
            </tr>
          </DnaTableHead>
          <DnaTableBody>
            {filteredJournals.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada catatan jurnal umum yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredJournals.map((j) => (
                <DnaTableRow
                  key={j.id}
                  onClick={() => setSelectedJournal(j)}
                  className="cursor-pointer"
                >
                  {/* Kolom 1: No. Jurnal */}
                  <DnaTd>
                    <DnaCell.Code value={j.code} />
                  </DnaTd>

                  {/* Kolom 2: Tanggal */}
                  <DnaTd className="text-slate-600 whitespace-nowrap">
                    {j.date}
                  </DnaTd>

                  {/* Kolom 3: Deskripsi Transaksi */}
                  <DnaTd className="text-slate-900 font-medium truncate max-w-[240px]">
                    {j.description}
                  </DnaTd>

                  {/* Kolom 4: Referensi */}
                  <DnaTd>
                    <DnaCell.Code value={j.reference} />
                  </DnaTd>

                  {/* Kolom 5: Tipe Jurnal */}
                  <DnaTd align="center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {j.type}
                    </span>
                  </DnaTd>

                  {/* Kolom 6: Total Debit */}
                  <DnaTd align="right">
                    <span className="font-semibold text-xs tabular-nums text-emerald-700">
                      {formatRupiah(j.totalDebit)}
                    </span>
                  </DnaTd>

                  {/* Kolom 7: Total Kredit */}
                  <DnaTd align="right">
                    <span className="font-semibold text-xs tabular-nums text-rose-700">
                      {formatRupiah(j.totalCredit)}
                    </span>
                  </DnaTd>

                  {/* Kolom 8: Status */}
                  <DnaTd align="center">
                    <DnaBadge variant={j.status === "POSTED" ? "success" : "default"}>
                      {j.status}
                    </DnaBadge>
                  </DnaTd>

                  {/* Kolom 9: Aksi */}
                  <DnaTd align="center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJournal(j)}
                        title="Lihat Rincian Multi-line"
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`Mencetak Bukti Jurnal ${j.code}...`)}
                        title="Print Jurnal"
                        className="text-slate-400 hover:text-purple-600"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </DnaButton>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
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
              <DnaInput
                type="date"
                value={headerForm.date}
                onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Referensi Dokumen (Opsional)</label>
              <DnaInput
                type="text"
                placeholder="e.g. ADJ-SEP-26 / MEMO-DIR-01"
                value={headerForm.reference}
                onChange={(e) => setHeaderForm({ ...headerForm, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Deskripsi / Keterangan Jurnal *</label>
            <DnaInput
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

            <DnaTable className="w-full text-left text-xs">
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
                      <DnaSelect
                        value={line.accountCode}
                        onChange={(value) => {
                          const updated = [...linesForm];
                          updated[idx].accountCode = value;
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
                      </DnaSelect>
                    </td>
                    <td className="py-1.5 px-2">
                      <DnaInput
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
                      <DnaInput
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
                      <DnaInput
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
            </DnaTable>

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

      {/* DETAIL JURNAL DRAWER (QUICK PEEK) */}
      <DnaDetailDrawer
        isOpen={!!selectedJournal}
        onClose={() => setSelectedJournal(null)}
        title={`Rincian Jurnal: ${selectedJournal?.code}`}
        subtitle={selectedJournal?.description}
        badge={
          selectedJournal && (
            <DnaBadge variant={selectedJournal.status === "POSTED" ? "success" : "default"}>
              {selectedJournal.status}
            </DnaBadge>
          )
        }
        tabs={[
          {
            id: "entries",
            label: "Entri Double-Entry (Buku Besar)",
            content: (
              <div className="space-y-4 p-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-lg space-y-1.5 border border-slate-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Tanggal:</span>{" "}
                      <strong className="text-slate-800">{selectedJournal?.date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Referensi:</span>{" "}
                      <span className="font-semibold tabular-nums">{selectedJournal?.reference}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tipe Jurnal:</span>{" "}
                      <span className="font-semibold text-purple-700">{selectedJournal?.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Dibuat Oleh:</span>{" "}
                      <span className="text-slate-700">{selectedJournal?.createdBy}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <DnaTable className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">Kode & Akun COA</th>
                        <th className="p-2.5 text-right">Debit</th>
                        <th className="p-2.5 text-right">Kredit</th>
                        <th className="p-2.5">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedJournal?.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="p-2.5">
                            <span className="text-blue-700 font-bold tabular-nums mr-1.5">{l.accountCode}</span>
                            <span className="font-semibold text-slate-800">{l.accountName}</span>
                          </td>
                          <td className="p-2.5 text-right font-bold tabular-nums text-emerald-700">
                            {l.debit > 0 ? formatRupiah(l.debit) : "-"}
                          </td>
                          <td className="p-2.5 text-right font-bold tabular-nums text-rose-700">
                            {l.credit > 0 ? formatRupiah(l.credit) : "-"}
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{l.lineDescription}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <td className="p-2.5 text-slate-900 font-bold text-right text-xs">TOTAL:</td>
                        <td className="p-2.5 text-right font-bold tabular-nums text-emerald-700">
                          {selectedJournal ? formatRupiah(selectedJournal.totalDebit) : "0"}
                        </td>
                        <td className="p-2.5 text-right font-bold tabular-nums text-rose-700">
                          {selectedJournal ? formatRupiah(selectedJournal.totalCredit) : "0"}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </DnaTable>
                </div>
              </div>
            )
          },
          {
            id: "audit",
            label: "Informasi Audit",
            content: (
              <div className="p-4 space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Validasi Balance:</span>
                    <DnaBadge variant="success">BALANCED (DEBIT = KREDIT)</DnaBadge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Posting Status:</span>
                    <span className="font-semibold text-emerald-800">POSTED TO GENERAL LEDGER</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Siklus Periode:</span>
                    <span className="text-slate-700 font-medium">September 2026 (Open)</span>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="secondary"
              size="md"
              onClick={() => toast.success(`Mencetak Bukti Jurnal ${selectedJournal?.code}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Jurnal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setSelectedJournal(null)}>
              Tutup
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
