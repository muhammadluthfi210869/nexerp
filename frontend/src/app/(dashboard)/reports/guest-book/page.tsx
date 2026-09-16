"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaInput,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { Users, Clock, Building2, Printer, Search, Calendar, FileSpreadsheet } from "lucide-react";

interface GuestReportItem {
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

const GUEST_REPORT_DATA: GuestReportItem[] = [
  {
    id: "gr-1",
    no: 1,
    date: "2026-09-02",
    time: "10:15 WIB",
    name: "Ibu Amanda Putri",
    phone: "0812-9988-7711",
    email: "amanda@glowshine.co.id",
    address: "Jakarta Selatan",
    company: "Glow & Shine Co",
    purpose: "Konsultasi Maklon Serum Retinol",
    meetingWith: "Apt. Rina Lestari",
    busDev: "Irma Safarina"
  },
  {
    id: "gr-2",
    no: 2,
    date: "2026-09-03",
    time: "13:30 WIB",
    name: "dr. Hendra Pratama",
    phone: "0811-2233-4455",
    email: "dr.hendra@dermalife.com",
    address: "Surabaya",
    company: "Dermalife Aesthetic Clinic",
    purpose: "Review Sample Batch 2 Hybrid Sunscreen",
    meetingWith: "dr. Siska Amelia",
    busDev: "Fadilah Syahab"
  },
  {
    id: "gr-3",
    no: 3,
    date: "2026-09-04",
    time: "11:00 WIB",
    name: "Bapak Surya Wijaya",
    phone: "0813-5566-7788",
    email: "surya@kharismaherbal.co.id",
    address: "Bandung",
    company: "Kharisma Herbal Nusantara",
    purpose: "Audit Fasilitas Pabrik CPKB & Hair Oil",
    meetingWith: "Budi Santoso (Head Factory)",
    busDev: "Keviana"
  },
  {
    id: "gr-4",
    no: 4,
    date: "2026-09-05",
    time: "14:45 WIB",
    name: "Ibu Cindy Claudia",
    phone: "0817-8899-0011",
    email: "cindy@beautyglow.id",
    address: "Semarang",
    company: "Beauty Glow ID",
    purpose: "Riset Formula Moisturizer Ceramide",
    meetingWith: "Apt. Rina Lestari",
    busDev: "Vira"
  },
  {
    id: "gr-5",
    no: 5,
    date: "2026-09-06",
    time: "09:30 WIB",
    name: "dr. Melissa Anggraini",
    phone: "0812-3344-5566",
    email: "melissa@auraderma.co.id",
    address: "Malang",
    company: "Aura Derma Aesthetic",
    purpose: "Diskusi Kontrak Maklon Facial Wash",
    meetingWith: "Fadilah Syahab",
    busDev: "Desy"
  }
];

export default function ReportGuestBookPage() {
  const [data] = useState<GuestReportItem[]>(GUEST_REPORT_DATA);
  const [search, setSearch] = useState("");
  const [selectedBusdev, setSelectedBusdev] = useState("ALL");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-30");

  const filtered = data.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.purpose.toLowerCase().includes(search.toLowerCase());
    const matchBd = selectedBusdev === "ALL" || d.busDev === selectedBusdev;
    return matchSearch && matchBd;
  });

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Kunjungan Buku Tamu"
        subtitle="Rekapitulasi log kunjungan tamu pabrik, detail instansi, tujuan konsultasi formula, dan penugasan BusDev"
        breadcrumbs={[{ label: "Laporan", href: "/reports" }, { label: "Buku Tamu" }]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Cetak Laporan
            </DnaButton>
            <DnaButton variant="secondary" icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Kunjungan"
          value={`${filtered.length} Tamu`}
          icon={<Users className="w-4 h-4" />}
          delta={{ value: "Periode Bulan Berjalan", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Rata-rata Harian"
          value="2.8 Tamu / Hari"
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Aktivitas Konsultasi Maklon", isPositive: true }}
          variant="purple"
        />
        <DnaStatCard
          label="Brand Kosmetik Unik"
          value="14 Perusahaan"
          icon={<Building2 className="w-4 h-4" />}
          delta={{ value: "Diversifikasi Calon Klien", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="BusDev Teraktif"
          value="Irma Safarina"
          icon={<Users className="w-4 h-4" />}
          delta={{ value: "5 Kunjungan Didampingi", isPositive: true }}
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Rekapitulasi Buku Tamu"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <DnaInput
                placeholder="Cari nama, instansi, tujuan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={selectedBusdev}
              onChange={(e) => setSelectedBusdev(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Semua BusDev</option>
              <option value="Irma Safarina">Irma Safarina</option>
              <option value="Fadilah Syahab">Fadilah Syahab</option>
              <option value="Keviana">Keviana</option>
              <option value="Vira">Vira</option>
              <option value="Desy">Desy</option>
            </select>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-0 text-xs p-1 text-slate-700"
              />
              <span className="text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-0 text-xs p-1 text-slate-700"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-3 w-10 text-center">No</th>
                <th className="px-3 py-3">Tanggal</th>
                <th className="px-3 py-3">Waktu</th>
                <th className="px-3 py-3">Nama</th>
                <th className="px-3 py-3">Telepon</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Alamat</th>
                <th className="px-3 py-3">Perusahaan</th>
                <th className="px-3 py-3">Tujuan</th>
                <th className="px-3 py-3">Bertemu</th>
                <th className="px-3 py-3">BusDev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3 text-center text-slate-400 font-mono">{item.no}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{item.date}</td>
                  <td className="px-3 py-3 text-slate-600 font-mono whitespace-nowrap">{item.time}</td>
                  <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">{item.name}</td>
                  <td className="px-3 py-3 font-mono text-slate-600 whitespace-nowrap">{item.phone}</td>
                  <td className="px-3 py-3 text-slate-600">{item.email}</td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{item.address}</td>
                  <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{item.company}</td>
                  <td className="px-3 py-3 text-slate-700 max-w-xs truncate">{item.purpose}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{item.meetingWith}</td>
                  <td className="px-3 py-3 font-medium text-blue-600 whitespace-nowrap">{item.busDev}</td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
