"use client";

/**
 * Wired to GET /commercial/sales-orders (+ PATCH /commercial/sales-orders/:id).
 * The previous revision rendered an in-file `INITIAL_SALES_DATA` array of invented
 * sales orders, so an operator could "approve" an SO that existed only in the bundle.
 * There is no static array and no fallback here.
 *
 * Approving activates the order (SOStatus.ACTIVE). The backend interlock refuses that
 * transition until a Down Payment invoice is PAID; that refusal is surfaced as-is
 * rather than worked around.
 */

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
  DnaErrorState,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";

const EMPTY = "—";

interface SalesOrderApprovalItem {
  id: string;
  code: string;
  customer: string;
  brand: string;
  itemsCount: number;
  quantity: number;
  totalAmount: number;
  dpStatus: string;
  salesPic: string;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  partnerName: string;
  date: string;
  dueDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
  lineItems: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    qty: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
}

/** SOStatus → the shell/modal vocabulary. */
function approvalStatusOf(status?: string): "PENDING" | "APPROVED" | "REJECTED" {
  const key = (status || "").toUpperCase();
  if (key === "CANCELLED") return "REJECTED";
  if (key === "PENDING_DP" || key === "AMENDMENT_REVIEW") return "PENDING";
  return key ? "APPROVED" : "PENDING";
}

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toItem(raw: any): SalesOrderApprovalItem {
  const rows: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems = rows.map((li: any, idx: number) => ({
    id: li?.id ?? `li-${idx}`,
    itemCode: EMPTY,
    itemName: li?.productName ?? "Produk belum tertaut",
    qty: Number(li?.quantity) || 0,
    unit: li?.netto ? `${Number(li.netto)} g` : EMPTY,
    unitPrice: Number(li?.unitPrice) || 0,
    total: Number(li?.subtotal) || 0,
  }));
  const invoices: any[] = Array.isArray(raw?.invoices) ? raw.invoices : [];
  const dp = invoices.find((inv) => String(inv?.type).toUpperCase() === "DP");
  return {
    id: raw?.id,
    code: raw?.orderNumber ?? EMPTY,
    customer: raw?.lead?.clientName ?? "Klien belum tertaut",
    brand: raw?.brandName ?? raw?.salesCategory ?? EMPTY,
    itemsCount: rows.length,
    quantity: Number(raw?.quantity) || 0,
    totalAmount: Number(raw?.totalAmount) || 0,
    dpStatus: dp ? (dp.status ?? EMPTY) : "BELUM ADA INVOICE DP",
    salesPic: EMPTY,
    title: raw?.amendmentReason ?? raw?.brandName ?? EMPTY,
    partnerName: raw?.lead?.clientName ?? EMPTY,
    date: formatDate(raw?.transactionDate ?? raw?.createdAt),
    dueDate: formatDate(raw?.dueDate),
    status: approvalStatusOf(raw?.status),
    notes: raw?.amendmentReason ?? EMPTY,
    lineItems,
  };
}

export default function SalesOrderApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["sales-orders-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/commercial/sales-orders");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/commercial/sales-orders/${id}`, { status: "ACTIVE" })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Sales order disetujui dan diaktifkan.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui sales order."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/commercial/sales-orders/${id}`, { status: "CANCELLED" })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Sales order dibatalkan.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal membatalkan sales order."),
  });

  const items = React.useMemo<SalesOrderApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const columns: ApprovalColumn<SalesOrderApprovalItem>[] = [
    {
      header: "Nomor SO",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} />,
    },
    {
      header: "Klien & Brand",
      accessor: "customer",
      sortable: true,
      render: (item) => <DnaCell.Text primary={item.customer} secondary={item.brand} />,
    },
    {
      header: "Item / Qty",
      accessor: "itemsCount",
      align: "right",
      render: (item) => (
        <DnaCell.Number value={item.quantity} suffix={`qty • ${item.itemsCount} item`} />
      ),
    },
    {
      header: "Invoice DP",
      accessor: "dpStatus",
      align: "center",
      render: (item) => (
        <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
          {item.dpStatus}
        </span>
      ),
    },
    {
      header: "Tanggal / Jatuh Tempo",
      accessor: "date",
      render: (item) => (
        <DnaCell.Text primary={item.date} secondary={`Jatuh tempo: ${item.dueDate}`} />
      ),
    },
    {
      header: "Total Nominal",
      accessor: "totalAmount",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Currency value={item.totalAmount} />,
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      render: (item) => (
        <DnaBadge
          status={
            item.status === "APPROVED"
              ? "SUCCESS"
              : item.status === "REJECTED"
              ? "DANGER"
              : "WARNING"
          }
        >
          {item.status === "APPROVED"
            ? "DISETUJUI"
            : item.status === "REJECTED"
            ? "DITOLAK"
            : "MENUNGGU"}
        </DnaBadge>
      ),
    },
  ];

  const buildDetailData = (item: SalesOrderApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan Sales Order: ${item.customer} (${item.brand})`,
    category: "PENJUALAN PRODUK JADI",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.customer,
    creatorRole: "Klien Maklon",
    partnerName: item.customer,
    partnerLabel: "Klien Maklon (Pelanggan)",
    totalAmount: item.totalAmount,
    notes: `Status Invoice DP: ${item.dpStatus}${item.notes !== EMPTY ? ` | ${item.notes}` : ""}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Sales order tercatat di sistem",
        actor: item.customer,
        role: "Commercial",
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Aktivasi sales order (interlock DP lunas)",
        actor: "Menunggu keputusan approver",
        role: "Management",
        timestamp: item.status === "PENDING" ? "Menunggu eksekusi" : item.date,
        status:
          item.status === "APPROVED"
            ? "completed"
            : item.status === "REJECTED"
            ? "failed"
            : "pending",
      },
    ],
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Memuat daftar sales order...</div>;
  }

  if (isError) {
    const errStatus = (error as { response?: { status?: number } })?.response?.status;
    const denied = errStatus === 401 || errStatus === 403;
    return (
      <div className="p-8">
        <DnaErrorState
          title={denied ? "Akses ditolak" : "Gagal memuat data"}
          message={
            denied
              ? "Akun ini tidak berwenang membaca daftar sales order."
              : "Daftar sales order tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">Belum ada sales order pada sistem.</div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PENJUALAN PRODUK (SALES ORDER)"
      subtitle="Otorisasi pemesanan maklon klien, verifikasi plafon kredit piutang (AR), dan penerbitan Surat Perintah Kerja (SPK) produksi."
      categoryBadge="PENJUALAN PRODUK ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Penjualan Produk" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={(id) => approveMutation.mutateAsync(id)}
      onReject={(id) => rejectMutation.mutateAsync(id)}
      searchPlaceholder="Cari nomor SO, nama pelanggan, brand..."
    />
  );
}