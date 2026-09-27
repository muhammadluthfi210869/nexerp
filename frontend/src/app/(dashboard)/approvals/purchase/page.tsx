"use client";

/**
 * Wired to GET /scm/purchase-orders + POST /scm/purchase-orders/:id/{approve,reject}.
 * The previous revision rendered an in-file `INITIAL_PURCHASE_DATA` array of invented
 * purchase orders, so an operator could "approve" a PO that existed only in the
 * bundle. There is no static array and no fallback here.
 *
 * Note: the approve endpoint enforces BUS-RULE-022 (a digital signature must already
 * be attached to the PO). This screen does not upload one, so an unsigned PO surfaces
 * the backend's refusal as an error toast instead of silently bypassing the rule via
 * PATCH /:id/status.
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

interface PurchaseApprovalItem {
  id: string;
  code: string;
  supplier: string;
  warehouse: string;
  itemsCount: number;
  totalAmount: number;
  paymentTerm: string;
  requesterName: string;
  creatorRole: string;
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
    tax?: number;
    total: number;
    notes?: string;
  }>;
}

/** POStatus → the shell/modal vocabulary. */
function approvalStatusOf(status?: string): "PENDING" | "APPROVED" | "REJECTED" {
  const key = (status || "").toUpperCase();
  if (key === "REJECTED" || key === "CANCELLED" || key === "RETURNED") return "REJECTED";
  if (key === "DRAFT" || key === "PENDING" || key === "PENDING_APPROVAL") return "PENDING";
  if (key === "APPROVED") return "APPROVED";
  // ORDERED / PARTIAL / SHIPPED / RECEIVED / CLOSED — already past approval.
  return key ? "APPROVED" : "PENDING";
}

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toItem(raw: any): PurchaseApprovalItem {
  const items: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems = items.map((li: any, idx: number) => {
    const qty = Number(li?.quantity) || 0;
    const unitPrice = Number(li?.unitPrice) || 0;
    return {
      id: li?.id ?? `li-${idx}`,
      itemCode: li?.material?.code ?? EMPTY,
      itemName: li?.material?.name ?? "Material belum tertaut",
      qty,
      unit: li?.material?.unit ?? EMPTY,
      unitPrice,
      total: Number(li?.totalPrice) || qty * unitPrice,
    };
  });
  return {
    id: raw?.id,
    code: raw?.poNumber ?? EMPTY,
    supplier: raw?.supplier?.name ?? "Supplier belum tertaut",
    warehouse: raw?.purchaseRequest?.warehouse?.name ?? EMPTY,
    itemsCount: items.length,
    totalAmount: Number(raw?.totalValue) || 0,
    paymentTerm: raw?.supplier?.termOfPayment
      ? `${raw.supplier.termOfPayment} hari`
      : EMPTY,
    requesterName: raw?.scm?.fullName ?? EMPTY,
    creatorRole: "SCM Processor",
    title: raw?.notes ?? EMPTY,
    partnerName: raw?.supplier?.name ?? EMPTY,
    date: formatDate(raw?.createdAt),
    dueDate: formatDate(raw?.dueDate ?? raw?.estArrival),
    status: approvalStatusOf(raw?.status),
    notes: raw?.notes ?? EMPTY,
    lineItems,
  };
}

export default function PurchaseApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["purchase-orders-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/scm/purchase-orders");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/scm/purchase-orders/${id}/approve`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Purchase order disetujui.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui purchase order."),
  });

  const rejectMutation = useMutation({
    mutationFn: (p: { id: string; reason: string }) =>
      api
        .post(`/scm/purchase-orders/${p.id}/reject`, { reason: p.reason })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Purchase order ditolak.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menolak purchase order."),
  });

  const items = React.useMemo<PurchaseApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const columns: ApprovalColumn<PurchaseApprovalItem>[] = [
    {
      header: "Nomor PO",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} />,
    },
    {
      header: "Supplier & Gudang Tujuan",
      accessor: "supplier",
      sortable: true,
      render: (item) => <DnaCell.Text primary={item.supplier} secondary={item.warehouse} />,
    },
    {
      header: "Pemohon",
      accessor: "requesterName",
      render: (item) => (
        <DnaCell.Text primary={item.requesterName} secondary={item.creatorRole} />
      ),
    },
    {
      header: "Termin & Tgl",
      accessor: "date",
      render: (item) => <DnaCell.Text primary={item.paymentTerm} secondary={`Tgl: ${item.date}`} />,
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

  const buildDetailData = (item: PurchaseApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan Purchase Order: ${item.supplier}`,
    category: "PENGADAAN PEMBELIAN",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.supplier,
    partnerLabel: "Supplier Vendor",
    warehouseName: item.warehouse,
    totalAmount: item.totalAmount,
    notes: item.notes,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "PO tercatat di sistem oleh Procurement",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi purchase order",
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
    return <div className="p-8 text-center text-slate-400">Memuat daftar purchase order...</div>;
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
              ? "Akun ini tidak berwenang membaca daftar purchase order."
              : "Daftar purchase order tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">Belum ada purchase order pada sistem.</div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PEMBELIAN (PURCHASE ORDER)"
      subtitle="Verifikasi dan otorisasi pengadaan purchase order, plafon harga vendor supplier, dan jadwal kedatangan gudang."
      categoryBadge="PEMBELIAN ~4"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Pembelian" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={(id) => approveMutation.mutateAsync(id)}
      onReject={(id, reason) => rejectMutation.mutateAsync({ id, reason })}
      searchPlaceholder="Cari nomor PO, nama vendor supplier, pemohon..."
    />
  );
}