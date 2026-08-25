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
  Loader2,
} from "lucide-react";
import {
  OperationalInput,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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

const statusBadgeMap: Record<string, "pending" | "process" | "purple" | "success" | "danger" | "neutral"> = {
  PENDING: "pending",
  PROCESS: "process",
  SHIPPED: "purple",
  COMPLETED: "success",
  CANCELLED: "danger",
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
    <OperationalPageShell
      title="Sample Tracking"
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
        <div className="operational-stack">
          <OperationalMetricGrid>
            <OperationalMetricCard
              label="Total Samples"
              value={totalSamples}
              icon={<Package className="h-4 w-4" />}
              tone="blue"
            />
            <OperationalMetricCard
              label="In Progress"
              value={inProgressCount}
              helper="Sedang diproses"
              icon={<Clock className="h-4 w-4" />}
              tone="amber"
            />
            <OperationalMetricCard
              label="Shipped"
              value={shippedCount}
              helper="Dalam pengiriman"
              icon={<Truck className="h-4 w-4" />}
              tone="purple"
            />
            <OperationalMetricCard
              label="Completed"
              value={completedCount}
              helper="Selesai"
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="green"
            />
            <OperationalMetricCard
              label="Awaiting Payment"
              value={awaitingPayment}
              helper="Belum lunas"
              icon={<Wallet className="h-4 w-4" />}
              tone="red"
            />
          </OperationalMetricGrid>

          <OperationalPanel>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-600" />
                <h3 className="text-[14px] font-semibold text-slate-900">Sample Tracking</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {filteredSamples.length}
                </span>
              </div>
              <OperationalInput
                icon={<Search className="h-4 w-4" />}
                placeholder="Cari kode, customer, atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-80"
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Kode</th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Tanggal</th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Produk</th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Pipeline Stage</th>
                    <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSamples.map((sample) => (
                    <tr key={sample.id} className="border-b border-slate-100 transition hover:bg-blue-50/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-600 text-white">
                            <Package className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[12px] font-semibold text-slate-900">{sample.code}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] tabular-nums text-slate-600">{sample.createdAt}</td>
                      <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-900">{sample.customerName}</td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-600">{sample.productName}</td>
                      <td className="px-3 py-2.5">
                        {sample.status === "CANCELLED" ? (
                          <OperationalStatusBadge status="danger">CANCELLED</OperationalStatusBadge>
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
                                      "grid h-6 w-6 place-items-center rounded-full text-[8px] font-semibold transition",
                                      isCompleted
                                        ? `${stageColors[stage]} text-white`
                                        : "bg-slate-100 text-slate-400",
                                      isCurrent && "ring-2 ring-offset-1 ring-blue-400",
                                    )}
                                  >
                                    {idx + 1}
                                  </div>
                                  {idx < stages.length - 1 && (
                                    <ArrowRight
                                      className={cn(
                                        "h-3 w-3 shrink-0",
                                        idx < currentIdx ? "text-blue-400" : "text-slate-200",
                                      )}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <OperationalStatusBadge status={statusBadgeMap[sample.status] || "neutral"}>
                          {getOperationalStatusLabel(sample.status)}
                        </OperationalStatusBadge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          className="operational-button is-secondary h-8 px-3 text-[11px]"
                          onClick={() => setDetailOrder(sample)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSamples.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-[12px] text-slate-400">
                        Tidak ada sample tracking ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </OperationalPanel>
        </div>
      )}

      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="sm:max-w-lg border-none p-0">
          <div className="relative overflow-hidden rounded-t-md bg-blue-600 p-6 text-white">
            <div className="relative z-10">
              <DialogTitle className="text-[20px] font-semibold uppercase tracking-tight text-white">
                Sample Tracking
              </DialogTitle>
              <DialogDescription className="mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-100">
                Detail Pipeline — {detailOrder?.code ?? "—"}
              </DialogDescription>
            </div>
            <Package className="absolute right-6 top-1/2 h-10 w-10 -translate-y-1/2 text-white/20" />
          </div>
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Kode</p>
                <p className="mt-1 text-[12px] font-semibold text-slate-900">{detailOrder?.code ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Tanggal</p>
                <p className="mt-1 text-[12px] font-semibold text-slate-900">{detailOrder?.createdAt ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Customer</p>
                <p className="mt-1 text-[12px] font-semibold text-slate-900">{detailOrder?.customerName ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Produk</p>
                <p className="mt-1 text-[12px] font-semibold text-slate-900">{detailOrder?.productName ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Qty</p>
                <p className="mt-1 text-[13px] font-semibold tabular-nums text-slate-900">
                  {detailOrder?.qty.toLocaleString("id-ID") ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Status</p>
                <p className="mt-1">
                  <OperationalStatusBadge status={statusBadgeMap[detailOrder?.status ?? ""] || "neutral"}>
                    {getOperationalStatusLabel(detailOrder?.status)}
                  </OperationalStatusBadge>
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-[10px] font-medium text-slate-500 uppercase">Pipeline Progress</p>
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
                            "grid h-9 w-9 place-items-center rounded-full text-[10px] font-semibold transition",
                            isCompleted
                              ? `${stageColors[stage]} text-white`
                              : "bg-slate-100 text-slate-400",
                            isCurrent && "ring-2 ring-offset-2 ring-blue-400 scale-110",
                          )}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-medium uppercase tracking-wider",
                            isCompleted ? "text-slate-900" : "text-slate-400",
                          )}
                        >
                          {stage}
                        </span>
                      </div>
                      {idx < stages.length - 1 && (
                        <ArrowRight
                          className={cn(
                            "mb-5 h-4 w-4 shrink-0",
                            idx < currentIdx ? "text-blue-400" : "text-slate-200",
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
    </OperationalPageShell>
  );
}
