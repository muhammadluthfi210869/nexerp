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
  BarChart4,
  Award,
  ShieldCheck,
  Users,
  Coins,
  ChevronDown,
  Edit3,
  AlertCircle,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatCard, TableWrapper, DnaInput, DnaButton } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";
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

  return (
    <DashboardShell
      title="TARGET"
      titleAccent="Penjualan"
      subtitle="Goal Setting & Strategic Performance Management for Marketing Personnel"
      actions={
        <div className="flex gap-4">
          <DnaButton
            variant="outline"
            onClick={() => setView("list")}
            size="md"
          >
            <History className="mr-2 h-4 w-4 text-blue-500" /> Riwayat
          </DnaButton>
          <DnaButton
            onClick={() => setView("form")}
            variant="primary"
            size="md"
          >
            <Plus className="mr-2 h-5 w-5" /> Buat
          </DnaButton>
        </div>
      }
    >
      <div className="animate-fade-slide-in space-y-10">
        <AnimatePresence mode="wait">
          {view === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Active Personnel"
                  value={users.length}
                  icon={<Users className="text-blue-500" />}
                />
                <StatCard
                  label="Total Targets"
                  value={targets.length}
                  icon={<Coins className="text-emerald-500" />}
                />
                <StatCard
                  label="Avg. Achievement"
                  value="—"
                  icon={<TrendingUp className="text-amber-500" />}
                />
                <StatCard
                  label="Top Performer"
                  value={targets.length > 0 ? (users.find(u => u.id === targets[0]?.userId)?.fullName || "—") : "—"}
                  icon={<Award className="text-blue-500" />}
                />
              </div>

              {/* List Table */}
              <TableWrapper
                filters={
                  <div className="flex justify-between items-center bg-white">
                    <div className="relative w-72">
                      <DnaInput
                        placeholder="Search Personnel..."
                        icon={<Search className="h-4 w-4" />}
                        className="text-xs font-black"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-4">
                      <span className="bg-slate-50 text-slate-500 font-black text-[9px] uppercase px-4 py-2 rounded-lg border border-slate-100">
                        Period: {new Date().getFullYear()}
                      </span>
                    </div>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">Marketing Personnel</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">Target Period</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400 text-right">Target Nominal</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center">Status</TableHead>
                        <TableHead className="py-4 px-4 pr-6 text-table-header text-slate-400 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2rem]">Loading targets...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredTargets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Target className="h-10 w-10 text-slate-200" />
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2rem]">Belum ada data target</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTargets.map((target) => (
                          <TableRow key={target.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform shrink-0">
                                  <User className="h-4.5 w-4.5 text-slate-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{target.user?.fullName || "—"}</span>
                                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Marketing Executive</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[10px] font-black text-slate-900 uppercase italic">{MONTHS[target.month - 1]} {target.year}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <span className="text-xs font-black text-slate-900 tabular-nums">Rp {Number(target.nominalTarget).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm bg-blue-100 text-blue-700">
                                Active
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4 pr-6 text-right">
                              <DnaButton variant="ghost" size="sm">
                                Detail
                              </DnaButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TableWrapper>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto space-y-10 pb-20"
            >
              {/* Form Nav */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <button
                  onClick={() => setView("list")}
                  className="group rounded-2xl p-2 pr-6 transition-all hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center"
                >
                  <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 shadow-sm flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                    <ChevronLeft className="h-5 w-5" />
                  </div>
                  <span className="ml-4 font-black uppercase text-[10px] tracking-widest italic text-slate-400 group-hover:text-rose-600">Cancel Protocol</span>
                </button>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Target Configuration</span>
                    <span className="text-xs font-black uppercase text-blue-600">Protocol 14-ST</span>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-100" />
                  <DnaButton
                    onClick={handleSubmit}
                    variant="primary"
                    size="lg"
                    icon={saving ? <Loader2 className="animate-spin" /> : <Save />}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Target"}
                  </DnaButton>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Configuration Panel */}
                <div className="lg:col-span-8 space-y-10">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">Personnel <span className="text-blue-600">& Period</span></h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nama Sales <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <DnaInput
                            placeholder="Search from staff members..."
                            icon={<Search className="h-5 w-5" />}
                            className="h-12 font-black uppercase text-xs italic"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          {filteredUsers.map(user => (
                            <span
                              key={user.id}
                              onClick={() => setFormData({ ...formData, userId: user.id })}
                              className={cn(
                                "h-10 px-4 rounded-lg border bg-white hover:bg-blue-600 hover:text-white transition-all cursor-pointer font-black uppercase text-[9px] tracking-tight inline-flex items-center",
                                formData.userId === user.id
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 text-slate-900"
                              )}
                            >
                              {user.fullName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Periode Tahun</label>
                          <DnaInput
                            type="number"
                            value={formData.year}
                            min={2020}
                            max={2099}
                            icon={<Calendar className="h-4 w-4" />}
                            className="font-black text-xs"
                            onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Periode Bulan</label>
                          <div className="relative">
                            <select
                              value={formData.month}
                              onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                              className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-blue-500 transition-all italic"
                            >
                              {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valuation Panel */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">Revenue <span className="text-blue-600">Goal</span></h2>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Nominal (IDR) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <DnaInput
                          type="number"
                          placeholder="0"
                          value={formData.nominalTarget || ""}
                          onChange={(e) => setFormData({ ...formData, nominalTarget: Number(e.target.value) })}
                          className="h-24 pl-24 font-black text-5xl tabular-nums italic text-slate-900"
                        />
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 pointer-events-none">Rp</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Insight & Rules */}
                <div className="lg:col-span-4 space-y-10">
                  <div className="sticky top-10 space-y-10">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-900 overflow-hidden relative">
                      <div className="relative z-10 space-y-10">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Target Governance</p>
                          <h2 className="text-3xl font-black italic tracking-tighter uppercase mt-2 text-slate-900">Performance <br /> <span className="text-blue-600">Benchmark</span></h2>
                        </div>

                        <div className="space-y-8 pt-10 border-t border-slate-200">
                          <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                              <TrendingUp className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-900">Dynamic Growth</span>
                              <span className="text-[9px] font-medium text-slate-400 uppercase italic">Targets are recalculated vs Last Year</span>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                              <ShieldCheck className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-900">Incentive Locked</span>
                              <span className="text-[9px] font-medium text-slate-400 uppercase italic">Linked to bonus automated engine</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Target className="h-48 w-48 text-black/5 absolute -right-12 -bottom-12 rotate-12" />
                    </div>

                    <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 space-y-4">
                      <div className="flex items-center gap-3 text-blue-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Intelligence</span>
                      </div>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase italic">
                        &quot;All targets are finalized on the 1st of every month. Changes after the 5th require CEO level authorization.&quot;
                      </p>
                    </div>
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
            <DnaButton variant="outline" onClick={() => setShowConfirm(false)}>Batal</DnaButton>
            <DnaButton variant="primary" onClick={confirmSubmit}>Ya, Simpan</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
