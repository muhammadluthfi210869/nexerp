"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Wallet,
  CreditCard,
  Building2,
  Receipt,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  Plus,
  Clock,
  Send,
  Eye,
  DollarSign,
  FileSpreadsheet,
  AlertCircle,
  RotateCcw
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
  useDnaToast
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

const INITIAL_BANK_BALANCES: BankBalance[] = [
  {
    accountCode: "110201",
    accountName: "Bank BCA Operasional",
    accountNumber: "731-0129-33",
    balance: 245800000
  },
  {
    accountCode: "110202",
    accountName: "Bank Mandiri Utama",
    accountNumber: "137-00-9812-1",
    balance: 180500000
  },
  {
    accountCode: "110101",
    accountName: "Kas Kecil (Petty Cash)",
    accountNumber: "KAS-KECIL-01",
    balance: 12450000
  }
];

const INITIAL_AP_BILLS: ApBill[] = [
  {
    id: "ap-1",
    billNumber: "FP-202608-000088",
    vendorName: "PT Aroma Alam Lestari",
    vendorCode: "SUP-0008",
    poNumber: "PO-202608-000015",
    invoiceDate: "2026-08-20",
    dueDate: "2026-09-03",
    daysToDue: -6,
    totalAmount: 13875000,
    paidAmount: 0,
    remainingAmount: 13875000,
    availableDebitNote: 2500000,
    availableDp: 0,
    status: "UNPAID"
  },
  {
    id: "ap-2",
    billNumber: "FP-202609-000005",
    vendorName: "PT Kemasan Jaya Makmur",
    vendorCode: "SUP-0004",
    poNumber: "PO-202608-000029",
    invoiceDate: "2026-08-28",
    dueDate: "2026-09-11",
    daysToDue: 2,
    totalAmount: 22400000,
    paidAmount: 0,
    remainingAmount: 22400000,
    availableDebitNote: 4200000,
    availableDp: 0,
    status: "UNPAID"
  },
  {
    id: "ap-3",
    billNumber: "FP-202609-000007",
    vendorName: "PT Chemindo Resins Global",
    vendorCode: "SUP-0007",
    poNumber: "PO-202608-000040",
    invoiceDate: "2026-09-01",
    dueDate: "2026-09-15",
    daysToDue: 6,
    totalAmount: 18500000,
    paidAmount: 5000000,
    remainingAmount: 13500000,
    availableDebitNote: 0,
    availableDp: 0,
    status: "PARTIAL"
  },
  {
    id: "ap-4",
    billNumber: "FP-202609-000001",
    vendorName: "PT Sumber Organik Nusantara",
    vendorCode: "SUP-0012",
    poNumber: "PO-202608-000033",
    invoiceDate: "2026-08-31",
    dueDate: "2026-09-30",
    daysToDue: 21,
    totalAmount: 16095000,
    paidAmount: 0,
    remainingAmount: 16095000,
    availableDebitNote: 3750000,
    availableDp: 0,
    status: "UNPAID"
  }
];

export default function BayarPembelianPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<ApBill[]>(INITIAL_AP_BILLS);
  const [bankBalances] = useState<BankBalance[]>(INITIAL_BANK_BALANCES);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<ApBill | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Payment Form State
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedAccountCode, setSelectedAccountCode] = useState("110201");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [useDebitNote, setUseDebitNote] = useState<boolean>(true);
  const [useDp, setUseDp] = useState<boolean>(true);
  const [refNumber, setRefNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Calculate Total Liquid Balance (Poin 11)
  const totalLiquidCash = useMemo(() => {
    return bankBalances.reduce((sum, b) => sum + b.balance, 0);
  }, [bankBalances]);

  // Calculate KPIs & Aging (Poin 10)
  const kpis = useMemo(() => {
    const list = dataList;
    const totalUnpaid = list.reduce((sum, b) => sum + b.remainingAmount, 0);
    const overdueList = list.filter(b => b.daysToDue < 0);
    const dueH3List = list.filter(b => b.daysToDue >= 0 && b.daysToDue <= 3);
    const dueH7List = list.filter(b => b.daysToDue > 3 && b.daysToDue <= 7);

    return {
      totalUnpaid,
      overdueCount: overdueList.length,
      overdueAmount: overdueList.reduce((sum, b) => sum + b.remainingAmount, 0),
      dueH3Count: dueH3List.length,
      dueH7Count: dueH7List.length
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "OVERDUE" ? item.daysToDue < 0 :
        activeTab === "H3" ? (item.daysToDue >= 0 && item.daysToDue <= 3) :
        activeTab === "H7" ? (item.daysToDue > 3 && item.daysToDue <= 7) :
        activeTab === "REGULAR" ? item.daysToDue > 7 : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  // Open Payment Modal
  const handleOpenPayModal = (bill: ApBill) => {
    setSelectedBill(bill);
    let netRemaining = bill.remainingAmount;
    if (useDebitNote && bill.availableDebitNote > 0) {
      netRemaining -= bill.availableDebitNote;
    }
    if (useDp && bill.availableDp > 0) {
      netRemaining -= bill.availableDp;
    }
    setPayAmount(Math.max(0, netRemaining));
    setRefNumber(`TRF-AP-${Date.now().toString().slice(-6)}`);
    setPaymentNotes(`Pelunasan faktur ${bill.billNumber} (${bill.vendorName})`);
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = () => {
    if (!selectedBill) return;

    if (payAmount <= 0) {
      toast.error("Nominal pembayaran harus lebih dari Rp 0");
      return;
    }

    const debitDeduction = useDebitNote ? selectedBill.availableDebitNote : 0;
    const dpDeduction = useDp ? selectedBill.availableDp : 0;
    const totalDeducted = payAmount + debitDeduction + dpDeduction;

    const newRemaining = Math.max(0, selectedBill.remainingAmount - totalDeducted);
    const newStatus: ApBill["status"] = newRemaining === 0 ? "PAID" : "PARTIAL";

    setDataList(dataList.map(b => {
      if (b.id === selectedBill.id) {
        return {
          ...b,
          paidAmount: b.paidAmount + totalDeducted,
          remainingAmount: newRemaining,
          status: newStatus,
          availableDebitNote: useDebitNote ? 0 : b.availableDebitNote,
          availableDp: useDp ? 0 : b.availableDp
        };
      }
      return b;
    }));

    setIsPayModalOpen(false);
    toast.success(`Pembayaran Faktur ${selectedBill.billNumber} sebesar Rp ${payAmount.toLocaleString("id-ID")} berhasil diproses.`);
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Bayar Pembelian (AP Payment Hub)"
        description="Pusat eksekusi pelunasan hutang dagang, peringatan AP Aging real-time, dan pemotongan Debit Note."
        badge={<DnaBadge variant="neutral">SCR-048 / FIN-AP-PAY</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Pelunasan AP diexport ke Excel")}
            >
              Export Jadwal Bayar
            </DnaButton>
          </div>
        }
      />

      {/* Poin 11: Real-time Saldo Bank Cards Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-4 text-white shadow-sm border border-slate-800 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-indigo-400" />
              Poin 11: Real-Time Saldo Likuiditas Kas & Bank
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              Rp {totalLiquidCash.toLocaleString("id-ID")}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">Total dana tersedia untuk alokasi pelunasan hutang supplier</div>
          </div>

          {/* Individual Bank Breakdown */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {bankBalances.map((acc) => (
              <div key={acc.accountCode} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-w-[200px]">
                <div className="text-xs font-semibold text-white truncate">{acc.accountName}</div>
                <div className="text-[11px] text-slate-300 font-mono">{acc.accountNumber}</div>
                <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
                  Rp {acc.balance.toLocaleString("id-ID")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards (Poin 10: AP Aging Alert Matrix) */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Hutang Dagang (AP)"
          value={`Rp ${kpis.totalUnpaid.toLocaleString("id-ID")}`}
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="Tagihan Overdue (Lewat Tempo)"
          value={`${kpis.overdueCount} Faktur`}
          icon={<AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />}
          variant="critical"
          delta={{ value: `Rp ${kpis.overdueAmount.toLocaleString("id-ID")}`, isPositive: false }}
        />
        <DnaStatCard
          label="Jatuh Tempo H-3 (High Alert)"
          value={`${kpis.dueH3Count} Faktur`}
          icon={<Clock className="w-5 h-5 text-red-500" />}
          variant="warning"
        />
        <DnaStatCard
          label="Jatuh Tempo H-7 (Siaga)"
          value={`${kpis.dueH7Count} Faktur`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
      </DnaKpiGrid>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua Faktur", count: dataList.length },
            { id: "OVERDUE", label: "Overdue (Terlambat)", count: dataList.filter(d => d.daysToDue < 0).length },
            { id: "H3", label: "H-3 Merah (Kritis)", count: dataList.filter(d => d.daysToDue >= 0 && d.daysToDue <= 3).length },
            { id: "H7", label: "H-7 Kuning (Siaga)", count: dataList.filter(d => d.daysToDue > 3 && d.daysToDue <= 7).length },
            { id: "REGULAR", label: "> 7 Hari", count: dataList.filter(d => d.daysToDue > 7).length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Tagihan Hutang Siap Bayar"
        description="Filter berdasarkan AP Aging (Overdue, H-3, H-7) untuk memprioritaskan jadwal pengeluaran kas."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No Faktur, PO, supplier..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Status Aging (Poin 10)</th>
                <th className="py-3 px-4 text-right">Nilai Faktur</th>
                <th className="py-3 px-4 text-right">Potongan Retur/DP</th>
                <th className="py-3 px-4 text-right">Sisa Tagihan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                    Tidak ada faktur pembelian yang perlu dibayar pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => {
                  const hasDebitNote = row.availableDebitNote > 0;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                        {row.billNumber}
                        <div className="text-[11px] text-slate-400 font-normal font-sans">{row.poNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                        <div>{row.vendorName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{row.vendorCode}</div>
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap font-medium text-slate-800">
                        {row.dueDate}
                      </td>
                      {/* Poin 10: AP Aging Visual Matrix */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.daysToDue < 0 ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Overdue {Math.abs(row.daysToDue)} Hari
                          </span>
                        ) : row.daysToDue <= 3 ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            H-{row.daysToDue} Jatuh Tempo
                          </span>
                        ) : row.daysToDue <= 7 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            H-{row.daysToDue} Jatuh Tempo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs">
                            H-{row.daysToDue} (Aman)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono font-medium text-slate-700">
                        Rp {row.totalAmount.toLocaleString("id-ID")}
                      </td>
                      {/* Potongan Retur / DP */}
                      <td className="py-3 px-4 text-right text-xs font-mono">
                        {hasDebitNote ? (
                          <div className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block">
                            - Rp {row.availableDebitNote.toLocaleString("id-ID")}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono font-bold text-slate-900">
                        Rp {row.remainingAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <DnaButton
                          variant="primary"
                          size="sm"
                          icon={<CreditCard className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenPayModal(row)}
                        >
                          Bayar Tagihan
                        </DnaButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Bayar Faktur (Poin 12: Potongan Retur & DP) */}
      {selectedBill && (
        <DnaModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Pembayaran Faktur: ${selectedBill.billNumber}`}
          description={`Pelunasan tagihan supplier ${selectedBill.vendorName}`}
          size="xl"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <DnaButton variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>
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
          <div className="space-y-4 text-xs">
            {/* Summary Tagihan */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Total Tagihan Bruto</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  Rp {selectedBill.remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Aging</span>
                <div className="mt-1 font-bold text-red-600">
                  {selectedBill.daysToDue < 0 ? `Overdue ${Math.abs(selectedBill.daysToDue)} Hari` : `H-${selectedBill.daysToDue} Jatuh Tempo`}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block">No. PO Asal</span>
                <span className="font-bold text-indigo-600 font-mono text-sm">{selectedBill.poNumber}</span>
              </div>
            </div>

            {/* Potongan Otomatis Debit Note (Poin 12) */}
            {selectedBill.availableDebitNote > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div className="font-bold text-emerald-900">Tersedia Debit Note (Potongan Retur Barang Reject)</div>
                      <div className="text-[11px] text-emerald-700">Klaim retur disetujui supplier senilai Rp {selectedBill.availableDebitNote.toLocaleString("id-ID")}</div>
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
                    <span className="font-bold text-emerald-900 text-xs">Gunakan Potongan</span>
                  </label>
                </div>
              </div>
            )}

            {/* Form Input Pembayaran */}
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
                <label className="block text-slate-700 font-bold mb-1">Akun Kas / Bank Sumber Dana (Poin 11) *</label>
                <select
                  aria-label="Akun Kas Bank"
                  value={selectedAccountCode}
                  onChange={(e) => setSelectedAccountCode(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {bankBalances.map((b) => (
                    <option key={b.accountCode} value={b.accountCode}>
                      [{b.accountCode}] {b.accountName} (Saldo: Rp {b.balance.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nominal yang Ditransfer (Netto) *</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-bold font-mono text-indigo-700 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">No. Referensi Transfer Bank / Giro</label>
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
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </DnaModal>
      )}
    </DnaPageContainer>
  );
}
