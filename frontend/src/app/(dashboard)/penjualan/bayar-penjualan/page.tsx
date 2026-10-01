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
  DnaDetailDrawer,
  DnaButton,
  DnaBadge,
  DnaInput,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  KwitansiPrintModal,
} from "@/components/dna";
import { Printer } from "lucide-react";

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

const statusBadgeConfig: Record<string, { status: "success" | "warning" | "critical" | "default"; label: string }> = {
  PAID: { status: "success", label: "Lunas" },
  PARTIAL: { status: "warning", label: "Sebagian" },
  OVERDUE: { status: "critical", label: "Overdue" },
  UNPAID: { status: "default", label: "Belum Bayar" },
};

export default function BayarPenjualanPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<ReceivablePayment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState<any | null>(null);

  // Payment Input Form State
  const [formPayAmount, setFormPayAmount] = useState("");
  const [formPph23, setFormPph23] = useState("0");
  const [formPph21, setFormPph21] = useState("0");
  const [formBank, setFormBank] = useState("BCA Maklon (264-035-1589)");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");

  // Live Query Invoices as Receivables
  const {
    data: payments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ReceivablePayment[]>({
    queryKey: ["commercial-payments"],
    queryFn: async () => {
      const resp = await api.get("/commercial/invoices");
      return (resp.data || []).map((inv: any) => {
        const total = Number(inv.amountDue) || 0;
        const paid = Number(inv.paidAmount) || 0;
        const remaining = Math.max(0, total - paid);
        const pph23 = Math.round(paid * 0.02);
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber || inv.id,
          customerName: inv.salesOrder?.lead?.clientName || inv.customerName || "Customer",
          brandName: inv.salesOrder?.brandName || inv.brandName || "Brand",
          paymentDate: inv.invoiceDate
            ? new Date(inv.invoiceDate).toISOString().split("T")[0]
            : inv.createdAt
            ? new Date(inv.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: remaining,
          pph23Deduction: pph23,
          pph21Deduction: 0,
          netCashReceived: Math.max(0, paid - pph23),
          bankAccount: "BCA Maklon (264-035-1589)",
          status: (inv.status === "PAID"
            ? "PAID"
            : remaining < total && remaining > 0
            ? "PARTIAL"
            : "UNPAID") as ReceivablePayment["status"],
          notes: inv.notes || "",
        };
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post("/commercial/payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commercial-payments"] });
      queryClient.invalidateQueries({ queryKey: ["commercial-invoices"] });
      toast.success(
        "Pembayaran Berhasil Dicatat",
        "Penerimaan pembayaran dan potongan withholding PPh berhasil divalidasi."
      );
      setIsPaymentModalOpen(false);
      setSelectedPayment(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Gagal memproses pembayaran";
      toast.error("Validasi Gagal", msg);
    },
  });

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

    if (payAmt <= 0) {
      toast.error("Validasi Gagal", "Jumlah pembayaran harus lebih besar dari 0.");
      return;
    }

    createPaymentMutation.mutate({
      invoiceId: selectedPayment.id,
      amount: payAmt,
      paymentMethod: "BANK_TRANSFER",
      bankAccount: formBank,
      pph23Deduction: pph23Amt,
      notes: formNotes,
    });
  };

  // Calculate counts for header tabs
  const countAll = payments.length;
  const countPaid = payments.filter((p) => p.status === "PAID").length;
  const countPartial = payments.filter((p) => p.status === "PARTIAL").length;
  const countUnpaid = payments.filter((p) => p.status === "UNPAID").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Top Header with Unified Tabs */}
      <DnaPageHeader
        title="REPORT PEMBAYARAN PENJUALAN"
        description="Laporan rekapitulasi penerimaan pembayaran piutang maklon kosmetik, mutasi kas/bank, rekonsiliasi bukti potong pajak PPh 21 & PPh 23, serta settlement pelunasan faktur."
        tabs={[
          { key: "ALL", label: "Semua", count: countAll },
          { key: "PAID", label: "Lunas", count: countPaid },
          { key: "PARTIAL", label: "Sebagian", count: countPartial },
          { key: "UNPAID", label: "Belum Bayar", count: countUnpaid },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
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
      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : isError ? (
        <DnaErrorState
          title="Gagal Memuat Pembayaran Penjualan"
          message={(error as any)?.message || "Terjadi kesalahan saat menghubungi server."}
          onRetry={() => refetch()}
        />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchPlaceholder: "Cari nomor kwitansi, faktur, pelanggan, atau brand...",
            searchValue: searchTerm,
            onSearchChange: setSearchTerm,
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <DnaTh className="px-4 py-2.5 w-[150px]">No. Kwitansi</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[150px]">No. Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tgl Bayar</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Pelanggan & Brand</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Total Tagihan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Kas Masuk Net</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-right">Potongan PPh</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[110px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredPayments.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={9} className="text-center py-12 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                      <p className="font-semibold text-slate-600">Tidak ada data pembayaran</p>
                      <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredPayments.map((p) => (
                    <DnaTableRow key={p.id} className="h-[48px] hover:bg-slate-50/60 transition-colors">
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Code code={`REC-${p.invoiceNumber.replace("INV-", "")}`} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Code code={p.invoiceNumber} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={p.paymentDate} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <div>
                          <div className="text-[12px] font-medium text-slate-900 line-clamp-1">{p.customerName}</div>
                          <div className="text-[10.5px] text-slate-400 font-normal mt-0.5 line-clamp-1">{p.brandName || "Maklon"}</div>
                        </div>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        <DnaCell.Numeric value={p.totalAmount} prefix="Rp " />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums">
                        <span className="text-[12px] font-semibold text-emerald-600">
                          Rp {p.netCashReceived.toLocaleString("id-ID")}
                        </span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right tabular-nums tabular-nums">
                        <span className="text-[12px] font-medium text-purple-700">
                          Rp {(p.pph23Deduction + p.pph21Deduction).toLocaleString("id-ID")}
                        </span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        <DnaBadge
                          variant={statusBadgeConfig[p.status]?.status || "default"}
                        >
                          {statusBadgeConfig[p.status]?.label || p.status}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="pr-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          {p.remainingAmount > 0 ? (
                            <DnaButton
                              variant="primary"
                              className="h-7 px-2.5 text-[11px]"
                              onClick={() => openPaymentDialog(p)}
                            >
                              <CircleDollarSign className="w-3 h-3 mr-1" /> Bayar
                            </DnaButton>
                          ) : (
                            <DnaButton
                              variant="ghost"
                              className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => {
                                setPrintReceiptData({
                                  code: `KWT-${p.invoiceNumber.replace("INV-", "")}`,
                                  date: p.paymentDate,
                                  customerName: p.customerName,
                                  amount: p.paidAmount || p.totalAmount,
                                  paymentMethod: p.bankAccount,
                                  notes: `Pelunasan Faktur ${p.invoiceNumber} (${p.brandName || "Maklon"})`,
                                });
                                setIsPrintReceiptOpen(true);
                              }}
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" /> Cetak Kwitansi
                            </DnaButton>
                          )}
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}

      {/* Drawer Terima Pembayaran & Potongan PPh 21/23 */}
      <DnaDetailDrawer
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Pencatatan Pembayaran & Withholding Pajak"
        subtitle={selectedPayment ? `${selectedPayment.customerName} • Faktur ${selectedPayment.invoiceNumber}` : undefined}
        badge={
          selectedPayment ? (
            <DnaCell.Badge
              status={statusBadgeConfig[selectedPayment.status]?.status || "default"}
              label={statusBadgeConfig[selectedPayment.status]?.label || selectedPayment.status}
            />
          ) : undefined
        }
        actions={
          <div className="flex items-center justify-between w-full">
            <DnaButton type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              type="button"
              variant="primary"
              icon={<ShieldCheck className="w-4 h-4" />}
              onClick={handlePaymentSubmit as any}
            >
              Validasi & Catat Kas Masuk
            </DnaButton>
          </div>
        }
      >
        {selectedPayment && (
          <form onSubmit={handlePaymentSubmit} className="space-y-5 text-xs">
            {/* Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Faktur Penjualan
                </span>
                <span className="tabular-nums font-bold text-blue-600 text-xs">{selectedPayment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Nilai Faktur:</span>
                <span className="tabular-nums font-bold text-slate-800">
                  Rp {selectedPayment.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
                <span className="text-slate-500 font-semibold">Sisa Tagihan Tertunggak:</span>
                <span className="font-bold text-rose-600 tabular-nums text-sm">
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

            {/* Withholding Tax PPh 21 & PPh 23 */}
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
              <div className="flex justify-between items-center text-xs pt-2 border-t border-purple-100">
                <span className="font-semibold text-purple-900">Estimasi Kas Bersih Masuk Bank:</span>
                <span className="font-bold text-emerald-700 tabular-nums text-sm">
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
          </form>
        )}
      </DnaDetailDrawer>
      {/* Modal Cetak Kwitansi Standar (Stempel LUNAS Merah) */}
      <KwitansiPrintModal
        isOpen={isPrintReceiptOpen}
        onClose={() => setIsPrintReceiptOpen(false)}
        data={printReceiptData}
      />
    </div>
  );
}
