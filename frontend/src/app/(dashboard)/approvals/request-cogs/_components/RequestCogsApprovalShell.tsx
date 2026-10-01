import React from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
} from "@/components/dna";
import { CogsApprovalItem, EMPTY } from "../_types/request-cogs.types";

interface RequestCogsApprovalShellProps {
  items: CogsApprovalItem[];
  onApprove: (id: string, notes?: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
}

export const requestCogsColumns: ApprovalColumn<CogsApprovalItem>[] = [
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

export function buildDetailData(item: CogsApprovalItem): ApprovalDetailData {
  return {
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
  };
}

export function RequestCogsApprovalShell({
  items,
  onApprove,
  onReject,
}: RequestCogsApprovalShellProps) {
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
      columns={requestCogsColumns}
      getDetailData={buildDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor job order, deskripsi..."
    />
  );
}
