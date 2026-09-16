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
  useDnaToast,
} from "@/components/dna";

interface CoaAutoRule {
  id: string;
  ruleName: string;
  documentType: "Faktur Pembelian" | "Faktur Penjualan" | "DP Penjualan" | "DP Pembelian" | "Pembayaran Piutang" | "Pembayaran Hutang" | "Konsumsi BOM Mixing" | "Retur Penjualan" | "Retur Pembelian";
  condition: string; // misal "Jasa Maklon", "Jual Putus", "Bahan Baku Impor", "Semua Transaksi"
  debitAccount: string;
  creditAccount: string;
  isActive: boolean;
  notes?: string;
}

const INITIAL_RULES: CoaAutoRule[] = [
  {
    id: "rule-1",
    ruleName: "Posting Invoice Maklon Baru (AR vs Pendapatan)",
    documentType: "Faktur Penjualan",
    condition: "Kontrak Jasa Maklon",
    debitAccount: "1-1201 — Piutang Usaha Maklon",
    creditAccount: "4-1101 — Pendapatan Jasa Maklon",
    isActive: true,
    notes: "Dipicu saat Faktur Penjualan disetujui",
  },
  {
    id: "rule-2",
    ruleName: "Penerimaan Down Payment Klien (Kas vs Hutang DP)",
    documentType: "DP Penjualan",
    condition: "Semua Kategori (Sample/Produksi)",
    debitAccount: "1-1101 — Kas & Bank Operasional (BCA)",
    creditAccount: "2-1201 — Uang Muka Penjualan (DP Pelanggan)",
    isActive: true,
    notes: "Dipicu saat konfirmasi bayar DP penjualan",
  },
  {
    id: "rule-3",
    ruleName: "Pembelian Bahan Baku CPKB (Persediaan vs AP)",
    documentType: "Faktur Pembelian",
    condition: "Bahan Baku (BBK)",
    debitAccount: "1-1301 — Persediaan Bahan Baku",
    creditAccount: "2-1101 — Hutang Usaha Supplier",
    isActive: true,
    notes: "Dipicu saat Faktur Pembelian vendor divalidasi",
  },
  {
    id: "rule-4",
    ruleName: "Konsumsi BOM Mixing (WIP vs Bahan Baku)",
    documentType: "Konsumsi BOM Mixing",
    condition: "Batch Produksi Aktif",
    debitAccount: "1-1304 — Persediaan Barang Dalam Proses (WIP)",
    creditAccount: "1-1301 — Persediaan Bahan Baku",
    isActive: true,
    notes: "Dipicu saat penimbangan & mixing bahan baku",
  },
  {
    id: "rule-5",
    ruleName: "Penyelesaian Produksi / Release (Barang Jadi vs WIP)",
    documentType: "Faktur Penjualan",
    condition: "Barang Jadi Siap Kirim",
    debitAccount: "5-1101 — Beban Pokok Penjualan (HPP)",
    creditAccount: "1-1303 — Persediaan Barang Jadi (BJD)",
    isActive: true,
    notes: "Dipicu saat DO dan Gatekeeper rilis barang",
  },
];

function CoaAutoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();

  const [rules, setRules] = useState<CoaAutoRule[]>(INITIAL_RULES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocFilter, setSelectedDocFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CoaAutoRule | null>(null);

  React.useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDocType, setFormDocType] = useState<CoaAutoRule["documentType"]>("Faktur Penjualan");
  const [formCondition, setFormCondition] = useState("Semua Transaksi");
  const [formDebit, setFormDebit] = useState("1-1201 — Piutang Usaha Maklon");
  const [formCredit, setFormCredit] = useState("4-1101 — Pendapatan Jasa Maklon");

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

  const handleToggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    toast.success("Status Diperbarui", "Status rule posting otomatis berhasil diubah.");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error("Validasi Gagal", "Nama Rule wajib diisi.");
      return;
    }

    const newRule: CoaAutoRule = {
      id: `rule-${Date.now()}`,
      ruleName: formName,
      documentType: formDocType,
      condition: formCondition,
      debitAccount: formDebit,
      creditAccount: formCredit,
      isActive: true,
      notes: "Aturan posting otomatis dikonfigurasi",
    };

    setRules((prev) => [newRule, ...prev]);
    toast.success("Rule Disimpan", `Aturan auto-posting '${formName}' berhasil ditambahkan.`);
    setIsModalOpen(false);
    setFormName("");
    if (searchParams.get("action") === "create") {
      router.replace("/finance/accounting/coa-auto");
    }
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="CoA Jurnal Otomatis (Kelola CoA)"
        description="Konfigurasi Aturan Auto-Posting Debit dan Kredit per Jenis Dokumen Transaksi Operasional"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Zap className="w-3.5 h-3.5" />
            POSTING ENGINE (0.5)
          </span>
        }
        actions={
          <DnaButton
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Rule
          </DnaButton>
        }
      />

      <DnaKpiGrid
        columns={4}
        items={[
          {
            label: "TOTAL ATURAN POSTING",
            value: `${rules.length} Rule`,
            subtext: "Mencakup siklus P2P & O2C",
            icon: BookOpen,
            status: "neutral",
          },
          {
            label: "RULE AKTIF",
            value: `${rules.filter((r) => r.isActive).length} Aktif`,
            subtext: "Otomasi posting berjalan",
            icon: CheckCircle2,
            status: "success",
          },
          {
            label: "DOKUMEN TERPROTEKSI",
            value: "100%",
            subtext: "Semua transaksi wajib ada rule",
            icon: Settings2,
            status: "purple",
          },
          {
            label: "JURNAL MANUAL TERKUNCI",
            value: "Aktif",
            subtext: "Mencegah bypass kontrol internal",
            icon: ArrowRightLeft,
            status: "neutral",
          },
        ]}
      />

      <DnaDataTableCard
        title="Daftar Aturan Jurnal Otomatis (GL Auto-Posting Matrix)"
        count={filteredRules.length}
        totalItems={rules.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <DnaInput
                placeholder="Cari nama rule, akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={selectedDocFilter}
              onChange={(e) => setSelectedDocFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">Semua Jenis Dokumen</option>
              <option value="Faktur Pembelian">Faktur Pembelian</option>
              <option value="Faktur Penjualan">Faktur Penjualan</option>
              <option value="DP Penjualan">DP Penjualan</option>
              <option value="DP Pembelian">DP Pembelian</option>
              <option value="Konsumsi BOM Mixing">Konsumsi BOM Mixing</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-3.5">RULE NAME</th>
                <th className="p-3.5">DOCUMENT TYPE</th>
                <th className="p-3.5">CONDITION</th>
                <th className="p-3.5">DEBIT ACCOUNT</th>
                <th className="p-3.5">CREDIT ACCOUNT</th>
                <th className="p-3.5 text-center">ACTIVE</th>
                <th className="p-3.5 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-semibold text-slate-800">
                    {r.ruleName}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {r.documentType}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {r.condition}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-700">
                    {r.debitAccount}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-700">
                    {r.creditAccount}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(r.id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        r.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {r.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <DnaCell.Actions
                      onEdit={() => {
                        setEditingRule(r);
                        setFormName(r.ruleName);
                        setFormDocType(r.documentType);
                        setFormCondition(r.condition);
                        setFormDebit(r.debitAccount);
                        setFormCredit(r.creditAccount);
                        setIsModalOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL BUAT / EDIT RULE */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        title={editingRule ? "Sunting Aturan Auto-Posting" : "Tambah Rule Jurnal Otomatis Baru"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Aturan (Rule Name) *
            </label>
            <DnaInput
              placeholder="Contoh: Auto Jurnal Faktur Penjualan Jasa Maklon"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipe Dokumen (Document Type) *
              </label>
              <DnaSelect
                value={formDocType}
                onChange={(val) => setFormDocType(val as any)}
                options={[
                  { value: "Faktur Penjualan", label: "Faktur Penjualan" },
                  { value: "Faktur Pembelian", label: "Faktur Pembelian" },
                  { value: "DP Penjualan", label: "DP Penjualan" },
                  { value: "DP Pembelian", label: "DP Pembelian" },
                  { value: "Pembayaran Piutang", label: "Pembayaran Piutang" },
                  { value: "Pembayaran Hutang", label: "Pembayaran Hutang" },
                  { value: "Konsumsi BOM Mixing", label: "Konsumsi BOM Mixing" },
                  { value: "Retur Penjualan", label: "Retur Penjualan" },
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kondisi (Condition)
              </label>
              <DnaInput
                placeholder="misal: Jasa Maklon / Jual Putus"
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Akun Debit (Debit Account) *
            </label>
            <DnaSelect
              value={formDebit}
              onChange={(val) => setFormDebit(val)}
              options={[
                { value: "1-1201 — Piutang Usaha Maklon", label: "1-1201 — Piutang Usaha Maklon" },
                { value: "1-1101 — Kas & Bank Operasional (BCA)", label: "1-1101 — Kas & Bank Operasional (BCA)" },
                { value: "1-1301 — Persediaan Bahan Baku", label: "1-1301 — Persediaan Bahan Baku" },
                { value: "1-1304 — Persediaan Barang Dalam Proses (WIP)", label: "1-1304 — Persediaan Barang Dalam Proses (WIP)" },
                { value: "5-1101 — Beban Pokok Penjualan (HPP)", label: "5-1101 — Beban Pokok Penjualan (HPP)" },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Akun Kredit (Credit Account) *
            </label>
            <DnaSelect
              value={formCredit}
              onChange={(val) => setFormCredit(val)}
              options={[
                { value: "4-1101 — Pendapatan Jasa Maklon", label: "4-1101 — Pendapatan Jasa Maklon" },
                { value: "2-1201 — Uang Muka Penjualan (DP Pelanggan)", label: "2-1201 — Uang Muka Penjualan (DP Pelanggan)" },
                { value: "2-1101 — Hutang Usaha Supplier", label: "2-1101 — Hutang Usaha Supplier" },
                { value: "1-1301 — Persediaan Bahan Baku", label: "1-1301 — Persediaan Bahan Baku" },
                { value: "1-1303 — Persediaan Barang Jadi (BJD)", label: "1-1303 — Persediaan Barang Jadi (BJD)" },
              ]}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <DnaButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                setEditingRule(null);
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
              Simpan Rule Jurnal
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}

export default function CoaAutoManagePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Memuat CoA Jurnal Otomatis...</div>}>
      <CoaAutoContent />
    </Suspense>
  );
}
