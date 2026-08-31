"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogTitle,
 DialogHeader,
 DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
 Search,
 Plus,
 FlaskConical,
 FileText,
 ArrowRightLeft,
 AlertTriangle,
 CheckCircle2,
 Clock,
 Beaker,
 Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { StatCard, DnaInput, DnaButton, TableWrapper, DnaBadge } from "@/components/dna";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

interface FormulaAdjustment {
 id: string;
 code: string;
 date: string;
 batchRecord: string;
 product: string;
 adjustmentType: string;
 reason: string;
 quantityChange: number;
 status: string;
}

interface BatchRecord {
 batchNo: string;
 productInterest: string;
 stage: string;
}

interface Formula {
 id: string;
 name: string;
 code: string;
}

const ADJUSTMENT_TYPES = [
 "Pengurangan Bahan Baku",
 "Penambahan Bahan Baku",
 "Substitusi Formula",
 "Koreksi Rasio",
 "Lainnya",
];

const STATUS_MAP: Record<string, "success" | "warning" | "critical" | "info" | "default"> = {
 APPROVED: "success",
 PENDING: "warning",
 REJECTED: "critical",
 DRAFT: "default",
 IN_REVIEW: "info",
};

export default function FormulaAdjustmentPage() {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState("");
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [formBatch, setFormBatch] = useState("");
 const [formFormula, setFormFormula] = useState("");
 const [formType, setFormType] = useState("");
 const [formQtyChange, setFormQtyChange] = useState("");
 const [formReason, setFormReason] = useState("");
 const [showConfirm, setShowConfirm] = useState(false);

 const { data: adjustments, isLoading, isError } = useQuery<FormulaAdjustment[]>({
 queryKey: ["formula-adjustments"],
 queryFn: async () => {
 const res = await api.get("/production/formula-adjustments");
 const raw = res.data || [];
 return raw.map((a: any) => ({
 id: a.id,
 code: a.id?.substring(0, 8)?.toUpperCase() || 'ADJ-001',
 date: a.createdAt || new Date().toISOString(),
 batchRecord: a.entityId || 'N/A',
 product: a.reason || 'N/A',
 adjustmentType: a.changes?.adjustmentType || a.metadata?.adjustmentType || 'Penyesuaian',
 reason: a.reason || '',
 quantityChange: a.changes?.quantityChange || a.metadata?.quantityChange || 0,
 status: a.status || 'PENDING',
 }));
 },
 });

 const { data: batchRecords } = useQuery<BatchRecord[]>({
 queryKey: ["production-batch-records-list"],
 queryFn: async () => {
 const res = await api.get("/production/batch-records");
 return (res.data || []).map((b: any) => ({
 batchNo: b.batchNo || b.code || b.id,
 productInterest: b.lead?.productInterest || b.product || "Unknown",
 stage: b.stage || "PLANNED",
 }));
 },
 });

 const { data: formulas } = useQuery<Formula[]>({
 queryKey: ["rnd-formulas"],
 queryFn: async () => {
 const res = await api.get("/rnd/formulas");
 return (res.data || []).map((f: any) => ({
 id: f.id,
 name: f.name,
 code: f.code || f.id,
 }));
 },
 });

 const createMutation = useMutation({
 mutationFn: async (data: any) => {
 return api.post("/production/formula-adjustments", {
 formulaId: data.formulaId,
 requestedBy: data.requestedBy,
 reason: data.reason,
 changes: {
 batchRecord: data.batchRecord,
 adjustmentType: data.adjustmentType,
 quantityChange: data.quantityChange,
 },
 });
 },
 onSuccess: () => {
 toast.success("Penyesuaian formulasi berhasil dibuat");
 queryClient.invalidateQueries({ queryKey: ["formula-adjustments"] });
 resetForm();
 setIsModalOpen(false);
 },
 onError: (err: any) => {
 toast.error(err?.response?.data?.message || "Gagal membuat penyesuaian");
 },
 });

 const resetForm = () => {
 setFormBatch("");
 setFormFormula("");
 setFormType("");
 setFormQtyChange("");
 setFormReason("");
 };

 const handleSubmit = () => {
 if (!formBatch || !formFormula || !formType) {
 toast.error("Lengkapi semua field wajib");
 return;
 }
 setShowConfirm(true);
 };

 const confirmSubmit = () => {
 setShowConfirm(false);
 const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
 createMutation.mutate({
 batchRecord: formBatch,
 formulaId: formFormula,
 adjustmentType: formType,
 quantityChange: Number(formQtyChange) || 0,
 reason: formReason,
 requestedBy: user.id || user.email || 'SYSTEM',
 });
 };

 const filtered = adjustments?.filter(
 (a) =>
 a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.batchRecord.toLowerCase().includes(searchTerm.toLowerCase())
 ) || [];

 const pendingCount = adjustments?.filter((a) => a.status === "PENDING").length || 0;
 const approvedCount = adjustments?.filter((a) => a.status === "APPROVED").length || 0;
 const totalAdjustments = adjustments?.length || 0;
 const rejectedCount = adjustments?.filter((a) => a.status === "REJECTED").length || 0;

 return (
 <DashboardShell
 title="Penyesuaian"
 titleAccent="Formulasi"
 subtitle="Manajemen perubahan formula produksi & batch record"
 actions={
 <div className="flex gap-3">
 <DnaButton
 variant="primary"
 onClick={() => {
 resetForm();
 setIsModalOpen(true);
 }}
 >
 <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> Buat Penyesuaian
 </DnaButton>
 </div>
 }
 >
 {isLoading ? (
 <QueryLoading message="Memuat data penyesuaian..." />
 ) : isError ? (
 <QueryError error="Gagal memuat data" onRetry={() => window.location.reload()} />
 ) : (
 <>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <StatCard icon={<FlaskConical className="text-blue-600" />} label="Total Penyesuaian" value={totalAdjustments} />
 <StatCard icon={<Clock className="text-amber-600" />} label="Menunggu Review" value={pendingCount} />
 <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Disetujui" value={approvedCount} />
 <StatCard icon={<AlertTriangle className="text-rose-600" />} label="Ditolak" value={rejectedCount} />
 </div>

 <TableWrapper
 filters={
 <div className="flex items-center gap-3 w-full justify-between">
 <div>
 <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
 Daftar Penyesuaian Formulasi
 </h3>
 <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
 Riwayat perubahan formula & batch • {filtered.length} Records
 </p>
 </div>
 <div className="relative w-64">
 <DnaInput
 icon={<Search className="h-4 w-4" />}
 placeholder="Cari kode / produk..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>
 }
 >
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/70">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Kode / Tanggal
 </TableHead>
 <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Batch Record
 </TableHead>
 <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Produk
 </TableHead>
 <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Jenis Penyesuaian
 </TableHead>
 <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">
 Status
 </TableHead>
 <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
 Aksi
 </TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filtered.map((adj) => (
 <TableRow
 key={adj.id}
 className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50"
 >
 <TableCell className="py-3 pl-6">
 <div>
 <p className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
 {adj.code}
 </p>
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5 italic">
 {new Date(adj.date).toLocaleDateString("id-ID")}
 </p>
 </div>
 </TableCell>
 <TableCell className="py-3">
 <div className="flex items-center gap-2">
 <FileText className="h-3.5 w-3.5 text-blue-500" />
 <span className="font-black text-slate-900 text-xs uppercase">{adj.batchRecord}</span>
 </div>
 </TableCell>
 <TableCell className="py-3">
 <span className="font-medium text-xs text-slate-700">{adj.product}</span>
 </TableCell>
 <TableCell className="py-3">
 <div className="flex items-center gap-2">
 <Beaker className="h-3.5 w-3.5 text-amber-500" />
 <span className="text-[10px] font-black text-slate-600 uppercase">{adj.adjustmentType}</span>
 </div>
 </TableCell>
 <TableCell className="py-3 text-center">
 <DnaBadge status={STATUS_MAP[adj.status] || "default"}>
 {adj.status}
 </DnaBadge>
 </TableCell>
 <TableCell className="py-3 pr-6 text-right">
 <DnaButton variant="outline" size="sm" icon={<ArrowRightLeft />}>
 Detail
 </DnaButton>
 </TableCell>
 </TableRow>
 ))}
 {filtered.length === 0 && (
 <TableRow>
 <TableCell colSpan={6} className="py-16 text-center">
 <div className="flex flex-col items-center justify-center">
 <FlaskConical className="h-12 w-12 text-slate-200 mb-3" />
 <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">
 Belum Ada Penyesuaian
 </p>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
 Buat penyesuaian formulasi pertama
 </p>
 </div>
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </TableWrapper>
 </>
 )}

 {/* CREATE MODAL */}
 <Dialog open={isModalOpen} onOpenChange={(o) => { setIsModalOpen(o); if (!o) resetForm(); }}>
 <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
 <div className="p-8 bg-amber-600 text-white relative">
 <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">
 Penyesuaian Formulasi
 </DialogTitle>
 <DialogDescription className="text-white/70 font-medium uppercase text-[9px] tracking-tight mt-2">
 Ajukan perubahan parameter formula produksi
 </DialogDescription>
 <FlaskConical className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 opacity-30 text-white" />
 </div>
 <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
 Batch Record <span className="text-red-500">*</span>
 </Label>
 <Select value={formBatch} onValueChange={(v) => setFormBatch(v ?? "")}>
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
 <SelectValue placeholder="Pilih batch record" />
 </SelectTrigger>
 <SelectContent>
 {batchRecords?.map((b) => (
 <SelectItem key={b.batchNo} value={b.batchNo} className="font-medium text-xs">
 {b.batchNo} — {b.productInterest}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
 Formula <span className="text-red-500">*</span>
 </Label>
 <Select value={formFormula} onValueChange={(v) => setFormFormula(v ?? "")}>
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
 <SelectValue placeholder="Pilih formula" />
 </SelectTrigger>
 <SelectContent>
 {formulas?.map((f) => (
 <SelectItem key={f.id} value={f.id} className="font-medium text-xs">
 {f.code} — {f.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
 Jenis Penyesuaian <span className="text-red-500">*</span>
 </Label>
 <Select value={formType} onValueChange={(v) => setFormType(v ?? "")}>
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
 <SelectValue placeholder="Pilih jenis" />
 </SelectTrigger>
 <SelectContent>
 {ADJUSTMENT_TYPES.map((t) => (
 <SelectItem key={t} value={t} className="font-medium text-xs">
 {t}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
 Perubahan Kuantitas
 </Label>
 <DnaInput
 type="number"
 placeholder="0"
 value={formQtyChange}
 onChange={(e) => setFormQtyChange(e.target.value)}
 className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs"
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
 Alasan Penyesuaian
 </Label>
 <textarea
 placeholder="Jelaskan alasan penyesuaian formulasi..."
 value={formReason}
 onChange={(e) => setFormReason(e.target.value)}
 className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
 />
 </div>
 <div className="flex gap-3 pt-4 border-t border-slate-100">
 <DnaButton variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
 Batal
 </DnaButton>
 <DnaButton
 variant="primary"
 onClick={handleSubmit}
 disabled={!formBatch || !formFormula || !formType}
 className="flex-1"
 >
 Ajukan Penyesuaian
 </DnaButton>
 </div>
 </div>
 </DialogContent>
 </Dialog>
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
 </DashboardShell>
 );
}
