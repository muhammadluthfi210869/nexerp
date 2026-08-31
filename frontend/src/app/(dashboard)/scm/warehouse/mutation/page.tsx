"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
 ArrowRightLeft,
 History,
 Plus,
 Search,
 Warehouse,
 Trash2,
 ChevronLeft,
 Save,
 Eye,
 CheckCircle2,
 Clock,
 ArrowRight,
 ClipboardList,
 Layers,
 ArrowDownToLine,
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
 OperationalField,
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

export default function InventoryMutationPrototype() {
 const queryClient = useQueryClient();
 const [view, setView] = useState<"list" | "form">("list");
 const [cart, setCart] = useState<any[]>([]);
 const [selectedProduct, setSelectedProduct] = useState<any>(null);
 const [qty, setQty] = useState<number>(1);
 const [sourceWarehouse, setSourceWarehouse] = useState("");
 const [destWarehouse, setDestWarehouse] = useState("");
 const [notes, setNotes] = useState("");

 const { data: transfers, isLoading: transferLoading } = useQuery({
 queryKey: ["warehouse-transfers"],
 queryFn: async () => {
 const res = await api.get("/warehouse/transfers");
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

 const createMutation = useMutation({
 mutationFn: async (payload: {
 sourceWarehouseId: string;
 destWarehouseId: string;
 notes?: string;
 items: { materialId: string; qty: number }[];
 }) => {
 const res = await api.post("/warehouse/transfers", payload);
 return res.data;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
 toast.success("Transfer created successfully");
 setView("list");
 setCart([]);
 },
 onError: (err: any) => {
 toast.error(err?.response?.data?.message || "Failed to create transfer");
 },
 });

 const transferList = Array.isArray(transfers) ? transfers : [];
 const materialList = Array.isArray(materials) ? materials : [];

 const addToCart = () => {
 if (!selectedProduct) return;
 setCart([...cart, { ...selectedProduct, qty }]);
 setSelectedProduct(null);
 setQty(1);
 };

 const removeFromCart = (index: number) => {
 setCart(cart.filter((_, i) => i !== index));
 };

 const handleFinalize = () => {
 if (!sourceWarehouse || !destWarehouse || cart.length === 0) {
 toast.error("Please select warehouses and add at least one item");
 return;
 }
 createMutation.mutate({
 sourceWarehouseId: sourceWarehouse,
 destWarehouseId: destWarehouse,
 notes: notes || undefined,
 items: cart.map((item) => ({
 materialId: item.id,
 qty: item.qty,
 })),
 });
 };

 return (
 <OperationalMigrationShell
 title={view === "list" ? "MUTASI BARANG" : "BUAT MUTASI"}
 subtitle={
 view === "list"
 ? "Protokol Transfer Stok & Pergerakan Aset Antar-Gudang"
 : "Drafting Phase • Protocol 09-MT"
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
 <button type="button" onClick={handleFinalize} disabled={createMutation.isPending} className="operational-button is-primary">
 <Save className="h-4 w-4" />
 <span>{createMutation.isPending ? "Processing..." : "Finalize Transfer"}</span>
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
 label="Transfer Tertunda"
 value="5"
 icon={<Clock className="h-4 w-4" />}
 tone="amber"
 />
 <OperationalMetricCard
 label="Berhasil"
 value="128"
 icon={<CheckCircle2 className="h-4 w-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Frekuensi Transfer"
 value="12/hari"
 icon={<ArrowRightLeft className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Peringatan Stok"
 value="3"
 icon={<Layers className="h-4 w-4" />}
 tone="red"
 />
 </OperationalMetricGrid>

 {/* List Table */}
 <section className="operational-panel">
 <div className="flex justify-between items-center mb-4">
 <div className="w-72">
 <OperationalInput icon={<Search className="h-4 w-4 text-slate-400" />} placeholder="Cari ID Mutasi..." />
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
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500">ID Transfer</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500">Asal / Tujuan</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500">Dibuat Oleh</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-center">Status</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {transferLoading && (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
 <p className="text-[11px] mt-4 text-slate-400">Memuat transfer...</p>
 </TableCell>
 </TableRow>
 )}
 {!transferLoading && transferList.length === 0 && (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <p className="text-[11px] text-slate-300">Belum ada transfer</p>
 </TableCell>
 </TableRow>
 )}
 {!transferLoading && transferList.map((mut: any) => (
 <TableRow key={mut.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-4 px-4">
 <div className="flex items-center gap-3">
 <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
 <ClipboardList className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="font-semibold text-slate-900 tracking-tight text-[12px]">{mut.transferNumber || mut.kode}</span>
 <span className="text-[10px] text-slate-400">{formatDate(mut.date || mut.createdAt)}</span>
 </div>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4">
 <div className="flex flex-col gap-0.5">
 <div className="flex items-center gap-1.5">
 <Warehouse className="h-3 w-3 text-slate-400" />
 <span className="text-[11px] font-semibold text-slate-600">{mut.sourceWarehouse?.name || mut.dari || "—"}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Warehouse className="h-3 w-3 text-blue-600" />
 <span className="text-[11px] font-semibold text-blue-600">{mut.destWarehouse?.name || mut.ke || "—"}</span>
 </div>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4">
 <OperationalStatusBadge status="neutral" className="text-[10px]">
 {mut.createdBy || mut.pembuat || "—"}
 </OperationalStatusBadge>
 </TableCell>
 <TableCell className="py-4 px-4 text-center">
 <OperationalStatusBadge status={mut.status === "COMPLETED" || mut.status === "Selesai" ? "success" : "pending"} className="text-[10px]">
 {mut.status === "COMPLETED" ? "Selesai" : mut.status === "PENDING" ? "Proses" : getOperationalStatusLabel(mut.status)}
 </OperationalStatusBadge>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
 <Eye className="h-4 w-4" />
 </Button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </section>
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
 {/* Left: Routing */}
 <div className="lg:col-span-4 space-y-6">
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8 relative overflow-hidden">
 <div className="relative z-10 space-y-6">
 <div className="space-y-1">
 <p className="text-[11px] font-semibold tracking-widest text-blue-600">Transfer Path</p>
 <h3 className="text-2xl font-semibold tracking-tight">Warehouse <br/> <span className="text-blue-500 text-3xl">Migration</span></h3>
 </div>

 <div className="space-y-5">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">
 <ArrowDownToLine className="h-3 w-3 inline" /> Gudang Asal
 </label>
 <select
 value={sourceWarehouse}
 onChange={(e) => setSourceWarehouse(e.target.value)}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[12px]"
 >
 <option value="" className="bg-white">-- Pilih Gudang --</option>
 <option value="00000000-0000-0000-0000-000000000001" className="bg-white">Gudang Utama</option>
 <option value="00000000-0000-0000-0000-000000000002" className="bg-white">Gudang Bahan Baku</option>
 </select>
 </div>

 <div className="flex justify-center">
 <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
 <ArrowRight className="h-4 w-4 rotate-90" />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">
 <Warehouse className="h-3 w-3 inline" /> Gudang Tujuan
 </label>
 <select
 value={destWarehouse}
 onChange={(e) => setDestWarehouse(e.target.value)}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[12px]"
 >
 <option value="" className="bg-white">-- Pilih Gudang --</option>
 <option value="00000000-0000-0000-0000-000000000003" className="bg-white">Gudang Produksi</option>
 <option value="00000000-0000-0000-0000-000000000004" className="bg-white">Gudang Mixing</option>
 <option value="00000000-0000-0000-0000-000000000005" className="bg-white">Gudang Jadi</option>
 </select>
 </div>
 </div>

 <div className="pt-6 border-t border-slate-200 space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Logistics Notes</label>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
 rows={3}
 placeholder="Provide reason for mutation..."
 />
 </div>
 </div>
 <Warehouse className="h-40 w-40 text-slate-200 absolute -right-10 -bottom-10 rotate-12" />
 </div>
 </div>

 {/* Right: Asset Picker & Manifest */}
 <div className="lg:col-span-8 space-y-6">
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8">
 <div className="flex items-center justify-between">
 <div className="space-y-1">
 <h2 className="text-xl font-semibold tracking-tight">Resource <span className="text-blue-600">Selection</span></h2>
 <p className="text-[11px] font-semibold text-slate-400 tracking-widest">Select assets for logical migration</p>
 </div>
 <OperationalStatusBadge status="purple">
 Asset Integrity Verified
 </OperationalStatusBadge>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
 <div className="md:col-span-6 space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Search Asset</label>
 <select
 onChange={(e) => setSelectedProduct(materialList.find((p: any) => p.id === e.target.value))}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-[12px]"
 >
 <option value="">— CHOOSE ASSET —</option>
 {materialList.map((p: any) => (
 <option key={p.id} value={p.id}>{p.name} | {Number(p.stockQty || 0).toLocaleString()} {p.unit || "pcs"} Available</option>
 ))}
 </select>
 </div>
 <div className="md:col-span-3 space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Transfer Qty</label>
 <DnaInput
 type="number"
 value={qty}
 onChange={(e) => setQty(Number(e.target.value))}
 className="h-11 bg-slate-50 border-slate-200 rounded-xl font-semibold text-center text-[12px]"
 />
 </div>
 <div className="md:col-span-3 h-11">
 <OperationalButton variant="primary" onClick={addToCart} className="w-full h-full text-[11px]">
 <Plus className="h-4 w-4" />
 <span>Add to Transfer</span>
 </OperationalButton>
 </div>
 </div>
 </div>

 {/* Manifest Table */}
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 overflow-hidden">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-2">
 <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
 <Layers className="h-4 w-4" />
 </div>
 <h3 className="text-base font-semibold tracking-tight">Migration <span className="text-blue-600">Manifest</span></h3>
 </div>
 {cart.length > 0 && (
 <button type="button" onClick={() => setCart([])} className="operational-button is-ghost text-rose-500 hover:bg-rose-50 rounded-md h-9 text-[11px]">
 <Trash2 className="h-4 w-4" />
 <span>Clear Manifest</span>
 </button>
 )}
 </div>

 <div className="border border-slate-200 rounded-2xl overflow-hidden">
 <Table className="table-dense">
 <TableHeader>
 <TableRow className="bg-slate-50/50">
 <TableHead className="py-4 px-4 text-[11px] font-semibold text-slate-500">Barang</TableHead>
 <TableHead className="py-4 px-4 text-center text-[11px] font-semibold text-slate-500">Kode</TableHead>
 <TableHead className="py-4 px-4 text-center text-[11px] font-semibold text-slate-500">Satuan</TableHead>
 <TableHead className="py-4 px-4 text-center text-[11px] font-semibold text-slate-500">Qty Mutasi</TableHead>
 <TableHead className="py-4 px-4 text-right text-[11px] font-semibold text-slate-500">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {cart.length === 0 ? (
 <TableRow>
 <TableCell colSpan={5} className="py-14 text-center">
 <div className="flex flex-col items-center gap-3">
 <ArrowRightLeft className="h-10 w-10 text-slate-200" />
 <p className="text-[11px] text-slate-300 tracking-widest">No assets staged for migration</p>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 cart.map((item, i) => (
 <TableRow key={i} className="group hover:bg-slate-50 transition-all border-b border-slate-50">
 <TableCell className="py-4 px-4">
 <span className="font-semibold text-slate-900 text-[12px]">{item.name}</span>
 </TableCell>
 <TableCell className="py-4 px-4 text-center">
 <OperationalStatusBadge status="neutral" className="text-[10px]">{item.code || item.id}</OperationalStatusBadge>
 </TableCell>
 <TableCell className="py-4 px-4 text-center font-semibold text-slate-400 text-[12px]">{item.unit || "pcs"}</TableCell>
 <TableCell className="py-4 px-4 text-center font-semibold text-slate-900 text-[12px] tabular-nums">
 {item.qty}
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <Button variant="ghost" size="icon" onClick={() => removeFromCart(i)} className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all">
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
