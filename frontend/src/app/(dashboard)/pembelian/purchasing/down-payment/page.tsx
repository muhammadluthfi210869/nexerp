"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Plus,
  History,
  Eye,
  ChevronLeft,
  Save,
  Search,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Package,
  ArrowRight,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DnaInput, DnaBadge, DnaButton, DnaStatCard, DnaDataTableCard, DnaSelect, DnaTextarea, DnaCell } from "@/components/dna";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { toast } from "sonner";

// SPEC: SCR-SCM-DP-001 — Down Payment (Uang Muka) management

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

export default function DownPaymentPrototype() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [dpAmount, setDpAmount] = useState(0);
  const [dpDate, setDpDate] = useState(new Date().toISOString().split("T")[0]);
  const [dpNotes, setDpNotes] = useState("");

  const { data: invoices, isLoading: invLoading } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-invoices");
      return unwrapResponse(res);
    },
  });

  const { data: purchaseOrders, isLoading: poLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res);
    },
  });

  const dpMutation = useMutation({
    mutationFn: async ({ poId, amount, notes }: { poId: string; amount: number; notes?: string }) => {
      const res = await api.post(`/scm/purchase-orders/${poId}/down-payment`, { amount, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      toast.success("Down payment created successfully");
      setView("list");
      setSelectedPO(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create down payment");
    },
  });

  const invList = Array.isArray(invoices) ? invoices.filter((inv: any) => inv.type === "DP") : [];
  const poList = Array.isArray(purchaseOrders) ? purchaseOrders : [];

  const selectedPOData = poList.find((po: any) => po.id === selectedPO);

  const handleCommitDP = () => {
    if (!selectedPO || dpAmount <= 0) return;
    dpMutation.mutate({ poId: selectedPO, amount: dpAmount, notes: dpNotes || undefined });
  };

  return (
    <DashboardShell
      title={view === "list" ? "UANG" : "BUAT DP"}
      titleAccent="MUKA"
      subtitle={
        view === "list"
          ? "(Kelola uang muka pemasok dan komitmen komersial)"
          : "(SCM Procurement Protocol \u2022 Drafting Phase)"
      }
      actions={
        view === "list" ? (
          <div className="flex gap-3">
            <DnaButton
              variant="outline"
              icon={<History className="text-amber-500" />}
            >
              Riwayat
            </DnaButton>
            <DnaButton
              onClick={() => setView("form")}
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              className="hover:scale-105 active:scale-95"
            >
              Buat
            </DnaButton>
          </div>
        ) : (
          <div className="flex gap-3">
            <DnaButton
              variant="ghost"
              onClick={() => { setView("list"); setSelectedPO(null); }}
              icon={<ChevronLeft className="h-4 w-4" />}
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-500"
            >
              Batal
            </DnaButton>
          </div>
        )
      }
    >
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-[var(--section-gap)]"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DnaStatCard label="Total DP" value="Rp 750,000" subtext="2 Records MTD" icon={<CreditCard />} variant="blue" />
              <DnaStatCard label="Saldo Outstanding" value="Rp 150,000" subtext="Menunggu Rekonsiliasi Faktur" icon={<AlertCircle />} variant="amber" />
              <DnaStatCard label="Tingkat Rekonsiliasi" value="80%" subtext="Target: 80%" icon={<CheckCircle2 />} variant="emerald" />
            </div>

            {/* List Table */}
            <DnaDataTableCard
              customToolbar={
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div className="relative w-72">
                    <DnaInput icon={<Search className="h-3.5 w-3.5 text-slate-400" />} placeholder="Cari Kode atau Pemasok..." />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <DnaInput type="date" className="h-9 text-xs w-32" />
                      <span className="text-slate-300 text-xs">—</span>
                      <DnaInput type="date" className="h-9 text-xs w-32" />
                    </div>
                    <DnaButton variant="outline" size="sm" icon={<Search className="h-3 w-3" />}>
                      Filter
                    </DnaButton>
                  </div>
                </div>
              }
            >
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-3 px-4 pl-8">ID DP</th>
                    <th className="py-3 px-4">PO / Pemasok</th>
                    <th className="py-3 px-4">Sumber Dana</th>
                    <th className="py-3 px-4 text-right">Jumlah / Terpakai</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right pr-8">Protokol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invLoading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-[10px] font-bold uppercase mt-4 text-slate-400">Memuat uang muka...</p>
                      </td>
                    </tr>
                  )}
                  {!invLoading && invList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-300">Belum ada uang muka</p>
                      </td>
                    </tr>
                  )}
                  {!invLoading && invList.map((dp: any, idx: number) => {
                    const totalDp = Number(dp.amountDue);
                    const paidAmount = totalDp - Number(dp.outstandingAmount);
                    return (
                      <tr key={dp.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold text-[9px] border border-slate-200">
                              {idx + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 tracking-tight text-xs uppercase italic">{dp.invoiceNumber}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(dp.issuedAt)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs uppercase">{dp.po?.poNumber || "-"}</span>
                            <span className="text-[9px] font-bold text-blue-600 uppercase italic mt-0.5">{dp.supplier?.name || "-"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Invoice</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs tabular-nums">Rp {totalDp.toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase mt-0.5">Used: Rp {paidAmount.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <DnaBadge status={dp.status === "PAID" ? "success" : "warning"}>
                            {statusLabel(dp.status)}
                          </DnaBadge>
                        </td>
                        <td className="py-2.5 px-3 pr-8 text-right">
                          <div className="flex justify-end gap-1.5">
                            <DnaButton variant="ghost" size="icon" icon={<Eye className="h-4 w-4" />} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DnaDataTableCard>

            {/* Owner Insight Callout */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 flex gap-6 items-start shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-blue-50">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 italic">Owner Insight: Liquidity Protocol</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase">
                  Total outstanding down payments are currently within the safe threshold (15% of monthly procurement).
                  Ensure all <span className="text-blue-600 font-black">Lunas</span> status DPs have their original physical receipts scanned and attached to the digital archive.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-[var(--section-gap)] pb-10"
          >
            {/* Form Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: PO Selection & Info */}
              <div className="lg:col-span-8 space-y-6">
                  <div className="rounded-2xl border border-slate-200 shadow-sm p-8 bg-white space-y-6">
                  <div className="space-y-3">
                    <DnaSelect
                      label={<><Package className="h-3 w-3 inline" /> Select Purchase Order</>}
                      placeholder="— SELECT ACTIVE PURCHASE ORDER —"
                      value={selectedPO || ""}
                      onChange={(val) => setSelectedPO(val || null)}
                      options={poList.map((po: any) => ({ label: `${po.poNumber} | ${po.supplier?.name || "-"}`, value: po.id }))}
                    />
                  </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedPO && selectedPOData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-6 border-t border-slate-100 space-y-6 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">PO ID</p>
                            <p className="font-black text-slate-900 text-xs italic uppercase">{selectedPOData.poNumber}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Date</p>
                            <p className="font-black text-slate-900 text-xs uppercase">{formatDate(selectedPOData.createdAt)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Supplier</p>
                            <p className="font-black text-blue-600 text-xs uppercase italic">{selectedPOData.supplier?.name || "-"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Total Value</p>
                            <p className="font-black text-slate-900 text-xs uppercase">Rp {Number(selectedPOData.totalValue).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                          <table className="w-full text-left border-collapse text-[12px]">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px]">
                                <th className="pl-6 py-2">Item</th>
                                <th className="text-center py-2">Qty</th>
                                <th className="text-right pr-6 py-2">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(selectedPOData.items || []).length > 0 ? selectedPOData.items.map((item: any, i: number) => (
                                <tr key={i}>
                                  <td className="font-bold text-slate-900 text-xs pl-6 uppercase py-2">{item.material?.name || item.name || "-"}</td>
                                  <td className="text-center font-bold text-slate-900 text-xs tabular-nums py-2">{item.qty || item.quantity || 0}</td>
                                  <td className="text-right pr-6 font-bold text-slate-900 text-xs tabular-nums py-2">Rp {Number(item.totalPrice || item.price || 0).toLocaleString()}</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={3} className="text-center py-6 text-[10px] font-bold text-slate-300 uppercase">No items data</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {selectedPO && (
                <div className="rounded-2xl border border-slate-200 shadow-sm p-8 bg-white space-y-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      <h2 className="text-lg font-black uppercase tracking-tighter italic">Payment <span className="text-blue-600">Configuration</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DnaInput label="Transaction Date" type="date" value={dpDate} onChange={(e) => setDpDate(e.target.value)} icon={<Calendar className="h-4 w-4 text-slate-400" />} />
                      <DnaSelect
                        label="Funding Source"
                        value=""
                        onChange={() => {}}
                        placeholder="Pilih sumber dana"
                        options={[
                          { label: 'BCA Corporate (2640...)', value: 'bca' },
                          { label: 'Kas Utama (IDR)', value: 'kas' },
                          { label: 'Mandiri Reserve', value: 'mandiri' },
                        ]}
                        icon={<CreditCard className="h-4 w-4 text-slate-400" />}
                      />
                    </div>

                    <DnaInput
                      label="Down Payment Amount (IDR)"
                      type="number"
                      value={dpAmount || ""}
                      onChange={(e) => setDpAmount(Number(e.target.value))}
                      placeholder="0.00"
                      className="h-14 text-lg font-bold tabular-nums"
                    />

                    <DnaTextarea
                      label="Administrative Note"
                      rows={3}
                      value={dpNotes}
                      onChange={(e) => setDpNotes(e.target.value)}
                      placeholder="Add commercial notes or reconciliation context..."
                    />

                    <DnaButton
                      onClick={handleCommitDP}
                      disabled={dpMutation.isPending || dpAmount <= 0}
                      variant="primary"
                      icon={dpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      className="w-full h-12 hover:scale-[1.02]"
                    >
                      {dpMutation.isPending ? "Processing..." : "Commit Down Payment"}
                    </DnaButton>
                  </div>
                )}
              </div>

              {/* Right Column: Financial Summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="sticky top-6 space-y-6">
                  <div className="rounded-2xl border border-slate-200 shadow-sm p-8 bg-white text-slate-900 overflow-hidden relative">
                    <div className="relative z-10 space-y-6">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Commercial Summary</p>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase mt-2">Valuation <span className="text-blue-500">Gate</span></h2>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-slate-200">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[9px] font-black uppercase text-slate-500">Net Value</span>
                          <span className="font-black tabular-nums">Rp {selectedPOData ? Number(selectedPOData.totalValue).toLocaleString() : "0"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[9px] font-black uppercase text-slate-500">Tax Protocol (11%)</span>
                          <span className="font-black tabular-nums">Rp {selectedPOData ? Math.round(Number(selectedPOData.totalValue) * 0.11).toLocaleString() : "0"}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                          <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Grand Total</span>
                          <span className="text-lg font-black tabular-nums text-slate-900">Rp {selectedPOData ? (Number(selectedPOData.totalValue) * 1.11).toLocaleString() : "0"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -right-10 -top-10 h-32 w-32 bg-blue-600/10 rounded-full blur-2xl" />
                    <FileText className="h-32 w-32 text-slate-200 absolute -right-6 -bottom-6 rotate-12" />
                  </div>

                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Compliance Audit</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 leading-relaxed uppercase">
                      All down payment commitments must be verified by the Finance Department before commercial release. Ensure the PO is in "APPROVED" state.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
