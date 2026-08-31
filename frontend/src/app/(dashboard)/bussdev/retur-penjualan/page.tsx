"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
 RotateCcw,
 History,
 Eye,
 Search,
 Calendar,
 FileText,
 ChevronLeft,
 Save,
 ShoppingCart,
 ArrowRightLeft,
 CheckCircle2,
 Clock,
 Layers,
 PackageX,
 ShieldAlert,
 Coins,
 Receipt,
 Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { DnaInput, DnaButton } from "@/components/dna";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";
import {
 OperationalDataTable,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalMigrationShell,
 OperationalStatusBadge,
 getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalCurrency, formatOperationalDate } from "@/lib/operational-formatters";

type SalesReturn = {
 id: string;
 returnDate: string;
 soId: string;
 warehouseId: string;
 notes: string;
 returnStatus: string;
 createdAt: string;
 so?: { orderNumber: string; lead?: { clientName?: string } } | null;
 warehouse?: { name: string } | null;
 items?: any[];
};

type SalesOrder = {
 id: string;
 orderNumber: string;
 lead?: { clientName: string } | null;
 items?: { id: string; productName: string; quantity: number; unitPrice: number }[];
};

type Warehouse = {
 id: string;
 name: string;
};

export default function SalesReturnPage() {
 const [view, setView] = useState<"list" | "form">("list");
 const [returns, setReturns] = useState<SalesReturn[]>([]);
 const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
 const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);
 const [returnItems, setReturnItems] = useState<any[]>([]);

 const [formData, setFormData] = useState({
 soId: "",
 warehouseId: "",
 returnStatus: "POTONG_TAGIHAN",
 notes: "",
 returnDate: new Date().toISOString().split("T")[0],
 });

 const fetchReturns = useCallback(async () => {
 try {
 setLoading(true);
 const res = await api.get("/bussdev/sales-returns");
 setReturns(Array.isArray(res.data) ? res.data : []);
 } catch {
 toast.error("Gagal memuat data retur penjualan");
 } finally {
 setLoading(false);
 }
 }, []);

 const fetchSalesOrders = useCallback(async () => {
 try {
 const res = await api.get("/commercial/sales-orders");
 setSalesOrders(Array.isArray(res.data) ? res.data : []);
 } catch {
 setSalesOrders([]);
 }
 }, []);

 const fetchWarehouses = useCallback(async () => {
 try {
 const res = await api.get("/master/warehouses");
 setWarehouses(Array.isArray(res.data) ? res.data : []);
 } catch {
 setWarehouses([]);
 }
 }, []);

 useEffect(() => {
 fetchReturns();
 fetchSalesOrders();
 fetchWarehouses();
 }, [fetchReturns, fetchSalesOrders, fetchWarehouses]);

 const handleSelectSO = (soId: string) => {
 const so = salesOrders.find(s => s.id === soId);
 if (so) {
 setSelectedSO(so);
 setFormData({ ...formData, soId: so.id });
 setReturnItems(
 (so.items || []).map((item) => ({
 ...item,
 qtyReturned: 0,
 qtyOriginal: item.quantity,
 }))
 );
 }
 };

 const updateItem = (id: string, field: string, value: any) => {
 setReturnItems((prev) =>
 prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
 );
 };

 const financials = useMemo(() => {
 const subtotal = returnItems.reduce(
 (acc, item) => acc + (item.qtyReturned * (item.unitPrice || 0)),
 0
 );
 const tax = subtotal * 0.11;
 return { subtotal, tax, total: subtotal + tax };
 }, [returnItems]);

 const handleSubmit = () => {
 if (!formData.soId || !formData.warehouseId) {
 toast.error("Lengkapi semua field wajib");
 return;
 }
 const validItems = returnItems.filter((i) => i.qtyReturned > 0);
 if (validItems.length === 0) {
 toast.error("Minimal 1 item harus diretur");
 return;
 }
 setShowConfirm(true);
 };

 const confirmSubmit = async () => {
 setShowConfirm(false);
 const validItems = returnItems.filter((i: any) => i.qtyReturned > 0);
 try {
 setSaving(true);
 await api.post("/bussdev/sales-returns", {
 ...formData,
 items: validItems.map((i) => ({
 materialId: i.materialItemId || i.id,
 qtyOriginal: i.qtyOriginal,
 qtyReturned: i.qtyReturned,
 })),
 });
 toast.success("Retur penjualan berhasil disimpan");
 setView("list");
 fetchReturns();
 resetForm();
 } catch {
 toast.error("Gagal menyimpan retur penjualan");
 } finally {
 setSaving(false);
 }
 };

 const resetForm = () => {
 setFormData({ soId: "", warehouseId: "", returnStatus: "POTONG_TAGIHAN", notes: "", returnDate: new Date().toISOString().split("T")[0] });
 setSelectedSO(null);
 setReturnItems([]);
 };

 const columns = useMemo(
 () => [
 {
 id: "return",
 header: "Return Identity",
 cell: ({ row }: any) => {
 const ret = row.original;
 return (
 <div className="flex items-center gap-3">
 <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
 <RotateCcw className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{ret.so?.orderNumber || "—"}</span>
 <span className="text-[9px] font-medium text-slate-400 uppercase mt-0.5">{formatOperationalDate(ret.returnDate)}</span>
 </div>
 </div>
 );
 },
 },
 {
 accessorKey: "soNumber",
 header: "Source SO",
 cell: ({ row }: any) => (
 <div className="flex flex-col">
 <span className="font-black text-slate-900 text-xs uppercase">{row.original.so?.orderNumber || "—"}</span>
 <span className="text-[9px] font-medium text-rose-600 uppercase italic mt-0.5">Linked SO</span>
 </div>
 ),
 },
 {
 accessorKey: "clientName",
 header: "Client",
 cell: ({ row }: any) => (
 <span className="font-black text-slate-900 text-xs uppercase">{row.original.so?.lead?.clientName || "—"}</span>
 ),
 },
 {
 id: "value",
 header: () => <div className="text-right">Value Recovery</div>,
 cell: () => <div className="text-right font-black text-slate-900 text-xs tabular-nums">—</div>,
 },
 {
 accessorKey: "returnStatus",
 header: () => <div className="text-center">Status</div>,
 cell: ({ getValue }: any) => {
 const status = getValue() as string;
 const tone = status === "SELESAI" ? "success" : status === "PROSES" ? "pending" : "neutral";
 return (
 <div className="flex justify-center">
 <OperationalStatusBadge status={tone}>{getOperationalStatusLabel(status)}</OperationalStatusBadge>
 </div>
 );
 },
 },
 {
 id: "action",
 header: () => <div className="text-right">Action</div>,
 cell: () => (
 <div className="flex justify-end">
 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
 <Eye className="h-4 w-4" />
 </Button>
 </div>
 ),
 },
 ],
 [],
 );

 return (
 <OperationalMigrationShell
 title="RETUR"
 titleAccent="PENJUALAN"
 subtitle="Sales Return Management & Inventory Recalibration Protocol"
 actions={
 <div className="flex gap-4">
 <DnaButton variant="outline" size="md">
 <History className="mr-2 h-4 w-4 text-blue-500" /> Riwayat
 </DnaButton>
 <DnaButton
 onClick={() => { resetForm(); setView("form"); }}
 variant="primary"
 size="md"
 >
 <RotateCcw className="mr-2 h-5 w-5" /> Buat
 </DnaButton>
 </div>
 }
 >
 <AnimatePresence mode="wait">
 {view === "list" ? (
 <motion.div
 key="list"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 className="space-y-10"
 >
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Pending Returns"
 value={returns.filter(r => r.returnStatus === "PROSES").length}
 icon={<Clock className="h-4 w-4" />}
 tone="amber"
 />
 <OperationalMetricCard
 label="Total Returns"
 value={returns.length}
 icon={<Coins className="h-4 w-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Return Frequency"
 value="—"
 icon={<ArrowRightLeft className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Completed"
 value={returns.filter(r => r.returnStatus === "SELESAI").length}
 icon={<ShieldAlert className="h-4 w-4" />}
 tone="red"
 />
 </OperationalMetricGrid>

 <DnaInput
 placeholder="Search Return ID..."
 icon={<Search className="h-4 w-4" />}
 className="bg-slate-50 border-none rounded-xl text-xs font-medium"
 />
 <OperationalDataTable
 data={returns}
 columns={columns as any}
 getRowId={(row: any) => row.id}
 searchPlaceholder="Cari retur..."
 />
 </motion.div>
 ) : (
 <motion.div
 key="form"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="max-w-7xl mx-auto space-y-10 pb-20"
 >
 <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
 <Button
 variant="ghost"
 onClick={() => { resetForm(); setView("list"); }}
 className="group rounded-xl p-2 pr-6 transition-all hover:bg-rose-50 hover:text-rose-600"
 >
 <div className="h-10 w-10 rounded-lg bg-rose-600 text-white shadow-sm flex items-center justify-center group-hover:bg-rose-700 transition-all">
 <ChevronLeft className="h-4 w-4" />
 </div>
 <span className="ml-4 font-black uppercase text-[10px] tracking-widest italic text-slate-400 group-hover:text-rose-600">Abort Reversal</span>
 </Button>
 <div className="flex items-center gap-6">
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Drafting Phase</span>
 <span className="text-xs font-black uppercase text-rose-600">Protocol 08-SR</span>
 </div>
 <div className="h-8 w-[1px] bg-slate-100" />
 <Button
 onClick={handleSubmit}
 disabled={saving}
 className="h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm font-black uppercase tracking-widest text-[9px]"
 >
 {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
 {saving ? "Saving..." : "Finalize Return"}
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 <div className="lg:col-span-8 space-y-8">
 <Card className="rounded-2xl border border-slate-100 shadow-sm p-8 bg-white space-y-8">
 <div className="flex items-center gap-3">
 <Receipt className="h-5 w-5 text-rose-600" />
 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Source <span className="text-rose-600">Validation</span></h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Sales Order <span className="text-red-500">*</span></label>
 <select
 value={formData.soId}
 onChange={(e) => handleSelectSO(e.target.value)}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-rose-500 transition-all italic text-slate-800"
 >
 <option value="">— SELECT SALES ORDER —</option>
 {salesOrders.map((so) => (
 <option key={so.id} value={so.id}>{so.orderNumber} | {so.lead?.clientName || "—"}</option>
 ))}
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Gudang Tujuan <span className="text-red-500">*</span></label>
 <select
 value={formData.warehouseId}
 onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-rose-500 transition-all italic text-slate-800"
 >
 <option value="">— SELECT GUDANG —</option>
 {warehouses.map((w) => (
 <option key={w.id} value={w.id}>{w.name}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Status Retur</label>
 <select
 value={formData.returnStatus}
 onChange={(e) => setFormData({ ...formData, returnStatus: e.target.value })}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-rose-500 transition-all italic text-slate-800"
 >
 <option value="POTONG_TAGIHAN">Potong Tagihan</option>
 <option value="TUKAR_BARANG">Tukar Barang</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Return Date</label>
 <div className="relative">
 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <DnaInput
 type="date"
 className="h-11 pl-12 bg-slate-50 border border-slate-100 rounded-xl font-black uppercase text-xs"
 value={formData.returnDate}
 onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
 />
 </div>
 </div>
 </div>

 <AnimatePresence>
 {selectedSO && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 exit={{ opacity: 0, height: 0 }}
 className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 grid grid-cols-3 gap-6 overflow-hidden"
 >
 <div className="space-y-1">
 <p className="text-[9px] font-black text-rose-400 uppercase">SO Number</p>
 <p className="font-black text-slate-900 text-xs italic uppercase">{selectedSO.orderNumber}</p>
 </div>
 <div className="space-y-1 text-center">
 <p className="text-[9px] font-black text-rose-400 uppercase">Customer</p>
 <p className="font-black text-slate-900 text-xs uppercase">{selectedSO.lead?.clientName || "—"}</p>
 </div>
 <div className="space-y-1 text-right">
 <p className="text-[9px] font-black text-rose-400 uppercase">Status</p>
 <span className="bg-white text-rose-600 border border-rose-100 font-black text-[9px] uppercase px-2 py-1 rounded-lg">Selected</span>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </Card>

 <Card className="rounded-2xl border border-slate-100 shadow-sm p-6 bg-white overflow-hidden">
 <div className="flex items-center gap-3 mb-6">
 <PackageX className="h-5 w-5 text-rose-600" />
 <h3 className="text-lg font-black uppercase italic tracking-tighter">Material <span className="text-rose-600">Reversal List</span></h3>
 </div>

 <div className="border border-slate-100 rounded-2xl overflow-hidden">
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="pl-4 text-[9px] font-black uppercase text-slate-400 py-3">Barang Diretur</TableHead>
 <TableHead className="text-center text-[9px] font-black uppercase text-slate-400 py-3">Qty Beli</TableHead>
 <TableHead className="text-center text-[9px] font-black uppercase text-slate-400 py-3">Qty Retur</TableHead>
 <TableHead className="text-center text-[9px] font-black uppercase text-slate-400 py-3">Status Retur</TableHead>
 <TableHead className="pr-4 text-right text-[9px] font-black uppercase text-slate-400 py-3">Subtotal</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {returnItems.length === 0 ? (
 <TableRow>
 <TableCell colSpan={5} className="py-16 text-center">
 <div className="flex flex-col items-center gap-3">
 <Layers className="h-10 w-10 text-slate-200" />
 <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2rem]">No sales order selected</p>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 returnItems.map((item) => (
 <TableRow key={item.id} className="group hover:bg-rose-50/20 transition-all border-b border-slate-50">
 <TableCell className="pl-4 py-2.5">
 <div className="flex flex-col">
 <span className="font-black text-slate-900 text-xs uppercase">{item.productName}</span>
 </div>
 </TableCell>
 <TableCell className="text-center py-2.5 font-black text-slate-900 text-xs tabular-nums">
 {item.qtyOriginal}
 </TableCell>
 <TableCell className="text-center py-2.5">
 <div className="flex items-center justify-center">
 <DnaInput
 type="number"
 className="w-16 h-8 bg-slate-50 border border-slate-100 rounded-lg text-center font-black text-xs"
 value={item.qtyReturned}
 min={0}
 max={item.qtyOriginal}
 onChange={(e) => updateItem(item.id, "qtyReturned", Number(e.target.value))}
 />
 </div>
 </TableCell>
 <TableCell className="text-center py-2.5">
 <select
 value={formData.returnStatus}
 className="h-8 px-2 bg-slate-50 border border-slate-100 rounded-lg font-black text-[9px] uppercase appearance-none"
 >
 <option value="POTONG_TAGIHAN">Potong Tagihan</option>
 <option value="TUKAR_BARANG">Tukar Barang</option>
 </select>
 </TableCell>
 <TableCell className="pr-4 py-2.5 text-right font-black text-slate-900 text-xs tabular-nums">
 {formatOperationalCurrency(item.qtyReturned * (item.unitPrice || 0))}
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </Card>
 </div>

 <div className="lg:col-span-4 space-y-8">
 <div className="sticky top-10 space-y-8">
 <Card className="rounded-2xl border border-slate-100 shadow-sm p-8 bg-rose-600 text-white overflow-hidden relative">
 <div className="relative z-10 space-y-8">
 <div>
 <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Financial Reversal</p>
 <h2 className="text-2xl font-black italic tracking-tighter uppercase mt-2">Asset <br /> <span className="text-rose-500">Recovery</span></h2>
 </div>

 <div className="pt-6 border-t border-white/10 space-y-4 font-black uppercase text-[9px] tracking-wider">
 <div className="flex justify-between items-center text-slate-400">
 <span>Net Return Value</span>
 <span className="tabular-nums text-white">{formatOperationalCurrency(financials.subtotal)}</span>
 </div>
 <div className="flex justify-between items-center text-slate-400">
 <span>P.P.N Reversal (11%)</span>
 <span className="tabular-nums text-white">{formatOperationalCurrency(financials.tax)}</span>
 </div>
 <div className="flex justify-between items-center pt-4 border-t border-white/20 text-rose-400">
 <span className="tracking-widest">Grand Total Recovery</span>
 <span className="text-xl text-white tabular-nums">{formatOperationalCurrency(financials.total)}</span>
 </div>
 </div>

 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
 <label className="text-[9px] font-black uppercase text-slate-400">Return Ledger Remarks</label>
 <textarea
 className="w-full bg-transparent border-none p-0 text-xs font-medium text-slate-300 outline-none resize-none"
 rows={3}
 placeholder="Provide technical reason for return..."
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 />
 </div>
 </div>
 <RotateCcw className="h-40 w-40 text-white/5 absolute -right-10 -bottom-10 rotate-12" />
 </Card>

 <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-white/50 space-y-3">
 <div className="flex items-center gap-3 text-rose-600">
 <ShieldAlert className="h-4 w-4" />
 <span className="text-[9px] font-black uppercase tracking-widest">Accounting Protocol</span>
 </div>
 <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase italic">
 "All returns trigger an automatic debit to Sales Returns and credit to Accounts Receivable. Stock will be quarantined upon arrival."
 </p>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Konfirmasi</DialogTitle>
 </DialogHeader>
 <p>Apakah Anda yakin ingin menyimpan data ini?</p>
 <DialogFooter>
 <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
 <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </OperationalMigrationShell>
 );
}
