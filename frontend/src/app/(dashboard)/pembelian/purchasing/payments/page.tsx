"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  FileIcon,
  History,
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
  Info,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DnaInput, DnaBadge, DnaButton, DnaStatCard, DnaDataTableCard, DnaModal, DnaSelect, DnaTextarea, DnaCheckbox, DnaCell } from "@/components/dna";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { toast } from "sonner";

// SPEC: SCR-SCM-PAY-001 — Purchase Payment Settlement

const statusLabel = (status: string) => {
  switch (status) {
    case "UNPAID": return "Belum Lunas";
    case "PAID": return "Lunas";
    case "PARTIAL": return "Sebagian";
    default: return status;
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
      toast.success("Payment executed successfully");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Payment failed");
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <DashboardShell title="PEMBELIAN" titleAccent="PEMBAYARAN" subtitle="Penyelesaian pembayaran & pelacakan">
      <div className="space-y-8 animate-fade-slide-in">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DnaStatCard label="Hutang Tertunda" value="Rp 24,000,000" subtext="12 overdue | Audit Required" icon={<Wallet />} variant="rose" />
          <DnaStatCard label="Total Lunas (MTD)" value="Rp 189,500,000" subtext="75% efficiency target achieved" icon={<CircleDollarSign />} variant="emerald" />
          <DnaStatCard label="Gateway Pembayaran" value="Instant Settlement" subtext="Instant gateway settlement active" icon={<Zap />} variant="blue" />
        </div>

        {/* Main List Table */}
        <DnaDataTableCard
          customToolbar={
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-white">
              <div className="relative w-72">
                <DnaInput icon={<Search className="h-4 w-4 text-slate-400" />} placeholder="Cari Faktur atau Pemasok..." />
              </div>
              <div className="flex gap-4">
                <DnaButton variant="ghost">Status: Semua</DnaButton>
              </div>
            </div>
          }
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-4">Faktur / Asal</th>
                <th className="py-4 px-4">PO / Pemasok</th>
                <th className="py-4 px-4">Tanggal</th>
                <th className="py-4 px-4 text-right">Total</th>
                <th className="py-4 px-4 text-right">Sisa Tagihan</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-4 text-right pr-10">Penyelesaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-[10px] font-bold uppercase mt-4 text-slate-400">Memuat faktur...</p>
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <AlertCircle className="h-6 w-6 mx-auto text-rose-500" />
                    <p className="text-[10px] font-bold uppercase mt-4 text-slate-400">Gagal memuat faktur</p>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && invList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-300">Belum ada faktur yang harus dibayar</p>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && invList.map((inv: any) => {
                const outstanding = Number(inv.outstandingAmount);
                const status = statusLabel(inv.status);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-4 px-4 pl-10">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
                          <FileIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 tracking-tight text-sm uppercase italic">{inv.invoiceNumber}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">PO: {inv.po?.poNumber || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs uppercase">{inv.po?.poNumber || "-"}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase italic">{inv.supplier?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{formatDate(inv.issuedAt)}</span>
                    </td>
                    <td className="py-4 px-4 text-right"><DnaCell.Currency value={Number(inv.amountDue)} /></td>
                    <td className="py-4 px-4 text-right">
                      <span className={cn(
                        "font-bold text-sm tabular-nums",
                        outstanding > 0 ? "text-rose-600" : "text-emerald-500"
                      )}>Rp {outstanding.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <DnaBadge status={inv.status === "PAID" ? "success" : "critical"}>
                        {status}
                      </DnaBadge>
                    </td>
                    <td className="py-4 px-4 pr-10">
                      <div className="flex justify-end gap-2">
                        <DnaButton variant="ghost" size="icon" icon={<Eye className="h-4 w-4" />} />
                        {outstanding > 0 && (
                          <DnaButton
                            onClick={() => openPaymentModal(inv)}
                            variant="primary"
                            size="md"
                            icon={<CircleDollarSign className="h-4 w-4" />}
                          >
                            Bayar
                          </DnaButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DnaDataTableCard>

        {/* Payment Modal */}
        <DnaModal
          isOpen={isModalOpen && !!selectedInvoice}
          onClose={() => setIsModalOpen(false)}
          title="Pembayaran Faktur"
          subtitle="Protokol Penyelesaian"
          size="xl"
          badge="PAYMENT"
          footer={
            <>
              <DnaButton onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
                Batal
              </DnaButton>
              <DnaButton
                onClick={handleExecuteSettlement}
                disabled={paymentMutation.isPending || paymentAmount <= 0}
                variant="primary"
                icon={paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                className="flex-[2]"
              >
                {paymentMutation.isPending ? "Memproses..." : "Bayar Sekarang"}
              </DnaButton>
            </>
          }
        >
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <div className="col-span-2 border-b border-slate-200 pb-2">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Supplier</p>
                  <p className="font-bold text-xs uppercase italic text-emerald-600">{selectedInvoice.supplier?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Faktur ID</p>
                  <p className="font-bold text-xs uppercase italic">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Rem. Balance</p>
                  <p className="font-bold text-xs uppercase italic tabular-nums text-rose-600">Rp {Number(selectedInvoice.outstandingAmount).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs uppercase text-slate-900">Gunakan Uang Muka</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Available: Rp 500,000</span>
                  </div>
                </div>
                <DnaCheckbox checked={useDP} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUseDP(e.target.checked)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DnaInput
                  label="Tanggal Bayar"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4 text-slate-400" />}
                />
                <DnaSelect
                  label="Sumber Dana"
                  value=""
                  onChange={() => {}}
                  placeholder="Pilih sumber dana"
                  options={[
                    { label: 'BCA Corporate (2640...)', value: 'bca' },
                    { label: 'Mandiri Payroll', value: 'mandiri' },
                    { label: 'Cash Vault (Main)', value: 'cash' },
                  ]}
                  icon={<CreditCard className="h-4 w-4 text-slate-400" />}
                />
              </div>

              <DnaInput
                label="Jumlah Pembayaran"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="h-12 text-sm font-bold tabular-nums"
              />

              <DnaTextarea
                label="Catatan Administrasi"
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Tambahkan catatan rekonsiliasi..."
              />
            </div>
          )}
        </DnaModal>

        {/* Footer Insight */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-10 flex gap-8 items-center">
          <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
            <Zap className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 italic">Owner Insight: Treasury Health</p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed uppercase">
              Maintaining a healthy debt-to-equity ratio requires diligent settlement of aging payables.
              Consider <span className="text-emerald-600 font-black">Early Settlement</span> for vendors offering discount terms.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
