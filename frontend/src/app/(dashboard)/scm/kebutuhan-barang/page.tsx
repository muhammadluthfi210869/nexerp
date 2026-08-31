"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
 BarChart4,
 History,
 Eye,
 Search,
 Calendar,
 User,
 Plus,
 ChevronLeft,
 Save,
 ShoppingCart,
 Layers,
 FlaskConical,
 ClipboardCheck,
 TrendingUp,
 AlertCircle,
 CheckCircle2,
 Boxes,
 Edit3,
 Building2,
 Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
 OperationalInput,
 OperationalStatusBadge,
 OperationalField,
 getOperationalStatusLabel,
} from "@/components/operational/OperationalUI";
import { Button } from "@/components/ui/button";
import { DnaInput, DnaButton } from "@/components/dna";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";

const SUPPLIERS = ["PT Kimia Farma Tbk", "CV Bahan Kimia Abadi", "PT Global Packaging Solution", "UD Sumber Makmur"];

const formatDate = (dateStr: string) => {
 const d = new Date(dateStr);
 return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

export default function MRPPrototype() {
 const queryClient = useQueryClient();
 const [view, setView] = useState<"list" | "form">("list");
 const [selectedSO, setSelectedSO] = useState<string | null>(null);
 const [cart, setCart] = useState<any[]>([]);
 const [isPOModalOpen, setIsPOModalOpen] = useState(false);
 const [selectedPOMaterial, setSelectedPOMaterial] = useState<any>(null);
 const [poQty, setPoQty] = useState(0);
 const [poSupplier, setPoSupplier] = useState("");
 const [poPrice, setPoPrice] = useState(0);
 const [planningDate, setPlanningDate] = useState(new Date().toISOString().split("T")[0]);
 const [planningNotes, setPlanningNotes] = useState("");
 const [requirementForPR, setRequirementForPR] = useState<any>(null);
 const [prWarehouseId, setPrWarehouseId] = useState("");
 const [prSupplierId, setPrSupplierId] = useState("");
 const [prPriority, setPrPriority] = useState("MEDIUM");
 const [prNotes, setPrNotes] = useState("");
 const [unitPrices, setUnitPrices] = useState<Record<string, string>>({});

 const { data: requirements, isLoading: reqLoading } = useQuery({
 queryKey: ["scm-goods-requirements"],
 queryFn: async () => {
 const res = await api.get("/scm/goods-requirements");
 return unwrapResponse(res);
 },
 });

 const { data: materials } = useQuery({
 queryKey: ["scm-materials"],
 queryFn: async () => {
 const res = await api.get("/scm/materials");
 return unwrapResponse(res);
 },
 });

 const { data: warehouses } = useQuery({
 queryKey: ["master-warehouses"],
 queryFn: async () => unwrapResponse(await api.get("/master/warehouses")) || [],
 });

 const { data: suppliers } = useQuery({
 queryKey: ["master-suppliers"],
 queryFn: async () => unwrapResponse(await api.get("/master/suppliers")) || [],
 });

 const { data: salesOrders, isLoading: soLoading } = useQuery({
 queryKey: ["commercial-sales-orders"],
 queryFn: async () => {
 const res = await api.get("/commercial/sales-orders");
 return unwrapResponse(res);
 },
 });

 const reqList = Array.isArray(requirements) ? requirements : [];
 const materialList = Array.isArray(materials) ? materials : [];
 const soList = Array.isArray(salesOrders) ? salesOrders : [];

 const [reqSearch, setReqSearch] = useState("");
 const [reqStatusFilter, setReqStatusFilter] = useState<string>("ALL");

 const filteredReqList = useMemo(() => {
 const q = reqSearch.trim().toLowerCase();
 const base = q
 ? reqList.filter((r: any) =>
 String(r.code || r.kode || "").toLowerCase().includes(q) ||
 String(r.customer || "").toLowerCase().includes(q) ||
 String(r.produk || "").toLowerCase().includes(q) ||
 String(r.salesOrderId || "").toLowerCase().includes(q)
 )
 : reqList;
 if (reqStatusFilter === "ALL") return base;
 return base.filter((r: any) => {
 if (reqStatusFilter === "COMPLETED") {
 return r.status === "COMPLETED" || r.status === "Selesai";
 }
 if (reqStatusFilter === "PENDING") {
 return !(r.status === "COMPLETED" || r.status === "Selesai");
 }
 return true;
 });
 }, [reqList, reqSearch, reqStatusFilter]);

 const formulaItems = materialList.filter((m: any) => m.type === "RAW_MATERIAL");
 const packagingItems = materialList.filter((m: any) => ["PACKAGING", "LABEL", "BOX"].includes(m.type));

 const safetyAlerts = materialList
 .filter((m: any) => m.stockQty !== undefined && m.reorderPoint !== null && Number(m.stockQty) <= Number(m.reorderPoint))
 .map((m: any) => ({
 nama: m.name,
 stok: Number(m.stockQty),
 rop: Number(m.reorderPoint),
 satuan: m.unit || 'pcs',
 status: Number(m.stockQty) === 0 ? 'KRITIS' : 'Di Bawah ROP',
 }));

 const selectedSOData = soList.find((so: any) => so.id === selectedSO);

 const createPOMutation = useMutation({
 mutationFn: async (data: { materialId: string; supplierId: string; qty: number; unitPrice: number }) => {
 const res = await api.post("/scm/purchase-orders/from-requirement", data);
 return res.data || res;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["scm-purchase-orders"] });
 toast.success("Purchase Order created");
 setIsPOModalOpen(false);
 },
 onError: (err: any) => {
 toast.error(err?.response?.data?.message || "Failed to create PO");
 },
 });

 const createRequirementMutation = useMutation({
 mutationFn: async (salesOrderId: string) => {
 // Component lines are inherited from the committed SO's pinned Formula.
 // SCM must not retype or calculate them from stock levels.
 const res = await api.post(`/scm/goods-requirements/from-sales-order/${salesOrderId}`);
 return res.data || res;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
 toast.success("Goods requirement created successfully");
 setView("list");
 setSelectedSO(null);
 },
 onError: (err: any) => {
 toast.error(err?.response?.data?.message || "Failed to create requirement");
 },
 });

 const createPRFromRequirementMutation = useMutation({
 mutationFn: async () => {
 const res = await api.post(`/scm/goods-requirements/${requirementForPR.id}/purchase-requests`, {
 warehouseId: prWarehouseId,
 supplierId: prSupplierId || undefined,
 priority: prPriority,
 notes: prNotes || undefined,
 idempotencyKey: `ui-gr-pr-${requirementForPR.id}-${crypto.randomUUID()}`,
 unitPrices: (requirementForPR.items || []).map((item: any) => ({
 requirementItemId: item.id,
 unitPrice: Number(unitPrices[item.id]),
 })),
 });
 return unwrapResponse(res);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["scm-goods-requirements"] });
 queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
 toast.success("Purchase Request created from the inherited Requirement lines.");
 setRequirementForPR(null);
 },
 onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create Purchase Request."),
 });

 const openCreatePR = (requirement: any) => {
 if (requirement.status === "CHANGE_REQUIRED") {
 toast.error("This Requirement needs attention after a Sales Order amendment.");
 return;
 }
 if (requirement.purchaseRequests?.length) {
 toast.error("A Purchase Request already exists for this Requirement.");
 return;
 }
 setRequirementForPR(requirement);
 setPrWarehouseId("");
 setPrSupplierId("");
 setPrPriority("MEDIUM");
 setPrNotes("");
 setUnitPrices(Object.fromEntries((requirement.items || []).map((item: any) => [item.id, ""])));
 };

 const handleSOChange = (val: string) => {
 setSelectedSO(val);
 };

 const handleFinalizePlan = () => {
 if (!selectedSO) {
 toast.error("Please select a Sales Order");
 return;
 }
 createRequirementMutation.mutate(selectedSO);
 };

 const addFormulaToCart = () => {
 const newItems = formulaItems.slice(0, 4).map((item: any) => ({
 name: item.name,
 qty: `${Number(item.stockQty || 0)} ${item.unit}`,
 type: 'Formula'
 }));
 setCart([...cart, ...newItems]);
 };

 const openQuickPO = (item: any) => {
 setSelectedPOMaterial(item);
 setPoQty(Math.abs(item.selisih || (Number(item.reorderPoint || 0) - Number(item.stockQty || 0)) || 1));
 setPoPrice(0);
 setPoSupplier("");
 setIsPOModalOpen(true);
 };

 return (
 <OperationalMigrationShell
 title="KEBUTUHAN BARANG"
 subtitle="Material Requirements Planning (MRP) & Production Readiness Protocol"
 actions={
 <div className="flex gap-2.5">
 <button type="button" className="operational-button is-secondary">
 <History className="h-4 w-4 text-amber-500" />
 <span>Riwayat</span>
 </button>
 {view === "list" && (
 <button
 type="button"
 onClick={() => setView("form")}
 className="operational-button is-primary"
 >
 <Plus className="h-4 w-4" />
 <span>Buat</span>
 </button>
 )}
 </div>
 }
 >
 {/* SAFETY STOCK CARD */}
 <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
 <section className="operational-panel relative overflow-hidden p-7">
 <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
 <div className="flex items-center gap-6">
 <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
 <TrendingUp className="h-6 w-6" />
 </div>
 <div className="space-y-1">
 <h3 className="text-lg font-semibold tracking-tight text-slate-900">Status Stok Menuju <span className="text-blue-600">Safety Stock</span></h3>
 <p className="text-[11px] text-slate-500 flex items-center gap-2">
 <AlertCircle className="h-3 w-3 text-amber-500" /> {safetyAlerts.filter(a => a.status === 'Di Bawah ROP').length} bahan baku di bawah reorder point | <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {materialList.length - safetyAlerts.length} bahan aman | <AlertCircle className="h-3 w-3 text-rose-500" /> {safetyAlerts.filter(a => a.status === 'KRITIS').length} bahan kritis
 </p>
 </div>
 </div>
 <div className="flex-1 max-w-xl w-full">
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-none">
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-left">Bahan</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-center">Stok</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-center">ROP</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {safetyAlerts.length > 0 ? (
 safetyAlerts.slice(0, 3).map((alert: any, i: number) => (
 <TableRow key={i} className="hover:bg-transparent border-none">
 <TableCell className="py-4 px-4 font-semibold text-slate-700">{alert.nama}</TableCell>
 <TableCell className="py-4 px-4 text-center font-semibold text-slate-900 tabular-nums">{alert.stok} {alert.satuan}</TableCell>
 <TableCell className="py-4 px-4 text-center font-semibold text-slate-400 tabular-nums">{alert.rop} {alert.satuan}</TableCell>
 <TableCell className="py-4 px-4 text-right">
 <OperationalStatusBadge status={alert.status === 'KRITIS' ? 'danger' : 'pending'}>
 {alert.status.split(' ').pop()}
 </OperationalStatusBadge>
 </TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow className="hover:bg-transparent border-none">
 <TableCell colSpan={4} className="py-6 px-4 text-center text-[11px] text-slate-400 italic">
 Semua bahan baku berada di atas reorder point.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 <BarChart4 className="absolute -right-8 -bottom-8 h-36 w-36 text-slate-50 pointer-events-none opacity-40" />
 </section>
 </motion.div>

 <AnimatePresence mode="wait">
 {view === "list" ? (
 <motion.div
 key="list"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 className="space-y-6"
 >
 {/* List Table */}
 <section className="operational-panel">
 <div className="flex justify-between items-center mb-4">
 <div className="w-72">
 <OperationalInput
 placeholder="Search Plan Code / Customer / SO..."
 icon={<Search />}
 value={reqSearch}
 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReqSearch(e.target.value)}
 />
 </div>
 <div className="flex gap-2">
 <select
 value={reqStatusFilter}
 onChange={(e) => setReqStatusFilter(e.target.value)}
 className="h-10 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
 aria-label="Filter Production Status"
 >
 <option value="ALL">Semua Status</option>
 <option value="PENDING">Belum Selesai</option>
 <option value="COMPLETED">Selesai</option>
 </select>
 </div>
 </div>
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-left">Planning Identity</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-left">Context (SO / Customer / Brand)</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-left">Planner</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-center">Status</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Action</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {reqLoading && (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
 <p className="text-[11px] mt-4 text-slate-400">Loading requirements...</p>
 </TableCell>
 </TableRow>
 )}
 {!reqLoading && reqList.length === 0 && (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <p className="text-[11px] text-slate-300">No requirements found</p>
 </TableCell>
 </TableRow>
 )}
 {!reqLoading && reqList.length > 0 && filteredReqList.length === 0 && (
 <TableRow>
 <TableCell colSpan={5} className="py-20 text-center">
 <p className="text-[11px] text-slate-300">Tidak ada rencana yang cocok dengan "{reqSearch}"</p>
 </TableCell>
 </TableRow>
 )}
 {!reqLoading && filteredReqList.length > 0 && filteredReqList.map((req: any, idx: number) => (
 <TableRow key={req.id || idx} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-4 px-4">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
 <Layers className="h-4 w-4 text-blue-200" />
 </div>
 <div className="flex flex-col">
 <span className="font-semibold text-slate-900 tracking-tight text-[12px]">{req.code || req.kode}</span>
 <span className="text-[10px] text-slate-400 leading-none mt-0.5">{req.date ? formatDate(req.date) : "—"}</span>
 </div>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4">
 <div className="flex flex-wrap gap-2 items-center">
 <OperationalStatusBadge status="purple">
 {req.salesOrderId ? req.salesOrderId.slice(0, 8) : "—"}
 </OperationalStatusBadge>
 <span className="text-[12px] font-semibold text-slate-900">{req.customer || "—"}</span>
 <span className="text-slate-300 mx-1">|</span>
 <span className="text-[11px] font-semibold text-blue-600">{req.produk || "—"}</span>
 <OperationalStatusBadge status="neutral" className="text-[10px]">{req.brand || ""}</OperationalStatusBadge>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4">
 <div className="flex items-center gap-2">
 <User className="h-3.5 w-3.5 text-slate-400" />
 <span className="text-[11px] font-semibold text-slate-900">{req.createdById || req.pembuat || "—"}</span>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4 text-center">
 <OperationalStatusBadge status={req.status === "COMPLETED" || req.status === "Selesai" ? "success" : "pending"} className={req.status !== "COMPLETED" && req.status !== "Selesai" ? "animate-pulse" : ""}>
 {getOperationalStatusLabel(req.status)}
 </OperationalStatusBadge>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <div className="flex justify-end gap-2">
 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
 <Eye className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all shadow-sm">
 <Edit3 className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
 <CheckCircle2 className="h-4 w-4" />
 </Button>
 <button
 type="button"
 onClick={() => openCreatePR(req)}
 disabled={req.status === "CHANGE_REQUIRED" || Boolean(req.purchaseRequests?.length)}
 className="operational-button is-primary h-9 px-3 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
 >
 <ShoppingCart className="h-3.5 w-3.5" />
 <span>{req.status === "CHANGE_REQUIRED" ? "Perlu Perhatian" : req.purchaseRequests?.length ? "PR Dibuat" : "Buat PR"}</span>
 </button>
 </div>
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
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="w-full space-y-6 pb-20"
 >
 {/* Form Navigation */}
 <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
 <button
 type="button"
 onClick={() => setView("list")}
 className="group bg-transparent p-1 pr-4 h-auto hover:bg-rose-50 hover:text-rose-600 inline-flex items-center"
 >
 <div className="h-9 w-9 rounded-lg bg-blue-600 text-white shadow flex items-center justify-center group-hover:bg-rose-600 transition-all">
 <ChevronLeft className="h-4 w-4" />
 </div>
 <span className="ml-3 font-semibold text-[11px] tracking-widest text-slate-400 group-hover:text-rose-600">Abort Planning</span>
 </button>
 <div className="flex items-center gap-4">
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-semibold text-slate-400 tracking-tight">Drafting Phase</span>
 <span className="text-[11px] font-semibold text-blue-600">Protocol 10-NG</span>
 </div>
 <div className="h-8 w-px bg-slate-100" />
 <button
 type="button"
 onClick={handleFinalizePlan}
 disabled={createRequirementMutation.isPending}
 className="operational-button is-primary"
 >
 {createRequirementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
 <span>{createRequirementMutation.isPending ? "Processing..." : "Finalize Plan"}</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-6">
 <div className="space-y-6">
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-6">
 <div className="flex items-center gap-2">
 <ClipboardCheck className="h-4 w-4 text-blue-600" />
 <h2 className="text-lg font-semibold tracking-tight text-slate-950">Source <span className="text-blue-600">Context</span></h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Linked Sales Order (SO)</label>
 <select
 onChange={(e) => handleSOChange(e.target.value)}
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-md font-semibold text-[12px] focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
 >
 <option value="">— SELECT ACTIVE SO —</option>
 {soLoading && <option disabled>Loading...</option>}
 {soList.map((so: any) => (
 <option key={so.id} value={so.id}>{so.orderNumber} | {so.lead?.clientName || "—"}</option>
 ))}
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Customer (Read-only)</label>
 <div className="h-11 px-4 bg-slate-100 rounded-md font-semibold text-[12px] flex items-center text-slate-500">
 {selectedSOData ? (selectedSOData.lead?.clientName || "—") : "Select SO first"}
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Planning Date</label>
 <DnaInput type="date" icon={<Calendar />} value={planningDate} onChange={(e) => setPlanningDate(e.target.value)} />
 </div>
 </div>

 <AnimatePresence>
 {selectedSO && selectedSOData && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 exit={{ opacity: 0, height: 0 }}
 className="space-y-8 overflow-hidden"
 >
 {/* Product Info */}
 <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-4 gap-4">
 <div className="space-y-1">
 <p className="text-[11px] font-semibold text-slate-400 uppercase">Product Name</p>
 <p className="font-semibold text-slate-900 text-[12px]">{selectedSOData.brandName || selectedSOData.salesCategory || "—"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[11px] font-semibold text-slate-400 uppercase">SO Number</p>
 <OperationalStatusBadge status="purple">{selectedSOData.orderNumber}</OperationalStatusBadge>
 </div>
 <div className="space-y-1 text-center">
 <p className="text-[11px] font-semibold text-slate-400 uppercase">Production Qty</p>
 <p className="font-semibold text-slate-900 text-[12px]">{selectedSOData.quantity || "—"} PCS</p>
 </div>
 <div className="space-y-1 text-right">
 <p className="text-[11px] font-semibold text-slate-400 uppercase">Target Netto</p>
 <p className="font-semibold text-slate-900 text-[12px]">{selectedSOData.netto ? `${selectedSOData.netto} ml` : "—"}</p>
 </div>
 </div>

 {/* Formula Items Table */}
 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <FlaskConical className="h-4 w-4 text-blue-600" />
 <h3 className="text-[12px] font-semibold tracking-tight text-slate-900">Formula <span className="text-blue-600">BOM Requirements</span></h3>
 </div>
 <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-left">Material Profile</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-center">Tipe</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Stok / ROP</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Selisih (Variance)</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {formulaItems.slice(0, 8).map((item: any, i: number) => {
 const stok = Number(item.stockQty || 0);
 const rop = Number(item.reorderPoint || 0);
 const selisih = stok - rop;
 return (
 <TableRow key={item.id || i} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-4 px-4">
 <p className="font-semibold text-slate-900 text-[11px]">{item.code || item.id?.slice(0, 8)}</p>
 <p className="text-[11px] text-slate-400 mt-0.5">{item.name}</p>
 </TableCell>
 <TableCell className="py-4 px-4 text-center font-semibold text-slate-500 text-[11px] tabular-nums">{item.type}</TableCell>
 <TableCell className="py-4 px-4 text-right">
 <p className="font-semibold text-slate-900 text-[11px] tabular-nums">{stok.toLocaleString()} {item.unit}</p>
 <p className="text-[11px] text-slate-400 mt-0.5">ROP: {rop.toLocaleString()} {item.unit}</p>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <div className={cn(
 "font-semibold text-[11px] tabular-nums flex flex-col items-end",
 selisih >= 0 ? "text-emerald-500" : "text-rose-500"
 )}>
 <span>{selisih >= 0 ? "+" : ""}{selisih.toLocaleString()} {item.unit}</span>
 {selisih < 0 ? (
 <OperationalStatusBadge status="danger" className="text-[10px] mt-0.5">Perlu Beli</OperationalStatusBadge>
 ) : (
 <OperationalStatusBadge status="success" className="text-[10px] mt-0.5">Aman</OperationalStatusBadge>
 )}
 </div>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 {selisih < 0 && (
 <Button onClick={() => openQuickPO(item)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all">
 <ShoppingCart className="h-3.5 w-3.5" />
 </Button>
 )}
 </TableCell>
 </TableRow>
 );
 })}
 {formulaItems.length === 0 && (
 <TableRow>
 <TableCell colSpan={5} className="py-10 text-center text-[11px] text-slate-300">No formula materials found</TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 <div className="bg-slate-50/50 p-4 flex justify-between items-center border-t border-slate-100 text-[12px]">
 <div className="flex gap-8">
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Materials</span>
 <span className="text-[12px] font-semibold text-slate-900">{formulaItems.length} items</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-slate-400 uppercase">Need Purchase</span>
 <span className="text-[12px] font-semibold text-rose-500 tabular-nums">{formulaItems.filter((m: any) => Number(m.stockQty || 0) < Number(m.reorderPoint || 0)).length} items</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <OperationalStatusBadge status="pending" className="px-3">
 {formulaItems.filter((m: any) => Number(m.stockQty || 0) < Number(m.reorderPoint || 0)).length} item perlu pembelian
 </OperationalStatusBadge>
 </div>
 </div>
 </div>
 </div>

 {/* Packaging & Label Requirements */}
 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <Boxes className="h-4 w-4 text-blue-600" />
 <h3 className="text-[12px] font-semibold tracking-tight text-slate-900">Packaging & <span className="text-blue-600">Label Requirements</span></h3>
 </div>
 <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-left">Barang / Tipe</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Stok / ROP</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Selisih</TableHead>
 <TableHead className="py-4 px-4 text-[11px] font-medium text-slate-500 text-right">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {packagingItems.slice(0, 8).map((item: any, i: number) => {
 const stok = Number(item.stockQty || 0);
 const rop = Number(item.reorderPoint || 0);
 const selisih = stok - rop;
 return (
 <TableRow key={item.id || i} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-4 px-4">
 <div className="flex items-center gap-3">
 <span className="text-[11px] font-semibold text-slate-300">{(i+1).toString().padStart(2, '0')}</span>
 <div>
 <p className="font-semibold text-slate-900 text-[11px]">{item.name}</p>
 <OperationalStatusBadge status="neutral" className="text-[10px] mt-1">{item.type}</OperationalStatusBadge>
 </div>
 </div>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <p className="font-semibold text-slate-900 text-[11px] tabular-nums">{stok.toLocaleString()} {item.unit}</p>
 <p className="text-[11px] text-slate-400 mt-0.5">ROP: {rop.toLocaleString()} {item.unit}</p>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 <div className={cn(
 "font-semibold text-[11px] tabular-nums flex flex-col items-end",
 selisih >= 0 ? "text-emerald-500" : "text-rose-500"
 )}>
 <span>{selisih.toLocaleString()} {item.unit}</span>
 {selisih < 0 ? (
 <OperationalStatusBadge status="danger" className="text-[10px] mt-0.5">Perlu Beli</OperationalStatusBadge>
 ) : (
 <OperationalStatusBadge status="success" className="text-[10px] mt-0.5">Aman</OperationalStatusBadge>
 )}
 </div>
 </TableCell>
 <TableCell className="py-4 px-4 text-right">
 {selisih < 0 && (
 <DnaButton onClick={() => openQuickPO(item)} variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-600">
 Buat PO
 </DnaButton>
 )}
 </TableCell>
 </TableRow>
 );
 })}
 {packagingItems.length === 0 && (
 <TableRow>
 <TableCell colSpan={4} className="py-10 text-center text-[11px] text-slate-300">No packaging materials found</TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 <div className="pt-6 border-t border-slate-100 space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Additional Planning Notes</label>
 <textarea
 value={planningNotes}
 onChange={(e) => setPlanningNotes(e.target.value)}
 className="w-full bg-slate-50 border border-slate-200 rounded-md p-4 text-[12px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
 rows={3}
 placeholder="Provide specific instructions for procurement or production..."
 />
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* QUICK PO MODAL */}
 <AnimatePresence>
 {isPOModalOpen && selectedPOMaterial && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsPOModalOpen(false)}
 className="absolute inset-0 bg-black/60 backdrop-blur-md"
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-100 overflow-hidden p-8 space-y-6"
 >
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-amber-600">
 <ShoppingCart className="h-4 w-4" />
 <span className="text-[11px] font-semibold tracking-widest">Rapid Procurement Hub</span>
 </div>
 <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Buat <span className="text-amber-600">Purchase Order</span></h2>
 </div>

 <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
 <div className="col-span-2 border-b border-slate-200 pb-3">
 <p className="text-[11px] font-semibold text-slate-400 tracking-widest">Material Identity</p>
 <p className="text-[12px] font-semibold text-slate-900 truncate">{selectedPOMaterial.name} ({selectedPOMaterial.code || "MAT"})</p>
 </div>
 <div className="space-y-1">
 <p className="text-[11px] font-semibold text-slate-400 uppercase">Stok Saat Ini</p>
 <p className="font-semibold text-slate-900 text-[12px] tabular-nums">{Number(selectedPOMaterial.stockQty || 0).toLocaleString()} {selectedPOMaterial.unit}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[11px] font-semibold text-slate-400 uppercase">ROP</p>
 <p className="font-semibold text-slate-900 text-[12px] tabular-nums">{Number(selectedPOMaterial.reorderPoint || 0).toLocaleString()} {selectedPOMaterial.unit}</p>
 </div>
 <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
 <span className="text-[11px] font-semibold text-slate-400 tracking-widest">Net Shortage (Selisih)</span>
 <div className={cn(
 "font-semibold text-[12px] tabular-nums flex items-center gap-2",
 (Number(selectedPOMaterial.stockQty || 0) - Number(selectedPOMaterial.reorderPoint || 0)) >= 0 ? "text-emerald-500" : "text-rose-500"
 )}>
 {Math.abs(Number(selectedPOMaterial.stockQty || 0) - Number(selectedPOMaterial.reorderPoint || 0)).toLocaleString()} {selectedPOMaterial.unit}
 {(Number(selectedPOMaterial.stockQty || 0) - Number(selectedPOMaterial.reorderPoint || 0)) >= 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4 animate-pulse" />}
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Supplier</label>
 <div className="relative">
 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
 <select
 className="w-full h-11 pl-12 bg-slate-50 border border-slate-200 rounded-md font-semibold text-[12px] focus:ring-2 focus:ring-blue-500 text-slate-800"
 value={poSupplier}
 onChange={(e) => setPoSupplier(e.target.value)}
 >
 <option value="">-- Pilih Supplier --</option>
 {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Qty PO</label>
 <DnaInput
 type="number"
 value={poQty}
 onChange={(e) => setPoQty(Number(e.target.value))}
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Unit Price</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-300 text-[12px]">Rp</span>
 <DnaInput
 type="number"
 className="pl-10"
 value={poPrice || ""}
 onChange={(e) => setPoPrice(Number(e.target.value))}
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-slate-400 uppercase block">Jatuh Tempo</label>
 <DnaInput type="date" defaultValue="2026-05-30" />
 </div>
 </div>
 </div>

 <div className="flex gap-4 pt-2">
 <button type="button" onClick={() => setIsPOModalOpen(false)} className="operational-button is-ghost flex-1 h-11">Batal</button>
 <button
 type="button"
 onClick={() => {
 if (!poSupplier || !poQty || !poPrice) return;
 createPOMutation.mutate({
 materialId: selectedPOMaterial.id || "MAT-001",
 supplierId: poSupplier,
 qty: poQty,
 unitPrice: poPrice,
 });
 }}
 disabled={!poSupplier || !poPrice || createPOMutation.isPending}
 className="operational-button is-primary flex-[2] h-11"
 >
 <CheckCircle2 className="h-4 w-4" />
 <span>{createPOMutation.isPending ? "Processing..." : "Buat PO & Simpan"}</span>
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 <Dialog open={Boolean(requirementForPR)} onOpenChange={(open) => !open && setRequirementForPR(null)}>
 <DialogContent className="sm:max-w-3xl">
 <DialogHeader>
 <DialogTitle>Buat PR dari Goods Requirement</DialogTitle>
 <DialogDescription>
 Material, kuantitas, UOM, Sales Order, dan Formula diwariskan dari Requirement dan tidak dapat diubah di sini.
 </DialogDescription>
 </DialogHeader>
 {requirementForPR && (
 <div className="space-y-5">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-[12px]">
 <div className="rounded-lg bg-slate-50 p-3"><span className="block text-[10px] text-slate-500">Requirement</span><strong>{requirementForPR.code}</strong></div>
 <div className="rounded-lg bg-slate-50 p-3"><span className="block text-[10px] text-slate-500">SO Version</span><strong>v{requirementForPR.salesOrderVersion}</strong></div>
 <div className="rounded-lg bg-slate-50 p-3"><span className="block text-[10px] text-slate-500">Formula Version</span><strong>v{requirementForPR.formulaVersion}</strong></div>
 </div>
 <div className="overflow-hidden rounded-lg border border-slate-200">
 <Table className="table-dense">
 <TableHeader className="bg-slate-50"><TableRow><TableHead>Material (Inherited)</TableHead><TableHead>Qty (Inherited)</TableHead><TableHead>UOM</TableHead><TableHead>Agreed Unit Price *</TableHead></TableRow></TableHeader>
 <TableBody>{(requirementForPR.items || []).map((item: any) => {
 const material = materialList.find((entry: any) => entry.id === item.materialId);
 return <TableRow key={item.id}><TableCell className="font-medium">{material?.name || item.materialId}</TableCell><TableCell>{item.qty}</TableCell><TableCell>{item.uom}</TableCell><TableCell><input aria-label={`Agreed unit price for ${material?.name || item.materialId}`} type="number" min="0" step="0.01" value={unitPrices[item.id] || ""} onChange={(event) => setUnitPrices((current) => ({ ...current, [item.id]: event.target.value }))} className="h-9 w-full rounded border border-slate-200 px-2" /></TableCell></TableRow>;
 })}</TableBody>
 </Table>
 </div>
 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 <OperationalField label="Gudang Tujuan *"><select aria-label="Gudang Tujuan" value={prWarehouseId} onChange={(event) => setPrWarehouseId(event.target.value)} className="h-10 w-full rounded border border-slate-200 px-2"><option value="">Pilih gudang</option>{(warehouses || []).map((warehouse: any) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></OperationalField>
 <OperationalField label="Supplier *"><select aria-label="Supplier" value={prSupplierId} onChange={(event) => setPrSupplierId(event.target.value)} className="h-10 w-full rounded border border-slate-200 px-2"><option value="">Pilih supplier</option>{(suppliers || []).map((supplier: any) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></OperationalField>
 <OperationalField label="Prioritas"><select aria-label="Prioritas" value={prPriority} onChange={(event) => setPrPriority(event.target.value)} className="h-10 w-full rounded border border-slate-200 px-2"><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="URGENT">URGENT</option></select></OperationalField>
 </div>
 <OperationalField label="Catatan (opsional)"><textarea aria-label="Catatan procurement" value={prNotes} onChange={(event) => setPrNotes(event.target.value)} className="min-h-20 w-full rounded border border-slate-200 p-2" /></OperationalField>
 </div>
 )}
 <DialogFooter>
 <button type="button" onClick={() => setRequirementForPR(null)} className="operational-button is-ghost">Batal</button>
 <button type="button" onClick={() => createPRFromRequirementMutation.mutate()} disabled={!prWarehouseId || !prSupplierId || !requirementForPR?.items?.length || requirementForPR.items.some((item: any) => unitPrices[item.id] === "" || unitPrices[item.id] === undefined) || createPRFromRequirementMutation.isPending} className="operational-button is-primary disabled:opacity-50">{createPRFromRequirementMutation.isPending ? "Menyimpan..." : "Buat PR dari Requirement"}</button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </OperationalMigrationShell>
 );
}
