"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
 Plus,
 History,
 Eye,
 Search,
 Warehouse,
 Trash2,
 ChevronLeft,
 Save,
 ShoppingCart,
 ArrowRightLeft,
 ArrowRight,
 ClipboardList,
 CheckCircle2,
 Clock,
 ArrowDownToLine,
 Layers,
 Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalInput,
 OperationalStatusBadge,
 OperationalButton,
 getOperationalStatusLabel,
} from "@/components/operational/OperationalUI";
import { DnaInput } from "@/components/dna";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow
} from "@/components/ui/table";
import { toast } from "sonner";

const formatDate = (dateStr: string) => {
 const d = new Date(dateStr);
 return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

const statusLabel = (status: string) => {
 switch (status) {
 case "APPROVED": return "Diterima";
 case "REJECTED": return "Ditolak";
 case "PENDING":
 case "PROCESSING": return "Proses";
 default: return status;
 }
};

export default function MaterialRequisitionPrototype() {
 const queryClient = useQueryClient();
 const [view, setView] = useState<"list" | "form">("list");
 const [cart, setCart] = useState<any[]>([]);
 const [selectedProduct, setSelectedProduct] = useState<any>(null);
 const [qty, setQty] = useState<number>(1);
 const [fromWarehouse, setFromWarehouse] = useState("");
 const [toWarehouse, setToWarehouse] = useState("");
 const [notes, setNotes] = useState("");
 const [selectedRequest, setSelectedRequest] = useState<any>(null);
 const [returnQty, setReturnQty] = useState<Record<string, number>>({});
 const [returnReason, setReturnReason] = useState("");

 const { data: requisitions, isLoading: reqLoading } = useQuery({
 queryKey: ["warehouse-requisitions"],
 queryFn: async () => {
 const res = await api.get("/warehouse/requisitions");
 return unwrapResponse(res);
 },
 });

 const { data: materials } = useQuery({
 queryKey: ["master-materials"],
 queryFn: async () => {
 const res = await api.get("/master/materials");
 return unwrapResponse(res);
 },
 });

 const { data: warehouses } = useQuery({
 queryKey: ["warehouse-active-list"],
 queryFn: async () => unwrapResponse(await api.get("/warehouse/warehouses")),
 });

 const createMutation = useMutation({
 mutationFn: async (payload: {
 fromWarehouse: string;
 toWarehouse: string;
 notes?: string;
 items: { materialId: string; qty: number; notes?: string }[];
 }) => {
 const res = await api.post("/warehouse/requisitions", payload);
 return res.data;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["warehouse-requisitions"] });
 toast.success("Requisition created successfully");
 setView("list");
 setCart([]);
 },
 onError: (err: any) => {
 toast.error(err?.response?.data?.message || "Failed to create requisition");
 },
 });

 const refreshRequests = () => queryClient.invalidateQueries({ queryKey: ["warehouse-requisitions"] });
 const approveMutation = useMutation({
 mutationFn: (id: string) => api.patch(`/warehouse/requisitions/${id}/status`, { status: "APPROVED" }),
 onSuccess: () => { toast.success("Permintaan disetujui"); refreshRequests(); },
 onError: (err: any) => toast.error(err?.response?.data?.message || "Gagal menyetujui permintaan"),
 });
 const issueMutation = useMutation({
 mutationFn: (id: string) => api.post(`/warehouse/requisitions/${id}/issue`, { idempotencyKey: crypto.randomUUID() }),
 onSuccess: () => { toast.success("Material telah dikirim"); setSelectedRequest(null); refreshRequests(); queryClient.invalidateQueries({ queryKey: ["warehouse-catalog"] }); },
 onError: (err: any) => toast.error(err?.response?.data?.message || "Pengiriman gagal"),
 });
 const returnMutation = useMutation({
 mutationFn: ({ req, quantities, reason }: { req: any; quantities: Record<string, number>; reason: string }) => api.post(`/warehouse/requisitions/${req.id}/return`, {
 idempotencyKey: crypto.randomUUID(),
 reason: reason || undefined,
 items: req.items.filter((item: any) => Number(quantities[item.id] || 0) > 0).map((item: any) => ({ requisitionItemId: item.id, qty: Number(quantities[item.id]) })),
 }),
 onSuccess: () => { toast.success("Pengembalian internal tercatat"); setSelectedRequest(null); setReturnQty({}); setReturnReason(""); refreshRequests(); queryClient.invalidateQueries({ queryKey: ["warehouse-catalog"] }); },
 onError: (err: any) => toast.error(err?.response?.data?.message || "Pengembalian gagal"),
 });

 const reqList = Array.isArray(requisitions) ? requisitions : [];
 const materialList = Array.isArray(materials) ? materials : [];
 const warehouseList = Array.isArray(warehouses) ? warehouses : [];

 const addToCart = () => {
 if (!selectedProduct) return;
 setCart([...cart, { ...selectedProduct, qty, note: "" }]);
 setSelectedProduct(null);
 setQty(1);
 };

 const removeFromCart = (index: number) => {
 setCart(cart.filter((_, i) => i !== index));
 };

 const handleSave = () => {
 if (!fromWarehouse || !toWarehouse || cart.length === 0) {
 toast.error("Please select warehouses and add at least one item");
 return;
 }
 createMutation.mutate({
 fromWarehouse,
 toWarehouse,
 notes: notes || undefined,
 items: cart.map((item) => ({
 materialId: item.id,
 qty: item.qty,
 notes: item.note || undefined,
 })),
 });
 };

 return (
 <OperationalMigrationShell
 title={view === "list" ? "PERMINTAAN BARANG" : "BUAT PERMINTAAN"}
 subtitle={
 view === "list"
 ? "Requisisi Material Internal & Alokasi Stok Antar-Gudang"
 : "Drafting Phase • Protocol 05-PR"
 }
 actions={
 view === "list" ? (
 <div className="flex gap-3">
 <button type="button" className="operational-button is-secondary">
 <History className="h-4 w-4 text-amber-500" />
 <span>Riwayat</span>
 </button>
 <button type="button" onClick={() => setView("form")} className="operational-button is-primary">
 <Plus className="h-4 w-4" />
 <span>Buat</span>
 </button>
 </div>
 ) : (
 <div className="flex gap-3">
 <button type="button" onClick={() => setView("list")} className="operational-button is-ghost text-rose-500 hover:bg-rose-50">
 <ChevronLeft className="h-4 w-4" />
 <span>Batal</span>
 </button>
 <button type="button" onClick={handleSave} disabled={createMutation.isPending} className="operational-button is-primary">
 <Save className="h-4 w-4" />
 <span>{createMutation.isPending ? "Processing..." : "Simpan Permintaan"}</span>
 </button>
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
 className="flex flex-col gap-6"
 >
 {/* Quick Stats */}
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Permintaan Aktif"
 value="12"
 icon={<Clock className="h-4 w-4" />}
 tone="amber"
 />
 <OperationalMetricCard
 label="Terpenuhi Hari Ini"
 value="45"
 icon={<CheckCircle2 className="h-4 w-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Stok Dalam Transit"
 value="8"
 icon={<ArrowRightLeft className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Prioritas"
 value="3"
 icon={<Layers className="h-4 w-4" />}
 tone="red"
 />
 </OperationalMetricGrid>

 {/* List Table */}
 <section className="operational-panel">
 <div className="flex justify-between items-center mb-4">
 <div className="w-72">
 <OperationalInput icon={<Search className="h-4 w-4 text-slate-400" />} placeholder="Cari ID Requisisi..." />
 </div>
 <div className="flex gap-4">
 <button type="button" className="operational-button is-ghost text-slate-500">
 Filter: Semua Status
 </button>
 </div>
 </div>
 <Table className="table-dense">
 <TableHeader>
 <TableRow className="bg-slate-50/50">
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500">ID Permintaan</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500">Asal / Tujuan</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500">Peminta / Catatan</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-center">Status</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {reqLoading && (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
 <p className="text-[11px] mt-4 text-slate-400">Memuat requisisi...</p>
 </TableCell>
 </TableRow>
 )}
 {!reqLoading && reqList.length === 0 && (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <p className="text-[11px] text-slate-300">Belum ada requisisi</p>
 </TableCell>
 </TableRow>
 )}
 {!reqLoading && reqList.map((req: any) => (
 <TableRow key={req.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-4 px-4">
 <div className="flex items-center gap-3">
 <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
 <ClipboardList className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="font-semibold text-slate-900 tracking-tight text-[12px]">{req.reqNumber}</span>
 <span className="text-[10px] text-slate-400">{formatDate(req.requestDate)}</span>
 </div>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4">
 <div className="flex flex-col gap-0.5">
 <div className="flex items-center gap-1.5">
 <Warehouse className="h-3 w-3 text-slate-400" />
 <span className="text-[11px] font-semibold text-slate-600">{req.fromWh?.name || req.fromWarehouse || "—"}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Warehouse className="h-3 w-3 text-blue-600" />
 <span className="text-[11px] font-semibold text-blue-600">{req.toWh?.name || req.toWarehouse || "—"}</span>
 </div>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4">
 <div className="flex flex-col">
 <OperationalStatusBadge status="neutral" className="text-[10px]">
 {req.requester?.fullName || req.createdById || "—"}
 </OperationalStatusBadge>
 <p className="text-[10px] text-slate-400 truncate mt-1 max-w-[200px]">{req.notes || ""}</p>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4 text-center">
 <OperationalStatusBadge status={req.status === "APPROVED" || req.status === "Diterima" ? "success" : "pending"} className="text-[10px]">
 {statusLabel(req.status)}
 </OperationalStatusBadge>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <div className="flex justify-end gap-2">
 {req.status === "PENDING" && <Button onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending} className="h-8 text-[10px]">Setujui</Button>}
 {req.status === "APPROVED" && <Button onClick={() => issueMutation.mutate(req.id)} disabled={issueMutation.isPending} className="h-8 text-[10px] bg-blue-600 hover:bg-blue-700">Kirim</Button>}
 {req.status === "FULFILLED" && <Button onClick={() => { setSelectedRequest(req); setReturnQty(Object.fromEntries((req.items || []).map((item: any) => [item.id, 0]))); }} className="h-8 text-[10px] bg-amber-600 hover:bg-amber-700">Return Internal</Button>}
 <Button variant="ghost" size="icon" aria-label={`Lihat ${req.reqNumber}`} onClick={() => setSelectedRequest(req)} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
 <Eye className="h-4 w-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </section>
 {selectedRequest && (
 <section className="operational-panel space-y-4" aria-label="Detail permintaan dan pengembalian internal">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-semibold text-slate-900">{selectedRequest.reqNumber}</p>
 <p className="text-xs text-slate-500">Status: {statusLabel(selectedRequest.status)}. Material dan kuantitas permintaan diwariskan dari dokumen.</p>
 </div>
 <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>Tutup</Button>
 </div>
 <div className="space-y-3">
 {(selectedRequest.items || []).map((item: any) => {
 const issued = Number(item.qtyIssued || 0);
 const returned = Number(item.qtyReturned || 0);
 const eligible = Math.max(0, issued - returned);
 return <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
 <div><p className="text-sm font-medium text-slate-900">{item.material?.name || item.materialId}</p><p className="text-xs text-slate-500">Diminta {Number(item.qty)} · Terkirim {issued} · Dikembalikan {returned} {item.material?.unit || ""}</p></div>
 {selectedRequest.status === "FULFILLED" && <DnaInput aria-label={`Jumlah return ${item.material?.name || item.materialId}`} type="number" min="0" max={eligible} value={returnQty[item.id] || ""} onChange={(e) => setReturnQty({ ...returnQty, [item.id]: Number(e.target.value) })} placeholder={`Maks. ${eligible}`} className="h-10 w-32" />}
 {selectedRequest.status === "FULFILLED" && <span className="text-xs text-slate-500">Maks. {eligible}</span>}
 </div>;
 })}
 </div>
 {selectedRequest.status === "FULFILLED" && <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-end">
 <label className="flex-1 text-xs font-medium text-slate-600">Alasan/kondisi (opsional)<DnaInput value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="mt-1 h-10" placeholder="Contoh: material tidak terpakai" /></label>
 <Button onClick={() => returnMutation.mutate({ req: selectedRequest, quantities: returnQty, reason: returnReason })} disabled={returnMutation.isPending || !Object.values(returnQty).some((value) => Number(value) > 0)} className="h-10 bg-amber-600 hover:bg-amber-700">{returnMutation.isPending ? "Mencatat..." : "Catat Return Internal"}</Button>
 </div>}
 </section>
 )}
 </motion.div>
 ) : (
 <motion.div
 key="form"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="flex flex-col gap-6 pb-10"
 >
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Left: Configuration */}
 <div className="lg:col-span-4 space-y-6">
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8 relative overflow-hidden">
 <div className="relative z-10 space-y-6">
 <div className="space-y-1">
 <p className="text-[11px] font-semibold tracking-widest text-blue-600">Logistical Path</p>
 <h3 className="text-2xl font-semibold tracking-tight">Warehouse <br/> <span className="text-blue-500 text-3xl">Routing</span></h3>
 </div>

 <div className="space-y-5">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">
 <ArrowDownToLine className="h-3 w-3 inline" /> Gudang Peminta
 </label>
 <select
 value={fromWarehouse}
 onChange={(e) => setFromWarehouse(e.target.value)}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[12px]"
 >
 <option value="" className="bg-white">-- Pilih Gudang --</option>
 {warehouseList.map((warehouse: any) => <option key={warehouse.id} value={warehouse.id} className="bg-white">{warehouse.name}</option>)}
 </select>
 </div>

 <div className="flex justify-center">
 <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
 <ArrowRight className="h-4 w-4 rotate-90" />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">
 <Warehouse className="h-3 w-3 inline" /> Gudang Penyedia
 </label>
 <select
 value={toWarehouse}
 onChange={(e) => setToWarehouse(e.target.value)}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[12px]"
 >
 <option value="" className="bg-white">-- Pilih Gudang --</option>
 {warehouseList.map((warehouse: any) => <option key={warehouse.id} value={warehouse.id} className="bg-white">{warehouse.name}</option>)}
 </select>
 </div>
 </div>

 <div className="pt-6 border-t border-slate-200 space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Commercial Notes</label>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
 rows={3}
 placeholder="Production batch ref..."
 />
 </div>
 </div>
 <Warehouse className="h-40 w-40 text-slate-200 absolute -right-10 -bottom-10 rotate-12" />
 </div>
 </div>

 {/* Right: Item Selection & Cart */}
 <div className="lg:col-span-8 space-y-6">
 {/* Item Picker */}
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8">
 <div className="flex items-center justify-between">
 <div className="space-y-1">
 <h2 className="text-xl font-semibold tracking-tight">Resource <span className="text-blue-600">Allocation</span></h2>
 <p className="text-[11px] font-semibold text-slate-400 tracking-widest">Select materials to be requisitioned</p>
 </div>
 <OperationalStatusBadge status="purple">
 Real-time Stock Enabled
 </OperationalStatusBadge>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
 <div className="md:col-span-5 space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Search Material</label>
 <select
 onChange={(e) => setSelectedProduct(materialList.find((p: any) => p.id === e.target.value))}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[12px]"
 >
 <option value="">— CHOOSE MATERIAL —</option>
 {materialList.map((p: any) => (
 <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
 ))}
 </select>
 </div>
 <div className="md:col-span-3 space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Request Qty</label>
 <DnaInput
 type="number"
 value={qty}
 onChange={(e) => setQty(Number(e.target.value))}
 className="h-11 bg-slate-50 border-slate-200 rounded-xl font-semibold text-center text-[12px]"
 />
 </div>
 <div className="md:col-span-4 h-11">
 <OperationalButton variant="primary" onClick={addToCart} className="w-full h-full text-[11px]">
 <Plus className="h-4 w-4" />
 <span>Add to Allocation</span>
 </OperationalButton>
 </div>
 </div>

 {/* Stock Feedback (Only if product selected) */}
 <AnimatePresence>
 {selectedProduct && (
 <motion.div
 initial={{ opacity: 0, y: -5 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -5 }}
 className="grid grid-cols-2 gap-4"
 >
 <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between overflow-hidden relative">
 <div>
 <p className="text-[10px] font-semibold text-slate-400 tracking-widest">Requesting Stock</p>
 <p className="text-lg font-semibold text-slate-900 tabular-nums">{selectedProduct.stockQty || 0} <span className="text-[10px] text-slate-400 font-semibold">{selectedProduct.unit || "pcs"}</span></p>
 </div>
 <ArrowDownToLine className="h-8 w-8 text-slate-200" />
 </div>
 <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between overflow-hidden relative">
 <div>
 <p className="text-[10px] font-semibold text-blue-600 tracking-widest">Available Stock</p>
 <p className="text-lg font-semibold text-blue-700 tabular-nums">{selectedProduct.stockQty || 0} <span className="text-[10px] text-slate-400 font-semibold">{selectedProduct.unit || "pcs"}</span></p>
 </div>
 <Warehouse className="h-8 w-8 text-blue-200" />
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Cart Table */}
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 overflow-hidden">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-2">
 <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
 <ShoppingCart className="h-4 w-4" />
 </div>
 <h3 className="text-base font-semibold tracking-tight">Allocation <span className="text-blue-600">Manifest</span></h3>
 </div>
 {cart.length > 0 && (
 <button type="button" onClick={() => setCart([])} className="operational-button is-ghost text-rose-500 hover:bg-rose-50 rounded-md h-9 text-[11px]">
 <Trash2 className="h-4 w-4" />
 <span>Clear Cart</span>
 </button>
 )}
 </div>

 <div className="border border-slate-200 rounded-2xl overflow-hidden">
 <Table className="table-dense">
 <TableHeader>
 <TableRow className="bg-slate-50/50">
 <TableHead className="py-4 px-4 text-[11px] font-semibold text-slate-500">#</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-semibold text-slate-500">Barang</TableHead>
 <TableHead className="py-4 px-4 text-center text-[11px] font-semibold text-slate-500">Qty</TableHead>
 <TableHead className="py-4 px-4 text-center text-[11px] font-semibold text-slate-500">Info Stok</TableHead>
 <TableHead className="py-4 px-4 text-center text-[11px] font-semibold text-slate-500">Catatan</TableHead>
 <TableHead className="py-4 px-4 text-right text-[11px] font-semibold text-slate-500">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {cart.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="py-14 text-center">
 <div className="flex flex-col items-center gap-3">
 <Layers className="h-10 w-10 text-slate-200" />
 <p className="text-[11px] text-slate-300 tracking-widest">No materials added to manifest</p>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 cart.map((item, i) => (
 <TableRow key={i} className="group hover:bg-slate-50 transition-all border-b border-slate-50">
 <TableCell className="py-4 px-4 font-semibold text-slate-400 text-[12px]">{i + 1}</TableCell>
 <TableCell className="py-4 px-4">
 <div className="flex flex-col">
 <span className="font-semibold text-slate-900 text-[12px]">{item.name}</span>
 <span className="text-[10px] text-slate-400 tracking-widest">Kode: {item.code || item.id}</span>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4 text-center font-semibold text-slate-900 text-[12px] tabular-nums">
 {item.qty} <span className="text-[10px] text-slate-400 font-medium">{item.unit || "pcs"}</span>
 </TableCell>
 <TableCell className="py-4 px-4 text-center">
 <OperationalStatusBadge status="purple" className="text-[10px]">
 {item.stockQty || 0} Available
 </OperationalStatusBadge>
 </TableCell>
 <TableCell className="py-4 px-4 text-center min-w-[150px]">
 <DnaInput
 className="h-8 text-[11px] bg-slate-50 border-slate-200 rounded-md font-medium"
 placeholder="Catatan item..."
 value={item.note || ""}
 onChange={(e) => {
 const newCart = [...cart];
 newCart[i].note = e.target.value;
 setCart(newCart);
 }}
 />
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => removeFromCart(i)}
 className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
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
