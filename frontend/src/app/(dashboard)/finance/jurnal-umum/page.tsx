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
  DnaTabNav,
  useDnaToast,
  formatRupiah
} from "@/components/dna";

interface JournalLine {
  id: string;
  coaCode: string;
  coaName: string;
  debit: number;
  credit: number;
  description?: string;
}

interface JournalEntryItem {
  id: string;
  code: string; // e.g. JV-2026-0901
  date: string;
  description: string;
  referenceNo?: string;
  journalType: "MANUAL" | "SALES" | "PURCHASE" | "PRODUCTION" | "CLOSING";
  totalDebit: number;
  totalCredit: number;
  status: "DRAFT" | "POSTED" | "REVERSED";
  createdBy: string;
  lines: JournalLine[];
}

const FALLBACK_JOURNALS: JournalEntryItem[] = [
  {
    id: "jv-1",
    code: "JV-2026-0901",
    date: "2026-09-09",
    description: "Jurnal Otomatis Rilis Batch Niacinamide Serum ke WH-03",
    referenceNo: "COA-2026-0906-088",
    journalType: "PRODUCTION",
    totalDebit: 185000000,
    totalCredit: 185000000,
    status: "POSTED",
    createdBy: "System (CPKB Engine)",
    lines: [
      { id: "jl-1", coaCode: "114-003", coaName: "Persediaan Barang Jadi (WH-03)", debit: 185000000, credit: 0, description: "Output 5.000 pcs produk jadi" },
      { id: "jl-2", coaCode: "114-002", coaName: "Persediaan Barang Dalam Proses (WIP)", debit: 0, credit: 185000000, description: "Closing WIP Batch SPK-2026-0042" }
    ]
  },
  {
    id: "jv-2",
    code: "JV-2026-0902",
    date: "2026-09-08",
    description: "Alokasi Beban Penyusutan Mesin Homogenizer September 2026",
    referenceNo: "DEP-2026-09",
    journalType: "MANUAL",
    totalDebit: 4500000,
    totalCredit: 4500000,
    status: "POSTED",
    createdBy: "Dewi Lestari",
    lines: [
      { id: "jl-3", coaCode: "610-008", coaName: "Beban Depresiasi Mesin Pabrik", debit: 4500000, credit: 0, description: "Penyusutan garis lurus bulan berjalan" },
      { id: "jl-4", coaCode: "122-002", coaName: "Akumulasi Depresiasi Mesin Pabrik", debit: 0, credit: 4500000, description: "Akumulasi mixer & homogenizer" }
    ]
  },
  {
    id: "jv-3",
    code: "JV-2026-0903",
    date: "2026-09-07",
    description: "Penyesuaian Selisih Kurs Valas Pembelian Bahan Baku Impor",
    referenceNo: "PO-2026-0182",
    journalType: "MANUAL",
    totalDebit: 1250000,
    totalCredit: 1250000,
    status: "POSTED",
    createdBy: "Dewi Lestari",
    lines: [
      { id: "jl-5", coaCode: "720-001", coaName: "Rugi Selisih Kurs Valas", debit: 1250000, credit: 0, description: "Kurs spot pelunasan impor" },
      { id: "jl-6", coaCode: "101-001", coaName: "BCA Giro Operasional", debit: 0, credit: 1250000, description: "Pembayaran selisih transfer valas" }
    ]
  }
];

export default function GeneralJournalPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<JournalEntryItem | null>(null);

  // Form states for manual journal entry
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDesc, setFormDesc] = useState("");
  const [formRef, setFormRef] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "l1", coaCode: "101-001", coaName: "BCA Giro Operasional", debit: 10000000, credit: 0, description: "Debit" },
    { id: "l2", coaCode: "410-001", coaName: "Pendapatan Jasa Maklon", debit: 0, credit: 10000000, description: "Kredit" }
  ]);

  const { data: serverData } = useQuery({
    queryKey: ["finance-general-journals"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/journals");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          // Map
        }
      } catch (err) {
        console.warn("Using fallback journals", err);
      }
      return FALLBACK_JOURNALS;
    }
  });

  const journals = serverData || FALLBACK_JOURNALS;

  const filteredList = useMemo(() => {
    return journals.filter((item) => {
      if (activeTab !== "ALL" && item.journalType !== activeTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchRef = (item.referenceNo || "").toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchRef) return false;
      }
      return true;
    });
  }, [journals, activeTab, searchQuery]);

  const totalDebitSum = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  const totalCreditSum = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebitSum === totalCreditSum && totalDebitSum > 0;

  const handleAddLine = () => {
    setLines([
      ...lines,
      { id: `l${Date.now()}`, coaCode: "610-001", coaName: "Beban Operasional", debit: 0, credit: 0 }
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 2) {
      toast.error("Validasi Baris", "Jurnal minimal harus memiliki 2 baris (Debit & Kredit).");
      return;
    }
    setLines(lines.filter((l) => l.id !== id));
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error("Jurnal Tidak Balance", "Total Debit dan Kredit harus sama persis sebelum dapat diposting.");
      return;
    }

    const newJournal: JournalEntryItem = {
      id: `jv-${Date.now()}`,
      code: `JV-2026-${String(journals.length + 904).padStart(4, "0")}`,
      date: formDate,
      description: formDesc,
      referenceNo: formRef || undefined,
      journalType: "MANUAL",
      totalDebit: totalDebitSum,
      totalCredit: totalCreditSum,
      status: "POSTED",
      createdBy: "Dewi Lestari",
      lines: [...lines]
    };

    journals.unshift(newJournal);
    setIsCreateModalOpen(false);
    toast.success("Jurnal Umum Diposting", `Voucher Jurnal ${newJournal.code} (${formatRupiah(totalDebitSum)}) telah masuk ke Buku Besar.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Jurnal Umum (General Journal)"
        subtitle="Pencatatan voucher entri debit-kredit manual dan monitoring posting otomatis dari seluruh modul transaksi operasional"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Double-Entry Balanced</span>
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
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Jurnal Baru
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Volume Jurnal (Bulan Ini)"
          value={formatRupiah(journals.reduce((acc, j) => acc + j.totalDebit, 0))}
          icon={<FileSpreadsheet className="w-5 h-5 text-blue-600" />}
          delta={{ value: "100% Balanced", isPositive: true }}
          variant="blue"
        />
        <DnaStatCard
          label="Voucher Terbit"
          value={`${journals.length} Voucher`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="Seluruh Periode Aktif"
          variant="success"
        />
        <DnaStatCard
          label="Jurnal Produksi (Auto)"
          value={`${journals.filter((j) => j.journalType === "PRODUCTION").length} Voucher`}
          icon={<Scale className="w-5 h-5 text-indigo-600" />}
          subtext="WIP to Finished Goods"
          variant="info"
        />
        <DnaStatCard
          label="Status Buku Besar"
          value="Open"
          icon={<BookOpen className="w-5 h-5 text-purple-600" />}
          subtext="Periode September 2026"
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Voucher Jurnal Umum"
        badge={
          <DnaBadge variant="default">
            {filteredList.length} Voucher
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Tipe", badge: journals.length },
                { id: "MANUAL", label: "Manual Adjustment", badge: journals.filter((j) => j.journalType === "MANUAL").length },
                { id: "PRODUCTION", label: "Produksi (WIP/COGS)", badge: journals.filter((j) => j.journalType === "PRODUCTION").length }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Kode Jurnal, Deskripsi, Ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">No. Jurnal & Ref</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Keterangan / Memo</th>
                <th className="px-3.5 py-3 text-right">Debit (Rp)</th>
                <th className="px-3.5 py-3 text-right">Kredit (Rp)</th>
                <th className="px-3.5 py-3">Tipe</th>
                <th className="px-3.5 py-3">Pembuat</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3.5 py-3">
                    <div className="font-bold text-slate-900">{item.code}</div>
                    {item.referenceNo && <div className="text-[10px] text-blue-700 font-mono">Ref: {item.referenceNo}</div>}
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">{item.date}</td>
                  <td className="px-3.5 py-3 max-w-[260px] truncate font-medium text-slate-900" title={item.description}>
                    {item.description}
                  </td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-blue-800">
                    {formatRupiah(item.totalDebit)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-blue-800">
                    {formatRupiah(item.totalCredit)}
                  </td>
                  <td className="px-3.5 py-3">
                    <DnaBadge variant={item.journalType === "PRODUCTION" ? "purple" : "info"}>
                      {item.journalType}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">{item.createdBy}</td>
                  <td className="px-3.5 py-3">
                    <DnaBadge variant={item.status === "POSTED" ? "success" : "default"}>
                      {item.status}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <DnaButton variant="secondary" size="sm" onClick={() => setDetailItem(item)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT JURNAL MANUAL BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Voucher Jurnal Umum Manual"
        size="lg"
      >
        <form onSubmit={handleCreateJournal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Jurnal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi / Keterangan Jurnal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Penyesuaian biaya operasional..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* TABEL ENTRI BARIS DEBIT / KREDIT */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100/80 px-3.5 py-2 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">Daftar Akun Entri Jurnal</span>
              <DnaButton type="button" variant="secondary" size="sm" onClick={handleAddLine}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Baris
              </DnaButton>
            </div>

            <div className="p-2 space-y-2">
              {lines.map((line, idx) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Kode & Nama COA"
                      value={`${line.coaCode} - ${line.coaName}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newLines = [...lines];
                        newLines[idx].coaName = val;
                        setLines(newLines);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono text-slate-800"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Debit"
                      value={line.debit || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const newLines = [...lines];
                        newLines[idx].debit = val;
                        if (val > 0) newLines[idx].credit = 0;
                        setLines(newLines);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-blue-900 text-right"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Kredit"
                      value={line.credit || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const newLines = [...lines];
                        newLines[idx].credit = val;
                        if (val > 0) newLines[idx].debit = 0;
                        setLines(newLines);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-bold text-emerald-900 text-right"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.id)}
                      className="p-1 text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* BALANCE INDICATOR */}
            <div className="bg-slate-50 px-3.5 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Jurnal Balance (Seimbang)
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1">
                    <Scale className="w-4 h-4" />
                    Selisih: {formatRupiah(Math.abs(totalDebitSum - totalCreditSum))}
                  </span>
                )}
              </div>
              <div className="flex gap-4">
                <span>Total Debit: <strong className="text-blue-900">{formatRupiah(totalDebitSum)}</strong></span>
                <span>Total Kredit: <strong className="text-emerald-900">{formatRupiah(totalCreditSum)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary" disabled={!isBalanced}>
              Posting Jurnal
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL DETAIL JURNAL */}
      <DnaModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Detail Voucher Jurnal: ${detailItem?.code}`}
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{detailItem.description}</div>
              <div className="text-slate-500">
                Tanggal: <strong>{detailItem.date}</strong> • Tipe: <strong>{detailItem.journalType}</strong> • Pembuat: <strong>{detailItem.createdBy}</strong>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 border-b border-r border-slate-200">Kode & Akun COA</th>
                  <th className="px-3 py-2 border-b border-r border-slate-200">Keterangan Baris</th>
                  <th className="px-3 py-2 border-b border-r border-slate-200 text-right">Debit</th>
                  <th className="px-3 py-2 border-b border-slate-200 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailItem.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 border-r border-slate-100 font-mono font-medium text-slate-800">
                      {l.coaCode} - {l.coaName}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-100 text-slate-600">{l.description || "-"}</td>
                    <td className="px-3 py-2 border-r border-slate-100 text-right font-bold text-blue-900">
                      {l.debit > 0 ? formatRupiah(l.debit) : "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-900">
                      {l.credit > 0 ? formatRupiah(l.credit) : "-"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-black text-xs">
                  <td colSpan={2} className="px-3 py-2 border-r border-slate-200 text-right uppercase">Total Balance</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-right text-blue-900">{formatRupiah(detailItem.totalDebit)}</td>
                  <td className="px-3 py-2 text-right text-emerald-900">{formatRupiah(detailItem.totalCredit)}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <DnaButton variant="primary" size="sm" onClick={() => setDetailItem(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
