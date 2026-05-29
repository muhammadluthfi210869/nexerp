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
import { DataCard, TableWrapper, StatCard, DnaBadge, DnaButton } from "@/components/dna";
import {
  ClipboardList,
  FlaskConical,
  Droplets,
  Package,
  Archive,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function OperationsPage() {
  const [tab, setTab] = useState("work-orders");

  const { data: workOrders } = useQuery({
    queryKey: ["ops-work-orders"],
    queryFn: async () => (await api.get("/production/work-orders")).data,
  });

  const { data: mixing } = useQuery({
    queryKey: ["ops-mixing"],
    queryFn: async () => (await api.get("/production/schedules?stage=MIXING")).data,
  });

  const { data: filling } = useQuery({
    queryKey: ["ops-filling"],
    queryFn: async () => (await api.get("/production/schedules?stage=FILLING")).data,
  });

  const { data: packing } = useQuery({
    queryKey: ["ops-packing"],
    queryFn: async () => (await api.get("/production/schedules?stage=PACKING")).data,
  });

  const { data: batchRecords } = useQuery({
    queryKey: ["ops-batch-records"],
    queryFn: async () => (await api.get("/production/batch-records")).data,
  });

  const woList = Array.isArray(workOrders) ? workOrders : [];
  const mixingList = Array.isArray(mixing) ? mixing : [];
  const fillingList = Array.isArray(filling) ? filling : [];
  const packingList = Array.isArray(packing) ? packing : [];
  const batchList = Array.isArray(batchRecords) ? batchRecords : [];

  return (
    <DashboardShell
      title="Operasional"
      titleAccent="Produksi"
      subtitle="Work Orders, Terminal, & Batch Records"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="work-orders">
            <ClipboardList className="h-4 w-4 mr-2" />
            Work Orders
          </TabsTrigger>
          <TabsTrigger value="mixing">
            <FlaskConical className="h-4 w-4 mr-2" />
            Mixing
          </TabsTrigger>
          <TabsTrigger value="filling">
            <Droplets className="h-4 w-4 mr-2" />
            Filling
          </TabsTrigger>
          <TabsTrigger value="packing">
            <Package className="h-4 w-4 mr-2" />
            Packing
          </TabsTrigger>
          <TabsTrigger value="batch-records">
            <Archive className="h-4 w-4 mr-2" />
            Batch Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders" className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total WO" value={woList.length} />
            <StatCard label="Active" value={woList.filter((w: any) => w.status === "IN_PROGRESS").length} />
            <StatCard label="Finished" value={woList.filter((w: any) => w.status === "DONE").length} />
          </div>
          <DataCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Work Orders</h3>
              <Link href="/production/work-orders" className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">
                Kelola WO <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">WO</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Produk</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {woList.slice(0, 10).map((wo: any) => (
                    <tr key={wo.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-xs font-bold text-slate-900">{wo.woNumber || wo.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{wo.productName || wo.lead?.clientName || "-"}</td>
                      <td className="py-3 px-4">
                        <DnaBadge status={wo.status === "DONE" ? "success" : wo.status === "IN_PROGRESS" ? "warning" : "info"}>
                          {wo.status || "PLANNING"}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-slate-600">{wo.targetQty || "-"}</td>
                    </tr>
                  ))}
                  {woList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">Belum ada work orders</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </DataCard>
        </TabsContent>

        <TabsContent value="mixing" className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Jadwal Mixing" value={mixingList.length} />
            <StatCard label="Active" value={mixingList.filter((s: any) => s.status === "IN_PROGRESS").length} />
            <StatCard label="Pending" value={mixingList.filter((s: any) => s.status === "PENDING").length} />
          </div>
          <DataCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Jadwal Mixing</h3>
              <Link href="/production/terminal/mixing" className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">
                Buka Terminal <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Schedule</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">WO</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {mixingList.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-xs font-bold text-slate-900">{s.scheduleCode || s.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{s.workOrderId?.slice(0, 8) || "-"}</td>
                      <td className="py-3 px-4">
                        <DnaBadge status={s.status === "DONE" ? "success" : s.status === "IN_PROGRESS" ? "warning" : "info"}>
                          {s.status || "PENDING"}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-slate-600">{s.targetQty || "-"}</td>
                    </tr>
                  ))}
                  {mixingList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">Belum ada jadwal mixing</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </DataCard>
        </TabsContent>

        <TabsContent value="filling" className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Jadwal Filling" value={fillingList.length} />
            <StatCard label="Active" value={fillingList.filter((s: any) => s.status === "IN_PROGRESS").length} />
            <StatCard label="Pending" value={fillingList.filter((s: any) => s.status === "PENDING").length} />
          </div>
          <DataCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Jadwal Filling</h3>
              <Link href="/production/terminal/filling" className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">
                Buka Terminal <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Schedule</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">WO</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {fillingList.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-xs font-bold text-slate-900">{s.scheduleCode || s.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{s.workOrderId?.slice(0, 8) || "-"}</td>
                      <td className="py-3 px-4">
                        <DnaBadge status={s.status === "DONE" ? "success" : s.status === "IN_PROGRESS" ? "warning" : "info"}>
                          {s.status || "PENDING"}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-slate-600">{s.targetQty || "-"}</td>
                    </tr>
                  ))}
                  {fillingList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">Belum ada jadwal filling</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </DataCard>
        </TabsContent>

        <TabsContent value="packing" className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Jadwal Packing" value={packingList.length} />
            <StatCard label="Active" value={packingList.filter((s: any) => s.status === "IN_PROGRESS").length} />
            <StatCard label="Pending" value={packingList.filter((s: any) => s.status === "PENDING").length} />
          </div>
          <DataCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Jadwal Packing</h3>
              <Link href="/production/terminal/packing" className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">
                Buka Terminal <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Schedule</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">WO</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {packingList.slice(0, 10).map((s: any) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-xs font-bold text-slate-900">{s.scheduleCode || s.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{s.workOrderId?.slice(0, 8) || "-"}</td>
                      <td className="py-3 px-4">
                        <DnaBadge status={s.status === "DONE" ? "success" : s.status === "IN_PROGRESS" ? "warning" : "info"}>
                          {s.status || "PENDING"}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-slate-600">{s.targetQty || "-"}</td>
                    </tr>
                  ))}
                  {packingList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">Belum ada jadwal packing</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </DataCard>
        </TabsContent>

        <TabsContent value="batch-records" className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Batch Records" value={batchList.length} />
            <StatCard label="Need QC" value={batchList.filter((b: any) => b.qcStatus === "PENDING").length} />
            <StatCard label="Completed" value={batchList.filter((b: any) => b.status === "COMPLETED").length} />
          </div>
          <DataCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Daftar Batch Records</h3>
              <Link href="/production/batch-records" className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800">
                Kelola Batch <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Batch ID</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Produk</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {batchList.slice(0, 10).map((b: any) => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-xs font-bold text-slate-900">{b.batchNo || b.id?.slice(0, 8)}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{b.productName || "-"}</td>
                      <td className="py-3 px-4">
                        <DnaBadge status={b.status === "COMPLETED" ? "success" : b.qcStatus === "PASSED" ? "success" : "info"}>
                          {b.status || b.qcStatus || "DRAFT"}
                        </DnaBadge>
                      </td>
                      <td className="py-3 px-4 text-xs text-right text-slate-600">{b.targetQty || "-"}</td>
                    </tr>
                  ))}
                  {batchList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">Belum ada batch records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </DataCard>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
