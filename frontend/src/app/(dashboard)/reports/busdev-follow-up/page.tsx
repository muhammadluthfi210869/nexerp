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
  DnaBadge,
  DnaInput,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { PhoneCall, Calendar, Search, Printer, FileSpreadsheet, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface FollowUpItem {
  id: string;
  customerName: string;
  lastFollowUpDate: string;
  status: string;
  totalSamples: number;
  totalOrders: number;
}

const CLOSING_STATUSES = new Set([
  "SPK_SIGNED",
  "WAITING_FINANCE_APPROVAL",
  "DP_PAID",
  "PRODUCTION_PLAN",
  "READY_TO_SHIP",
  "WON_DEAL",
]);

const PIPELINE_STATUSES = new Set([
  "CONTACTED",
  "FOLLOW_UP_1",
  "FOLLOW_UP_2",
  "FOLLOW_UP_3",
  "NEGOTIATION",
  "SAMPLE_REQUESTED",
  "SAMPLE_SENT",
  "SAMPLE_APPROVED",
]);

const COLD_STATUSES = new Set(["COLD", "LOST", "ABORTED"]);

export default function ReportFollowUpCustomerPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reports-follow-up-customer", startDate, endDate],
    queryFn: async () => {
      const res = await api.get("/reports/follow-up-customer", {
        params: {
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      });
      return res.data;
    },
  });

  const rows: FollowUpItem[] = useMemo(() => {
    const raw = Array.isArray(data?.data) ? data.data : [];
    return raw.map((it: any) => ({
      id: it.customer_id,
      customerName: it.customer_name || "Pelanggan",
      lastFollowUpDate: it.last_follow_up_at
        ? String(it.last_follow_up_at).split("T")[0]
        : "-",
      status: it.lead_status || "UNKNOWN",
      totalSamples: Number(it.total_samples ?? 0),
      totalOrders: Number(it.total_orders ?? 0),
    }));
  }, [data]);

  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.status))).sort(),
    [rows],
  );

  const filtered = rows.filter((d) => {
    const matchSearch = d.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusVariant = (status: string) => {
    if (CLOSING_STATUSES.has(status)) return "emerald" as const;
    if (PIPELINE_STATUSES.has(status)) return "blue" as const;
    if (COLD_STATUSES.has(status)) return "neutral" as const;
    return "purple" as const;
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Aktivitas Follow Up Pelanggan (BusDev)"
        subtitle="Rekap pipeline BusDev: pelanggan yang di-follow up, status tahapan, jumlah permintaan sample dan order yang sudah tercatat"
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
          label="Total Pelanggan Follow Up"
          value={`${filtered.length} Klien`}
          icon={<PhoneCall className="w-4 h-4" />}
          delta={{ value: "Periode Dipilih", isPositive: true }}
          variant="info"
        />
        <DnaStatCard
          label="Peluang Closing Tinggi"
          value={`${filtered.filter((d) => CLOSING_STATUSES.has(d.status)).length} Klien`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          delta={{ value: "Tahap SPK & DP", isPositive: true }}
          variant="success"
        />
        <DnaStatCard
          label="Dalam Riset & Penawaran"
          value={`${filtered.filter((d) => PIPELINE_STATUSES.has(d.status)).length} Klien`}
          icon={<Clock className="w-4 h-4" />}
          delta={{ value: "Menunggu Feedback", isPositive: true }}
          variant="warning"
        />
        <DnaStatCard
          label="Cold / Dormant"
          value={`${filtered.filter((d) => COLD_STATUSES.has(d.status)).length} Klien`}
          icon={<AlertCircle className="w-4 h-4" />}
          delta={{ value: "Perlu Re-engagement", isPositive: false }}
          variant="danger"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Pelanggan & Status Follow Up"
        count={filtered.length}
        totalItems={rows.length}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64">
              <DnaInput
                placeholder="Cari nama pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
            >
              <option value="ALL">Semua Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
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
                <th className="px-3 py-3">Follow Up Terakhir</th>
                <th className="px-3 py-3 text-center">Permintaan Sample</th>
                <th className="px-3 py-3 text-center">Order</th>
                <th className="px-3 py-3 text-center">Status Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-slate-400">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center">
                    <p className="text-rose-600 mb-3">Gagal memuat laporan follow up dari server.</p>
                    <DnaButton variant="secondary" size="sm" onClick={() => refetch()}>
                      Coba Lagi
                    </DnaButton>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-slate-400">
                    Tidak ada data follow up pelanggan pada periode / filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">{item.customerName}</td>
                    <td className="px-3 py-3 text-slate-700 whitespace-nowrap tabular-nums">{item.lastFollowUpDate}</td>
                    <td className="px-3 py-3 text-center tabular-nums text-slate-700">{item.totalSamples}</td>
                    <td className="px-3 py-3 text-center tabular-nums text-slate-700">{item.totalOrders}</td>
                    <td className="px-3 py-3 text-center">
                      <DnaBadge variant={statusVariant(item.status)}>
                        {item.status.replace(/_/g, " ")}
                      </DnaBadge>
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