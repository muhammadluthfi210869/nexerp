"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Calendar,
  User,
  Phone,
  Building2,
  MessageSquare,
  ChevronLeft,
  Save,
  Loader2,
  Clock,
  Users,
  Hash,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, TableWrapper, DnaInput, DnaButton } from "@/components/dna";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type GuestLog = {
  id: string;
  visitDate: string;
  clientName: string;
  phoneNo: string | null;
  instansi: string | null;
  purpose: string | null;
  category: string;
  bd?: { fullName: string } | null;
  city: string | null;
  email: string | null;
  productInterest: string | null;
};

type UserOption = {
  id: string;
  fullName: string;
};

export default function GuestBookPage() {
  const [view, setView] = useState<"list" | "form">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [guests, setGuests] = useState<GuestLog[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    phoneNo: "",
    instansi: "",
    purpose: "",
    category: "PROSPEK",
    bdId: "",
    city: "",
    email: "",
    productInterest: "",
    visitDate: new Date().toISOString().slice(0, 16),
  });

  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/guests");
      setGuests(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Gagal memuat data buku tamu");
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
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setUsers([]);
      }
    }
  }, []);

  useEffect(() => {
    fetchGuests();
    fetchUsers();
  }, [fetchGuests, fetchUsers]);

  const filteredGuests = guests.filter(g =>
    g.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.instansi?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.clientName) {
      toast.error("Nama tamu wajib diisi");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    try {
      setSaving(true);
      await api.post("/guests", {
        ...formData,
        visitDate: new Date(formData.visitDate).toISOString(),
      });
      toast.success("Buku tamu berhasil disimpan");
      setView("list");
      fetchGuests();
      setFormData({
        clientName: "", phoneNo: "", instansi: "", purpose: "",
        category: "PROSPEK", bdId: "", city: "", email: "",
        productInterest: "", visitDate: new Date().toISOString().slice(0, 16),
      });
    } catch {
      toast.error("Gagal menyimpan buku tamu");
    } finally {
      setSaving(false);
    }
  };

  const totalGuests = guests.length;
  const todayGuests = guests.filter(g => {
    const today = new Date().toISOString().split("T")[0];
    return g.visitDate.startsWith(today);
  }).length;

  return (
    <DashboardShell
      title="BUKU"
      titleAccent="TAMU"
      subtitle="Guest Book & Visitor Management System"
      actions={
        <div className="flex gap-4">
          <DnaButton variant="outline" onClick={() => setView("list")} size="md">
            <BookOpen className="mr-2 h-4 w-4 text-blue-500" /> Riwayat
          </DnaButton>
          <DnaButton onClick={() => setView("form")} variant="primary" size="md">
            <Plus className="mr-2 h-5 w-5" /> Tamu Baru
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
                <StatCard label="Total Tamu" value={totalGuests} icon={<Users className="text-blue-500" />} />
                <StatCard label="Hari Ini" value={todayGuests} icon={<Calendar className="text-emerald-500" />} />
                <StatCard label="Staff BD" value={users.length} icon={<User className="text-amber-500" />} />
                <StatCard label="Pending Follow-up" value="—" icon={<Clock className="text-rose-500" />} />
              </div>

              {/* List Table */}
              <TableWrapper
                filters={
                  <div className="flex justify-between items-center bg-white w-full">
                    <div className="relative w-72">
                      <DnaInput
                        placeholder="Search nama / instansi..."
                        icon={<Search className="h-4 w-4" />}
                        className="text-xs font-black"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <span className="bg-slate-50 text-slate-500 font-black text-[9px] uppercase px-4 py-2 rounded-lg border border-slate-100">
                      {filteredGuests.length} Records
                    </span>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">Tanggal & Waktu</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">Nama Tamu</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">Asal Instansi</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">No. Telepon</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">Tujuan / Keperluan</TableHead>
                        <TableHead className="py-4 px-4 text-table-header text-slate-400">Bertemu Dengan</TableHead>
                        <TableHead className="py-4 px-4 pr-6 text-table-header text-slate-400 text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2rem]">Loading guest data...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredGuests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <BookOpen className="h-10 w-10 text-slate-200" />
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2rem]">Belum ada tamu tercatat</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredGuests.map((guest) => (
                          <TableRow key={guest.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[10px] font-black text-slate-900 uppercase italic">
                                  {new Date(guest.visitDate).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform shrink-0">
                                  <User className="h-4 w-4" />
                                </div>
                                <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{guest.clientName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="font-black text-slate-900 text-xs uppercase">{guest.instansi || "—"}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="text-[10px] font-bold text-slate-400">{guest.phoneNo || "—"}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="text-[10px] font-medium text-slate-500 max-w-[200px] truncate block">{guest.purpose || "—"}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className="text-[10px] font-black text-blue-600 uppercase">{guest.bd?.fullName || "—"}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 pr-6 text-right">
                              <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] shadow-sm bg-blue-100 text-blue-700">
                                {guest.category}
                              </span>
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
              className="max-w-4xl mx-auto space-y-10 pb-20"
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
                  <span className="ml-4 font-black uppercase text-[10px] tracking-widest italic text-slate-400 group-hover:text-rose-600">Batal</span>
                </button>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Guest Registration</span>
                    <span className="text-xs font-black uppercase text-blue-600">Protocol 01-GB</span>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-100" />
                  <DnaButton
                    onClick={handleSubmit}
                    className="mb-0"
                    variant="primary"
                    size="lg"
                    icon={saving ? <Loader2 className="animate-spin" /> : <Save />}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Simpan Tamu"}
                  </DnaButton>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Form */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Tanggal & Waktu */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">Tanggal <span className="text-blue-600">& Waktu</span></h2>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Waktu Kunjungan</label>
                      <DnaInput
                        type="datetime-local"
                        value={formData.visitDate}
                        onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                        icon={<Calendar className="h-4 w-4" />}
                        className="font-black text-xs"
                      />
                    </div>
                  </div>

                  {/* Data Tamu */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">Data <span className="text-blue-600">Tamu</span></h2>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nama Tamu <span className="text-red-500">*</span></label>
                          <DnaInput
                            placeholder="Nama lengkap tamu"
                            value={formData.clientName}
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                            icon={<User className="h-4 w-4" />}
                            className="font-black text-xs uppercase"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">No. Telepon</label>
                          <DnaInput
                            placeholder="08xxxxxxxxxx"
                            value={formData.phoneNo}
                            onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                            icon={<Phone className="h-4 w-4" />}
                            className="font-black text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Asal Instansi</label>
                          <DnaInput
                            placeholder="PT / CV / Instansi"
                            value={formData.instansi}
                            onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                            icon={<Building2 className="h-4 w-4" />}
                            className="font-black text-xs uppercase"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Kota Asal</label>
                          <DnaInput
                            placeholder="Kota / Kabupaten"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            icon={<MapPin className="h-4 w-4" />}
                            className="font-black text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tujuan / Keperluan</label>
                        <textarea
                          placeholder="Tujuan kunjungan tamu..."
                          value={formData.purpose}
                          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kategori & Staff */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">Kategori <span className="text-blue-600">& Staff</span></h2>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Kategori Tamu</label>
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-blue-500 transition-all italic text-slate-800"
                          >
                            <option value="PROSPEK">Prospek</option>
                            <option value="KLIEN">Klien</option>
                            <option value="Mitra">Mitra</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bertemu Dengan</label>
                        <div className="relative">
                          <select
                            value={formData.bdId}
                            onChange={(e) => setFormData({ ...formData, bdId: e.target.value })}
                            className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-blue-500 transition-all italic text-slate-800"
                          >
                            <option value="">— PILIH STAFF —</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.fullName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="sticky top-10 space-y-8">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-900 overflow-hidden relative">
                      <div className="relative z-10 space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Guest Protocol</p>
                          <h2 className="text-2xl font-black italic tracking-tighter uppercase mt-2 text-slate-900">Visitor <br /> <span className="text-blue-600">Management</span></h2>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-slate-200">
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                              <User className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-900">Identifikasi Tamu</span>
                              <span className="text-[9px] font-medium text-slate-400 uppercase italic">Lengkapi data kontak</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                              <MessageSquare className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-900">Tujuan Kunjungan</span>
                              <span className="text-[9px] font-medium text-slate-400 uppercase italic">Catat keperluan tamu</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                              <Users className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-900">Staff BD</span>
                              <span className="text-[9px] font-medium text-slate-400 uppercase italic">Tugaskan staff yang melayani</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <BookOpen className="h-40 w-40 text-black/5 absolute -right-10 -bottom-10 rotate-12" />
                    </div>

                    <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 space-y-4">
                      <div className="flex items-center gap-3 text-blue-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Quick Info</span>
                      </div>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase italic">
                        &quot;Semua kunjungan harus tercatat. Follow-up wajib dalam 1x24 jam setelah kunjungan.&quot;
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
