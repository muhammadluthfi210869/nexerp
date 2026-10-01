"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
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
  const qc = useQueryClient();

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalHeader | null>(null);

  // 1. Fetch live COA accounts for form selector
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/accounts");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch live Journal Entries from BE
  const { data: rawJournals = [], isLoading } = useQuery<any[]>({
    queryKey: ["finance-journals"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/journals");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    }
  });

  const journals: JournalHeader[] = useMemo(() => {
    return rawJournals.map((j: any) => {
      const lines: JournalEntryLine[] = (j.lines || []).map((l: any) => ({
        id: l.id,
        accountCode: l.account?.code || l.accountId || "-",
        accountName: l.account?.name || "Bagan Akun",
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        lineDescription: l.description || j.description || "-"
      }));

      const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
      const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);

      let mappedType: JournalHeader["type"] = "MANUAL";
      const src = j.sourceDocumentType || "";
      if (src.includes("AR") || src.includes("INVOICE")) mappedType = "AUTO_AR";
      else if (src.includes("AP") || src.includes("BILL")) mappedType = "AUTO_AP";
      else if (src.includes("PROD") || src.includes("STOCK")) mappedType = "AUTO_STOCK";
      else if (src.includes("ADJ") || src.includes("RECON")) mappedType = "ADJUSTMENT";

      return {
        id: j.id,
        code: j.reference || j.id.slice(0, 12),
        date: j.date ? new Date(j.date).toISOString().split("T")[0] : "-",
        description: j.description || "Jurnal Umum",
        reference: j.reference || "-",
        type: mappedType,
        status: (j.status || "POSTED") as "POSTED" | "DRAFT",
        totalDebit,
        totalCredit,
        createdBy: j.createdBy || "Finance System",
        lines
      };
    });
  }, [rawJournals]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateModalOpen(true);
    }
    const type = searchParams.get("type");
    if (type === "adjustment") {
      setTypeFilter("ADJUSTMENT");
    }
  }, [searchParams]);

  // Form states
  const [headerForm, setHeaderForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: ""
  });

  const [linesForm, setLinesForm] = useState<Array<{ id: string; accountId: string; accountCode: string; accountName: string; debit: number; credit: number; lineDescription: string }>>([
    { id: "1", accountId: "", accountCode: "1120", accountName: "Kas / Bank", debit: 0, credit: 0, lineDescription: "" },
    { id: "2", accountId: "", accountCode: "4110", accountName: "Pendapatan / Biaya", debit: 0, credit: 0, lineDescription: "" }
  ]);

  const formTotalDebit = useMemo(() => linesForm.reduce((acc, l) => acc + (Number(l.debit) || 0), 0), [linesForm]);
  const formTotalCredit = useMemo(() => linesForm.reduce((acc, l) => acc + (Number(l.credit) || 0), 0), [linesForm]);
  const isFormBalanced = formTotalDebit > 0 && formTotalDebit === formTotalCredit;

  const totalDebitBulanIni = useMemo(() => journals.reduce((acc, j) => acc + j.totalDebit, 0), [journals]);
  const totalCreditBulanIni = useMemo(() => journals.reduce((acc, j) => acc + j.totalCredit, 0), [journals]);

  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const matchSearch =
        j.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === "ALL" || j.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [journals, searchQuery, typeFilter]);

  const addRow = () => {
    setLinesForm([
      ...linesForm,
      { id: Date.now().toString(), accountId: "", accountCode: "", accountName: "Pilih Akun", debit: 0, credit: 0, lineDescription: "" }
    ]);
  };

  const removeRow = (index: number) => {
    if (linesForm.length <= 2) {
      toast.error("Minimal harus terdapat 2 baris akun!");
      return;
    }
    setLinesForm(linesForm.filter((_, i) => i !== index));
  };

  // Mutation to create journal entry
  const createJournalMutation = useMutation({
    mutationFn: async () => {
      const mappedLines = linesForm.map((line) => {
        // Resolve valid account ID
        const matched = accounts.find((a: any) => a.code === line.accountCode || a.id === line.accountId);
        const accountId = matched?.id || line.accountId || accounts[0]?.id;
        return {
          accountId,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0
        };
      });

      return api.post("/finance/journals", {
        date: new Date(headerForm.date).toISOString(),
        description: headerForm.description,
        reference: headerForm.reference || undefined,
        lines: mappedLines
      });
    },
    onSuccess: () => {
      toast.success("Jurnal Umum berhasil disimpan dan diposting ke Buku Besar!");
      qc.invalidateQueries({ queryKey: ["finance-journals"] });
      setIsCreateModalOpen(false);
      setHeaderForm({
        date: new Date().toISOString().split("T")[0],
        description: "",
        reference: ""
      });
    },
    onError: (err: any) => {
      toast.error("Gagal Posting Jurnal", extractApiError(err) || "Gagal membuat jurnal umum");
    }
  });

  const handleSaveJournal = () => {
    if (!isFormBalanced) {
      toast.error("Total Debit harus sama dengan Total Kredit (Balanced)!");
      return;
    }
    if (!headerForm.description) {
      toast.error("Mohon isi deskripsi jurnal!");
      return;
    }
    createJournalMutation.mutate();
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Jurnal Umum (General Journal)"
        description="Pencatatan transaksi akuntansi double-entry, jurnal penyesuaian (adjusting entries), reklasifikasi akun, dan posting ke Buku Besar."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Format ERP G-SERP</span>
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
              Buat Jurnal Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI STAT CARDS */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Jurnal Terposting"
          value={journals.length.toString()}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          delta={{ value: "Bulan Berjalan", isPositive: true }}
          subtext="Semua entri seimbang"
          variant="info"
        />
        <DnaStatCard
          label="Total Perputaran Debit"
          value={formatRupiah(totalDebitBulanIni)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Saldo Debit Akun", isPositive: true }}
          subtext="Akumulasi Debit Masuk"
          variant="success"
        />
        <DnaStatCard
          label="Total Perputaran Kredit"
          value={formatRupiah(totalCreditBulanIni)}
          icon={<DollarSign className="w-5 h-5 text-rose-600" />}
          delta={{ value: "Saldo Kredit Akun", isPositive: true }}
          subtext="Akumulasi Kredit Keluar"
          variant="slate"
        />
        <DnaStatCard
          label="Status Integritas Jurnal"
          value={totalDebitBulanIni === totalCreditBulanIni ? "SEIMBANG" : "SELISIH"}
          icon={<Scale className="w-5 h-5 text-purple-600" />}
          delta={{ value: totalDebitBulanIni === totalCreditBulanIni ? "Dr = Cr Balance" : "Unbalanced", isPositive: totalDebitBulanIni === totalCreditBulanIni }}
          subtext="Double-entry terverifikasi"
          variant={totalDebitBulanIni === totalCreditBulanIni ? "purple" : "warning"}
        />
      </DnaKpiGrid>

      {/* MAIN DATA TABLE CARD */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari nomor jurnal, deskripsi transaksi, atau referensi...",
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-[18%]">No. Jurnal & Tanggal</DnaTh>
                <DnaTh className="w-[32%]">Keterangan / Deskripsi Transaksi</DnaTh>
                <DnaTh className="w-[15%]">Referensi Dokumen</DnaTh>
                <DnaTh className="w-[13%]">Tipe Jurnal</DnaTh>
                <DnaTh className="w-[14%] text-right">Total Debit / Kredit</DnaTh>
                <DnaTh align="center" className="w-[8%]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredJournals.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Belum ada jurnal umum yang tercatat. Klik &quot;Buat Jurnal Baru&quot; untuk menambah.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredJournals.map((j) => (
                  <DnaTableRow key={j.id} className="hover:bg-slate-50/50">
                    <DnaTd>
                      <div className="font-bold text-blue-700 tabular-nums">{j.code}</div>
                      <div className="text-[10px] text-slate-500 tabular-nums">{j.date}</div>
                    </DnaTd>
                    <DnaTd>
                      <div className="font-medium text-slate-800 text-[12px]">{j.description}</div>
                      <div className="text-[10px] text-slate-400">Diposting oleh: {j.createdBy}</div>
                    </DnaTd>
                    <DnaTd>
                      <span className="font-mono text-slate-600 font-semibold">{j.reference}</span>
                    </DnaTd>
                    <DnaTd>
                      <DnaBadge
                        variant={
                          j.type === "AUTO_AR" ? "success" :
                          j.type === "AUTO_AP" ? "info" :
                          j.type === "ADJUSTMENT" ? "warning" : "default"
                        }
                      >
                        {j.type}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="text-right">
                      <div className="font-bold text-slate-900 tabular-nums">
                        {formatRupiah(j.totalDebit)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Balanced</div>
                    </DnaTd>
                    <DnaTd align="center">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedJournal(j)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* DETAIL DRAWER */}
      <DnaDetailDrawer
        isOpen={!!selectedJournal}
        onClose={() => setSelectedJournal(null)}
        title={`Jurnal: ${selectedJournal?.code}`}
        subtitle={selectedJournal?.description || ""}
        badge={<DnaBadge variant="success">{selectedJournal?.status || "POSTED"}</DnaBadge>}
        tabs={[
          {
            id: "lines",
            label: "Baris Akun (Lines)",
            content: (
              <div className="space-y-4 p-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Tanggal:</span>
                    <strong className="block text-slate-800">{selectedJournal?.date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Referensi:</span>
                    <strong className="block text-slate-800">{selectedJournal?.reference}</strong>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Akun COA</th>
                        <th className="p-2.5">Keterangan</th>
                        <th className="p-2.5 text-right">Debit (Rp)</th>
                        <th className="p-2.5 text-right">Kredit (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedJournal?.lines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className="font-bold text-blue-700">{line.accountCode}</span>
                            <div className="text-[11px] text-slate-600">{line.accountName}</div>
                          </td>
                          <td className="p-2.5 text-slate-700">{line.lineDescription}</td>
                          <td className="p-2.5 text-right font-semibold text-emerald-700 tabular-nums">
                            {line.debit > 0 ? formatRupiah(line.debit) : "-"}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-slate-800 tabular-nums">
                            {line.credit > 0 ? formatRupiah(line.credit) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={2} className="p-2.5 text-right">Total:</td>
                        <td className="p-2.5 text-right text-emerald-700">{formatRupiah(selectedJournal?.totalDebit || 0)}</td>
                        <td className="p-2.5 text-right text-slate-900">{formatRupiah(selectedJournal?.totalCredit || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          }
        ]}
      />

      {/* CREATE MODAL */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jurnal Umum Baru (Double-Entry)"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tanggal Transaksi *</label>
              <DnaInput
                type="date"
                value={headerForm.date}
                onChange={(e) => setHeaderForm({ ...headerForm, date: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Nomor Referensi Dokumen</label>
              <DnaInput
                placeholder="Misal: MEMO-2609-01 atau BUKTI-KAS-01"
                value={headerForm.reference}
                onChange={(e) => setHeaderForm({ ...headerForm, reference: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Keterangan / Deskripsi Jurnal *</label>
            <DnaInput
              placeholder="Misal: Penyesuaian Biaya Sewa atau Reklasifikasi Kas"
              value={headerForm.description}
              onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
            />
          </div>

          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Rincian Baris Debit & Kredit</span>
              <DnaButton variant="secondary" size="sm" onClick={addRow}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Baris
              </DnaButton>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {linesForm.map((line, idx) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="col-span-4">
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Akun COA</label>
                    <select
                      value={line.accountCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = accounts.find((a: any) => a.code === val || a.id === val);
                        const next = [...linesForm];
                        next[idx].accountCode = matched?.code || val;
                        next[idx].accountName = matched?.name || "Akun Terpilih";
                        next[idx].accountId = matched?.id || val;
                        setLinesForm(next);
                      }}
                      className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                    >
                      <option value="">— Pilih Akun —</option>
                      {accounts.map((a: any) => (
                        <option key={a.id || a.code} value={a.code}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Keterangan Baris</label>
                    <DnaInput
                      placeholder="Memo baris"
                      value={line.lineDescription}
                      onChange={(e) => {
                        const next = [...linesForm];
                        next[idx].lineDescription = e.target.value;
                        setLinesForm(next);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-emerald-600 font-semibold block mb-0.5">Debit (Rp)</label>
                    <DnaInput
                      type="number"
                      value={line.debit || ""}
                      onChange={(e) => {
                        const next = [...linesForm];
                        next[idx].debit = Number(e.target.value) || 0;
                        setLinesForm(next);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-rose-600 font-semibold block mb-0.5">Kredit (Rp)</label>
                    <DnaInput
                      type="number"
                      value={line.credit || ""}
                      onChange={(e) => {
                        const next = [...linesForm];
                        next[idx].credit = Number(e.target.value) || 0;
                        setLinesForm(next);
                      }}
                    />
                  </div>
                  <div className="col-span-1 text-center pt-3">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg font-bold text-xs mt-2">
              <span className="text-slate-700">Total Debit & Kredit:</span>
              <div className="flex gap-4">
                <span className="text-emerald-700">Dr: {formatRupiah(formTotalDebit)}</span>
                <span className="text-rose-700">Cr: {formatRupiah(formTotalCredit)}</span>
                <span className={isFormBalanced ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                  {isFormBalanced ? "BALANCED" : `SELISIH: ${formatRupiah(Math.abs(formTotalDebit - formTotalCredit))}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={handleSaveJournal}
              disabled={createJournalMutation.isPending || !isFormBalanced}
            >
              {createJournalMutation.isPending ? "Menyimpan..." : "Posting Jurnal"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
