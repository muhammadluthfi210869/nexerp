"use client";

import React, { useMemo } from "react";
import {
  ApprovalPageShell,
  type ApprovalColumn,
  type ApprovalDetailData,
  DnaBadge,
  DnaCell,
} from "@/components/dna";
import type { PurchaseReturnItem } from "../_types/purchase-return.types";

export interface PurchaseReturnApprovalShellProps {
  items: PurchaseReturnItem[];
  getDetailData: (item: PurchaseReturnItem) => ApprovalDetailData;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string) => Promise<any>;
}

export function PurchaseReturnApprovalShell({
  items,
  getDetailData,
  onApprove,
  onReject,
}: PurchaseReturnApprovalShellProps) {
  const columns: ApprovalColumn<PurchaseReturnItem>[] = useMemo(
    () => [
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
    ],
    [],
  );

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
      getDetailData={getDetailData}
      onApprove={onApprove}
      onReject={onReject}
      searchPlaceholder="Cari nomor retur, nama vendor, catatan..."
    />
  );
}
