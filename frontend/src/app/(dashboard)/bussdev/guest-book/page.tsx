"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Calendar,
  User,
  Building2,
  MessageSquare,
  ChevronLeft,
  Save,
  Loader2,
  Clock,
  Users,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalInput,
} from "@/components/operational";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { QuickAddBar } from "@/components/operational/QuickAddBar";
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

type UserOption = { id: string; fullName: string };

export default function GuestBookPage() {
  const [view, setView] = useState<"list" | "form">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [guests, setGuests] = useState<GuestLog[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { hasRole } = useAuth();
  const canQuickAdd = hasRole("SUPER_ADMIN", "BUSSDEV", "COMMERCIAL", "RND");

  const [formData, setFormData] = useState({
    clientName: "",
    phoneNo: "",
    instansi: "",
    purpose: "",
    category: "PEMULA",
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

  const filteredGuests = guests.filter(
    (g) =>
      g.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.instansi?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
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
        clientName: "",
        phoneNo: "",
        instansi: "",
        purpose: "",
        category: "PEMULA",
        bdId: "",
        city: "",
        email: "",
        productInterest: "",
        moqPlan: "",
        launchingPlan: "",
        targetMarket: "",
        visitDate: new Date().toISOString().slice(0, 16),
      });
    } catch {
      toast.error("Gagal menyimpan buku tamu");
    } finally {
      setSaving(false);
    }
  };

  const totalGuests = guests.length;
  const todayGuests = guests.filter((g) => {
    const today = new Date().toISOString().split("T")[0];
    return g.visitDate.startsWith(today);
  }).length;

  // R3 Gate 3 — sync categories from canonical enum (PEMULA/BRANDED)
  // to legacy "PEMULA/PROSPEK" badges. After backend fix, all new rows
  // are PEMULA/BRANDED only.

  return (
    <OperationalPageShell
      title="Buku Tamu"
      subtitle="Sistem manajemen buku tamu & pengunjung"
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            className="operational-button is-secondary"
            onClick={() => setView("list")}
          >
            <BookOpen className="h-4 w-4" />
            <span>Riwayat</span>
          </button>
          <button
            type="button"
            className="operational-button is-primary"
            onClick={() => setView("form")}
          >
            <Plus className="h-4 w-4" />
            <span>Tamu Baru</span>
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
            >
              <OperationalMetricGrid>
                <OperationalMetricCard label="Total Tamu" value={totalGuests} icon={<Users className="h-4 w-4" />} tone="blue" />
                <OperationalMetricCard label="Hari Ini" value={todayGuests} icon={<Calendar className="h-4 w-4" />} tone="green" />
                <OperationalMetricCard label="Staff BD" value={users.length} icon={<User className="h-4 w-4" />} tone="amber" />
                <OperationalMetricCard label="Pending Follow-up" value="—" icon={<Clock className="h-4 w-4" />} tone="red" />
              </OperationalMetricGrid>
              {canQuickAdd && (
                <div data-testid="bussdev-quick-add">
                  <QuickAddBar
                    fields={[
                      { name: "clientName", label: "Nama Tamu", required: true, placeholder: "cth: PT Sari" },
                      { name: "phoneNo", label: "No. Telepon", placeholder: "08xxx" },
                      { name: "city", label: "Kota", placeholder: "Bandung" },
                      { name: "productInterest", label: "Minat Produk", placeholder: "Serum" },
                      { name: "category", label: "Kategori", type: "select", sticky: true, defaultValue: "PEMULA", options: [
                        { value: "PEMULA", label: "Pemula (Prospek)" },
                        { value: "BRANDED", label: "Branded (Klien/Mitra)" },
                      ] },
                    ]}
                    onSubmit={async (values) => {
                      try {
                        await api.post("/guests", {
                          clientName: values.clientName,
                          phoneNo: values.phoneNo || null,
                          city: values.city || null,
                          productInterest: values.productInterest || null,
                          category: values.category || "PEMULA",
                          visitDate: new Date().toISOString(),
                        });
                        await fetchGuests();
                        return { ok: true };
                      } catch (e: any) {
                        return { ok: false, error: e?.response?.data?.message || "Gagal menyimpan" };
                      }
                    }}
                    submitLabel="Catat Tamu"
                  />
                </div>
              )}
              <OperationalPanel>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <OperationalInput
                    icon={<Search className="h-4 w-4" />}
                    placeholder="Cari nama / instansi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
                    {filteredGuests.length} record
                  </span>
                </div>
              </OperationalPanel>
              <OperationalPanel>
                {loading ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-slate-300">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-[12px]">Memuat data tamu...</p>
                  </div>
                ) : filteredGuests.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-slate-300">
                    <BookOpen className="h-10 w-10 opacity-30" />
                    <p className="text-[12px]">Belum ada tamu tercatat</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-left">
                      <colgroup>
                        <col className="w-[10%]" />
                        <col className="w-[12%]" />
                        <col className="w-[7%]" />
                        <col className="w-[12%]" />
                        <col className="w-[9%]" />
                        <col className="w-[12%]" />
                        <col className="w-[6%]" />
                        <col className="w-[8%]" />
                        <col className="w-[10%]" />
                        <col className="w-[14%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Tanggal</th>
                          <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Nama</th>
                          <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">BusDev</th>
                          <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Kontak</th>
                          <th className="px-3 py-2 pr-4 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Kota</th>
                          <th className="px-3 py-2 pl-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Produk</th>
                          <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">MOQ</th>
                          <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Launch</th>
                          <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Target Market</th>
                          <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Kategori</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGuests.map((guest) => {
                          const visitDateObj = new Date(guest.visitDate);
                          const day = String(visitDateObj.getDate()).padStart(2, "0");
                          const month = String(visitDateObj.getMonth() + 1).padStart(2, "0");
                          const timeStr = visitDateObj.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).replace(".", ":");
                          return (
                            <tr key={guest.id} className="border-b border-slate-100 transition hover:bg-blue-50/40">
                              <td className="px-3 py-2.5">
                                <div className="text-[12px] font-medium text-slate-900">{`${day}-${month}`}</div>
                                <div className="text-[10px] text-slate-500">{timeStr}</div>
                              </td>
                              <td className="px-3 py-2.5 text-[12px] font-medium text-slate-900 break-words">
                                {guest.clientName}
                              </td>
                              <td className="px-3 py-2.5 text-center text-[11px] text-indigo-600 break-words">
                                {guest.bd?.fullName ?? "—"}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="text-[11px] text-slate-900 break-words">{guest.phoneNo ?? "—"}</div>
                                <div className="truncate text-[10px] text-slate-500">{guest.email ?? "—"}</div>
                              </td>
                              <td className="px-3 py-2.5 pr-4 text-center text-[11px] text-slate-700 break-words">
                                {(guest.city ?? "—").toUpperCase()}
                              </td>
                              <td className="px-3 py-2.5 pl-4 text-[11px] font-medium text-blue-600 break-words">
                                {(guest.productInterest ?? "—").toUpperCase()}
                              </td>
                              <td className="px-3 py-2.5 text-center text-[12px] font-medium tabular-nums text-slate-900">
                                {guest.moqPlan ? Number(guest.moqPlan).toLocaleString() : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-center text-[10px] text-slate-700 break-words">
                                {(guest.launchingPlan ?? "—").toUpperCase()}
                              </td>
                              <td className="px-3 py-2.5 truncate text-[10px] text-slate-600">
                                {(guest.targetMarket ?? "—").toUpperCase()}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span
                                  className={cn(
                                    "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                                    guest.category === "BRANDED"
                                      ? "border-violet-100 bg-violet-50 text-violet-700"
                                      : "border-emerald-100 bg-emerald-50 text-emerald-700",
                                  )}
                                >
                                  {guest.category}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-2 text-right text-[10px] text-slate-600">
                      TOTAL DATA TERCATAT: <span className="font-medium text-slate-900">{filteredGuests.length}</span>
                    </div>
                  </div>
                )}
              </OperationalPanel>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 pb-12 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <OperationalPanel>
                    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <button
                        type="button"
                        onClick={() => setView("list")}
                        className="inline-flex items-center gap-2 rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="text-[11px] font-medium">Batal</span>
                      </button>
                      <div className="ml-auto text-right">
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400">Pendaftaran Tamu</span>
                        <span className="text-[12px] font-medium text-blue-600">Protokol 01-GB</span>
                      </div>
                      <button
                        type="button"
                        className="operational-button is-primary"
                        onClick={handleSubmit}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>{saving ? "Menyimpan..." : "Simpan Tamu"}</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <h3 className="text-[14px] font-semibold text-slate-900">Tanggal & Waktu</h3>
                        </div>
                        <div className="operational-field">
                          <span>Waktu Kunjungan</span>
                          <input
                            type="datetime-local"
                            value={formData.visitDate}
                            onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <h3 className="text-[14px] font-semibold text-slate-900">Data Tamu</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="operational-field">
                            <span>Nama Tamu *</span>
                            <input
                              placeholder="Nama lengkap tamu"
                              value={formData.clientName}
                              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                            />
                          </div>
                          <div className="operational-field">
                            <span>No. Telepon</span>
                            <input
                              placeholder="08xxxxxxxxxx"
                              value={formData.phoneNo}
                              onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                            />
                          </div>
                          <div className="operational-field">
                            <span>Asal Instansi</span>
                            <input
                              placeholder="PT / CV / Instansi"
                              value={formData.instansi}
                              onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                            />
                          </div>
                          <div className="operational-field">
                            <span>Kota Asal</span>
                            <input
                              placeholder="Kota / Kabupaten"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                          </div>
                          <div className="operational-field">
                            <span>Email</span>
                            <input
                              placeholder="client@email.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                          </div>
                          <div className="operational-field">
                            <span>Minat Produk</span>
                            <input
                              placeholder="Contoh: Serum, Lotion"
                              value={formData.productInterest}
                              onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="operational-field">
                          <span>Tujuan / Keperluan</span>
                          <textarea
                            placeholder="Tujuan kunjungan tamu..."
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            rows={3}
                            className="operational-textarea"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <h3 className="text-[14px] font-semibold text-slate-900">Rencana Proyek</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="operational-field">
                            <span>MOQ Rencana</span>
                            <input
                              type="number"
                              placeholder="Contoh: 5000"
                              value={formData.moqPlan}
                              onChange={(e) => setFormData({ ...formData, moqPlan: e.target.value })}
                            />
                          </div>
                          <div className="operational-field">
                            <span>Rencana Launching</span>
                            <input
                              placeholder="Contoh: MEI 26"
                              value={formData.launchingPlan}
                              onChange={(e) => setFormData({ ...formData, launchingPlan: e.target.value })}
                            />
                          </div>
                          <div className="operational-field">
                            <span>Target Market</span>
                            <input
                              placeholder="Contoh: E-COMMERCE, KLINIK"
                              value={formData.targetMarket}
                              onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-blue-600" />
                          <h3 className="text-[14px] font-semibold text-slate-900">Kategori & Staff</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="operational-field">
                            <span>Kategori Tamu</span>
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                              <option value="PEMULA">Pemula (Prospek)</option>
                              <option value="BRANDED">Branded (Klien/Mitra)</option>
                            </select>
                          </div>
                          <div className="operational-field">
                            <span>Bertemu Dengan</span>
                            <select
                              value={formData.bdId}
                              onChange={(e) => setFormData({ ...formData, bdId: e.target.value })}
                            >
                              <option value="">— PILIH STAFF —</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.fullName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </OperationalPanel>
                </div>

                <div className="lg:col-span-4">
                  <div className="sticky top-10 space-y-6">
                    <OperationalPanel>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600">
                        Protokol Tamu
                      </p>
                      <h2 className="mt-2 text-[18px] font-semibold text-slate-900">Manajemen Pengunjung</h2>
                      <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-[12px] text-slate-700">
                        <li className="flex items-start gap-2">
                          <User className="mt-0.5 h-3.5 w-3.5 text-blue-500" />
                          <span>Identifikasi Tamu — lengkapi data kontak</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
                          <span>Tujuan Kunjungan — catat keperluan</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Users className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
                          <span>Staff BD — tugaskan yang melayani</span>
                        </li>
                      </ul>
                    </OperationalPanel>
                    <div className="rounded-md border-2 border-dashed border-slate-200 bg-white/60 p-4 text-[12px] text-slate-500">
                      &quot;Setiap kunjungan harus tercatat. Follow-up wajib dalam 1×24 jam setelah kunjungan.&quot;
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
