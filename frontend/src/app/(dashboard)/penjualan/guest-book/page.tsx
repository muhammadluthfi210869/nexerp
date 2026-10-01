"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Building2,
  Calendar,
  Clock,
  Printer,
  Plus,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaDetailDrawer,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { api } from "@/lib/api";

interface GuestBookEntry {
  id: string;
  no: number;
  dateTime: string;
  clientName: string;
  meetingPic: string;
  contact: string;
  city: string;
  productInterest: string;
  moq: number;
  targetMarket: string;
  category: "BRANDED" | "PEMULA" | "KLINIK" | "DISTRIBUTOR";
}

function GuestBookContent() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();

  const [guests, setGuests] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestBookEntry | null>(null);

  const DRAFT_STORAGE_KEY = "nexerp_guest_book_draft_page";

  // Form input with auto-save draft
  const [formData, setFormData] = useState(() => {
    const initial = {
      name: "",
      phone: "",
      city: "Jakarta Selatan",
      company: "",
      productInterest: "Serum Retinol 30ml",
      moq: "1000",
      targetMarket: "Wanita Dewasa",
      category: "BRANDED" as GuestBookEntry["category"],
      meetingWith: "Apt. Rina Lestari",
      busDev: "Irma Safarina",
    };
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) return { ...initial, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return initial;
  });

  // Sync draft to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // ignore quota errors
      }
    }
  }, [formData]);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any[]>("/guests");
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped: GuestBookEntry[] = data.map((item, idx) => ({
        id: item.id || `gb-${idx}`,
        no: idx + 1,
        dateTime: item.visitDate
          ? new Date(item.visitDate).toISOString().slice(0, 16).replace("T", " ")
          : new Date(item.createdAt || Date.now()).toISOString().slice(0, 16).replace("T", " "),
        clientName: item.instansi ? `${item.clientName} (${item.instansi})` : item.clientName,
        meetingPic: item.bd?.fullName || item.meetingWith || "BusDev Maklon",
        contact: item.phoneNo || item.phone || "—",
        city: item.city || "Jakarta",
        productInterest: item.productInterest || "Produk Maklon",
        moq: item.moqPlan || item.moq || 1000,
        targetMarket: item.targetMarket || "Umum",
        category: (item.category as any) || "BRANDED",
      }));
      setGuests(mapped);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat buku tamu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.dateTime) {
        const yyyymm = g.dateTime.slice(0, 7);
        if (yyyymm) set.add(yyyymm);
      }
    });
    return Array.from(set).sort().reverse();
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.productInterest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.contact.includes(searchQuery);
      const matchCategory = categoryFilter === "ALL" || g.category === categoryFilter;
      const matchMonth = monthFilter === "ALL" || (g.dateTime && g.dateTime.startsWith(monthFilter));
      return matchSearch && matchCategory && matchMonth;
    });
  }, [guests, searchQuery, categoryFilter, monthFilter]);

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.company) {
      toast.error("Mohon lengkapi nama klien, kontak WhatsApp, dan nama perusahaan/brand!");
      return;
    }

    setSaving(true);
    try {
      await api.post("/guests", {
        clientName: formData.name,
        instansi: formData.company,
        productInterest: formData.productInterest || undefined,
        moqPlan: parseInt(formData.moq, 10) || 1000,
        category: formData.category,
        phoneNo: formData.phone,
        city: formData.city,
        targetMarket: formData.targetMarket || undefined,
        visitDate: new Date().toISOString(),
      });

      toast.success("Catatan kunjungan tamu berhasil disimpan!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        phone: "",
        city: "Jakarta",
        company: "",
        productInterest: "",
        moq: "1000",
        targetMarket: "",
        category: "BRANDED",
        meetingWith: "Apt. Rina Lestari",
        busDev: "Irma Safarina",
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      await fetchGuests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gagal menyimpan buku tamu");
    } finally {
      setSaving(false);
    }
  };

  const countAll = guests.length;
  const countBranded = guests.filter((g) => g.category === "BRANDED").length;
  const countKlinik = guests.filter((g) => g.category === "KLINIK").length;
  const countPemula = guests.filter((g) => g.category === "PEMULA").length;

  return (
    <DnaPageContainer>
      {/* Top Header with Unified Tabs */}
      <DnaPageHeader
        title="BUKU TAMU KUNJUNGAN KLIEN (GUEST BOOK)"
        description="Pencatatan dan monitoring kehadiran calon klien maklon kosmetik, PIC pendamping, estimasi target MOQ, dan segmentasi kategori prospek bisnis."
        tabs={[
          { key: "ALL", label: "Semua Kategori", count: countAll },
          { key: "BRANDED", label: "Branded", count: countBranded },
          { key: "KLINIK", label: "Klinik Estetika", count: countKlinik },
          { key: "PEMULA", label: "Start-up / Pemula", count: countPemula },
        ]}
        activeTab={categoryFilter}
        onTabChange={setCategoryFilter}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Buku Tamu
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Buku Tamu
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Tamu Terdaftar",
            value: `${guests.length} Tamu`,
            subtitle: "Calon mitra maklon tercatat",
            trend: "Buku Tamu",
            icon: Users,
            variant: "blue",
          },
          {
            label: "Klien Brand Established",
            value: `${countBranded} Klien`,
            subtitle: "Segmen brand berkembang",
            trend: "High Volume",
            icon: Building2,
            variant: "purple",
          },
          {
            label: "Klinik Kecantikan",
            value: `${countKlinik} Klinik`,
            subtitle: "Dokter & aesthetic clinic",
            trend: "Klinis Medis",
            icon: Sparkles,
            variant: "emerald",
          },
          {
            label: "Klien Pemula (Start-up)",
            value: `${countPemula} Mitra`,
            subtitle: "Edukasi formula & MOQ 1000",
            trend: "Inkubasi",
            icon: Clock,
            variant: "amber",
          },
        ]}
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <DnaButton size="sm" variant="outline" onClick={fetchGuests} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </DnaButton>
        </div>
      )}

      {/* Main Table Card */}
      <DnaDataTableCard
        count={filteredGuests.length}
        totalItems={guests.length}
        toolbarProps={{
          searchPlaceholder: "Cari nama tamu, kontak WhatsApp, kota, atau produk...",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
        }}
      >
        <div className="w-full">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Memuat data buku tamu...
            </div>
          ) : (
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <DnaTh className="py-3 px-3 w-[18%]">Waktu & Kota</DnaTh>
                  <DnaTh className="py-3 px-3 w-[22%]">Klien & Kontak</DnaTh>
                  <DnaTh className="py-3 px-3 w-[20%]">Meeting & Kategori</DnaTh>
                  <DnaTh className="py-3 px-3 w-[20%]">Minat Produk & MOQ</DnaTh>
                  <DnaTh className="py-3 px-3 w-[10%] text-center">Kategori</DnaTh>
                  <DnaTh className="py-3 px-3 w-[10%] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredGuests.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="text-center py-12 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                      <p className="font-semibold text-slate-600">Tidak ada data tamu kunjungan</p>
                      <p className="text-xs text-slate-400">Belum ada catatan tamu atau coba sesuaikan filter pencarian.</p>
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredGuests.map((g) => (
                    <DnaTableRow key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <DnaTd className="py-3 px-3">
                        <p className="tabular-nums font-semibold text-slate-700">{g.dateTime}</p>
                        <p className="text-[11px] text-slate-400 truncate">{g.city}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3">
                        <p className="font-semibold text-slate-900 truncate">{g.clientName}</p>
                        <p className="tabular-nums text-[11px] text-blue-600 truncate">{g.contact}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3">
                        <p className="text-slate-800 font-medium truncate">{g.meetingPic}</p>
                        <p className="text-[10px] text-slate-400 truncate">{g.targetMarket}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3">
                        <p className="font-semibold text-slate-800 truncate">{g.productInterest}</p>
                        <p className="tabular-nums text-[10px] text-slate-500">MOQ: {g.moq.toLocaleString("id-ID")} pcs</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-center">
                        <DnaBadge
                          variant={
                            g.category === "BRANDED"
                              ? "purple"
                              : g.category === "KLINIK"
                              ? "emerald"
                              : g.category === "PEMULA"
                              ? "amber"
                              : "blue"
                          }
                        >
                          {g.category}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGuest(g)}
                          >
                            Detail
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          )}
        </div>
      </DnaDataTableCard>

      {/* Drawer Detail Kunjungan */}
      <DnaDetailDrawer
        isOpen={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        title={selectedGuest?.clientName || "Detail Tamu"}
        subtitle={selectedGuest ? `${selectedGuest.city} • ${selectedGuest.dateTime}` : undefined}
        badge={
          selectedGuest ? (
            <DnaBadge
              variant={
                selectedGuest.category === "BRANDED"
                  ? "purple"
                  : selectedGuest.category === "KLINIK"
                  ? "emerald"
                  : selectedGuest.category === "PEMULA"
                  ? "amber"
                  : "blue"
              }
            >
              {selectedGuest.category}
            </DnaBadge>
          ) : undefined
        }
        actions={
          selectedGuest ? (
            <div className="flex items-center justify-end w-full">
              <DnaButton variant="secondary" onClick={() => setSelectedGuest(null)}>
                Tutup
              </DnaButton>
            </div>
          ) : undefined
        }
      >
        {selectedGuest && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Waktu Kunjungan</span>
                <span className="tabular-nums font-semibold text-slate-800 text-xs">{selectedGuest.dateTime}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Asal Kota</span>
                <span className="font-semibold text-slate-800 text-xs">{selectedGuest.city}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">PIC Pertemuan</span>
                <span className="font-medium text-slate-800 text-xs">{selectedGuest.meetingPic}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WhatsApp Klien</span>
                <span className="tabular-nums font-bold text-blue-600 text-xs">{selectedGuest.contact}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target MOQ</span>
                <span className="tabular-nums font-bold text-slate-900 text-xs">{selectedGuest.moq.toLocaleString("id-ID")} pcs</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Pasar Konsumen</span>
                <span className="font-medium text-slate-700 text-xs">{selectedGuest.targetMarket}</span>
              </div>
            </div>

            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Produk yang Diminati</span>
              <p className="text-slate-800 font-semibold text-sm">{selectedGuest.productInterest}</p>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Buat Tamu Baru */}
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
              <label className="block text-slate-700 font-semibold mb-1">Asal Kota *</label>
              <input
                type="text"
                placeholder="Jakarta Selatan"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nama Perusahaan / Brand *</label>
              <input
                type="text"
                placeholder="Glow & Shine Skincare"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Kategori Klien</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="BRANDED">BRANDED</option>
                <option value="KLINIK">KLINIK</option>
                <option value="PEMULA">PEMULA</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Produk Diminati</label>
              <input
                type="text"
                placeholder="Serum Retinol 30ml"
                value={formData.productInterest}
                onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target MOQ (Pcs)</label>
              <input
                type="number"
                value={formData.moq}
                onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Market</label>
              <input
                type="text"
                placeholder="Wanita Dewasa Karir"
                value={formData.targetMarket}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">BusDev Pendamping</label>
              <select
                value={formData.busDev}
                onChange={(e) => setFormData({ ...formData, busDev: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
              >
                <option value="Irma Safarina">Irma Safarina</option>
                <option value="Fadilah Syahab">Fadilah Syahab</option>
                <option value="Keviana">Keviana</option>
                <option value="Vira">Vira</option>
                <option value="Desy">Desy</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Buku Tamu"}
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}

export default function GuestBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <GuestBookContent />
    </Suspense>
  );
}
