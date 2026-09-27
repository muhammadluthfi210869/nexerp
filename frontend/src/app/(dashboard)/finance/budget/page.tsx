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
  DnaInput,
  formatRupiah,
} from "@/components/dna";
import { DnaTable } from "@/components/dna";
import { PieChart, TrendingUp, AlertTriangle, Info } from "lucide-react";

interface ExpenseLine {
  id: string;
  code: string;
  name: string;
  debit: number;
  credit: number;
  actual: number;
}

const monthStartISO = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);

const monthEndISO = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

function BudgetManagementContent() {
  const now = new Date();
  const [period, setPeriod] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const { year, month } = period;
  const startDate = monthStartISO(year, month);
  const endDate = monthEndISO(year, month);

  // Realized expenses come from the live trial balance (journal lines in the
  // selected period). The pagu/budget figure has no backend source yet, so it
  // is reported as unavailable instead of invented.
  const {
    data: lines,
    isLoading,
    isError,
    refetch,
  } = useQuery<ExpenseLine[]>({
    queryKey: ["finance-budget-trial-balance", year, month],
    queryFn: async () => {
      const res = await api.get("/finance/reports/trial-balance", {
        params: { startDate, endDate },
      });
      const body = unwrapResponse<any>(res);
      const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      return rows
        .filter((a) => a.type === "EXPENSE")
        .map((a) => {
          const debit = Number(a.totalDebit || 0);
          const credit = Number(a.totalCredit || 0);
          return {
            id: a.id,
            code: a.code,
            name: a.name,
            debit,
            credit,
            actual: debit - credit,
          };
        })
        .filter((a) => a.debit !== 0 || a.credit !== 0);
    },
  });

  const rows = useMemo(
    () => [...(lines ?? [])].sort((a, b) => b.actual - a.actual),
    [lines],
  );
  const totalActual = rows.reduce((acc, r) => acc + r.actual, 0);
  const overTolerance = rows.filter((r) => r.actual < 0).length;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Realisasi Beban per Akun (Budget vs Actual)"
        subtitle="Realisasi biaya aktual per akun beban dari jurnal periode terpilih. Pagu anggaran per departemen belum tersedia di sistem."
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Budgeting" }]}
        actions={
          <div className="flex items-end gap-2">
            <div className="w-24">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Bulan</label>
              <DnaInput
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) =>
                  setPeriod((p) => ({ ...p, month: Math.min(12, Math.max(1, Number(e.target.value) || 1)) }))
                }
              />
            </div>
            <div className="w-28">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tahun</label>
              <DnaInput
                type="number"
                value={year}
                onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) || p.year }))}
              />
            </div>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Pagu Anggaran Tahunan"
          value="Belum tersedia"
          variant="slate"
          icon={<PieChart className="h-4 w-4" />}
          delta={{ value: "Belum ada sumber data pagu di backend", isPositive: false }}
        />
        <DnaStatCard
          label="Realisasi Biaya Aktual (Periode)"
          value={isLoading ? "…" : formatRupiah(totalActual)}
          variant="amber"
          icon={<TrendingUp className="h-4 w-4" />}
          delta={{ value: `${startDate} s/d ${endDate}`, isPositive: true }}
        />
        <DnaStatCard
          label="Akun Beban Bergerak"
          value={`${rows.length} Akun`}
          variant="blue"
          icon={<PieChart className="h-4 w-4" />}
          delta={{ value: "Dari jurnal periode terpilih", isPositive: true }}
        />
        <DnaStatCard
          label="Akun dengan Saldo Terbalik"
          value={`${overTolerance} Akun`}
          variant={overTolerance > 0 ? "danger" : "emerald"}
          icon={<AlertTriangle className="h-4 w-4" />}
          delta={{ value: overTolerance > 0 ? "Perlu koreksi jurnal" : "Tidak ada anomali", isPositive: overTolerance === 0 }}
        />
      </DnaKpiGrid>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-[11px] text-blue-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Kolom <strong>Pagu Anggaran</strong> dikosongkan karena backend belum menyimpan master anggaran
          departemen. Angka realisasi di bawah ini berasal dari jurnal akuntansi yang sudah diposting.
        </span>
      </div>

      <DnaDataTableCard title="Tabel Realisasi Beban per Akun (GL)">
        {isLoading ? (
          <DnaLoadingSkeleton rows={5} />
        ) : isError ? (
          <DnaErrorState
            title="Gagal Memuat Realisasi Beban"
            message="Tidak dapat mengambil neraca saldo dari server. Periksa koneksi lalu coba lagi."
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <DnaEmptyState
            title="Belum Ada Realisasi Beban"
            description={`Tidak ditemukan jurnal beban pada periode ${startDate} s/d ${endDate}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Akun Beban (CoA)</th>
                  <th className="px-4 py-3 text-right">Pagu Anggaran</th>
                  <th className="px-4 py-3 text-right">Realisasi Aktual</th>
                  <th className="px-4 py-3 text-right">Sisa Anggaran</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-400 tabular-nums">{b.code}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">— belum tersedia</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-amber-700">
                      {formatRupiah(b.actual)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">—</td>
                    <td className="px-4 py-3 text-center">
                      <DnaBadge variant={b.actual < 0 ? "danger" : "emerald"}>
                        {b.actual < 0 ? "Saldo Terbalik" : "Normal"}
                      </DnaBadge>
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

export default function BudgetManagementPage() {
  return <BudgetManagementContent />;
}