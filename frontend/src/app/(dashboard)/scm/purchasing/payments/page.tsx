"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
import { DashboardShell } from "@/components/layout/DashboardShell";
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
      return res.data;
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
    <DashboardShell title="PURCHASING" titleAccent="PAYMENTS" subtitle="Vendor settlement & payment tracking">
      <div className="space-y-8 animate-fade-slide-in">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="Aging Payables" value="Rp 24,000,000" subValue="12 overdue | Audit Required" icon={<Wallet className="text-rose-600" />} />
          <StatCard label="Total Settled (MTD)" value="Rp 189,500,000" subValue="75% efficiency target achieved" icon={<CircleDollarSign className="text-emerald-500" />} />
          <StatCard label="Payment Gateway" value="Instant Settlement" subValue="Instant gateway settlement active" icon={<Zap className="text-blue-500" />} />
        </div>

        {/* Main List Table */}
        <TableWrapper
          filters={
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <div className="relative w-72">
                <DnaInput
                  icon={<Search className="h-4 w-4 text-slate-400" />}
                  placeholder="Search Invoice or Vendor..."
                />
              </div>
              <div className="flex gap-4">
                <DnaButton variant="ghost">
                  Status: All
                </DnaButton>
              </div>
            </div>
          }
        >
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Faktur / Origin</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">PO / Supplier</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400">Commercial Date</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Grand Total</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Sisa Tagihan</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right pr-10">Settlement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-[10px] font-black uppercase mt-4 text-slate-400">Loading invoices...</p>
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <AlertCircle className="h-6 w-6 mx-auto text-rose-500" />
                    <p className="text-[10px] font-black uppercase mt-4 text-slate-400">Failed to load invoices</p>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && invList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <p className="text-[10px] font-black uppercase text-slate-300">No payable invoices found</p>
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
                      <span className="font-black text-slate-900 text-sm tabular-nums">Rp {Number(inv.amountDue).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <span className={cn(
                        "font-black text-sm tabular-nums",
                        outstanding > 0 ? "text-rose-600" : "text-emerald-500"
                      )}>Rp {outstanding.toLocaleString()}</span>
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
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Settlement Protocol</p>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Invoice <span className="text-emerald-500">Payment</span></h2>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div className="col-span-2 border-b border-slate-200 pb-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Supplier</p>
                    <p className="font-black text-xs uppercase italic text-emerald-600">{selectedInvoice.supplier?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Faktur ID</p>
                    <p className="font-black text-xs uppercase italic">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Rem. Balance</p>
                    <p className="font-black text-xs uppercase italic tabular-nums text-rose-600">Rp {Number(selectedInvoice.outstandingAmount).toLocaleString()}</p>
                  </div>
                </div>

                {/* DP Toggle */}
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30 flex items-center justify-between group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="font-black text-xs uppercase text-slate-900">Utilize Down Payment</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase">Available: Rp 500,000</span>
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
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Payment Date</label>
                    <DnaInput
                      icon={<Calendar className="h-4 w-4 text-slate-400" />}
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Payment Source</label>
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
                  <label className="text-[9px] font-black text-slate-400 uppercase block">Settlement Amount (IDR)</label>
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
                  <label className="text-[9px] font-black text-slate-400 uppercase block">Administrative Notes</label>
                  <textarea
                    rows={2}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Add reconciliation notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-4">
                  <DnaButton
                    onClick={() => setIsModalOpen(false)}
                    variant="ghost"
                    className="flex-1 h-11"
                  >
                    Cancel
                  </DnaButton>
                  <DnaButton
                    onClick={handleExecuteSettlement}
                    disabled={paymentMutation.isPending || paymentAmount <= 0}
                    variant="primary"
                    icon={paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    className="flex-[2] h-11 hover:scale-[1.02]"
                  >
                    {paymentMutation.isPending ? "Processing..." : "Execute Settlement"}
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
