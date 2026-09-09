"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Trash2,
  FileText,
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  Receipt
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

const INITIAL_DP_LIST: PurchaseDp[] = [
  {
    id: "dp-1",
    dpNumber: "DP-PO-202609-0005",
    dpDate: "2026-09-09",
    poNumber: "PO-202609-000005",
    vendorName: "PT Sumber Organik Nusantara",
    vendorCode: "SUP-0012",
    totalPoAmount: 50000000,
    dpPercentage: 30,
    dpAmount: 15000000,
    paymentAccount: "110201 - Bank BCA Operasional (A/C 731-0129-33)",
    referenceNumber: "TRF-BCA-9812401",
    status: "PAID",
    notes: "Uang muka 30% PO Bahan Baku Batch 1 Body Lotion sesuai kesepakatan PO.",
    pic: "Mega Utami (Finance Officer)"
  },
  {
    id: "dp-2",
    dpNumber: "DP-PO-202609-0004",
    dpDate: "2026-09-08",
    poNumber: "PO-202609-000004",
    vendorName: "PT Kemasan Jaya Makmur",
    vendorCode: "SUP-0004",
    totalPoAmount: 28500000,
    dpPercentage: 50,
    dpAmount: 14250000,
    paymentAccount: "110202 - Bank Mandiri Operasional (A/C 137-00-9812-1)",
    referenceNumber: "TRF-MDR-661209",
    status: "ALLOCATED",
    allocatedBillNumber: "FP-202609-000002",
    notes: "DP Cetak Botol Tube 100ml. Telah dipotongkan pada Faktur FP-202609-000002.",
    pic: "Mega Utami (Finance Officer)"
  },
  {
    id: "dp-3",
    dpNumber: "DP-PO-202609-0003",
    dpDate: "2026-09-07",
    poNumber: "PO-202609-000001",
    vendorName: "PT Aroma Alam Lestari",
    vendorCode: "SUP-0008",
    totalPoAmount: 12000000,
    dpPercentage: 25,
    dpAmount: 3000000,
    paymentAccount: "110201 - Bank BCA Operasional (A/C 731-0129-33)",
    status: "PENDING_APPROVAL",
    notes: "Menunggu approval Kasir & Finance Head untuk transfer.",
    pic: "Rini Sulistyo (AP Staff)"
  },
  {
    id: "dp-4",
    dpNumber: "DP-PO-202608-0002",
    dpDate: "2026-08-28",
    poNumber: "PO-202608-000011",
    vendorName: "PT Indo Paper Box Perkasa",
    vendorCode: "SUP-0019",
    totalPoAmount: 8500000,
    dpPercentage: 50,
    dpAmount: 4250000,
    paymentAccount: "110101 - Kas Kecil Kantor (Petty Cash)",
    status: "VOID",
    notes: "PO dibatalkan karena supplier kehabisan bahan baku kertas karton.",
    pic: "Mega Utami (Finance Officer)"
  }
];

const MOCK_ACTIVE_POS = [
  { poNumber: "PO-202609-000005", vendorName: "PT Sumber Organik Nusantara", vendorCode: "SUP-0012", totalAmount: 50000000 },
  { poNumber: "PO-202609-000006", vendorName: "PT Chemindo Resins Global", vendorCode: "SUP-0007", totalAmount: 35000000 },
  { poNumber: "PO-202609-000007", vendorName: "PT Prima Foilindo Printing", vendorCode: "SUP-0015", totalAmount: 18000000 }
];

const CASH_BANK_ACCOUNTS = [
  "110201 - Bank BCA Operasional (A/C 731-0129-33)",
  "110202 - Bank Mandiri Operasional (A/C 137-00-9812-1)",
  "110101 - Kas Kecil Kantor (Petty Cash)",
  "110203 - Bank BNI Payroll & AP (A/C 098-1123-99)"
];

export default function DpPembelianPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<PurchaseDp[]>(INITIAL_DP_LIST);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDp, setSelectedDp] = useState<PurchaseDp | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      .filter(d => d.status === "PAID" || d.status === "ALLOCATED")
      .reduce((sum, d) => sum + d.dpAmount, 0);
    const unallocated = list
      .filter(d => d.status === "PAID")
      .reduce((sum, d) => sum + d.dpAmount, 0);
    const pending = list.filter(d => d.status === "PENDING_APPROVAL").length;

    return {
      total,
      totalPaid,
      unallocated,
      pending
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.dpNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paymentAccount.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "PENDING_APPROVAL" ? item.status === "PENDING_APPROVAL" :
        activeTab === "PAID" ? item.status === "PAID" :
        activeTab === "ALLOCATED" ? item.status === "ALLOCATED" :
        activeTab === "VOID" ? item.status === "VOID" : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleSelectPo = (poNo: string) => {
    setSelectedPoNumber(poNo);
    const po = MOCK_ACTIVE_POS.find(p => p.poNumber === poNo);
    if (po) {
      const calcAmount = (po.totalAmount * dpPercentage) / 100;
      setDpAmount(calcAmount);
    } else {
      setDpAmount(0);
    }
  };

  const handlePercentageChange = (pct: number) => {
    setDpPercentage(pct);
    const po = MOCK_ACTIVE_POS.find(p => p.poNumber === selectedPoNumber);
    if (po) {
      setDpAmount((po.totalAmount * pct) / 100);
    }
  };

  const handleCreateDp = () => {
    if (!selectedPoNumber) {
      toast.error("Pilih dokumen PO referensi");
      return;
    }
    const po = MOCK_ACTIVE_POS.find(p => p.poNumber === selectedPoNumber);
    if (!po) return;

    if (dpAmount <= 0) {
      toast.error("Nominal Uang Muka (DP) harus lebih dari Rp 0");
      return;
    }

    const newNo = `DP-PO-202609-00${String(dataList.length + 6).padStart(2, "0")}`;

    const newDp: PurchaseDp = {
      id: `dp-${Date.now()}`,
      dpNumber: newNo,
      dpDate,
      poNumber: po.poNumber,
      vendorName: po.vendorName,
      vendorCode: po.vendorCode,
      totalPoAmount: po.totalAmount,
      dpPercentage,
      dpAmount,
      paymentAccount,
      referenceNumber: referenceNumber || undefined,
      status: "PAID",
      notes: formNotes || `Pembayaran DP ${dpPercentage}% untuk PO ${po.poNumber}`,
      pic: "Finance Officer (Anda)"
    };

    setDataList([newDp, ...dataList]);
    setIsCreateOpen(false);
    setSelectedPoNumber("");
    setDpAmount(0);
    setReferenceNumber("");
    setFormNotes("");
    toast.success(`Uang Muka Pembelian ${newNo} berhasil diterbitkan & tercatat di Jurnal Akuntansi.`);
  };

  const handleApprovePayment = (id: string) => {
    setDataList(dataList.map(item => {
      if (item.id === id) {
        return { ...item, status: "PAID" };
      }
      return item;
    }));
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
        return <DnaBadge variant="info">Terbayar (Siap Potong Faktur)</DnaBadge>;
      case "ALLOCATED":
        return <DnaBadge variant="success">Dialokasikan ke Faktur</DnaBadge>;
      case "VOID":
        return <DnaBadge variant="critical">Dibatalkan (Void)</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="$ DP Pembelian (Purchase Down Payment)"
        description="Kelola pembayaran uang muka PO ke supplier dan pelacakan alokasi pemotongan faktur pembelian."
        badge={<DnaBadge variant="neutral">SCR-044 / FIN-PUR-DP</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
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

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua", count: dataList.length },
            { id: "PENDING_APPROVAL", label: "Menunggu Approval", count: dataList.filter(d => d.status === "PENDING_APPROVAL").length },
            { id: "PAID", label: "Terbayar (Saldo Aktif)", count: dataList.filter(d => d.status === "PAID").length },
            { id: "ALLOCATED", label: "Sudah Dipotong Faktur", count: dataList.filter(d => d.status === "ALLOCATED").length },
            { id: "VOID", label: "Batal", count: dataList.filter(d => d.status === "VOID").length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Pembayaran Uang Muka Pembelian (Purchase Advance)"
        description="DP secara otomatis memotong total nilai tagihan faktur saat Faktur Pembelian diterbitkan."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No DP, PO, supplier, akun kas/bank..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. DP</th>
                <th className="py-3 px-4">Tanggal Bayar</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Referensi PO</th>
                <th className="py-3 px-4 text-right">Nilai Total PO</th>
                <th className="py-3 px-4 text-center">% DP</th>
                <th className="py-3 px-4 text-right">Nominal DP</th>
                <th className="py-3 px-4">Akun Sumber</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data DP pembelian yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                      {row.dpNumber}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {row.dpDate}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-900">
                      <div>{row.vendorName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{row.vendorCode}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono font-medium text-slate-900">
                      {row.poNumber}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono text-slate-600">
                      Rp {row.totalPoAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-bold text-slate-800">
                      {row.dpPercentage}%
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-emerald-600">
                      Rp {row.dpAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 max-w-xs truncate">
                      {row.paymentAccount}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedDp(row);
                            setIsDetailOpen(true);
                          }}
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

      {/* Modal Detail DP */}
      {selectedDp && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail DP Pembelian: ${selectedDp.dpNumber}`}
          description={`Uang muka pembayaran kepada ${selectedDp.vendorName}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Dicatat oleh: <span className="font-semibold text-slate-700">{selectedDp.pic}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedDp.status === "PENDING_APPROVAL" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => {
                      handleApprovePayment(selectedDp.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    Setujui & Konfirmasi Pembayaran
                  </DnaButton>
                )}
                <DnaButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </DnaButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header Cards */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">No. Purchase Order</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{selectedDp.poNumber}</span>
                <span className="text-slate-500 block text-[11px]">Total PO: Rp {selectedDp.totalPoAmount.toLocaleString("id-ID")}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nominal Uang Muka ({selectedDp.dpPercentage}%)</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  Rp {selectedDp.dpAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Akun Sumber Pembayaran</span>
                <span className="font-medium text-slate-800">{selectedDp.paymentAccount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Pembayaran</span>
                <div className="mt-0.5">{getStatusBadge(selectedDp.status)}</div>
              </div>
            </div>

            {selectedDp.allocatedBillNumber && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Telah Dialokasikan pada Faktur Pembelian:</span>
                  <span className="font-mono">{selectedDp.allocatedBillNumber}</span>
                </div>
                <DnaBadge variant="success">Faktur Lunas / Berkurang</DnaBadge>
              </div>
            )}

            {/* Jurnal Akuntansi Preview */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Pencatatan Otomatis Jurnal Finansial (Double-Entry)</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode Akun COA</th>
                      <th className="py-2.5 px-3">Nama Akun Akuntansi</th>
                      <th className="py-2.5 px-3 text-right">Debit (Rp)</th>
                      <th className="py-2.5 px-3 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
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
        </DnaModal>
      )}

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
                {MOCK_ACTIVE_POS.map((p) => (
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
                  <option key={acc} value={acc}>{acc}</option>
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
