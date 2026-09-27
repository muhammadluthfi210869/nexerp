"use client";

/**
 * Wired to GET /scm/goods-requirements (+ PATCH /scm/goods-requirements/:id/status).
 * The previous revision rendered an in-file `INITIAL_GOODS_REQUEST_DATA` array of
 * invented requisitions, so an operator could "approve" a record that existed only
 * in the bundle. There is no static array and no fallback here.
 *
 * Honest limits of the live endpoint: `findAll` returns the GoodsRequirement row
 * only — no `items`, no `creator`, no warehouse relation — so this screen shows
 * the fields the API actually carries and leaves the item breakdown empty rather
 * than inventing one.
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

interface GoodsRequestApprovalItem {
  id: string;
  code: string;
  salesOrderId: string;
  // Aliases read by ApprovalPageShell's search.
  title: string;
  partnerName: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
}

/** GoodsRequirement.status is a free String column; the app writes APPROVED / COMPLETED. */
function approvalStatusOf(status?: string): "PENDING" | "APPROVED" | "REJECTED" {
  const key = (status || "").toUpperCase();
  if (key === "APPROVED" || key === "COMPLETED" || key === "RELEASED") return "APPROVED";
  if (key === "REJECTED" || key === "CANCELLED") return "REJECTED";
  return "PENDING";
}

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toItem(raw: any): GoodsRequestApprovalItem {
  return {
    id: raw?.id,
    code: raw?.code ?? EMPTY,
    salesOrderId: raw?.salesOrderId ?? EMPTY,
    title: raw?.notes ?? EMPTY,
    partnerName: raw?.salesOrderId ?? EMPTY,
    date: formatDate(raw?.date ?? raw?.createdAt),
    status: approvalStatusOf(raw?.status),
    notes: raw?.notes ?? EMPTY,
  };
}

export default function GoodsRequestApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["goods-requirements-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/scm/goods-requirements");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const setStatus = useMutation({
    mutationFn: (p: { id: string; status: string }) =>
      api
        .patch(`/scm/goods-requirements/${p.id}/status`, { status: p.status })
        .then((r) => unwrapResponse(r)),
    onSuccess: (_res, p) => {
      toast.success(
        p.status === "APPROVED"
          ? "Permintaan barang disetujui."
          : "Permintaan barang ditolak.",
      );
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal memperbarui status permintaan barang."),
  });

  const items = React.useMemo<GoodsRequestApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const columns: ApprovalColumn<GoodsRequestApprovalItem>[] = [
    {
      header: "No. Bon Permintaan",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} />,
    },
    {
      header: "Ref Sales Order",
      accessor: "salesOrderId",
      render: (item) => <DnaCell.Code value={item.salesOrderId} subtitle="ID Sales Order" />,
    },
    {
      header: "Tanggal",
      accessor: "date",
      sortable: true,
      render: (item) => <DnaCell.Date value={item.date} />,
    },
    {
      header: "Keterangan",
      accessor: "notes",
      render: (item) => (
        <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">{item.notes}</p>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      render: (item) => (
        <DnaBadge
          variant={
            item.status === "APPROVED"
              ? "success"
              : item.status === "REJECTED"
              ? "critical"
              : "warning"
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

  const buildDetailData = (item: GoodsRequestApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Permintaan Barang untuk Sales Order ${item.salesOrderId}`,
    category: "PERMINTAAN BARANG INTERNAL",
    status: item.status,
    date: item.date,
    creatorName: EMPTY,
    partnerName: item.salesOrderId,
    partnerLabel: "Sales Order Terkait",
    notes: item.notes,
    timeline: [
      {
        id: "tl-1",
        action: "Bon permintaan barang tercatat di sistem",
        actor: EMPTY,
        role: "SCM",
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi permintaan barang",
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
    return <div className="p-8 text-center text-slate-400">Memuat daftar permintaan barang...</div>;
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
              ? "Akun ini tidak berwenang membaca daftar permintaan barang."
              : "Daftar permintaan barang tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Belum ada permintaan barang pada sistem.</p>
        <p className="text-xs text-slate-400 mt-2">
          Rincian item per bon belum tersedia dari endpoint daftar (scm/goods-requirements).
        </p>
      </div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN BARANG (MATERIAL REQUISITION)"
      subtitle="Validasi bon pengeluaran bahan baku, kemasan, dan transfer antar gudang untuk kelancaran eksekusi batch produksi SPK."
      categoryBadge="PERMINTAAN BARANG ~6"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan Barang" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={(id) => setStatus.mutateAsync({ id, status: "APPROVED" })}
      onReject={(id) => setStatus.mutateAsync({ id, status: "REJECTED" })}
      searchPlaceholder="Cari nomor bon, ref sales order, keterangan..."
    />
  );
}