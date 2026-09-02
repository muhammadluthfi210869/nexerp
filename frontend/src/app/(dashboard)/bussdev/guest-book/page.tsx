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
  moqPlan?: number | null;
  launchingPlan?: string | null;
  targetMarket?: string | null;
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
    moqPlan: "",
    launchingPlan: "",
    targetMarket: "",
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
        productInterest: "", moqPlan: "", launchingPlan: "", targetMarket: "",
        visitDate: new Date().toISOString().slice(0, 16),
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
                <div className="overflow-x-auto" style={{ background: "white", borderRadius: "24px", border: "1px solid #E2E8F0" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                        <th style={{ padding: "1rem 0.5rem 1rem 1.5rem", width: "9%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>TANGGAL/WKT</th>
                        <th style={{ padding: "1rem 0.5rem", width: "11%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>NAMA CLIENT</th>
                        <th style={{ padding: "1rem 0.5rem", width: "9%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>BUSDEV</th>
                        <th style={{ padding: "1rem 0.5rem", width: "12%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>KONTAK (WA/MAIL)</th>
                        <th style={{ padding: "1rem 0.5rem", width: "5%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>KOTA</th>
                        <th style={{ padding: "1rem 0.5rem", width: "12%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>PRODUK</th>
                        <th style={{ padding: "1rem 0.5rem", width: "6%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>MOQ</th>
                        <th style={{ padding: "1rem 0.5rem", width: "8%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "center" }}>LAUNCH</th>
                        <th style={{ padding: "1rem 0.5rem", width: "13%", fontSize: "8px", fontWeight: 950, color: "#94A3B8" }}>TARGET MARKET</th>
                        <th style={{ padding: "1rem 1.5rem 1rem 0.5rem", width: "15%", fontSize: "8px", fontWeight: 950, color: "#94A3B8", textAlign: "right" }}>KATEGORISASI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={10} style={{ padding: "5rem 0", textAlign: "center" }}>
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2rem]">Loading guest data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredGuests.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ padding: "5rem 0", textAlign: "center" }}>
                            <div className="flex flex-col items-center gap-3">
                              <BookOpen className="h-10 w-10 text-slate-200" />
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2rem]">Belum ada tamu tercatat</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredGuests.map((guest) => {
                          const visitDateObj = new Date(guest.visitDate);
                          const day = String(visitDateObj.getDate()).padStart(2, '0');
                          const month = String(visitDateObj.getMonth() + 1).padStart(2, '0');
                          const timeStr = visitDateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace('.', ':');

                          return (
                            <tr key={guest.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} className="hover:bg-blue-50/10">
                              <td style={{ padding: "1rem 0.5rem 1rem 1.5rem" }}>
                                <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{`${day}-${month}`}</div>
                                <div style={{ fontSize: "9px", fontWeight: 800, color: "#94A3B8" }}>{timeStr}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem" }}>
                                <div style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{guest.clientName.toUpperCase()}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                                <div style={{ fontSize: "10px", fontWeight: 900, color: "#6366F1" }}>{guest.bd?.fullName || "—"}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem" }}>
                                <div style={{ fontSize: "10px", fontWeight: 850, color: "#1E293B" }}>{guest.phoneNo || "—"}</div>
                                <div style={{ fontSize: "8px", fontWeight: 700, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis" }}>{guest.email || "—"}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                                <div style={{ fontSize: "10px", fontWeight: 900, color: "#64748B" }}>{(guest.city || "—").toUpperCase()}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem" }}>
                                <div style={{ fontSize: "10px", fontWeight: 950, color: "#2563EB" }}>{(guest.productInterest || "—").toUpperCase()}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                                <div className="tabular-nums" style={{ fontSize: "11px", fontWeight: 950, color: "#1E293B" }}>{guest.moqPlan ? Number(guest.moqPlan).toLocaleString() : "—"}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                                <div style={{ fontSize: "9px", fontWeight: 900, color: "#1E293B" }}>{(guest.launchingPlan || "—").toUpperCase()}</div>
                              </td>
                              <td style={{ padding: "1rem 0.5rem" }}>
                                <div style={{ fontSize: "9px", fontWeight: 850, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(guest.targetMarket || "—").toUpperCase()}</div>
                              </td>
                              <td style={{ padding: "1rem 1.5rem 1rem 0.5rem", textAlign: "right" }}>
                                <span style={{
                                  background: guest.category === "PEMULA" ? "#F0FDF4" : "#F5F3FF",
                                  color: guest.category === "PEMULA" ? "#166534" : "#5B21B6",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: "8px",
                                  fontWeight: 950,
                                  border: `1px solid ${guest.category === "PEMULA" ? "#DCFCE7" : "#DDD6FE"}`
                                }}>
                                  {guest.category}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  <div style={{ padding: "1rem 2rem", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", textAlign: "right" }}>
                    <p style={{ fontSize: "9px", fontWeight: 950, color: "#64748B", margin: 0 }}>
                      TOTAL LOGGED DATA: <span style={{ color: "#111827" }}>{filteredGuests.length} RECORDS</span>
                    </p>
                  </div>
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

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                          <DnaInput
                            placeholder="client@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            icon={<User className="h-4 w-4" />}
                            className="font-black text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Product Interest</label>
                          <DnaInput
                            placeholder="e.g. Serum, Lotion"
                            value={formData.productInterest}
                            onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                            icon={<Building2 className="h-4 w-4" />}
                            className="font-black text-xs uppercase"
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

                  {/* Rencana Project */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-black uppercase tracking-tighter italic">Rencana <span className="text-blue-600">Proyek</span></h2>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">MOQ Rencana</label>
                        <DnaInput
                          type="number"
                          placeholder="e.g. 5000"
                          value={formData.moqPlan}
                          onChange={(e) => setFormData({ ...formData, moqPlan: e.target.value })}
                          className="font-black text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rencana Launching</label>
                        <DnaInput
                          placeholder="e.g. MEI 26"
                          value={formData.launchingPlan}
                          onChange={(e) => setFormData({ ...formData, launchingPlan: e.target.value })}
                          className="font-black text-xs uppercase"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Market</label>
                        <DnaInput
                          placeholder="e.g. E-COMMERCE, KLINIK"
                          value={formData.targetMarket}
                          onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                          className="font-black text-xs uppercase"
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
