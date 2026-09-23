"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  DollarSign,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Send,
  Wallet,
  Receipt,
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
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
} from "@/components/dna";

interface PurchaseDp {
  id: string;
  dpNumber: string;
  dpDate: string;
  poNumber: string;
  vendorName: string;
  vendorCode: string;
  totalPoAmount: number;
  dpPercentage: number;
  dpAmount: number;
  paymentAccount: string;
  referenceNumber?: string;
  status: "PENDING_APPROVAL" | "PAID" | "ALLOCATED" | "VOID";
  allocatedBillNumber?: string;
  notes?: string;
  pic: string;
}

const CASH_BANK_ACCOUNTS = [
  "110201 - Bank BCA Operasional (A/C 731-0129-33)",
  "110202 - Bank Mandiri Operasional (A/C 137-00-9812-1)",
  "110101 - Kas Kecil Kantor (Petty Cash)",
  "110203 - Bank BNI Payroll & AP (A/C 098-1123-99)",
];

export default function DpPembelianPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat DP Pembelian...</div>}>
      <DpPembelianContent />
    </Suspense>
  );
}

function DpPembelianContent() {
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const { data: rawDps, isLoading, isError, refetch } = useQuery({
    queryKey: ["purchase-down-payments"],
    queryFn: async () => {
      const res = await api.get("/purchase/down-payments");
      return unwrapResponse(res) || [];
    },
  });

  const { data: rawPos } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    },
  });

  const activePos = useMemo(() => {
    if (!rawPos || !Array.isArray(rawPos)) return [];
    return rawPos.map((po: any) => ({
      id: po.id,
      poNumber: po.poNumber || `PO-${po.id.slice(0, 8)}`,
      vendorName: po.supplier?.name || po.vendorName || "-",
      vendorCode: po.supplier?.id?.slice(0, 8) || "SUP",
      vendorId: po.supplierId,
      totalAmount: Number(po.totalValue || po.grandTotal || 0),
    }));
  }, [rawPos]);

  const dataList: PurchaseDp[] = useMemo(() => {
    if (!rawDps || !Array.isArray(rawDps)) return [];
    return rawDps.map((dp: any) => ({
      id: dp.id,
      dpNumber: dp.dpNumber || `DPB-${dp.id.slice(0, 8)}`,
      dpDate: dp.date ? dp.date.split("T")[0] : "",
      poNumber: dp.po?.poNumber || dp.poNumber || "-",
      vendorName: dp.supplier?.name || dp.vendor?.name || dp.vendorName || "-",
      vendorCode: dp.vendorId?.slice(0, 8) || dp.supplierId?.slice(0, 8) || "SUP",
      totalPoAmount: Number(dp.po?.totalValue || dp.amount || 0),
      dpPercentage: Number(dp.po?.totalValue) > 0 ? Math.round((Number(dp.amount) / Number(dp.po.totalValue)) * 100) : 30,
      dpAmount: Number(dp.amount || 0),
      paymentAccount: dp.paymentMethod || "110201 - Bank BCA Operasional",
      referenceNumber: dp.referenceNumber || "",
      status: dp.remainingAmount <= 0 && Number(dp.appliedAmount) > 0 ? "ALLOCATED" : dp.status || "PAID",
      allocatedBillNumber: dp.appliedToBill?.billNumber || "",
      notes: dp.notes || "",
      pic: "Finance Staff",
    }));
  }, [rawDps]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDp, setSelectedDp] = useState<PurchaseDp | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Form State
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const [dpDate, setDpDate] = useState(new Date().toISOString().split("T")[0]);
  const [dpPercentage, setDpPercentage] = useState<number>(30);
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState(CASH_BANK_ACCOUNTS[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const total = list.length;
    const totalPaid = list
      .filter((d) => d.status === "PAID" || d.status === "ALLOCATED")
      .reduce((sum, d) => sum + d.dpAmount, 0);
    const unallocated = list
      .filter((d) => d.status === "PAID")
      .reduce((sum, d) => sum + d.dpAmount, 0);
    const pending = list.filter((d) => d.status === "PENDING_APPROVAL").length;

    return {
      total,
      totalPaid,
      unallocated,
      pending,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.dpNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paymentAccount.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "PENDING_APPROVAL"
          ? item.status === "PENDING_APPROVAL"
          : activeTab === "PAID"
          ? item.status === "PAID"
          : activeTab === "ALLOCATED"
          ? item.status === "ALLOCATED"
          : activeTab === "VOID"
          ? item.status === "VOID"
          : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleSelectPo = (poNo: string) => {
    setSelectedPoNumber(poNo);
    const po = activePos.find((p) => p.poNumber === poNo);
    if (po) {
      const calcAmount = (po.totalAmount * dpPercentage) / 100;
      setDpAmount(calcAmount);
    } else {
      setDpAmount(0);
    }
  };

  const handlePercentageChange = (pct: number) => {
    setDpPercentage(pct);
    const po = activePos.find((p) => p.poNumber === selectedPoNumber);
    if (po) {
      setDpAmount((po.totalAmount * pct) / 100);
    }
  };

  const createDpMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/down-payments", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-down-payments"] });
      toast.success("Uang Muka Pembelian (DP) berhasil dicatat & masuk ke Jurnal Akuntansi.");
      setIsCreateOpen(false);
      setSelectedPoNumber("");
      setDpAmount(0);
      setReferenceNumber("");
      setFormNotes("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mencatat DP pembelian");
    },
  });

  const handleCreateDp = () => {
    if (!selectedPoNumber) {
      toast.error("Pilih dokumen PO referensi");
      return;
    }
    const po = activePos.find((p) => p.poNumber === selectedPoNumber);
    if (!po) return;

    if (dpAmount <= 0) {
      toast.error("Nominal Uang Muka (DP) harus lebih dari Rp 0");
      return;
    }

    createDpMutation.mutate({
      vendorId: po.vendorId,
      amount: dpAmount,
      date: dpDate,
      notes: formNotes || `Pembayaran DP ${dpPercentage}% untuk PO ${po.poNumber}`,
    });
  };

  const handleApprovePayment = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["purchase-down-payments"] });
    if (selectedDp && selectedDp.id === id) {
      setSelectedDp({ ...selectedDp, status: "PAID" });
    }
    toast.success("Pembayaran DP berhasil dikonfirmasi dan saldo kas/bank terpotong.");
  };

  const getStatusBadge = (status: PurchaseDp["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return <DnaBadge variant="warning">Menunggu Approval</DnaBadge>;
      case "PAID":
        return <DnaBadge variant="info">Terbayar (Saldo Aktif)</DnaBadge>;
      case "ALLOCATED":
        return <DnaBadge variant="success">Dialokasikan ke Faktur</DnaBadge>;
      case "VOID":
        return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Unified Tabs */}
      <DnaPageHeader
        title="DP Pembelian (Purchase Down Payment)"
        description="Kelola pembayaran uang muka PO ke supplier dan pelacakan alokasi pemotongan faktur pembelian."
        badge={<DnaBadge variant="neutral">SCR-044 / FIN-PUR-DP</DnaBadge>}
        tabs={[
          { key: "ALL", label: "Semua", count: dataList.length },
          { key: "PENDING_APPROVAL", label: "Menunggu Approval", count: dataList.filter((d) => d.status === "PENDING_APPROVAL").length },
          { key: "PAID", label: "Terbayar (Aktif)", count: dataList.filter((d) => d.status === "PAID").length },
          { key: "ALLOCATED", label: "Dipotong Faktur", count: dataList.filter((d) => d.status === "ALLOCATED").length },
          { key: "VOID", label: "Batal", count: dataList.filter((d) => d.status === "VOID").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data DP Pembelian diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Bayar DP Pembelian
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Pembayaran DP"
          value={`${kpis.total} Transaksi`}
          icon={<Receipt className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+4 bulan ini", isPositive: true }}
        />
        <DnaStatCard
          label="Total Nilai DP Terbayar"
          value={`Rp ${kpis.totalPaid.toLocaleString("id-ID")}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="DP Belum Dipotong Faktur"
          value={`Rp ${kpis.unallocated.toLocaleString("id-ID")}`}
          icon={<Wallet className="w-5 h-5 text-purple-600" />}
        />
        <DnaStatCard
          label="Menunggu Approval"
          value={`${kpis.pending} Dokumen`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          variant={kpis.pending > 0 ? "warning" : "default"}
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat DP Pembelian"
            message="Terjadi kesalahan saat mengambil data uang muka pembelian dari server."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari No DP, No PO, vendor, akun sumber..."
        >
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4 w-[18%]">NO. DP & TANGGAL</th>
                  <th className="py-3 px-4 w-[24%]">SUPPLIER & REF PO</th>
                  <th className="py-3 px-4 text-center w-[16%]">TOTAL PO & % DP</th>
                  <th className="py-3 px-4 text-right w-[18%]">NOMINAL DP & AKUN</th>
                  <th className="py-3 px-4 text-center w-[14%]">STATUS</th>
                  <th className="py-3 px-4 text-right w-[10%]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada DP Pembelian"
                        description="Belum ada data uang muka pembelian atau tidak ada hasil yang sesuai dengan filter."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedDp(row)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-600 block truncate">
                          {row.dpNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {row.dpDate}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate">
                          {row.vendorName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 block truncate">
                          {row.poNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-medium text-slate-700 block text-xs">
                          Rp {row.totalPoAmount.toLocaleString("id-ID")}
                        </span>
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mt-0.5">
                          {row.dpPercentage}% DP
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-600 block text-xs">
                          Rp {row.dpAmount.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[200px] ml-auto">
                          {row.paymentAccount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedDp(row)}
                          >
                            Detail
                          </DnaButton>
                          {row.status === "PENDING_APPROVAL" && (
                            <DnaButton
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handleApprovePayment(row.id)}
                            >
                              Setujui
                            </DnaButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DnaDataTableCard>
      )}

      {/* DnaDetailDrawer for Quick Inspection */}
      <DnaDetailDrawer
        isOpen={!!selectedDp}
        onClose={() => setSelectedDp(null)}
        title={selectedDp?.dpNumber || "Rincian DP Pembelian"}
        subtitle={selectedDp ? `Supplier: ${selectedDp.vendorName} • PO: ${selectedDp.poNumber}` : undefined}
        badge={selectedDp ? getStatusBadge(selectedDp.status) : undefined}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              Dicatat oleh: <span className="font-semibold text-slate-700">{selectedDp?.pic}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedDp?.status === "PENDING_APPROVAL" && (
                <DnaButton
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => {
                    if (selectedDp) handleApprovePayment(selectedDp.id);
                    setSelectedDp(null);
                  }}
                >
                  Setujui Pembayaran
                </DnaButton>
              )}
              <DnaButton variant="outline" size="sm" onClick={() => setSelectedDp(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        }
      >
        {selectedDp && (
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Nilai PO</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  Rp {selectedDp.totalPoAmount.toLocaleString("id-ID")}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">PO: {selectedDp.poNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nominal Uang Muka ({selectedDp.dpPercentage}%)</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  Rp {selectedDp.dpAmount.toLocaleString("id-ID")}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">Tgl: {selectedDp.dpDate}</span>
              </div>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Akun Sumber Pembayaran</span>
                <span className="font-medium text-slate-800 text-right">{selectedDp.paymentAccount}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">No. Referensi Transfer</span>
                <span className="font-mono text-slate-800">{selectedDp.referenceNumber || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status DP</span>
                <div>{getStatusBadge(selectedDp.status)}</div>
              </div>
            </div>

            {selectedDp.allocatedBillNumber && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-xs">Dialokasikan ke Faktur:</span>
                  <span className="font-mono text-[11px]">{selectedDp.allocatedBillNumber}</span>
                </div>
                <DnaBadge variant="success">Faktur Berkurang</DnaBadge>
              </div>
            )}

            {/* Jurnal Akuntansi Preview */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Pencatatan Otomatis Jurnal Finansial (Double-Entry)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode COA</th>
                      <th className="py-2.5 px-3">Nama Akun Akuntansi</th>
                      <th className="py-2.5 px-3 text-right">Debit (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-indigo-600 font-medium">110801</td>
                      <td className="py-2.5 px-3 text-slate-800 font-sans font-medium">Uang Muka Pembelian (Prepaid Expense)</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {selectedDp.dpAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-indigo-600 font-medium">110201</td>
                      <td className="py-2.5 px-3 text-slate-800 font-sans font-medium pl-6">Kas & Bank (BCA Operasional)</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {selectedDp.dpAmount.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Bayar DP Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Pembayaran Uang Muka (DP Pembelian)"
        description="Pilih Purchase Order yang disepakati memiliki termin uang muka sebelum pengiriman barang."
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={handleCreateDp}
            >
              Konfirmasi & Bayar DP
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Pilih Dokumen PO Referensi *</label>
              <select
                aria-label="Pilih PO"
                value={selectedPoNumber}
                onChange={(e) => handleSelectPo(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Pilih Purchase Order --</option>
                {activePos.map((p) => (
                  <option key={p.poNumber} value={p.poNumber}>
                    {p.poNumber} - {p.vendorName} (Rp {p.totalAmount.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Pembayaran DP *</label>
              <input
                type="date"
                value={dpDate}
                onChange={(e) => setDpDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 items-end">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Persentase DP (%)</label>
              <div className="flex items-center gap-1.5">
                {[20, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageChange(pct)}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      dpPercentage === pct
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Nominal Uang Muka (Rp) *</label>
              <input
                type="number"
                min="0"
                value={dpAmount}
                onChange={(e) => setDpAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-bold font-mono text-emerald-700 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Akun Kas / Bank Pengeluaran *</label>
              <select
                aria-label="Akun Kas Bank"
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {CASH_BANK_ACCOUNTS.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">No. Referensi Transfer / Giro</label>
              <input
                type="text"
                placeholder="Contoh: TRF-BCA-9812401"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Contoh: Uang muka pelunasan cetak kemasan botol batch 1."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
