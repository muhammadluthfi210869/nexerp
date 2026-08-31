"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
 ClipboardList, 
 Search, 
 ChevronRight, 
 Printer, 
 Download, 
 Plus, 
 X, 
 Activity, 
 FlaskConical, 
 Package, 
 CheckCircle2, 
 Clock, 
 AlertTriangle, 
 ShieldCheck, 
 Edit3, 
 FileText,
 User,
 Settings,
 Layers,
 Thermometer,
 Timer,
 Factory,
 Beaker,
 Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { 
 Table, 
 TableBody, 
 TableCell, 
 TableHead, 
 TableHeader, 
 TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import QcSignatureModal, { QcParameter } from "@/components/qc/QcSignatureModal";
import { TableWrapper, DnaBadge, DnaButton, DataCard } from "@/components/dna";
import { toast } from "sonner";

const MATERIAL_CONSUMPTION = [
 { kode: "BB-001", nama: "Glycerin 99%", teoritis: 75, aktual: 75, selisih: 0, unit: "kg" },
 { kode: "BB-002", nama: "SLES", teoritis: 12, aktual: 12.5, selisih: 0.5, unit: "kg" },
 { kode: "BB-003", nama: "Aquades", teoritis: 10, aktual: 10, selisih: 0, unit: "L" },
 { kode: "BB-004", nama: "Fragrance", teoritis: 1, aktual: 0.95, selisih: -0.05, unit: "L" },
];

const MOCK_QC_PARAMS: QcParameter[] = [
 { label: "pH", value: "6.5", range: "5.5 - 7.0", status: "PASS" },
 { label: "Viscosity", value: "5.500", range: "4.000 - 7.000", status: "PASS" },
 { label: "Organoleptic", value: "Normal", range: "Normal", status: "PASS" },
 { label: "Filling Weight", value: "101ml", range: "100ml ± 2ml", status: "PASS" },
 { label: "Seal Check", value: "Pass", range: "Pass", status: "PASS" }
];

export default function BatchRecordsPage() {
 const queryClient = useQueryClient();
 const [selectedBatch, setSelectedBatch] = useState<any>(null);
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
 const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
 const [signOffStage, setSignOffStage] = useState<"MIXING" | "FILLING" | "PACKING">("MIXING");
 const [searchTerm, setSearchTerm] = useState("");

 // Create Batch Form State
 const [formData, setFormData] = useState({
 salesOrderId: "",
 formulaId: "",
 targetQty: "",
 targetDate: ""
 });

 // Fetch Sales Orders for dropdown
 const { data: salesOrders } = useQuery({
 queryKey: ["production-sales-orders"],
 queryFn: async () => {
 const res = await api.get("/production/work-orders");
 return res.data || [];
 },
 });

 // Fetch Formulas for dropdown
 const { data: formulas } = useQuery({
 queryKey: ["production-formulas"],
 queryFn: async () => {
 const res = await api.get("/rnd/formulas");
 return res.data || [];
 },
 });

 // Create Batch Record Mutation
 const createBatchMutation = useMutation({
 mutationFn: async (data: { salesOrderId: string; formulaId: string; targetQty: number; targetDate: string }) => {
 const res = await api.post("/production/batch-records", data);
 return res.data || res;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["production-batch-records"] });
 setIsCreateModalOpen(false);
 setFormData({ salesOrderId: "", formulaId: "", targetQty: "", targetDate: "" });
 toast.success("Batch Record Created Successfully");
 },
 onError: (err: any) => {
 toast.error("Failed to Create Batch Record", {
 description: err.response?.data?.message || "Please check your input and try again."
 });
 }
 });

 const handleFormChange = (field: string, value: string) => {
 setFormData(prev => ({ ...prev, [field]: value }));
 };

 const handleCreateBatch = () => {
 // Validation
 if (!formData.salesOrderId || !formData.formulaId || !formData.targetQty || !formData.targetDate) {
 toast.error("Please fill in all required fields");
 return;
 }
 if (Number(formData.targetQty) <= 0) {
 toast.error("Target quantity must be greater than 0");
 return;
 }
 
 createBatchMutation.mutate({
 salesOrderId: formData.salesOrderId,
 formulaId: formData.formulaId,
 targetQty: Number(formData.targetQty),
 targetDate: formData.targetDate
 });
 };

 const { data: batchData } = useQuery({
 queryKey: ["production-batch-records"],
 queryFn: async () => {
 const res = await api.get("/production/batch-records");
 return res.data || res;
 },
 });

 const { data: batchDetail } = useQuery({
 queryKey: ["batch-record-detail", selectedBatch?.batchNo],
 queryFn: async () => {
 if (!selectedBatch?.batchNo) return null;
 const res = await api.get(`/production/batch-records/${selectedBatch.batchNo}/detail`);
 return res.data || res;
 },
 enabled: !!selectedBatch?.batchNo,
 });

 const signOffMutation = useMutation({
 mutationFn: async (data: { stepLogId: string; status: string; notes?: string; ph?: number; viscosity?: number }) => {
 const res = await api.post("/production/qc/verify", data);
 return res.data || res;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["batch-record-detail"] });
 },
 });

 const batchList = Array.isArray(batchData) ? batchData.map((b: any) => ({
 batch: b.batchNo,
 produk: b.lead?.productInterest || b.lead?.brandName || 'N/A',
 status: b.stage || 'PLANNED',
 qty: b.targetQty,
 tanggal: b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID') : '-',
 })) : [];

 const filtered = Array.isArray(batchList) ? batchList.filter(b => 
 b.batch.toLowerCase().includes(searchTerm.toLowerCase()) || 
 b.produk.toLowerCase().includes(searchTerm.toLowerCase())
 ) : [];

 const getStatus = (status: string): "info" | "success" | "default" => {
 switch (status) {
 case "IN_PROGRESS": return "info";
 case "COMPLETED": return "success";
 case "PLANNED": return "default";
 default: return "default";
 }
 };

 const getQCStatus = (status: "PASS" | "PENDING" | "REJECT"): "success" | "warning" | "critical" => {
 switch (status) {
 case "PASS": return "success";
 case "PENDING": return "warning";
 case "REJECT": return "critical";
 default: return "default" as any;
 }
 };

 const handleSignOff = (data: { pin: string; notes: string }) => {
 signOffMutation.mutate({
 stepLogId: selectedBatch?.batch || '',
 status: 'GOOD',
 notes: `QC verified by PIN: ${data.pin}. ${data.notes}`,
 });
 };

 return (
 <DashboardShell
 title="Batch"
 titleAccent="Records"
 subtitle="Digital Production Log & Compliance Documentation Hub"
 actions={
 <div className="flex gap-4">
 <div className="relative w-64 h-11">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
 <Input 
 placeholder="Search Batch ID..." 
 className="h-full pl-11 bg-white border border-slate-200 rounded-xl font-bold uppercase text-[10px] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500" 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <DnaButton 
 onClick={() => setIsCreateModalOpen(true)}
 variant="secondary"
 size="md"
 icon={<Plus />}
 >
 Buat Batch Record Baru
 </DnaButton>
 </div>
 }
 >

 {/* Main Table */}
 <TableWrapper>
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-b border-slate-100">
 <TableHead className="py-4 pl-6 font-black text-slate-400 uppercase tracking-widest text-[9px]">Batch Identity</TableHead>
 <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Product Name</TableHead>
 <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center">Status</TableHead>
 <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Target Qty</TableHead>
 <TableHead className="py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Date Logged</TableHead>
 <TableHead className="py-4 pr-6 text-right font-black text-slate-400 uppercase tracking-widest text-[9px]">Action</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-slate-100">
 {filtered.map((b) => (
 <TableRow 
 key={b.batch} 
 onClick={() => setSelectedBatch(b)}
 className="group cursor-pointer hover:bg-slate-50/50 transition-colors border-none"
 >
 <TableCell className="py-3 pl-6">
 <div className="flex items-center gap-3">
 <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
 <FileText className="h-4.5 w-4.5 text-blue-500" />
 </div>
 <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{b.batch}</span>
 </div>
 </TableCell>
 <TableCell className="py-3">
 <div className="flex flex-col text-left">
 <span className="font-black text-slate-900 text-xs uppercase">{b.produk}</span>
 <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">SKU-HM-001</span>
 </div>
 </TableCell>
 <TableCell className="py-3 text-center">
 <DnaBadge status={getStatus(b.status)} className="shadow-none py-0.5 px-2 rounded-md">
 {b.status}
 </DnaBadge>
 </TableCell>
 <TableCell className="py-3 text-right font-black text-slate-900 text-xs tabular-nums">
 {b.qty.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
 </TableCell>
 <TableCell className="py-3">
 <div className="flex items-center gap-1.5">
 <Clock className="h-3.5 w-3.5 text-slate-300" />
 <span className="text-[10px] font-bold text-slate-500 uppercase">{b.tanggal}</span>
 </div>
 </TableCell>
 <TableCell className="py-3 pr-6 text-right">
 <DnaButton variant="outline" size="sm" icon={<ChevronRight />} />
 </TableCell>
 </TableRow>
 ))}
 {filtered.length === 0 && (
 <TableRow>
 <TableCell colSpan={6} className="py-16 text-center">
 <div className="flex flex-col items-center justify-center">
 <FileText className="h-12 w-12 text-slate-200 mb-3" />
 <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">No Batch Records Found</p>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Ready for production logs</p>
 </div>
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </TableWrapper>

 {/* DETAIL DRAWER */}
 <AnimatePresence>
 {selectedBatch && (
 <>
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setSelectedBatch(null)}
 className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
 />
 <motion.div
 initial={{ x: "100%" }}
 animate={{ x: 0 }}
 exit={{ x: "100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className="fixed top-0 right-0 z-50 h-screen w-full lg:w-2/3 bg-white flex flex-col border-l border-slate-100"
 >
 {/* Drawer Header */}
 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white overflow-hidden relative">
 <div className="relative z-10 space-y-1.5">
 <div className="flex items-center gap-3">
 <h2 className="text-2xl font-black italic tracking-tighter uppercase">{selectedBatch.batch}</h2>
 <DnaBadge status={getStatus(selectedBatch.status)} className=" black/20 py-0.5 px-2 rounded-md">
 {selectedBatch.status}
 </DnaBadge>
 </div>
 <p className="text-sm font-bold text-slate-400 uppercase italic tracking-tight">{selectedBatch.produk}</p>
 </div>
 
 <div className="relative z-10 flex gap-3">
 <DnaButton variant="outline" size="sm" onClick={() => setSelectedBatch(null)} className="h-10 w-10 !p-0 !rounded-full !bg-white/10 !border-white/10 text-white hover:!bg-white/20">
 <X className="h-4 w-4" />
 </DnaButton>
 </div>
 <Factory className="absolute -right-10 -bottom-10 h-48 w-48 text-white/5 rotate-12 pointer-events-none" />
 </div>

 {/* Drawer Content */}
 <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
 <Tabs defaultValue="info" className="w-full space-y-6">
 <TabsList className="bg-slate-150 p-1.5 rounded-2xl h-14 border border-slate-200">
 <TabsTrigger value="info" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]: data-[state=active]:text-slate-900 font-black uppercase text-[10px] tracking-widest transition-all">
 <ClipboardList className="mr-2 h-4 w-4" /> Batch Info
 </TabsTrigger>
 <TabsTrigger value="progress" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]: data-[state=active]:text-slate-900 font-black uppercase text-[10px] tracking-widest transition-all">
 <Activity className="mr-2 h-4 w-4" /> Stage Progress
 </TabsTrigger>
 <TabsTrigger value="materials" className="rounded-xl px-8 h-full data-[state=active]:bg-white data-[state=active]: data-[state=active]:text-slate-900 font-black uppercase text-[10px] tracking-widest transition-all">
 <FlaskConical className="mr-2 h-4 w-4" /> Material Log
 </TabsTrigger>
 </TabsList>

 {/* TAB 1: Information */}
 <TabsContent value="info" className="m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="grid grid-cols-2 gap-6">
 <Card className="rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 bg-white">
 <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-3">Order Context</h4>
 <div className="space-y-3">
 {[
 { label: "Sales Order", val: "SO-001 — PT Maju Jaya" },
 { label: "Formula", val: "FML-HM-01 Rev 2" },
 { label: "R&D Formulator", val: "Fadilah Syahab" },
 { label: "Netto per Pcs", val: "100 ml" },
 ].map(item => (
 <div key={item.label} className="flex justify-between items-center border-b border-slate-50 pb-1.5">
 <span className="text-[9px] font-black text-slate-400 uppercase">{item.label}</span>
 <span className="text-xs font-black text-slate-800 uppercase italic">{item.val}</span>
 </div>
 ))}
 </div>
 </Card>
 <Card className="rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 bg-white">
 <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-3">Packaging Specs</h4>
 <div className="space-y-3">
 {[
 { label: "Primary", val: "Botol Airless 100ml Gold" },
 { label: "Secondary", val: "Inner Box Ivory 350gsm" },
 { label: "Target Qty", val: "1.000 pcs" },
 { label: "Batch Size", val: "100 kg" },
 ].map(item => (
 <div key={item.label} className="flex justify-between items-center border-b border-slate-50 pb-1.5">
 <span className="text-[9px] font-black text-slate-400 uppercase">{item.label}</span>
 <span className="text-xs font-black text-slate-800 uppercase italic">{item.val}</span>
 </div>
 ))}
 </div>
 </Card>
 </div>
 </TabsContent>

 {/* TAB 2: Progress */}
 <TabsContent value="progress" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* MIXING STAGE */}
 <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white">
 <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
 <div className="flex items-center gap-3">
 <Beaker className="h-4 w-4 text-slate-400" />
 <h4 className="text-xs font-black uppercase tracking-wider italic">Stage 01: <span className="text-slate-400">Mixing</span></h4>
 </div>
 <DnaBadge status="success" className="shadow-none py-0.5 px-2 rounded-md">PASS</DnaBadge>
 </div>
 <div className="p-6 grid grid-cols-3 gap-6">
 {[
 { icon: Clock, label: "Date", val: "02/04/2026" },
 { icon: Settings, label: "Machine", val: "Mixer Tank #3" },
 { icon: User, label: "Operator", val: "Ahmad" },
 { icon: Thermometer, label: "Temp", val: "75°C" },
 { icon: Timer, label: "Duration", val: "45 min" },
 { icon: Layers, label: "Raw Yield", val: "95 kg" },
 ].map(item => (
 <div key={item.label} className="space-y-1">
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
 <item.icon className="h-3 w-3" /> {item.label}
 </p>
 <p className="text-xs font-black text-slate-800 uppercase italic">{item.val}</p>
 </div>
 ))}
 <div className="col-span-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
 <div className="flex flex-col text-left">
 <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">QC Sign-Off</span>
 <span className="text-xs font-black text-slate-800 leading-none mt-1">Fadilah (QC)</span>
 </div>
 </div>
 <span className="text-[9px] font-bold text-slate-400 uppercase italic">02/04/2026 14:30</span>
 </div>
 </div>
 </Card>

 {/* FILLING STAGE */}
 <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white">
 <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
 <div className="flex items-center gap-3">
 <Factory className="h-4 w-4 text-slate-400" />
 <h4 className="text-xs font-black uppercase tracking-wider italic">Stage 02: <span className="text-slate-400">Filling</span></h4>
 </div>
 <DnaBadge status="warning" className="shadow-none py-0.5 px-2 rounded-md animate-pulse">PENDING</DnaBadge>
 </div>
 <div className="p-6 grid grid-cols-4 gap-6 bg-white">
 {[
 { icon: Clock, label: "Date", val: "03/04/2026" },
 { icon: Settings, label: "Machine", val: "Filling Line #2" },
 { icon: CheckCircle2, label: "Yield Good", val: "980 pcs" },
 { icon: AlertTriangle, label: "Yield Reject", val: "20 pcs" },
 ].map(item => (
 <div key={item.label} className="space-y-1 col-span-2">
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
 <item.icon className="h-3 w-3" /> {item.label}
 </p>
 <p className="text-xs font-black text-slate-800 uppercase italic">{item.val}</p>
 </div>
 ))}
 <div className="col-span-4 mt-2">
 <DnaButton 
 onClick={() => { setSignOffStage("FILLING"); setIsSignOffModalOpen(true); }}
 variant="secondary"
 size="md"
 className="w-full"
 >
 <ShieldCheck className="mr-2 h-4.5 w-4.5" /> QC Sign-Off
 </DnaButton>
 </div>
 </div>
 </Card>

 {/* PACKING STAGE (REJECT SIMULATION) */}
 <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white">
 <div className="p-4 bg-slate-50 flex justify-between items-center border-b border-slate-100">
 <div className="flex items-center gap-3">
 <Package className="h-4 w-4 text-slate-450" />
 <h4 className="text-xs font-black uppercase tracking-widest italic text-slate-450">Stage 03: Packing</h4>
 </div>
 <DnaBadge status="critical" className="shadow-none py-0.5 px-2 rounded-md">REJECT</DnaBadge>
 </div>
 <div className="p-4 flex items-center gap-3 italic bg-slate-50/20 text-slate-500">
 <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
 <p className="text-[9px] font-black uppercase tracking-tight">Batch rejected due to secondary packaging misalignment. Investigation required.</p>
 </div>
 </Card>
 </TabsContent>

 {/* TAB 3: Materials */}
 <TabsContent value="materials" className="m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <TableWrapper>
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-b border-slate-100">
 <TableHead className="py-4 pl-6 text-[9px] font-black uppercase tracking-widest text-slate-400">#</TableHead>
 <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Material Identity</TableHead>
 <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Theo Qty</TableHead>
 <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Actual Qty</TableHead>
 <TableHead className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Variance</TableHead>
 <TableHead className="py-4 pr-6 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-slate-100">
 {MATERIAL_CONSUMPTION.map((m, idx) => (
 <TableRow key={m.kode} className="hover:bg-slate-50/50 transition-colors border-none">
 <TableCell className="py-3 pl-6 font-bold text-slate-350 text-xs">{(idx + 1).toString().padStart(2, '0')}</TableCell>
 <TableCell className="py-3">
 <div className="flex flex-col text-left">
 <span className="font-black text-slate-900 text-xs uppercase">{m.nama}</span>
 <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{m.kode}</span>
 </div>
 </TableCell>
 <TableCell className="py-3 text-right font-black text-slate-800 text-xs tabular-nums">{m.teoritis} {m.unit}</TableCell>
 <TableCell className="py-3 text-right font-black text-slate-800 text-xs tabular-nums">{m.aktual} {m.unit}</TableCell>
 <TableCell className="py-3 text-right">
 <span className={cn(
 "font-black text-xs tabular-nums",
 m.selisih === 0 ? "text-emerald-500" : m.selisih > 0 ? "text-amber-600" : "text-rose-600"
 )}>
 {m.selisih > 0 ? `+${m.selisih}` : m.selisih} {m.unit}
 </span>
 </TableCell>
 <TableCell className="py-3 pr-6 text-center">
 {m.selisih === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </TableWrapper>
 </TabsContent>
 </Tabs>
 </div>

 {/* Drawer Footer Actions */}
 <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
 <div className="flex gap-3">
 <DnaButton variant="outline" size="sm" icon={<Printer />}>
 Cetak Record
 </DnaButton>
 <DnaButton variant="outline" size="sm" icon={<Download />}>
 Download PDF
 </DnaButton>
 </div>
 <div className="flex gap-3">
 <DnaButton variant="outline" size="sm" icon={<Edit3 />}>
 Edit Parameter
 </DnaButton>
 </div>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>

 {/* CREATE MODAL */}
 <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
 <DialogContent className="max-w-md border-none p-6 rounded-2xl bg-white overflow-hidden">
 <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
 
 <DialogHeader className="mb-6 relative z-10 text-left">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
 <Plus className="h-5 w-5 text-blue-600" />
 </div>
 <div>
 <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">Buat Batch Record</h2>
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 italic">Initialization</p>
 </div>
 </div>
 </DialogHeader>

 <form onSubmit={(e) => { e.preventDefault(); handleCreateBatch(); }} className="space-y-4 relative z-10 text-left">
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Linked Sales Order <span className="text-rose-500">*</span></label>
 <select 
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
 value={formData.salesOrderId}
 onChange={(e) => handleFormChange('salesOrderId', e.target.value)}
 required
 >
 <option value="">Select Sales Order...</option>
 {salesOrders?.map((so: any) => (
 <option key={so.id} value={so.id}>{so.woNumber} — {so.lead?.brandName || 'N/A'}</option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Product Formula <span className="text-rose-500">*</span></label>
 <select 
 className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
 value={formData.formulaId}
 onChange={(e) => handleFormChange('formulaId', e.target.value)}
 required
 >
 <option value="">Select Formula...</option>
 {formulas?.map((f: any) => (
 <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
 ))}
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Target Quantity <span className="text-rose-500">*</span></label>
 <Input 
 type="number" 
 placeholder="1.000" 
 className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[10px] uppercase placeholder:text-slate-400 focus:bg-white transition-all" 
 value={formData.targetQty}
 onChange={(e) => handleFormChange('targetQty', e.target.value)}
 min="1"
 required
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Target Date <span className="text-rose-500">*</span></label>
 <Input 
 type="date" 
 className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[10px] focus:bg-white transition-all text-slate-800" 
 value={formData.targetDate}
 onChange={(e) => handleFormChange('targetDate', e.target.value)}
 required
 />
 </div>
 </div>
 </form>

 <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
 <DnaButton onClick={() => { setIsCreateModalOpen(false); setFormData({ salesOrderId: "", formulaId: "", targetQty: "", targetDate: "" }); }} variant="outline" size="md">Batal</DnaButton>
 <DnaButton onClick={handleCreateBatch} variant="primary" size="md" className="flex-1" loading={createBatchMutation.isPending}>Initialize Batch</DnaButton>
 </div>
 </DialogContent>
 </Dialog>

 {/* QC SIGN OFF REUSABLE MODAL */}
 <QcSignatureModal 
 open={isSignOffModalOpen}
 onClose={() => setIsSignOffModalOpen(false)}
 onSign={handleSignOff}
 batchId={selectedBatch?.batch || ""}
 stage={signOffStage}
 parameters={MOCK_QC_PARAMS}
 />
 </DashboardShell>
 );
}

