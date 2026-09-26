"use client";

/**
 * Wired to GET /purchase/requests + POST /purchase/requests/:id/{approve,reject}.
 * The previous revision rendered an in-file `INITIAL_PR_DATA` array of invented
 * purchase requests, so an operator could "approve" a record that existed only
 * in the bundle. There is no static array and no fallback here.
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

interface PurchaseRequestApprovalItem {
  id: string;
  code: string;
  department: string;
  requesterName: string;
  creatorRole: string;
  urgency: "Normal" | "Tinggi" | "Darurat";
  purpose: string;
  itemsCount: number;
  estimatedTotal: number;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  partnerName: string;
  totalAmount: number;
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
    notes?: string;
  }>;
}

/** Backend PRPriority / free-text urgency → the three labels this screen uses. */
function urgencyOf(priority?: string, urgency?: string): "Normal" | "Tinggi" | "Darurat" {
  const key = (urgency || priority || "").toUpperCase();
  if (key === "URGENT" || key === "DARURAT") return "Darurat";
  if (key === "HIGH" || key === "TINGGI") return "Tinggi";
  return "Normal";
}

/** PRStatus → the shell/modal vocabulary. */
function approvalStatusOf(status?: string): "PENDING" | "APPROVED" | "REJECTED" {
  const key = (status || "").toUpperCase();
  if (key === "APPROVED" || key === "CONVERTED") return "APPROVED";
  if (key === "REJECTED" || key === "CANCELLED") return "REJECTED";
  return "PENDING";
}

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toItem(raw: any): PurchaseRequestApprovalItem {
  const items: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems = items.map((li: any, idx: number) => {
    const qty = Number(li?.qtyRequired) || 0;
    const unitPrice = Number(li?.estimatedPrice) || 0;
    return {
      id: li?.id ?? `li-${idx}`,
      itemCode: li?.material?.code ?? EMPTY,
      itemName: li?.material?.name ?? "Material belum tertaut",
      qty,
      unit: li?.material?.unit ?? EMPTY,
      unitPrice,
      total: qty * unitPrice,
    };
  });
  return {
    id: raw?.id,
    code: raw?.requestNumber ?? EMPTY,
    department: raw?.warehouse?.name ?? EMPTY,
    requesterName: raw?.creator?.fullName ?? EMPTY,
    creatorRole: raw?.warehouse?.name ? `Gudang ${raw.warehouse.name}` : "Pemohon Internal",
    urgency: urgencyOf(raw?.priority, raw?.urgency),
    purpose: raw?.notes ?? raw?.budgetCode ?? EMPTY,
    itemsCount: items.length,
    estimatedTotal: lineItems.reduce((sum, li) => sum + li.total, 0),
    title: raw?.notes ?? raw?.budgetCode ?? EMPTY,
    partnerName: raw?.warehouse?.name ?? EMPTY,
    totalAmount: lineItems.reduce((sum, li) => sum + li.total, 0),
    date: formatDate(raw?.requestDate ?? raw?.createdAt),
    dueDate: EMPTY,
    status: approvalStatusOf(raw?.status),
    notes: raw?.notes ?? EMPTY,
    lineItems,
  };
}

export default function PurchaseRequestApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["purchase-requests-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/purchase/requests");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/purchase/requests/${id}/approve`).then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Permintaan pembelian disetujui.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui permintaan pembelian."),
  });

  const rejectMutation = useMutation({
    mutationFn: (p: { id: string; reason: string }) =>
      api
        .post(`/purchase/requests/${p.id}/reject`, { reason: p.reason })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Permintaan pembelian ditolak.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menolak permintaan pembelian."),
  });

  const items = React.useMemo<PurchaseRequestApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const columns: ApprovalColumn<PurchaseRequestApprovalItem>[] = [
    {
      header: "No. PR",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} />,
    },
    {
      header: "Gudang / Departemen",
      accessor: "department",
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-800 whitespace-nowrap">{item.department}</span>
      ),
    },
    {
      header: "Pemohon",
      accessor: "requesterName",
      sortable: true,
      render: (item) => (
        <span className="text-slate-600 whitespace-nowrap">{item.requesterName}</span>
      ),
    },
    {
      header: "Urgensi",
      accessor: "urgency",
      align: "center",
      render: (item) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            item.urgency === "Darurat"
              ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
              : item.urgency === "Tinggi"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {item.urgency}
        </span>
      ),
    },
    {
      header: "Tujuan Pengadaan",
      accessor: "purpose",
      render: (item) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-xs">{item.purpose}</p>
      ),
    },
    {
      header: "Estimasi Biaya",
      accessor: "estimatedTotal",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Currency value={item.estimatedTotal} />,
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

  const buildDetailData = (item: PurchaseRequestApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Purchase Request: ${item.department}`,
    category: "PERMINTAAN PEMBELIAN INTERNAL",
    status: item.status,
    date: item.date,
    creatorName: item.requesterName,
    creatorRole: item.creatorRole,
    partnerName: item.department,
    partnerLabel: "Gudang / Departemen Pemohon",
    totalAmount: item.estimatedTotal,
    notes: `Tingkat Urgensi: ${item.urgency} | Catatan: ${item.notes}`,
    lineItems: item.lineItems,
    timeline: [
      {
        id: "tl-1",
        action: "Permintaan pembelian tercatat di sistem",
        actor: item.requesterName,
        role: item.creatorRole,
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi berjenjang (Procurement / Finance)",
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
    return <div className="p-8 text-center text-slate-400">Memuat daftar permintaan pembelian...</div>;
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
              ? "Akun ini tidak berwenang membaca daftar permintaan pembelian."
              : "Daftar permintaan pembelian tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        Belum ada permintaan pembelian pada sistem.
      </div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PERMINTAAN PEMBELIAN (PURCHASE REQUEST)"
      subtitle="Validasi surat permintaan pembelian (PR) internal divisi, verifikasi anggaran belanja OPEX/CAPEX, dan penerbitan PO ke supplier."
      categoryBadge="PERMINTAAN PEMBELIAN ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Permintaan Pembelian" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={(id) => approveMutation.mutateAsync(id)}
      onReject={(id, reason) => rejectMutation.mutateAsync({ id, reason })}
      searchPlaceholder="Cari nomor PR, gudang pemohon, justifikasi..."
    />
  );
}