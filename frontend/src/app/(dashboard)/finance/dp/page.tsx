"use client";
export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowDownCircle,
  Building2,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { DnaInput, DnaButton } from "@/components/dna";
import {
  OperationalDataTable,
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalMigrationShell,
  OperationalTabs,
  OperationalTabsContent,
  OperationalTabsList,
  OperationalTabsTrigger,
  OperationalStatusBadge,
  getOperationalStatusLabel,
} from "@/components/operational";
import { formatOperationalCurrency } from "@/lib/operational-formatters";

export default function DpConsolidatedPage() {
  const [searchPembelian, setSearchPembelian] = useState("");
  const [searchPenjualan, setSearchPenjualan] = useState("");

  const { data: purchaseOrders } = useQuery<any[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => (await api.get("/scm/purchase-orders")).data,
    retry: false,
  });

  const { data: salesOrders } = useQuery<any[]>({
    queryKey: ["finance-sales-orders"],
    queryFn: async () => (await api.get("/finance/sales-orders")).data,
    retry: false,
  });

  const poList = (purchaseOrders || []).filter((p: any) => p.status !== "CANCELLED");
  const soList = (salesOrders || []).filter((s: any) => {
    const total = Number(s.totalAmount) || 0;
    const paid = Number(s.amountPaid) || 0;
    return paid < total;
  });

  const totalDpPembelianTerbayar = poList.reduce((s: number, p: any) => s + (Number(p.paidAmount) || 0), 0);
  const totalDpPembelianOutstanding = poList.reduce((s: number, p: any) => {
    const total = Number(p.totalAmount) || 0;
    const paid = Number(p.paidAmount) || 0;
    return s + (total - paid);
  }, 0);
  const totalDpPenjualanTerbayar = soList.reduce((s: number, o: any) => s + (Number(o.amountPaid) || 0), 0);
  const totalDpPenjualanOutstanding = soList.reduce((s: number, o: any) => {
    const total = Number(o.totalAmount) || 0;
    const paid = Number(o.amountPaid) || 0;
    return s + (total - paid);
  }, 0);

  const filteredPO = poList.filter((p: any) =>
    (p.poNumber || "").toLowerCase().includes(searchPembelian.toLowerCase()) ||
    (p.supplier?.name || p.supplierName || "").toLowerCase().includes(searchPembelian.toLowerCase())
  );
  const filteredSO = soList.filter((o: any) =>
    (o.orderNumber || "").toLowerCase().includes(searchPenjualan.toLowerCase()) ||
    (o.lead?.clientName || "").toLowerCase().includes(searchPenjualan.toLowerCase())
  );

  const poColumns = useMemo(
    () => [
      {
        accessorKey: "poNumber",
        header: "PO Number",
        cell: ({ getValue }: any) => (
          <span className="font-black text-slate-900 text-xs uppercase italic">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }: any) => (
          <span className="font-medium text-slate-700 text-xs">{row.original.supplier?.name || row.original.supplierName || "—"}</span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums font-black text-slate-900 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "paidAmount",
        header: () => <div className="text-right">Sudah Dibayar</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums font-black text-emerald-600 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        id: "sisa",
        header: () => <div className="text-right">Sisa</div>,
        cell: ({ row }: any) => {
          const total = Number(row.original.totalAmount) || 0;
          const paid = Number(row.original.paidAmount) || 0;
          return <div className="text-right font-mono tabular-nums font-black text-rose-600 text-xs">{formatOperationalCurrency(total - paid)}</div>;
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ getValue }: any) => {
          const status = getValue() as string;
          const tone = status === "APPROVED" ? "success" : status === "PENDING" ? "pending" : status === "DP_PAID" ? "process" : "neutral";
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status={tone as any}>{getOperationalStatusLabel(status)}</OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: () => (
          <div className="flex justify-end">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<ArrowDownCircle className="h-3.5 w-3.5" />}
              onClick={() => (window.location.href = "/finance/dp-pembelian")}
            >
              Bayar DP
            </DnaButton>
          </div>
        ),
      },
    ],
    [],
  );

  const soColumns = useMemo(
    () => [
      {
        accessorKey: "orderNumber",
        header: "SO Number",
        cell: ({ getValue }: any) => (
          <span className="font-black text-slate-900 text-xs uppercase italic">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "clientName",
        header: "Customer",
        cell: ({ row }: any) => (
          <span className="font-medium text-slate-700 text-xs">{row.original.lead?.clientName || "—"}</span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums font-black text-slate-900 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        accessorKey: "amountPaid",
        header: () => <div className="text-right">Sudah Dibayar</div>,
        cell: ({ getValue }: any) => <div className="text-right font-mono tabular-nums font-black text-emerald-600 text-xs">{formatOperationalCurrency(getValue())}</div>,
      },
      {
        id: "sisa",
        header: () => <div className="text-right">Sisa</div>,
        cell: ({ row }: any) => {
          const total = Number(row.original.totalAmount) || 0;
          const paid = Number(row.original.amountPaid) || 0;
          return <div className="text-right font-mono tabular-nums font-black text-rose-600 text-xs">{formatOperationalCurrency(total - paid)}</div>;
        },
      },
      {
        id: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }: any) => {
          const total = Number(row.original.totalAmount) || 0;
          const paid = Number(row.original.amountPaid) || 0;
          if (paid === 0) {
            return (
              <div className="flex justify-center">
                <OperationalStatusBadge status="danger">Belum Bayar</OperationalStatusBadge>
              </div>
            );
          }
          if (paid < total) {
            return (
              <div className="flex justify-center">
                <OperationalStatusBadge status="pending">Partial</OperationalStatusBadge>
              </div>
            );
          }
          return (
            <div className="flex justify-center">
              <OperationalStatusBadge status="success">Lunas</OperationalStatusBadge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: () => (
          <div className="flex justify-end">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              onClick={() => (window.location.href = "/finance/dp-penjualan")}
            >
              Catat DP
            </DnaButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <OperationalMigrationShell
      title="DOWN"
      titleAccent="PAYMENT"
      subtitle="Uang Muka Pembelian & Penjualan — DP Management Hub"
    >
      <OperationalTabs defaultValue="pembelian" className="w-full">
        <OperationalTabsList>
          <OperationalTabsTrigger value="pembelian">DP Pembelian</OperationalTabsTrigger>
          <OperationalTabsTrigger value="penjualan">DP Penjualan</OperationalTabsTrigger>
        </OperationalTabsList>

        <OperationalTabsContent value="pembelian">
          <OperationalMetricGrid>
            <OperationalMetricCard
              label="Total PO"
              value={poList.length}
              icon={<Building2 className="h-4 w-4" />}
              tone="blue"
            />
            <OperationalMetricCard
              label="DP Terbayar"
              value={formatOperationalCurrency(totalDpPembelianTerbayar)}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="green"
            />
            <OperationalMetricCard
              label="Outstanding"
              value={formatOperationalCurrency(totalDpPembelianOutstanding)}
              icon={<Clock className="h-4 w-4" />}
              tone="amber"
            />
          </OperationalMetricGrid>
          <div className="flex items-center justify-between w-full gap-3">
            <DnaInput
              icon={<span className="h-4 w-4" />}
              placeholder="Cari PO atau Supplier..."
              value={searchPembelian}
              onChange={(e) => setSearchPembelian(e.target.value)}
            />
            <DnaButton
              variant="primary"
              icon={<ArrowDownCircle className="h-4 w-4" />}
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => (window.location.href = "/finance/dp-pembelian")}
            >
              Tambah DP Baru
            </DnaButton>
          </div>
          <OperationalDataTable
            data={filteredPO}
            columns={poColumns as any}
            getRowId={(row: any) => row.id}
            searchPlaceholder="Cari PO atau Supplier..."
          />
        </OperationalTabsContent>

        <OperationalTabsContent value="penjualan">
          <OperationalMetricGrid>
            <OperationalMetricCard
              label="Total SO Belum Lunas"
              value={soList.length}
              icon={<Building2 className="h-4 w-4" />}
              tone="blue"
            />
            <OperationalMetricCard
              label="DP Terbayar"
              value={formatOperationalCurrency(totalDpPenjualanTerbayar)}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="green"
            />
            <OperationalMetricCard
              label="Sisa Piutang"
              value={formatOperationalCurrency(totalDpPenjualanOutstanding)}
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="red"
            />
          </OperationalMetricGrid>
          <div className="flex items-center justify-between w-full gap-3">
            <DnaInput
              placeholder="Cari SO atau Customer..."
              value={searchPenjualan}
              onChange={(e) => setSearchPenjualan(e.target.value)}
            />
            <DnaButton
              variant="primary"
              icon={<ArrowUpRight className="h-4 w-4" />}
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => (window.location.href = "/finance/dp-penjualan")}
            >
              Tambah DP Baru
            </DnaButton>
          </div>
          <OperationalDataTable
            data={filteredSO}
            columns={soColumns as any}
            getRowId={(row: any) => row.id}
            searchPlaceholder="Cari SO atau Customer..."
          />
        </OperationalTabsContent>
      </OperationalTabs>
    </OperationalMigrationShell>
  );
}
