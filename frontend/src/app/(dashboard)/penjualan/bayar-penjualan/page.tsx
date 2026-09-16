"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  CircleDollarSign,
  Wallet,
  FileCheck2,
  CreditCard,
  Calendar,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Landmark,
  Receipt,
  FileSpreadsheet,
  Percent,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaCell,
  DnaModal,
  DnaButton,
  DnaInput,
  useDnaToast,
} from "@/components/dna";

interface ReceivablePayment {
  id: string;
  invoiceNumber: string;
  customerName: string;
  brandName?: string;
  paymentDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  pph23Deduction: number; // Potongan PPh 23 (2% Jasa Maklon)
  pph21Deduction: number; // Potongan PPh 21 Tenaga Ahli/Komisi
  netCashReceived: number; // Kas Bersih Masuk Bank
  bankAccount: string;
  status: "PAID" | "PARTIAL" | "OVERDUE" | "UNPAID";
  notes?: string;
}

const INITIAL_RECEIVABLE_PAYMENTS: ReceivablePayment[] = [
  {
    id: "pay-1",
    invoiceNumber: "INV-202603-0001",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "C-Jelita Herbal",
    paymentDate: "2026-03-06",
    totalAmount: 73750000,
    paidAmount: 0,
    remainingAmount: 73750000,
    pph23Deduction: 1475000, // 2%
    pph21Deduction: 0,
    netCashReceived: 72275000,
    bankAccount: "BCA Maklon (264-035-1589)",
    status: "UNPAID",
    notes: "Menunggu transfer termin ke-2 sebelum DO delivery released.",
  },
  {
    id: "pay-2",
    invoiceNumber: "INV-202603-0002",
    customerName: "CV Aura Natural Skincare",
    brandName: "AuraGlow Botanical",
    paymentDate: "2026-03-02",
    totalAmount: 49030000,
    paidAmount: 49030000,
    remainingAmount: 0,
    pph23Deduction: 980600,
    pph21Deduction: 0,
    netCashReceived: 48049400,
    bankAccount: "Mandiri Corp (137-00-9821-44)",
    status: "PAID",
    notes: "Lunas transfer Mandiri Corp. Bukti potong PPh 23 telah diunggah.",
  },
  {
    id: "pay-3",
    invoiceNumber: "INV-202602-0014",
    customerName: "PT Derma Estetika Utama",
    brandName: "DermaGleam Pro",
    paymentDate: "2026-02-28",
    totalAmount: 165900000,
    paidAmount: 80000000,
    remainingAmount: 85900000,
    pph23Deduction: 1600000,
    pph21Deduction: 0,
    netCashReceived: 78400000,
    bankAccount: "BCA Maklon (264-035-1589)",
    status: "PARTIAL",
    notes: "Pembayaran termin 1 50% via BCA.",
  },
  {
    id: "pay-4",
    invoiceNumber: "INV-202602-0008",
    customerName: "UD Berkah Ayu Sejahtera",
    brandName: "AyuAura",
    paymentDate: "2026-02-15",
    totalAmount: 25000000,
    paidAmount: 25000000,
    remainingAmount: 0,
    pph23Deduction: 500000,
    pph21Deduction: 250000,
    netCashReceived: 24250000,
    bankAccount: "BCA Maklon (264-035-1589)",
    status: "PAID",
    notes: "Lunas include potongan PPh 21 fee konsultan maklon.",
  },
];

const statusBadgeConfig: Record<string, { status: "success" | "warning" | "critical" | "default"; label: string }> = {
  PAID: { status: "success", label: "Lunas" },
  PARTIAL: { status: "warning", label: "Sebagian" },
  OVERDUE: { status: "critical", label: "Overdue" },
  UNPAID: { status: "default", label: "Belum Bayar" },
};

export default function BayarPenjualanPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [payments, setPayments] = useState<ReceivablePayment[]>(INITIAL_RECEIVABLE_PAYMENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<ReceivablePayment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Payment Input Form State
  const [formPayAmount, setFormPayAmount] = useState("");
  const [formPph23, setFormPph23] = useState("0");
  const [formPph21, setFormPph21] = useState("0");
  const [formBank, setFormBank] = useState("BCA Maklon (264-035-1589)");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.invoiceNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      (p.brandName && p.brandName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Financial Metrics
  const totalReceivables = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
  const totalPph23 = payments.reduce((sum, p) => sum + p.pph23Deduction, 0);
  const totalPph21 = payments.reduce((sum, p) => sum + p.pph21Deduction, 0);
  const totalNetCash = payments.reduce((sum, p) => sum + p.netCashReceived, 0);

  const openPaymentDialog = (pay: ReceivablePayment) => {
    setSelectedPayment(pay);
    setFormPayAmount(String(pay.remainingAmount));
    const estPph23 = Math.round(pay.remainingAmount * 0.02);
    setFormPph23(String(estPph23));
    setFormPph21("0");
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const payAmt = Number(formPayAmount) || 0;
    const pph23Amt = Number(formPph23) || 0;
    const pph21Amt = Number(formPph21) || 0;
    const netReceived = Math.max(0, payAmt - pph23Amt - pph21Amt);

    if (payAmt <= 0) {
      toast.error("Validasi Gagal", "Jumlah pembayaran harus lebih besar dari 0.");
      return;
    }

    setPayments((prev) =>
      prev.map((item) => {
        if (item.id === selectedPayment.id) {
          const newPaid = item.paidAmount + payAmt;
          const newRemaining = Math.max(0, item.totalAmount - newPaid);
          const newStatus = newRemaining === 0 ? "PAID" : "PARTIAL";

          return {
            ...item,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            pph23Deduction: item.pph23Deduction + pph23Amt,
            pph21Deduction: item.pph21Deduction + pph21Amt,
            netCashReceived: item.netCashReceived + netReceived,
            bankAccount: formBank,
            paymentDate: formDate,
            status: newStatus,
            notes: formNotes || item.notes,
          };
        }
        return item;
      })
    );

    toast.success(
      "Pembayaran Berhasil Dicatat",
      `Penerimaan kas Rp ${netReceived.toLocaleString("id-ID")} (setelah potongan PPh) untuk ${selectedPayment.invoiceNumber} berhasil divalidasi.`
    );
    setIsPaymentModalOpen(false);
    setSelectedPayment(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header per Requirement Poin 15 & 16 */}
      <DnaPageHeader
        title="REPORT PENJUALAN (PEMBAYARAN PENJUALAN)"
        description="Laporan rekapitulasi penerimaan pembayaran piutang maklon kosmetik, mutasi kas/bank, rekonsiliasi bukti potong pajak PPh 21 & PPh 23, serta settlement pelunasan faktur."
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.info("Export Report", "Rekap pembayaran penjualan & withholding tax PPh diekspor ke Excel.")}
            >
              Export Rekap Kas & Pajak
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Piutang Faktur",
            value: `Rp ${(totalReceivables / 1000000).toFixed(1)} Jt`,
            subtitle: "Total tagihan komersial",
            trend: "+12% bln ini",
            icon: Wallet,
            variant: "blue",
          },
          {
            label: "Kas Bersih Diterima (Bank)",
            value: `Rp ${(totalNetCash / 1000000).toFixed(1)} Jt`,
            subtitle: "Total net masuk kas/bank",
            trend: "Realized Cash",
            icon: CheckCircle2,
            variant: "emerald",
          },
          {
            label: "Sisa Piutang (Outstanding)",
            value: `Rp ${(totalRemaining / 1000000).toFixed(1)} Jt`,
            subtitle: "Menunggu pembayaran klien",
            trend: "Piutang aktif",
            icon: Clock,
            variant: "amber",
          },
          {
            label: "Rekap Potongan PPh 21 / 23",
            value: `Rp ${((totalPph23 + totalPph21) / 1000000).toFixed(2)} Jt`,
            subtitle: `PPh 23: Rp ${(totalPph23 / 1000).toFixed(0)}rb | PPh 21: Rp ${(totalPph21 / 1000).toFixed(0)}rb`,
            trend: "Bukti potong terverifikasi",
            icon: Percent,
            variant: "purple",
          },
        ]}
      />

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Realisasi Pembayaran & Pemotongan Pajak Faktur"
        count={filteredPayments.length}
        totalItems={payments.length}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari faktur, klien, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {["ALL", "PAID", "PARTIAL", "UNPAID"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === st
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st === "ALL" ? "Semua" : statusBadgeConfig[st]?.label || st}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Receipt No</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3">Allocated Invoices</th>
                <th className="py-3 px-3 text-right">PPh 21 & 23 Terhitung</th>
                <th className="py-3 px-3 text-right">Unallocated Balance</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada data pembayaran</p>
                    <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-blue-600 whitespace-nowrap">
                      {`REC-${p.invoiceNumber.replace("INV-", "")}`}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {p.customerName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {p.paymentDate}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      Rp {p.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-700 whitespace-nowrap">
                      Rp {(p.pph23Deduction + p.pph21Deduction).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      Rp {p.remainingAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <DnaCell.Badge
                        status={statusBadgeConfig[p.status]?.status || "default"}
                        label={statusBadgeConfig[p.status]?.label || p.status}
                      />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        {p.remainingAmount > 0 ? (
                          <DnaButton
                            variant="primary"
                            size="sm"
                            icon={<CircleDollarSign className="w-3.5 h-3.5" />}
                            onClick={() => openPaymentDialog(p)}
                          >
                            Bayar
                          </DnaButton>
                        ) : (
                          <DnaButton
                            variant="outline"
                            size="sm"
                            icon={<FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => {
                              toast.info("Bukti Pembayaran", `Faktur ${p.invoiceNumber} telah lunas.`);
                            }}
                          >
                            Bukti
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

      {/* Modal Terima Pembayaran & Potongan PPh 21/23 */}
      <DnaModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Validasi & Terima Pembayaran Penjualan"
        size="md"
      >
        {selectedPayment && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Faktur Tagihan
              </span>
              <h3 className="text-base font-bold text-slate-900">{selectedPayment.invoiceNumber}</h3>
              <p className="text-xs text-slate-600">Klien: {selectedPayment.customerName}</p>
              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-slate-500">Sisa Tagihan:</span>
                <span className="font-bold text-rose-600 text-sm">
                  Rp {selectedPayment.remainingAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tanggal Bayar *</label>
                <DnaInput
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Akun Kas / Bank Penerima *</label>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah Pembayaran Diterima (Bruto Rp) *</label>
              <DnaInput
                type="number"
                value={formPayAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormPayAmount(val);
                  setFormPph23(String(Math.round(Number(val) * 0.02)));
                }}
                required
              />
            </div>

            {/* Withholding Tax PPh 21 & PPh 23 per Poin 15 & 16 */}
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Potongan Pajak (Withholding Tax)
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-purple-800 block mb-1">
                    PPh 23 (2% Jasa Maklon)
                  </label>
                  <DnaInput
                    type="number"
                    value={formPph23}
                    onChange={(e) => setFormPph23(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-800 block mb-1">
                    PPh 21 (Tenaga Ahli/Komisi)
                  </label>
                  <DnaInput
                    type="number"
                    value={formPph21}
                    onChange={(e) => setFormPph21(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-purple-100">
                <span className="font-semibold text-purple-900">Estimasi Kas Bersih Masuk:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  Rp{" "}
                  {Math.max(
                    0,
                    (Number(formPayAmount) || 0) - (Number(formPph23) || 0) - (Number(formPph21) || 0)
                  ).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nomor Referensi & Catatan</label>
              <textarea
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Contoh: Transfer BCA No. Ref: TRX-992144. Bukti setor PPh 23 terlampir."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <DnaButton type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
                Batal
              </DnaButton>
              <DnaButton type="submit" variant="primary" icon={<ShieldCheck className="w-4 h-4" />}>
                Validasi & Catat Kas Masuk
              </DnaButton>
            </div>
          </form>
        )}
      </DnaModal>
    </div>
  );
}
