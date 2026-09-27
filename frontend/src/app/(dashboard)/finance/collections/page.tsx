"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaBadge,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaSelect,
  formatRupiah,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { AlertCircle, Clock, PhoneCall, Layers } from "lucide-react";

interface AgedInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issuedAt: string | null;
  dueDate: string | null;
  outstanding: number;
  amountDue: number;
  status: string;
  daysOverdue: number;
  bucket: "CURRENT" | "1-30" | "31-60" | "60+";
}

const BUCKETS: AgedInvoice["bucket"][] = ["CURRENT", "1-30", "31-60", "60+"];

function bucketOf(daysOverdue: number): AgedInvoice["bucket"] {
  if (daysOverdue <= 0) return "CURRENT";
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  return "60+";
}

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "—";

export default function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("ALL");

  const {
    data: invoices,
    isLoading,
    isError,
    refetch,
  } = useQuery<AgedInvoice[]>({
    queryKey: ["finance-collections-invoices"],
    queryFn: async () => {
      const res = await api.get("/finance/invoices");
      const body = unwrapResponse<any>(res);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      const now = Date.now();

      return rows
        .filter((inv) => inv.category === "RECEIVABLE")
        .map((inv) => {
          const outstanding = Number(inv.outstandingAmount ?? inv.amountDue ?? 0);
          const due = inv.dueDate ? new Date(inv.dueDate) : null;
          const daysOverdue = due
            ? Math.floor((now - due.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName || inv.so?.lead?.clientName || "Pelanggan tidak diketahui",
            issuedAt: inv.issuedAt ?? null,
            dueDate: inv.dueDate ?? null,
            outstanding,
            amountDue: Number(inv.amountDue ?? 0),
            status: inv.status,
            daysOverdue,
            bucket: bucketOf(daysOverdue),
          };
        })
        .filter((inv) => inv.outstanding > 0);
    },
  });

  const rows = useMemo(() => {
    const list = invoices ?? [];
    return list
      .filter((r) => bucketFilter === "ALL" || r.bucket === bucketFilter)
      .filter(
        (r) =>
          r.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          r.customerName.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices, bucketFilter, search]);

  const all = invoices ?? [];
  const totalOutstanding = all.reduce((acc, r) => acc + r.outstanding, 0);
  const overdue = all.filter((r) => r.bucket !== "CURRENT");
  const totalOverdue = overdue.reduce((acc, r) => acc + r.outstanding, 0);
  const critical = all.filter((r) => r.bucket === "60+");
  const avgAgeDays = all.length
    ? Math.round(all.reduce((acc, r) => acc + Math.max(0, r.daysOverdue), 0) / all.length)
    : 0;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Pusat Penagihan Piutang (AR Collections Hub)"
        subtitle="Aging piutang faktur penjualan berdasarkan jatuh tempo. Log komunikasi penagihan belum tersedia di sistem."
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Collections" }]}
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Piutang Outstanding"
          value={isLoading ? "…" : formatRupiah(totalOutstanding)}
          variant="blue"
          icon={<Layers className="h-4 w-4" />}
          delta={{ value: `${all.length} Faktur Belum Lunas`, isPositive: true }}
        />
        <DnaStatCard
          label="Piutang Jatuh Tempo"
          value={isLoading ? "…" : formatRupiah(totalOverdue)}
          variant="danger"
          icon={<AlertCircle className="h-4 w-4" />}
          delta={{ value: `${overdue.length} Faktur Lewat Jatuh Tempo`, isPositive: false }}
        />
        <DnaStatCard
          label="Kritis (> 60 Hari)"
          value={`${critical.length} Faktur`}
          variant="slate"
          icon={<PhoneCall className="h-4 w-4" />}
          delta={{ value: "Perlu eskalasi penagihan", isPositive: false }}
        />
        <DnaStatCard
          label="Rata-rata Umur Keterlambatan"
          value={`${avgAgeDays} Hari`}
          variant="amber"
          icon={<Clock className="h-4 w-4" />}
          delta={{ value: "Dihitung dari tanggal jatuh tempo", isPositive: false }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        searchPlaceholder="Cari nomor invoice atau nama pelanggan..."
        searchValue={search}
        onSearchChange={setSearch}
        toolbarProps={{
          extraActions: (
            <DnaSelect
              value={bucketFilter}
              onChange={(val) => setBucketFilter(val)}
              options={[
                { value: "ALL", label: "Semua Umur Piutang" },
                ...BUCKETS.map((b) => ({
                  value: b,
                  label: b === "CURRENT" ? "Belum Jatuh Tempo" : `Jatuh Tempo ${b} Hari`,
                })),
              ]}
              className="h-9 w-52"
            />
          ),
        }}
      >
        {isLoading ? (
          <DnaLoadingSkeleton rows={5} />
        ) : isError ? (
          <DnaErrorState
            title="Gagal Memuat Piutang"
            message="Tidak dapat mengambil daftar faktur penerimaan dari server."
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Piutang Outstanding"
            description="Tidak ditemukan faktur penerimaan dengan sisa tagihan pada filter yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-3 py-3">Invoice No</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Tgl Terbit</th>
                  <th className="px-3 py-3">Jatuh Tempo</th>
                  <th className="px-3 py-3 text-center">Umur</th>
                  <th className="px-3 py-3 text-right">Nilai Faktur</th>
                  <th className="px-3 py-3 text-right">Outstanding</th>
                  <th className="px-3 py-3 text-center">Bucket</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors text-xs">
                    <td className="px-3 py-3 tabular-nums font-semibold text-blue-600 whitespace-nowrap">
                      {r.invoiceNumber}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {r.customerName}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600 whitespace-nowrap">
                      {fmtDate(r.issuedAt)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600 whitespace-nowrap">
                      {fmtDate(r.dueDate)}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums font-bold whitespace-nowrap text-rose-600">
                      {r.daysOverdue > 0 ? `+${r.daysOverdue} Hari` : "Belum jatuh tempo"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700 whitespace-nowrap">
                      {formatRupiah(r.amountDue)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-rose-700 whitespace-nowrap">
                      {formatRupiah(r.outstanding)}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <DnaBadge
                        variant={
                          r.bucket === "CURRENT"
                            ? "emerald"
                            : r.bucket === "1-30"
                            ? "amber"
                            : r.bucket === "31-60"
                            ? "danger"
                            : "critical"
                        }
                      >
                        {r.bucket === "CURRENT" ? "CURRENT" : `${r.bucket} HARI`}
                      </DnaBadge>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <DnaBadge variant={r.status === "PARTIAL" ? "amber" : "slate"}>{r.status}</DnaBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DnaTable>
          </div>
        )}
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}