"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  Wallet,
  Eye,
  ArrowRight,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";

interface SampleTracking {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  productName: string;
  qty: number;
  status: string;
  paymentStatus: string;
}

const stages = ["PENDING", "PROCESS", "SHIPPED", "COMPLETED"];

const stageColors: Record<string, string> = {
  PENDING: "bg-amber-500",
  PROCESS: "bg-blue-500",
  SHIPPED: "bg-purple-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-slate-300",
};

const statusBadgeMap: Record<string, { badge: "warning" | "info" | "purple" | "success" | "critical" | "default" }> = {
  PENDING: { badge: "warning" },
  PROCESS: { badge: "info" },
  SHIPPED: { badge: "purple" },
  COMPLETED: { badge: "success" },
  CANCELLED: { badge: "critical" },
};

export default function SampleTrackingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [detailOrder, setDetailOrder] = useState<SampleTracking | null>(null);
  const queryClient = useQueryClient();

  const { data: samples, isLoading, isError } = useQuery<SampleTracking[]>({
    queryKey: ["bussdev-samples-tracking"],
    queryFn: async () => {
      const resp = await api.get("/bussdev/samples");
      return resp.data.map((s: any) => ({
        id: s.id,
        code: s.code,
        createdAt: new Date(s.createdAt).toISOString().split("T")[0],
        customerName: s.customerName,
        productName: s.productName,
        qty: Number(s.qty),
        status: s.status,
        paymentStatus: s.paymentStatus || "UNPAID",
      }));
    },
  });

  const filteredSamples =
    samples?.filter(
      (s) =>
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.productName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const totalSamples = samples?.length || 0;
  const inProgressCount = samples?.filter((s) => s.status === "PROCESS").length || 0;
  const shippedCount = samples?.filter((s) => s.status === "SHIPPED").length || 0;
  const completedCount = samples?.filter((s) => s.status === "COMPLETED").length || 0;
  const awaitingPayment = samples?.filter((s) => s.paymentStatus !== "PAID" && s.status !== "CANCELLED").length || 0;

  function getStageIndex(status: string) {
    return stages.indexOf(status);
  }

  return (
    <DashboardShell
      title="SAMPLE"
      titleAccent="TRACKING"
      subtitle="Pipeline Monitoring — Sample Order Lifecycle"
    >
      {isLoading ? (
        <QueryLoading message="Memuat data tracking sample..." />
      ) : isError ? (
        <QueryError
          error="Gagal memuat data tracking"
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["bussdev-samples-tracking"] })}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <StatCard
              label="Total Samples"
              value={totalSamples.toString()}
              icon={<Package className="text-blue-600" />}
            />
            <StatCard
              label="In Progress"
              value={inProgressCount.toString()}
              subValue="Sedang diproses"
              icon={<Clock className="text-amber-500" />}
            />
            <StatCard
              label="Shipped"
              value={shippedCount.toString()}
              subValue="Dalam pengiriman"
              icon={<Truck className="text-purple-600" />}
            />
            <StatCard
              label="Completed"
              value={completedCount.toString()}
              subValue="Selesai"
              icon={<CheckCircle2 className="text-emerald-600" />}
            />
            <StatCard
              label="Awaiting Payment"
              value={awaitingPayment.toString()}
              subValue="Belum lunas"
              icon={<Wallet className="text-rose-500" />}
            />
          </div>

          <TableWrapper
            filters={
              <div className="relative w-full max-w-md">
                <DnaInput
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Cari kode, customer, atau produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Kode
                  </TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Customer
                  </TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Produk
                  </TableHead>
                  <TableHead className="text-left font-black text-slate-400 uppercase tracking-tight text-[9px] w-[220px]">
                    Pipeline Stage
                  </TableHead>
                  <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Status
                  </TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Detail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map((sample) => (
                  <TableRow
                    key={sample.id}
                    className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
                          {sample.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                        {sample.createdAt}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-black text-slate-900 text-xs uppercase italic">
                        {sample.customerName}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-[11px] font-medium text-slate-600">
                        {sample.productName}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {sample.status === "CANCELLED" ? (
                        <DnaBadge status="critical">CANCELLED</DnaBadge>
                      ) : (
                        <div className="flex items-center gap-1">
                          {stages.map((stage, idx) => {
                            const currentIdx = getStageIndex(sample.status);
                            const isCompleted = idx <= currentIdx;
                            const isCurrent = idx === currentIdx;
                            return (
                              <React.Fragment key={stage}>
                                <div
                                  className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-[8px] font-black uppercase transition-all",
                                    isCompleted
                                      ? `${stageColors[stage]} text-white shadow-sm`
                                      : "bg-slate-100 text-slate-400",
                                    isCurrent && "ring-2 ring-offset-1 ring-blue-400"
                                  )}
                                >
                                  {idx + 1}
                                </div>
                                {idx < stages.length - 1 && (
                                  <ArrowRight
                                    className={cn(
                                      "h-3 w-3 shrink-0",
                                      idx < currentIdx ? "text-blue-400" : "text-slate-200"
                                    )}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DnaBadge status={statusBadgeMap[sample.status]?.badge || "default"}>
                        {sample.status}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="pr-6 text-right py-4">
                      <DnaButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setDetailOrder(sample)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSamples.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-slate-400 italic"
                    >
                      Tidak ada sample tracking ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      )}

      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 bg-blue-600 text-white relative overflow-hidden">
            <div className="relative z-10">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">
                Sample Tracking
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">
                Detail Pipeline — {detailOrder?.code}
              </DialogDescription>
            </div>
            <Package className="absolute right-8 top-1/2 -translate-y-1/2 h-12 w-12 text-white/20" />
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Kode</p>
                <p className="font-black text-xs uppercase text-slate-900 mt-1">{detailOrder?.code}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Tanggal</p>
                <p className="font-black text-xs uppercase text-slate-900 mt-1">{detailOrder?.createdAt}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Customer</p>
                <p className="font-black text-xs uppercase text-slate-900 mt-1">{detailOrder?.customerName}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Produk</p>
                <p className="font-black text-xs uppercase text-slate-900 mt-1">{detailOrder?.productName}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Qty</p>
                <p className="font-black text-sm text-slate-900 mt-1 tabular-nums">{detailOrder?.qty.toLocaleString("id-ID")}</p>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Pipeline Progress</p>
              <div className="flex items-center gap-2">
                {stages.map((stage, idx) => {
                  const currentIdx = detailOrder ? getStageIndex(detailOrder.status) : -1;
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <React.Fragment key={stage}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full text-[10px] font-black uppercase transition-all",
                            isCompleted
                              ? `${stageColors[stage]} text-white shadow-md`
                              : "bg-slate-100 text-slate-400",
                            isCurrent && "ring-2 ring-offset-2 ring-blue-400 scale-110"
                          )}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={cn(
                            "text-[8px] font-black uppercase tracking-wider",
                            isCompleted ? "text-slate-900" : "text-slate-400"
                          )}
                        >
                          {stage}
                        </span>
                      </div>
                      {idx < stages.length - 1 && (
                        <ArrowRight
                          className={cn(
                            "h-4 w-4 mb-5 shrink-0",
                            idx < currentIdx ? "text-blue-400" : "text-slate-200"
                          )}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
