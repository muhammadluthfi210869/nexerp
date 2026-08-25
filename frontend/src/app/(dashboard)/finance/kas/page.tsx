"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Search, Plus } from "lucide-react";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalMigrationShell,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import { DnaInput, DnaButton } from "@/components/dna";
import { QueryLoading, QueryError } from "@/components/query-states";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

export default function KasPage() {
  const [searchIn, setSearchIn] = React.useState("");
  const [searchOut, setSearchOut] = React.useState("");

  const { data: journals, isLoading, isError } = useQuery<any[]>({
    queryKey: ["kas-journal"],
    queryFn: async () => {
      const res = await api.get("/finance/journal");
      return res.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["finance-stats-kas"],
    queryFn: async () => {
      const resp = await api.get("/finance/dashboard/advanced");
      return resp.data.metrics;
    },
    staleTime: 30000,
  });

  const processed = useMemo(() => {
    if (!journals) return { inflow: [], outflow: [], totalIn: 0, totalOut: 0 };
    const inflow: any[] = [];
    const outflow: any[] = [];
    let totalIn = 0;
    let totalOut = 0;

    for (const j of journals) {
      const cashLines = j.lines?.filter((l: any) => l.account?.code?.startsWith("11")) || [];
      const netCash = cashLines.reduce((s: number, l: any) => s + Number(l.debit || 0) - Number(l.credit || 0), 0);
      if (netCash > 0) {
        inflow.push({ id: j.reference || j.id, date: new Date(j.date).toISOString().split("T")[0], description: j.description || "", amount: netCash });
        totalIn += netCash;
      } else if (netCash < 0) {
        outflow.push({ id: j.reference || j.id, date: new Date(j.date).toISOString().split("T")[0], description: j.description || "", amount: Math.abs(netCash) });
        totalOut += Math.abs(netCash);
      }
    }
    return { inflow, outflow, totalIn, totalOut };
  }, [journals]);

  const filteredIn = processed.inflow.filter(t =>
    t.id.toLowerCase().includes(searchIn.toLowerCase()) || t.description.toLowerCase().includes(searchIn.toLowerCase())
  );
  const filteredOut = processed.outflow.filter(t =>
    t.id.toLowerCase().includes(searchOut.toLowerCase()) || t.description.toLowerCase().includes(searchOut.toLowerCase())
  );

  const inflowColumns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", cell: ({ getValue }: any) => <span className="font-black text-slate-900 text-xs uppercase italic">{String(getValue())}</span> },
      { accessorKey: "date", header: "Tanggal", cell: ({ getValue }: any) => <span className="text-[11px] text-slate-500 tabular-nums">{String(getValue())}</span> },
      { accessorKey: "description", header: "Keterangan", cell: ({ getValue }: any) => <span className="text-xs text-slate-700">{String(getValue() ?? "—")}</span> },
      { accessorKey: "amount", header: () => <div className="text-right">Jumlah</div>, cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums font-black text-xs text-emerald-600">+ {formatOperationalCurrency(getValue())}</div> },
    ],
    [],
  );

  const outflowColumns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", cell: ({ getValue }: any) => <span className="font-black text-slate-900 text-xs uppercase italic">{String(getValue())}</span> },
      { accessorKey: "date", header: "Tanggal", cell: ({ getValue }: any) => <span className="text-[11px] text-slate-500 tabular-nums">{String(getValue())}</span> },
      { accessorKey: "description", header: "Keterangan", cell: ({ getValue }: any) => <span className="text-xs text-slate-700">{String(getValue() ?? "—")}</span> },
      { accessorKey: "amount", header: () => <div className="text-right">Jumlah</div>, cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums font-black text-xs text-rose-600">- {formatOperationalCurrency(getValue())}</div> },
    ],
    [],
  );

  return (
    <OperationalMigrationShell
      title="KAS"
      titleAccent="HUB"
      subtitle="Ringkasan Kas Masuk & Keluar • Consolidated Cash View"
    >
      {isLoading ? (
        <QueryLoading message="Memuat data kas..." />
      ) : isError ? (
        <QueryError error="Gagal memuat data kas" onRetry={() => window.location.reload()} />
      ) : (
        <>
          <OperationalMetricGrid>
            <OperationalMetricCard
              label="Total Kas Masuk"
              value={formatOperationalCurrency(processed.totalIn)}
              helper={stats?.cashIn ? `${((Number(stats.cashIn) / 1000000).toFixed(1))}M Bulan Ini` : undefined}
              icon={<ArrowUpCircle className="h-4 w-4" />}
              tone="green"
            />
            <OperationalMetricCard
              label="Total Kas Keluar"
              value={formatOperationalCurrency(processed.totalOut)}
              helper={stats?.cashOut ? `${((Number(stats.cashOut) / 1000000).toFixed(1))}M Bulan Ini` : undefined}
              icon={<ArrowDownCircle className="h-4 w-4" />}
              tone="red"
            />
            <OperationalMetricCard
              label="Saldo Bersih"
              value={formatOperationalCurrency(processed.totalIn - processed.totalOut)}
              icon={<Wallet className="h-4 w-4" />}
              tone="blue"
            />
          </OperationalMetricGrid>

          <OperationalTabs defaultValue="masuk" className="w-full">
            <OperationalTabsList>
              <OperationalTabsTrigger value="masuk">Kas Masuk</OperationalTabsTrigger>
              <OperationalTabsTrigger value="keluar">Kas Keluar</OperationalTabsTrigger>
            </OperationalTabsList>

            <OperationalTabsContent value="masuk">
              <div className="flex items-center justify-between w-full gap-3">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Kas Masuk</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{filteredIn.length} Records</p>
                </div>
                <div className="flex items-center gap-3">
                  <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari transaksi..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
                  <Link href="/finance/cash-in">
                    <DnaButton variant="primary" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-5 rounded-xl">
                      <Plus className="mr-2 h-4 w-4" /> Tambah Baru
                    </DnaButton>
                  </Link>
                </div>
              </div>
              <OperationalDataTable
                data={filteredIn}
                columns={inflowColumns as any}
                getRowId={(row: any) => row.id}
                searchPlaceholder="Cari transaksi..."
              />
            </OperationalTabsContent>

            <OperationalTabsContent value="keluar">
              <div className="flex items-center justify-between w-full gap-3">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Kas Keluar</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{filteredOut.length} Records</p>
                </div>
                <div className="flex items-center gap-3">
                  <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari transaksi..." value={searchOut} onChange={e => setSearchOut(e.target.value)} />
                  <Link href="/finance/cash-out">
                    <DnaButton variant="primary" className="bg-rose-600 hover:bg-rose-700 h-11 px-5 rounded-xl">
                      <Plus className="mr-2 h-4 w-4" /> Tambah Baru
                    </DnaButton>
                  </Link>
                </div>
              </div>
              <OperationalDataTable
                data={filteredOut}
                columns={outflowColumns as any}
                getRowId={(row: any) => row.id}
                searchPlaceholder="Cari transaksi..."
              />
            </OperationalTabsContent>
          </OperationalTabs>
        </>
      )}
    </OperationalMigrationShell>
  );
}
