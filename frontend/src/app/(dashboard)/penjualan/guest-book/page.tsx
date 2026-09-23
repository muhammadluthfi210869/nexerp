"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Building2,
  Calendar,
  Clock,
  Printer,
  Plus,
  Search,
  Sparkles,
  Eye,
  EyeOff,
  Phone,
  Tag,
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
  DnaDetailDrawer,
  DnaInput,
  useDnaToast,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";

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

const SAMPLE_GUESTS: GuestBookEntry[] = [
  {
    id: "gb-1",
    no: 1,
    dateTime: "2026-09-02 10:15",
    clientName: "Ibu Amanda Putri (Glow & Shine)",
    meetingPic: "Apt. Rina Lestari / Irma Safarina",
    contact: "0812-9988-7711",
    city: "Jakarta Selatan",
    productInterest: "Serum Retinol 30ml Encapsulated",
    moq: 1000,
    targetMarket: "Wanita 25-45 Karir",
    category: "BRANDED",
  },
  {
    id: "gb-2",
    no: 2,
    dateTime: "2026-09-03 13:30",
    clientName: "dr. Hendra Pratama (Dermalife)",
    meetingPic: "dr. Siska Amelia / Fadilah Syahab",
    contact: "0811-2233-4455",
    city: "Surabaya",
    productInterest: "Hybrid Sunscreen SPF 50 Gel 50ml",
    moq: 2500,
    targetMarket: "Pasien Klinik Kecantikan",
    category: "KLINIK",
  },
  {
    id: "gb-3",
    no: 3,
    dateTime: "2026-09-04 11:00",
    clientName: "Bapak Surya Wijaya (Kharisma Herbal)",
    meetingPic: "Budi Santoso / Keviana",
    contact: "0813-5566-7788",
    city: "Bandung",
    productInterest: "Hair Growth Oil Kemiri 100ml",
    moq: 5000,
    targetMarket: "Mass Market E-Commerce",
    category: "BRANDED",
  },
  {
    id: "gb-4",
    no: 4,
    dateTime: "2026-09-05 14:45",
    clientName: "Ibu Cindy Claudia (Beauty Glow ID)",
    meetingPic: "Apt. Rina Lestari / Vira",
    contact: "0817-8899-0011",
    city: "Semarang",
    productInterest: "Moisturizer Gel Ceramide 30g",
    moq: 1000,
    targetMarket: "Remaja & Dewasa Muda",
    category: "PEMULA",
  },
  {
    id: "gb-5",
    no: 5,
    dateTime: "2026-09-06 09:30",
    clientName: "dr. Melissa Anggraini (Aura Derma)",
    meetingPic: "Fadilah Syahab / Desy",
    contact: "0812-3344-5566",
    city: "Malang",
    productInterest: "Facial Wash Tea Tree Acne 100ml",
    moq: 3000,
    targetMarket: "Kulit Berjerawat",
    category: "KLINIK",
  },
];

function GuestBookContent() {
  const toast = useDnaToast();
  const searchParams = useSearchParams();

  const [guests, setGuests] = useState<GuestBookEntry[]>(SAMPLE_GUESTS);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "2026-09-01", end: "2026-09-30" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestBookEntry | null>(null);

  // Form input
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.productInterest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.contact.includes(searchQuery);
      const matchCategory = categoryFilter === "ALL" || g.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [guests, searchQuery, categoryFilter]);

  const handleSave = () => {
    if (!formData.name || !formData.phone || !formData.company) {
      toast.error("Mohon lengkapi nama klien, kontak WhatsApp, dan nama perusahaan/brand!");
      return;
    }
    const newEntry: GuestBookEntry = {
      id: `gb-${Date.now()}`,
      no: guests.length + 1,
      dateTime: new Date().toISOString().slice(0, 16).replace("T", " "),
      clientName: `${formData.name} (${formData.company})`,
      meetingPic: `${formData.meetingWith} / ${formData.busDev}`,
      contact: formData.phone,
      city: formData.city,
      productInterest: formData.productInterest,
      moq: parseInt(formData.moq) || 1000,
      targetMarket: formData.targetMarket,
      category: formData.category,
    };
    setGuests([newEntry, ...guests]);
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
            subtitle: "Calon mitra maklon periode ini",
            trend: "+28% vs bln lalu",
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
          <table className="w-full text-left border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-[18%]">Waktu & Kota</th>
                <th className="py-3 px-3 w-[22%]">Klien & Kontak</th>
                <th className="py-3 px-3 w-[20%]">Meeting & Kategori</th>
                <th className="py-3 px-3 w-[20%]">Minat Produk & MOQ</th>
                <th className="py-3 px-3 w-[10%] text-center">Kategori</th>
                <th className="py-3 px-3 w-[10%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada data tamu kunjungan</p>
                    <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter kategori.</p>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-mono font-semibold text-slate-700">{g.dateTime}</p>
                      <p className="text-[11px] text-slate-400 truncate">{g.city}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 truncate">{g.clientName}</p>
                      <p className="font-mono text-[11px] text-blue-600 truncate">{g.contact}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-slate-800 font-medium truncate">{g.meetingPic}</p>
                      <p className="text-[10px] text-slate-400 truncate">{g.targetMarket}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800 truncate">{g.productInterest}</p>
                      <p className="font-mono text-[10px] text-slate-500">MOQ: {g.moq.toLocaleString("id-ID")} pcs</p>
                    </td>
                    <td className="py-3 px-3 text-center">
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
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedGuest(g)}
                        >
                          Detail
                        </DnaButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <span className="font-mono font-semibold text-slate-800 text-xs">{selectedGuest.dateTime}</span>
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
                <span className="font-mono font-bold text-blue-600 text-xs">{selectedGuest.contact}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target MOQ</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{selectedGuest.moq.toLocaleString("id-ID")} pcs</span>
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
            <DnaButton variant="primary" size="md" onClick={handleSave}>
              Simpan Buku Tamu
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}

export default function BussDevGuestBookReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Buku Tamu...</div>}>
      <GuestBookContent />
    </Suspense>
  );
}
