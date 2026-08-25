"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { DnaInput, DnaButton } from "@/components/dna";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalMigrationShell,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";
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

const statusBadgeTone: Record<string, "pending" | "process" | "purple" | "success" | "danger"> = {
  PENDING: "pending",
  PROCESS: "process",
  SHIPPED: "purple",
  COMPLETED: "success",
  CANCELLED: "danger",
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
    (orders || []).filter((o) => {
      const matchSearch =
        o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchSearch && matchStatus;
    }) || [];

  const totalSamples = (orders || []).length;
  const pendingCount = (orders || []).filter((o) => o.status === "PENDING").length;
  const completedCount = (orders || []).filter((o) => o.status === "COMPLETED").length;
  const shippedCount = (orders || []).filter((o) => o.status === "SHIPPED").length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Kode",
        cell: ({ getValue }: any) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Package className="h-4 w-4" />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">{String(getValue())}</span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Tanggal",
        cell: ({ getValue }: any) => <span className="text-[11px] font-medium text-slate-500 tabular-nums">{String(getValue())}</span>,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ getValue }: any) => <p className="font-black text-slate-900 text-xs uppercase italic">{String(getValue())}</p>,
      },
      {
        accessorKey: "productName",
        header: "Produk",
        cell: ({ getValue }: any) => <span className="text-[11px] font-medium text-slate-600">{String(getValue())}</span>,
      },
      {
        accessorKey: "qty",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">{Number(getValue()).toLocaleString("id-ID")}</div>,
      },
      {
        accessorKey: "unitPrice",
        header: () => <div className="text-right">Harga</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums py-4 font-black text-slate-900 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }: any) => {
          const status = getValue() as string;
          const tone = statusBadgeTone[status] || "neutral";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={tone}>{getOperationalStatusLabel(status)}</OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }: any) => (
          <div className="flex justify-end gap-1.5">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => setDetailOrder(row.original)}
            />
            <DnaButton
              variant="ghost"
              size="sm"
              icon={<MoreHorizontal className="h-3.5 w-3.5" />}
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalMigrationShell
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
          <OperationalMetricGrid>
            <OperationalMetricCard
              label="Total Samples"
              value={totalSamples}
              icon={<Package className="h-4 w-4" />}
              tone="blue"
            />
            <OperationalMetricCard
              label="Pending"
              value={pendingCount}
              helper="Menunggu proses"
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
          </OperationalMetricGrid>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            <DnaInput
              icon={<Search className="h-4 w-4" />}
              placeholder="Cari kode, customer, atau produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          <OperationalDataTable
            data={filteredOrders}
            columns={columns as any}
            getRowId={(row: any) => row.id}
            searchPlaceholder="Cari kode, customer, atau produk..."
          />
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
                <p className="font-black text-sm text-slate-900 mt-1 tabular-nums">{formatOperationalCurrency(detailOrder?.unitPrice)}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Status</p>
              <OperationalStatusBadge status={statusBadgeTone[detailOrder?.status || "PENDING"] || "neutral"}>
                {getOperationalStatusLabel(detailOrder?.status || "PENDING")}
              </OperationalStatusBadge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OperationalMigrationShell>
  );
}
