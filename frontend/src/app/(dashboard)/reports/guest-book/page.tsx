"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { Users, Clock, Building2, Printer, Search, Calendar, FileSpreadsheet } from "lucide-react";

interface GuestReportItem {
  id: string;
  date: string;
  name: string;
  institution: string;
  purpose: string;
}

export default function ReportGuestBookPage() {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-guest-book", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/reports/guest-book", {
        params: {
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      });
      return res.data;
    },
  });

  const rows: GuestReportItem[] = useMemo(() => {
    const raw = Array.isArray(data?.data) ? data.data : [];
    return raw.map((it: any, idx: number) => ({
      id: it.id || `${it.date}-${it.name}-${idx}`,
      date: it.date || "-",
      name: it.name || "-",
      institution: it.institution || "-",
      purpose: it.purpose || "-",
    }));
  }, [data]);

  const filtered = rows.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.institution.toLowerCase().includes(q) ||
      d.purpose.toLowerCase().includes(q)
    );
  });

  const uniqueInstitutions = new Set(
    filtered.map((d) => d.institution).filter((i) => i && i !== "-"),
  ).size;
  const uniqueDays = new Set(filtered.map((d) => d.date)).size;
  const avgPerDay = uniqueDays > 0 ? (filtered.length / uniqueDays).toFixed(1) : "0.0";

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Kunjungan Buku Tamu"
        subtitle="Rekapitulasi log kunjungan tamu pabrik, instansi asal, dan tujuan kunjungan dari buku tamu"
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
          delta={{ value: "Periode Dipilih", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Rata-rata Harian"
          value={`${avgPerDay} Tamu / Hari`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: `${uniqueDays} Hari Kunjungan`, isPositive: true }}
          variant="purple"
        />
        <DnaStatCard
          label="Instansi Unik"
          value={`${uniqueInstitutions} Instansi`}
          icon={<Building2 className="w-4 h-4" />}
          delta={{ value: "Diversifikasi Tamu", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Kunjungan dengan Tujuan"
          value={`${filtered.filter((d) => d.purpose && d.purpose !== "-").length} Tamu`}
          icon={<Users className="w-4 h-4" />}
          delta={{ value: "Tujuan Tercatat", isPositive: true }}
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Rekapitulasi Buku Tamu"
        count={filtered.length}
        totalItems={rows.length}
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
                <th className="px-3 py-3">Nama</th>
                <th className="px-3 py-3">Instansi</th>
                <th className="px-3 py-3">Tujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-slate-400">
                    Memuat data buku tamu...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center">
                    <p className="text-rose-600 mb-3">Gagal memuat laporan buku tamu dari server.</p>
                    <DnaButton variant="secondary" size="sm" onClick={() => refetch()}>
                      Coba Lagi
                    </DnaButton>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-slate-400">
                    Tidak ada data kunjungan tamu pada periode / filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="px-3 py-3 text-slate-700 whitespace-nowrap tabular-nums">{item.date}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">{item.name}</td>
                    <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{item.institution}</td>
                    <td className="px-3 py-3 text-slate-700 max-w-xs truncate" title={item.purpose}>
                      {item.purpose}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}