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
import { Button } from "@/components/ui/button";
import { DnaInput, DnaBadge, DnaButton, StatCard, TableWrapper } from "@/components/dna";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <OperationalMigrationShell title="Pembayaran Pembelian" subtitle="Penyelesaian pembayaran dan pelacakan">
      <div className="space-y-8 animate-fade-slide-in">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="Hutang Tertunda" value="Rp 24.000.000" subValue="12 jatuh tempo | Perlu audit" icon={<Wallet className="text-rose-600" />} />
          <StatCard label="Total Lunas (MTD)" value="Rp 189.500.000" subValue="75% target efisiensi tercapai" icon={<CircleDollarSign className="text-emerald-500" />} />
          <StatCard label="Gateway Pembayaran" value="Penyelesaian Instan" subValue="Gateway pembayaran aktif" icon={<Zap className="text-blue-500" />} />
        </div>

        {/* Main List Table */}
        <TableWrapper
          filters={
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <div className="relative w-72">
                <DnaInput
                  icon={<Search className="h-4 w-4 text-slate-400" />}
                  placeholder="Cari Faktur atau Pemasok..."
                />
              </div>
              <div className="flex gap-4">
                <DnaButton variant="ghost">
                  Status: Semua
                </DnaButton>
              </div>
            </div>
          }
        >
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Faktur / Asal</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">PO / Pemasok</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Tanggal</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Total</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Sisa Tagihan</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right pr-10">Penyelesaian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-[10px] font-black uppercase mt-4 text-slate-400">Memuat faktur...</p>
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <AlertCircle className="h-6 w-6 mx-auto text-rose-500" />
                    <p className="text-[10px] font-black uppercase mt-4 text-slate-400">Gagal memuat faktur</p>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && invList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-300">Belum ada faktur yang harus dibayar</p>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && invList.map((inv: any) => {
                const outstanding = Number(inv.outstandingAmount);
                const status = statusLabel(inv.status);
                return (
                  <TableRow key={inv.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                    <TableCell className="py-4 px-4 pl-10">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-slate-200">
                          <FileIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">{inv.invoiceNumber}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">PO: {inv.po?.poNumber || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-xs uppercase">{inv.po?.poNumber || "-"}</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase italic">{inv.supplier?.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter">{formatDate(inv.issuedAt)}</span>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <span className="font-black text-slate-900 text-sm tabular-nums">{formatOperationalCurrency(inv.amountDue)}</span>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <span className={cn(
                        "font-black text-sm tabular-nums",
                        outstanding > 0 ? "text-rose-600" : "text-emerald-500"
                      )}>{formatOperationalCurrency(outstanding)}</span>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-center">
                      <DnaBadge status={inv.status === "PAID" ? "success" : "critical"}>
                        {status}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="py-4 px-4 pr-10">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>

        {/* Payment Modal Overlay */}
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
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all group"
                >
                  <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </button>

                <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Protokol Penyelesaian</p>
                   <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Pembayaran <span className="text-emerald-500">Faktur</span></h2>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div className="col-span-2 border-b border-slate-200 pb-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pemasok</p>
                    <p className="font-black text-xs uppercase italic text-emerald-600">{selectedInvoice.supplier?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Faktur ID</p>
                    <p className="font-black text-xs uppercase italic">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Sisa Tagihan</p>
                    <p className="font-black text-xs uppercase italic tabular-nums text-rose-600">{formatOperationalCurrency(selectedInvoice.outstandingAmount)}</p>
                  </div>
                </div>

                {/* DP Toggle */}
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30 flex items-center justify-between group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="font-black text-xs uppercase text-slate-900">Gunakan Uang Muka</span>
                      <span className="text-[9px] font-black text-slate-400">Tersedia: Rp 500.000</span>
                    </div>
                  </div>
                  <Checkbox
                    checked={useDP}
                    onCheckedChange={(val) => setUseDP(!!val)}
                    className="h-5 w-5 rounded border-2 border-slate-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 transition-all"
                  />
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Tanggal Bayar</label>
                    <DnaInput
                      icon={<Calendar className="h-4 w-4 text-slate-400" />}
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Sumber Dana</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase appearance-none pl-10">
                        <option>BCA Corporate (2640...)</option>
                        <option>Mandiri Payroll</option>
                        <option>Cash Vault (Main)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase block">Jumlah Pembayaran</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 z-10 text-sm">Rp</span>
                    <DnaInput
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="h-12 pl-10 bg-white border border-slate-200 rounded-xl text-sm font-black tabular-nums"
                    />
                    {useDP && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase">- Rp 500K</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase block">Catatan Administrasi</label>
                  <textarea
                    rows={2}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Tambahkan catatan rekonsiliasi..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-4">
                  <DnaButton
                    onClick={() => setIsModalOpen(false)}
                    variant="ghost"
                    className="flex-1 h-11"
                  >
                    Batal
                  </DnaButton>
                  <DnaButton
                    onClick={handleExecuteSettlement}
                    disabled={paymentMutation.isPending || paymentAmount <= 0}
                    variant="primary"
                    icon={paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    className="flex-[2] h-11 hover:scale-[1.02]"
                  >
                    {paymentMutation.isPending ? "Memproses..." : "Bayar Sekarang"}
                  </DnaButton>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Insight */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-10 flex gap-8 items-center">
          <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
            <Zap className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-600">Catatan operasional: kesehatan kas</p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Rasio kewajiban yang sehat memerlukan penyelesaian tagihan secara disiplin.
              Pertimbangkan <span className="text-emerald-600 font-semibold">pelunasan lebih awal</span> untuk vendor yang menawarkan diskon.
            </p>
          </div>
        </div>
      </div>
    </OperationalMigrationShell>
  );
}
