"use client";

/**
 * Wired to GET /scm/purchase-returns (+ POST /:id/approve, PATCH /:id/status).
 * The previous revision rendered an in-file `INITIAL_PURCHASE_RETURN_DATA` array of
 * invented returns, so an operator could "approve" a record that existed only in the
 * bundle. There is no static array and no fallback here.
 *
 * Honest limits of the live model: PurchaseReturn carries no free-text "return reason"
 * and no PO reference — it links to an inbound GR. The reason column is therefore the
 * record's own notes, not a fabricated classification.
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

interface PurchaseReturnItem {
  id: string;
  code: string;
  refInbound: string;
  supplier: string;
  warehouse: string;
  returnReason: string;
  debitNote: string;
  totalAmount: number;
  requesterName: string;
  creatorRole: string;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  partnerName: string;
  date: string;
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

/** PurchaseReturnStatus → the shell/modal vocabulary. */
function approvalStatusOf(status?: string): "PENDING" | "APPROVED" | "REJECTED" {
  const key = (status || "").toUpperCase();
  if (key === "COMPLETED") return "APPROVED";
  if (key === "CANCELLED") return "REJECTED";
  return "PENDING";
}

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toItem(raw: any): PurchaseReturnItem {
  const rows: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems = rows.map((li: any, idx: number) => ({
    id: li?.id ?? `li-${idx}`,
    itemCode: li?.material?.code ?? EMPTY,
    itemName: li?.material?.name ?? "Material belum tertaut",
    qty: Number(li?.quantity) || 0,
    unit: li?.material?.unit ?? EMPTY,
    unitPrice: Number(li?.unitPrice) || 0,
    total: Number(li?.totalPrice) || 0,
  }));
  return {
    id: raw?.id,
    code: raw?.returnNumber ?? EMPTY,
    refInbound: raw?.inboundId ? raw.inboundId.slice(0, 8) : EMPTY,
    supplier: raw?.supplier?.name ?? "Supplier belum tertaut",
    warehouse: raw?.warehouse?.name ?? EMPTY,
    returnReason: raw?.notes ?? EMPTY,
    debitNote: raw?.debitNoteNumber ?? EMPTY,
    totalAmount: Number(raw?.totalValue) || 0,
    requesterName: raw?.creator?.fullName ?? EMPTY,
    creatorRole: "Pembuat Retur",
    title: raw?.notes ?? EMPTY,
    partnerName: raw?.supplier?.name ?? EMPTY,
    date: formatDate(raw?.date ?? raw?.createdAt),
    status: approvalStatusOf(raw?.status),
    notes: raw?.notes ?? EMPTY,
    lineItems,
  };
}

export default function PurchaseReturnApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["purchase-returns-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/scm/purchase-returns");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/scm/purchase-returns/${id}/approve`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur pembelian disetujui.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui retur pembelian."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/scm/purchase-returns/${id}/status`, {
          status: "CANCELLED",
          notes: "Ditolak dari layar persetujuan retur pembelian.",
        })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur pembelian dibatalkan.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal membatalkan retur pembelian."),
  });

  const items = React.useMemo<PurchaseReturnItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const columns: ApprovalColumn<PurchaseReturnItem>[] = [
    {
      header: "No. Retur",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} subtitle={`GR: ${item.refInbound}`} />,
    },
    {
      header: "Supplier",
      accessor: "supplier",
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-800 whitespace-nowrap">{item.supplier}</span>
      ),
    },
    {
      header: "Catatan Retur",
      accessor: "returnReason",
      render: (item) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-xs">{item.returnReason}</p>
      ),
    },
    {
      header: "Pemohon",
      accessor: "requesterName",
      render: (item) => (
        <DnaCell.Text primary={item.requesterName} secondary={`Tgl: ${item.date}`} />
      ),
    },
    {
      header: "Gudang",
      accessor: "warehouse",
      render: (item) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">{item.warehouse}</span>
      ),
    },
    {
      header: "Total Nilai Retur",
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

  const buildDetailData = (item: PurchaseReturnItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Retur Pembelian: ${item.supplier}`,
    category: "RETUR PEMBELIAN VENDOR",
    status: item.status,
    date: item.date,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.supplier,
    partnerLabel: "Supplier Vendor",
    warehouseName: item.warehouse,
    totalAmount: item.totalAmount,
    notes: `Catatan: ${item.notes} | Nota Debit: ${item.debitNote}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Retur pembelian tercatat di sistem",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi retur pembelian (stok & nota debit)",
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
    return <div className="p-8 text-center text-slate-400">Memuat daftar retur pembelian...</div>;
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
              ? "Akun ini tidak berwenang membaca daftar retur pembelian."
              : "Daftar retur pembelian tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">Belum ada retur pembelian pada sistem.</div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN RETUR PEMBELIAN"
      subtitle="Verifikasi nota retur pengadaan material reject, klaim garansi vendor supplier, dan penyesuaian hutang dagang (AP)."
      categoryBadge="RETUR PEMBELIAN ~1"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Retur Pembelian" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={(id) => approveMutation.mutateAsync(id)}
      onReject={(id) => rejectMutation.mutateAsync(id)}
      searchPlaceholder="Cari nomor retur, nama vendor, catatan..."
    />
  );
}