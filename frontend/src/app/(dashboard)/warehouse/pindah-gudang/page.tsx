"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Warehouse,
 Search,
 ArrowRight,
 CheckCircle2,
 XCircle,
 Clock,
 Package,
 AlertTriangle,
 Truck,
 History,
 ArrowLeftRight,
 ShieldCheck,
 X,
 Plus,
 LayoutDashboard,
 Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
 OperationalButton,
 OperationalPageShell,
 OperationalPanel,
 OperationalStatusBadge,
 getOperationalStatusLabel,
} from "@/components/operational";
// R3 Gate 2: removed FALLBACK_REQUESTS. Empty data → empty state.

export default function PindahGudangPage() {
 const [mounted, setMounted] = useState(false);
 useEffect(() => { setMounted(true); }, []);
 const queryClient = useQueryClient();
 const [selectedReq, setSelectedReq] = useState<any>(null);
 const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
 const [shipmentNotes, setShipmentNotes] = useState("");

 const { data: requisitions, isLoading } = useQuery({
 queryKey: ["warehouse-requisitions"],
 queryFn: async () => {
 const res = await api.get("/warehouse/requisitions");
 return res.data || res;
 },
 });

 const reqList = Array.isArray(requisitions) && requisitions.length > 0
 ? requisitions.map((r: any) => ({
 kode: r.reqNumber,
 dari: r.fromWarehouse,
 ke: r.toWarehouse,
 tanggal: new Date(r.requestDate).toLocaleDateString('id-ID'),
 status: r.status,
 items: r.items?.map((i: any) => ({
 kode: i.materialId?.slice(0, 8),
 nama: i.materialId,
 qty_diminta: Number(i.qty),
 stok: 0,
 satuan: 'pcs',
 catatan: i.notes || '',
 id: i.id,
 })) || [],
 }))
 : [];

 const executeMutation = useMutation({
 mutationFn: async (data: { id: string; items: { itemId: string; qty: number }[]; notes?: string }) => {
 const res = await api.post(`/warehouse/requisitions/${data.id}/execute`, {
 items: data.items,
 notes: data.notes,
 });
 return res.data || res;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["warehouse-requisitions"] });
 },
 });

 // Set default selected request
 if (!selectedReq && reqList.length > 0) {
 setSelectedReq(reqList[0]);
 }

 if (!mounted) return <div className="min-h-full bg-white" />;

 const statusVariant: Record<string, "success" | "process" | "pending" | "danger" | "purple" | "neutral"> = {
 PENDING: "pending",
 APPROVED: "process",
 IN_TRANSIT: "purple",
 RECEIVED: "success",
 REJECTED: "danger",
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
 <OperationalPageShell
 title="Pindah Gudang"
 subtitle="Inventory transfer operations & stock migration control"
 actions={
 <div className="flex gap-4">
 <OperationalButton variant="secondary">
 <History className="h-4 w-4" />
 <span>Transfer History</span>
 </OperationalButton>
 <OperationalButton variant="primary">
 <Plus className="h-4 w-4" />
 <span>Manual Transfer</span>
 </OperationalButton>
 </div>
 }
 >

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* LEFT: Request List */}
 <OperationalPanel className="lg:col-span-4 p-0 overflow-hidden flex flex-col">
 <div className="p-6 border-b border-slate-100 space-y-4">
 <div className="flex justify-between items-center">
 <h3 className="operational-panel-title flex items-center gap-2">
 <Clock className="h-4 w-4 text-indigo-600" />
 Pending <span className="text-indigo-600">Requests</span>
 </h3>
 <OperationalStatusBadge status="process">5 New</OperationalStatusBadge>
 </div>
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <Input placeholder="Search request code..." className="h-10 pl-11 bg-slate-50 border-none rounded-xl font-semibold text-xs" />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-3 space-y-3">
 {isLoading ? (
 <div className="p-8 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
 ) : (
 reqList.map((req) => (
 <motion.div
 key={req?.kode}
 whileHover={{ x: 4 }}
 onClick={() => setSelectedReq(req)}
 className={cn(
 "p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
 selectedReq?.kode === req?.kode
 ? "border-indigo-600 bg-indigo-50/50"
 : "border-slate-100 hover:border-slate-200 bg-white"
 )}
 >
 <div className="flex justify-between items-start mb-3 relative z-10">
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.tanggal}</span>
 <span className={cn(
 "text-base font-semibold tracking-tight transition-colors",
 selectedReq?.kode === req?.kode ? "text-indigo-600" : "text-slate-900"
 )}>
 {req?.kode}
 </span>
 </div>
 <OperationalStatusBadge status={statusVariant[req.status] || "neutral"}>
 {getOperationalStatusLabel(req.status)}
 </OperationalStatusBadge>
 </div>

 <div className="space-y-2 relative z-10">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-slate-200" />
 <span className="text-[11px] font-medium text-slate-500 uppercase truncate">{req.dari}</span>
 </div>
 <div className="ml-1 border-l-2 border-dashed border-slate-100 h-3" />
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-indigo-500" />
 <span className="text-[11px] font-semibold text-slate-900 uppercase truncate">{req.ke}</span>
 </div>
 </div>

 <ArrowRight className={cn(
 "absolute -right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-indigo-100 transition-all group-hover:-right-2 opacity-50",
 selectedReq?.kode === req?.kode && "text-indigo-200 opacity-100"
 )} />
 </motion.div>
 )))}
 </div>
 </OperationalPanel>

 {/* RIGHT: Detail & Execution */}
 <div className="lg:col-span-8 flex flex-col gap-6">
 <AnimatePresence mode="wait">
 <motion.div
 key={selectedReq?.kode}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="flex flex-col gap-6"
 >
 {/* Info Header Card */}
 <OperationalPanel className="p-6 bg-indigo-600 text-white overflow-hidden relative border-none">
 <div className="relative z-10 flex justify-between items-center">
 <div className="space-y-3">
 <div className="flex items-center gap-4">
 <h2 className="text-3xl font-semibold tracking-tight">{selectedReq?.kode || "—"}</h2>
 <OperationalStatusBadge status="process">
 {getOperationalStatusLabel(selectedReq?.status)}
 </OperationalStatusBadge>
 </div>
 <div className="flex items-center gap-6 text-slate-300">
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4" />
 <span className="text-[11px] font-semibold uppercase">{selectedReq?.tanggal || "—"}</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-[11px] font-semibold uppercase text-white">{selectedReq?.dari || "—"}</span>
 <ArrowRight className="h-4 w-4 text-indigo-300" />
 <span className="text-[11px] font-semibold uppercase text-white">{selectedReq?.ke || "—"}</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col items-end gap-2">
 <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest">Total Valuation</span>
 <span className="text-2xl font-semibold text-indigo-200">Rp 4,5jt</span>
 </div>
 </div>
 <Warehouse className="absolute -right-12 -bottom-12 h-48 w-48 text-white/5 rotate-12 pointer-events-none" />
 </OperationalPanel>

 {/* Items Table Card */}
 <OperationalPanel className="flex-1 p-0 overflow-hidden flex flex-col">
 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
 <h3 className="operational-panel-title">Transfer <span className="text-indigo-600">Manifest</span></h3>
 <div className="flex items-center gap-4">
 <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{selectedReq?.items.length ?? 0} Unique Items</span>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
 <th className="py-4 pl-6 text-[10px] font-semibold uppercase text-slate-500">#</th>
 <th className="text-[10px] font-semibold uppercase text-slate-500">Barang</th>
 <th className="text-[10px] font-semibold uppercase text-slate-500 text-right">Diminta</th>
 <th className="text-[10px] font-semibold uppercase text-slate-500 text-right">Stok Tersedia</th>
 <th className="text-[10px] font-semibold uppercase text-slate-500 text-center">Qty Dikirim</th>
 <th className="pr-6 text-[10px] font-semibold uppercase text-slate-500">Catatan</th>
 </tr>
 </thead>
 <tbody>
 {selectedReq?.items.map((item: any, idx: number) => (
 <tr key={item.kode} className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-50">
 <td className="py-4 pl-6 font-semibold text-slate-400 text-xs">{(idx + 1).toString().padStart(2, '0')}</td>
 <td>
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
 <Package className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="font-semibold text-slate-900 text-xs uppercase">{item.nama || "—"}</span>
 <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{item.kode || "—"}</span>
 </div>
 </div>
 </td>
 <td className="text-right font-semibold text-slate-900 text-xs tabular-nums">
 {item.qty_diminta.toLocaleString()} <span className="text-[9px] text-slate-400">{item.satuan}</span>
 </td>
 <td className="text-right">
 <div className={cn(
 "font-semibold text-xs tabular-nums flex items-center justify-end gap-2",
 item.stok >= item.qty_diminta ? "text-emerald-600" : "text-rose-600"
 )}>
 {item.stok.toLocaleString()}
 {item.stok < item.qty_diminta && <AlertTriangle className="h-3 w-3 animate-pulse" />}
 </div>
 </td>
 <td className="text-center">
 <Input
 type="number"
 defaultValue={item.qty_diminta}
 className="w-24 h-9 mx-auto bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl font-semibold text-center text-xs"
 />
 </td>
 <td className="pr-6">
 <p className="text-[10px] font-medium text-slate-400 uppercase truncate max-w-[150px]">{item.catatan || "No notes"}</p>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Execution Footer */}
 <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className={cn(
 "h-10 w-10 rounded-xl flex items-center justify-center",
 selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
 )}>
 {selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5 animate-pulse" />}
 </div>
 <div className="space-y-0.5">
 <p className="text-xs font-semibold text-slate-900 uppercase">
 Stock Validation Status
 </p>
 <p className={cn(
 "text-[10px] font-medium uppercase",
 selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? "text-emerald-600" : "text-rose-600"
 )}>
 {selectedReq?.items.every((i: any) => i.stok >= i.qty_diminta) ? "Ready for immediate dispatch" : "Attention: Stock shortage detected"}
 </p>
 </div>
 </div>

 <div className="flex gap-3">
 <OperationalButton variant="danger" type="button">
 <XCircle className="h-4 w-4" />
 <span>Tolak Permintaan</span>
 </OperationalButton>
 <OperationalButton
 variant="primary"
 type="button"
 onClick={() => setIsConfirmModalOpen(true)}
 disabled={!selectedReq?.items.some((i: any) => i.stok > 0)}
 >
 <Truck className="h-4 w-4" />
 <span>Konfirmasi Kirim</span>
 </OperationalButton>
 </div>
 </div>
 </OperationalPanel>
 </motion.div>
 </AnimatePresence>
 </div>
 </div>

 {/* Confirmation Modal */}
 <AnimatePresence>
 {isConfirmModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsConfirmModalOpen(false)}
 className="absolute inset-0 bg-black/60 backdrop-blur-md"
 />

 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden"
 >
 <div className="p-8 space-y-6">
 <div className="flex justify-between items-start">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <Truck className="h-5 w-5 text-indigo-600" />
 <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-600">Final Validation</span>
 </div>
 <h2 className="text-2xl font-semibold tracking-tight">Konfirmasi <br /> <span className="text-indigo-600">Pindah Gudang</span></h2>
 </div>
 <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="operational-button is-ghost p-2 rounded-full" aria-label="Close">
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
 <div className="space-y-3">
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gudang Asal</span>
 <span className="text-sm font-semibold text-slate-900 uppercase truncate">{selectedReq?.dari || "—"}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gudang Tujuan</span>
 <span className="text-sm font-semibold text-slate-900 uppercase truncate">{selectedReq?.ke || "—"}</span>
 </div>
 </div>
 <div className="space-y-3 text-right">
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Manifest</span>
 <span className="text-sm font-semibold text-slate-900 uppercase">{selectedReq?.items.length ?? 0} Items</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Stock Valuation</span>
 <span className="text-xl font-semibold text-indigo-600 uppercase tabular-nums">Rp 4.500.000</span>
 </div>
 </div>
 </div>

 <div className="operational-field">
 <span>Internal Shipment Notes</span>
 <textarea
 rows={3}
 placeholder="Add special delivery instructions or pallet tracking IDs..."
 className="w-full p-4 bg-slate-50 border-none rounded-2xl font-semibold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
 value={shipmentNotes}
 onChange={(e) => setShipmentNotes(e.target.value)}
 />
 </div>

 <div className="flex gap-4 pt-2">
 <OperationalButton
 variant="secondary"
 onClick={() => setIsConfirmModalOpen(false)}
 className="flex-1"
 >
 Batal
 </OperationalButton>
 <OperationalButton
 variant="primary"
 onClick={() => {
 const items = selectedReq?.items.map((i: any) => ({ itemId: i.id || i.kode, qty: i.qty_diminta || 0 }));
 executeMutation.mutate({ id: selectedReq?.kode, items, notes: shipmentNotes });
 setIsConfirmModalOpen(false);
 }}
 disabled={executeMutation.isPending}
 className="flex-[2]"
 >
 <ShieldCheck className="h-4 w-4" />
 <span>{executeMutation.isPending ? "Processing..." : "Konfirmasi & Kirim"}</span>
 </OperationalButton>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Insight Panel */}
 <OperationalPanel className="p-6 flex gap-6 items-center bg-indigo-50/50 border border-indigo-100">
 <div className="h-12 w-12 rounded-2xl bg-white shadow flex items-center justify-center text-indigo-600 shrink-0">
 <LayoutDashboard className="h-6 w-6" />
 </div>
 <div className="space-y-1">
 <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">Operator Insight: Supply Chain Velocity</p>
 <p className="text-sm font-medium text-slate-600 leading-relaxed">
 Batch validation for <span className="text-indigo-600 font-semibold">Gudang Produksi Mixing</span> is critical to maintain the production timeline.
 Always cross-reference <span className="text-indigo-600 font-semibold">Batch BR-001</span> notes with the physical pallet labels before committing the transfer.
 </p>
 </div>
 </OperationalPanel>
 </OperationalPageShell>
 );
}
