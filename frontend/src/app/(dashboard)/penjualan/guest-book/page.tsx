"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Users,
  Building2,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Clock,
  Plus,
  Phone,
  Mail,
  Sparkles,
  Eye,
  CheckCircle2,
  MapPin
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface GuestBookEntry {
  id: string;
  no: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  company: string;
  purpose: string;
  meetingWith: string;
  busDev: string;
}

const FALLBACK_GUESTS: GuestBookEntry[] = [
  { id: "1", no: 1, date: "2026-09-09", time: "10:00", name: "Ibu Amanda Putri", phone: "0812-9988-7711", email: "amanda@glowshine.co.id", address: "Jakarta Selatan", company: "Glow & Shine Co", purpose: "Konsultasi Maklon Serum Retinol", meetingWith: "Rina BusDev", busDev: "Rina BusDev" },
  { id: "2", no: 2, date: "2026-09-08", time: "13:30", name: "dr. Hendra Pratama", phone: "0811-2233-4455", email: "dr.hendra@dermalife.com", address: "Surabaya", company: "Dermalife Aesthetic Clinic", purpose: "Review Sample Batch 2 Sunscreen", meetingWith: "Doni Senior BusDev", busDev: "Doni Senior BusDev" },
  { id: "3", no: 3, date: "2026-09-07", time: "15:00", name: "Bapak Surya Wijaya", phone: "0813-5566-7788", email: "surya@kharismaherbal.co.id", address: "Bandung", company: "Kharisma Herbal Nusantara", purpose: "Audit Fasilitas Pabrik CPKB", meetingWith: "Rina BusDev", busDev: "Rina BusDev" },
];

export default function BussDevGuestBookReportPage() {
  const toast = useDnaToast();
  const [busDevFilter, setBusDevFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form input
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    purpose: "Konsultasi Maklon OEM/ODM Kosmetik",
    meetingWith: "Rina BusDev",
    busDev: "Rina BusDev"
  });

  const filteredGuests = useMemo(() => {
    return FALLBACK_GUESTS.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.phone.includes(searchQuery);
      const matchBusDev = busDevFilter === "ALL" || g.busDev === busDevFilter;
      return matchSearch && matchBusDev;
    });
  }, [searchQuery, busDevFilter]);

  const queryClient = useQueryClient();
  const createGuestMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post("/guests", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Catatan kunjungan tamu baru berhasil disimpan ke Buku Tamu!");
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyimpan catatan tamu"),
  });

  const handleSave = () => {
    if (!formData.name || !formData.phone || !formData.company) {
      toast.error("Mohon lengkapi nama tamu, nomor telepon, dan nama perusahaan/brand!");
      return;
    }
    createGuestMutation.mutate(formData);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Buku Tamu & BusDev (Guest Book Report)"
        description="Rekapitulasi kunjungan calon klien maklon, konsultasi formulasi R&D kosmetik, kontak PIC, dan BusDev penanggung jawab."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-001 & SCR-175: Guest Interaction Log</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Buku Tamu
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Catat Tamu Baru
            </DnaButton>
          </div>
        }
      />

      {/* 4 KPI CARDS PERSIS SCR-175 */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Tamu Terdaftar"
          value="18 Tamu"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+28% vs bln lalu", isPositive: true }}
          subtext="Prospect Klien Baru Periode Ini"
          variant="info"
        />
        <DnaStatCard
          label="Rata-rata / Hari"
          value="3.4 Tamu / Hari"
          icon={<Clock className="w-5 h-5 text-purple-600" />}
          subtext="Aktivitas Konsultasi Maklon Harian"
          variant="purple"
        />
        <DnaStatCard
          label="Perusahaan / Brand Unik"
          value="14 Perusahaan"
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Brand Kosmetik Aktif", isPositive: true }}
          subtext="Diversifikasi Portofolio Klien"
          variant="success"
        />
        <DnaStatCard
          label="BusDev Teraktif"
          value="Rina BusDev"
          icon={<Sparkles className="w-5 h-5 text-amber-600" />}
          delta={{ value: "11 Pertemuan", isPositive: true }}
          subtext="Tamu Terbanyak Ditangani"
          variant="warning"
        />
      </DnaKpiGrid>

      {/* TABLE LIST FORMAT PERSIS SCR-175 (No, Tanggal, Waktu, Nama, Telepon, Email, Alamat, Perusahaan, Tujuan, Bertemu, BusDev) */}
      <DnaDataTableCard
        title="Daftar Buku Tamu Kunjungan Klien (SCR-175)"
        badge={<DnaBadge variant="default">{filteredGuests.length} Tamu</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={busDevFilter}
              onChange={(e) => setBusDevFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">BusDev: Semua BusDev</option>
              <option value="Rina BusDev">Rina BusDev</option>
              <option value="Doni Senior BusDev">Doni Senior BusDev</option>
            </select>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
              <span className="text-slate-400 font-semibold">s/d</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
              />
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / perusahaan / kontak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">No</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Waktu</th>
                <th className="px-3.5 py-3">Nama Tamu</th>
                <th className="px-3.5 py-3">Telepon</th>
                <th className="px-3.5 py-3">Email</th>
                <th className="px-3.5 py-3">Alamat / Kota</th>
                <th className="px-3.5 py-3">Perusahaan / Brand</th>
                <th className="px-3.5 py-3">Tujuan Kunjungan</th>
                <th className="px-3.5 py-3">Bertemu</th>
                <th className="px-3.5 py-3">BusDev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 text-slate-400 font-mono">{g.no}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{g.date}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600">{g.time}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{g.name}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 text-[11px]">{g.phone}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">{g.email}</td>
                  <td className="px-3.5 py-2.5 text-slate-700">{g.address}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-purple-700">{g.company}</td>
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">{g.purpose}</td>
                  <td className="px-3.5 py-2.5 text-slate-700">{g.meetingWith}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{g.busDev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL CATAT TAMU BARU */}
      <DnaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Tamu / Klien Kunjungan Baru"
        size="md"
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap Tamu *</label>
            <input
              type="text"
              placeholder="e.g. Ibu Amanda Putri"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nomor WhatsApp *</label>
              <input
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Klien</label>
              <input
                type="email"
                placeholder="amanda@brand.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nama Perusahaan / Brand *</label>
              <input
                type="text"
                placeholder="e.g. Glow & Shine Skincare"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Alamat / Asal Kota</label>
              <input
                type="text"
                placeholder="e.g. Jakarta Selatan"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tujuan Kunjungan</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">BusDev Pendamping</label>
              <select
                value={formData.busDev}
                onChange={(e) => setFormData({ ...formData, busDev: e.target.value, meetingWith: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="Rina BusDev">Rina BusDev</option>
                <option value="Doni Senior BusDev">Doni Senior BusDev</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleSave}>
              Simpan Buku Tamu
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
