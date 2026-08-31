"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 OperationalDataTable,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalPageShell,
 OperationalPanel,
 OperationalStatusBadge,
 getOperationalStatusLabel,
 OperationalTabs,
 OperationalTabsContent,
 OperationalTabsList,
 OperationalTabsTrigger,
} from "@/components/operational";
import {
 Warehouse,
 TrendingUp,
 Package,
 Truck,
 ArrowRightLeft,
 MoveHorizontal,
 LogIn,
 ArrowRightFromLine,
 RefreshCw,
 Clock,
 CheckCircle2,
 Boxes,
 MapPin,
 ArrowRight,
 ShoppingCart,
 Plus,
} from "lucide-react";

export default function GudangPage() {
 const [tab, setTab] = useState("overview");

 const { data: stats } = useQuery({
 queryKey: ["warehouse-stats-gudang"],
 queryFn: async () => {
 const res = await api.get("/warehouse/stats");
 return res.data;
 },
 });

 const { data: inbounds } = useQuery({
 queryKey: ["warehouse-inbounds-gudang"],
 queryFn: async () => {
 const res = await api.get("/warehouse/inbounds");
 return res.data;
 },
 });

 const { data: releases } = useQuery({
 queryKey: ["warehouse-releases-gudang"],
 queryFn: async () => {
 const res = await api.get("/warehouse/release-requests");
 return res.data;
 },
 });

 const { data: transfers, isLoading: transfersLoading } = useQuery({
 queryKey: ["warehouse-transfers-gudang"],
 queryFn: async () => {
 const res = await api.get("/warehouse/transfers");
 return res.data;
 },
 });

 const { data: mutations, isLoading: mutationsLoading } = useQuery({
 queryKey: ["warehouse-mutations-gudang"],
 queryFn: async () => {
 const res = await api.get("/warehouse/transfers");
 return res.data;
 },
 });

 const { data: requisitions } = useQuery({
 queryKey: ["warehouse-requisitions-gudang"],
 queryFn: async () => {
 const res = await api.get("/warehouse/requisitions");
 return res.data;
 },
 });

 const inboundColumns = React.useMemo(() => [
 {
 accessorKey: "inboundNumber",
 header: "GRN Protocol",
 cell: ({ row }: any) => (
 <span className="font-medium text-[13px]">{row.original.inboundNumber || row.original.id || "—"}</span>
 ),
 },
 {
 accessorKey: "supplier",
 header: "Source",
 cell: ({ getValue }: any) => (
 <div className="flex items-center gap-2">
 <MapPin className="h-3 w-3 text-slate-400" />
 <span className="text-[12px] text-slate-700">{getValue() || 'Direct Inbound'}</span>
 </div>
 ),
 },
 {
 accessorKey: "po",
 header: () => <span className="block text-center">PO Ref</span>,
 cell: ({ getValue }: any) => <span className="block text-center text-[12px] font-medium tabular-nums">{getValue() || "—"}</span>,
 },
 {
 accessorKey: "status",
 header: () => <span className="block text-center">Status</span>,
 cell: ({ getValue }: any) => {
 const value = String(getValue());
 const tone = value === "COMPLETED" ? "success" : value === "PENDING" ? "pending" : "process";
 return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
 },
 },
 {
 accessorKey: "date",
 header: () => <span className="block text-right">Date</span>,
 cell: ({ row }: any) => (
 <span className="block text-right text-[12px] text-slate-500">
 {row.original.receivedAt?.split('T')[0] || row.original.date || "—"}
 </span>
 ),
 },
 ], []);

 const releaseColumns = React.useMemo(() => [
 {
 accessorKey: "releaseNumber",
 header: "Release #",
 cell: ({ row }: any) => <span className="font-medium text-[13px]">{row.original.releaseNumber || row.original.id || "—"}</span>,
 },
 {
 accessorKey: "destination",
 header: "Destination",
 cell: ({ getValue }: any) => (
 <div className="flex items-center gap-2">
 <MapPin className="h-3 w-3 text-slate-400" />
 <span className="text-[12px] text-slate-700">{getValue() || 'Production'}</span>
 </div>
 ),
 },
 {
 id: "items",
 header: () => <span className="block text-center">Items</span>,
 cell: ({ row }: any) => <span className="block text-center text-[12px] font-medium tabular-nums">{row.original.items?.length ?? 0}</span>,
 },
 {
 accessorKey: "status",
 header: () => <span className="block text-center">Status</span>,
 cell: ({ getValue }: any) => {
 const value = String(getValue());
 const tone = value === "COMPLETED" ? "success" : value === "PROCESSING" ? "process" : "pending";
 return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
 },
 },
 {
 accessorKey: "requestedAt",
 header: () => <span className="block text-right">Date</span>,
 cell: ({ getValue }: any) => <span className="block text-right text-[12px] text-slate-500">{getValue()?.split('T')[0] || "—"}</span>,
 },
 ], []);

 const transferColumns = React.useMemo(() => [
 {
 accessorKey: "transferNumber",
 header: "Transfer #",
 cell: ({ row }: any) => <span className="font-medium text-[13px]">{row.original.transferNumber || row.original.id || "—"}</span>,
 },
 {
 id: "route",
 header: "Route",
 cell: ({ row }: any) => {
 const trf = row.original;
 return (
 <div className="flex items-center gap-2">
 <span className="text-[12px] text-slate-700">{trf.sourceWarehouse?.name || 'WH-A'}</span>
 <ArrowRight className="h-3 w-3 text-indigo-400" />
 <span className="text-[12px] text-slate-700">{trf.destWarehouse?.name || 'WH-B'}</span>
 </div>
 );
 },
 },
 {
 id: "items",
 header: () => <span className="block text-center">Items</span>,
 cell: ({ row }: any) => <span className="block text-center text-[12px] font-medium tabular-nums">{row.original.items?.length ?? 0}</span>,
 },
 {
 accessorKey: "status",
 header: () => <span className="block text-center">Status</span>,
 cell: ({ getValue }: any) => {
 const value = String(getValue());
 const tone = value === "COMPLETED" ? "success" : value === "PENDING" ? "pending" : "process";
 return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
 },
 },
 {
 accessorKey: "createdAt",
 header: () => <span className="block text-right">Date</span>,
 cell: ({ row }: any) => <span className="block text-right text-[12px] text-slate-500">{row.original.createdAt?.split('T')[0] || row.original.date || "—"}</span>,
 },
 ], []);

 const mutationColumns = React.useMemo(() => [
 {
 accessorKey: "transferNumber",
 header: "Mutation #",
 cell: ({ row }: any) => <span className="font-medium text-[13px]">{row.original.transferNumber || row.original.id || "—"}</span>,
 },
 {
 accessorKey: "type",
 header: "Type",
 cell: ({ getValue }: any) => (
 <div className="flex items-center gap-2">
 <ArrowRightLeft className="h-3 w-3 text-slate-400" />
 <span className="text-[12px] text-slate-700">{getValue() || 'TRANSFER'}</span>
 </div>
 ),
 },
 {
 id: "items",
 header: () => <span className="block text-center">Items</span>,
 cell: ({ row }: any) => <span className="block text-center text-[12px] font-medium tabular-nums">{row.original.items?.length ?? 0}</span>,
 },
 {
 accessorKey: "status",
 header: () => <span className="block text-center">Status</span>,
 cell: ({ getValue }: any) => {
 const value = String(getValue());
 const tone = value === "COMPLETED" ? "success" : value === "PENDING" ? "pending" : "process";
 return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
 },
 },
 {
 accessorKey: "createdAt",
 header: () => <span className="block text-right">Date</span>,
 cell: ({ row }: any) => <span className="block text-right text-[12px] text-slate-500">{row.original.createdAt?.split('T')[0] || row.original.date || "—"}</span>,
 },
 ], []);

 const requisitionColumns = React.useMemo(() => [
 {
 accessorKey: "reqNumber",
 header: "ID Permintaan",
 cell: ({ row }: any) => (
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
 <ShoppingCart className="h-4 w-4 text-blue-600" />
 </div>
 <span className="font-medium text-[13px]">{row.original.reqNumber || row.original.id || "—"}</span>
 </div>
 ),
 },
 {
 id: "route",
 header: "Asal / Tujuan",
 cell: ({ row }: any) => {
 const req = row.original;
 return (
 <div className="flex items-center gap-2">
 <span className="text-[12px] text-slate-700">{req.fromWh?.name || req.fromWarehouse || "—"}</span>
 <ArrowRight className="h-3 w-3 text-blue-400" />
 <span className="text-[12px] text-blue-600 font-medium">{req.toWh?.name || req.toWarehouse || "—"}</span>
 </div>
 );
 },
 },
 {
 id: "requester",
 header: "Peminta / Catatan",
 cell: ({ row }: any) => {
 const req = row.original;
 return (
 <div className="flex flex-col">
 <span className="text-[12px] font-medium text-slate-700">{req.requester?.fullName || req.createdById || "—"}</span>
 <span className="text-[10px] text-slate-400">{req.notes || ""}</span>
 </div>
 );
 },
 },
 {
 accessorKey: "status",
 header: () => <span className="block text-center">Status</span>,
 cell: ({ getValue }: any) => {
 const value = String(getValue());
 const tone = value === "APPROVED" ? "success" : value === "REJECTED" ? "danger" : "pending";
 return <div className="flex justify-center"><OperationalStatusBadge status={tone}>{getOperationalStatusLabel(value)}</OperationalStatusBadge></div>;
 },
 },
 {
 accessorKey: "requestDate",
 header: () => <span className="block text-right">Tanggal</span>,
 cell: ({ row }: any) => <span className="block text-right text-[12px] text-slate-500">{row.original.requestDate?.split('T')[0] || row.original.date?.split('T')[0] || "—"}</span>,
 },
 ], []);

 return (
 <OperationalPageShell title="Gudang" subtitle="Consolidated warehouse operations & command terminal">
 <OperationalTabs value={tab} onValueChange={setTab}>
 <OperationalTabsList>
 <OperationalTabsTrigger value="overview"><Warehouse /> Overview</OperationalTabsTrigger>
 <OperationalTabsTrigger value="penerimaan"><LogIn /> Penerimaan</OperationalTabsTrigger>
 <OperationalTabsTrigger value="pengeluaran"><ArrowRightFromLine /> Pengeluaran</OperationalTabsTrigger>
 <OperationalTabsTrigger value="transfer"><ArrowRightLeft /> Transfer Barang</OperationalTabsTrigger>
 <OperationalTabsTrigger value="mutasi"><MoveHorizontal /> Mutasi Barang</OperationalTabsTrigger>
 <OperationalTabsTrigger value="requisition"><ShoppingCart /> Permintaan Barang</OperationalTabsTrigger>
 </OperationalTabsList>

 <OperationalTabsContent value="overview">
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard label="Kapasitas" value={`${stats?.capacity?.utility || 0}%`} helper="Storage utility" icon={<Truck />} tone="blue" />
 <OperationalMetricCard label="Akurasi" value={`${typeof stats?.capacity?.accuracy === 'number' ? stats.capacity.accuracy.toFixed(1) : '0'}%`} helper="Inventory accuracy" icon={<CheckCircle2 />} tone="green" />
 <OperationalMetricCard label="Turnover" value={`${stats?.turnover?.ratio || 0}x`} helper="Turnover ratio" icon={<RefreshCw />} tone="amber" />
 <OperationalMetricCard label="Dead Stock" value={`Rp ${(stats?.risk?.deadStock || 0).toLocaleString('id-ID')}`} helper="Risk value" icon={<Package />} tone="red" />
 </OperationalMetricGrid>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <OperationalPanel>
 <div className="operational-panel-header">
 <h3 className="operational-panel-title">Penerimaan Terkini</h3>
 <span className="h-2 w-2 rounded-full bg-blue-500" />
 </div>
 <div className="space-y-3">
 {inbounds?.slice(0, 5).map((grn: any) => (
 <div key={grn.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
 <LogIn className="h-4 w-4 text-blue-600" />
 </div>
 <div>
 <p className="text-[13px] font-medium">{grn.inboundNumber || grn.id || "—"}</p>
 <p className="text-[11px] text-slate-400">{grn.supplier || 'Direct'}</p>
 </div>
 </div>
 <OperationalStatusBadge status={grn.status === 'COMPLETED' ? 'success' : 'pending'}>
 {getOperationalStatusLabel(grn.status)}
 </OperationalStatusBadge>
 </div>
 ))}
 {(!inbounds || inbounds.length === 0) && (
 <p className="text-center text-slate-400 text-xs font-medium py-6">No inbound records</p>
 )}
 </div>
 </OperationalPanel>

 <OperationalPanel>
 <div className="operational-panel-header">
 <h3 className="operational-panel-title">Transfer Terkini</h3>
 <span className="h-2 w-2 rounded-full bg-indigo-500" />
 </div>
 <div className="space-y-3">
 {transfers?.slice(0, 5).map((trf: any) => (
 <div key={trf.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
 <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
 </div>
 <div>
 <p className="text-[13px] font-medium">{trf.transferNumber || trf.id || "—"}</p>
 <p className="text-[11px] text-slate-400">{trf.sourceWarehouse?.name || "—"} → {trf.destWarehouse?.name || "—"}</p>
 </div>
 </div>
 <OperationalStatusBadge status={trf.status === 'COMPLETED' ? 'success' : 'pending'}>
 {getOperationalStatusLabel(trf.status)}
 </OperationalStatusBadge>
 </div>
 ))}
 {(!transfers || transfers.length === 0) && (
 <p className="text-center text-slate-400 text-xs font-medium py-6">No transfer records</p>
 )}
 </div>
 </OperationalPanel>
 </div>
 </div>
 </OperationalTabsContent>

 <OperationalTabsContent value="penerimaan">
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard label="Total Penerimaan" value={String(inbounds?.length || 0)} helper="All time" icon={<LogIn />} tone="blue" />
 <OperationalMetricCard label="Completed" value={String(inbounds?.filter((g: any) => g.status === 'COMPLETED').length || 0)} helper="Verified" icon={<CheckCircle2 />} tone="green" />
 <OperationalMetricCard label="Pending" value={String(inbounds?.filter((g: any) => g.status !== 'COMPLETED').length || 0)} helper="Awaiting" icon={<Clock />} tone="amber" />
 <OperationalMetricCard label="Suppliers" value={String(new Set(inbounds?.map((g: any) => g.supplier).filter(Boolean)).size || 0)} helper="Active vendors" icon={<Truck />} />
 </OperationalMetricGrid>
 <OperationalDataTable
 data={(inbounds || []) as any[]}
 columns={inboundColumns}
 getRowId={(item: any) => item.id}
 searchPlaceholder="Cari inbound..."
 />
 </div>
 </OperationalTabsContent>

 <OperationalTabsContent value="pengeluaran">
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard label="Total Release" value={String(releases?.length || 0)} helper="All requests" icon={<ArrowRightFromLine />} tone="blue" />
 <OperationalMetricCard label="Completed" value={String(releases?.filter((r: any) => r.status === 'COMPLETED').length || 0)} helper="Fulfilled" icon={<CheckCircle2 />} tone="green" />
 <OperationalMetricCard label="In Progress" value={String(releases?.filter((r: any) => r.status === 'PROCESSING').length || 0)} helper="Active" icon={<RefreshCw />} tone="amber" />
 <OperationalMetricCard label="Pending" value={String(releases?.filter((r: any) => r.status === 'PENDING').length || 0)} helper="Awaiting" icon={<Clock />} tone="red" />
 </OperationalMetricGrid>
 <OperationalDataTable
 data={(releases || []) as any[]}
 columns={releaseColumns}
 getRowId={(item: any) => item.id}
 searchPlaceholder="Cari release..."
 />
 </div>
 </OperationalTabsContent>

 <OperationalTabsContent value="transfer">
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard label="Total Transfer" value={String(transfers?.length || 0)} helper="All orders" icon={<ArrowRightLeft />} tone="blue" />
 <OperationalMetricCard label="Completed" value={String(transfers?.filter((t: any) => t.status === 'COMPLETED').length || 0)} helper="Synced" icon={<CheckCircle2 />} tone="green" />
 <OperationalMetricCard label="Pending" value={String(transfers?.filter((t: any) => t.status === 'PENDING').length || 0)} helper="Awaiting exec" icon={<Clock />} tone="amber" />
 <OperationalMetricCard label="Items in Transit" value={String(transfers?.reduce((s: number, t: any) => s + (t.items?.length || 0), 0) || 0)} helper="Total SKU" icon={<Boxes />} />
 </OperationalMetricGrid>
 <OperationalDataTable
 data={(transfers || []) as any[]}
 columns={transferColumns}
 getRowId={(item: any) => item.id}
 loading={transfersLoading}
 searchPlaceholder="Cari transfer..."
 />
 </div>
 </OperationalTabsContent>

 <OperationalTabsContent value="mutasi">
 <div className="operational-stack">
 <OperationalMetricGrid>
 <OperationalMetricCard label="Total Mutasi" value={String(mutations?.length || 0)} helper="All records" icon={<MoveHorizontal />} tone="blue" />
 <OperationalMetricCard label="Completed" value={String(mutations?.filter((m: any) => m.status === 'COMPLETED').length || 0)} helper="Synced" icon={<CheckCircle2 />} tone="green" />
 <OperationalMetricCard label="Pending" value={String(mutations?.filter((m: any) => m.status === 'PENDING').length || 0)} helper="In progress" icon={<Clock />} tone="amber" />
 <OperationalMetricCard label="SKU Affected" value={String(mutations?.reduce((s: number, m: any) => s + (m.items?.length || 0), 0) || 0)} helper="Total items" icon={<Boxes />} />
 </OperationalMetricGrid>
 <OperationalDataTable
 data={(mutations || []) as any[]}
 columns={mutationColumns}
 getRowId={(item: any) => item.id}
 loading={mutationsLoading}
 searchPlaceholder="Cari mutasi..."
 />
 </div>
 </OperationalTabsContent>

 <OperationalTabsContent value="requisition">
 <div className="operational-stack">
 <div className="flex justify-end">
 <a href="/scm/warehouse/requisition">
 <button type="button" className="operational-button is-primary">
 <Plus className="h-4 w-4" />
 <span>Tambah Baru</span>
 </button>
 </a>
 </div>
 <OperationalDataTable
 data={(requisitions || []) as any[]}
 columns={requisitionColumns}
 getRowId={(item: any) => item.id}
 searchPlaceholder="Cari requisition..."
 />
 </div>
 </OperationalTabsContent>
 </OperationalTabs>
 </OperationalPageShell>
 );
}
