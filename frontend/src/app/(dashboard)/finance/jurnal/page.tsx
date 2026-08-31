"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { BookOpen, Layers, GitMerge, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
 MetricCard,
 CanonicalMetricGrid,
 DataTable,
 StatusBadge,
} from "@/components/canonical";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES: Record<string, string> = {
 ASSET: "info",
 LIABILITY: "destructive",
 EQUITY: "info",
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
 const [searchJurnal] = useState("");
 const [searchCoa] = useState("");

 const { data: journals = [] } = useQuery({
 queryKey: ["jurnal-entries"],
 queryFn: async () => {
 try { const res = await api.get("/finance/journal"); return res.data ?? []; }
 catch { return []; }
 },
 });

 const { data: accounts = [] } = useQuery({
 queryKey: ["jurnal-coa"],
 queryFn: async () => {
 try { const res = await api.get("/finance/accounts"); return res.data ?? []; }
 catch { return []; }
 },
 });

 const [mappings] = useState<Record<string, string>>({
 coa_1: "21111",
 coa_7: "11411",
 coa_8: "41211",
 });

 const filteredJournals = useMemo(
 () => (journals as any[]).filter((j) =>
 (j.reference || j.id || "").toLowerCase().includes(searchJurnal.toLowerCase()) ||
 (j.description || "").toLowerCase().includes(searchJurnal.toLowerCase()),
 ),
 [journals, searchJurnal],
 );

 const filteredAccounts = useMemo(
 () => (accounts as any[]).filter((a) =>
 a.code?.toLowerCase().includes(searchCoa.toLowerCase()) ||
 a.name?.toLowerCase().includes(searchCoa.toLowerCase()),
 ),
 [accounts, searchCoa],
 );

 const totalJurnal = (journals as any[]).length;
 const totalAkun = (accounts as any[]).length;
 const activeMappings = Object.keys(mappings).length;

 const jurnalColumns = useMemo<ColumnDef<any, any>[]>(() => [
 {
 id: "ref",
 header: "Referensi",
 cell: ({ row }) => (
 <span className="font-medium text-slate-900">{row.original.reference || row.original.id}</span>
 ),
 },
 {
 id: "date",
 header: "Tanggal",
 accessorFn: (row) => row.date,
 cell: ({ getValue }) => {
 const d = getValue() as string | undefined;
 return (
 <span className="tabular-nums text-slate-600">
 {d ? new Date(d).toISOString().split("T")[0] : "—"}
 </span>
 );
 },
 },
 {
 id: "desc",
 header: "Deskripsi",
 accessorKey: "description",
 cell: ({ getValue }) => (
 <span className="text-slate-700">{String(getValue() ?? "—")}</span>
 ),
 },
 {
 id: "total",
 header: () => <div className="text-right">Total</div>,
 cell: ({ row }) => {
 const total = (row.original.lines ?? []).reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
 return (
 <span className="tabular-nums font-medium text-slate-900">
 Rp {total.toLocaleString()}
 </span>
 );
 },
 },
 ], []);

 const coaColumns = useMemo<ColumnDef<any, any>[]>(() => [
 {
 id: "code",
 header: "Kode",
 cell: ({ row }) => (
 <span className="font-medium text-slate-900 tabular-nums">{row.original.code}</span>
 ),
 },
 {
 id: "name",
 header: "Nama Akun",
 accessorKey: "name",
 cell: ({ getValue }) => (
 <span className="text-slate-700">{String(getValue() ?? "—")}</span>
 ),
 },
 {
 id: "type",
 header: () => <div className="text-center">Tipe</div>,
 cell: ({ row }) => (
 <div className="text-center">
 <StatusBadge
 variant={(ACCOUNT_TYPES[row.original.type] as any) ?? "default"}
 >
 {row.original.type}
 </StatusBadge>
 </div>
 ),
 },
 {
 id: "status",
 header: () => <div className="text-center">Status</div>,
 cell: ({ row }) => (
 <div className="text-center">
 <StatusBadge variant={row.original.isActive ? "success" : "default"}>
 {row.original.isActive ? "ACTIVE" : "INACTIVE"}
 </StatusBadge>
 </div>
 ),
 },
 ], []);

 const mappingColumns = useMemo<ColumnDef<any, any>[]>(() => [
 {
 id: "label",
 header: "Rule",
 accessorKey: "label",
 cell: ({ getValue }) => (
 <span className="font-medium text-slate-900">{String(getValue() ?? "—")}</span>
 ),
 },
 {
 id: "mapping",
 header: "COA Mapping",
 cell: ({ row }) => {
 const val = mappings[row.original.id];
 const coa = STATIC_COA.find((c) => c.kode === val);
 return (
 <span className={cn("font-mono text-[12px]", val ? "text-blue-600" : "text-slate-400")}>
 {coa ? `${coa.kode} — ${coa.nama}` : "— Not Set —"}
 </span>
 );
 },
 },
 {
 id: "status",
 header: () => <div className="text-center">Status</div>,
 cell: ({ row }) => {
 const v = mappings[row.original.id];
 return (
 <div className="text-center">
 <StatusBadge variant={v ? "success" : "default"}>
 {v ? "ACTIVE" : "INACTIVE"}
 </StatusBadge>
 </div>
 );
 },
 },
 ], [mappings]);

 return (
 <DashboardShell
 title="Jurnal Hub"
 subtitle="Jurnal Umum • COA • Auto Journal — Consolidated View"
 >
 <CanonicalMetricGrid>
 <MetricCard
 label="Total Jurnal"
 value={totalJurnal}
 helper="Periode aktif"
 icon={<BookOpen />}
 variant="info"
 />
 <MetricCard
 label="Total Akun (COA)"
 value={totalAkun}
 helper="Chart of Accounts"
 icon={<Layers />}
 variant="neutral"
 />
 <MetricCard
 label="Active Auto Mappings"
 value={`${activeMappings} / ${MAPPING_ITEMS.length}`}
 helper="Auto Journal Rules"
 icon={<GitMerge />}
 variant="success"
 />
 </CanonicalMetricGrid>

 <Tabs defaultValue="jurnal-umum" className="w-full">
 <TabsList className="mb-4 h-auto p-1 bg-white border border-[#E2E8F0] rounded-lg">
 <TabsTrigger value="jurnal-umum" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium">
 Jurnal Umum
 </TabsTrigger>
 <TabsTrigger value="coa" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium">
 COA
 </TabsTrigger>
 <TabsTrigger value="auto-journal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium">
 Auto Journal
 </TabsTrigger>
 </TabsList>

 <TabsContent value="jurnal-umum">
 <DataTable
 title="Jurnal Umum"
 data={filteredJournals.slice(0, 50)}
 columns={jurnalColumns}
 searchPlaceholder="Cari jurnal..."
 emptyMessage="Belum ada jurnal"
 emptyDescription="Transaksi yang sudah dijurnal akan muncul di sini."
 toolbarRight={
 <Link href="/finance/transactions" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700">
 <Plus className="h-3.5 w-3.5" /> Tambah Baru
 </Link>
 }
 />
 </TabsContent>

 <TabsContent value="coa">
 <DataTable
 title="Chart of Accounts"
 data={filteredAccounts}
 columns={coaColumns}
 searchPlaceholder="Cari akun..."
 emptyMessage="Belum ada akun"
 emptyDescription="Account COA akan muncul di sini."
 toolbarRight={
 <Link href="/finance/accounting/coa" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700">
 <Plus className="h-3.5 w-3.5" /> Tambah Baru
 </Link>
 }
 />
 </TabsContent>

 <TabsContent value="auto-journal">
 <DataTable
 title="Auto Journal Mapping"
 data={MAPPING_ITEMS}
 columns={mappingColumns}
 enableSearch={false}
 emptyMessage="Belum ada rule"
 emptyDescription="Rule auto-journal akan muncul di sini."
 toolbarRight={
 <Link href="/finance/accounting/auto-journal" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700">
 <Plus className="h-3.5 w-3.5" /> Konfigurasi
 </Link>
 }
 />
 </TabsContent>
 </Tabs>
 </DashboardShell>
 );
}
