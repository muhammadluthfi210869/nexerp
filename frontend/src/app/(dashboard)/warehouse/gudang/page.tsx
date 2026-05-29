"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/dna/StatCard";
import { DataCard } from "@/components/dna/DataCard";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DnaBadge } from "@/components/dna/DnaBadge";
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
  Loader2,
  Boxes,
  MapPin,
  ArrowRight,
  ShoppingCart,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  return (
    <DashboardShell title="Gudang" titleAccent="Warehouse" subtitle="Consolidated Warehouse Operations & Command Terminal">
      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-14 w-fit">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <Warehouse className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="penerimaan" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <LogIn className="w-4 h-4" /> Penerimaan
          </TabsTrigger>
          <TabsTrigger value="pengeluaran" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <ArrowRightFromLine className="w-4 h-4" /> Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="transfer" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Transfer Barang
          </TabsTrigger>
          <TabsTrigger value="mutasi" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <MoveHorizontal className="w-4 h-4" /> Mutasi Barang
          </TabsTrigger>
          <TabsTrigger value="requisition" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest px-6 gap-2">
            <ShoppingCart className="w-4 h-4" /> Permintaan Barang
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Kapasitas" value={`${stats?.capacity?.utility || 0}%`} subValue="Storage Utility" icon={<Truck />} />
            <StatCard label="Akurasi" value={`${typeof stats?.capacity?.accuracy === 'number' ? stats.capacity.accuracy.toFixed(1) : '0'}%`} subValue="Inventory Accuracy" icon={<CheckCircle2 />} />
            <StatCard label="Turnover" value={`${stats?.turnover?.ratio || 0}x`} subValue="Turnover Ratio" icon={<RefreshCw />} />
            <StatCard label="Dead Stock" value={`Rp ${(stats?.risk?.deadStock || 0).toLocaleString()}`} subValue="Risk Value" icon={<Package />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DataCard title="Penerimaan Terkini" dotColor="bg-blue-500">
              <div className="space-y-4">
                {inbounds?.slice(0, 5).map((grn: any) => (
                  <div key={grn.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <LogIn className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase">{grn.inboundNumber || grn.id}</p>
                        <p className="text-[9px] font-bold text-slate-400">{grn.supplier || 'Direct'}</p>
                      </div>
                    </div>
                    <DnaBadge status={grn.status === 'COMPLETED' ? 'success' : 'warning'}>{grn.status}</DnaBadge>
                  </div>
                ))}
                {(!inbounds || inbounds.length === 0) && (
                  <p className="text-center text-slate-400 text-xs font-bold uppercase italic py-6">No inbound records</p>
                )}
              </div>
            </DataCard>

            <DataCard title="Transfer Terkini" dotColor="bg-indigo-500">
              <div className="space-y-4">
                {transfers?.slice(0, 5).map((trf: any) => (
                  <div key={trf.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase">{trf.transferNumber || trf.id}</p>
                        <p className="text-[9px] font-bold text-slate-400">{trf.sourceWarehouse?.name} → {trf.destWarehouse?.name}</p>
                      </div>
                    </div>
                    <DnaBadge status={trf.status === 'COMPLETED' ? 'success' : 'warning'}>{trf.status}</DnaBadge>
                  </div>
                ))}
                {(!transfers || transfers.length === 0) && (
                  <p className="text-center text-slate-400 text-xs font-bold uppercase italic py-6">No transfer records</p>
                )}
              </div>
            </DataCard>
          </div>
        </TabsContent>

        <TabsContent value="penerimaan" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Penerimaan" value={String(inbounds?.length || 0)} subValue="All Time" icon={<LogIn />} />
            <StatCard label="Completed" value={String(inbounds?.filter((g: any) => g.status === 'COMPLETED').length || 0)} subValue="Verified" icon={<CheckCircle2 />} />
            <StatCard label="Pending" value={String(inbounds?.filter((g: any) => g.status !== 'COMPLETED').length || 0)} subValue="Awaiting" icon={<Clock />} />
            <StatCard label="Suppliers" value={String(new Set(inbounds?.map((g: any) => g.supplier).filter(Boolean)).size || 0)} subValue="Active Vendors" icon={<Truck />} />
          </div>

          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">GRN Protocol</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">PO Ref</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inbounds?.map((grn: any) => (
                    <tr key={grn.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-black uppercase italic">{grn.inboundNumber || grn.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-600">{grn.supplier || 'Direct Inbound'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] font-black tabular">{grn.po || '-'}</td>
                      <td className="px-6 py-5 text-center">
                        <DnaBadge status={grn.status === 'COMPLETED' ? 'success' : 'warning'}>{grn.status}</DnaBadge>
                      </td>
                      <td className="px-6 py-5 text-right text-[10px] font-bold text-slate-400">{grn.receivedAt?.split('T')[0] || grn.date || '-'}</td>
                    </tr>
                  ))}
                  {(!inbounds || inbounds.length === 0) && (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-slate-400 text-xs font-bold uppercase italic">No inbound records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="pengeluaran" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Release" value={String(releases?.length || 0)} subValue="All Requests" icon={<ArrowRightFromLine />} />
            <StatCard label="Completed" value={String(releases?.filter((r: any) => r.status === 'COMPLETED').length || 0)} subValue="Fulfilled" icon={<CheckCircle2 />} />
            <StatCard label="In Progress" value={String(releases?.filter((r: any) => r.status === 'PROCESSING').length || 0)} subValue="Active" icon={<RefreshCw />} />
            <StatCard label="Pending" value={String(releases?.filter((r: any) => r.status === 'PENDING').length || 0)} subValue="Awaiting" icon={<Clock />} />
          </div>

          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Release #</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {releases?.map((rel: any) => (
                    <tr key={rel.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-black uppercase italic">{rel.releaseNumber || rel.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-600">{rel.destination || 'Production'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] font-black tabular">{rel.items?.length || 0}</td>
                      <td className="px-6 py-5 text-center">
                        <DnaBadge status={rel.status === 'COMPLETED' ? 'success' : rel.status === 'PROCESSING' ? 'info' : 'warning'}>{rel.status}</DnaBadge>
                      </td>
                      <td className="px-6 py-5 text-right text-[10px] font-bold text-slate-400">{rel.requestedAt?.split('T')[0] || '-'}</td>
                    </tr>
                  ))}
                  {(!releases || releases.length === 0) && (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-slate-400 text-xs font-bold uppercase italic">No release requests found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Transfer" value={String(transfers?.length || 0)} subValue="All Orders" icon={<ArrowRightLeft />} />
            <StatCard label="Completed" value={String(transfers?.filter((t: any) => t.status === 'COMPLETED').length || 0)} subValue="Synced" icon={<CheckCircle2 />} />
            <StatCard label="Pending" value={String(transfers?.filter((t: any) => t.status === 'PENDING').length || 0)} subValue="Awaiting Exec" icon={<Clock />} />
            <StatCard label="Items in Transit" value={String(transfers?.reduce((s: number, t: any) => s + (t.items?.length || 0), 0) || 0)} subValue="Total SKU" icon={<Boxes />} />
          </div>

          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Transfer #</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Route</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers?.map((trf: any) => (
                    <tr key={trf.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-black uppercase italic">{trf.transferNumber || trf.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-600">{trf.sourceWarehouse?.name || 'WH-A'}</span>
                          <ArrowRight className="h-3 w-3 text-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-600">{trf.destWarehouse?.name || 'WH-B'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] font-black tabular">{trf.items?.length || 0}</td>
                      <td className="px-6 py-5 text-center">
                        <DnaBadge status={trf.status === 'COMPLETED' ? 'success' : 'warning'}>{trf.status}</DnaBadge>
                      </td>
                      <td className="px-6 py-5 text-right text-[10px] font-bold text-slate-400">{trf.createdAt?.split('T')[0] || trf.date || '-'}</td>
                    </tr>
                  ))}
                  {(!transfers || transfers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-slate-400 text-xs font-bold uppercase italic">No transfer orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="mutasi" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Mutasi" value={String(mutations?.length || 0)} subValue="All Records" icon={<MoveHorizontal />} />
            <StatCard label="Completed" value={String(mutations?.filter((m: any) => m.status === 'COMPLETED').length || 0)} subValue="Synced" icon={<CheckCircle2 />} />
            <StatCard label="Pending" value={String(mutations?.filter((m: any) => m.status === 'PENDING').length || 0)} subValue="In Progress" icon={<Clock />} />
            <StatCard label="SKU Affected" value={String(mutations?.reduce((s: number, m: any) => s + (m.items?.length || 0), 0) || 0)} subValue="Total Items" icon={<Boxes />} />
          </div>

          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mutation #</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mutations?.map((mut: any) => (
                    <tr key={mut.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-black uppercase italic">{mut.transferNumber || mut.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-600">{mut.type || 'TRANSFER'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] font-black tabular">{mut.items?.length || 0}</td>
                      <td className="px-6 py-5 text-center">
                        <DnaBadge status={mut.status === 'COMPLETED' ? 'success' : 'warning'}>{mut.status}</DnaBadge>
                      </td>
                      <td className="px-6 py-5 text-right text-[10px] font-bold text-slate-400">{mut.createdAt?.split('T')[0] || mut.date || '-'}</td>
                    </tr>
                  ))}
                  {(!mutations || mutations.length === 0) && (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-slate-400 text-xs font-bold uppercase italic">No mutation records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="requisition" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end">
            <a href="/scm/warehouse/requisition">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 h-11 font-black uppercase text-[11px] tracking-tighter shadow-xl shadow-blue-500/20">
                <Plus className="w-4 h-4 mr-2" /> Tambah Baru
              </Button>
            </a>
          </div>

          <TableWrapper>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Permintaan</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asal / Tujuan</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Peminta / Catatan</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requisitions?.map((req: any) => (
                    <tr key={req.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-600/10 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-[11px] font-black uppercase italic">{req.reqNumber || req.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-600">{req.fromWh?.name || req.fromWarehouse || '-'}</span>
                          <ArrowRight className="h-3 w-3 text-blue-400" />
                          <span className="text-[10px] font-bold text-blue-600">{req.toWh?.name || req.toWarehouse || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-600">{req.requester?.fullName || req.createdById || '-'}</span>
                          <span className="text-[9px] text-slate-400">{req.notes || ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <DnaBadge status={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'default' : 'warning'}>
                          {req.status}
                        </DnaBadge>
                      </td>
                      <td className="px-6 py-5 text-right text-[10px] font-bold text-slate-400">
                        {req.requestDate?.split('T')[0] || req.date?.split('T')[0] || '-'}
                      </td>
                    </tr>
                  ))}
                  {(!requisitions || requisitions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-slate-400 text-xs font-bold uppercase italic">No requisition records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableWrapper>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
