"use client";

/**
 * Wired to GET /finance/job-order-costings (+ POST /:id/close, POST /:id/reopen).
 * The previous revision rendered an in-file `INITIAL_COGS_DATA` array of invented HPP
 * requests with fabricated formula/packaging/overhead breakdowns, client names, MOQ and
 * margin figures — none of which exist on the live model. There is no static array and
 * no fallback here.
 *
 * Honest limits: JobOrderCosting carries jobOrderNumber, description, totalCost,
 * totalRevenue, recordedAt and closedAt — nothing else. Columns that had no backend
 * source (MOQ, margin, client, per-component HPP) are gone rather than invented; the
 * table shows cost, revenue and the derived margin the API can actually support.
 *
 * The list endpoint's `closed` query filter is a no-op in the service, so the split
 * between "waiting" and "closed" is applied client-side on closedAt.
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

interface CogsApprovalItem {
  id: string;
  code: string;
  description: string;
  totalCost: number;
  totalRevenue: number;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  totalAmount: number;
  marginPercent: number;
  date: string;
  closedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
}

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toItem(raw: any): CogsApprovalItem {
  const cost = Number(raw?.totalCost) || 0;
  const revenue = Number(raw?.totalRevenue) || 0;
  const closed = Boolean(raw?.closedAt);
  return {
    id: raw?.id,
    code: raw?.jobOrderNumber ?? EMPTY,
    description: raw?.description ?? EMPTY,
    totalCost: cost,
    totalRevenue: revenue,
    marginPercent: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 1000) / 10 : 0,
    date: formatDate(raw?.recordedAt),
    closedAt: formatDate(raw?.closedAt),
    // The model has no rejection state: an open costing is awaiting review, a closed
    // one has been signed off. Nothing is labelled REJECTED because nothing can be.
    status: closed ? "APPROVED" : "PENDING",
    title: raw?.description ?? EMPTY,
    totalAmount: cost,
    notes: raw?.description ?? EMPTY,
  };
}

export default function RequestCogsApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["job-order-costings-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/finance/job-order-costings");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/finance/job-order-costings/${id}/close`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Permintaan HPP disetujui (job order ditutup).");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui permintaan HPP."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/finance/job-order-costings/${id}/reopen`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Job order dibuka kembali.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal membuka kembali job order."),
  });

  const items = React.useMemo<CogsApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const columns: ApprovalColumn<CogsApprovalItem>[] = [
    {
      header: "No. Job Order",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} />,
    },
    {
      header: "Deskripsi",
      accessor: "description",
      render: (item) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-xs">{item.description}</p>
      ),
    },
    {
      header: "Total Biaya (HPP)",
      accessor: "totalCost",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Currency value={item.totalCost} />,
    },
    {
      header: "Total Pendapatan",
      accessor: "totalRevenue",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Currency value={item.totalRevenue} />,
    },
    {
      header: "Margin",
      accessor: "marginPercent",
      align: "center",
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
          {item.marginPercent}%
        </span>
      ),
    },
    {
      header: "Dicatat / Ditutup",
      accessor: "date",
      render: (item) => (
        <DnaCell.Text primary={item.date} secondary={`Ditutup: ${item.closedAt}`} />
      ),
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

  const buildDetailData = (item: CogsApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Job Order Costing: ${item.code}`,
    category: "PERMINTAAN HPP / JOB ORDER COSTING",
    status: item.status,
    date: item.date,
    // JobOrderCosting records no author, so the requester is not claimed.
    creatorName: EMPTY,
    creatorRole: "Finance",
    partnerName: EMPTY,
    partnerLabel: "Klien",
    totalAmount: item.totalCost,
    notes: `${item.notes} | Total pendapatan: Rp ${item.totalRevenue.toLocaleString("id-ID")} | Margin: ${item.marginPercent}%`,
    lineItems: [
      {
        id: "jo-cost",
        itemCode: "COST",
        itemName: "Total biaya job order (HPP)",
        qty: 1,
        unit: "job",
        unitPrice: item.totalCost,
        total: item.totalCost,
      },
      {
        id: "jo-revenue",
        itemCode: "REVENUE",
        itemName: "Total pendapatan job order",
        qty: 1,
        unit: "job",
        unitPrice: item.totalRevenue,
        total: item.totalRevenue,
      },
    ],
    timeline: [
      {
        id: "tl-1",
        action: "Job order costing dicatat",
        actor: EMPTY,
        role: "Finance",
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Penutupan job order (kunci penyesuaian biaya)",
        actor: "Menunggu keputusan approver",
        role: "Management",
        timestamp: item.status === "PENDING" ? "Menunggu eksekusi" : item.closedAt,
        status: item.status === "APPROVED" ? "completed" : "pending",
      },
    ],
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Memuat daftar job order costing...</div>;
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
              ? "Akun ini tidak berwenang membaca daftar job order costing."
              : "Daftar job order costing tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Belum ada job order costing pada sistem.</p>
        <p className="text-xs text-slate-400 mt-2">
          Endpoint finance/job-order-costings belum menyediakan rincian komponen HPP
          (formula, kemasan, overhead) maupun data klien dan MOQ.
        </p>
      </div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN HPP (JOB ORDER COSTING)"
      subtitle="Verifikasi perhitungan harga pokok produksi (HPP) per job order sebelum penentuan harga jual resmi."
      categoryBadge="PERMINTAAN HPP ~2"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan HPP" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={(id) => approveMutation.mutateAsync(id)}
      onReject={(id) => rejectMutation.mutateAsync(id)}
      searchPlaceholder="Cari nomor job order, deskripsi..."
    />
  );
}