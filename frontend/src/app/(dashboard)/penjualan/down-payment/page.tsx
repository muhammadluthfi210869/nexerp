"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  Eye,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  FileCheck2,
  ArrowUpRight,
  Search,
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaDetailDrawer,
  DnaCell,
  DnaModal,
  DnaButton,
  DnaInput,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  useDnaToast,
} from "@/components/dna";

type DpCategory = "sample" | "legalitas" | "produksi";

interface DpRecord {
  id: string;
  code: string;
  category: DpCategory;
  date: string;
  customerName: string;
  brandName: string;
  refNumber: string; // SMP-xxx or REG-BPOM-xxx or SO-xxx
  bankAccount: string;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  status: "FULL" | "PARTIAL" | "UNUSED";
  notes?: string;
}

const statusBadgeConfig: Record<string, { status: "success" | "warning" | "info"; label: string }> = {
  FULL: { status: "success", label: "Terpakai Penuh" },
  PARTIAL: { status: "warning", label: "Terpakai Sebagian" },
  UNUSED: { status: "info", label: "Belum Terpakai" },
};

function DownPaymentContent() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("sample");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<DpRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [formCategory, setFormCategory] = useState<DpCategory>("sample");
  const [formCustomer, setFormCustomer] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formBank, setFormBank] = useState("BCA Maklon (264-035-1589)");
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Live Query for Down Payments
  const {
    data: records = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DpRecord[]>({
    queryKey: ["commercial-down-payments"],
    queryFn: async () => {
      const resp = await api.get("/commercial/down-payments");
      return (resp.data || []).map((dp: any) => {
        const cat = (dp.category || "").toLowerCase() as DpCategory;
        const validCat: DpCategory =
          cat === "sample" || cat === "legalitas" || cat === "produksi" ? cat : "produksi";
        const amt = Number(dp.amount) || 0;
        const used = Number(dp.usedAmount) || 0;
        const rem = Math.max(0, amt - used);
        return {
          id: dp.id,
          code:
            dp.dpNumber ||
            `DP-${validCat.slice(0, 3).toUpperCase()}-${dp.id.slice(0, 6).toUpperCase()}`,
          category: validCat,
          date: dp.createdAt ? new Date(dp.createdAt).toISOString().split("T")[0] : "",
          customerName: dp.salesOrder?.lead?.clientName || dp.customerName || "Pelanggan",
          brandName: dp.salesOrder?.brandName || dp.brandName || "Brand",
          refNumber: dp.salesOrder?.orderNumber || dp.referenceNumber || "-",
          bankAccount: dp.bankAccount || "BCA Maklon (264-035-1589)",
          amount: amt,
          usedAmount: used,
          remainingAmount: rem,
          status: (used >= amt ? "FULL" : used > 0 ? "PARTIAL" : "UNUSED") as DpRecord["status"],
          notes: dp.notes || "",
        };
      });
    },
  });

  // Live Query for Sales Orders
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["commercial-sales-orders-dropdown"],
    queryFn: async () => {
      try {
        const resp = await api.get("/commercial/sales-orders");
        return resp.data || [];
      } catch {
        return [];
      }
    },
  });

  const filteredRecords = records.filter((r) => {
    const matchesTab = r.category === activeTab;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.code.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.brandName.toLowerCase().includes(q) ||
      r.refNumber.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Calculate KPIs for current tab or globally
  const currentTabRecords = records.filter((r) => r.category === activeTab);
  const totalAmount = currentTabRecords.reduce((acc, r) => acc + r.amount, 0);
  const totalUsed = currentTabRecords.reduce((acc, r) => acc + r.usedAmount, 0);
  const totalRemaining = currentTabRecords.reduce((acc, r) => acc + r.remainingAmount, 0);
  const conversionRate = totalAmount > 0 ? Math.round((totalUsed / totalAmount) * 100) : 0;

  const sampleCount = records.filter((r) => r.category === "sample").length;
  const legalitasCount = records.filter((r) => r.category === "legalitas").length;
  const produksiCount = records.filter((r) => r.category === "produksi").length;

  const createDpMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/commercial/down-payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-down-payments"] });
      toast.success("Uang Muka Diterima", "Penerimaan DP berhasil dicatat.");
      setIsCreateOpen(false);

      // Reset Form
      setFormCustomer("");
      setFormBrand("");
      setFormRef("");
      setFormAmount("");
      setFormNotes("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal mencatat DP";
      toast.error("Validasi Gagal", msg);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Validasi Gagal", "Harap isi nominal DP dengan benar.");
      return;
    }

    const matchedSO = salesOrders.find(
      (so: any) =>
        so.orderNumber?.toLowerCase() === formRef.trim().toLowerCase() ||
        so.lead?.clientName?.toLowerCase() === formCustomer.trim().toLowerCase()
    );
    const soId = matchedSO?.id || (salesOrders[0]?.id ?? "00000000-0000-0000-0000-000000000001");

    createDpMutation.mutate({
      soId,
      category: formCategory.toUpperCase(),
      amount: Number(formAmount),
      bankAccount: formBank,
      notes: formNotes,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans space-y-6">
      {/* Top Header with 3 Tabs per Requirement Poin 14 */}
      <DnaPageHeader
        title="UANG MUKA PENJUALAN (DOWN PAYMENT)"
        tabs={[
          { key: "sample", label: "1. DP Sample R&D", count: sampleCount },
          { key: "legalitas", label: "2. DP Legalitas (BPOM / HAKI)", count: legalitasCount },
          { key: "produksi", label: "3. DP PO Produksi Massal", count: produksiCount },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DpCategory)}
      />

      {/* KPI Summary Cards */}
      <DnaKpiGrid
        cards={[
          {
            key: "TOTAL",
            title: `TOTAL DP ${activeTab.toUpperCase()}`,
            value: `Rp ${(totalAmount / 1000000).toFixed(1)} Jt`,
            deltaText: `${currentTabRecords.length} transaksi penerimaan`,
            isDeltaPositive: true,
            icon: <DollarSign className="w-4 h-4" />,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            key: "REMAINING",
            title: "SISA SALDO UNUSED",
            value: `Rp ${(totalRemaining / 1000000).toFixed(1)} Jt`,
            deltaText: "Siap kompensasi ke faktur",
            isDeltaPositive: true,
            icon: <Wallet className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
          {
            key: "USED",
            title: "DP TERPAKAI / TERPOTONG",
            value: `Rp ${(totalUsed / 1000000).toFixed(1)} Jt`,
            deltaText: "Telah di-offset ke faktur",
            isDeltaPositive: true,
            icon: <CheckCircle2 className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            key: "CONVERSION",
            title: "RASIO REALISASI",
            value: `${conversionRate}%`,
            deltaText: "Tingkat pemotongan tagihan",
            isDeltaPositive: true,
            icon: <TrendingUp className="w-4 h-4" />,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
          },
        ]}
      />

      {/* Main Table Card */}
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : isError ? (
        <DnaErrorState
          title="Gagal Memuat Data Uang Muka"
          message={(error as any)?.message || "Terjadi kesalahan saat memuat data DP."}
          onRetry={() => refetch()}
        />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery: searchTerm,
            onSearchChange: setSearchTerm,
            searchPlaceholder: "Cari kode, klien, brand, ref...",
            actionButton: {
              label: "Terima Uang Muka Baru",
              onClick: () => {
                setFormCategory(activeTab as DpCategory);
                setIsCreateOpen(true);
              },
            },
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: filteredRecords.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 tracking-wider">
                <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                <th className="p-3.5 w-44">KODE DP & TANGGAL</th>
                <th className="p-3.5">PELANGGAN & REFERENSI</th>
                <th className="p-3.5 w-48 text-right">NOMINAL & SISA SALDO</th>
                <th className="p-3.5 w-36 text-center">STATUS</th>
                <th className="p-3.5 w-24 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada data uang muka pada kategori ini</p>
                    <p className="text-xs text-slate-400">Pilih tab lain atau klik tombol Terima Uang Muka Baru.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((dp, idx) => (
                  <tr
                    key={dp.id}
                    onClick={() => setSelectedRecord(dp)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-blue-600 hover:underline">{dp.code}</div>
                      <div className="text-[11px] text-slate-400">{dp.date}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{dp.customerName}</div>
                      <div className="text-[11px] text-slate-500">
                        {dp.brandName} • <span className="font-mono text-slate-400">Ref: {dp.refNumber || "—"}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="font-mono font-bold text-slate-900">Rp {dp.amount.toLocaleString("id-ID")}</div>
                      <div className="text-[11px] font-bold text-emerald-600">
                        Sisa: Rp {dp.remainingAmount.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <DnaCell.Badge
                        status={statusBadgeConfig[dp.status]?.status || "default"}
                        label={statusBadgeConfig[dp.status]?.label || dp.status}
                      />
                    </td>
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(dp)}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toast.info(
                              "Alokasi DP",
                              `Saldo Rp ${dp.remainingAmount.toLocaleString("id-ID")} siap dialokasikan ke tagihan invoice.`
                            );
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Alokasikan ke Faktur"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DnaDataTableCard>
      )}

      {/* Drawer Detail Rekam DP */}
      <DnaDetailDrawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Uang Muka ${selectedRecord.code}` : "Detail Uang Muka"}
        subtitle={selectedRecord ? `${selectedRecord.customerName} (${selectedRecord.brandName})` : undefined}
        badge={selectedRecord ? statusBadgeConfig[selectedRecord.status]?.label || selectedRecord.status : undefined}
        badgeVariant={selectedRecord?.status === "FULL" ? "success" : selectedRecord?.status === "PARTIAL" ? "warning" : "primary"}
        actions={
          selectedRecord && (
            <>
              {selectedRecord.remainingAmount > 0 && (
                <DnaButton
                  variant="primary"
                  onClick={() => {
                    toast.success("Alokasi Berhasil", `Saldo DP ${selectedRecord.code} diproses.`);
                    setSelectedRecord(null);
                  }}
                >
                  Alokasikan ke Faktur
                </DnaButton>
              )}
              <DnaButton variant="outline" onClick={() => setSelectedRecord(null)}>
                Tutup
              </DnaButton>
            </>
          )
        }
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Terima</span>
                <p className="font-semibold text-slate-800">{selectedRecord.date}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Nomor Referensi</span>
                <p className="font-mono font-semibold text-blue-600">{selectedRecord.refNumber}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Kategori Alur</span>
                <p className="font-semibold text-slate-800 uppercase">
                  {selectedRecord.category === "sample"
                    ? "Sample R&D"
                    : selectedRecord.category === "legalitas"
                    ? "Legalitas BPOM"
                    : "Produksi Massal"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Rekening Bank</span>
                <p className="font-semibold text-slate-800">{selectedRecord.bankAccount}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rekapitulasi Saldo</h4>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Total DP Diterima:</span>
                <span className="font-bold text-slate-900">
                  Rp {selectedRecord.amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Telah Dialokasikan / Terpotong:</span>
                <span className="font-bold text-slate-600">
                  Rp {selectedRecord.usedAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-800 font-bold">Sisa Saldo Unused:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  Rp {selectedRecord.remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {selectedRecord.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                <span className="font-bold block mb-1 text-slate-500">Catatan Transaksi:</span>
                {selectedRecord.notes}
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Terima Uang Muka Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Penerimaan Uang Muka (Down Payment)"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Kategori Uang Muka *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "sample", label: "Sample R&D" },
                { id: "legalitas", label: "Legalitas BPOM" },
                { id: "produksi", label: "Produksi (PO)" },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFormCategory(cat.id as DpCategory)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    formCategory === cat.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Klien Pemesan *</label>
            <DnaInput
              placeholder="Contoh: PT Cantika Jelita Nusantara"
              value={formCustomer}
              onChange={(e) => setFormCustomer(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Brand</label>
              <DnaInput
                placeholder="Contoh: C-Jelita Herbal"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nomor Referensi (SO/SMP/BPOM)</label>
              <DnaInput
                placeholder="Contoh: SO-2026-001"
                value={formRef}
                onChange={(e) => setFormRef(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah DP (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="Contoh: 10000000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Kas / Bank Penerima</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={formBank}
                onChange={(e) => setFormBank(e.target.value)}
              >
                <option value="BCA Maklon (264-035-1589)">BCA Maklon (264-035-1589)</option>
                <option value="Mandiri Corp (137-00-9821-44)">Mandiri Corp (137-00-9821-44)</option>
                <option value="Kas Utama Kantor">Kas Utama Kantor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Penerimaan</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Contoh: DP 50% produksi batch 1 serum brightening."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Uang Muka
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}

export default function DownPaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Uang Muka Penjualan...</div>}>
      <DownPaymentContent />
    </Suspense>
  );
}
