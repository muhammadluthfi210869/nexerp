"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
 Target,
 Search,
 Plus,
 ChevronLeft,
 Save,
 Calendar,
 User,
 TrendingUp,
 Award,
 Users,
 Coins,
 ChevronDown,
 AlertCircle,
 History,
 Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatOperationalNumber } from "@/lib/operational-formatters";
import {
 OperationalButton,
 OperationalField,
 OperationalInput,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalPageShell,
 OperationalPanel,
 OperationalStatusBadge,
 getOperationalStatusLabel,
} from "@/components/operational";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";

type SalesTarget = {
 id: string;
 userId: string;
 month: number;
 year: number;
 nominalTarget: number;
 createdAt: string;
 user?: { fullName: string } | null;
};

type UserOption = {
 id: string;
 fullName: string;
 email: string;
};

const MONTHS = [
 "Januari", "Februari", "Maret", "April", "Mei", "Juni",
 "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function SalesTargetPrototype() {
 const [view, setView] = useState<"list" | "form">("list");
 const [searchTerm, setSearchTerm] = useState("");
 const [targets, setTargets] = useState<SalesTarget[]>([]);
 const [users, setUsers] = useState<UserOption[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);

 const [formData, setFormData] = useState({
 userId: "",
 month: new Date().getMonth() + 1,
 year: new Date().getFullYear(),
 nominalTarget: 0,
 });

 const fetchTargets = useCallback(async () => {
 try {
 setLoading(true);
 const res = await api.get("/bussdev/sales-targets");
 setTargets(Array.isArray(res.data) ? res.data : []);
 } catch {
 toast.error("Gagal memuat data target penjualan");
 } finally {
 setLoading(false);
 }
 }, []);

 const fetchUsers = useCallback(async () => {
 try {
 const res = await api.get("/auth/users");
 setUsers(Array.isArray(res.data) ? res.data : []);
 } catch {
 try {
 const res = await api.get("/bussdev/staffs");
 const staffData = Array.isArray(res.data) ? res.data : [];
 setUsers(staffData.map((s: any) => ({ id: s.id || s.userId, fullName: s.fullName || s.name, email: s.email || "" })));
 } catch {
 setUsers([]);
 }
 }
 }, []);

 useEffect(() => {
 fetchTargets();
 fetchUsers();
 }, [fetchTargets, fetchUsers]);

 const filteredTargets = targets.filter(t => {
 const name = t.user?.fullName || "";
 return name.toLowerCase().includes(searchTerm.toLowerCase());
 });

 const filteredUsers = users.filter(u =>
 u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleSubmit = () => {
 if (!formData.userId || !formData.nominalTarget) {
 toast.error("Lengkapi semua field wajib");
 return;
 }
 setShowConfirm(true);
 };

 const confirmSubmit = async () => {
 setShowConfirm(false);
 try {
 setSaving(true);
 await api.post("/bussdev/sales-targets", formData);
 toast.success("Target penjualan berhasil disimpan");
 setView("list");
 fetchTargets();
 setFormData({ userId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), nominalTarget: 0 });
 } catch {
 toast.error("Gagal menyimpan target penjualan");
 } finally {
 setSaving(false);
 }
 };

 const selectedUser = users.find(u => u.id === formData.userId);
 const topPerformer = targets.length > 0 ? users.find(u => u.id === targets[0]?.userId)?.fullName : null;

 return (
 <OperationalPageShell
 title="Target Penjualan"
 subtitle="Goal Setting & Strategic Performance Management for Marketing Personnel"
 actions={
 <div className="flex gap-2">
 <button type="button" className="operational-button is-secondary" onClick={() => setView("list")}>
 <History className="h-4 w-4" />
 <span>Riwayat</span>
 </button>
 <button type="button" className="operational-button is-primary" onClick={() => setView("form")}>
 <Plus className="h-4 w-4" />
 <span>Buat</span>
 </button>
 </div>
 }
 >
 <div className="operational-stack">
 <AnimatePresence mode="wait">
 {view === "list" ? (
 <motion.div
 key="list"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 className="operational-stack"
 >
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Active Personnel"
 value={users.length}
 icon={<Users className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Total Targets"
 value={targets.length}
 icon={<Coins className="h-4 w-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Avg. Achievement"
 value="78%"
 helper="Target vs actual ratio"
 icon={<TrendingUp className="h-4 w-4" />}
 tone="amber"
 />
 <OperationalMetricCard
 label="Top Performer"
 value={topPerformer ?? "—"}
 icon={<Award className="h-4 w-4" />}
 tone="blue"
 />
 </OperationalMetricGrid>

 <OperationalPanel>
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div className="flex items-center gap-2">
 <div className="h-4 w-1 rounded-full bg-blue-600" />
 <h3 className="text-[14px] font-semibold text-slate-900">Daftar Target Penjualan</h3>
 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
 {filteredTargets.length}
 </span>
 </div>
 <div className="flex flex-col gap-2 md:flex-row md:items-center">
 <OperationalInput
 icon={<Search className="h-4 w-4" />}
 placeholder="Cari personnel..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="md:w-72"
 />
 <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
 Period: {new Date().getFullYear()}
 </span>
 </div>
 </div>

 <div className="mt-4 overflow-x-auto">
 <table className="w-full table-fixed border-collapse text-left">
 <colgroup>
 <col className="w-[28%]" />
 <col className="w-[18%]" />
 <col className="w-[18%]" />
 <col className="w-[16%]" />
 <col className="w-[20%]" />
 </colgroup>
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Marketing Personnel</th>
 <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Target Period</th>
 <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Target Nominal</th>
 <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Status</th>
 <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Action</th>
 </tr>
 </thead>
 <tbody>
 {loading ? (
 <tr>
 <td colSpan={5} className="py-16 text-center text-[12px] text-slate-400">
 <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
 <p className="mt-2">Memuat target...</p>
 </td>
 </tr>
 ) : filteredTargets.length === 0 ? (
 <tr>
 <td colSpan={5} className="py-16 text-center text-[12px] text-slate-400">
 <Target className="mx-auto h-8 w-8 text-slate-200" />
 <p className="mt-2">Belum ada data target</p>
 </td>
 </tr>
 ) : (
 filteredTargets.map((target) => (
 <tr key={target.id} className="border-b border-slate-100 transition hover:bg-blue-50/30">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-600">
 <User className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="text-[12px] font-semibold text-slate-900">
 {target.user?.fullName || "—"}
 </span>
 <span className="text-[10px] text-slate-500">Marketing Executive</span>
 </div>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <Calendar className="h-3.5 w-3.5 text-blue-500" />
 <span className="text-[12px] font-medium text-slate-900">
 {MONTHS[target.month - 1]} {target.year}
 </span>
 </div>
 </td>
 <td className="px-3 py-2.5 text-right text-[12px] font-semibold tabular-nums text-slate-900">
 Rp {formatOperationalNumber(target.nominalTarget)}
 </td>
 <td className="px-3 py-2.5 text-center">
 <OperationalStatusBadge status="success">
 {getOperationalStatusLabel("ACTIVE")}
 </OperationalStatusBadge>
 </td>
 <td className="px-3 py-2.5 text-right">
 <button type="button" className="operational-button is-secondary h-8 px-3 text-[11px]">
 Detail
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </OperationalPanel>
 </motion.div>
 ) : (
 <motion.div
 key="form"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="mx-auto grid max-w-7xl grid-cols-1 gap-6 pb-12 lg:grid-cols-12"
 >
 <div className="lg:col-span-12">
 <OperationalPanel>
 <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
 <button
 type="button"
 onClick={() => setView("list")}
 className="inline-flex items-center gap-2 rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
 >
 <ChevronLeft className="h-5 w-5" />
 <span className="text-[11px] font-medium">Cancel Protocol</span>
 </button>
 <div className="flex items-center gap-3">
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Target Configuration</span>
 <span className="text-[12px] font-semibold text-blue-600">Protocol 14-ST</span>
 </div>
 <OperationalButton
 variant="primary"
 onClick={handleSubmit}
 disabled={saving}
 >
 {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
 <span>{saving ? "Saving..." : "Save Target"}</span>
 </OperationalButton>
 </div>
 </div>
 </OperationalPanel>
 </div>

 <div className="space-y-6 lg:col-span-8">
 <OperationalPanel>
 <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
 <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
 <Users className="h-4 w-4" />
 </div>
 <h3 className="text-[14px] font-semibold text-slate-900">Personnel & Period</h3>
 </div>

 <div className="space-y-4">
 <div className="space-y-2">
 <label className="block text-[11px] font-medium text-slate-600">Nama Sales <span className="text-rose-500">*</span></label>
 <OperationalInput
 icon={<Search className="h-4 w-4" />}
 placeholder="Search from staff members..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
 {filteredUsers.map(user => (
 <button
 key={user.id}
 type="button"
 onClick={() => setFormData({ ...formData, userId: user.id })}
 className={cn(
 "rounded-md border px-3 py-1 text-[11px] font-medium transition cursor-pointer",
 formData.userId === user.id
 ? "border-blue-600 bg-blue-600 text-white"
 : "border-slate-200 bg-white text-slate-900 hover:border-blue-300",
 )}
 >
 {user.fullName}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <OperationalField label="Periode Tahun">
 <input
 type="number"
 value={formData.year}
 min={2020}
 max={2099}
 onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
 />
 </OperationalField>
 <OperationalField label="Periode Bulan">
 <div className="relative">
 <select
 value={formData.month}
 onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
 >
 {MONTHS.map((m, i) => (
 <option key={m} value={i + 1}>{m}</option>
 ))}
 </select>
 <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
 </div>
 </OperationalField>
 </div>
 </div>
 </OperationalPanel>

 <OperationalPanel>
 <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
 <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
 <Coins className="h-4 w-4" />
 </div>
 <h3 className="text-[14px] font-semibold text-slate-900">Revenue Goal</h3>
 </div>

 <OperationalField label="Target Nominal (IDR) *">
 <div className="relative">
 <input
 type="number"
 placeholder="0"
 value={formData.nominalTarget || ""}
 onChange={(e) => setFormData({ ...formData, nominalTarget: Number(e.target.value) })}
 className="h-16 pl-14 text-[24px] font-semibold tabular-nums text-slate-900"
 />
 <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-slate-300">Rp</span>
 </div>
 </OperationalField>
 </OperationalPanel>
 </div>

 <div className="space-y-6 lg:col-span-4">
 <div className="sticky top-10 space-y-6">
 <OperationalPanel>
 <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600">Target Governance</p>
 <h2 className="mt-2 text-[20px] font-semibold text-slate-900">Performance Benchmark</h2>
 <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-[12px] text-slate-700">
 <li className="flex items-start gap-2">
 <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-600">
 <TrendingUp className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-slate-900">Dynamic Growth</span>
 <span className="text-[10px] text-slate-500">Targets recalculated vs Last Year</span>
 </div>
 </li>
 <li className="flex items-start gap-2">
 <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-600">
 <Award className="h-4 w-4" />
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-semibold text-slate-900">Incentive Locked</span>
 <span className="text-[10px] text-slate-500">Linked to bonus automated engine</span>
 </div>
 </li>
 </ul>
 </OperationalPanel>

 <div className="rounded-md border-2 border-dashed border-slate-200 bg-white/60 p-4">
 <div className="flex items-center gap-2 text-blue-600">
 <AlertCircle className="h-4 w-4" />
 <span className="text-[10px] font-medium uppercase tracking-wider">Protocol Intelligence</span>
 </div>
 <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
 "All targets are finalized on the 1st of every month. Changes after the 5th require CEO level authorization."
 </p>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Konfirmasi</DialogTitle>
 </DialogHeader>
 <p>Apakah Anda yakin ingin menyimpan data ini?</p>
 <DialogFooter>
 <button type="button" className="operational-button is-secondary" onClick={() => setShowConfirm(false)}>
 Batal
 </button>
 <button type="button" className="operational-button is-primary" onClick={confirmSubmit}>
 Ya, Simpan
 </button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </OperationalPageShell>
 );
}
