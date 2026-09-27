"use client";

/**
 * Persetujuan Penjualan Sample (R&D) — P08 sample approval work list.
 *
 * Every value on this page comes from the production API
 * (`GET /rnd/samples`). The previous revision rendered an in-file
 * `INITIAL_SAMPLE_DATA` array of three invented samples, so an operator could
 * "approve" a record that existed only in the bundle. There is no static array,
 * no browser storage and no fallback here.
 */

import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
  DnaErrorState,
} from "@/components/dna";

type ApiFormulaPhase = {
  prefix: string;
  order: number;
  items: Array<{
    id: string;
    dosagePercentage: string | number;
    costSnapshot: string | number | null;
    material: { code: string | null; name: string } | null;
  }>;
};

type ApiSample = {
  id: string;
  sampleCode: string;
  productName: string;
  targetFunction: string;
  textureReq: string;
  colorReq: string;
  aromaReq: string;
  stage: string;
  requestedAt: string;
  targetDeadline: string | null;
  feedback: string | null;
  rejectionReason: string | null;
  pic: { fullName: string } | null;
  lead: {
    clientName: string | null;
    brandName: string | null;
    pic: { fullName: string } | null;
  } | null;
  formulas: Array<{ version: number; phases: ApiFormulaPhase[] }>;
};

type SalesSampleApprovalItem = {
  id: string;
  code: string;
  client: string;
  brand: string;
  productName: string;
  targetFunction: string;
  formulator: string;
  revision: string;
  salesPic: string;
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
  }>;
};

const EMPTY = "—";

const formatDate = (value: string | null | undefined) => {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/** The canonical sample stage mapped onto the approval shell's three states. */
const approvalStatusOf = (stage: string): SalesSampleApprovalItem["status"] => {
  if (stage === "APPROVED") return "APPROVED";
  if (stage === "REJECTED" || stage === "CANCELLED") return "REJECTED";
  return "PENDING";
};

const toItem = (sample: ApiSample): SalesSampleApprovalItem => {
  const formula = sample.formulas?.[0];
  const lineItems = (formula?.phases ?? [])
    .flatMap((phase) => phase.items ?? [])
    .map((item) => ({
      id: item.id,
      itemCode: item.material?.code ?? EMPTY,
      itemName: item.material?.name ?? "Material belum tertaut",
      qty: Number(item.dosagePercentage) || 0,
      unit: "%",
    }));

  return {
    id: sample.id,
    code: sample.sampleCode,
    client: sample.lead?.clientName ?? EMPTY,
    brand: sample.lead?.brandName ?? EMPTY,
    productName: sample.productName,
    targetFunction: sample.targetFunction,
    formulator: sample.pic?.fullName ?? EMPTY,
    revision: formula ? `V${formula.version}` : EMPTY,
    salesPic: sample.lead?.pic?.fullName ?? EMPTY,
    date: formatDate(sample.requestedAt),
    dueDate: formatDate(sample.targetDeadline),
    status: approvalStatusOf(sample.stage),
    notes: sample.rejectionReason || sample.feedback || "",
    lineItems,
  };
};

export default function SalesSampleApprovalPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery<ApiSample[]>({
    queryKey: ["rnd-samples-approval"],
    queryFn: async () => {
      const resp = await api.get("/rnd/samples");
      const body = resp.data;
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const handleApprove = useCallback(async (id: string, notes?: string) => {
    // Transition sample stage to APPROVED or call accept endpoint
    try {
      await api.patch(`/rnd/sample/${id}/advance`, {
        newStage: "APPROVED",
        feedback: notes || "Sample approved via approval portal",
      });
    } catch {
      await api.post(`/rnd/sample/${id}/accept`, {});
    }
    queryClient.invalidateQueries({ queryKey: ["rnd-samples-approval"] });
  }, [queryClient]);

  const handleReject = useCallback(async (id: string, reason: string) => {
    await api.patch(`/rnd/sample/${id}/advance`, {
      newStage: "REJECTED",
      rejectionReason: reason || "Sample rejected by client / reviewer",
    });
    queryClient.invalidateQueries({ queryKey: ["rnd-samples-approval"] });
  }, [queryClient]);

  const items = useMemo<SalesSampleApprovalItem[]>(
    () => (Array.isArray(data) ? data.map(toItem) : []),
    [data]
  );

  const errStatus = (error as { response?: { status?: number } })?.response?.status;
  const denied = errStatus === 401 || errStatus === 403;
  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "Gagal memuat daftar sample.";

  const columns: ApprovalColumn<SalesSampleApprovalItem>[] = [
    {
      header: "No. Sample",
      accessor: "code",
      sortable: true,
      render: (item) => <DnaCell.Code value={item.code} />,
    },
    {
      header: "Klien & Brand",
      accessor: "client",
      sortable: true,
      render: (item) => (
        <DnaCell.NaturalPair primary={item.client} secondary={item.brand} />
      ),
    },
    {
      header: "Nama Produk & Revisi",
      accessor: "productName",
      render: (item) => (
        <DnaCell.NaturalPair primary={item.productName} secondary={item.revision} />
      ),
    },
    {
      header: "Formulator & Sales",
      accessor: "formulator",
      render: (item) => (
        <DnaCell.NaturalPair primary={item.formulator} secondary={`PIC: ${item.salesPic}`} />
      ),
    },
    {
      header: "Target Fungsi",
      accessor: "targetFunction",
      render: (item) => (
        <p className="text-[11px] text-slate-600 line-clamp-2 max-w-xs">{item.targetFunction}</p>
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

  const buildDetailData = (item: SalesSampleApprovalItem): ApprovalDetailData => ({
    id: item.id,
    code: item.code,
    title: `Persetujuan Sample Lab: ${item.productName}`,
    category: "SAMPLE R&D DAN FORMULASI",
    status: item.status,
    date: item.date,
    dueDate: item.dueDate,
    creatorName: item.formulator,
    creatorRole: "R&D Formulator",
    requesterName: item.salesPic,
    partnerName: item.client,
    partnerLabel: "Klien Pemesan (Brand Owner)",
    notes: `Target Fungsi: ${item.targetFunction}${item.notes ? ` | Catatan: ${item.notes}` : ""}`,
    lineItems: item.lineItems.map((li) => ({ ...li, unitPrice: 0, total: 0 })),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400">Memuat daftar sample...</div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <DnaErrorState
          title={denied ? "Akses ditolak" : "Gagal memuat data"}
          message={
            denied
              ? "Anda tidak memiliki akses ke daftar penjualan sample."
              : errorMessage
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        Belum ada sample yang menunggu persetujuan.
      </div>
    );
  }

  return (
    <ApprovalPageShell
      title="PERSETUJUAN PENJUALAN SAMPLE (R&D)"
      subtitle="Validasi formulasi sampel kosmetik, klaim uji klinis, kesesuaian regulasi BPOM, dan persetujuan pengiriman prototipe ke klien."
      categoryBadge="PENJUALAN SAMPLE ~"
      breadcrumbItems={[
        { label: "Dashboard", href: "/executive/dashboard" },
        { label: "Persetujuan", href: "/approvals/purchase" },
        { label: "Penjualan Sample" },
      ]}
      items={items}
      columns={columns}
      getDetailData={buildDetailData}
      onApprove={handleApprove}
      onReject={handleReject}
      searchPlaceholder="Cari nomor sample, nama produk, brand, formulator..."
    />
  );
}
