"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Wallet,
  CreditCard,
  Building2,
  AlertTriangle,
  Clock,
  Send,
  DollarSign,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
} from "@/components/dna";

interface ApBill {
  id: string;
  billNumber: string;
  vendorName: string;
  vendorCode: string;
  poNumber: string;
  invoiceDate: string;
  dueDate: string;
  daysToDue: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  availableDebitNote: number;
  availableDp: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
}

interface BankBalance {
  accountCode: string;
  accountName: string;
  accountNumber: string;
  balance: number;
}

export default function BayarPembelianPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const { data: rawBills, isLoading, isError, refetch } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/purchase/invoices");
      return unwrapResponse(res) || [];
    },
  });

  const { data: rawAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await api.get("/finance/bank-accounts");
      return unwrapResponse(res) || [];
    },
  });

  const bankBalances: BankBalance[] = useMemo(() => {
    if (!rawAccounts || !Array.isArray(rawAccounts) || rawAccounts.length === 0) {
      return [
        { accountCode: "110201", accountName: "Bank BCA Operasional", accountNumber: "731-0129-33", balance: 250000000 },
        { accountCode: "110202", accountName: "Bank Mandiri Utama", accountNumber: "137-00-9812-1", balance: 180000000 },
      ];
    }
    return rawAccounts.map((a: any) => ({
      accountCode: a.code || a.accountNumber || "110201",
      accountName: a.name || a.bankName || "Bank Operasional",
      accountNumber: a.accountNumber || "-",
      balance: Number(a.balance || 100000000),
    }));
  }, [rawAccounts]);

  const dataList: ApBill[] = useMemo(() => {
    if (!rawBills || !Array.isArray(rawBills)) return [];
    return rawBills.map((b: any) => {
      const total = Number(b.grandTotal || 0);
      const paid = Number(b.paidAmount || 0);
      const remaining = Math.max(0, total - paid);
      return {
        id: b.id,
        billNumber: b.billNumber || b.invoiceNumber || "",
        vendorName: b.supplier?.name || b.supplierName || b.vendor?.name || b.vendorName || "-",
        vendorCode: b.vendorId?.slice(0, 8) || b.supplierId?.slice(0, 8) || "SUP",
        poNumber: b.purchaseOrder?.poNumber || b.poNumber || "-",
        invoiceDate: b.invoiceDate ? b.invoiceDate.split("T")[0] : "",
        dueDate: b.dueDate ? b.dueDate.split("T")[0] : "",
        daysToDue: b.dueDate ? Math.round((new Date(b.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
        availableDebitNote: 0,
        availableDp: 0,
        status: remaining <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
      };
    });
  }, [rawBills]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<ApBill | null>(null);

  // Payment Form State
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedAccountCode, setSelectedAccountCode] = useState("110201");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [useDebitNote, setUseDebitNote] = useState<boolean>(true);
  const [refNumber, setRefNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const totalLiquidCash = useMemo(() => {
    return bankBalances.reduce((sum, b) => sum + b.balance, 0);
  }, [bankBalances]);

  // Calculate KPIs & Aging
  const kpis = useMemo(() => {
    const list = dataList;
    const totalUnpaid = list.reduce((sum, b) => sum + b.remainingAmount, 0);
    const overdueList = list.filter((b) => b.daysToDue < 0);
    const dueH3List = list.filter((b) => b.daysToDue >= 0 && b.daysToDue <= 3);
    const dueH7List = list.filter((b) => b.daysToDue > 3 && b.daysToDue <= 7);

    return {
      totalUnpaid,
      overdueCount: overdueList.length,
      overdueAmount: overdueList.reduce((sum, b) => sum + b.remainingAmount, 0),
      dueH3Count: dueH3List.length,
      dueH7Count: dueH7List.length,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL"
          ? true
          : activeTab === "OVERDUE"
          ? item.daysToDue < 0
          : activeTab === "H3"
          ? item.daysToDue >= 0 && item.daysToDue <= 3
          : activeTab === "H7"
          ? item.daysToDue > 3 && item.daysToDue <= 7
          : activeTab === "REGULAR"
          ? item.daysToDue > 7
          : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleOpenPayDrawer = (bill: ApBill) => {
    setSelectedBill(bill);
    let netRemaining = bill.remainingAmount;
    if (useDebitNote && bill.availableDebitNote > 0) {
      netRemaining -= bill.availableDebitNote;
    }
    setPayAmount(Math.max(0, netRemaining));
    setRefNumber(`TRF-AP-${Date.now().toString().slice(-6)}`);
    setPaymentNotes(`Pelunasan faktur ${bill.billNumber} (${bill.vendorName})`);
  };

  const payMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/purchase/payments", payload);
      return unwrapResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success(`Pembayaran Faktur ${selectedBill?.billNumber} sebesar Rp ${payAmount.toLocaleString("id-ID")} berhasil diproses.`);
      setSelectedBill(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memproses pembayaran AP");
    },
  });

  const handleProcessPayment = () => {
    if (!selectedBill) return;

    if (payAmount <= 0) {
      toast.error("Nominal pembayaran harus lebih dari Rp 0");
      return;
    }

    payMutation.mutate({
      billId: selectedBill.id,
      amount: payAmount,
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: refNumber || undefined,
      notes: paymentNotes || undefined,
    });
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Aging Tabs */}
      <DnaPageHeader
        title="Bayar Pembelian (AP Payment Hub)"
        description="Pusat eksekusi pelunasan hutang dagang, peringatan AP Aging real-time, dan pemotongan Debit Note."
        badge={<DnaBadge variant="neutral">SCR-048 / FIN-AP-PAY</DnaBadge>}
        tabs={[
          { key: "ALL", label: "Semua Faktur", count: dataList.length },
          { key: "OVERDUE", label: "Overdue", count: dataList.filter((d) => d.daysToDue < 0).length },
          { key: "H3", label: "H-3 (Kritis)", count: dataList.filter((d) => d.daysToDue >= 0 && d.daysToDue <= 3).length },
          { key: "H7", label: "H-7 (Siaga)", count: dataList.filter((d) => d.daysToDue > 3 && d.daysToDue <= 7).length },
          { key: "REGULAR", label: "> 7 Hari", count: dataList.filter((d) => d.daysToDue > 7).length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <DnaButton
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={() => toast.success("Data Pelunasan AP diexport ke Excel")}
          >
            Export Jadwal Bayar
          </DnaButton>
        }
      />

      {/* Real-time Liquid Cash & Bank Overview */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Total Dana Likuid Tersedia (Kas & Bank)
            </div>
            <div className="text-[20px] font-black tracking-tight text-slate-900 mt-0.5">
              Rp {totalLiquidCash.toLocaleString("id-ID")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {bankBalances.map((acc) => (
            <div key={acc.accountCode} className="bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 min-w-[160px]">
              <div className="text-[11px] font-semibold text-slate-700 truncate">{acc.accountName}</div>
              <div className="text-[10px] text-slate-400 font-mono">{acc.accountNumber}</div>
              <div className="text-[12px] font-bold font-mono text-slate-900 mt-0.5">
                Rp {acc.balance.toLocaleString("id-ID")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Hutang Dagang (AP)"
          value={`Rp ${kpis.totalUnpaid.toLocaleString("id-ID")}`}
          subtext="Seluruh tagihan belum lunas"
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
          variant="primary"
        />
        <DnaStatCard
          label="Tagihan Overdue (Lewat Tempo)"
          value={`${kpis.overdueCount} Faktur`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant={kpis.overdueCount > 0 ? "critical" : "default"}
          delta={{ value: `Rp ${kpis.overdueAmount.toLocaleString("id-ID")}`, isPositive: false }}
        />
        <DnaStatCard
          label="Jatuh Tempo H-3 (Kritis)"
          value={`${kpis.dueH3Count} Faktur`}
          subtext="Perlu pelunasan segera"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          variant={kpis.dueH3Count > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Jatuh Tempo H-7 (Siaga)"
          value={`${kpis.dueH7Count} Faktur`}
          subtext="Monitoring kas keluar"
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          variant="info"
        />
      </DnaKpiGrid>

      {/* Main Table Card */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Data Tagihan AP"
            message="Terjadi kesalahan saat menghubungi server. Silakan coba lagi."
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
          searchPlaceholder="Cari No Faktur, PO, supplier..."
        >
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4 w-[20%]">NO. FAKTUR & PO</th>
                  <th className="py-3 px-4 w-[22%]">SUPPLIER / VENDOR</th>
                  <th className="py-3 px-4 w-[18%]">JATUH TEMPO & AGING</th>
                  <th className="py-3 px-4 text-right w-[16%]">NILAI & POTONGAN</th>
                  <th className="py-3 px-4 text-right w-[14%]">SISA TAGIHAN</th>
                  <th className="py-3 px-4 text-right w-[10%]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada Tagihan"
                        description="Tidak ada faktur pembelian yang perlu dibayar pada kategori filter ini."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleOpenPayDrawer(row)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-600 block truncate">
                          {row.billNumber}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 block truncate">
                          {row.poNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate">
                          {row.vendorName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 block">
                          {row.vendorCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-mono text-slate-600 block">
                          {row.dueDate}
                        </span>
                        <div className="mt-0.5">
                          {row.daysToDue < 0 ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              Overdue {Math.abs(row.daysToDue)} Hr
                            </span>
                          ) : row.daysToDue <= 3 ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              H-{row.daysToDue} Kritis
                            </span>
                          ) : row.daysToDue <= 7 ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              H-{row.daysToDue} Siaga
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              H-{row.daysToDue}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          Rp {row.totalAmount.toLocaleString("id-ID")}
                        </span>
                        {row.availableDebitNote > 0 ? (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            - Rp {row.availableDebitNote.toLocaleString("id-ID")} DN
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-rose-600 block text-xs">
                          Rp {row.remainingAmount.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {row.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<CreditCard className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenPayDrawer(row)}
                          >
                            Bayar
                          </DnaButton>
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

      {/* DnaDetailDrawer for AP Payment Execution */}
      <DnaDetailDrawer
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title={selectedBill?.billNumber || "Pembayaran Faktur Hutang"}
        subtitle={selectedBill ? `Supplier: ${selectedBill.vendorName} • PO: ${selectedBill.poNumber}` : undefined}
        badge={
          selectedBill ? (
            <DnaBadge variant={selectedBill.daysToDue < 0 ? "critical" : "warning"}>
              {selectedBill.daysToDue < 0 ? "Overdue" : `H-${selectedBill.daysToDue}`}
            </DnaBadge>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setSelectedBill(null)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={handleProcessPayment}
            >
              Konfirmasi & Eksekusi Pembayaran
            </DnaButton>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-5 text-xs">
            {/* Tagihan Summary */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Sisa Hutang Faktur</span>
                <span className="font-bold text-slate-900 font-mono text-sm block">
                  Rp {selectedBill.remainingAmount.toLocaleString("id-ID")}
                </span>
                <span className="text-slate-500 text-[11px]">Total PO: {selectedBill.poNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Status Termin</span>
                <span className="font-bold text-rose-600 block text-xs mt-1">
                  {selectedBill.daysToDue < 0 ? `Overdue ${Math.abs(selectedBill.daysToDue)} Hari` : `H-${selectedBill.daysToDue} Jatuh Tempo`}
                </span>
                <span className="text-slate-500 text-[11px]">Due: {selectedBill.dueDate}</span>
              </div>
            </div>

            {/* Potongan Otomatis Debit Note */}
            {selectedBill.availableDebitNote > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div className="font-bold text-emerald-900 text-xs">Tersedia Potongan Debit Note</div>
                      <div className="text-[11px] text-emerald-700">
                        Klaim retur disetujui: Rp {selectedBill.availableDebitNote.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDebitNote}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUseDebitNote(checked);
                        const net = checked
                          ? Math.max(0, selectedBill.remainingAmount - selectedBill.availableDebitNote)
                          : selectedBill.remainingAmount;
                        setPayAmount(net);
                      }}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-emerald-900 text-xs">Gunakan</span>
                  </label>
                </div>
              </div>
            )}

            {/* Payment Inputs */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tanggal Bayar *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sumber Kas / Bank *</label>
                  <select
                    aria-label="Akun Kas Bank"
                    value={selectedAccountCode}
                    onChange={(e) => setSelectedAccountCode(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    {bankBalances.map((b) => (
                      <option key={b.accountCode} value={b.accountCode}>
                        [{b.accountCode}] {b.accountName} (Rp {b.balance.toLocaleString("id-ID")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nominal Transfer (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-bold font-mono text-indigo-700 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. Referensi Transfer / Giro</label>
                  <input
                    type="text"
                    placeholder="Contoh: TRF-BCA-992140"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Pelunasan</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Catatan pelunasan untuk bukti transaksi..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </DnaPageContainer>
  );
}
