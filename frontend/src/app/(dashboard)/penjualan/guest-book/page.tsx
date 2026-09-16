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

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Buku Tamu Kunjungan Klien (Guest Book)"
        subtitle="Pencatatan dan monitoring kehadiran calon klien maklon, PIC pendamping, estimasi MOQ, dan kategori prospek"
        breadcrumbs={[{ label: "Operasional", href: "/sales" }, { label: "Buku Tamu" }]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Buku Tamu
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              + Buat Buku Tamu
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Tamu Terdaftar"
          value={`${guests.length} Tamu`}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          delta={{ value: "+28% vs bln lalu", isPositive: true }}
          subtext="Prospect Klien Periode Ini"
          variant="info"
        />
        <DnaStatCard
          label="Klien Brand Established"
          value={`${guests.filter((g) => g.category === "BRANDED").length} Klien`}
          icon={<Building2 className="w-5 h-5 text-purple-600" />}
          subtext="Segmen Brand Berkembang"
          variant="purple"
        />
        <DnaStatCard
          label="Klinik Kecantikan"
          value={`${guests.filter((g) => g.category === "KLINIK").length} Klinik`}
          icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Dokter & Aesthetic Clinic", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Klien Pemula (Start-up)"
          value={`${guests.filter((g) => g.category === "PEMULA").length} Mitra`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Edukasi Formula & MOQ", isPositive: true }}
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Buku Tamu Kunjungan Klien"
        count={filteredGuests.length}
        totalItems={guests.length}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="BRANDED">BRANDED</option>
              <option value="KLINIK">KLINIK</option>
              <option value="PEMULA">PEMULA</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
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
                placeholder="Cari nama, kontak, kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3">Tanggal & Waktu</th>
                <th className="px-3 py-3">Nama Klien</th>
                <th className="px-3 py-3">Meeting & PIC</th>
                <th className="px-3 py-3">Kontak</th>
                <th className="px-3 py-3">Kota</th>
                <th className="px-3 py-3">Produk Diminati</th>
                <th className="px-3 py-3 text-right">MOQ</th>
                <th className="px-3 py-3">Target Market</th>
                <th className="px-3 py-3 text-center">Kategori</th>
                <th className="px-3 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredGuests.map((g, idx) => (
                <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap text-xs">{g.dateTime}</td>
                  <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap text-xs">{g.clientName}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap text-xs">{g.meetingPic}</td>
                  <td className="px-3 py-3 font-mono text-slate-600 whitespace-nowrap text-xs">{g.contact}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap text-xs">{g.city}</td>
                  <td className="px-3 py-3 text-slate-800 max-w-xs truncate text-xs font-medium">{g.productInterest}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-blue-600 whitespace-nowrap text-xs">
                    {g.moq.toLocaleString("id-ID")} pcs
                  </td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap text-xs">{g.targetMarket}</td>
                  <td className="px-3 py-3 text-center whitespace-nowrap text-xs">
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
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedGuest(g)}
                    >
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Kunjungan */}
      <DnaModal
        isOpen={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        title={`Detail Tamu: ${selectedGuest?.clientName || ""}`}
        size="md"
      >
        {selectedGuest && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Tanggal & Waktu</span>
                <span className="font-semibold text-slate-800">{selectedGuest.dateTime}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Asal Kota</span>
                <span className="font-semibold text-slate-800">{selectedGuest.city}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Meeting Bersama PIC</span>
                <span className="font-medium text-slate-800">{selectedGuest.meetingPic}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Nomor WhatsApp</span>
                <span className="font-mono font-bold text-blue-600">{selectedGuest.contact}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Estimasi Rencana MOQ</span>
                <span className="font-mono font-bold text-slate-900">{selectedGuest.moq.toLocaleString("id-ID")} pcs</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Kategori Klien</span>
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
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Produk Diminati</span>
              <p className="text-slate-800 font-medium mt-1">{selectedGuest.productInterest}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Target Pasar Konsumen</span>
              <p className="text-slate-700 mt-1">{selectedGuest.targetMarket}</p>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedGuest(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

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
