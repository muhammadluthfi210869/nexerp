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
import { Button } from "@/components/ui/button";
import { DnaInput, DnaBadge, DnaButton, StatCard, KpiCard, TableWrapper } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
import { toast } from "sonner";

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
      toast.success("Uang muka berhasil dibuat");
      setView("list");
      setSelectedPO(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal membuat uang muka");
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
    <OperationalMigrationShell
      title={view === "list" ? "Uang Muka" : "Buat Uang Muka"}
      subtitle={
        view === "list"
          ? "Kelola uang muka pemasok dan komitmen komersial"
          : "Siapkan transaksi uang muka pembelian"
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
              <StatCard label="Total DP" value="Rp 750.000" subValue="2 catatan MTD" icon={<CreditCard className="text-blue-600" />} />
              <StatCard label="Saldo Terutang" value="Rp 150.000" subValue="Menunggu rekonsiliasi invoice" icon={<AlertCircle className="text-amber-500" />} />
              <KpiCard label="Tingkat Rekonsiliasi" value="80%" targetPct={80} icon={<CheckCircle2 className="text-emerald-500" />} />
            </div>

            {/* List Table */}
            <TableWrapper
              filters={
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div className="relative w-72">
                    <DnaInput
                      icon={<Search className="h-3.5 w-3.5 text-slate-400" />}
                      placeholder="Cari kode atau pemasok..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        <DnaInput type="date" className="h-9 pl-7 text-[9px] font-black w-32" />
                      </div>
                      <span className="text-slate-300 text-xs">—</span>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                        <DnaInput type="date" className="h-9 pl-7 text-[9px] font-black w-32" />
                      </div>
                    </div>
                    <DnaButton variant="outline" size="sm" icon={<Search className="h-3 w-3" />} className="hover:bg-blue-600 hover:text-white">
                      Filter
                    </DnaButton>
                  </div>
                </div>
              }
            >
              <Table className="table-dense">
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-3 px-4 pl-8 text-table-header text-slate-400">ID DP</TableHead>
                    <TableHead className="py-3 px-4 text-table-header text-slate-400">PO / Pemasok</TableHead>
                    <TableHead className="py-3 px-4 text-table-header text-slate-400">Sumber Dana</TableHead>
                    <TableHead className="py-3 px-4 text-table-header text-slate-400 text-right">Jumlah / Terpakai</TableHead>
                    <TableHead className="py-3 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                    <TableHead className="py-3 px-4 text-table-header text-slate-400 text-right pr-8">Protokol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        <p className="text-[10px] font-black uppercase mt-4 text-slate-400">Memuat uang muka...</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!invLoading && invList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-300">Belum ada uang muka</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {!invLoading && invList.map((dp: any, idx: number) => {
                    const totalDp = Number(dp.amountDue);
                    const paidAmount = totalDp - Number(dp.outstandingAmount);
                    return (
                      <TableRow key={dp.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                        <TableCell className="py-2.5 px-3 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-white text-slate-900 flex items-center justify-center font-black text-[9px] border border-slate-200">
                              {idx + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{dp.invoiceNumber}</span>
                        <span className="text-[9px] font-black text-slate-400">{formatDate(dp.issuedAt)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs uppercase">{dp.po?.poNumber || "-"}</span>
                            <span className="text-[9px] font-black text-blue-600 uppercase italic mt-0.5">{dp.supplier?.name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600">Invoice</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-xs tabular-nums">{formatOperationalCurrency(totalDp)}</span>
                            <span className="text-[9px] font-black text-emerald-500 mt-0.5">Terpakai: {formatOperationalCurrency(paidAmount)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          <DnaBadge status={dp.status === "PAID" ? "success" : "warning"}>
                            {getOperationalStatusLabel(dp.status)}
                          </DnaBadge>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 pr-8 text-right">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrapper>

            {/* Owner Insight Callout */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 flex gap-6 items-start shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-blue-50">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-600">Catatan operasional: likuiditas</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Total uang muka saat ini berada dalam batas aman (15% dari pengadaan bulanan).
                  Pastikan DP berstatus <span className="text-blue-600 font-semibold">Lunas</span> memiliki bukti fisik yang dipindai dan dilampirkan ke arsip digital.
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
                    <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                      <Package className="h-3 w-3" /> Select Purchase Order
                    </label>
                    <div className="relative">
                      <select
                        onChange={(e) => setSelectedPO(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase appearance-none px-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      >
                        <option value="">\u2014 SELECT ACTIVE PURCHASE ORDER \u2014</option>
                        {poLoading && <option disabled>Memuat...</option>}
                        {poList.map((po: any) => (
                          <option key={po.id} value={po.id}>{po.poNumber} | {po.supplier?.name || "-"}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ArrowRight className="h-4.5 w-4.5 text-blue-600" />
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
                            <p className="text-[8px] font-black text-slate-400 uppercase">Tanggal</p>
                            <p className="font-black text-slate-900 text-xs uppercase">{formatDate(selectedPOData.createdAt)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Pemasok</p>
                            <p className="font-black text-blue-600 text-xs uppercase italic">{selectedPOData.supplier?.name || "-"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Nilai Total</p>
                            <p className="font-black text-slate-900 text-xs">{formatOperationalCurrency(selectedPOData.totalValue)}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                          <Table className="table-dense">
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-slate-200">
                                <TableHead className="text-[9px] font-black uppercase text-slate-400 pl-6 py-2">Item</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-400 text-center py-2">Qty</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-400 text-right pr-6 py-2">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(selectedPOData.items || []).length > 0 ? selectedPOData.items.map((item: any, i: number) => (
                                <TableRow key={i} className="hover:bg-transparent border-slate-100">
                                  <TableCell className="font-black text-slate-900 text-xs pl-6 uppercase py-2">{item.material?.name || item.name || "-"}</TableCell>
                                  <TableCell className="text-center font-black text-slate-900 text-xs tabular-nums py-2">{item.qty || item.quantity || 0}</TableCell>
                                  <TableCell className="text-right pr-6 font-black text-slate-900 text-xs tabular-nums py-2">{formatOperationalCurrency(item.totalPrice || item.price || 0)}</TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-6 text-[10px] font-black text-slate-300 uppercase">Belum ada data item</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {selectedPO && (
                <div className="rounded-2xl border border-slate-200 shadow-sm p-8 bg-white space-y-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      <h2 className="text-lg font-semibold">Konfigurasi Pembayaran</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Tanggal Transaksi</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <DnaInput type="date" className="pl-10" value={dpDate} onChange={(e) => setDpDate(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Sumber Dana</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase appearance-none pl-10 outline-none focus:ring-2 focus:ring-blue-500">
                            <option>BCA Corporate (2640...)</option>
                            <option>Kas Utama (IDR)</option>
                            <option>Mandiri Reserve</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Jumlah Uang Muka (IDR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs z-10">Rp</span>
                        <DnaInput
                          type="number"
                          value={dpAmount || ""}
                          onChange={(e) => setDpAmount(Number(e.target.value))}
                          placeholder="0.00"
                          className="h-14 pl-10 bg-white border border-slate-200 rounded-xl text-lg font-black tabular-nums placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Catatan Administrasi</label>
                      <textarea
                        rows={3}
                        value={dpNotes}
                        onChange={(e) => setDpNotes(e.target.value)}
                        placeholder="Tambahkan catatan komersial atau rekonsiliasi..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                      />
                    </div>

                    <DnaButton
                      onClick={handleCommitDP}
                      disabled={dpMutation.isPending || dpAmount <= 0}
                      variant="primary"
                      icon={dpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      className="w-full h-12 hover:scale-[1.02]"
                    >
                      {dpMutation.isPending ? "Memproses..." : "Simpan Uang Muka"}
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
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Ringkasan Komersial</p>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase mt-2">Gerbang <span className="text-blue-500">Valuasi</span></h2>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-slate-200">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[9px] font-black uppercase text-slate-500">Nilai Bersih</span>
                          <span className="font-black tabular-nums">{formatOperationalCurrency(selectedPOData?.totalValue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[9px] font-black text-slate-500">Pajak (11%)</span>
                          <span className="font-black tabular-nums">{formatOperationalCurrency(selectedPOData ? Math.round(Number(selectedPOData.totalValue) * 0.11) : undefined)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                          <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Grand Total</span>
                          <span className="text-lg font-black tabular-nums text-slate-900">{formatOperationalCurrency(selectedPOData ? Number(selectedPOData.totalValue) * 1.11 : undefined)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -right-10 -top-10 h-32 w-32 bg-blue-600/10 rounded-full blur-2xl" />
                    <FileText className="h-32 w-32 text-slate-200 absolute -right-6 -bottom-6 rotate-12" />
                  </div>

                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertCircle className="h-4 w-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Audit Kepatuhan</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 leading-relaxed uppercase">
                      Semua uang muka harus diverifikasi Finance sebelum dirilis secara komersial. Pastikan PO telah disetujui.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OperationalMigrationShell>
  );
}
