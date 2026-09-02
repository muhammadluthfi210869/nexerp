"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Search, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaInput, DnaButton, TableWrapper, DnaBadge } from "@/components/dna";
import { QueryLoading, QueryError } from "@/components/query-states";
import { cn } from "@/lib/utils";

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

  return (
    <DashboardShell
      title="KAS"
      titleAccent="HUB"
      subtitle="(Ringkasan Kas Masuk & Keluar • Consolidated Cash View)"
    >
      {isLoading ? (
        <QueryLoading message="Memuat data kas..." />
      ) : isError ? (
        <QueryError error="Gagal memuat data kas" onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard icon={<ArrowUpCircle className="text-emerald-600" />} label="Total Kas Masuk" value={`Rp ${processed.totalIn.toLocaleString()}`} subValue={stats?.cashIn ? `${((Number(stats.cashIn) / 1000000).toFixed(1))}M Bulan Ini` : undefined} />
            <StatCard icon={<ArrowDownCircle className="text-rose-600" />} label="Total Kas Keluar" value={`Rp ${processed.totalOut.toLocaleString()}`} subValue={stats?.cashOut ? `${((Number(stats.cashOut) / 1000000).toFixed(1))}M Bulan Ini` : undefined} />
            <StatCard icon={<Wallet className="text-blue-600" />} label="Saldo Bersih" value={`Rp ${(processed.totalIn - processed.totalOut).toLocaleString()}`} />
          </div>

          <Tabs defaultValue="masuk" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="masuk">Kas Masuk</TabsTrigger>
              <TabsTrigger value="keluar">Kas Keluar</TabsTrigger>
            </TabsList>

            <TabsContent value="masuk">
              <TableWrapper
                filters={
                  <div className="flex items-center gap-3 w-full justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Kas Masuk</h3>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{filteredIn.length} Records</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-64">
                        <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari transaksi..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
                      </div>
                      <Link href="/finance/cash-in">
                        <DnaButton variant="primary" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-5 rounded-xl">
                          <Plus className="mr-2 h-4 w-4" /> Tambah Baru
                        </DnaButton>
                      </Link>
                    </div>
                  </div>
                }
              >
                <Table className="table-dense">
                  <TableHeader className="bg-slate-50/70">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">ID</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Tanggal</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Keterangan</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIn.map((t: any) => (
                      <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                        <TableCell className="py-3 pl-6 font-black text-slate-900 text-xs uppercase italic">{t.id}</TableCell>
                        <TableCell className="py-3 text-[10px] font-medium text-slate-500">{t.date}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-700">{t.description}</TableCell>
                        <TableCell className="py-3 text-right font-mono tabular-nums font-black text-xs text-emerald-600">+ Rp {t.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {filteredIn.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-16 text-center text-[10px] text-slate-400">Belum ada transaksi kas masuk.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableWrapper>
            </TabsContent>

            <TabsContent value="keluar">
              <TableWrapper
                filters={
                  <div className="flex items-center gap-3 w-full justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Kas Keluar</h3>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{filteredOut.length} Records</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-64">
                        <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari transaksi..." value={searchOut} onChange={e => setSearchOut(e.target.value)} />
                      </div>
                      <Link href="/finance/cash-out">
                        <DnaButton variant="primary" className="bg-rose-600 hover:bg-rose-700 h-11 px-5 rounded-xl">
                          <Plus className="mr-2 h-4 w-4" /> Tambah Baru
                        </DnaButton>
                      </Link>
                    </div>
                  </div>
                }
              >
                <Table className="table-dense">
                  <TableHeader className="bg-slate-50/70">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">ID</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Tanggal</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Keterangan</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOut.map((t: any) => (
                      <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                        <TableCell className="py-3 pl-6 font-black text-slate-900 text-xs uppercase italic">{t.id}</TableCell>
                        <TableCell className="py-3 text-[10px] font-medium text-slate-500">{t.date}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-700">{t.description}</TableCell>
                        <TableCell className="py-3 text-right font-mono tabular-nums font-black text-xs text-rose-600">- Rp {t.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {filteredOut.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-16 text-center text-[10px] text-slate-400">Belum ada transaksi kas keluar.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableWrapper>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}
