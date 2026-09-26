"use client";

/**
 * Wired to GET /bussdev/returns (+ PATCH /bussdev/returns/:id).
 * The previous revision rendered an in-file `INITIAL_SALES_RETURN_DATA` array of
 * invented returns, so an operator could "approve" a claim that existed only in the
 * bundle. There is no static array and no fallback here.
 *
 * Honest limits: SalesReturn carries no monetary value, no invoice reference and no
 * coded defect reason — only notes, a free-text returnStatus, its lines and the linked
 * sales order. The "nilai retur" column is gone rather than invented; the raw
 * returnStatus is shown as its own column so nothing is hidden behind a relabel.
 * returnStatus is a free String defaulting to POTONG_TAGIHAN (a settlement mode, not an
 * approval), so a record with no explicit decision is presented as MENUNGGU.
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

interface SalesReturnApprovalItem {
  id: string;
  code: string;
  soNumber: string;
  customer: string;
  brand: string;
  // Aliases read by ApprovalPageShell's search.
  title: string;
  partnerName: string;
  rawStatus: string;
  itemCount: number;
  totalQty: number;
  warehouse: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
  lineItems: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    qty: number;
    unit: string;
    originalQty: number;
  }>;
}

/** Free-text returnStatus → the shell/modal vocabulary. */
function approvalStatusOf(status?: string): "PENDING" | "APPROVED" | "REJECTED" {
  const key = (status || "").toUpperCase();
  if (key === "REJECTED" || key === "DITOLAK" || key === "CANCELLED") return "REJECTED";
  if (["APPROVED", "DISETUJUI", "COMPLETED", "SELESAI", "RECEIVED", "DITERIMA", "QC_PASSED"].includes(key))
    return "APPROVED";
  return "PENDING";
}

function formatDate(value?: string | null): string {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toItem(raw: any): SalesReturnApprovalItem {
  const rows: any[] = Array.isArray(raw?.items) ? raw.items : [];
  const lineItems = rows.map((li: any, idx: number) => ({
    id: li?.id ?? `li-${idx}`,
    itemCode: li?.material?.code ?? EMPTY,
    itemName: li?.material?.name ?? "Material belum tertaut",
    qty: Number(li?.qtyReturned) || 0,
    unit: li?.material?.unit ?? EMPTY,
    originalQty: Number(li?.qtyOriginal) || 0,
  }));
  return {
    id: raw?.id,
    code: raw?.so?.orderNumber ? `RT-${raw.so.orderNumber}` : (raw?.id ?? "").slice(0, 8),
    soNumber: raw?.so?.orderNumber ?? EMPTY,
    customer: raw?.so?.lead?.clientName ?? "Klien belum tertaut",
    brand: raw?.so?.brandName ?? EMPTY,
    rawStatus: raw?.returnStatus ?? EMPTY,
    itemCount: rows.length,
    totalQty: lineItems.reduce((sum, li) => sum + li.qty, 0),
    warehouse: raw?.warehouse?.name ?? EMPTY,
    date: formatDate(raw?.returnDate ?? raw?.createdAt),
    title: `${raw?.so?.orderNumber ?? "SO belum tertaut"} — ${raw?.notes ?? EMPTY}`,
    partnerName: raw?.so?.lead?.clientName ?? EMPTY,
    status: approvalStatusOf(raw?.returnStatus),
    notes: raw?.notes ?? EMPTY,
    lineItems,
  };
}

export default function SalesReturnApprovalPage() {
  const qc = useQueryClient();
  const queryKey = ["sales-returns-approval"];

  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const resp = await api.get("/bussdev/returns");
      const body = unwrapResponse<any>(resp);
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api
        .patch(`/bussdev/returns/${id}`, { returnStatus: "APPROVED" })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur penjualan disetujui.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menyetujui retur penjualan."),
  });

  const rejectMutation = useMutation({
    mutationFn: (p: { id: string; reason: string }) =>
      api
        .patch(`/bussdev/returns/${p.id}`, { returnStatus: "REJECTED", notes: p.reason })
        .then((r) => unwrapResponse(r)),
    onSuccess: () => {
      toast.success("Retur penjualan ditolak.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menolak retur penjualan."),
  });

  const items = React.useMemo<SalesReturnApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data],
  );

  const columns: ApprovalColumn<SalesReturnApprovalItem>[] = [
    {
      header: "Sales Order",
      accessor: "soNumber",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.soNumber} subtitle={`Retur: ${item.code}`} />,
    },
    {
      header: "Klien & Brand",
      accessor: "customer",
      sortable: true,
      render: (item) => <DnaCell.Text primary={item.customer} secondary={item.brand} />,
    },
    {
      header: "Qty Retur",
      accessor: "totalQty",
      align: "right",
      sortable: true,
      render: (item) => <DnaCell.Number value={item.totalQty} suffix={`qty • ${item.itemCount} item`} />,
    },
    {
      header: "Gudang",
      accessor: "warehouse",
      render: (item) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">{item.warehouse}</span>
      ),
    },
    {
      header: "Status Backend",
      accessor: "rawStatus",
      align: "center",
      render: (item) => (
        <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
          {item.rawStatus}
        </span>
      ),
    },
    {
      header: "Tanggal",
      accessor: "date",
      sortable: true,
      render: (item) => <DnaCell.Date value={item.date} />,
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

  const buildDetailData = (item: SalesReturnApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Retur Penjualan: ${item.customer} (${item.soNumber})`,
    category: "RETUR PENJUALAN KLIEN",
    status: item.status,
    date: item.date,
    // SalesReturn records no author, so no requester is claimed here.
    creatorName: EMPTY,
    creatorRole: "Commercial",
    partnerName: item.customer,
    partnerLabel: "Pelanggan Maklon",
    warehouseName: item.warehouse,
    notes: `${item.notes} | Status backend: ${item.rawStatus}`,
    lineItems: item.lineItems.map((li) => ({
      id: li.id,
      itemCode: li.itemCode,
      itemName: li.itemName,
      qty: li.qty,
      unit: li.unit,
      notes: `Qty asal: ${li.originalQty}`,
    })),
    timeline: [
      {
        id: "tl-1",
        action: "Klaim retur tercatat di sistem",
        actor: item.customer,
        role: "Commercial",
        timestamp: item.date,
        status: "completed",
      },
      {
        id: "tl-2",
        action: "Otorisasi retur penjualan",
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
    return <div className="p-8 text-center text-slate-400">Memuat daftar retur penjualan...</div>;
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
              ? "Akun ini tidak berwenang membaca daftar retur penjualan."
              : "Daftar retur penjualan tidak dapat diambil dari server."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Belum ada retur penjualan pada sistem.</p>
        <p className="text-xs text-slate-400 mt-2">
          Endpoint bussdev/returns belum menyediakan nilai retur, nomor invoice acuan,
          maupun kode alasan klaim.
        </p>
      </div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN RETUR PENJUALAN"
      subtitle="Otorisasi penerimaan kembali barang jadi dari pelanggan, verifikasi penyebab cacat produk, dan penerbitan nota kredit (Credit Memo)."
      categoryBadge="RETUR PENJUALAN ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Retur Penjualan" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={(id) => approveMutation.mutateAsync(id)}
      onReject={(id, reason) => rejectMutation.mutateAsync({ id, reason })}
      searchPlaceholder="Cari nomor SO, nama pelanggan, catatan..."
    />
  );
}