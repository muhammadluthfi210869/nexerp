"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  ArrowRightLeft,
  Download,
  CheckCircle2,
  XCircle,
  FileSearch,
} from "lucide-react";
import {
  OperationalDataTable,
  OperationalPanel,
  OperationalField,
  OperationalButton,
  OperationalInput,
  OperationalMetricGrid,
  OperationalMetricCard,
} from "@/components/operational";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

interface TrialBalanceItem {
  id: string;
  code: string;
  name: string;
  type: string;
  awalDebit: number;
  awalCredit: number;
  perubahanDebit: number;
  perubahanCredit: number;
  akhirDebit: number;
  akhirCredit: number;
}

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceItem[]>([]);
  const [totals, setTotals] = useState({
    awalDebit: 0, awalCredit: 0,
    perubahanDebit: 0, perubahanCredit: 0,
    akhirDebit: 0, akhirCredit: 0
  });
  const [isBalanced, setIsBalanced] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/finance/reports/trial-balance/detailed", {
        params: { startDate, endDate }
      });
      setData(res.data.data);
      setTotals(res.data.totals);
      setIsBalanced(res.data.isBalanced);
    } catch (err) {
      console.error("Failed to fetch trial balance", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const gapAmount = Math.abs(totals.akhirDebit - totals.akhirCredit);

  const columns = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Kode",
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <span className="text-[12px] font-medium text-slate-500">
            {row.original.code || "—"}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Nama Akun",
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-slate-900">{row.original.name || "—"}</span>
            <span className="text-[11px] text-slate-500">{row.original.type}</span>
          </div>
        ),
      },
      {
        id: "awalDebit",
        accessorKey: "awalDebit",
        header: () => <div className="text-right">Saldo Awal (D)</div>,
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <div className="text-right font-mono tabular-nums text-[13px] text-slate-500">
            {formatOperationalCurrency(row.original.awalDebit)}
          </div>
        ),
      },
      {
        id: "awalCredit",
        accessorKey: "awalCredit",
        header: () => <div className="text-right">Saldo Awal (K)</div>,
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <div className="text-right font-mono tabular-nums text-[13px] text-slate-500">
            {formatOperationalCurrency(row.original.awalCredit)}
          </div>
        ),
      },
      {
        id: "perubahanDebit",
        accessorKey: "perubahanDebit",
        header: () => <div className="text-right">Perubahan (D)</div>,
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <div className="text-right font-mono font-medium tabular-nums text-[13px] text-blue-600">
            {formatOperationalCurrency(row.original.perubahanDebit)}
          </div>
        ),
      },
      {
        id: "perubahanCredit",
        accessorKey: "perubahanCredit",
        header: () => <div className="text-right">Perubahan (K)</div>,
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <div className="text-right font-mono font-medium tabular-nums text-[13px] text-blue-600">
            {formatOperationalCurrency(row.original.perubahanCredit)}
          </div>
        ),
      },
      {
        id: "akhirDebit",
        accessorKey: "akhirDebit",
        header: () => <div className="text-right">Saldo Akhir (D)</div>,
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <div className="text-right font-mono font-semibold tabular-nums text-[13px] text-slate-900">
            {formatOperationalCurrency(row.original.akhirDebit)}
          </div>
        ),
      },
      {
        id: "akhirCredit",
        accessorKey: "akhirCredit",
        header: () => <div className="text-right">Saldo Akhir (K)</div>,
        cell: ({ row }: { row: { original: TrialBalanceItem } }) => (
          <div className="text-right font-mono font-semibold tabular-nums text-[13px] text-slate-900">
            {formatOperationalCurrency(row.original.akhirCredit)}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalMigrationShell title="Neraca Saldo" subtitle="Verifikasi keseimbangan Debit & Kredit seluruh akun buku besar secara real-time.">
      <OperationalPanel>
        <div className="flex gap-4 items-end flex-wrap">
          <OperationalField label="Mulai Dari">
            <OperationalInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
            />
          </OperationalField>
          <OperationalField label="Sampai">
            <OperationalInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
            />
          </OperationalField>
          <OperationalButton
            variant="primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? "MEMUAT..." : "FILTER DATA"}
          </OperationalButton>
        </div>
      </OperationalPanel>

      {/* Audit Status Banner */}
      <div className={cn(
        "p-5 rounded-2xl flex items-center justify-between border shadow-sm transition-all duration-500",
        isBalanced
          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
          : "bg-rose-50 border-rose-100 text-rose-700"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl",
            isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}>
            {isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Status Audit: {isBalanced ? "NERACA SALDO SEIMBANG" : "NERACA SALDO SELISIH"}</h4>
            <p className="text-[10px] font-medium opacity-80 mt-1">
              {isBalanced
                ? "Semua buku pembantu debit dan kredit memiliki total yang sama (seimbang sempurna)."
                : "Terdapat perbedaan saldo akumulasi antara kolom Debit dan Kredit."}
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase opacity-60">Total Debit</p>
            <p className="text-base font-black font-mono">{formatOperationalCurrency(totals.akhirDebit)}</p>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <div className="text-right">
            <p className="text-[8px] font-black uppercase opacity-60">Total Kredit</p>
            <p className="text-base font-black font-mono">{formatOperationalCurrency(totals.akhirCredit)}</p>
          </div>
          {!isBalanced && (
            <>
              <div className="w-px h-8 bg-rose-200 mx-1" />
              <div className="text-right text-rose-600">
                <p className="text-[8px] font-black uppercase opacity-60">Selisih (Gap)</p>
                <p className="text-base font-black font-mono">{formatOperationalCurrency(gapAmount)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <OperationalMetricGrid>
        <OperationalMetricCard
          label="Total Saldo Awal Debit"
          value={formatOperationalCurrency(totals.awalDebit)}
          icon={<ArrowRightLeft className="w-4 h-4" />}
          tone="blue"
        />
        <OperationalMetricCard
          label="Total Saldo Awal Kredit"
          value={formatOperationalCurrency(totals.awalCredit)}
          icon={<ArrowRightLeft className="w-4 h-4" />}
          tone="purple"
        />
        <OperationalMetricCard
          label="Total Perubahan Debit"
          value={formatOperationalCurrency(totals.perubahanDebit)}
          icon={<BarChart3 className="w-4 h-4" />}
          tone="amber"
        />
        <OperationalMetricCard
          label="Total Perubahan Kredit"
          value={formatOperationalCurrency(totals.perubahanCredit)}
          icon={<BarChart3 className="w-4 h-4" />}
          tone="green"
        />
        <OperationalMetricCard
          label="Selisih (Gap)"
          value={formatOperationalCurrency(gapAmount)}
          icon={isBalanced ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          tone={isBalanced ? "green" : "red"}
        />
      </OperationalMetricGrid>

      <OperationalDataTable
        data={data as unknown as TrialBalanceItem[]}
        columns={columns as any}
        getRowId={(row: TrialBalanceItem) => row.id}
        toolbar={
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <FileSearch className="h-3.5 w-3.5" />
            <span>{data.length} akun terdaftar</span>
          </div>
        }
        searchPlaceholder="Cari kode atau nama akun..."
      />

      {/* Totals Footer */}
      <OperationalPanel>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 items-center">
          <div className="md:col-span-1 text-[10px] font-black uppercase text-slate-500 tracking-tight">
            Total Akumulasi
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-400">Awal (D)</p>
            <p className="text-[13px] font-mono font-semibold tabular-nums text-slate-900">
              {formatOperationalCurrency(totals.awalDebit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-400">Awal (K)</p>
            <p className="text-[13px] font-mono font-semibold tabular-nums text-slate-900">
              {formatOperationalCurrency(totals.awalCredit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-400">Perubahan (D)</p>
            <p className="text-[13px] font-mono font-semibold tabular-nums text-slate-900">
              {formatOperationalCurrency(totals.perubahanDebit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-400">Perubahan (K)</p>
            <p className="text-[13px] font-mono font-semibold tabular-nums text-slate-900">
              {formatOperationalCurrency(totals.perubahanCredit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-400">Akhir (D)</p>
            <p className="text-[13px] font-mono font-semibold tabular-nums text-slate-900">
              {formatOperationalCurrency(totals.akhirDebit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-slate-400">Akhir (K)</p>
            <p className="text-[13px] font-mono font-semibold tabular-nums text-slate-900">
              {formatOperationalCurrency(totals.akhirCredit)}
            </p>
          </div>
        </div>
      </OperationalPanel>

      <footer className="flex justify-center gap-3 pt-4 border-t border-slate-100">
        <OperationalButton variant="primary">
          <Download className="w-4 h-4" />
          <span>Export Laporan</span>
        </OperationalButton>
      </footer>
    </OperationalMigrationShell>
  );
}