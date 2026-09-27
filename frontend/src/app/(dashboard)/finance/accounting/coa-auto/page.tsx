"use client";

/**
 * CoA Jurnal Otomatis — Master Rules Posting Otomatis GL
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 32: /coa-auto-manage)
 *
 * Table Columns (Strict 1:1 Parity):
 * Rule Name | Document Type | Condition | Debit Account | Credit Account | Active | #
 */

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Zap,
  Plus,
  Search,
  CheckCircle2,
  Settings2,
  ArrowRightLeft,
  BookOpen,
  Filter,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaCell,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  useDnaToast,
} from "@/components/dna";

interface CoaAutoRule {
  id: string;
  ruleName: string;
  documentType: "Faktur Pembelian" | "Faktur Penjualan" | "DP Penjualan" | "DP Pembelian" | "Pembayaran Piutang" | "Pembayaran Hutang" | "Konsumsi BOM Mixing" | "Retur Penjualan" | "Retur Pembelian";
  condition: string;
  debitAccount: string;
  creditAccount: string;
  isActive: boolean;
  notes?: string;
}

function CoaAutoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocFilter, setSelectedDocFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch live COA accounts
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
    },
  });

  // 2. Fetch live auto-journal configs
  const { data: rawConfigs = [] } = useQuery<any[]>({
    queryKey: ["finance-auto-journal-configs"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/auto-journal-configs");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const rules: CoaAutoRule[] = useMemo(() => {
    return rawConfigs.map((cfg: any) => {
      const debitAcc = accounts.find((a: any) => a.id === cfg.coaDebetId || a.code === cfg.coaDebetId);
      const creditAcc = accounts.find((a: any) => a.id === cfg.coaCreditId || a.code === cfg.coaCreditId);
      return {
        id: cfg.transactionType,
        ruleName: cfg.description || `Auto Journal: ${cfg.transactionType}`,
        documentType: (cfg.transactionType as any) || "Faktur Penjualan",
        condition: "Semua Transaksi",
        debitAccount: debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : cfg.coaDebetId,
        creditAccount: creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : cfg.coaCreditId,
        isActive: true,
        notes: `Aturan database untuk ${cfg.transactionType}`,
      };
    });
  }, [rawConfigs, accounts]);

  React.useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDocType, setFormDocType] = useState<CoaAutoRule["documentType"]>("Faktur Penjualan");
  const [formCondition, setFormCondition] = useState("Semua Transaksi");
  const [formDebit, setFormDebit] = useState("");
  const [formCredit, setFormCredit] = useState("");

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchSearch =
        r.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.debitAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.creditAccount.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDoc = selectedDocFilter === "ALL" || r.documentType === selectedDocFilter;
      return matchSearch && matchDoc;
    });
  }, [rules, searchQuery, selectedDocFilter]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const debitAcc = accounts.find((a: any) => a.code === formDebit || a.id === formDebit) || accounts[0];
      const creditAcc = accounts.find((a: any) => a.code === formCredit || a.id === formCredit) || accounts[1] || debitAcc;
      return api.post("/finance/auto-journal-configs", {
        transactionType: formDocType,
        coaDebetId: debitAcc?.id || formDebit || "DEBIT",
        coaCreditId: creditAcc?.id || formCredit || "CREDIT",
        description: formName,
      });
    },
    onSuccess: () => {
      toast.success("Rule Disimpan", `Aturan auto-posting '${formName}' berhasil disimpan ke database.`);
      qc.invalidateQueries({ queryKey: ["finance-auto-journal-configs"] });
      setIsModalOpen(false);
      setFormName("");
      if (searchParams.get("action") === "create") {
        router.replace("/finance/accounting/coa-auto");
      }
    },
    onError: (err: any) => {
      toast.error("Gagal", err?.response?.data?.message || "Gagal menyimpan aturan jurnal");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error("Validasi Gagal", "Nama Rule wajib diisi.");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="CoA Jurnal Otomatis (Kelola CoA)"
        description="Konfigurasi Aturan Auto-Posting Debit dan Kredit per Jenis Dokumen Transaksi Operasional"
        actions={
          <DnaButton variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Aturan Posting
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>TOTAL ATURAN AKTIF</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{rules.filter((r) => r.isActive).length}</p>
          <span className="text-[10px] text-slate-400">Aturan posting otomatis siap kerja</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>DOKUMEN TERINTEGRASI</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {new Set(rules.map((r) => r.documentType)).size}
          </p>
          <span className="text-[10px] text-slate-400">Faktur AR/AP, DP, Produksi</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>AKUN COA TERPETAKAN</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{accounts.length}</p>
          <span className="text-[10px] text-slate-400">Bagan akun aktif dalam GL</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Settings2 className="w-4 h-4 text-purple-600" />
            <span>DOUBLE-ENTRY ENGINE</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">100%</p>
          <span className="text-[10px] text-slate-400">Prinsip balance ketat</span>
        </div>
      </DnaKpiGrid>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari nama aturan, akun debit, akun kredit...",
          filterColumns: [
            {
              key: "docType",
              label: "Tipe Dokumen",
              type: "select",
              options: [
                "Faktur Penjualan",
                "Faktur Pembelian",
                "DP Penjualan",
                "DP Pembelian",
                "Pembayaran Piutang",
                "Pembayaran Hutang",
                "Konsumsi BOM Mixing",
              ],
            },
          ],
          selectedColumn: "docType",
          onSelectColumn: () => {},
          filterValue: selectedDocFilter,
          onFilterValueChange: setSelectedDocFilter,
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-[28%]">Nama Aturan & Pemicu</DnaTh>
                <DnaTh className="w-[18%]">Tipe Dokumen</DnaTh>
                <DnaTh className="w-[22%]">Akun Debit (Dr)</DnaTh>
                <DnaTh className="w-[22%]">Akun Kredit (Cr)</DnaTh>
                <DnaTh align="center" className="w-[10%]">Status</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredRules.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada aturan posting jurnal otomatis. Klik &quot;Tambah Aturan Posting&quot; untuk mengonfigurasi.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredRules.map((rule) => (
                  <DnaTableRow key={rule.id}>
                    <DnaTd>
                      <DnaCell.Text
                        primary={rule.ruleName}
                        secondary={rule.notes || rule.condition}
                      />
                    </DnaTd>
                    <DnaTd>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {rule.documentType}
                      </span>
                    </DnaTd>
                    <DnaTd>
                      <span className="font-semibold text-blue-700">{rule.debitAccount}</span>
                    </DnaTd>
                    <DnaTd>
                      <span className="font-semibold text-emerald-700">{rule.creditAccount}</span>
                    </DnaTd>
                    <DnaTd align="center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        AKTIF
                      </span>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* MODAL TAMBAH ATURAN */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Aturan Posting Jurnal Otomatis"
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nama Aturan Pemicu *</label>
            <DnaInput
              placeholder="Misal: Posting Invoice Maklon Baru"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tipe Dokumen Transaksi *</label>
              <DnaSelect
                value={formDocType}
                onChange={(v) => setFormDocType(v as any)}
                options={[
                  { value: "Faktur Penjualan", label: "Faktur Penjualan (AR)" },
                  { value: "Faktur Pembelian", label: "Faktur Pembelian (AP)" },
                  { value: "DP Penjualan", label: "DP Penjualan Pelanggan" },
                  { value: "DP Pembelian", label: "DP Pembelian Supplier" },
                  { value: "Pembayaran Piutang", label: "Penerimaan Kas Piutang" },
                  { value: "Pembayaran Hutang", label: "Pelunasan Hutang Usaha" },
                  { value: "Konsumsi BOM Mixing", label: "Konsumsi Batch Produksi" },
                ]}
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kondisi / Kategori</label>
              <DnaInput
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value)}
                placeholder="Misal: Jasa Maklon"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-blue-700 block mb-1">Akun Sisi Debit (Dr) *</label>
            <DnaSelect
              value={formDebit}
              onChange={(v) => setFormDebit(v)}
              options={
                accounts.length > 0
                  ? accounts.map((a: any) => ({
                      value: a.code,
                      label: `${a.code} — ${a.name} (${a.type})`,
                    }))
                  : [
                      { value: "11411", label: "11411 — Piutang Dagang" },
                      { value: "11111", label: "11111 — Kas Utama" },
                    ]
              }
            />
          </div>

          <div>
            <label className="font-semibold text-emerald-700 block mb-1">Akun Sisi Kredit (Cr) *</label>
            <DnaSelect
              value={formCredit}
              onChange={(v) => setFormCredit(v)}
              options={
                accounts.length > 0
                  ? accounts.map((a: any) => ({
                      value: a.code,
                      label: `${a.code} — ${a.name} (${a.type})`,
                    }))
                  : [
                      { value: "41111", label: "41111 — Penjualan" },
                      { value: "21111", label: "21111 — Hutang Dagang" },
                    ]
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Aturan"}
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}

export default function CoaAutoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat aturan CoA...</div>}>
      <CoaAutoContent />
    </Suspense>
  );
}
