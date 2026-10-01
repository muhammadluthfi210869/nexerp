import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
} from "@/components/dna";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  EMPTY,
  type GoodsRequestApprovalItem,
  toItem,
} from "../_types/goods-request.types";

export function useGoodsRequestApprovalOperations() {
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

  return {
    items,
    columns,
    buildDetailData,
    isLoading,
    isError,
    error,
    refetch,
    setStatus,
  };
}
