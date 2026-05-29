"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { BookOpen, Layers, GitMerge, Search, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaInput, DnaButton, TableWrapper, DnaBadge } from "@/components/dna";
import { QueryLoading, QueryError } from "@/components/query-states";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES: Record<string, string> = {
  ASSET: "info",
  LIABILITY: "critical",
  EQUITY: "purple",
  REVENUE: "success",
  EXPENSE: "warning",
};

const STATIC_COA = [
  { kode: "11111", nama: "Kas Utama" },
  { kode: "11112", nama: "Kas Kecil" },
  { kode: "11212", nama: "BCA (2640351589)" },
  { kode: "11411", nama: "Piutang Dagang" },
  { kode: "11611", nama: "Persediaan Bahan Baku" },
  { kode: "21111", nama: "Hutang Dagang" },
  { kode: "31111", nama: "Modal Saham" },
  { kode: "41111", nama: "Penjualan" },
  { kode: "51111", nama: "HPP" },
  { kode: "61111", nama: "Beban Gaji" },
];

const MAPPING_ITEMS = [
  { id: "coa_1", label: "Hutang Dagang", default: "21111" },
  { id: "coa_7", label: "Piutang Dagang", default: "11411" },
  { id: "coa_8", label: "Potongan Penjualan", default: "41211" },
  { id: "coa_5", label: "Koreksi Stok", default: "" },
  { id: "coa_6", label: "Persediaan Dalam Perjalanan", default: "" },
];

export default function JurnalPage() {
  const [searchJurnal, setSearchJurnal] = useState("");
  const [searchCoa, setSearchCoa] = useState("");

  const { data: journals, isLoading: jLoading, isError: jError } = useQuery<any[]>({
    queryKey: ["jurnal-entries"],
    queryFn: async () => {
      const res = await api.get("/finance/journal");
      return res.data;
    },
  });

  const { data: accounts, isLoading: aLoading, isError: aError } = useQuery<any[]>({
    queryKey: ["jurnal-coa"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      return res.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["jurnal-stats"],
    queryFn: async () => {
      const resp = await api.get("/finance/dashboard/advanced");
      return resp.data.metrics;
    },
    staleTime: 30000,
  });

  const [mappings, setMappings] = useState<Record<string, string>>({
    coa_1: "21111",
    coa_7: "11411",
    coa_8: "41211",
  });

  const filteredJournals = journals?.filter((j: any) =>
    (j.reference || j.id || "").toLowerCase().includes(searchJurnal.toLowerCase()) ||
    (j.description || "").toLowerCase().includes(searchJurnal.toLowerCase())
  ) || [];

  const filteredAccounts = accounts?.filter((a: any) =>
    a.code.toLowerCase().includes(searchCoa.toLowerCase()) ||
    a.name.toLowerCase().includes(searchCoa.toLowerCase())
  ) || [];

  const totalJurnal = journals?.length || 0;
  const totalAkun = accounts?.length || 0;
  const activeMappings = Object.keys(mappings).length;

  return (
    <DashboardShell
      title="JURNAL"
      titleAccent="HUB"
      subtitle="(Jurnal Umum • COA • Auto Journal — Consolidated View)"
    >
      {jLoading || aLoading ? (
        <QueryLoading message="Memuat data jurnal..." />
      ) : jError || aError ? (
        <QueryError error="Gagal memuat data" onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard icon={<BookOpen className="text-blue-600" />} label="Total Jurnal" value={totalJurnal} subValue={stats?.totalTransactions ? `${stats.totalTransactions} transaksi` : undefined} />
            <StatCard icon={<Layers className="text-emerald-600" />} label="Total Akun (COA)" value={totalAkun} />
            <StatCard icon={<GitMerge className="text-purple-600" />} label="Active Auto Mappings" value={`${activeMappings} / ${MAPPING_ITEMS.length}`} />
          </div>

          <Tabs defaultValue="jurnal-umum" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="jurnal-umum">Jurnal Umum</TabsTrigger>
              <TabsTrigger value="coa">COA</TabsTrigger>
              <TabsTrigger value="auto-journal">Auto Journal</TabsTrigger>
            </TabsList>

            <TabsContent value="jurnal-umum">
              <TableWrapper
                filters={
                  <div className="flex items-center gap-3 w-full justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Jurnal Umum</h3>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{filteredJournals.length} Records</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-64">
                        <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari jurnal..." value={searchJurnal} onChange={e => setSearchJurnal(e.target.value)} />
                      </div>
                      <Link href="/finance/transactions">
                        <DnaButton variant="primary" className="h-11 px-5 rounded-xl">
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
                      <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Referensi</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Tanggal</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Deskripsi</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJournals.slice(0, 50).map((j: any) => {
                      const total = j.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
                      return (
                        <TableRow key={j.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                          <TableCell className="py-3 pl-6 font-black text-slate-900 text-xs uppercase italic">{j.reference || j.id}</TableCell>
                          <TableCell className="py-3 text-[10px] font-medium text-slate-500">{new Date(j.date).toISOString().split("T")[0]}</TableCell>
                          <TableCell className="py-3 text-xs text-slate-700">{j.description || "-"}</TableCell>
                          <TableCell className="py-3 text-right font-mono tabular-nums font-black text-xs text-slate-900">Rp {total.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredJournals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-16 text-center text-[10px] text-slate-400">Belum ada jurnal.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableWrapper>
            </TabsContent>

            <TabsContent value="coa">
              <TableWrapper
                filters={
                  <div className="flex items-center gap-3 w-full justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Chart of Accounts</h3>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{filteredAccounts.length} Akun</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-64">
                        <DnaInput icon={<Search className="h-4 w-4" />} placeholder="Cari akun..." value={searchCoa} onChange={e => setSearchCoa(e.target.value)} />
                      </div>
                      <Link href="/finance/accounting/coa">
                        <DnaButton variant="primary" className="h-11 px-5 rounded-xl">
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
                      <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Kode</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Nama Akun</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Tipe</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((a: any) => (
                      <TableRow key={a.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                        <TableCell className="py-3 pl-6">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">{a.code.substring(0, 3)}</div>
                            <span className="font-black text-slate-900 text-xs uppercase">{a.code}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 font-medium text-xs uppercase text-slate-700">{a.name}</TableCell>
                        <TableCell className="py-3 text-center">
                          <DnaBadge status={(ACCOUNT_TYPES[a.type] || "default") as any}>{a.type}</DnaBadge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <DnaBadge status={a.isActive ? "success" : "default"}>{a.isActive ? "ACTIVE" : "INACTIVE"}</DnaBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAccounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-16 text-center text-[10px] text-slate-400">Belum ada akun.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableWrapper>
            </TabsContent>

            <TabsContent value="auto-journal">
              <TableWrapper
                filters={
                  <div className="flex items-center gap-3 w-full justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Auto Journal Mapping</h3>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{activeMappings} Active Mappings</p>
                    </div>
                    <Link href="/finance/accounting/auto-journal">
                      <DnaButton variant="primary" className="h-11 px-5 rounded-xl">
                        <Plus className="mr-2 h-4 w-4" /> Konfigurasi
                      </DnaButton>
                    </Link>
                  </div>
                }
              >
                <Table className="table-dense">
                  <TableHeader className="bg-slate-50/70">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">Rule</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">COA Mapping</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MAPPING_ITEMS.map((item) => {
                      const val = mappings[item.id];
                      const coa = STATIC_COA.find(c => c.kode === val);
                      return (
                        <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                          <TableCell className="py-3 pl-6 font-black text-slate-900 text-xs uppercase italic">{item.label}</TableCell>
                          <TableCell className="py-3">
                            <span className={cn("font-mono text-xs font-bold", val ? "text-blue-600" : "text-slate-400")}>
                              {coa ? `${coa.kode} — ${coa.nama}` : "— Not Set —"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <DnaBadge status={val ? "success" : "default"}>{val ? "ACTIVE" : "INACTIVE"}</DnaBadge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
