"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileIcon,
  Eye,
  CircleDollarSign,
  Save,
  Search,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Wallet,
  X,
  Zap,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  CanonicalMetricGrid,
  MetricCard,
  SectionCard,
  SectionCardContent,
  StatusBadge,
  mapStatus,
} from "@/components/canonical";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const statusLabel = (status: string) => {
  switch (status) {
    case "UNPAID": return "Belum Lunas";
    case "PAID": return "Lunas";
    case "PARTIAL": return "Sebagian";
    default: return getOperationalStatusLabel(status);
  }
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

export default function PurchasePaymentPrototype() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [useDP, setUseDP] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState("");

  const { data: invoices, isLoading, isError } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-invoices");
      return unwrapResponse(res);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (payload: {
      invoiceId: string;
      amount: number;
      paymentDate?: string;
      notes?: string;
    }) => {
      const res = await api.post("/scm/purchase-payments", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      toast.success("Pembayaran berhasil diproses");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Pembayaran gagal diproses");
    },
  });

  const invList = Array.isArray(invoices) ? invoices : [];

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
    setUseDP(false);
    setPaymentAmount(Number(invoice.outstandingAmount));
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
  };

  const handleExecuteSettlement = () => {
    if (!selectedInvoice || paymentAmount <= 0) return;
    paymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      amount: paymentAmount,
      paymentDate,
      notes: paymentNotes || undefined,
    });
  };

  return (
    <PageShell title="Pembayaran Pembelian" subtitle="Penyelesaian pembayaran dan pelacakan">
      <div className="flex flex-col gap-6">
        <CanonicalMetricGrid>
          <MetricCard
            label="Hutang Tertunda"
            value="Rp 24.000.000"
            helper="12 jatuh tempo | Perlu audit"
            icon={<Wallet />}
            variant="danger"
          />
          <MetricCard
            label="Total Lunas (MTD)"
            value="Rp 189.500.000"
            helper="75% target efisiensi tercapai"
            icon={<CircleDollarSign />}
            variant="success"
          />
          <MetricCard
            label="Gateway Pembayaran"
            value="Penyelesaian Instan"
            helper="Gateway pembayaran aktif"
            icon={<Zap />}
            variant="info"
          />
        </CanonicalMetricGrid>

        <SectionCard>
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
              <h3 className="text-[13px] font-semibold text-slate-900">Daftar Pembelian</h3>
              <span className="text-[11px] text-slate-400 tabular-nums">{invList.length}</span>
            </div>
            <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 min-w-[280px]">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                placeholder="Cari Faktur atau Pemasok..."
                className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
              />
            </label>
          </div>
          <SectionCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-[#E2E8F0]">
                    <th className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Faktur / Asal</th>
                    <th className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">PO / Pemasok</th>
                    <th className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                    <th className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                    <th className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Sisa Tagihan</th>
                    <th className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right pr-6">Penyelesaian</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-[10px] font-medium mt-4 text-slate-400">Memuat faktur...</p>
                      </td>
                    </tr>
                  )}
                  {isError && (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <AlertCircle className="h-6 w-6 mx-auto text-rose-500" />
                        <p className="text-[10px] font-medium mt-4 text-slate-400">Gagal memuat faktur</p>
                      </td>
                    </tr>
                  )}
                  {!isLoading && !isError && invList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <p className="text-[10px] font-medium text-slate-300">Belum ada faktur yang harus dibayar</p>
                      </td>
                    </tr>
                  )}
                  {!isLoading && !isError && invList.map((inv: any) => {
                    const outstanding = Number(inv.outstandingAmount);
                    return (
                      <tr key={inv.id} className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="h-[44px] px-4 text-[13px] text-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-white text-slate-700 flex items-center justify-center border border-[#E2E8F0]">
                              <FileIcon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 tracking-tight text-[12px] uppercase">{inv.invoiceNumber}</span>
                              <span className="text-[10px] text-slate-400">PO: {inv.po?.poNumber || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="h-[44px] px-4 text-[13px] text-slate-700">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 text-[12px]">{inv.po?.poNumber || "-"}</span>
                            <span className="text-[10px] text-emerald-600">{inv.supplier?.name || "-"}</span>
                          </div>
                        </td>
                        <td className="h-[44px] px-4 text-[12px] text-slate-600">
                          {formatDate(inv.issuedAt)}
                        </td>
                        <td className="h-[44px] px-4 text-right font-medium text-slate-900 text-[12px] tabular-nums">
                          {formatOperationalCurrency(inv.amountDue)}
                        </td>
                        <td className="h-[44px] px-4 text-right">
                          <span className={cn(
                            "font-medium text-[12px] tabular-nums",
                            outstanding > 0 ? "text-rose-600" : "text-emerald-500"
                          )}>{formatOperationalCurrency(outstanding)}</span>
                        </td>
                        <td className="h-[44px] px-4 text-center">
                          <StatusBadge variant={mapStatus(inv.status)}>
                            {statusLabel(inv.status)}
                          </StatusBadge>
                        </td>
                        <td className="h-[44px] px-4 pr-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md hover:bg-slate-100"
                              aria-label="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {outstanding > 0 && (
                              <button
                                type="button"
                                onClick={() => openPaymentModal(inv)}
                                className="h-8 px-3 inline-flex items-center gap-2 rounded-md bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700"
                              >
                                <CircleDollarSign className="h-3.5 w-3.5" />
                                Bayar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCardContent>
        </SectionCard>

        <div className="rounded-[12px] border border-emerald-100 bg-emerald-50/50 p-6 flex gap-6 items-center">
          <div className="h-12 w-12 rounded-[12px] bg-white flex items-center justify-center text-emerald-600 shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-emerald-600">Catatan operasional: kesehatan kas</p>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Rasio kewajiban yang sehat memerlukan penyelesaian tagihan secara disiplin.
              Pertimbangkan <span className="text-emerald-600 font-medium">pelunasan lebih awal</span> untuk vendor yang menawarkan diskon.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[12px] overflow-hidden p-6 flex flex-col gap-4"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-600">Protokol Penyelesaian</p>
                <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">Pembayaran Faktur</h2>
              </div>

              <div className="p-4 bg-slate-50 rounded-[12px] border border-[#E2E8F0] grid grid-cols-2 gap-3">
                <div className="col-span-2 border-b border-slate-200 pb-2">
                  <p className="text-[10px] font-medium text-slate-400 uppercase">Pemasok</p>
                  <p className="font-medium text-[12px] text-emerald-600">{selectedInvoice.supplier?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase">Faktur ID</p>
                  <p className="font-medium text-[12px]">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase">Sisa Tagihan</p>
                  <p className="font-medium text-[12px] tabular-nums text-rose-600">{formatOperationalCurrency(selectedInvoice.outstandingAmount)}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border-2 border-dashed border-[#E2E8F0] bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  <div className="flex flex-col">
                    <span className="font-medium text-[12px] text-slate-900">Gunakan Uang Muka</span>
                    <span className="text-[10px] text-slate-400">Tersedia: Rp 500.000</span>
                  </div>
                </div>
                <Checkbox
                  checked={useDP}
                  onCheckedChange={(val) => setUseDP(!!val)}
                  className="h-5 w-5 rounded border-2 border-slate-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-500">Tanggal Bayar</label>
                  <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400">
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700"
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-500">Sumber Dana</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <select className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option>BCA Corporate (2640...)</option>
                      <option>Mandiri Payroll</option>
                      <option>Cash Vault (Main)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-slate-500">Jumlah Pembayaran</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-slate-400 text-[12px]">Rp</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="h-10 w-full pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {useDP && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded border border-emerald-100">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-[9px] font-medium text-emerald-600">- Rp 500K</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-slate-500">Catatan Administrasi</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Tambahkan catatan rekonsiliasi..."
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-lg p-3 text-[12px] focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSettlement}
                  disabled={paymentMutation.isPending || paymentAmount <= 0}
                  className="flex-[2] h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {paymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {paymentMutation.isPending ? "Memproses..." : "Bayar Sekarang"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
