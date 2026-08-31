"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MetricCard,
  CanonicalMetricGrid,
  DataTable,
  StatusBadge,
  mapStatus,
} from "@/components/canonical";
import {
  PlusCircle,
  FileText,
  ShoppingCart,
  Truck,
  RotateCcw,
  CreditCard,
  DollarSign,
  PackageCheck,
  Clock,
  AlertTriangle,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  User,
} from "lucide-react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { EmptyState } from "@/components/empty-state";

function usePembelianLists() {
  const requests = useQuery({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-requests");
      return unwrapResponse(res) || [];
    },
  });

  const orders = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return unwrapResponse(res) || [];
    },
  });

  const inbounds = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => (unwrapResponse(await api.get("/scm/inbounds")) || []).map((grn: any) => ({
      id: grn.inboundNumber || grn.id,
      poId: grn.po?.poNumber || grn.poId || "—",
      vendor: grn.po?.supplier?.name || "—",
      date: grn.receivedAt ? new Date(grn.receivedAt).toISOString().split("T")[0] : "—",
      status: grn.status === "APPROVED" ? "VERIFIED" : "PENDING",
      qc: grn.status === "APPROVED" ? "PASSED" : "WAITING",
    })),
  });

  const returns = useQuery({
    queryKey: ["purchase-returns"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-returns");
      return unwrapResponse(res) || [];
    },
  });

  const invoices = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-invoices");
      return unwrapResponse(res) || [];
    },
  });

  return { requests, orders, inbounds, returns, invoices };
}

function LoadingCell({ colspan }: { colspan: number }) {
  return (
    <table className="w-full">
      <tbody>
        <tr>
          <td colSpan={colspan} className="text-center py-10 text-[12px] text-slate-400">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin align-middle mr-2" />
            Memuat...
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ── PR Tab ──

function PRTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const total = data?.length || 0;
  const pending = data?.filter((r: any) => r.status === "DRAFT" || r.status === "SUBMITTED").length || 0;
  const urgent = data?.filter((r: any) => r.priority === "URGENT").length || 0;

  const columns: ColumnDef<any, any>[] = [
    {
      id: "id",
      header: "ID",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">#{String(row.original.id ?? "").split("-")[0]}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {row.original.requestDate ? new Date(row.original.requestDate).toLocaleDateString() : "—"}
          </p>
        </div>
      ),
    },
    {
      id: "warehouse",
      header: "Gudang",
      cell: ({ row }) => <span className="text-slate-700">{row.original.warehouse?.name || "—"}</span>,
    },
    {
      id: "creator",
      header: "Pembuat",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-slate-400" />
          <span className="text-[12px] text-slate-600">{row.original.creator?.fullName || row.original.createdBy || "—"}</span>
        </div>
      ),
    },
    {
      id: "items",
      header: () => <div className="text-right">Jml Item</div>,
      cell: ({ row }) => <span className="tabular-nums font-medium text-slate-900">{row.original.items?.length || 0}</span>,
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge variant={mapStatus(row.original.status)}>
            {(row.original.status || "DRAFT").replace("_", " ")}
          </StatusBadge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Total Permintaan" value={total} helper="All PR" icon={<FileText />} variant="info" />
        <MetricCard label="Menunggu Approve" value={pending} helper="Pending" icon={<Clock />} variant="warning" />
        <MetricCard label="Mendesak" value={urgent} helper="Priority" icon={<AlertTriangle />} variant="danger" />
      </CanonicalMetricGrid>
      {isLoading ? (
        <LoadingCell colspan={5} />
      ) : (
        <DataTable
          title="Permintaan Pembelian"
          data={(data || []).slice(0, 5)}
          columns={columns}
          enableSearch={false}
          emptyMessage="Belum Ada PR"
          emptyDescription="Belum ada permintaan pembelian."
        />
      )}
      <div className="text-right">
        <Link href="/scm/purchase-requests" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800">
          <PlusCircle className="h-3 w-3" /> Tambah Baru
        </Link>
      </div>
    </div>
  );
}

// ── PO Tab ──

function POTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const total = data?.length || 0;
  const active = data?.filter((po: any) => po.status === "APPROVED" || po.status === "ORDERED").length || 0;
  const totalValue = (data || []).reduce((sum: number, po: any) => sum + Number(po.totalValue || 0), 0);

  const columns: ColumnDef<any, any>[] = [
    {
      id: "po",
      header: "No. PO",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.poNumber}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>
      ),
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => <span className="text-slate-700">{row.original.supplier?.name || "—"}</span>,
    },
    {
      id: "arrival",
      header: "Tgl",
      cell: ({ row }) => (
        <span className="text-[12px] text-slate-600">
          {row.original.estArrival ? new Date(row.original.estArrival).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      id: "value",
      header: () => <div className="text-right">Nilai</div>,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-slate-900">
          Rp {Number(row.original.totalValue).toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge variant={mapStatus(row.original.status)}>
            {(row.original.status || "DRAFT").replace("_", " ")}
          </StatusBadge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Total PO" value={total} helper="All PO" icon={<ShoppingCart />} variant="info" />
        <MetricCard label="PO Aktif" value={active} helper="Active" icon={<Truck />} variant="success" />
        <MetricCard label="Total Nilai" value={`Rp ${(totalValue / 1_000_000).toFixed(1)}jt`} helper="Value" icon={<Wallet />} variant="warning" />
      </CanonicalMetricGrid>
      {isLoading ? (
        <LoadingCell colspan={5} />
      ) : (
        <DataTable
          title="Buat Pembelian"
          data={(data || []).slice(0, 5)}
          columns={columns}
          enableSearch={false}
          emptyMessage="Belum Ada PO"
          emptyDescription="Belum ada purchase order."
        />
      )}
    </div>
  );
}

// ── Receiving Tab ──

function ReceivingTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const arrivalsToday = data?.filter((r: any) => r.date === new Date().toISOString().split("T")[0]).length || 0;
  const awaitingQc = data?.filter((r: any) => r.qc === "WAITING").length || 0;
  const verified = data?.filter((r: any) => r.status === "VERIFIED").length || 0;

  const columns: ColumnDef<any, any>[] = [
    {
      id: "id",
      header: "ID GRN",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.id}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{row.original.date}</p>
        </div>
      ),
    },
    { id: "po", header: "PO Asal", accessorKey: "poId", cell: ({ getValue }) => <StatusBadge variant="default">{String(getValue() ?? "—")}</StatusBadge> },
    { id: "vendor", header: "Pemasok", accessorKey: "vendor", cell: ({ getValue }) => <span className="text-slate-700">{String(getValue() ?? "—")}</span> },
    {
      id: "qc",
      header: () => <div className="text-center">Status QC</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge variant={row.original.qc === "PASSED" ? "success" : "warning"}>
            {row.original.qc}
          </StatusBadge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Kedatangan Hari Ini" value={arrivalsToday} helper="Today" icon={<Truck />} variant="info" />
        <MetricCard label="Menunggu QC" value={awaitingQc} helper="Waiting" icon={<AlertCircle />} variant="warning" />
        <MetricCard label="Terverifikasi" value={verified} helper="Verified" icon={<PackageCheck />} variant="success" />
      </CanonicalMetricGrid>
      {isLoading ? (
        <LoadingCell colspan={4} />
      ) : (
        <DataTable
          title="Pembelian Masuk"
          data={(data || []).slice(0, 5)}
          columns={columns}
          enableSearch={false}
          emptyMessage="Belum Ada Penerimaan"
          emptyDescription="Belum ada barang yang diterima."
        />
      )}
    </div>
  );
}

// ── Returns Tab ──

function ReturnsTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const total = data?.length || 0;
  const pending = data?.filter((r: any) => r.status === "DRAFT" || r.status === "WAITING_APPROVAL").length || 0;
  const completed = data?.filter((r: any) => r.status === "COMPLETED").length || 0;

  const columns: ColumnDef<any, any>[] = [
    {
      id: "no",
      header: "No. Retur",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.returnNumber}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>
      ),
    },
    { id: "supplier", header: "Pemasok", cell: ({ row }) => <span className="text-slate-700">{row.original.supplier?.name || "—"}</span> },
    {
      id: "creator",
      header: "Pembuat",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-slate-400" />
          <span className="text-[12px] text-slate-600">{row.original.creator?.fullName || "—"}</span>
        </div>
      ),
    },
    {
      id: "value",
      header: () => <div className="text-right">Nilai</div>,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-slate-900">
          Rp {Number(row.original.totalValue || 0).toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge variant={mapStatus(row.original.status)}>
            {(row.original.status || "DRAFT").replace("_", " ")}
          </StatusBadge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Total Retur" value={total} helper="All" icon={<RotateCcw />} variant="info" />
        <MetricCard label="Menunggu" value={pending} helper="Waiting" icon={<Clock />} variant="warning" />
        <MetricCard label="Selesai" value={completed} helper="Done" icon={<CheckCircle2 />} variant="success" />
      </CanonicalMetricGrid>
      {isLoading ? (
        <LoadingCell colspan={5} />
      ) : (
        <DataTable
          title="Retur Pembelian"
          data={(data || []).slice(0, 5)}
          columns={columns}
          enableSearch={false}
          emptyMessage="Belum Ada Retur"
          emptyDescription="Belum ada transaksi retur."
        />
      )}
    </div>
  );
}

// ── Payments Tab ──

function PaymentsTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const unpaid = data?.filter((inv: any) => inv.status === "UNPAID").length || 0;
  const paid = data?.filter((inv: any) => inv.status === "PAID").length || 0;
  const totalOutstanding = data?.reduce((sum: number, inv: any) => sum + Number(inv.outstandingAmount || 0), 0) || 0;

  const columns: ColumnDef<any, any>[] = [
    {
      id: "no",
      header: "Faktur",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-900">{row.original.invoiceNumber}</span>
        </div>
      ),
    },
    { id: "supplier", header: "Supplier", cell: ({ row }) => <span className="text-emerald-600 font-medium text-[12px]">{row.original.supplier?.name || "—"}</span> },
    {
      id: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-slate-900">
          Rp {Number(row.original.amountDue).toLocaleString()}
        </span>
      ),
    },
    {
      id: "outstanding",
      header: () => <div className="text-right">Sisa</div>,
      cell: ({ row }) => {
        const outstanding = Number(row.original.outstandingAmount);
        return (
          <span
            className="tabular-nums font-medium"
            style={{ color: outstanding > 0 ? "#dc2626" : "#059669" }}
          >
            Rp {outstanding.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge variant={row.original.status === "PAID" ? "success" : "destructive"}>
            {row.original.status === "PAID" ? "Lunas" : row.original.status === "UNPAID" ? "Belum Lunas" : row.original.status}
          </StatusBadge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Belum Dibayar" value={unpaid} helper="Unpaid" icon={<CreditCard />} variant="danger" />
        <MetricCard label="Lunas" value={paid} helper="Paid" icon={<CheckCircle2 />} variant="success" />
        <MetricCard label="Outstanding" value={`Rp ${totalOutstanding.toLocaleString()}`} helper="Outstanding" icon={<Wallet />} variant="warning" />
      </CanonicalMetricGrid>
      {isLoading ? (
        <LoadingCell colspan={5} />
      ) : (
        <DataTable
          title="Bayar Pembelian"
          data={(data || []).slice(0, 5)}
          columns={columns}
          enableSearch={false}
          emptyMessage="Belum Ada Faktur"
          emptyDescription="Belum ada faktur pembelian."
        />
      )}
    </div>
  );
}

// ── DP Tab ──

function DPTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const dpList = (data || []).filter((inv: any) => inv.type === "DP");
  const totalDp = dpList.reduce((sum: number, dp: any) => sum + Number(dp.amountDue || 0), 0);
  const unpaid = dpList.filter((dp: any) => dp.status === "UNPAID").length || 0;
  const paid = dpList.filter((dp: any) => dp.status === "PAID").length || 0;

  const columns: ColumnDef<any, any>[] = [
    {
      id: "id",
      header: "ID DP",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg border border-[#E2E8F0] bg-white text-slate-900 text-[10px] font-medium flex items-center justify-center">
            DP
          </div>
          <span className="font-medium text-slate-900">{row.original.invoiceNumber}</span>
        </div>
      ),
    },
    {
      id: "po",
      header: "PO / Pemasok",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-900 text-[12px]">{row.original.po?.poNumber || "—"}</span>
          <p className="text-[11px] text-blue-600 mt-0.5">{row.original.supplier?.name || "—"}</p>
        </div>
      ),
    },
    {
      id: "amount",
      header: () => <div className="text-right">Jumlah</div>,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-slate-900">
          Rp {Number(row.original.amountDue).toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <StatusBadge variant={row.original.status === "PAID" ? "success" : "warning"}>
            {row.original.status === "PAID" ? "Lunas" : "Belum Lunas"}
          </StatusBadge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <CanonicalMetricGrid>
        <MetricCard label="Total DP" value={`Rp ${(totalDp / 1_000_000).toFixed(1)}jt`} helper="All DP" icon={<DollarSign />} variant="info" />
        <MetricCard label="Belum Lunas" value={unpaid} helper="Unpaid" icon={<Clock />} variant="warning" />
        <MetricCard label="Lunas" value={paid} helper="Paid" icon={<CheckCircle2 />} variant="success" />
      </CanonicalMetricGrid>
      {isLoading ? (
        <LoadingCell colspan={4} />
      ) : (
        <DataTable
          title="DP Pembelian"
          data={dpList.slice(0, 5)}
          columns={columns}
          enableSearch={false}
          emptyMessage="Belum Ada DP"
          emptyDescription="Belum ada uang muka pembelian."
        />
      )}
    </div>
  );
}

const tabs = [
  { value: "pr", label: "Permintaan" },
  { value: "po", label: "Buat Pembelian" },
  { value: "receiving", label: "Penerimaan" },
  { value: "returns", label: "Retur" },
  { value: "payments", label: "Bayar" },
  { value: "dp", label: "DP" },
];

export default function PembelianPage() {
  const { requests, orders, inbounds, returns, invoices } = usePembelianLists();

  return (
    <DashboardShell
      title="Pembelian"
      titleAccent="SCM"
      subtitle="Manajemen Pembelian — Purchase Requests, Orders, Receiving, Returns & Payments"
    >
      <Tabs defaultValue="pr" className="space-y-4">
        <TabsList className="h-auto p-1 bg-white border border-[#E2E8F0] rounded-lg w-fit">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-600 rounded-md px-3 py-1.5 text-[12px] font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="pr"><PRTab data={requests.data} isLoading={requests.isLoading} /></TabsContent>
        <TabsContent value="po"><POTab data={orders.data} isLoading={orders.isLoading} /></TabsContent>
        <TabsContent value="receiving"><ReceivingTab data={inbounds.data} isLoading={inbounds.isLoading} /></TabsContent>
        <TabsContent value="returns"><ReturnsTab data={returns.data} isLoading={returns.isLoading} /></TabsContent>
        <TabsContent value="payments"><PaymentsTab data={invoices.data} isLoading={invoices.isLoading} /></TabsContent>
        <TabsContent value="dp"><DPTab data={invoices.data} isLoading={invoices.isLoading} /></TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
