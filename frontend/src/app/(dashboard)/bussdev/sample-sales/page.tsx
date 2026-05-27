"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Package,
  Plus,
  Eye,
  MoreHorizontal,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import Link from "next/link";

interface SampleOrder {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  productName: string;
  qty: number;
  unitPrice: number;
  status: string;
}

const statusMap: Record<string, { label: string; badge: "warning" | "info" | "success" | "critical" | "purple" }> = {
  PENDING: { label: "PENDING", badge: "warning" },
  PROCESS: { label: "PROCESS", badge: "info" },
  SHIPPED: { label: "SHIPPED", badge: "purple" },
  COMPLETED: { label: "COMPLETED", badge: "success" },
  CANCELLED: { label: "CANCELLED", badge: "critical" },
};

export default function SampleSalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailOrder, setDetailOrder] = useState<SampleOrder | null>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading, isError } = useQuery<SampleOrder[]>({
    queryKey: ["bussdev-samples"],
    queryFn: async () => {
      const resp = await api.get("/bussdev/samples");
      return resp.data.map((s: any) => ({
        id: s.id,
        code: s.code,
        createdAt: new Date(s.createdAt).toISOString().split("T")[0],
        customerName: s.customerName,
        productName: s.productName,
        qty: Number(s.qty),
        unitPrice: Number(s.unitPrice),
        status: s.status,
      }));
    },
  });

  const filteredOrders =
    orders?.filter((o) => {
      const matchSearch =
        o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchSearch && matchStatus;
    }) || [];

  const totalSamples = orders?.length || 0;
  const pendingCount = orders?.filter((o) => o.status === "PENDING").length || 0;
  const completedCount = orders?.filter((o) => o.status === "COMPLETED").length || 0;
  const shippedCount = orders?.filter((o) => o.status === "SHIPPED").length || 0;

  return (
    <DashboardShell
      title="SAMPLE"
      titleAccent="SALES"
      subtitle="Penjualan Sample — Sample Order Pipeline"
      actions={
        <div className="flex gap-3">
          <Link href="/bussdev/sample-sales/input">
            <DnaButton
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              className="h-11 px-5 rounded-xl"
            >
              Buat Sample Order
            </DnaButton>
          </Link>
        </div>
      }
    >
      {isLoading ? (
        <QueryLoading message="Memuat data sample sales..." />
      ) : isError ? (
        <QueryError
          error="Gagal memuat data sample"
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["bussdev-samples"] })}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Total Samples"
              value={totalSamples.toString()}
              icon={<Package className="text-blue-600" />}
            />
            <StatCard
              label="Pending"
              value={pendingCount.toString()}
              subValue="Menunggu proses"
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
          </div>

          <TableWrapper
            filters={
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="relative flex-1 max-w-md">
                  <DnaInput
                    icon={<Search className="h-4 w-4" />}
                    placeholder="Cari kode, customer, atau produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["ALL", "PENDING", "PROCESS", "SHIPPED", "COMPLETED", "CANCELLED"].map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                          "px-4 h-11 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                          statusFilter === s
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {s === "ALL" ? "Semua" : s}
                      </button>
                    )
                  )}
                </div>
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
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Qty
                  </TableHead>
                  <TableHead className="text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Harga
                  </TableHead>
                  <TableHead className="text-center font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Status
                  </TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
                          {order.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                        {order.createdAt}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-black text-slate-900 text-xs uppercase italic">
                        {order.customerName}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-[11px] font-medium text-slate-600">
                        {order.productName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">
                      {order.qty.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">
                      Rp {order.unitPrice.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <DnaBadge status={statusMap[order.status]?.badge || "default"}>
                        {statusMap[order.status]?.label || order.status}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="pr-6 text-right py-4">
                      <div className="flex justify-end gap-1.5">
                        <DnaButton
                          variant="outline"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5" />}
                          onClick={() => setDetailOrder(order)}
                        />
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<MoreHorizontal className="h-3.5 w-3.5" />}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-slate-400 italic"
                    >
                      Tidak ada sample order ditemukan.
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
                Detail Sample Order
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-[10px] font-medium uppercase tracking-[0.2em] mt-2">
                Sample Sales Protocol — {detailOrder?.code}
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
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Harga</p>
                <p className="font-black text-sm text-slate-900 mt-1 tabular-nums">Rp {detailOrder?.unitPrice.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Status</p>
              <DnaBadge status={statusMap[detailOrder?.status || "PENDING"]?.badge || "default"}>
                {statusMap[detailOrder?.status || "PENDING"]?.label || detailOrder?.status}
              </DnaBadge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
