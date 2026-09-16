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
import { PhoneCall, Calendar, Search, Printer, FileSpreadsheet, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface FollowUpItem {
  id: string;
  customerBrand: string;
  busDev: string;
  followUpDate: string;
  channel: "WHATSAPP" | "PHONE" | "VISIT" | "EMAIL";
  discussionSummary: string;
  nextActionDate: string;
  status: "INTERESTED" | "SAMPLE_REQUEST" | "QUOTATION_SENT" | "CLOSING" | "COLD";
}

const FOLLOW_UP_DATA: FollowUpItem[] = [
  {
    id: "fu-1",
    customerBrand: "M. Setyo (Anasera)",
    busDev: "Irma Safarina",
    followUpDate: "2026-09-04",
    channel: "WHATSAPP",
    discussionSummary: "Konfirmasi aroma revisi 1 massage cream; klien puas dan lanjut pengajuan HKI",
    nextActionDate: "2026-09-12",
    status: "SAMPLE_REQUEST"
  },
  {
    id: "fu-2",
    customerBrand: "Rizka (Skin Haven)",
    busDev: "Fadilah Syahab",
    followUpDate: "2026-09-05",
    channel: "VISIT",
    discussionSummary: "Diskusi kemasan jar 50g dan approval formulasi aloe soothing gel",
    nextActionDate: "2026-09-15",
    status: "QUOTATION_SENT"
  },
  {
    id: "fu-3",
    customerBrand: "Nurul Hidayati (Glow Secret)",
    busDev: "Keviana",
    followUpDate: "2026-09-06",
    channel: "PHONE",
    discussionSummary: "Penandatanganan SPK tuntas, reminder transfer DP 50% sebelum mixing PPIC",
    nextActionDate: "2026-09-10",
    status: "CLOSING"
  },
  {
    id: "fu-4",
    customerBrand: "dr. Farah Diba (Farah Derma)",
    busDev: "Vira",
    followUpDate: "2026-09-03",
    channel: "WHATSAPP",
    discussionSummary: "Verifikasi pelunasan DP acne day cream dan jadwal cetak stiker NA BPOM",
    nextActionDate: "2026-09-18",
    status: "CLOSING"
  },
  {
    id: "fu-5",
    customerBrand: "Bapak Tommy Lee (Alpha Hair)",
    busDev: "Desy",
    followUpDate: "2026-08-25",
    channel: "WHATSAPP",
    discussionSummary: "Tidak ada respon setelah pengiriman price list MOQ 1000",
    nextActionDate: "—",
    status: "COLD"
  }
];

export default function ReportFollowUpCustomerPage() {
  const [data] = useState<FollowUpItem[]>(FOLLOW_UP_DATA);
  const [search, setSearch] = useState("");
  const [selectedBusdev, setSelectedBusdev] = useState("ALL");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-30");

  const filtered = data.filter((d) => {
    const matchSearch =
      d.customerBrand.toLowerCase().includes(search.toLowerCase()) ||
      d.discussionSummary.toLowerCase().includes(search.toLowerCase());
    const matchBd = selectedBusdev === "ALL" || d.busDev === selectedBusdev;
    return matchSearch && matchBd;
  });

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Aktivitas Follow Up Pelanggan (BusDev)"
        subtitle="Evaluasi intensitas komunikasi sales, eskalasi pipeline negosiasi klien maklon, dan janji tindak lanjut (Next Action)"
        breadcrumbs={[{ label: "Laporan", href: "/reports" }, { label: "Follow Up Pelanggan" }]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Cetak
            </DnaButton>
            <DnaButton variant="secondary" icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Interaksi Follow Up"
          value={`${filtered.length} Aktivitas`}
          icon={<PhoneCall className="w-4 h-4" />}
          delta={{ value: "Periode Dipilih", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Peluang Closing Tinggi"
          value={`${data.filter((d) => d.status === "CLOSING").length} Klien`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: "Tahap SPK & DP", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Dalam Riset & Penawaran"
          value={`${data.filter((d) => d.status === "SAMPLE_REQUEST" || d.status === "QUOTATION_SENT").length} Klien`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Menunggu Feedback Formula", isPositive: true }}
          variant="warning"
        />
        <DnaStatCard
          label="Cold / Dormant"
          value={`${data.filter((d) => d.status === "COLD").length} Klien`}
          icon={<AlertCircle className="w-4 h-4" />}
          delta={{ value: "Perlu Re-engagement", isPositive: false }}
          variant="danger"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Log Interaksi & Follow Up BusDev"
        count={filtered.length}
        totalItems={data.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <DnaInput
                placeholder="Cari klien, isi diskusi..."
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
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3">Pelanggan / Brand</th>
                <th className="px-3 py-3">BusDev</th>
                <th className="px-3 py-3">Tanggal Follow Up</th>
                <th className="px-3 py-3 text-center">Metode</th>
                <th className="px-3 py-3">Hasil Diskusi</th>
                <th className="px-3 py-3">Next Action Date</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">{item.customerBrand}</td>
                  <td className="px-3 py-3 font-medium text-blue-600 whitespace-nowrap">{item.busDev}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{item.followUpDate}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {item.channel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700 max-w-sm truncate" title={item.discussionSummary}>
                    {item.discussionSummary}
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-800 whitespace-nowrap">{item.nextActionDate}</td>
                  <td className="px-3 py-3 text-center">
                    <DnaBadge
                      variant={
                        item.status === "CLOSING"
                          ? "emerald"
                          : item.status === "QUOTATION_SENT"
                          ? "blue"
                          : item.status === "SAMPLE_REQUEST"
                          ? "purple"
                          : "neutral"
                      }
                    >
                      {item.status.replace(/_/g, " ")}
                    </DnaBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
