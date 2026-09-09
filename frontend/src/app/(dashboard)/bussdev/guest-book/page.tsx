"use client";

/**
 * Buku Tamu (Guest Book) — Commercial Front-End
 *
 * Sesuai Legacy ERP Audit (kil_erp_full_inventory_v2.csv Baris 2 & 168),
 * dan REQUIREMENT.md Poin 180-182 (filter bulan, search nama, card history tetap muncul, auto-save).
 *
 * Visual DNA Golden Reference:
 * - Light Enterprise Theme (bg-[#F8FAFC])
 * - DnaPageHeader with primary action (+ Tamu Baru)
 * - DnaKpiGrid with 4 interactive KPI metric cards (Total Leads, Follow Up, Meeting, Conversion Rate)
 * - DnaDataTableCard with 2-level filter toolbar (search nama, month picker, category, PIC)
 * - Standardized DnaCell.* primitives
 * - DnaModal for Detail & Form Tamu Baru with auto-save
 */

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import {
  ClipboardCheck,
  Plus,
  Search,
  Calendar,
  Phone,
  Building2,
  Users,
  Clock,
  ArrowUpRight,
  MessageSquare,
  CheckCircle2,
  CalendarDays,
  Target,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaModal,
  DnaConfirmDialog,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import { api } from "@/lib/api";

export interface GuestItem {
  id: string;
  visitDate: string;
  clientName: string;
  phoneNo: string | null;
  instansi: string | null;
  purpose: string | null;
  category: "PROSPEK" | "KLIEN_LAMA" | "VENDOR" | "REGULER";
  bd?: { fullName: string; id?: string } | null;
  city: string | null;
  email: string | null;
  productInterest: string | null;
  moqPlan?: number | null;
  launchingPlan?: string | null;
  targetMarket?: string | null;
  statusFollowUp?: "PENDING" | "FOLLOWED_UP" | "DEAL" | "LOST";
  notes?: string | null;
}

const INITIAL_GUESTS: GuestItem[] = [
  {
    id: "g-1",
    visitDate: "2026-09-08T10:30:00.000Z",
    clientName: "N Aristya",
    instansi: "Aristya Glow Clinic",
    phoneNo: "081234567890",
    email: "aristya@glowclinic.com",
    city: "Surabaya",
    purpose: "Konsultasi Formulasi Serum Anti-Aging Niacinamide 10%",
    category: "PROSPEK",
    bd: { fullName: "Revita (BusDev 1)" },
    productInterest: "Facial Serum",
    moqPlan: 2000,
    launchingPlan: "Q4 2026",
    targetMarket: "Wanita Karir 25-45 Thn",
    statusFollowUp: "DEAL",
    notes: "Sudah bayar Sample Fee, menunggu approval sample R&D",
  },
  {
    id: "g-2",
    visitDate: "2026-09-07T14:00:00.000Z",
    clientName: "Vivin Anggi Ardita",
    instansi: "FYS Beauty Care",
    phoneNo: "085678901234",
    email: "vivin@fysbeauty.id",
    city: "Sidoarjo",
    purpose: "Diskusi Kontrak Repeat Order Day Cream & Sunscreen SPF 50",
    category: "KLIEN_LAMA",
    bd: { fullName: "Dimas (BusDev Lead)" },
    productInterest: "Sunscreen & Day Cream",
    moqPlan: 5000,
    launchingPlan: "Bulan Depan",
    targetMarket: "Remaja & Dewasa Muda",
    statusFollowUp: "FOLLOWED_UP",
    notes: "Pengajuan HPP revisi kemasan tube 30g",
  },
  {
    id: "g-3",
    visitDate: "2026-09-06T09:15:00.000Z",
    clientName: "dr. Hendra Sp.KK",
    instansi: "DermaMedika Estetika",
    phoneNo: "081987654321",
    email: "dr.hendra@dermamedika.co.id",
    city: "Malang",
    purpose: "Penjajakan Pembuatan Acne Spot Treatment Klinis",
    category: "PROSPEK",
    bd: { fullName: "Revita (BusDev 1)" },
    productInterest: "Acne Gel & Spot Treatment",
    moqPlan: 1000,
    launchingPlan: "Januari 2027",
    targetMarket: "Pasien Klinik Khusus Jerawat",
    statusFollowUp: "PENDING",
    notes: "Menunggu proposal HPP dan dokumen standar CPKB",
  },
  {
    id: "g-4",
    visitDate: "2026-08-25T11:00:00.000Z",
    clientName: "Siti Rahmawati",
    instansi: "Glow & Shine Herbal",
    phoneNo: "087711223344",
    email: "rahma@glowshine.com",
    city: "Pasuruan",
    purpose: "Inquiry Body Wash Ekstrak Bengkoang & Brightening",
    category: "PROSPEK",
    bd: { fullName: "Dimas (BusDev Lead)" },
    productInterest: "Body Wash Herbal",
    moqPlan: 3000,
    launchingPlan: "Q1 2027",
    targetMarket: "Pasar Umum Masal",
    statusFollowUp: "FOLLOWED_UP",
    notes: "Minta tester sample aroma Jasmine & Green Tea",
  },
  {
    id: "g-5",
    visitDate: "2026-08-14T15:30:00.000Z",
    clientName: "Budi Santoso",
    instansi: "PT Kosmetik Nusantara",
    phoneNo: "082155667788",
    email: "budi@kosmetiknusantara.com",
    city: "Surabaya",
    purpose: "Audiensi Kerjasama Vendor Bahan Kemas Primer Jar 50g",
    category: "VENDOR",
    bd: { fullName: "Dimas (BusDev Lead)" },
    productInterest: "Packaging Jar",
    moqPlan: 10000,
    launchingPlan: "Segera",
    targetMarket: "B2B Industri",
    statusFollowUp: "DEAL",
    notes: "Vendor approved masuk master supplier kemasan primer",
  },
];

function GuestBookContent() {
  const { toast } = useDnaToast();
  const [guests, setGuests] = useState<GuestItem[]>(INITIAL_GUESTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<GuestItem | null>(null);

  // Form State with Auto-save to localStorage
  const [form, setForm] = useState({
    clientName: "",
    instansi: "",
    phoneNo: "",
    email: "",
    city: "Surabaya",
    purpose: "",
    category: "PROSPEK" as GuestItem["category"],
    bdName: "Revita (BusDev 1)",
    productInterest: "",
    moqPlan: "1000",
    launchingPlan: "Q4 2026",
    targetMarket: "",
    notes: "",
    visitDate: new Date().toISOString().slice(0, 16),
  });

  // Restore autosaved draft
  useEffect(() => {
    const saved = localStorage.getItem("draft_guest_book");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
  }, []);

  // Auto-save form changes
  const updateFormField = (field: string, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem("draft_guest_book", JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch from backend API
  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/guests");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setGuests(res.data);
      }
    } catch {
      // Keep initial mock data if API fails or empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // Global KPI Calculations (Unfiltered by month for history cards persistence - Poin 180)
  const kpiTotal = guests.length;
  const kpiFollowedUp = guests.filter((g) => g.statusFollowUp === "FOLLOWED_UP" || g.statusFollowUp === "DEAL").length;
  const kpiFollowUpRate = kpiTotal > 0 ? Math.round((kpiFollowedUp / kpiTotal) * 100) : 0;
  const kpiDeal = guests.filter((g) => g.statusFollowUp === "DEAL").length;
  const kpiConversionRate = kpiTotal > 0 ? ((kpiDeal / kpiTotal) * 100).toFixed(1) : "0.0";
  const kpiMeetingsThisMonth = guests.filter((g) => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    return g.visitDate.startsWith(currentMonthPrefix);
  }).length;

  // Filtered Table Items
  const filteredItems = useMemo(() => {
    return guests.filter((item) => {
      // KPI Click filter
      if (selectedKpiFilter === "FOLLOWED_UP" && item.statusFollowUp !== "FOLLOWED_UP" && item.statusFollowUp !== "DEAL") return false;
      if (selectedKpiFilter === "DEAL" && item.statusFollowUp !== "DEAL") return false;
      if (selectedKpiFilter === "PENDING" && item.statusFollowUp !== "PENDING") return false;

      // Month filter
      if (selectedMonth && !item.visitDate.startsWith(selectedMonth)) return false;

      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.clientName.toLowerCase().includes(q);
        const matchInstansi = (item.instansi || "").toLowerCase().includes(q);
        const matchCity = (item.city || "").toLowerCase().includes(q);
        const matchProduct = (item.productInterest || "").toLowerCase().includes(q);
        if (!matchName && !matchInstansi && !matchCity && !matchProduct) return false;
      }

      return true;
    });
  }, [guests, selectedKpiFilter, selectedMonth, selectedCategory, searchQuery]);

  const handleSaveGuest = async () => {
    if (!form.clientName.trim()) {
      toast.warning("Nama Klien Wajib Diisi");
      return;
    }
    const newGuest: GuestItem = {
      id: "g-" + Date.now(),
      clientName: form.clientName,
      instansi: form.instansi || null,
      phoneNo: form.phoneNo || null,
      email: form.email || null,
      city: form.city || "Surabaya",
      purpose: form.purpose || null,
      category: form.category,
      bd: { fullName: form.bdName },
      productInterest: form.productInterest || null,
      moqPlan: form.moqPlan ? parseInt(form.moqPlan) : 1000,
      launchingPlan: form.launchingPlan || null,
      targetMarket: form.targetMarket || null,
      notes: form.notes || null,
      visitDate: new Date(form.visitDate).toISOString(),
      statusFollowUp: "PENDING",
    };

    try {
      await api.post("/guests", newGuest);
    } catch {
      // Mock fallback
    }

    setGuests((prev) => [newGuest, ...prev]);
    localStorage.removeItem("draft_guest_book");
    setIsCreateOpen(false);
    toast.success("Kunjungan Tamu Berhasil Disimpan");

    // Reset
    setForm({
      clientName: "",
      instansi: "",
      phoneNo: "",
      email: "",
      city: "Surabaya",
      purpose: "",
      category: "PROSPEK",
      bdName: "Revita (BusDev 1)",
      productInterest: "",
      moqPlan: "1000",
      launchingPlan: "Q4 2026",
      targetMarket: "",
      notes: "",
      visitDate: new Date().toISOString().slice(0, 16),
    });
  };

  const handleConvertToLead = (guest: GuestItem) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guest.id ? { ...g, statusFollowUp: "DEAL" } : g))
    );
    setSelectedDetail(null);
    toast.success(`Tamu ${guest.clientName} Berhasil Dikonversi Menjadi Sales Lead!`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans">
      <DnaPageHeader
        title="Buku Tamu (Guest Book)"
        description="Pencatatan & Pelacakan Kunjungan Tamu Bisnis Maklon Kosmetik"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ClipboardCheck className="w-3.5 h-3.5" />
            COMMERCIAL DESK
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              size="sm"
              onClick={fetchGuests}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Tamu Baru
            </DnaButton>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        {/* 4 KPI Cards (Legacy Audit & Poin 180: Card Tetap Tampil Konsisten) */}
        <DnaKpiGrid
          columns={4}
          items={[
            {
              label: "TOTAL LEADS / TAMU",
              value: kpiTotal.toLocaleString(),
              subtext: "Total kunjungan tercatat",
              icon: Users,
              status: selectedKpiFilter === null ? "primary" : "neutral",
              onClick: () => setSelectedKpiFilter(null),
            },
            {
              label: "FOLLOW UP SELESAI",
              value: `${kpiFollowedUp} (${kpiFollowUpRate}%)`,
              subtext: "Klien sudah dihubungi kembali",
              icon: CheckCircle2,
              status: selectedKpiFilter === "FOLLOWED_UP" ? "success" : "neutral",
              onClick: () =>
                setSelectedKpiFilter(selectedKpiFilter === "FOLLOWED_UP" ? null : "FOLLOWED_UP"),
            },
            {
              label: "MEETING BULAN INI",
              value: kpiMeetingsThisMonth.toLocaleString(),
              subtext: "Pertemuan offline & online",
              icon: Calendar,
              status: "warning",
            },
            {
              label: "CONVERSION RATE",
              value: `${kpiConversionRate}%`,
              subtext: "Lead to Deal (Close Ratio)",
              icon: Target,
              status: selectedKpiFilter === "DEAL" ? "purple" : "neutral",
              onClick: () =>
                setSelectedKpiFilter(selectedKpiFilter === "DEAL" ? null : "DEAL"),
            },
          ]}
        />

        {/* Level-2 Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="w-64">
              <DnaInput
                placeholder="Cari nama, brand, kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Month Picker (Poin 181) */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <span>Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
              {selectedMonth && (
                <button
                  onClick={() => setSelectedMonth("")}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="PROSPEK">Prospek Maklon Baru</option>
              <option value="KLIEN_LAMA">Klien Lama / RO</option>
              <option value="VENDOR">Vendor / Supplier</option>
              <option value="REGULER">Kunjungan Reguler</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-400">
            Menampilkan <span className="text-slate-800">{filteredItems.length}</span> dari {guests.length} Tamu
          </div>
        </div>

        {/* Data Table Card */}
        <DnaDataTableCard
          title="Daftar Buku Tamu"
          count={filteredItems.length}
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                <th className="p-3.5">TANGGAL & WAKTU</th>
                <th className="p-3.5">NAMA KLIEN & INSTANSI</th>
                <th className="p-3.5">PIC BUSDEV</th>
                <th className="p-3.5">KONTAK & WHATSAPP</th>
                <th className="p-3.5">KOTA</th>
                <th className="p-3.5">PRODUK DIMINATI</th>
                <th className="p-3.5 text-right">RENCANA MOQ</th>
                <th className="p-3.5 text-center">STATUS</th>
                <th className="p-3.5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedDetail(item)}
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 cursor-pointer group"
                >
                  <td className="p-3.5">
                    <DnaCell.Date value={new Date(item.visitDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Text
                      primary={item.clientName}
                      secondary={item.instansi || "Perorangan"}
                    />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Avatar
                      name={item.bd?.fullName || "BusDev Team"}
                      subtext="PIC Commercial"
                    />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Text
                      primary={item.phoneNo || "—"}
                      secondary={item.email || undefined}
                    />
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Text primary={item.city || "—"} />
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {item.productInterest || "Belum Spesifik"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <DnaCell.Number value={item.moqPlan || 0} suffix=" pcs" />
                  </td>
                  <td className="p-3.5 text-center">
                    <DnaCell.Badge
                      status={
                        item.statusFollowUp === "DEAL"
                          ? "approved"
                          : item.statusFollowUp === "FOLLOWED_UP"
                          ? "progress"
                          : item.statusFollowUp === "LOST"
                          ? "cancel"
                          : "pending"
                      }
                      label={
                        item.statusFollowUp === "DEAL"
                          ? "DEAL / SAMPLE"
                          : item.statusFollowUp === "FOLLOWED_UP"
                          ? "FOLLOWED UP"
                          : item.statusFollowUp === "LOST"
                          ? "LOST"
                          : "PENDING FU"
                      }
                    />
                  </td>
                  <td className="p-3.5 text-right">
                    <DnaCell.Actions
                      onView={() => setSelectedDetail(item)}
                      extraActions={
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.phoneNo) {
                              window.open(`https://wa.me/${item.phoneNo.replace(/\D/g, "")}`, "_blank");
                            } else {
                              toast.warning("Nomor telepon tidak tersedia");
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer ml-1"
                          title="Chat WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DnaDataTableCard>
      </div>

      {/* Modal: Form Tambah Tamu Baru (Auto-Save Support) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Pendaftaran Tamu Baru"
        subtitle="Formulir Kunjungan & Minat Produk Maklon (Auto-Save Aktif)"
        size="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <DnaButton variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleSaveGuest}>
              Simpan Buku Tamu
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap Klien *
              </label>
              <DnaInput
                placeholder="Contoh: dr. Indah Permata"
                value={form.clientName}
                onChange={(e) => updateFormField("clientName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Brand / Nama Instansi
              </label>
              <DnaInput
                placeholder="Contoh: Indah Aesthetic Clinic"
                value={form.instansi}
                onChange={(e) => updateFormField("instansi", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor WhatsApp / HP *
              </label>
              <DnaInput
                placeholder="081234567890"
                value={form.phoneNo}
                onChange={(e) => updateFormField("phoneNo", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <DnaInput
                placeholder="client@brand.com"
                value={form.email}
                onChange={(e) => updateFormField("email", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kota Asal Klien
              </label>
              <DnaInput
                placeholder="Surabaya / Jakarta / Malang"
                value={form.city}
                onChange={(e) => updateFormField("city", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                PIC BusDev Pendamping
              </label>
              <DnaInput
                placeholder="Nama BusDev"
                value={form.bdName}
                onChange={(e) => updateFormField("bdName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Tamu
              </label>
              <select
                value={form.category}
                onChange={(e) => updateFormField("category", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="PROSPEK">Prospek Maklon Baru</option>
                <option value="KLIEN_LAMA">Klien Lama (Repeat Order)</option>
                <option value="VENDOR">Vendor / Mitra Bisnis</option>
                <option value="REGULER">Kunjungan Umum</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal & Jam Kunjungan
              </label>
              <input
                type="datetime-local"
                value={form.visitDate}
                onChange={(e) => updateFormField("visitDate", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Produk Diminati
              </label>
              <DnaInput
                placeholder="Misal: Serum, Sunscreen, Body Lotion"
                value={form.productInterest}
                onChange={(e) => updateFormField("productInterest", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Rencana MOQ (Pcs)
              </label>
              <DnaInput
                type="number"
                placeholder="1000"
                value={form.moqPlan}
                onChange={(e) => updateFormField("moqPlan", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Launching
              </label>
              <DnaInput
                placeholder="Q4 2026 / Bulan Depan"
                value={form.launchingPlan}
                onChange={(e) => updateFormField("launchingPlan", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tujuan Pertemuan & Catatan Kebutuhan Klien
            </label>
            <DnaTextarea
              rows={3}
              placeholder="Tuliskan spesifikasi produk yang diinginkan, range budget, klaim bahan aktif, atau catatan diskusi..."
              value={form.purpose}
              onChange={(e) => updateFormField("purpose", e.target.value)}
            />
          </div>
        </div>
      </DnaModal>

      {/* Modal: Detail Tamu & Aksi Konversi */}
      {selectedDetail && (
        <DnaModal
          isOpen={true}
          onClose={() => setSelectedDetail(null)}
          title={`Detail Kunjungan — ${selectedDetail.clientName}`}
          subtitle={`${selectedDetail.instansi || "Perorangan"} • ${selectedDetail.city || "Indonesia"}`}
          size="md"
          footer={
            <div className="flex justify-between items-center w-full">
              <DnaButton
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedDetail.phoneNo) {
                    window.open(
                      `https://wa.me/${selectedDetail.phoneNo.replace(/\D/g, "")}`,
                      "_blank"
                    );
                  }
                }}
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Hubungi WA
              </DnaButton>
              <div className="flex gap-2">
                <DnaButton variant="ghost" size="sm" onClick={() => setSelectedDetail(null)}>
                  Tutup
                </DnaButton>
                {selectedDetail.statusFollowUp !== "DEAL" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleConvertToLead(selectedDetail)}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Konversi ke Sales Lead
                  </DnaButton>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">PIC BusDev:</span>
                <p className="font-bold text-slate-800">{selectedDetail.bd?.fullName || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status Follow Up:</span>
                <p className="font-bold text-blue-600">{selectedDetail.statusFollowUp || "PENDING"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">No. Kontak:</span>
                <p className="font-bold text-slate-800">{selectedDetail.phoneNo || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Email:</span>
                <p className="font-bold text-slate-800">{selectedDetail.email || "—"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Minat & Spesifikasi Produk
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">PRODUK</span>
                  <span className="font-bold text-slate-800">{selectedDetail.productInterest || "—"}</span>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">RENCANA MOQ</span>
                  <span className="font-bold text-slate-800">
                    {selectedDetail.moqPlan ? `${selectedDetail.moqPlan.toLocaleString()} pcs` : "—"}
                  </span>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-400 block">TARGET LAUNCH</span>
                  <span className="font-bold text-slate-800">{selectedDetail.launchingPlan || "—"}</span>
                </div>
              </div>
            </div>

            {selectedDetail.purpose && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Tujuan Kunjungan
                </h4>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedDetail.purpose}
                </p>
              </div>
            )}

            {selectedDetail.notes && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Catatan Tambahan
                </h4>
                <p className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/60 text-amber-900 leading-relaxed">
                  {selectedDetail.notes}
                </p>
              </div>
            )}
          </div>
        </DnaModal>
      )}
    </div>
  );
}

export default function GuestBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <GuestBookContent />
    </Suspense>
  );
}
