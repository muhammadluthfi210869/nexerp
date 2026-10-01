"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Info,
  ShieldCheck,
  Receipt,
  Wallet,
} from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaBadge,
  useDnaToast,
} from "@/components/dna";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface BillItem {
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

interface BayarPembelianCanvasProps {
  unpaidBills: BillItem[];
  bankBalances: BankBalance[];
  initialBill?: BillItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BayarPembelianCanvas({
  unpaidBills,
  bankBalances,
  initialBill,
  onClose,
  onSuccess,
}: BayarPembelianCanvasProps) {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [selectedBillId, setSelectedBillId] = useState<string>(initialBill?.id || "");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>(
    bankBalances[0]?.accountCode || "110201"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("TRANSFER");
  const [refNumber, setRefNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [useDebitNote, setUseDebitNote] = useState<boolean>(true);

  // Active bill selected
  const activeBill = useMemo(() => {
    return unpaidBills.find((b) => b.id === selectedBillId) || initialBill || null;
  }, [unpaidBills, selectedBillId, initialBill]);

  // Set default pay amount when active bill changes
  useEffect(() => {
    if (activeBill) {
      setPayAmount(activeBill.remainingAmount);
      if (!selectedBillId) {
        setSelectedBillId(activeBill.id);
      }
    }
  }, [activeBill]);

  // Selected bank account
  const selectedBank = useMemo(() => {
    return bankBalances.find((b) => b.accountCode === selectedAccountCode) || bankBalances[0];
  }, [bankBalances, selectedAccountCode]);

  const dnAmount = useMemo(() => {
    if (!activeBill || !useDebitNote) return 0;
    return Math.min(activeBill.availableDebitNote || 0, activeBill.remainingAmount);
  }, [activeBill, useDebitNote]);

  const netPayable = useMemo(() => {
    if (!activeBill) return 0;
    return Math.max(0, activeBill.remainingAmount - dnAmount);
  }, [activeBill, dnAmount]);

  const sisaSetelahBayar = useMemo(() => {
    if (!activeBill) return 0;
    return Math.max(0, netPayable - (payAmount || 0));
  }, [activeBill, netPayable, payAmount]);

  const isFundSufficient = useMemo(() => {
    if (!selectedBank) return true;
    return selectedBank.balance >= payAmount;
  }, [selectedBank, payAmount]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!activeBill) throw new Error("Pilih faktur tagihan terlebih dahulu");
      if (payAmount <= 0) throw new Error("Nominal pembayaran harus lebih dari Rp 0");
      if (payAmount > netPayable) {
        throw new Error("Nominal pembayaran tidak boleh melebihi sisa tagihan bersih");
      }

      const payload = {
        invoiceId: activeBill.id,
        billId: activeBill.id,
        amount: payAmount,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        bankAccountId: selectedBank?.accountCode,
        paymentMethod: paymentMethod,
        referenceNumber: refNumber || `REF-${Date.now().toString().slice(-6)}`,
        notes: notes || `Pelunasan Faktur ${activeBill.billNumber}`,
      };

      const res = await api.post("/purchase/payments", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Pembayaran tagihan berhasil dicatat ke buku besar.");
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Gagal mencatat pembayaran");
    },
  });

  const billOptions = useMemo(() => {
    return unpaidBills.map((b) => ({
      label: `${b.billNumber} — ${b.vendorName} (Sisa: Rp ${b.remainingAmount.toLocaleString("id-ID")})`,
      value: b.id,
    }));
  }, [unpaidBills]);

  const bankOptions = useMemo(() => {
    return bankBalances.map((b) => ({
      label: `${b.accountName} (${b.accountNumber}) — Saldo: Rp ${b.balance.toLocaleString("id-ID")}`,
      value: b.accountCode,
    }));
  }, [bankBalances]);

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-zinc-100 text-zinc-900">
              <CreditCard className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-zinc-900">Catat Pelunasan Tagihan Pembelian (AP)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono">
              Auto-Number: BPB-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Eksekusi pengeluaran kas/bank untuk pelunasan hutang vendor dengan verifikasi saldo likuiditas real-time.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <DnaButton variant="outline" size="sm" onClick={onClose} disabled={payMutation.isPending}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending || !activeBill || payAmount <= 0 || !isFundSufficient}
          >
            {payMutation.isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Tagihan Faktur Hutang */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
              <Receipt className="w-4 h-4 text-zinc-900" />
              1. Pilih Faktur Hutang Supplier
            </div>
            {activeBill && (
              <DnaBadge variant={activeBill.status === "PARTIAL" ? "warning" : "critical"}>
                {activeBill.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
              </DnaBadge>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Pilih Dokumen Faktur Tagihan *
            </label>
            <DnaSelect
              placeholder="-- Pilih Tagihan Pembelian --"
              value={selectedBillId}
              onChange={(val) => {
                setSelectedBillId(val);
                const b = unpaidBills.find((x) => x.id === val);
                if (b) setPayAmount(b.remainingAmount);
              }}
              options={billOptions}
            />
          </div>

          {activeBill ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Nama Supplier / Vendor</span>
                  <span className="font-bold text-zinc-900 block mt-0.5">{activeBill.vendorName}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{activeBill.vendorCode}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Nomor PO Terkait</span>
                  <span className="font-bold text-zinc-900 font-mono block mt-0.5">{activeBill.poNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Tanggal Faktur</span>
                  <span className="font-medium text-zinc-700 block mt-0.5">{activeBill.invoiceDate || "-"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Deadline / Jatuh Tempo</span>
                  <span className="font-bold text-rose-600 block mt-0.5">{activeBill.dueDate || "-"}</span>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Total Tagihan Awal:</span>
                  <span className="font-bold text-zinc-900">
                    Rp {activeBill.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Sudah Dibayar Sebelumnya:</span>
                  <span className="font-semibold text-emerald-800">
                    Rp {activeBill.paidAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-900 font-bold border-t border-zinc-200 pt-2 text-sm">
                  <span>Sisa Tagihan Belum Lunas:</span>
                  <span className="text-rose-600">
                    Rp {activeBill.remainingAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {activeBill.availableDebitNote > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block">Tersedia Debit Note (Retur)</span>
                    <span className="text-emerald-700 text-[11px]">
                      Rp {activeBill.availableDebitNote.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-900">
                    <input
                      type="checkbox"
                      checked={useDebitNote}
                      onChange={(e) => setUseDebitNote(e.target.checked)}
                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                    />
                    Potong Otomatis
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              Pilih faktur pembelian di atas untuk melihat rincian hutang dan alokasi pembayaran.
            </div>
          )}
        </DnaCard>

        {/* Right Column: Rekening Kas/Bank & Pembayaran */}
        <DnaCard className="p-5 space-y-4 border border-zinc-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
              <Wallet className="w-4 h-4 text-zinc-900" />
              2. Sumber Dana & Pembayaran
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Pilih Rekening Kas / Bank Pembayar *
            </label>
            <DnaSelect
              placeholder="-- Pilih Rekening Sumber --"
              value={selectedAccountCode}
              onChange={setSelectedAccountCode}
              options={bankOptions}
            />
            {selectedBank && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 px-1">
                <span>Saldo Tersedia:</span>
                <span
                  className={`font-bold tabular-nums ${
                    isFundSufficient ? "text-emerald-800" : "text-rose-600"
                  }`}
                >
                  Rp {selectedBank.balance.toLocaleString("id-ID")}
                </span>
              </div>
            )}
            {!isFundSufficient && (
              <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                ⚠️ Saldo rekening tidak mencukupi untuk nominal pembayaran ini.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Tanggal Pembayaran *
              </label>
              <DnaInput
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Metode Pembayaran
              </label>
              <DnaSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { label: "Transfer Bank", value: "TRANSFER" },
                  { label: "Giro / Cek Bank", value: "GIRO" },
                  { label: "Kas Tunai", value: "CASH" },
                ]}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Nominal Yang Dibayarkan (Rp) *
              </label>
              {activeBill && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(netPayable)}
                    className="text-[10px] text-zinc-900 hover:text-black font-bold bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 cursor-pointer"
                  >
                    Pelunasan Penuh (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(netPayable * 0.5))}
                    className="text-[10px] text-zinc-600 hover:text-zinc-900 font-semibold bg-zinc-100 px-2 py-0.5 rounded cursor-pointer"
                  >
                    50%
                  </button>
                </div>
              )}
            </div>
            <DnaInput
              type="number"
              value={payAmount || ""}
              onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
              placeholder="Contoh: 15000000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Nomor Bukti Transfer / Ref Bank
            </label>
            <DnaInput
              placeholder="Contoh: TRF-BCA-892182"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Catatan Pembayaran
            </label>
            <DnaInput
              placeholder="Contoh: Pelunasan termin 1 pengadaan raw material"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </DnaCard>
      </div>

      {/* Bottom Summary Card */}
      <DnaCard className="p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">
              Ringkasan Rekonsiliasi Pelunasan
            </span>
            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Sisa Hutang Pokok</span>
                <span className="font-bold text-zinc-900 text-base">
                  Rp {(activeBill?.remainingAmount || 0).toLocaleString("id-ID")}
                </span>
              </div>
              {dnAmount > 0 && (
                <div>
                  <span className="text-zinc-500 block text-[11px]">Potongan Debit Note</span>
                  <span className="font-bold text-emerald-800 text-base">
                    - Rp {dnAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 block text-[11px]">Total Ditransfer</span>
                <span className="font-black text-zinc-900 text-xl">
                  Rp {payAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Sisa Tagihan Akhir</span>
                <span className={`font-bold text-base ${sisaSetelahBayar === 0 ? "text-emerald-800 font-extrabold" : "text-rose-600"}`}>
                  {sisaSetelahBayar === 0 ? "LUNAS (Rp 0)" : `Rp ${sisaSetelahBayar.toLocaleString("id-ID")}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0">
            <DnaButton
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending || !activeBill || payAmount <= 0 || !isFundSufficient}
            >
              {payMutation.isPending ? "Memproses..." : "Bayar Sekarang"}
            </DnaButton>
          </div>
        </div>
      </DnaCard>
    </div>
  );
}
